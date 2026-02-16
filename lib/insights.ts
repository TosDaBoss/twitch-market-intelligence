import { ViewerTrendPoint, CreatorGrowthPoint, AttentionTier } from "./types";

export function generateViewerInsight(data: ViewerTrendPoint[], gameName?: string): string {
  if (data.length < 2) return "";

  if (gameName) {
    const gameData = data.filter((d) => d.gameName === gameName);
    if (gameData.length < 2) return "";
    const first = gameData[0].viewers;
    const last = gameData[gameData.length - 1].viewers;
    const pctChange = ((last - first) / first * 100).toFixed(1);
    const direction = last > first ? "grown" : "declined";
    return `${gameName} has ${direction} ${Math.abs(Number(pctChange))}% in viewer share over this period.`;
  }

  const byGame = new Map<string, ViewerTrendPoint[]>();
  data.forEach((d) => {
    if (!byGame.has(d.gameName)) byGame.set(d.gameName, []);
    byGame.get(d.gameName)!.push(d);
  });

  let bestGame = "";
  let bestGrowth = -Infinity;
  byGame.forEach((pts, name) => {
    const growth = (pts[pts.length - 1].viewers - pts[0].viewers) / pts[0].viewers;
    if (growth > bestGrowth) {
      bestGrowth = growth;
      bestGame = name;
    }
  });

  return `${bestGame} shows the strongest momentum with ${(bestGrowth * 100).toFixed(1)}% viewer growth over this period.`;
}

export function generateCreatorInsight(data: CreatorGrowthPoint[], gameName?: string): string {
  if (data.length === 0) return "";

  const filtered = gameName ? data.filter((d) => d.gameName === gameName) : data;
  const latest = new Map<string, CreatorGrowthPoint>();
  filtered.forEach((d) => {
    const existing = latest.get(d.creatorName);
    if (!existing || d.date > existing.date) latest.set(d.creatorName, d);
  });

  let topCreator = "";
  let topGrowth = -Infinity;
  latest.forEach((d, name) => {
    if (d.followerGrowth > topGrowth) {
      topGrowth = d.followerGrowth;
      topCreator = name;
    }
  });

  if (!topCreator) return "";
  return `${topCreator} is the fastest-growing creator this week with +${topGrowth.toLocaleString()} new followers${gameName ? ` in ${gameName}` : ""}.`;
}

export function generateAttentionInsight(data: AttentionTier[], gameName?: string): string {
  if (data.length === 0) return "";

  const filtered = gameName ? data.filter((d) => d.gameName === gameName) : data;
  if (filtered.length < 2) return "";

  const latest = filtered[filtered.length - 1];
  const earliest = filtered[0];

  const concNow = latest.top1Pct + latest.top3Pct;
  const concBefore = earliest.top1Pct + earliest.top3Pct;

  const name = gameName ?? latest.gameName;
  if (concNow > concBefore + 3) {
    return `${name}'s ecosystem is concentrating — the top 3 streamers now capture ${concNow}% of viewers, up from ${concBefore}%.`;
  }
  if (concNow < concBefore - 3) {
    return `${name}'s ecosystem is diversifying — attention is spreading beyond top creators, with the long tail now at ${latest.longTailPct}%.`;
  }
  return `${name} has a balanced ecosystem with ${latest.longTailPct}% of viewers spread across smaller creators.`;
}
