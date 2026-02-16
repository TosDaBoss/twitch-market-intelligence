"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CreatorGrowthPoint } from "@/lib/types";
import { generateCreatorInsight } from "@/lib/insights";
import { InsightPanel } from "@/components/InsightPanel";

const COLORS = ["#9147ff", "#00c8af", "#f59e0b", "#ef4444", "#3b82f6"];

interface Props {
  data: CreatorGrowthPoint[];
  selectedGameId: string | null;
  selectedCreatorId: string | null;
  onCreatorClick: (creatorId: string) => void;
}

export function CreatorGrowthChart({
  data,
  selectedGameId,
  selectedCreatorId,
  onCreatorClick,
}: Props) {
  const filtered = useMemo(() => {
    let d = data;
    if (selectedGameId) d = d.filter((p) => p.gameId === selectedGameId);
    // Get latest week only
    const dates = [...new Set(d.map((p) => p.date))].sort();
    const latestDate = dates[dates.length - 1];
    return d
      .filter((p) => p.date === latestDate)
      .sort((a, b) => b.followerGrowth - a.followerGrowth)
      .slice(0, 10);
  }, [data, selectedGameId]);

  const selectedGameName = selectedGameId
    ? data.find((d) => d.gameId === selectedGameId)?.gameName
    : undefined;
  const insight = generateCreatorInsight(data, selectedGameName);

  return (
    <div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filtered} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#2f2f35" horizontal={false} />
            <XAxis
              type="number"
              stroke="#adadb8"
              fontSize={12}
              tickFormatter={(v) => `${v > 0 ? "+" : ""}${(v / 1000).toFixed(1)}k`}
            />
            <YAxis
              type="category"
              dataKey="creatorName"
              stroke="#adadb8"
              fontSize={12}
              width={100}
              tick={{ fill: "#efeff1" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #2f2f35",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [
                `${value > 0 ? "+" : ""}${Number(value).toLocaleString()}`,
                "Follower Growth",
              ]}
            />
            <Bar
              dataKey="followerGrowth"
              radius={[0, 4, 4, 0]}
              animationDuration={600}
              cursor="pointer"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(entry: any) => {
                if (entry?.creatorId) onCreatorClick(entry.creatorId);
              }}
            >
              {filtered.map((entry, i) => (
                <Cell
                  key={entry.creatorId}
                  fill={
                    selectedCreatorId === entry.creatorId
                      ? "#ffffff"
                      : entry.followerGrowth >= 0
                      ? COLORS[i % COLORS.length]
                      : "#ef4444"
                  }
                  opacity={
                    selectedCreatorId && selectedCreatorId !== entry.creatorId ? 0.3 : 1
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <InsightPanel insight={insight} />
    </div>
  );
}
