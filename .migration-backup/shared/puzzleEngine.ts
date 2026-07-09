// Brain Games / Puzzle Studio engine.
// Pure-TS deterministic generators for 6 puzzle types + a single HTML renderer
// used by BOTH the client preview and the server PDF export.
//
// Data is single-tenant author content (the creator's own puzzle inputs), but
// all dynamic strings are still HTML-escaped before interpolation.

export type PuzzleType =
  | "word_search"
  | "crossword"
  | "word_scramble"
  | "sudoku"
  | "maze"
  | "memory_match";

export type Difficulty = "easy" | "medium" | "hard";

export interface PuzzleConfig {
  seed?: number;
  // word_search / word_scramble / memory_match / crossword inputs
  words?: string[];
  clues?: { answer: string; clue: string }[];
  pairs?: { left: string; right: string }[];
  // sizing
  size?: number; // grid dimension for word_search / maze
  difficulty?: Difficulty;
}

export interface PuzzleContent {
  kind: PuzzleType;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Deterministic RNG (mulberry32)
// ---------------------------------------------------------------------------

function makeRng(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(config: PuzzleConfig): number {
  if (typeof config.seed === "number" && Number.isFinite(config.seed)) {
    return Math.floor(config.seed) >>> 0;
  }
  return (Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function cleanWord(w: string): string {
  return (w || "").toUpperCase().replace(/[^A-Z]/g, "");
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ---------------------------------------------------------------------------
// 1. Word search
// ---------------------------------------------------------------------------

interface WordSearchContent extends PuzzleContent {
  kind: "word_search";
  size: number;
  grid: string[][];
  words: string[];
  placements: { word: string; row: number; col: number; dr: number; dc: number }[];
}

const WS_DIRS = [
  [0, 1], [1, 0], [1, 1], [-1, 1],
  [0, -1], [-1, 0], [-1, -1], [1, -1],
];

function genWordSearch(config: PuzzleConfig): WordSearchContent {
  const rng = makeRng(seedFrom(config));
  const words = (config.words || [])
    .map(cleanWord)
    .filter((w) => w.length >= 2)
    .slice(0, 24);
  const longest = words.reduce((m, w) => Math.max(m, w.length), 0);
  const size = Math.max(config.size || 12, longest, 8);
  const grid: (string | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  );
  const placements: WordSearchContent["placements"] = [];

  for (const word of words) {
    let placed = false;
    for (let attempt = 0; attempt < 200 && !placed; attempt++) {
      const [dr, dc] = WS_DIRS[Math.floor(rng() * WS_DIRS.length)];
      const row = Math.floor(rng() * size);
      const col = Math.floor(rng() * size);
      const endR = row + dr * (word.length - 1);
      const endC = col + dc * (word.length - 1);
      if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue;
      let ok = true;
      for (let i = 0; i < word.length; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        const existing = grid[r][c];
        if (existing !== null && existing !== word[i]) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      for (let i = 0; i < word.length; i++) {
        grid[row + dr * i][col + dc * i] = word[i];
      }
      placements.push({ word, row, col, dr, dc });
      placed = true;
    }
  }

  const finalGrid: string[][] = grid.map((rowArr) =>
    rowArr.map((cell) => (cell === null ? ALPHABET[Math.floor(rng() * 26)] : cell)),
  );

  return {
    kind: "word_search",
    size,
    grid: finalGrid,
    words: placements.map((p) => p.word),
    placements,
  };
}

// ---------------------------------------------------------------------------
// 2. Crossword (greedy interlock)
// ---------------------------------------------------------------------------

interface CrosswordEntry {
  num: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
  dir: "across" | "down";
}

interface CrosswordContent extends PuzzleContent {
  kind: "crossword";
  width: number;
  height: number;
  grid: (string | null)[][];
  numbers: number[][];
  across: CrosswordEntry[];
  down: CrosswordEntry[];
}

function genCrossword(config: PuzzleConfig): CrosswordContent {
  const rng = makeRng(seedFrom(config));
  const source = (config.clues && config.clues.length
    ? config.clues
    : (config.words || []).map((w) => ({ answer: w, clue: w }))
  )
    .map((c) => ({ answer: cleanWord(c.answer), clue: (c.clue || c.answer || "").trim() }))
    .filter((c) => c.answer.length >= 2)
    .sort((a, b) => b.answer.length - a.answer.length)
    .slice(0, 30);

  const N = 40; // working canvas, trimmed later
  const grid: (string | null)[][] = Array.from({ length: N }, () =>
    Array.from({ length: N }, () => null),
  );
  type Placed = { answer: string; clue: string; row: number; col: number; dir: "across" | "down" };
  const placed: Placed[] = [];

  function canPlace(answer: string, row: number, col: number, dir: "across" | "down"): boolean {
    const dr = dir === "down" ? 1 : 0;
    const dc = dir === "across" ? 1 : 0;
    const beforeR = row - dr, beforeC = col - dc;
    const afterR = row + dr * answer.length, afterC = col + dc * answer.length;
    if (beforeR >= 0 && beforeC >= 0 && grid[beforeR]?.[beforeC]) return false;
    if (afterR < N && afterC < N && grid[afterR]?.[afterC]) return false;
    let touched = false;
    for (let i = 0; i < answer.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || r >= N || c < 0 || c >= N) return false;
      const cell = grid[r][c];
      if (cell !== null) {
        if (cell !== answer[i]) return false;
        touched = true;
      } else {
        // perpendicular neighbors must be empty (no accidental words)
        if (dir === "across") {
          if (grid[r - 1]?.[c] || grid[r + 1]?.[c]) return false;
        } else {
          if (grid[r]?.[c - 1] || grid[r]?.[c + 1]) return false;
        }
      }
    }
    return touched || placed.length === 0;
  }

  function place(answer: string, clue: string, row: number, col: number, dir: "across" | "down") {
    const dr = dir === "down" ? 1 : 0;
    const dc = dir === "across" ? 1 : 0;
    for (let i = 0; i < answer.length; i++) grid[row + dr * i][col + dc * i] = answer[i];
    placed.push({ answer, clue, row, col, dir });
  }

  if (source.length) {
    const first = source[0];
    const mid = Math.floor(N / 2);
    place(first.answer, first.clue, mid, mid - Math.floor(first.answer.length / 2), "across");
    for (let s = 1; s < source.length; s++) {
      const { answer, clue } = source[s];
      let done = false;
      for (let i = 0; i < answer.length && !done; i++) {
        for (const p of placed) {
          for (let j = 0; j < p.answer.length && !done; j++) {
            if (p.answer[j] !== answer[i]) continue;
            const dir: "across" | "down" = p.dir === "across" ? "down" : "across";
            const r = dir === "down" ? p.row + j - i : p.row + j;
            const c = dir === "down" ? p.col : p.col + j - i;
            if (dir === "down") {
              if (canPlace(answer, r, c, "down")) { place(answer, clue, r, c, "down"); done = true; }
            } else {
              if (canPlace(answer, r, c, "across")) { place(answer, clue, r, c, "across"); done = true; }
            }
          }
        }
      }
    }
  }

  // trim bounds
  let minR = N, minC = N, maxR = 0, maxC = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (grid[r][c]) {
    minR = Math.min(minR, r); maxR = Math.max(maxR, r);
    minC = Math.min(minC, c); maxC = Math.max(maxC, c);
  }
  if (placed.length === 0) { minR = minC = 0; maxR = maxC = 0; }
  const height = maxR - minR + 1;
  const width = maxC - minC + 1;
  const outGrid: (string | null)[][] = Array.from({ length: height }, (_, r) =>
    Array.from({ length: width }, (_, c) => grid[r + minR][c + minC]),
  );
  const numbers: number[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => 0),
  );

  // assign numbers + build entries
  const across: CrosswordEntry[] = [];
  const down: CrosswordEntry[] = [];
  let n = 0;
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (!outGrid[r][c]) continue;
      const startsAcross = (c === 0 || !outGrid[r][c - 1]) && c + 1 < width && outGrid[r][c + 1];
      const startsDown = (r === 0 || !outGrid[r - 1][c]) && r + 1 < height && outGrid[r + 1][c];
      if (startsAcross || startsDown) {
        n++;
        numbers[r][c] = n;
        if (startsAcross) {
          let word = "";
          let cc = c;
          while (cc < width && outGrid[r][cc]) { word += outGrid[r][cc]; cc++; }
          const found = placed.find((p) => p.dir === "across" && p.row - minR === r && p.col - minC === c);
          across.push({ num: n, clue: found?.clue || word, answer: word, row: r, col: c, dir: "across" });
        }
        if (startsDown) {
          let word = "";
          let rr = r;
          while (rr < height && outGrid[rr][c]) { word += outGrid[rr][c]; rr++; }
          const found = placed.find((p) => p.dir === "down" && p.row - minR === r && p.col - minC === c);
          down.push({ num: n, clue: found?.clue || word, answer: word, row: r, col: c, dir: "down" });
        }
      }
    }
  }

  return { kind: "crossword", width, height, grid: outGrid, numbers, across, down };
}

// ---------------------------------------------------------------------------
// 3. Word scramble
// ---------------------------------------------------------------------------

interface WordScrambleContent extends PuzzleContent {
  kind: "word_scramble";
  items: { answer: string; scrambled: string; clue?: string }[];
}

function scrambleWord(word: string, rng: () => number): string {
  if (word.length < 2) return word;
  let out = word;
  let guard = 0;
  while (out === word && guard < 10) {
    out = shuffle(word.split(""), rng).join("");
    guard++;
  }
  return out;
}

function genWordScramble(config: PuzzleConfig): WordScrambleContent {
  const rng = makeRng(seedFrom(config));
  const source = config.clues && config.clues.length
    ? config.clues.map((c) => ({ answer: cleanWord(c.answer), clue: c.clue }))
    : (config.words || []).map((w) => ({ answer: cleanWord(w), clue: undefined as string | undefined }));
  const items = source
    .filter((s) => s.answer.length >= 2)
    .slice(0, 40)
    .map((s) => ({ answer: s.answer, scrambled: scrambleWord(s.answer, rng), clue: s.clue }));
  return { kind: "word_scramble", items };
}

// ---------------------------------------------------------------------------
// 4. Sudoku
// ---------------------------------------------------------------------------

interface SudokuContent extends PuzzleContent {
  kind: "sudoku";
  puzzle: number[][];
  solution: number[][];
}

function genSudoku(config: PuzzleConfig): SudokuContent {
  const rng = makeRng(seedFrom(config));
  const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

  function valid(b: number[][], r: number, c: number, v: number): boolean {
    for (let i = 0; i < 9; i++) {
      if (b[r][i] === v || b[i][c] === v) return false;
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (b[br + i][bc + j] === v) return false;
    return true;
  }

  function fill(b: number[][], pos: number): boolean {
    if (pos === 81) return true;
    const r = Math.floor(pos / 9);
    const c = pos % 9;
    if (b[r][c] !== 0) return fill(b, pos + 1);
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
    for (const v of nums) {
      if (valid(b, r, c, v)) {
        b[r][c] = v;
        if (fill(b, pos + 1)) return true;
        b[r][c] = 0;
      }
    }
    return false;
  }

  fill(board, 0);
  const solution = board.map((row) => row.slice());

  const difficulty = config.difficulty || "easy";
  const holes = difficulty === "hard" ? 56 : difficulty === "medium" ? 48 : 38;
  const puzzle = solution.map((row) => row.slice());
  let removed = 0;
  let guard = 0;
  while (removed < holes && guard < 1000) {
    guard++;
    const r = Math.floor(rng() * 9);
    const c = Math.floor(rng() * 9);
    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      removed++;
    }
  }

  return { kind: "sudoku", puzzle, solution };
}

// ---------------------------------------------------------------------------
// 5. Maze (recursive backtracker)
// ---------------------------------------------------------------------------

interface MazeCell {
  n: boolean; e: boolean; s: boolean; w: boolean; // wall present
}

interface MazeContent extends PuzzleContent {
  kind: "maze";
  width: number;
  height: number;
  cells: MazeCell[][];
  solution: { r: number; c: number }[];
}

function genMaze(config: PuzzleConfig): MazeContent {
  const rng = makeRng(seedFrom(config));
  const difficulty = config.difficulty || "easy";
  const base = config.size || (difficulty === "hard" ? 20 : difficulty === "medium" ? 15 : 10);
  const size = Math.max(5, Math.min(base, 30));
  const width = size, height = size;
  const cells: MazeCell[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ n: true, e: true, s: true, w: true })),
  );
  const visited: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));

  const stack: { r: number; c: number }[] = [{ r: 0, c: 0 }];
  visited[0][0] = true;
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const { r, c } = cur;
    const neighbors: { r: number; c: number; dir: "n" | "e" | "s" | "w" }[] = [];
    if (r > 0 && !visited[r - 1][c]) neighbors.push({ r: r - 1, c, dir: "n" });
    if (c < width - 1 && !visited[r][c + 1]) neighbors.push({ r, c: c + 1, dir: "e" });
    if (r < height - 1 && !visited[r + 1][c]) neighbors.push({ r: r + 1, c, dir: "s" });
    if (c > 0 && !visited[r][c - 1]) neighbors.push({ r, c: c - 1, dir: "w" });
    if (!neighbors.length) { stack.pop(); continue; }
    const pick = neighbors[Math.floor(rng() * neighbors.length)];
    if (pick.dir === "n") { cells[r][c].n = false; cells[pick.r][pick.c].s = false; }
    if (pick.dir === "s") { cells[r][c].s = false; cells[pick.r][pick.c].n = false; }
    if (pick.dir === "e") { cells[r][c].e = false; cells[pick.r][pick.c].w = false; }
    if (pick.dir === "w") { cells[r][c].w = false; cells[pick.r][pick.c].e = false; }
    visited[pick.r][pick.c] = true;
    stack.push({ r: pick.r, c: pick.c });
  }

  // solve start(0,0) -> end(height-1,width-1) via BFS
  const prev: ({ r: number; c: number } | null)[][] = Array.from({ length: height }, () =>
    Array(width).fill(null),
  );
  const seen: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));
  const queue: { r: number; c: number }[] = [{ r: 0, c: 0 }];
  seen[0][0] = true;
  while (queue.length) {
    const { r, c } = queue.shift()!;
    if (r === height - 1 && c === width - 1) break;
    const cell = cells[r][c];
    const moves: { r: number; c: number }[] = [];
    if (!cell.n && r > 0) moves.push({ r: r - 1, c });
    if (!cell.s && r < height - 1) moves.push({ r: r + 1, c });
    if (!cell.e && c < width - 1) moves.push({ r, c: c + 1 });
    if (!cell.w && c > 0) moves.push({ r, c: c - 1 });
    for (const m of moves) {
      if (!seen[m.r][m.c]) {
        seen[m.r][m.c] = true;
        prev[m.r][m.c] = { r, c };
        queue.push(m);
      }
    }
  }
  const solution: { r: number; c: number }[] = [];
  let node: { r: number; c: number } | null = { r: height - 1, c: width - 1 };
  while (node) {
    solution.unshift(node);
    node = prev[node.r][node.c];
  }

  return { kind: "maze", width, height, cells, solution };
}

