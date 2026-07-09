// Deterministic daily challenge picker. Everyone playing on the same date
// gets the same pack + game + seed, which is what makes a leaderboard fair.

import { BRAIN_GYM_PACKS } from "@shared/brainGymPacks";

export type GameType = "wordsearch" | "crossword" | "memory";
const GAMES: GameType[] = ["wordsearch", "crossword", "memory"];

export interface DailyChallenge {
  date: string; // YYYY-MM-DD
  packId: string;
  gameType: GameType;
  seed: number;
  packName: string;
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getDailyChallenge(date: Date = new Date()): DailyChallenge {
  const key = ymd(date);
  const seed = hashString(`brain-gym|${key}`);
  const pack = BRAIN_GYM_PACKS[seed % BRAIN_GYM_PACKS.length];
  const gameType = GAMES[(seed >> 8) % GAMES.length];
  return {
    date: key,
    packId: pack.id,
    gameType,
    seed,
    packName: pack.name,
  };
}
