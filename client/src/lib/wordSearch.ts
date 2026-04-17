export interface PlacedWord {
  word: string;
  row: number;
  col: number;
  dRow: number;
  dCol: number;
}

export interface WordSearchGrid {
  size: number;
  grid: string[][];
  placed: PlacedWord[];
}

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [-1, 1],
  [0, -1],
  [-1, 0],
  [-1, -1],
  [1, -1],
];

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function clean(word: string): string {
  return word.toUpperCase().replace(/[^A-Z]/g, "");
}

function tryPlace(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
  size: number,
): boolean {
  for (let i = 0; i < word.length; i++) {
    const r = row + dRow * i;
    const c = col + dCol * i;
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    const cell = grid[r][c];
    if (cell !== "" && cell !== word[i]) return false;
  }
  return true;
}

function commit(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
): void {
  for (let i = 0; i < word.length; i++) {
    grid[row + dRow * i][col + dCol * i] = word[i];
  }
}

export function generateWordSearch(
  rawWords: string[],
  size = 14,
  seed?: number,
): WordSearchGrid {
  const words = rawWords
    .map(clean)
    .filter((w) => w.length >= 3 && w.length <= size)
    .sort((a, b) => b.length - a.length);

  let s = seed ?? Math.floor(Math.random() * 1e9);
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  const grid: string[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ""),
  );
  const placed: PlacedWord[] = [];

  for (const word of words) {
    let success = false;
    for (let attempt = 0; attempt < 200 && !success; attempt++) {
      const dir = DIRECTIONS[Math.floor(rand() * DIRECTIONS.length)];
      const row = Math.floor(rand() * size);
      const col = Math.floor(rand() * size);
      if (tryPlace(grid, word, row, col, dir[0], dir[1], size)) {
        commit(grid, word, row, col, dir[0], dir[1]);
        placed.push({ word, row, col, dRow: dir[0], dCol: dir[1] });
        success = true;
      }
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === "") {
        grid[r][c] = ALPHA[Math.floor(rand() * 26)];
      }
    }
  }

  return { size, grid, placed };
}

export function getCellsBetween(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
): { row: number; col: number }[] | null {
  const dRow = endRow - startRow;
  const dCol = endCol - startCol;
  if (dRow === 0 && dCol === 0) return [{ row: startRow, col: startCol }];

  // Snap to nearest valid axis: horizontal, vertical, or 45° diagonal.
  // Pick the axis that the user's drag is closest to.
  const absR = Math.abs(dRow);
  const absC = Math.abs(dCol);
  const sR = dRow === 0 ? 0 : dRow / absR;
  const sC = dCol === 0 ? 0 : dCol / absC;

  let stepRow: number;
  let stepCol: number;
  let len: number;

  if (absC === 0 || absR / Math.max(absC, 1) >= 2) {
    // Vertical
    stepRow = sR;
    stepCol = 0;
    len = absR;
  } else if (absR === 0 || absC / Math.max(absR, 1) >= 2) {
    // Horizontal
    stepRow = 0;
    stepCol = sC;
    len = absC;
  } else {
    // Diagonal — use the smaller of the two so we don't overshoot.
    stepRow = sR;
    stepCol = sC;
    len = Math.min(absR, absC);
  }

  const cells: { row: number; col: number }[] = [];
  for (let i = 0; i <= len; i++) {
    cells.push({ row: startRow + stepRow * i, col: startCol + stepCol * i });
  }
  return cells;
}

export function readCells(
  grid: string[][],
  cells: { row: number; col: number }[],
): string {
  return cells.map((c) => grid[c.row][c.col]).join("");
}
