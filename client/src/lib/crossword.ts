export interface CrosswordEntry {
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: "across" | "down";
  number: number;
}

export interface CrosswordLayout {
  rows: number;
  cols: number;
  grid: (string | null)[][];
  entries: CrosswordEntry[];
}

interface RawEntry {
  word: string;
  clue: string;
}

interface PlacementCandidate {
  row: number;
  col: number;
  direction: "across" | "down";
  intersections: number;
}

function clean(w: string): string {
  return w.toUpperCase().replace(/[^A-Z]/g, "");
}

function fits(
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  dir: "across" | "down",
  rows: number,
  cols: number,
): { ok: boolean; intersections: number } {
  let intersections = 0;
  for (let i = 0; i < word.length; i++) {
    const r = dir === "down" ? row + i : row;
    const c = dir === "across" ? col + i : col;
    if (r < 0 || c < 0 || r >= rows || c >= cols) return { ok: false, intersections: 0 };
    const existing = grid[r][c];
    if (existing && existing !== word[i]) return { ok: false, intersections: 0 };
    if (existing === word[i]) {
      intersections++;
    } else {
      // Adjacent cell check (no parallel touching)
      if (dir === "across") {
        const above = r > 0 ? grid[r - 1][c] : null;
        const below = r < rows - 1 ? grid[r + 1][c] : null;
        if (above || below) return { ok: false, intersections: 0 };
      } else {
        const left = c > 0 ? grid[r][c - 1] : null;
        const right = c < cols - 1 ? grid[r][c + 1] : null;
        if (left || right) return { ok: false, intersections: 0 };
      }
    }
  }
  // Check ends
  if (dir === "across") {
    if (col > 0 && grid[row][col - 1]) return { ok: false, intersections: 0 };
    if (col + word.length < cols && grid[row][col + word.length])
      return { ok: false, intersections: 0 };
  } else {
    if (row > 0 && grid[row - 1][col]) return { ok: false, intersections: 0 };
    if (row + word.length < rows && grid[row + word.length][col])
      return { ok: false, intersections: 0 };
  }
  return { ok: true, intersections };
}

function place(
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  dir: "across" | "down",
): void {
  for (let i = 0; i < word.length; i++) {
    const r = dir === "down" ? row + i : row;
    const c = dir === "across" ? col + i : col;
    grid[r][c] = word[i];
  }
}

export function generateCrossword(
  raw: RawEntry[],
  maxSize = 17,
): CrosswordLayout {
  const cleaned = raw
    .map((e) => ({ word: clean(e.word), clue: e.clue }))
    .filter((e) => e.word.length >= 3 && e.word.length <= maxSize)
    .sort((a, b) => b.word.length - a.word.length);

  const rows = maxSize;
  const cols = maxSize;
  const grid: (string | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null),
  );
  const placed: { word: string; clue: string; row: number; col: number; direction: "across" | "down" }[] = [];

  if (cleaned.length === 0) {
    return { rows, cols, grid, entries: [] };
  }

  // Place first word horizontally near center
  const first = cleaned[0];
  const startRow = Math.floor(rows / 2);
  const startCol = Math.floor((cols - first.word.length) / 2);
  place(grid, first.word, startRow, startCol, "across");
  placed.push({ ...first, row: startRow, col: startCol, direction: "across" });

  for (let i = 1; i < cleaned.length; i++) {
    const { word, clue } = cleaned[i];
    let best: PlacementCandidate | null = null;
    for (let li = 0; li < word.length; li++) {
      const letter = word[li];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] !== letter) continue;
          // Try across: word[li] aligns at (r, c) → start col = c - li
          const acrossStart = { row: r, col: c - li };
          if (acrossStart.col >= 0) {
            const res = fits(grid, word, acrossStart.row, acrossStart.col, "across", rows, cols);
            if (res.ok && res.intersections >= 1) {
              if (!best || res.intersections > best.intersections) {
                best = { row: acrossStart.row, col: acrossStart.col, direction: "across", intersections: res.intersections };
              }
            }
          }
          // Try down
          const downStart = { row: r - li, col: c };
          if (downStart.row >= 0) {
            const res = fits(grid, word, downStart.row, downStart.col, "down", rows, cols);
            if (res.ok && res.intersections >= 1) {
              if (!best || res.intersections > best.intersections) {
                best = { row: downStart.row, col: downStart.col, direction: "down", intersections: res.intersections };
              }
            }
          }
        }
      }
    }
    if (best) {
      place(grid, word, best.row, best.col, best.direction);
      placed.push({ word, clue, row: best.row, col: best.col, direction: best.direction });
    }
  }

  // Trim grid to bounding box
  let minR = rows, maxR = -1, minC = cols, maxC = -1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c]) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }
  if (maxR === -1) {
    return { rows: 1, cols: 1, grid: [[null]], entries: [] };
  }
  const trimmedRows = maxR - minR + 1;
  const trimmedCols = maxC - minC + 1;
  const trimmedGrid: (string | null)[][] = Array.from({ length: trimmedRows }, (_, r) =>
    Array.from({ length: trimmedCols }, (_, c) => grid[minR + r][minC + c]),
  );

  // Number cells
  const entries: CrosswordEntry[] = [];
  let num = 0;
  const numberMap: Record<string, number> = {};
  for (let r = 0; r < trimmedRows; r++) {
    for (let c = 0; c < trimmedCols; c++) {
      if (!trimmedGrid[r][c]) continue;
      const startsAcross = (c === 0 || !trimmedGrid[r][c - 1]) && c + 1 < trimmedCols && trimmedGrid[r][c + 1];
      const startsDown = (r === 0 || !trimmedGrid[r - 1][c]) && r + 1 < trimmedRows && trimmedGrid[r + 1][c];
      if (startsAcross || startsDown) {
        num++;
        numberMap[`${r},${c}`] = num;
      }
    }
  }
  for (const p of placed) {
    const r = p.row - minR;
    const c = p.col - minC;
    const number = numberMap[`${r},${c}`] ?? 0;
    entries.push({
      word: p.word,
      clue: p.clue,
      row: r,
      col: c,
      direction: p.direction,
      number,
    });
  }
  entries.sort((a, b) => a.number - b.number || (a.direction === "across" ? -1 : 1));

  return { rows: trimmedRows, cols: trimmedCols, grid: trimmedGrid, entries };
}

export function buildCellNumberMap(layout: CrosswordLayout): Record<string, number> {
  const map: Record<string, number> = {};
  for (const e of layout.entries) {
    map[`${e.row},${e.col}`] = e.number;
  }
  return map;
}
