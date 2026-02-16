"use client";

interface InsightPanelProps {
  insight: string;
}

export function InsightPanel({ insight }: InsightPanelProps) {
  if (!insight) return null;

  return (
    <div className="mt-3 px-4 py-3 rounded-lg bg-accent/5 border border-accent/20 text-sm text-muted">
      <span className="text-accent font-medium mr-1.5">Insight:</span>
      {insight}
    </div>
  );
}
