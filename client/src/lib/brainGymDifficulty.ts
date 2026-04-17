// Difficulty configuration for all Brain Gym games.
// Persisted in localStorage so the user's choice sticks across sessions.

export type Difficulty = "easy" | "medium" | "hard";

export interface DifficultyConfig {
  wordSearchSize: number;
  wordSearchCount: number;
  crosswordCount: number;
  memoryPairs: number;
  label: string;
  blurb: string;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    wordSearchSize: 10,
    wordSearchCount: 6,
    crosswordCount: 6,
    memoryPairs: 6,
    label: "Easy",
    blurb: "Smaller grid, fewer words. Built for hard days, fatigue, or first-week recovery.",
  },
  medium: {
    wordSearchSize: 14,
    wordSearchCount: 10,
    crosswordCount: 10,
    memoryPairs: 8,
    label: "Medium",
    blurb: "Standard daily rep. The default for most survivors most days.",
  },
  hard: {
    wordSearchSize: 16,
    wordSearchCount: 12,
    crosswordCount: 14,
    memoryPairs: 12,
    label: "Hard",
    blurb: "Bigger grid, more terms. For the days you want to push the wire.",
  },
};

const STORAGE_KEY = "brainGym.difficulty";

export function getDifficulty(): Difficulty {
  if (typeof window === "undefined") return "medium";
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "easy" || v === "medium" || v === "hard") return v;
  return "medium";
}

export function setDifficulty(d: Difficulty) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, d);
}
