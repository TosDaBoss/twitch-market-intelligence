"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardHeader } from "./DashboardHeader";
import { SnapshotOverview } from "./SnapshotOverview";
import { TrendIntelligence } from "./TrendIntelligence";
import { TopCreatorsTable } from "./TopCreatorsTable";

export function Dashboard() {
  const {
    snapshots,
    viewerTrends,
    creatorGrowth,
    attention,
    loading,
    lastUpdated,
    filters,
    selectGame,
    selectCreator,
    setPeriod,
    toggleGameSelection,
    refresh,
  } = useDashboardData();

  const selectedGameName =
    filters.selectedGameId
      ? snapshots.find((s) => s.game.id === filters.selectedGameId)?.game.name ?? null
      : null;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DashboardHeader selectedGameName={null} lastUpdated={null} onClearFilters={() => {}} onRefresh={refresh} />
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-muted text-sm">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <DashboardHeader
        selectedGameName={selectedGameName}
        lastUpdated={lastUpdated}
        onClearFilters={() => selectGame(null)}
        onRefresh={refresh}
      />

      <SnapshotOverview
        snapshots={snapshots}
        selectedGameId={filters.selectedGameId}
        selectedCreatorId={filters.selectedCreatorId}
        onSelectGame={selectGame}
        onSelectCreator={selectCreator}
      />

      <TopCreatorsTable />

      <TrendIntelligence
        viewerTrends={viewerTrends}
        creatorGrowth={creatorGrowth}
        attention={attention}
        selectedGameId={filters.selectedGameId}
        selectedCreatorId={filters.selectedCreatorId}
        selectedGameIds={filters.selectedGameIds}
        trendPeriod={filters.trendPeriod}
        onPeriodChange={setPeriod}
        onToggleGame={toggleGameSelection}
        onCreatorClick={selectCreator}
      />
    </div>
  );
}
