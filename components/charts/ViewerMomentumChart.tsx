"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ViewerTrendPoint } from "@/lib/types";
import { generateViewerInsight } from "@/lib/insights";
import { InsightPanel } from "@/components/InsightPanel";

const COLORS = ["#9147ff", "#00c8af", "#f59e0b", "#ef4444", "#3b82f6"];

interface Props {
  data: ViewerTrendPoint[];
  period: "7d" | "30d";
  onPeriodChange: (p: "7d" | "30d") => void;
  selectedGameId: string | null;
  selectedGameIds: string[];
  onToggleGame: (gameId: string) => void;
}

export function ViewerMomentumChart({
  data,
  period,
  onPeriodChange,
  selectedGameId,
  selectedGameIds,
  onToggleGame,
}: Props) {
  const gameNames = useMemo(() => {
    const names = new Map<string, string>();
    data.forEach((d) => names.set(d.gameId, d.gameName));
    return names;
  }, [data]);

  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, number>>();
    data.forEach((d) => {
      if (!byDate.has(d.date)) byDate.set(d.date, {});
      byDate.get(d.date)![d.gameName] = d.viewers;
    });
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({ date, ...values }));
  }, [data]);

  const visibleGames = useMemo(() => {
    if (selectedGameId) return [selectedGameId];
    if (selectedGameIds.length > 0) return selectedGameIds;
    return Array.from(gameNames.keys());
  }, [selectedGameId, selectedGameIds, gameNames]);

  const selectedGameName = selectedGameId ? gameNames.get(selectedGameId) : undefined;
  const insight = generateViewerInsight(data, selectedGameName);

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-1">
          {(["7d", "30d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:bg-surface-hover"
              }`}
            >
              {p === "7d" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {Array.from(gameNames.entries()).map(([id, name], i) => (
            <button
              key={id}
              onClick={() => onToggleGame(id)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors border ${
                visibleGames.includes(id)
                  ? "border-transparent text-white"
                  : "border-border text-muted bg-surface hover:bg-surface-hover"
              }`}
              style={
                visibleGames.includes(id) ? { backgroundColor: COLORS[i % COLORS.length] } : {}
              }
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
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
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #2f2f35",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#adadb8" }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [Number(value).toLocaleString(), "Viewers"]}
            />
            <Legend />
            {Array.from(gameNames.entries()).map(([id, name], i) => (
              <Line
                key={id}
                type="monotone"
                dataKey={name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={visibleGames.includes(id) ? 2.5 : 0}
                dot={false}
                animationDuration={600}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <InsightPanel insight={insight} />
    </div>
  );
}
