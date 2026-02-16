import { NextRequest, NextResponse } from "next/server";
import { getTopGamesWithStreams } from "@/lib/twitch";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Protect the ingestion endpoint with a secret
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Allow if no secret is configured (development)
  if (!cronSecret) return true;

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshots = await getTopGamesWithStreams(5, 10);
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
      }

      // Upsert daily game stats
      const today = now.split("T")[0];
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

      // Upsert daily creator stats
      for (const creator of creators) {
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
          // Look up yesterday's follower count for growth calc
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
      gamesIngested: snapshots.length,
      creatorsIngested: snapshots.reduce((sum, s) => sum + s.creators.length, 0),
      timestamp: now,
    });
  } catch (error) {
    console.error("Ingestion error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
