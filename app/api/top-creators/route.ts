import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit") ?? "100"),
    100
  );

  try {
    // Try recent snapshots first, fall back to latest available
    let recentSnaps;
    let snapError;

    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const recent = await supabaseAdmin
      .from("creator_snapshots")
      .select("*, creators(login, display_name, profile_image_url), games:game_id(name)")
      .gte("captured_at", thirtyMinAgo)
      .order("viewer_count", { ascending: false })
      .limit(500);

    if (recent.data && recent.data.length > 0) {
      recentSnaps = recent.data;
      snapError = recent.error;
    } else {
      // Fallback: get the most recent snapshots regardless of age
      const fallback = await supabaseAdmin
        .from("creator_snapshots")
        .select("*, creators(login, display_name, profile_image_url), games:game_id(name)")
        .order("viewer_count", { ascending: false })
        .limit(500);
      recentSnaps = fallback.data;
      snapError = fallback.error;
    }

    if (snapError) {
      console.error("Top creators API error:", snapError);
      return NextResponse.json({ data: [], source: "error", error: snapError.message });
    }

    if (!recentSnaps || recentSnaps.length === 0) {
      return NextResponse.json({ data: [], source: "empty" });
    }

    // Deduplicate by creator_id, keeping highest viewer count entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const creatorMap = new Map<string, any>();
    for (const snap of recentSnaps) {
      const existing = creatorMap.get(snap.creator_id);
      if (!existing || snap.viewer_count > existing.viewer_count) {
        creatorMap.set(snap.creator_id, snap);
      }
    }

    // Enrich with follower data from multiple sources
    const creatorIds = Array.from(creatorMap.keys());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const followerMap = new Map<string, { followerCount: number; followerGrowth: number }>();

    if (creatorIds.length > 0) {
      // Source 1: daily_creator_stats (best — has growth data)
      const { data: dailyStats } = await supabaseAdmin
        .from("daily_creator_stats")
        .select("creator_id, follower_count, follower_growth, date")
        .in("creator_id", creatorIds)
        .order("date", { ascending: false })
        .limit(500);

      if (dailyStats) {
        for (const stat of dailyStats) {
          if (!followerMap.has(stat.creator_id) && stat.follower_count > 0) {
            followerMap.set(stat.creator_id, {
              followerCount: stat.follower_count,
              followerGrowth: stat.follower_growth ?? 0,
            });
          }
        }
      }

      // Source 2: creator_snapshots with non-zero follower_count (from full ingestion)
      const missingIds = creatorIds.filter((id) => {
        const snap = creatorMap.get(id);
        const hasFromSnap = snap?.follower_count > 0;
        const hasFromDaily = followerMap.has(id);
        return !hasFromSnap && !hasFromDaily;
      });

      if (missingIds.length > 0) {
        const { data: followerSnaps } = await supabaseAdmin
          .from("creator_snapshots")
          .select("creator_id, follower_count")
          .in("creator_id", missingIds)
          .gt("follower_count", 0)
          .order("follower_count", { ascending: false })
          .limit(200);

        if (followerSnaps) {
          for (const snap of followerSnaps) {
            if (!followerMap.has(snap.creator_id)) {
              followerMap.set(snap.creator_id, {
                followerCount: snap.follower_count,
                followerGrowth: 0,
              });
            }
          }
        }
      }
    }

    // Sort by viewer count (live ranking) and take top N
    const creators = Array.from(creatorMap.values())
      .sort((a, b) => b.viewer_count - a.viewer_count)
      .slice(0, limit)
      .map((row, i) => {
        const followerData = followerMap.get(row.creator_id);
        return {
          rank: i + 1,
          creatorId: row.creator_id,
          login: row.creators?.login ?? "",
          displayName: row.creators?.display_name ?? "",
          profileImageUrl: row.creators?.profile_image_url ?? "",
          gameName: row.games?.name ?? "",
          viewerCount: row.viewer_count,
          followerCount: row.follower_count || followerData?.followerCount || 0,
          followerGrowth: followerData?.followerGrowth ?? 0,
        };
      });

    return NextResponse.json({ data: creators, source: "live" });
  } catch (error) {
    console.error("Top creators API error:", error);
    return NextResponse.json({ data: [], source: "error" });
  }
}
