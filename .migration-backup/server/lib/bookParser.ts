import fs from "fs";
import path from "path";

export interface TocEntry {
  id: string;
  title: string;
  type: "frontmatter" | "quickstart" | "howto" | "part_header" | "chapter" | "tribe" | "appendix" | "backmatter";
  partLabel?: string;
  chapterNum?: string;
  lineStart: number;
  lineEnd: number;
}

let _toc: TocEntry[] | null = null;
let _lines: string[] | null = null;

function getLines(): string[] {
  if (_lines) return _lines;
  const p = path.join(process.cwd(), "attached_assets/book_v2/THE-ULTIMATE-STROKE-RECOVERY-REVOLUTION-v3.md");
  _lines = fs.readFileSync(p, "utf8").split("\n");
  return _lines;
}

function slug(title: string, idx: number): string {
  return `${idx}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)}`;
}

export function getToc(): TocEntry[] {
  if (_toc) return _toc;
  const lines = getLines();
  const toc: TocEntry[] = [];
  let currentPartLabel: string | undefined;

  const push = (entry: Omit<TocEntry, "id" | "lineEnd">, lineStart: number) => {
    toc.push({ ...entry, id: slug(entry.title, toc.length), lineStart, lineEnd: -1 });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Part markers (# PART X)
    if (/^# PART (I|II|III|IV|V|VI|VII)/.test(line)) {
      currentPartLabel = line.replace(/^# /, "");
      // next non-empty line is the subtitle
      let subtitle = "";
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j].trim() && !lines[j].startsWith("#")) { subtitle = lines[j].trim(); break; }
      }
      push({ title: currentPartLabel + (subtitle ? ` — ${subtitle}` : ""), type: "part_header", partLabel: currentPartLabel }, i);
      continue;
    }

    // Chapter headings (## Chapter N:)
    const chapMatch = line.match(/^## (Chapter (\d+[\u00BD]?):?\s*(.*))/);
    if (chapMatch) {
      push({ title: chapMatch[1], type: "chapter", chapterNum: chapMatch[2], partLabel: currentPartLabel }, i);
      continue;
    }

    // Front matter
    if (/^## (Copyright|Dedication|Epigraph|A Note Before You Start|Disclaimer|Foreword|Author's Note|How to Read This Book|Table of Contents|Introduction)/.test(line)) {
      push({ title: line.replace(/^## /, ""), type: "frontmatter" }, i);
      continue;
    }

    // Quick-start card
    if (/^# Quick-Start Card/.test(line)) {
      push({ title: "Quick-Start Card", type: "quickstart" }, i);
      continue;
    }

    // How to use
    if (/^# How to Use This Book/.test(line)) {
      push({ title: "How to Use This Book", type: "howto" }, i);
      continue;
    }

    // Stories from the Tribe (Part VII)
    if (/^# PART VII/.test(line)) {
      currentPartLabel = "PART VII";
      push({ title: "Part VII — Stories from the Tribe", type: "part_header", partLabel: "PART VII" }, i);
      continue;
    }
    if (/^## Case \d/.test(line) || /^## What These Nine/.test(line)) {
      push({ title: line.replace(/^## /, ""), type: "tribe", partLabel: currentPartLabel }, i);
      continue;
    }

    // Appendices
    const appMatch = line.match(/^## (Appendix ([A-Z]):?\s*(.*))/);
    if (appMatch) {
      push({ title: appMatch[1], type: "appendix" }, i);
      continue;
    }

    // Builder's Science Sidebar (appears between appendices)
    if (/^## Builder's Science Sidebar/.test(line)) {
      push({ title: line.replace(/^## /, ""), type: "appendix" }, i);
      continue;
    }

    // Backmatter
    if (/^# (THE SOUNDTRACK|Acknowledgments|About the Author|The Builder's Seal)/.test(line)) {
      push({ title: line.replace(/^# /, ""), type: "backmatter" }, i);
      continue;
    }
  }

  // Fill lineEnd for each entry
  for (let i = 0; i < toc.length; i++) {
    toc[i].lineEnd = i + 1 < toc.length ? toc[i + 1].lineStart - 1 : lines.length - 1;
  }

  _toc = toc;
  return toc;
}

export function getChapter(id: string): { entry: TocEntry; markdown: string } | null {
  const toc = getToc();
  const entry = toc.find(e => e.id === id);
  if (!entry) return null;
  const lines = getLines();
  const markdown = lines.slice(entry.lineStart, entry.lineEnd + 1).join("\n");
  return { entry, markdown };
}
