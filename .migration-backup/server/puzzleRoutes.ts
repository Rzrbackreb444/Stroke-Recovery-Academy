import { Router } from "express";
import { z } from "zod";
import puppeteer from "puppeteer";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { getUserId } from "./lib/authUtils";
import { checkProjectLimit, checkExportLimit, recordUsage } from "./rateLimitService";
import {
  generatePuzzleContent,
  renderPuzzleHtml,
  PUZZLE_CSS,
  type PuzzleType,
  type PuzzleConfig,
} from "@shared/puzzleEngine";
import { insertPuzzleBookSchema } from "@shared/schema";

const router = Router();

const PUZZLE_TYPES: PuzzleType[] = [
  "word_search",
  "crossword",
  "word_scramble",
  "sudoku",
  "maze",
  "memory_match",
];

const puzzleConfigSchema = z.object({
  seed: z.number().optional(),
  words: z.array(z.string().max(40)).max(60).optional(),
  clues: z.array(z.object({ answer: z.string().max(40), clue: z.string().max(200) })).max(60).optional(),
  pairs: z.array(z.object({ left: z.string().max(60), right: z.string().max(60) })).max(40).optional(),
  size: z.number().int().min(5).max(25).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});

// ---------------------------------------------------------------------------
// Puzzle books
// ---------------------------------------------------------------------------

router.get("/books", isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const books = await storage.getPuzzleBooks(userId);
  res.json(books);
});

router.post("/books", isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const existing = await storage.getPuzzleBooks(userId);
  const limit = await checkProjectLimit(userId, existing.length);
  if (!limit.allowed) {
    return res.status(429).json({ message: limit.message || "Project limit reached", limit });
  }

  const parsed = insertPuzzleBookSchema.omit({ ownerId: true }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid book data", errors: parsed.error.flatten() });
  }

  const book = await storage.createPuzzleBook({ ...parsed.data, ownerId: userId });
  res.status(201).json(book);
});

router.get("/books/:id", isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const book = await storage.getPuzzleBook(Number(req.params.id));
  if (!book || book.ownerId !== userId) return res.status(404).json({ message: "Not found" });
  const items = await storage.getPuzzles(book.id);
  res.json({ ...book, puzzles: items });
});

router.patch("/books/:id", isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const book = await storage.getPuzzleBook(Number(req.params.id));
  if (!book || book.ownerId !== userId) return res.status(404).json({ message: "Not found" });

  const parsed = insertPuzzleBookSchema.omit({ ownerId: true }).partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid book data", errors: parsed.error.flatten() });
  }
  const updated = await storage.updatePuzzleBook(book.id, parsed.data);
  res.json(updated);
});

router.delete("/books/:id", isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const book = await storage.getPuzzleBook(Number(req.params.id));
  if (!book || book.ownerId !== userId) return res.status(404).json({ message: "Not found" });
  await storage.deletePuzzleBook(book.id);
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// Puzzles
// ---------------------------------------------------------------------------

const createPuzzleSchema = z.object({
  type: z.enum(PUZZLE_TYPES as [PuzzleType, ...PuzzleType[]]),
  title: z.string().max(160).optional(),
  instructions: z.string().max(600).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  config: puzzleConfigSchema.default({}),
});

router.post("/books/:id/puzzles", isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const book = await storage.getPuzzleBook(Number(req.params.id));
  if (!book || book.ownerId !== userId) return res.status(404).json({ message: "Not found" });

  const parsed = createPuzzleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid puzzle data", errors: parsed.error.flatten() });
  }

  let content;
  try {
    content = generatePuzzleContent(parsed.data.type, parsed.data.config as PuzzleConfig);
  } catch (err: any) {
    return res.status(422).json({ message: err?.message || "Could not generate puzzle" });
  }

  const existing = await storage.getPuzzles(book.id);
  const puzzle = await storage.createPuzzle({
    bookId: book.id,
    type: parsed.data.type,
    title: parsed.data.title ?? "",
    instructions: parsed.data.instructions ?? "",
    difficulty: parsed.data.difficulty ?? "medium",
    position: existing.length,
    config: parsed.data.config,
    content,
  });
  res.status(201).json(puzzle);
});

async function loadOwnedPuzzle(req: any, userId: string) {
  const puzzle = await storage.getPuzzle(Number(req.params.id));
  if (!puzzle) return null;
  const book = await storage.getPuzzleBook(puzzle.bookId);
  if (!book || book.ownerId !== userId) return null;
  return puzzle;
}

const updatePuzzleSchema = z.object({
  title: z.string().max(160).optional(),
  instructions: z.string().max(600).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  config: puzzleConfigSchema.optional(),
  regenerate: z.boolean().optional(),
});

