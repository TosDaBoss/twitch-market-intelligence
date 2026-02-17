import { NextRequest, NextResponse } from "next/server";
import { getSnapshotData } from "@/lib/twitch";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// FAST snapshot — runs every 5 minutes
// Fetches top 5 games + top 10 creators (no follower counts)
// Updates game_snapshots and creator_snapshots only

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshots = await getSnapshotData(5, 10);
    const now = new Date().toISOString();

    for (const snapshot of snapshots) {
      const { game, creators } = snapshot;

      // Upsert game
      await supabaseAdmin.from("games").upsert({
        id: game.id,
        name: game.name,
        box_art_url: game.boxArtUrl,
      });

      // Insert game snapshot
      await supabaseAdmin.from("game_snapshots").insert({
        game_id: game.id,
        total_viewers: game.totalViewers,
        total_channels: game.totalChannels,
        captured_at: now,
      });

      for (const creator of creators) {
        // Upsert creator
        await supabaseAdmin.from("creators").upsert({
          id: creator.id,
          login: creator.login,
          display_name: creator.displayName,
          profile_image_url: creator.profileImageUrl,
        });

        // Insert creator snapshot (follower_count will be 0, updated by full ingestion)
        await supabaseAdmin.from("creator_snapshots").insert({
          creator_id: creator.id,
          game_id: game.id,
          viewer_count: creator.viewerCount,
          follower_count: creator.followerCount,
          title: creator.title,
          started_at: creator.startedAt,
          captured_at: now,
        });
      }
    }

    return NextResponse.json({
      success: true,
      type: "snapshot",
      gamesIngested: snapshots.length,
      creatorsIngested: snapshots.reduce((sum, s) => sum + s.creators.length, 0),
      timestamp: now,
    });
  } catch (error) {
    console.error("Snapshot ingestion error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
