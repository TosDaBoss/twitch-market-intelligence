-- ══════════════════════════════════════════
-- Twitch Dashboard — Supabase Schema
-- ══════════════════════════════════════════

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  box_art_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creators table
CREATE TABLE IF NOT EXISTS creators (
  id TEXT PRIMARY KEY,
  login TEXT NOT NULL,
  display_name TEXT NOT NULL,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Point-in-time snapshot of top games + viewer counts
CREATE TABLE IF NOT EXISTS game_snapshots (
  id BIGSERIAL PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id),
  total_viewers INTEGER NOT NULL,
  total_channels INTEGER NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_game_snapshots_game_date ON game_snapshots(game_id, captured_at DESC);

-- Point-in-time snapshot of creator streams
CREATE TABLE IF NOT EXISTS creator_snapshots (
  id BIGSERIAL PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES creators(id),
  game_id TEXT NOT NULL REFERENCES games(id),
  viewer_count INTEGER NOT NULL,
  follower_count INTEGER NOT NULL,
  title TEXT,
  started_at TIMESTAMPTZ,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_creator_snapshots_game_date ON creator_snapshots(game_id, captured_at DESC);
CREATE INDEX idx_creator_snapshots_creator_date ON creator_snapshots(creator_id, captured_at DESC);

-- Materialized daily rollups (optional, for faster trend queries)
CREATE TABLE IF NOT EXISTS daily_game_stats (
  id BIGSERIAL PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id),
  date DATE NOT NULL,
  avg_viewers INTEGER NOT NULL,
  peak_viewers INTEGER NOT NULL,
  avg_channels INTEGER NOT NULL,
  UNIQUE(game_id, date)
);

CREATE TABLE IF NOT EXISTS daily_creator_stats (
  id BIGSERIAL PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES creators(id),
  game_id TEXT NOT NULL REFERENCES games(id),
  date DATE NOT NULL,
  avg_viewers INTEGER NOT NULL,
  peak_viewers INTEGER NOT NULL,
  follower_count INTEGER NOT NULL,
  follower_growth INTEGER NOT NULL DEFAULT 0,
  UNIQUE(creator_id, date)
);
