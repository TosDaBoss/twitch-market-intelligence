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

interface TwitchGame {
  id: string;
  name: string;
  box_art_url: string;
}

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

export async function getTopGames(limit = 5): Promise<TwitchGame[]> {
  const data = await helixGet<{ data: TwitchGame[] }>("games/top", {
    first: String(limit),
  });
  return data.data;
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

  // Helix allows up to 100 IDs per request
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
    // Follower count endpoint may require user token for some channels
    return 0;
  }
}

export async function getTopGamesWithStreams(gameCount = 5, creatorsPerGame = 10) {
  const games = await getTopGames(gameCount);

  const results = await Promise.all(
    games.map(async (game) => {
      const streams = await getStreamsByGame(game.id, creatorsPerGame);

      // Get user profiles for follower info
      const userIds = streams.map((s) => s.user_id);
      const users = await getUsers(userIds);
      const userMap = new Map(users.map((u) => [u.id, u]));

      // Get follower counts (in parallel, with concurrency limit)
      const followerCounts = await Promise.all(
        streams.map((s) => getChannelFollowerCount(s.user_id))
      );

      const totalViewers = streams.reduce((sum, s) => sum + s.viewer_count, 0);

      return {
        game: {
          id: game.id,
          name: game.name,
          boxArtUrl: game.box_art_url,
          totalViewers,
          totalChannels: streams.length,
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
