import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateCreatorGrowth } from "@/lib/mockData";

export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get("gameId") ?? undefined;

  try {
    let query = supabaseAdmin
      .from("daily_creator_stats")
      .select("*, creators(display_name), games:game_id(name)")
      .order("date", { ascending: true });

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    const { data, error } = await query.limit(200);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ data: generateCreatorGrowth(gameId), gameId, source: "mock" });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const points = data.map((row: any) => ({
      date: row.date,
      creatorId: row.creator_id,
      creatorName: row.creators?.display_name ?? "",
      gameId: row.game_id,
      gameName: row.games?.name ?? "",
      followers: row.follower_count,
      followerGrowth: row.follower_growth,
    }));

    return NextResponse.json({ data: points, gameId, source: "live" });
  } catch {
    return NextResponse.json({ data: generateCreatorGrowth(gameId), gameId, source: "mock" });
  }
}
