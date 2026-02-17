// Twitch Helix API client with app access token authentication

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAppAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`Twitch auth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

async function helixGet<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const token = await getAppAccessToken();
  const url = new URL(`https://api.twitch.tv/helix/${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Client-Id": process.env.TWITCH_CLIENT_ID!,
    },
  });

  if (!res.ok) {
    throw new Error(`Twitch API error: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

// ── Helix Response Types ──

interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  viewer_count: number;
  title: string;
  started_at: string;
  thumbnail_url: string;
}

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
}

interface TwitchFollowerCount {
  total: number;
}

// ── Public API ──

interface TwitchGame {
  id: string;
  name: string;
  box_art_url: string;
  igdb_id: string;
}

/**
 * Get top games with their total viewer counts directly from Twitch.
 * The /games/top endpoint is not available via Helix, so we use /streams
 * with pagination to get a more complete picture. However, the most accurate
 * approach is to get the top games list and then query total viewers per game
 * using the /streams endpoint with a summary.
 *
 * We fetch top games from /games/top (which is sorted by viewer count)
 * then for each game, fetch one page of streams to get the viewer total
 * from the pagination metadata.
 */
export async function getTopGamesWithViewerCounts(gameCount = 5) {
  // /games/top returns games sorted by current viewer count
  const gamesData = await helixGet<{ data: TwitchGame[] }>("games/top", {
    first: String(gameCount),
  });

  // For each game, fetch streams to count total viewers
  // We fetch 100 streams per game to get a better total
  const results = await Promise.all(
    gamesData.data.map(async (game) => {
      // Fetch multiple pages of streams to get more accurate viewer totals
      let totalViewers = 0;
      let streamCount = 0;
      let cursor: string | undefined;

      // Fetch up to 3 pages (300 streams) per game for accuracy
      for (let page = 0; page < 3; page++) {
        const params: Record<string, string> = {
          game_id: game.id,
          first: "100",
          type: "live",
        };
        if (cursor) params.after = cursor;

        const pageData = await helixGet<{
          data: TwitchStream[];
          pagination?: { cursor?: string };
        }>("streams", params);

        for (const stream of pageData.data) {
          totalViewers += stream.viewer_count;
          streamCount += 1;
        }

        cursor = pageData.pagination?.cursor;
        if (!cursor || pageData.data.length < 100) break;
      }

      return {
        id: game.id,
        name: game.name,
        totalViewers,
        streamCount,
      };
    })
  );

  return results.sort((a, b) => b.totalViewers - a.totalViewers);
}

export async function getStreamsByGame(
  gameId: string,
  limit = 10
): Promise<TwitchStream[]> {
  const data = await helixGet<{ data: TwitchStream[] }>("streams", {
    game_id: gameId,
    first: String(limit),
    type: "live",
  });
  return data.data;
}

export async function getUsers(userIds: string[]): Promise<TwitchUser[]> {
  if (userIds.length === 0) return [];

  const chunks: string[][] = [];
  for (let i = 0; i < userIds.length; i += 100) {
    chunks.push(userIds.slice(i, i + 100));
  }

  const results: TwitchUser[] = [];
  for (const chunk of chunks) {
    const token = await getAppAccessToken();
    const url = new URL("https://api.twitch.tv/helix/users");
    chunk.forEach((id) => url.searchParams.append("id", id));

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID!,
      },
    });

    if (!res.ok) {
      throw new Error(`Twitch users API error: ${res.status}`);
    }

    const data = await res.json();
    results.push(...data.data);
  }

  return results;
}

export async function getChannelFollowerCount(broadcasterId: string): Promise<number> {
  try {
    const data = await helixGet<TwitchFollowerCount>("channels/followers", {
      broadcaster_id: broadcasterId,
      first: "1",
    });
    return data.total;
  } catch {
    return 0;
  }
}

/**
 * FAST snapshot: Top 5 games + top 10 creators per game.
 * Used every 5 minutes. Skips follower counts to stay fast.
 */
export async function getSnapshotData(gameCount = 5, creatorsPerGame = 10) {
  const topGames = await getTopGamesWithViewerCounts(gameCount);

  const results = await Promise.all(
    topGames.map(async (game) => {
      const streams = await getStreamsByGame(game.id, creatorsPerGame);

      const userIds = streams.map((s) => s.user_id);
      const users = await getUsers(userIds);
      const userMap = new Map(users.map((u) => [u.id, u]));

      return {
        game: {
          id: game.id,
          name: game.name,
          boxArtUrl: "",
          totalViewers: game.totalViewers,
          totalChannels: game.streamCount,
        },
        creators: streams.map((stream) => {
          const user = userMap.get(stream.user_id);
          return {
            id: stream.user_id,
            login: stream.user_login,
            displayName: stream.user_name,
            profileImageUrl: user?.profile_image_url ?? "",
            gameId: game.id,
            gameName: game.name,
            viewerCount: stream.viewer_count,
            followerCount: 0, // Skipped in fast mode
            title: stream.title,
            startedAt: stream.started_at,
          };
        }),
      };
    })
  );

  return results;
}

/**
 * FULL ingestion: Same as snapshot but includes follower counts.
 * Used every 4 hours. More expensive due to per-creator API calls.
 */
export async function getFullIngestionData(gameCount = 5, creatorsPerGame = 10) {
  const topGames = await getTopGamesWithViewerCounts(gameCount);

  const results = await Promise.all(
    topGames.map(async (game) => {
      const streams = await getStreamsByGame(game.id, creatorsPerGame);

      const userIds = streams.map((s) => s.user_id);
      const users = await getUsers(userIds);
      const userMap = new Map(users.map((u) => [u.id, u]));

      const followerCounts = await Promise.all(
        streams.map((s) => getChannelFollowerCount(s.user_id))
      );

      return {
        game: {
          id: game.id,
          name: game.name,
          boxArtUrl: "",
          totalViewers: game.totalViewers,
          totalChannels: game.streamCount,
        },
        creators: streams.map((stream, i) => {
          const user = userMap.get(stream.user_id);
          return {
            id: stream.user_id,
            login: stream.user_login,
            displayName: stream.user_name,
            profileImageUrl: user?.profile_image_url ?? "",
            gameId: game.id,
            gameName: game.name,
            viewerCount: stream.viewer_count,
            followerCount: followerCounts[i],
            title: stream.title,
            startedAt: stream.started_at,
          };
        }),
      };
    })
  );

  return results;
}