router.patch("/puzzles/:id", isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const puzzle = await loadOwnedPuzzle(req, userId);
  if (!puzzle) return res.status(404).json({ message: "Not found" });

  const parsed = updatePuzzleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid puzzle data", errors: parsed.error.flatten() });
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.instructions !== undefined) updates.instructions = parsed.data.instructions;
  if (parsed.data.difficulty !== undefined) updates.difficulty = parsed.data.difficulty;

  if (parsed.data.config !== undefined) {
    updates.config = parsed.data.config;
    if (parsed.data.regenerate !== false) {
      try {
        updates.content = generatePuzzleContent(puzzle.type as PuzzleType, parsed.data.config as PuzzleConfig);
      } catch (err: any) {
        return res.status(422).json({ message: err?.message || "Could not regenerate puzzle" });
      }
    }
  }

  const updated = await storage.updatePuzzle(puzzle.id, updates);
  res.json(updated);
});

router.post("/puzzles/:id/regenerate", isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const puzzle = await loadOwnedPuzzle(req, userId);
  if (!puzzle) return res.status(404).json({ message: "Not found" });

  const baseConfig = (puzzle.config as PuzzleConfig) || {};
  const config: PuzzleConfig = { ...baseConfig, seed: Math.floor(Math.random() * 1_000_000) };
  let content;
  try {
    content = generatePuzzleContent(puzzle.type as PuzzleType, config);
  } catch (err: any) {
    return res.status(422).json({ message: err?.message || "Could not regenerate puzzle" });
  }
  const updated = await storage.updatePuzzle(puzzle.id, { config, content });
  res.json(updated);
});

router.delete("/puzzles/:id", isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const puzzle = await loadOwnedPuzzle(req, userId);
  if (!puzzle) return res.status(404).json({ message: "Not found" });
  await storage.deletePuzzle(puzzle.id);
  res.json({ success: true });
});

const reorderSchema = z.object({ orderedIds: z.array(z.number().int()).max(500) });

router.post("/books/:id/reorder", isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const book = await storage.getPuzzleBook(Number(req.params.id));
  if (!book || book.ownerId !== userId) return res.status(404).json({ message: "Not found" });

  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid reorder payload" });
  }
  await storage.reorderPuzzles(book.id, parsed.data.orderedIds);
  const items = await storage.getPuzzles(book.id);
  res.json(items);
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

function buildBookHtml(
  book: { title: string; subtitle?: string | null; authorName?: string | null },
  items: { type: string; title: string | null; instructions: string | null; content: unknown }[],
  opts: { showSolutions: boolean; printReady: boolean },
): string {
  const puzzlePages = items
    .map((p) =>
      renderPuzzleHtml(
        {
          type: p.type as PuzzleType,
          title: p.title || "",
          instructions: p.instructions || "",
          content: p.content as any,
        },
        { showSolution: false },
      ),
    )
    .map((html) => `<div class="pz-page">${html}</div>`)
    .join("\n");

  const solutionPages = opts.showSolutions
    ? items
        .map((p) =>
          renderPuzzleHtml(
            {
              type: p.type as PuzzleType,
              title: `${p.title || ""} — Solution`,
              instructions: "",
              content: p.content as any,
            },
            { showSolution: true },
          ),
        )
        .map((html) => `<div class="pz-page">${html}</div>`)
        .join("\n")
    : "";

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { margin: 0; }
  body { margin: 0; }
  .pz-page { page-break-after: always; padding: 0.75in 0.625in; box-sizing: border-box; }
  .pz-cover { text-align: center; padding: 3in 0.625in; page-break-after: always; font-family: Georgia, serif; color: #111; }
  .pz-cover h1 { font-size: 40px; margin: 0 0 12px; }
  .pz-cover h2 { font-size: 20px; font-weight: normal; color: #555; margin: 0 0 24px; }
  .pz-cover .pz-author { font-size: 16px; color: #333; }
  .pz-section-break { text-align: center; padding: 3in 0.625in; page-break-after: always; font-family: Georgia, serif; }
  ${PUZZLE_CSS}
</style>
</head>
<body>
  <div class="pz-cover">
    <h1>${esc(book.title)}</h1>
    ${book.subtitle ? `<h2>${esc(book.subtitle)}</h2>` : ""}
    ${book.authorName ? `<div class="pz-author">by ${esc(book.authorName)}</div>` : ""}
  </div>
  ${puzzlePages}
  ${opts.showSolutions ? `<div class="pz-section-break"><h1>Solutions</h1></div>${solutionPages}` : ""}
</body>
</html>`;
}

router.get("/books/:id/export", isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const book = await storage.getPuzzleBook(Number(req.params.id));
  if (!book || book.ownerId !== userId) return res.status(404).json({ message: "Not found" });

  const limit = await checkExportLimit(userId);
  if (!limit.allowed) {
    return res.status(429).json({ message: limit.message || "Export limit reached", limit });
  }

  const items = await storage.getPuzzles(book.id);
  if (items.length === 0) {
    return res.status(422).json({ message: "Add at least one puzzle before exporting." });
  }

  const printReady = req.query.format === "print";
  const html = buildBookHtml(book, items, { showSolutions: true, printReady });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      width: "8.5in",
      height: "11in",
      printBackground: true,
    });
    await recordUsage(userId, "export");
    const filename = `${book.title.replace(/[^a-zA-Z0-9]/g, "_")}${printReady ? "_print" : ""}_${Date.now()}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (err: any) {
    res.status(500).json({ message: err?.message || "Export failed" });
  } finally {
    await browser.close();
  }
});

export default router;
