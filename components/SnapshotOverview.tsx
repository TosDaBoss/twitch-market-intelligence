"use client";

import { GameSnapshot } from "@/lib/types";
import { GameCard } from "./GameCard";
import { CollapsibleSection } from "./SectionHeader";

interface Props {
  snapshots: GameSnapshot[];
  selectedGameId: string | null;
  selectedCreatorId: string | null;
  onSelectGame: (gameId: string) => void;
  onSelectCreator: (creatorId: string) => void;
}

export function SnapshotOverview({
  snapshots,
  selectedGameId,
  selectedCreatorId,
  onSelectGame,
  onSelectCreator,
}: Props) {
  return (
    <CollapsibleSection
      title="Snapshot Overview"
      subtitle="Top games by live viewers right now"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
        {snapshots
          .sort((a, b) => b.game.totalViewers - a.game.totalViewers)
          .slice(0, 5)
          .map((snapshot) => (
            <GameCard
              key={snapshot.game.id}
              snapshot={snapshot}
              isSelected={selectedGameId === snapshot.game.id}
              isExpanded={selectedGameId === snapshot.game.id}
              onSelect={onSelectGame}
              onCreatorClick={onSelectCreator}
              selectedCreatorId={selectedCreatorId}
            />
          ))}
      </div>
    </CollapsibleSection>
  );
}
