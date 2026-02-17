"use client";

import { useState, useEffect, useRef } from "react";
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
  const [page, setPage] = useState(0); // 0 = 1-50, 1 = 51-100
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const totalPages = Math.ceil(creators.length / 50);
  const pageCreators = creators.slice(page * 50, (page + 1) * 50);

  function handlePageChange(newPage: number) {
    setPage(newPage);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

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
          message="Creator data is collected during ingestion cycles. Check back after it has run."
        />
      ) : (
        <div className="mt-2">
          {/* Page tabs */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 mb-3">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    page === i
                      ? "bg-accent text-white"
                      : "bg-surface-hover text-muted hover:text-foreground"
                  }`}
                >
                  {i * 50 + 1}–{Math.min((i + 1) * 50, creators.length)}
                </button>
              ))}
              <span className="text-xs text-muted ml-2">
                {creators.length} streamers
              </span>
            </div>
          )}

          <div ref={scrollRef} className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface z-10">
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
                {pageCreators.map((creator) => (
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

          {/* Bottom page navigation */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-surface-hover text-muted hover:text-foreground"
              >
                Previous
              </button>
              <span className="text-xs text-muted">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-surface-hover text-muted hover:text-foreground"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </CollapsibleSection>
  );
}
