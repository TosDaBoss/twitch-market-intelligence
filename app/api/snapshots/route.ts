import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateSnapshots } from "@/lib/mockData";
import { GameSnapshot } from "@/lib/types";

export async function GET() {
  try {
    const { data: games } = await supabaseAdmin
      .from("games")
      .select("*")
      .limit(5);

    if (!games || games.length === 0) {
      return NextResponse.json({
        snapshots: generateSnapshots(),
        updatedAt: new Date().toISOString(),
        source: "mock",
      });
    }

    const snapshots: GameSnapshot[] = [];

    for (const game of games) {
      const { data: latestSnap } = await supabaseAdmin
        .from("game_snapshots")
        .select("*")
        .eq("game_id", game.id)
        .order("captured_at", { ascending: false })
        .limit(1)
        .single();

      const { data: creatorSnaps } = await supabaseAdmin
        .from("creator_snapshots")
        .select("*, creators(*)")
        .eq("game_id", game.id)
        .order("captured_at", { ascending: false })
        .limit(10);

      snapshots.push({
        game: {
          id: game.id,
          name: game.name,
          boxArtUrl: game.box_art_url ?? "",
          totalViewers: latestSnap?.total_viewers ?? 0,
          totalChannels: latestSnap?.total_channels ?? 0,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        creators: (creatorSnaps ?? []).map((cs: any) => ({
          id: cs.creator_id,
          login: cs.creators?.login ?? "",
          displayName: cs.creators?.display_name ?? "",
          profileImageUrl: cs.creators?.profile_image_url ?? "",
          gameId: game.id,
          gameName: game.name,
          viewerCount: cs.viewer_count,
          followerCount: cs.follower_count,
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
      snapshots: generateSnapshots(),
      updatedAt: new Date().toISOString(),
      source: "mock",
    });
  }
}
