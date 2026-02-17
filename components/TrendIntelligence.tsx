"use client";

import { ViewerTrendPoint, CreatorGrowthPoint, AttentionTier } from "@/lib/types";
import { CollapsibleSection } from "./SectionHeader";
import { ViewerMomentumChart } from "./charts/ViewerMomentumChart";
import { CreatorGrowthChart } from "./charts/CreatorGrowthChart";
import { AttentionChart } from "./charts/AttentionChart";
import { EmptyState } from "./EmptyState";

interface Props {
  viewerTrends: ViewerTrendPoint[];
  creatorGrowth: CreatorGrowthPoint[];
  attention: AttentionTier[];
  selectedGameId: string | null;
  selectedCreatorId: string | null;
  selectedGameIds: string[];
  trendPeriod: "7d" | "30d";
  onPeriodChange: (p: "7d" | "30d") => void;
  onToggleGame: (gameId: string) => void;
  onCreatorClick: (creatorId: string) => void;
}

export function TrendIntelligence({
  viewerTrends,
  creatorGrowth,
  attention,
  selectedGameId,
  selectedCreatorId,
  selectedGameIds,
  trendPeriod,
  onPeriodChange,
  onToggleGame,
  onCreatorClick,
}: Props) {
  return (
    <CollapsibleSection
      title="Trend Intelligence"
      subtitle="Where is attention flowing?"
    >
      <div className="space-y-8 mt-2">
        {/* Viewer Momentum */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-lg font-semibold mb-4">Viewer Momentum</h3>
          {viewerTrends.length === 0 ? (
            <EmptyState
              title="No trend data yet"
              message="Trend data requires multiple ingestion cycles. Check back after the full ingestion has run a few times."
            />
          ) : (
            <ViewerMomentumChart
              data={viewerTrends}
              period={trendPeriod}
              onPeriodChange={onPeriodChange}
              selectedGameId={selectedGameId}
              selectedGameIds={selectedGameIds}
              onToggleGame={onToggleGame}
            />
          )}
        </div>

        {/* Creator Growth Velocity */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-lg font-semibold mb-1">Creator Growth Velocity</h3>
          <p className="text-sm text-muted mb-4">
            Weekly follower growth — who is accelerating?
            {selectedGameId && (
              <span className="ml-1 text-accent">(filtered by selected game)</span>
            )}
          </p>
          {creatorGrowth.length === 0 ? (
            <EmptyState
              title="No creator growth data yet"
              message="Creator growth data requires the full ingestion (runs every 4 hours) to collect follower counts over time."
            />
          ) : (
            <CreatorGrowthChart
              data={creatorGrowth}
              selectedGameId={selectedGameId}
              selectedCreatorId={selectedCreatorId}
              onCreatorClick={onCreatorClick}
            />
          )}
        </div>

        {/* Attention Concentration */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-lg font-semibold mb-1">Attention Concentration</h3>
          <p className="text-sm text-muted mb-4">
            How concentrated is viewer attention?
            {selectedGameId && (
              <span className="ml-1 text-accent">(filtered by selected game)</span>
            )}
          </p>
          {attention.length === 0 ? (
            <EmptyState
              title="No attention data yet"
              message="Attention concentration data builds up from creator snapshots. It will populate after a few ingestion cycles."
            />
          ) : (
            <AttentionChart
              data={attention}
              selectedGameId={selectedGameId}
            />
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
}
