"use client";

import { GameSnapshot } from "@/lib/types";

interface GameCardProps {
  snapshot: GameSnapshot;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (gameId: string) => void;
  onCreatorClick: (creatorId: string) => void;
  selectedCreatorId: string | null;
}

export function GameCard({
  snapshot,
  isSelected,
  isExpanded,
  onSelect,
  onCreatorClick,
  selectedCreatorId,
}: GameCardProps) {
  const { game, creators } = snapshot;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 cursor-pointer ${
        isSelected
          ? "border-accent bg-accent/10 shadow-lg shadow-accent/5"
          : "border-border bg-surface hover:bg-surface-hover hover:border-accent/40"
      }`}
      onClick={() => onSelect(game.id)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0">
            {game.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{game.name}</h3>
            <p className="text-sm text-muted">{game.totalChannels.toLocaleString()} channels</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-foreground">{game.totalViewers.toLocaleString()}</p>
          <p className="text-xs text-muted">viewers</p>
        </div>
      </div>

      {/* Expandable Creator List */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-border px-4 py-3">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
            Top Creators
          </p>
          <div className="space-y-1">
            {creators.map((creator, i) => (
              <div
                key={creator.id}
                className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-sm transition-colors cursor-pointer ${
                  selectedCreatorId === creator.id
                    ? "bg-accent/20 text-accent"
                    : "hover:bg-surface-hover text-foreground"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onCreatorClick(creator.id);
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-muted w-5 text-right">{i + 1}</span>
                  <span className="truncate">{creator.displayName}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-xs">
                  <span className="text-muted">{creator.followerCount.toLocaleString()} followers</span>
                  <span className="font-medium text-accent">{creator.viewerCount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
