import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GameSnapshot } from "@/lib/types";

export async function GET() {
  try {
    // Get latest game snapshots to find the top 5 games by viewers
    const { data: latestSnapshots, error: snapError } = await supabaseAdmin
      .from("game_snapshots")
      .select("*, games(*)")
      .order("captured_at", { ascending: false })
      .limit(50);

    if (snapError) {
      console.error("Supabase snapshots error:", snapError);
      return NextResponse.json({
        snapshots: [],
        updatedAt: new Date().toISOString(),
        source: "error",
        error: snapError.message,
      });
    }

    if (!latestSnapshots || latestSnapshots.length === 0) {
      return NextResponse.json({
        snapshots: [],
        updatedAt: new Date().toISOString(),
        source: "empty",
      });
    }

    // Deduplicate game snapshots — keep the most recent per game
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gameSnapshotMap = new Map<string, any>();
    for (const snap of latestSnapshots) {
      if (!gameSnapshotMap.has(snap.game_id)) {
        gameSnapshotMap.set(snap.game_id, snap);
      }
    }

    // Sort by total_viewers and take top 5
    const topGames = Array.from(gameSnapshotMap.values())
      .sort((a, b) => b.total_viewers - a.total_viewers)
      .slice(0, 5);

    const snapshots: GameSnapshot[] = [];

    for (const gameSnap of topGames) {
      const game = gameSnap.games;
      const gameId = gameSnap.game_id;

      // Fetch more creator snapshots to allow deduplication
      // Order by viewer_count desc so we get the top creators first
      const { data: creatorSnaps } = await supabaseAdmin
        .from("creator_snapshots")
        .select("*, creators(*)")
        .eq("game_id", gameId)
        .order("viewer_count", { ascending: false })
        .limit(100);

      // Deduplicate by creator_id, keeping the entry with highest viewer_count
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const creatorMap = new Map<string, any>();
      for (const cs of creatorSnaps ?? []) {
        const existing = creatorMap.get(cs.creator_id);
        if (!existing) {
          creatorMap.set(cs.creator_id, cs);
        } else {
          // Prefer entry with follower data, then highest viewer count
          if (existing.follower_count === 0 && cs.follower_count > 0) {
            creatorMap.set(cs.creator_id, cs);
          }
        }
      }

      // Sort by viewer_count desc and take top 10
      const uniqueCreators = Array.from(creatorMap.values())
        .sort((a, b) => b.viewer_count - a.viewer_count)
        .slice(0, 10);

      // For creators missing follower counts, try to fill from daily_creator_stats
      const missingFollowerIds = uniqueCreators
        .filter((c) => !c.follower_count || c.follower_count === 0)
        .map((c) => c.creator_id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const followerLookup = new Map<string, number>();
      if (missingFollowerIds.length > 0) {
        const { data: dailyStats } = await supabaseAdmin
          .from("daily_creator_stats")
          .select("creator_id, follower_count")
          .in("creator_id", missingFollowerIds)
          .order("follower_count", { ascending: false })
          .limit(100);

        if (dailyStats) {
          for (const stat of dailyStats) {
            if (!followerLookup.has(stat.creator_id) && stat.follower_count > 0) {
              followerLookup.set(stat.creator_id, stat.follower_count);
            }
          }
        }
      }

      snapshots.push({
        game: {
          id: gameId,
          name: game?.name ?? "",
          boxArtUrl: game?.box_art_url ?? "",
          totalViewers: gameSnap.total_viewers ?? 0,
          totalChannels: gameSnap.total_channels ?? 0,
        },
        creators: uniqueCreators.map((cs) => ({
          id: cs.creator_id,
          login: cs.creators?.login ?? "",
          displayName: cs.creators?.display_name ?? "",
          profileImageUrl: cs.creators?.profile_image_url ?? "",
          gameId: gameId,
          gameName: game?.name ?? "",
          viewerCount: cs.viewer_count,
          followerCount: cs.follower_count || followerLookup.get(cs.creator_id) || 0,
          title: cs.title ?? "",
          startedAt: cs.started_at ?? "",
        })),
      });
    }

    snapshots.sort((a, b) => b.game.totalViewers - a.game.totalViewers);

    return NextResponse.json({
      snapshots,
      updatedAt: new Date().toISOString(),
      source: "live",
    });
  } catch (error) {
    console.error("Snapshots API error:", error);
    return NextResponse.json({
      snapshots: [],
      updatedAt: new Date().toISOString(),
      source: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
