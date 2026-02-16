"use client";

interface Props {
  selectedGameName: string | null;
  onClearFilters: () => void;
  onRefresh: () => void;
}

export function DashboardHeader({ selectedGameName, onClearFilters, onRefresh }: Props) {
  return (
    <header className="flex items-center justify-between py-6 border-b border-border mb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-accent">Twitch</span> Market Intelligence
        </h1>
        <p className="text-sm text-muted mt-1">
          Real-time attention flow &amp; creator ecosystem analytics
        </p>
      </div>
      <div className="flex items-center gap-3">
        {selectedGameName && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-sm">
            <span className="text-accent font-medium">{selectedGameName}</span>
            <button
              onClick={onClearFilters}
              className="text-muted hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <button
          onClick={onRefresh}
          className="px-3 py-1.5 rounded-lg bg-surface border border-border text-sm text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
        >
          Refresh
        </button>
      </div>
    </header>
  );
}
