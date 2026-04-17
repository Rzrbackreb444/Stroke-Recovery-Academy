// Localstorage-backed pause/resume autosave for individual puzzles.
// Keys are scoped by gameType + packId + difficulty so changing any of those
// loads a fresh puzzle.

const PREFIX = "brainGym.save.";

function key(gameType: string, packId: string, difficulty: string): string {
  return `${PREFIX}${gameType}.${packId}.${difficulty}`;
}

export function saveGame<T>(gameType: string, packId: string, difficulty: string, state: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      key(gameType, packId, difficulty),
      JSON.stringify({ savedAt: Date.now(), state }),
    );
  } catch {
    /* quota exceeded — ignore */
  }
}

export function loadGame<T>(gameType: string, packId: string, difficulty: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(gameType, packId, difficulty));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.state as T;
  } catch {
    return null;
  }
}

export function clearGame(gameType: string, packId: string, difficulty: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(gameType, packId, difficulty));
  } catch {
    /* ignore */
  }
}
