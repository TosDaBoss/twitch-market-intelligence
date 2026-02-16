import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateAttentionData } from "@/lib/mockData";

export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get("gameId") ?? undefined;

  try {
    const since = new Date(Date.now() - 7 * 86400000).toISOString();

    let query = supabaseAdmin
      .from("creator_snapshots")
      .select("game_id, viewer_count, captured_at, games:game_id(name)")
      .gte("captured_at", since)
      .order("captured_at", { ascending: true });

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    const { data, error } = await query.limit(1000);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ data: generateAttentionData(gameId), gameId, source: "mock" });
    }

    // Group by date + game, compute concentration tiers
    const grouped = new Map<string, { gameId: string; gameName: string; viewers: number[] }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.forEach((row: any) => {
      const date = row.captured_at.split("T")[0];
      const key = `${date}|${row.game_id}`;
      if (!grouped.has(key)) {
        grouped.set(key, { gameId: row.game_id, gameName: row.games?.name ?? "", viewers: [] });
      }
      grouped.get(key)!.viewers.push(row.viewer_count);
    });

    const tiers = Array.from(grouped.entries()).map(([key, val]) => {
      const date = key.split("|")[0];
      const sorted = val.viewers.sort((a, b) => b - a);
      const total = sorted.reduce((s, v) => s + v, 0);

      if (total === 0) {
        return { date, gameId: val.gameId, gameName: val.gameName, top1Pct: 0, top3Pct: 0, top10Pct: 0, longTailPct: 100 };
      }

      const top1 = Math.round(((sorted[0] ?? 0) / total) * 100);
      const top3 = Math.round((sorted.slice(1, 3).reduce((s, v) => s + v, 0) / total) * 100);
      const top10 = Math.round((sorted.slice(3, 10).reduce((s, v) => s + v, 0) / total) * 100);
      const longTail = 100 - top1 - top3 - top10;

      return { date, gameId: val.gameId, gameName: val.gameName, top1Pct: top1, top3Pct: top3, top10Pct: top10, longTailPct: longTail };
    });

    return NextResponse.json({ data: tiers, gameId, source: "live" });
  } catch {
    return NextResponse.json({ data: generateAttentionData(gameId), gameId, source: "mock" });
  }
}
