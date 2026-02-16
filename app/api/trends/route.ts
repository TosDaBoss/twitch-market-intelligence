import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateViewerTrends } from "@/lib/mockData";

export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period") === "30d" ? "30d" : "7d";
  const days = period === "7d" ? 7 : 30;
  const since = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

  try {
    const { data, error } = await supabaseAdmin
      .from("daily_game_stats")
      .select("*, games(name)")
      .gte("date", since)
      .order("date", { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ data: generateViewerTrends(period), period, source: "mock" });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const points = data.map((row: any) => ({
      date: row.date,
      gameId: row.game_id,
      gameName: row.games?.name ?? "",
      viewers: row.avg_viewers,
    }));

    return NextResponse.json({ data: points, period, source: "live" });
  } catch {
    return NextResponse.json({ data: generateViewerTrends(period), period, source: "mock" });
  }
}