// ---------------------------------------------------------------------------
// 6. Memory match (printable matching worksheet)
// ---------------------------------------------------------------------------

interface MemoryMatchContent extends PuzzleContent {
  kind: "memory_match";
  left: { id: number; text: string }[];
  right: { id: number; text: string }[];
  answer: { left: number; right: number }[];
}

function genMemoryMatch(config: PuzzleConfig): MemoryMatchContent {
  const rng = makeRng(seedFrom(config));
  const pairs = (config.pairs || [])
    .map((p) => ({ left: (p.left || "").trim(), right: (p.right || "").trim() }))
    .filter((p) => p.left && p.right)
    .slice(0, 12);
  const leftItems = shuffle(pairs.map((p, i) => ({ id: i, text: p.left })), rng);
  const rightItems = shuffle(pairs.map((p, i) => ({ id: i, text: p.right })), rng);
  const answer = pairs.map((_, i) => ({ left: i, right: i }));
  return { kind: "memory_match", left: leftItems, right: rightItems, answer };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export function generatePuzzleContent(type: PuzzleType, config: PuzzleConfig): PuzzleContent {
  switch (type) {
    case "word_search": return genWordSearch(config);
    case "crossword": return genCrossword(config);
    case "word_scramble": return genWordScramble(config);
    case "sudoku": return genSudoku(config);
    case "maze": return genMaze(config);
    case "memory_match": return genMemoryMatch(config);
    default: throw new Error(`Unknown puzzle type: ${type}`);
  }
}

// ---------------------------------------------------------------------------
// HTML renderer (single source of truth: client preview + server PDF)
// ---------------------------------------------------------------------------

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface RenderOptions {
  showSolution?: boolean;
}

interface RenderablePuzzle {
  type: PuzzleType;
  title?: string;
  instructions?: string;
  content: PuzzleContent;
}

export function renderPuzzleHtml(puzzle: RenderablePuzzle, opts: RenderOptions = {}): string {
  const showSolution = !!opts.showSolution;
  const head = `
    <div class="pz-header">
      <h2 class="pz-title">${esc(puzzle.title || "")}</h2>
      ${puzzle.instructions ? `<p class="pz-instructions">${esc(puzzle.instructions)}</p>` : ""}
    </div>`;
  let body = "";
  switch (puzzle.type) {
    case "word_search": body = renderWordSearch(puzzle.content as WordSearchContent, showSolution); break;
    case "crossword": body = renderCrossword(puzzle.content as CrosswordContent, showSolution); break;
    case "word_scramble": body = renderWordScramble(puzzle.content as WordScrambleContent, showSolution); break;
    case "sudoku": body = renderSudoku(puzzle.content as SudokuContent, showSolution); break;
    case "maze": body = renderMaze(puzzle.content as MazeContent, showSolution); break;
    case "memory_match": body = renderMemoryMatch(puzzle.content as MemoryMatchContent, showSolution); break;
    default: body = `<p>Unsupported puzzle type.</p>`;
  }
  return `<section class="pz-puzzle pz-${esc(puzzle.type)}">${head}${body}</section>`;
}

export const PUZZLE_CSS = `
  .pz-puzzle { font-family: Georgia, 'Times New Roman', serif; color: #111; page-break-inside: avoid; margin: 0 auto; max-width: 720px; }
  .pz-header { text-align: center; margin-bottom: 18px; }
  .pz-title { font-size: 24px; margin: 0 0 6px; letter-spacing: 0.02em; }
  .pz-instructions { font-size: 14px; color: #444; margin: 0; }
  .pz-grid { border-collapse: collapse; margin: 0 auto; }
  .pz-grid td { border: 1px solid #222; text-align: center; vertical-align: middle; font-family: 'Courier New', monospace; }
  .pz-ws td { width: 26px; height: 26px; font-size: 16px; font-weight: bold; }
  .pz-wordlist { columns: 3; column-gap: 24px; margin: 18px auto 0; max-width: 640px; font-size: 14px; }
  .pz-wordlist li { break-inside: avoid; margin-bottom: 4px; }
  .pz-cw td { width: 30px; height: 30px; position: relative; font-size: 16px; font-weight: bold; }
  .pz-cw td.block { background: #111; border-color: #111; }
  .pz-cw .num { position: absolute; top: 1px; left: 2px; font-size: 9px; font-weight: normal; font-family: Arial, sans-serif; }
  .pz-clues { display: flex; gap: 32px; margin-top: 18px; font-size: 13px; }
  .pz-clues h3 { font-size: 15px; margin: 0 0 6px; }
  .pz-clues ol { margin: 0; padding-left: 22px; }
  .pz-clues li { margin-bottom: 3px; }
  .pz-scramble { list-style: none; padding: 0; max-width: 560px; margin: 0 auto; font-size: 16px; }
  .pz-scramble li { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; border-bottom: 1px dotted #bbb; }
  .pz-scramble .scrambled { letter-spacing: 4px; font-family: 'Courier New', monospace; font-weight: bold; }
  .pz-scramble .answer { color: #b00; font-weight: bold; }
  .pz-sudoku td { width: 34px; height: 34px; font-size: 18px; font-weight: bold; }
  .pz-sudoku td.given { color: #111; }
  .pz-sudoku td.fill { color: #b00; }
  .pz-sudoku .b-right { border-right: 3px solid #111; }
  .pz-sudoku .b-bottom { border-bottom: 3px solid #111; }
  .pz-maze svg { display: block; margin: 0 auto; }
  .pz-match { display: flex; justify-content: space-between; max-width: 600px; margin: 0 auto; gap: 40px; }
  .pz-match ul { list-style: none; padding: 0; flex: 1; }
  .pz-match li { border: 1px solid #222; border-radius: 4px; padding: 8px 12px; margin-bottom: 10px; font-size: 15px; }
  .pz-answerkey { margin-top: 16px; font-size: 12px; color: #666; }
`;

function renderWordSearch(c: WordSearchContent, showSolution: boolean): string {
  const placedSet = new Set<string>();
  if (showSolution) {
    for (const p of c.placements) {
      for (let i = 0; i < p.word.length; i++) {
        placedSet.add(`${p.row + p.dr * i},${p.col + p.dc * i}`);
      }
    }
  }
  const rows = c.grid.map((row, r) =>
    `<tr>${row.map((ch, cc) => {
      const hit = placedSet.has(`${r},${cc}`);
      const style = hit ? ' style="background:#ffe08a;"' : "";
      return `<td${style}>${esc(ch)}</td>`;
    }).join("")}</tr>`,
  ).join("");
  const list = c.words.slice().sort().map((w) => `<li>${esc(w)}</li>`).join("");
  return `
    <table class="pz-grid pz-ws"><tbody>${rows}</tbody></table>
    <ul class="pz-wordlist">${list}</ul>`;
}

function renderCrossword(c: CrosswordContent, showSolution: boolean): string {
  const rows: string[] = [];
  for (let r = 0; r < c.height; r++) {
    const cells: string[] = [];
    for (let cc = 0; cc < c.width; cc++) {
      const ch = c.grid[r][cc];
      if (!ch) { cells.push(`<td class="block"></td>`); continue; }
      const num = c.numbers[r][cc];
      const numHtml = num ? `<span class="num">${num}</span>` : "";
      const letter = showSolution ? esc(ch) : "";
      cells.push(`<td>${numHtml}${letter}</td>`);
    }
    rows.push(`<tr>${cells.join("")}</tr>`);
  }
  const acrossList = c.across.map((e) => `<li><b>${e.num}.</b> ${esc(e.clue)}</li>`).join("");
  const downList = c.down.map((e) => `<li><b>${e.num}.</b> ${esc(e.clue)}</li>`).join("");
  return `
    <table class="pz-grid pz-cw"><tbody>${rows.join("")}</tbody></table>
    <div class="pz-clues">
      <div><h3>Across</h3><ol style="list-style:none;padding-left:0;">${acrossList}</ol></div>
      <div><h3>Down</h3><ol style="list-style:none;padding-left:0;">${downList}</ol></div>
    </div>`;
}

function renderWordScramble(c: WordScrambleContent, showSolution: boolean): string {
  const items = c.items.map((it) => {
    const right = showSolution
      ? `<span class="answer">${esc(it.answer)}</span>`
      : `<span>${it.clue ? esc(it.clue) : "_______________"}</span>`;
    return `<li><span class="scrambled">${esc(it.scrambled)}</span>${right}</li>`;
  }).join("");
  return `<ul class="pz-scramble">${items}</ul>`;
}

function renderSudoku(c: SudokuContent, showSolution: boolean): string {
  const grid = showSolution ? c.solution : c.puzzle;
  const rows: string[] = [];
  for (let r = 0; r < 9; r++) {
    const cells: string[] = [];
    for (let cc = 0; cc < 9; cc++) {
      const v = grid[r][cc];
      const given = c.puzzle[r][cc] !== 0;
      const cls = [
        given ? "given" : "fill",
        cc % 3 === 2 && cc !== 8 ? "b-right" : "",
        r % 3 === 2 && r !== 8 ? "b-bottom" : "",
      ].filter(Boolean).join(" ");
      cells.push(`<td class="${cls}">${v !== 0 ? v : ""}</td>`);
    }
    rows.push(`<tr>${cells.join("")}</tr>`);
  }
  return `<table class="pz-grid pz-sudoku"><tbody>${rows.join("")}</tbody></table>`;
}

function renderMaze(c: MazeContent, showSolution: boolean): string {
  const cell = 22;
  const pad = 2;
  const w = c.width * cell + pad * 2;
  const h = c.height * cell + pad * 2;
  const lines: string[] = [];
  for (let r = 0; r < c.height; r++) {
    for (let cc = 0; cc < c.width; cc++) {
      const x = pad + cc * cell;
      const y = pad + r * cell;
      const cellData = c.cells[r][cc];
      if (cellData.n) lines.push(`<line x1="${x}" y1="${y}" x2="${x + cell}" y2="${y}" />`);
      if (cellData.w) lines.push(`<line x1="${x}" y1="${y}" x2="${x}" y2="${y + cell}" />`);
      if (r === c.height - 1 && cellData.s) lines.push(`<line x1="${x}" y1="${y + cell}" x2="${x + cell}" y2="${y + cell}" />`);
      if (cc === c.width - 1 && cellData.e) lines.push(`<line x1="${x + cell}" y1="${y}" x2="${x + cell}" y2="${y + cell}" />`);
    }
  }
  let path = "";
  if (showSolution && c.solution.length) {
    const pts = c.solution.map((p) => `${pad + p.c * cell + cell / 2},${pad + p.r * cell + cell / 2}`).join(" ");
    path = `<polyline points="${pts}" fill="none" stroke="#b00" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />`;
  }
  const startMark = `<text x="${pad + cell / 2}" y="${pad + cell / 2 + 4}" font-size="11" text-anchor="middle" fill="#0a0">S</text>`;
  const endMark = `<text x="${pad + (c.width - 1) * cell + cell / 2}" y="${pad + (c.height - 1) * cell + cell / 2 + 4}" font-size="11" text-anchor="middle" fill="#b00">E</text>`;
  return `
    <div class="pz-maze">
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <g stroke="#111" stroke-width="2" stroke-linecap="square">${lines.join("")}</g>
        ${path}${startMark}${endMark}
      </svg>
    </div>`;
}

function renderMemoryMatch(c: MemoryMatchContent, showSolution: boolean): string {
  const left = c.left.map((it) => `<li>${esc(it.text)}</li>`).join("");
  const right = c.right.map((it) => `<li>${esc(it.text)}</li>`).join("");
  let key = "";
  if (showSolution) {
    const leftById = new Map(c.left.map((it) => [it.id, it.text]));
    const rightById = new Map(c.right.map((it) => [it.id, it.text]));
    const pairs = c.answer.map((a) => `${esc(leftById.get(a.left))} → ${esc(rightById.get(a.right))}`).join("; ");
    key = `<div class="pz-answerkey"><b>Answer key:</b> ${pairs}</div>`;
  }
  return `
    <div class="pz-match">
      <ul>${left}</ul>
      <ul>${right}</ul>
    </div>${key}`;
}

export const PUZZLE_TYPE_LABELS: Record<PuzzleType, string> = {
  word_search: "Word Search",
  crossword: "Crossword",
  word_scramble: "Word Scramble",
  sudoku: "Sudoku",
  maze: "Maze",
  memory_match: "Memory Match",
};
