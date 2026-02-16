"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AttentionTier } from "@/lib/types";
import { generateAttentionInsight } from "@/lib/insights";
import { InsightPanel } from "@/components/InsightPanel";

interface Props {
  data: AttentionTier[];
  selectedGameId: string | null;
}

export function AttentionChart({ data, selectedGameId }: Props) {
  const filtered = useMemo(() => {
    if (selectedGameId) return data.filter((d) => d.gameId === selectedGameId);
    // If no game selected, average across all games per date
    const byDate = new Map<string, { top1: number[]; top3: number[]; top10: number[]; tail: number[] }>();
    data.forEach((d) => {
      if (!byDate.has(d.date)) byDate.set(d.date, { top1: [], top3: [], top10: [], tail: [] });
      const entry = byDate.get(d.date)!;
      entry.top1.push(d.top1Pct);
      entry.top3.push(d.top3Pct);
      entry.top10.push(d.top10Pct);
      entry.tail.push(d.longTailPct);
    });
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        gameId: "",
        gameName: "All Games",
        top1Pct: Math.round(v.top1.reduce((a, b) => a + b, 0) / v.top1.length),
        top3Pct: Math.round(v.top3.reduce((a, b) => a + b, 0) / v.top3.length),
        top10Pct: Math.round(v.top10.reduce((a, b) => a + b, 0) / v.top10.length),
        longTailPct: Math.round(v.tail.reduce((a, b) => a + b, 0) / v.tail.length),
      }));
  }, [data, selectedGameId]);

  const selectedGameName = selectedGameId
    ? data.find((d) => d.gameId === selectedGameId)?.gameName
    : undefined;
  const insight = generateAttentionInsight(filtered, selectedGameName);

  return (
    <div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filtered}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2f2f35" />
            <XAxis
              dataKey="date"
              stroke="#adadb8"
              fontSize={12}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis
              stroke="#adadb8"
              fontSize={12}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #2f2f35",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${value}%`]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="top1Pct"
              stackId="1"
              stroke="#9147ff"
              fill="#9147ff"
              fillOpacity={0.8}
              name="Top 1"
              animationDuration={600}
            />
            <Area
              type="monotone"
              dataKey="top3Pct"
              stackId="1"
              stroke="#00c8af"
              fill="#00c8af"
              fillOpacity={0.7}
              name="Top 3"
              animationDuration={600}
            />
            <Area
              type="monotone"
              dataKey="top10Pct"
              stackId="1"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.6}
              name="Top 10"
              animationDuration={600}
            />
            <Area
              type="monotone"
              dataKey="longTailPct"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.4}
              name="Long Tail"
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <InsightPanel insight={insight} />
    </div>
  );
}
