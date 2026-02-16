import {
  Game,
  Creator,
  GameSnapshot,
  ViewerTrendPoint,
  CreatorGrowthPoint,
  AttentionTier,
} from "./types";

// ── Seed Data ──

const GAMES: Game[] = [
  { id: "509658", name: "Just Chatting", boxArtUrl: "", totalViewers: 312400, totalChannels: 8420 },
  { id: "32982",  name: "Grand Theft Auto V", boxArtUrl: "", totalViewers: 187300, totalChannels: 2310 },
  { id: "21779",  name: "League of Legends", boxArtUrl: "", totalViewers: 164200, totalChannels: 4870 },
  { id: "516575", name: "VALORANT", boxArtUrl: "", totalViewers: 142800, totalChannels: 3960 },
  { id: "33214",  name: "Fortnite", boxArtUrl: "", totalViewers: 98500, totalChannels: 2740 },
];

const CREATOR_NAMES: Record<string, string[]> = {
  "509658": ["xQc", "Kai Cenat", "Amouranth", "HasanAbi", "Pokimane", "Asmongold", "Mizkif", "Ludwig", "Ironmouse", "Valkyrae"],
  "32982":  ["Summit1g", "Sykkuno", "Buddha", "RatedEpicz", "Ramee", "Lysium", "Crystalst", "Blau", "Omie", "Kyle"],
  "21779":  ["Faker", "Caedrel", "Tyler1", "TheBausffs", "Doublelift", "Caps", "Agurin", "Drututt", "Nemesis", "RossBoomsocks"],
  "516575": ["TenZ", "Tarik", "ShahZaM", "Kyedae", "s0mcs", "Stewie2K", "FNS", "SicK", "Subroza", "Ethos"],
  "33214":  ["Ninja", "Tfue", "Bugha", "Clix", "Mongraal", "MrSavage", "Benjyfishy", "Stable Ronaldo", "Chap", "Scoped"],
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function jitter(base: number, pct: number) {
  const delta = base * pct;
  return Math.round(base + (Math.random() * 2 - 1) * delta);
}

// ── Generators ──

export function generateCreators(gameId: string, gameName: string): Creator[] {
  const names = CREATOR_NAMES[gameId] ?? CREATOR_NAMES["509658"];
  return names.map((name, i) => ({
    id: `${gameId}-${i}`,
    login: name.toLowerCase().replace(/\s/g, ""),
    displayName: name,
    profileImageUrl: "",
    gameId,
    gameName,
    viewerCount: Math.round((10000 - i * 800) * (0.8 + Math.random() * 0.4)),
    followerCount: rand(50000, 8000000),
    title: `${gameName} stream`,
    startedAt: new Date(Date.now() - rand(1, 8) * 3600000).toISOString(),
  }));
}

export function generateSnapshots(): GameSnapshot[] {
  return GAMES.map((game) => ({
    game: { ...game, totalViewers: jitter(game.totalViewers, 0.1) },
    creators: generateCreators(game.id, game.name)
      .sort((a, b) => b.viewerCount - a.viewerCount)
      .slice(0, 10),
  }));
}

export function generateViewerTrends(period: "7d" | "30d"): ViewerTrendPoint[] {
  const days = period === "7d" ? 7 : 30;
  const points: ViewerTrendPoint[] = [];
  const now = new Date();

  for (const game of GAMES) {
    let viewers = game.totalViewers;
    for (let d = days; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      viewers = jitter(viewers, 0.08);
      points.push({
        date: date.toISOString().split("T")[0],
        gameId: game.id,
        gameName: game.name,
        viewers,
      });
    }
  }
  return points;
}

export function generateCreatorGrowth(gameId?: string): CreatorGrowthPoint[] {
  const games = gameId ? GAMES.filter((g) => g.id === gameId) : GAMES;
  const points: CreatorGrowthPoint[] = [];
  const now = new Date();

  for (const game of games) {
    const creators = generateCreators(game.id, game.name).slice(0, 5);
    for (const creator of creators) {
      let followers = creator.followerCount;
      for (let w = 4; w >= 0; w--) {
        const date = new Date(now);
        date.setDate(date.getDate() - w * 7);
        const growth = rand(-2000, 15000);
        followers += growth;
        points.push({
          date: date.toISOString().split("T")[0],
          creatorId: creator.id,
          creatorName: creator.displayName,
          gameId: game.id,
          gameName: game.name,
          followers,
          followerGrowth: growth,
        });
      }
    }
  }
  return points;
}

export function generateAttentionData(gameId?: string): AttentionTier[] {
  const games = gameId ? GAMES.filter((g) => g.id === gameId) : GAMES;
  const tiers: AttentionTier[] = [];
  const now = new Date();

  for (const game of games) {
    for (let d = 7; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      const top1 = rand(15, 35);
      const top3 = rand(10, 20);
      const top10 = rand(15, 25);
      const longTail = 100 - top1 - top3 - top10;
      tiers.push({
        date: date.toISOString().split("T")[0],
        gameId: game.id,
        gameName: game.name,
        top1Pct: top1,
        top3Pct: top3,
        top10Pct: top10,
        longTailPct: longTail,
      });
    }
  }
  return tiers;
}
