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
  const len = Math.max(Math.abs(dRow), Math.abs(dCol));
  if (len === 0) return [{ row: startRow, col: startCol }];
  if (
    dRow !== 0 &&
    dCol !== 0 &&
    Math.abs(dRow) !== Math.abs(dCol)
  ) {
    return null;
  }
  const stepRow = dRow === 0 ? 0 : dRow / Math.abs(dRow);
  const stepCol = dCol === 0 ? 0 : dCol / Math.abs(dCol);
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
