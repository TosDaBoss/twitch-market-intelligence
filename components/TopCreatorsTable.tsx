"use client";

import { useState, useEffect } from "react";
import { CollapsibleSection } from "./SectionHeader";
import { EmptyState } from "./EmptyState";

interface TopCreator {
  rank: number;
  creatorId: string;
  login: string;
  displayName: string;
  profileImageUrl: string;
  gameName: string;
  viewerCount: number;
  followerCount: number;
  followerGrowth: number;
}

export function TopCreatorsTable() {
  const [creators, setCreators] = useState<TopCreator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCreators() {
      try {
        const res = await fetch("/api/top-creators?limit=100");
        const data = await res.json();
        setCreators(data.data ?? []);
      } catch (err) {
        console.error("Failed to fetch top creators:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCreators();
  }, []);

  return (
    <CollapsibleSection
      title="Top 100 Streamers"
      subtitle="Ranked by live viewer count across all of Twitch"
      defaultOpen={false}
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : creators.length === 0 ? (
        <EmptyState
          title="No creator data yet"
          message="Follower data is collected during the full ingestion cycle (every 4 hours). Check back after it has run."
        />
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-3 px-3 w-12">#</th>
                <th className="py-3 px-3">Streamer</th>
                <th className="py-3 px-3">Game</th>
                <th className="py-3 px-3 text-right">Followers</th>
                <th className="py-3 px-3 text-right">Viewers</th>
                <th className="py-3 px-3 text-right">Growth</th>
              </tr>
            </thead>
            <tbody>
              {creators.map((creator) => (
                <tr
                  key={creator.creatorId}
                  className="border-b border-border/50 hover:bg-surface-hover transition-colors"
                >
                  <td className="py-2.5 px-3 text-muted">{creator.rank}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      {creator.profileImageUrl ? (
                        <img
                          src={creator.profileImageUrl}
                          alt={creator.displayName}
                          className="w-7 h-7 rounded-full"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                          {creator.displayName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-foreground">{creator.displayName}</span>
                        <span className="text-muted text-xs ml-1.5">@{creator.login}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-muted">{creator.gameName}</td>
                  <td className="py-2.5 px-3 text-right font-medium">
                    {creator.followerCount > 0
                      ? creator.followerCount.toLocaleString()
                      : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right text-accent">
                    {creator.viewerCount > 0
                      ? creator.viewerCount.toLocaleString()
                      : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {creator.followerGrowth !== 0 ? (
                      <span
                        className={
                          creator.followerGrowth > 0 ? "text-success" : "text-danger"
                        }
                      >
                        {creator.followerGrowth > 0 ? "+" : ""}
                        {creator.followerGrowth.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CollapsibleSection>
  );
}
