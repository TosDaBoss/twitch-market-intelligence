import { NextRequest, NextResponse } from "next/server";
import { getFullIngestionData } from "@/lib/twitch";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// FULL ingestion — runs every 4 hours
// Fetches top games + creators WITH follower counts, updates daily stats

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
    const snapshots = await getFullIngestionData(5, 25);
    const now = new Date().toISOString();
    const today = now.split("T")[0];

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

      // Upsert daily game stats
      const { data: existingGameStat } = await supabaseAdmin
        .from("daily_game_stats")
        .select("*")
        .eq("game_id", game.id)
        .eq("date", today)
        .single();

      if (existingGameStat) {
        await supabaseAdmin
          .from("daily_game_stats")
          .update({
            avg_viewers: Math.round((existingGameStat.avg_viewers + game.totalViewers) / 2),
            peak_viewers: Math.max(existingGameStat.peak_viewers, game.totalViewers),
            avg_channels: Math.round((existingGameStat.avg_channels + game.totalChannels) / 2),
          })
          .eq("id", existingGameStat.id);
      } else {
        await supabaseAdmin.from("daily_game_stats").insert({
          game_id: game.id,
          date: today,
          avg_viewers: game.totalViewers,
          peak_viewers: game.totalViewers,
          avg_channels: game.totalChannels,
        });
      }

      for (const creator of creators) {
        // Upsert creator
        await supabaseAdmin.from("creators").upsert({
          id: creator.id,
          login: creator.login,
          display_name: creator.displayName,
          profile_image_url: creator.profileImageUrl,
        });

        // Insert creator snapshot
        await supabaseAdmin.from("creator_snapshots").insert({
          creator_id: creator.id,
          game_id: game.id,
          viewer_count: creator.viewerCount,
          follower_count: creator.followerCount,
          title: creator.title,
          started_at: creator.startedAt,
          captured_at: now,
        });

        // Upsert daily creator stats
        const { data: existingCreatorStat } = await supabaseAdmin
          .from("daily_creator_stats")
          .select("*")
          .eq("creator_id", creator.id)
          .eq("date", today)
          .single();

        if (existingCreatorStat) {
          await supabaseAdmin
            .from("daily_creator_stats")
            .update({
              avg_viewers: Math.round(
                (existingCreatorStat.avg_viewers + creator.viewerCount) / 2
              ),
              peak_viewers: Math.max(existingCreatorStat.peak_viewers, creator.viewerCount),
              follower_count: creator.followerCount,
              follower_growth: creator.followerCount - existingCreatorStat.follower_count,
            })
            .eq("id", existingCreatorStat.id);
        } else {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
          const { data: yesterdayStat } = await supabaseAdmin
            .from("daily_creator_stats")
            .select("follower_count")
            .eq("creator_id", creator.id)
            .eq("date", yesterday)
            .single();

          await supabaseAdmin.from("daily_creator_stats").insert({
            creator_id: creator.id,
            game_id: game.id,
            date: today,
            avg_viewers: creator.viewerCount,
            peak_viewers: creator.viewerCount,
            follower_count: creator.followerCount,
            follower_growth: yesterdayStat
              ? creator.followerCount - yesterdayStat.follower_count
              : 0,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      type: "full",
      gamesIngested: snapshots.length,
      creatorsIngested: snapshots.reduce((sum, s) => sum + s.creators.length, 0),
      timestamp: now,
    });
  } catch (error) {
    console.error("Full ingestion error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
