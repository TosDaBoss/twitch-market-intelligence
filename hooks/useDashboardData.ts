"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GameSnapshot,
  ViewerTrendPoint,
  CreatorGrowthPoint,
  AttentionTier,
  DashboardFilters,
} from "@/lib/types";

export function useDashboardData() {
  const [snapshots, setSnapshots] = useState<GameSnapshot[]>([]);
  const [viewerTrends, setViewerTrends] = useState<ViewerTrendPoint[]>([]);
  const [creatorGrowth, setCreatorGrowth] = useState<CreatorGrowthPoint[]>([]);
  const [attention, setAttention] = useState<AttentionTier[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<DashboardFilters>({
    selectedGameId: null,
    selectedCreatorId: null,
    trendPeriod: "7d",
    selectedGameIds: [],
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const gameParam = filters.selectedGameId ? `&gameId=${filters.selectedGameId}` : "";

      const [snapRes, trendRes, creatorRes, attnRes] = await Promise.all([
        fetch("/api/snapshots"),
        fetch(`/api/trends?period=${filters.trendPeriod}`),
        fetch(`/api/creator-trends?${gameParam}`),
        fetch(`/api/attention?${gameParam}`),
      ]);

      const [snapData, trendData, creatorData, attnData] = await Promise.all([
        snapRes.json(),
        trendRes.json(),
        creatorRes.json(),
        attnRes.json(),
      ]);

      setSnapshots(snapData.snapshots);
      setViewerTrends(trendData.data);
      setCreatorGrowth(creatorData.data);
      setAttention(attnData.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [filters.trendPeriod, filters.selectedGameId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const selectGame = (gameId: string | null) => {
    setFilters((prev) => ({
      ...prev,
      selectedGameId: prev.selectedGameId === gameId ? null : gameId,
      selectedCreatorId: null,
    }));
  };

  const selectCreator = (creatorId: string | null) => {
    setFilters((prev) => ({
      ...prev,
      selectedCreatorId: prev.selectedCreatorId === creatorId ? null : creatorId,
    }));
  };

  const setPeriod = (period: "7d" | "30d") => {
    setFilters((prev) => ({ ...prev, trendPeriod: period }));
  };

  const toggleGameSelection = (gameId: string) => {
    setFilters((prev) => {
      const ids = prev.selectedGameIds.includes(gameId)
        ? prev.selectedGameIds.filter((id) => id !== gameId)
        : [...prev.selectedGameIds, gameId];
      return { ...prev, selectedGameIds: ids };
    });
  };

  return {
    snapshots,
    viewerTrends,
    creatorGrowth,
    attention,
    loading,
    filters,
    selectGame,
    selectCreator,
    setPeriod,
    toggleGameSelection,
    refresh: fetchAll,
  };
}
