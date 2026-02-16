// ── Core Domain Types ──

export interface Game {
  id: string;
  name: string;
  boxArtUrl: string;
  totalViewers: number;
  totalChannels: number;
}

export interface Creator {
  id: string;
  login: string;
  displayName: string;
  profileImageUrl: string;
  gameId: string;
  gameName: string;
  viewerCount: number;
  followerCount: number;
  title: string;
  startedAt: string;
}

// ── Snapshot (Section 1) ──

export interface GameSnapshot {
  game: Game;
  creators: Creator[];
}

// ── Time-Series (Section 2) ──

export interface ViewerTrendPoint {
  date: string; // ISO date string
  gameId: string;
  gameName: string;
  viewers: number;
}

export interface CreatorGrowthPoint {
  date: string;
  creatorId: string;
  creatorName: string;
  gameId: string;
  gameName: string;
  followers: number;
  followerGrowth: number;
}

export interface AttentionTier {
  date: string;
  gameId: string;
  gameName: string;
  top1Pct: number;
  top3Pct: number;
  top10Pct: number;
  longTailPct: number;
}

// ── API Response Wrappers ──

export interface SnapshotResponse {
  snapshots: GameSnapshot[];
  updatedAt: string;
}

export interface TrendResponse {
  data: ViewerTrendPoint[];
  period: "7d" | "30d";
}

export interface CreatorTrendResponse {
  data: CreatorGrowthPoint[];
  gameId?: string;
}

export interface AttentionResponse {
  data: AttentionTier[];
  gameId?: string;
}

// ── Dashboard State ──

export interface DashboardFilters {
  selectedGameId: string | null;
  selectedCreatorId: string | null;
  trendPeriod: "7d" | "30d";
  selectedGameIds: string[];
}
