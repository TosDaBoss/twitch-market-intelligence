import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit") ?? "100"),
    100
  );

  try {
    // Get the latest creator snapshot per creator (most recent follower + viewer data)
    // We use daily_creator_stats for follower data since it's populated by full ingestion
    const { data: creatorStats, error } = await supabaseAdmin
      .from("daily_creator_stats")
      .select("*, creators(login, display_name, profile_image_url), games:game_id(name)")
      .order("follower_count", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Top creators API error:", error);
      return NextResponse.json({ data: [], source: "error", error: error.message });
    }

    if (!creatorStats || creatorStats.length === 0) {
      // Fallback: try creator_snapshots if daily stats haven't been populated yet
      const { data: snapshots, error: snapError } = await supabaseAdmin
        .from("creator_snapshots")
        .select("*, creators(login, display_name, profile_image_url), games:game_id(name)")
        .order("follower_count", { ascending: false })
        .limit(500);

      if (snapError || !snapshots || snapshots.length === 0) {
        return NextResponse.json({ data: [], source: "empty" });
      }

      // Deduplicate by creator_id, keeping highest follower count
      const seen = new Map<string, typeof snapshots[0]>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      snapshots.forEach((s: any) => {
        const existing = seen.get(s.creator_id);
        if (!existing || s.follower_count > existing.follower_count) {
          seen.set(s.creator_id, s);
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const creators = Array.from(seen.values())
        .sort((a: any, b: any) => b.follower_count - a.follower_count)
        .slice(0, limit)
        .map((row: any, i: number) => ({
          rank: i + 1,
          creatorId: row.creator_id,
          login: row.creators?.login ?? "",
          displayName: row.creators?.display_name ?? "",
          profileImageUrl: row.creators?.profile_image_url ?? "",
          gameName: row.games?.name ?? "",
          viewerCount: row.viewer_count,
          followerCount: row.follower_count,
          followerGrowth: 0,
        }));

      return NextResponse.json({ data: creators, source: "live" });
    }

    // Deduplicate by creator_id, keeping the most recent entry
    const seen = new Map<string, typeof creatorStats[0]>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    creatorStats.forEach((s: any) => {
      const existing = seen.get(s.creator_id);
      if (!existing || s.date > existing.date) {
        seen.set(s.creator_id, s);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const creators = Array.from(seen.values())
      .sort((a: any, b: any) => b.follower_count - a.follower_count)
      .slice(0, limit)
      .map((row: any, i: number) => ({
        rank: i + 1,
        creatorId: row.creator_id,
        login: row.creators?.login ?? "",
        displayName: row.creators?.display_name ?? "",
        profileImageUrl: row.creators?.profile_image_url ?? "",
        gameName: row.games?.name ?? "",
        viewerCount: row.avg_viewers,
        followerCount: row.follower_count,
        followerGrowth: row.follower_growth,
      }));

    return NextResponse.json({ data: creators, source: "live" });
  } catch (error) {
    console.error("Top creators API error:", error);
    return NextResponse.json({ data: [], source: "error" });
  }
}
