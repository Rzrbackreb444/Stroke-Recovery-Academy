import fs from 'fs';
import path from 'path';
import url from 'url';
import MarkdownIt from 'markdown-it';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const ROOT = path.resolve('attached_assets/book_v2');
const MD = path.join(ROOT, 'THE-ULTIMATE-STROKE-RECOVERY-REVOLUTION-v3.md');
const TMP_FRONT_HTML = path.join(ROOT, '.front.html');
const TMP_BODY_HTML = path.join(ROOT, '.body.html');
const TMP_FRONT_PDF = path.join(ROOT, '.front.pdf');
const TMP_BODY_PDF = path.join(ROOT, '.body.pdf');
const OUT_PDF = path.join(ROOT, 'THE-ULTIMATE-STROKE-RECOVERY-REVOLUTION.pdf');

const FS = path.resolve('node_modules/@fontsource');
const fontUrl = (rel) => url.pathToFileURL(path.join(FS, rel)).href;

const FONT_FACES = `
@font-face { font-family: 'Cinzel'; font-weight: 600; font-style: normal; src: url('${fontUrl('cinzel/files/cinzel-latin-600-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'Cinzel'; font-weight: 700; font-style: normal; src: url('${fontUrl('cinzel/files/cinzel-latin-700-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'Cinzel'; font-weight: 800; font-style: normal; src: url('${fontUrl('cinzel/files/cinzel-latin-800-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'Cinzel'; font-weight: 900; font-style: normal; src: url('${fontUrl('cinzel/files/cinzel-latin-900-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'Crimson Pro'; font-weight: 400; font-style: normal; src: url('${fontUrl('crimson-pro/files/crimson-pro-latin-400-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'Crimson Pro'; font-weight: 400; font-style: italic; src: url('${fontUrl('crimson-pro/files/crimson-pro-latin-400-italic.woff2')}') format('woff2'); }
@font-face { font-family: 'Crimson Pro'; font-weight: 600; font-style: normal; src: url('${fontUrl('crimson-pro/files/crimson-pro-latin-600-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'Crimson Pro'; font-weight: 700; font-style: normal; src: url('${fontUrl('crimson-pro/files/crimson-pro-latin-700-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'Crimson Pro'; font-weight: 700; font-style: italic; src: url('${fontUrl('crimson-pro/files/crimson-pro-latin-700-italic.woff2')}') format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 600; font-style: normal; src: url('${fontUrl('inter/files/inter-latin-600-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 700; font-style: normal; src: url('${fontUrl('inter/files/inter-latin-700-normal.woff2')}') format('woff2'); }
`;

// ---------- 1. READ + STRIP EDITORIAL CRUFT ----------
let raw = fs.readFileSync(MD, 'utf8');

// Strip entire Foreword section (placeholder TBD) — runs through closing --- + blank line
raw = raw.replace(/^## Foreword\b[\s\S]*?(?=^## Author)/m, '');

// Strip ISBN [TO BE ASSIGNED] lines
raw = raw.replace(/^ISBN[^\n]*\[TO BE ASSIGNED\][^\n]*\n?/gm, '');

// Strip END OF BOOK + cover-art TBD line
raw = raw.replace(/^\*\*END OF BOOK\*\*\s*\n?/gm, '');
raw = raw.replace(/^\*Cover art and album art by \[TBD\][^\n]*\n?/gm, '');

// Strip TOC Foreword line
raw = raw.replace(/^\*\*Foreword\*\*[^\n]*\(to be solicited[^\n]*\n?/gm, '');

// App H fact-checker placeholder sentence rewrite
raw = raw.replace(
  /Two independent fact-checkers \(\[ NAME \], \[ NAME \]\)[^.]*\./,
  'Citations in this print edition will be independently verified before second printing;'
);

// Drop any line containing a [ NAME / NAMES / firm / studio / city / institution / year / Year / Title / Outside / DATE ] placeholder bracket
raw = raw.split('\n').filter(line =>
  !/\[\s*(NAME|NAMES|firm|studio|city|institution|year|Year|Title|Outside|DATE)\b[^\]]*\]/.test(line)
).join('\n');

// Drop the now-orphaned "**My beta readers** ... :" intro paragraph
raw = raw.replace(/^\*\*My beta readers\*\*[^\n]*\n?/gm, '');

// Drop the now-orphaned "**The Hostile Construction collaborators:**" header
raw = raw.replace(/^\*\*The Hostile Construction collaborators:\*\*\s*\n?/gm, '');

// TOC: separate the 4 trailing back-matter lines (consecutive bold lines collapse into one paragraph)
raw = raw.replace(
  /\*\*The Soundtrack: Hostile Construction\*\*\s*\n\*\*Acknowledgments\*\*\s*\n\*\*About the Author\*\*\s*\n\*\*The Builder.s Seal\*\*/,
  '- The Soundtrack: Hostile Construction\n- Acknowledgments\n- About the Author\n- The Builder\u2019s Seal'
);

// TOC: promote "Part VII —" and "Appendices" to H3 so they render in orange Inter caps like the other Part headers
raw = raw.replace(/^\*\*Part VII —([^*]+)\*\*([^\n]*)$/m, '### Part VII —$1$2');
raw = raw.replace(/^\*\*Appendices\*\*\s*$/m, '### Appendices');

// TOC front-matter cluster: 4 consecutive bold lines collapse into one paragraph; convert to bullet list
raw = raw.replace(
  /\*\*Author.s Note: The Sasquatch Battle Cry\*\*\s*\n\*\*Preface\*\*\s*\n\*\*How to Read This Book\*\*/,
  "- Author\u2019s Note: The Sasquatch Battle Cry\n- Preface\n- How to Read This Book"
);

// Demote back-matter H1 (Acknowledgments / About the Author / The Builder's Seal) to H2 so
// they get standard chapter-head treatment, NOT part-divider treatment (which centers them
// vertically on a near-empty page with content pushed to the next page).
raw = raw.replace(/^# Acknowledgments\s*$/m, '## Acknowledgments');
raw = raw.replace(/^# About the Author\s*$/m, '## About the Author');
raw = raw.replace(/^# The Builder.s Seal\s*$/m, '## The Builder\u2019s Seal');

// Collapse any 4+ consecutive newlines from deletions
raw = raw.replace(/\n{4,}/g, '\n\n\n');

// ---------- 2. SPLIT FRONT MATTER / BODY ----------
const SPLIT_MARKER = '# PART I — THE STORM';
const splitIdx = raw.indexOf(SPLIT_MARKER);
if (splitIdx < 0) throw new Error('Body split marker not found');
let frontMD = raw.slice(0, splitIdx);
const bodyMD = raw.slice(splitIdx);

// ---------- 3. CUSTOM TITLE PAGE (replaces markdown title block) ----------
const qrUrl = url.pathToFileURL(path.join(ROOT, 'images/qr-scan-me.png')).href;
const titleBlock = `
<div class="title-page">
  <div class="title-inner">
    <div class="title-rule"></div>
    <h1 class="book-title-main">The Ultimate<br/>Stroke Recovery<br/>Revolution</h1>
    <div class="title-rule"></div>
    <p class="title-subtitle">From 0% to 90%+ and Still Rising</p>
    <p class="title-tagline">The battle-tested blueprint defying every "never."</p>
    <div class="title-spacer"></div>
    <p class="title-author">Nicholas "Stroked-Out Sasquatch" Kremers</p>
    <p class="title-author-credit">Founder · Stroke Recovery Academy</p>
    <p class="title-promise"><em>Because recovery isn't healing &mdash; it's construction.</em></p>
    <img class="title-qr" src="${qrUrl}" alt="" />
    <p class="title-qr-caption">strokerecoveryacademy.com/book</p>
  </div>
</div>

`;

// Remove original title H1 + subtitle through QR + closing ---
frontMD = frontMD.replace(/^# THE ULTIMATE[\s\S]*?^---\n/m, titleBlock + '\n');

// ---------- 4. RENDER MARKDOWN ----------
const md = new MarkdownIt({ html: true, linkify: true, typographer: true, breaks: false });

// ---------- 5. POST-PROCESS HTML PER SECTION ----------
function postProcess(htmlInput, opts = {}) {
  const $ = cheerio.load(`<div id="book">${htmlInput}</div>`, { decodeEntities: false });

  // Resolve relative image paths
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (!/^(https?:|file:|data:)/.test(src)) {
      const abs = path.resolve(ROOT, src);
      $(el).attr('src', url.pathToFileURL(abs).href);
    }
  });

  // Trim QR alt
  $('img[src*="qr-scan-me"]').attr('alt', '');

  // Identify chapter-opening headings
  const isChapterH2 = (text) =>
    /^(Chapter\s|Case\s|Case Study\s|Appendix\s|Copyright|Dedication|Epigraph|A Note Before|Disclaimer|Author.s Note|Preface|How to Read|How to Use|Table of Contents|Introduction|Day\s\d|Always|What These Nine|Breakdown to|The Science of|Breakthrough Techniques|The Psychology|Beyond Comeback|Inspiring Others|Acknowledgments|About the Author|The Builder.s Seal|The Soundtrack|Stories from the Tribe|Mental Mastery)/i
      .test(text.trim());

  $('#book > h1, #book > h2').each((_, el) => {
    const $el = $(el);
    const tag = el.tagName.toLowerCase();
    const text = $el.text();
    if (tag === 'h2' && !isChapterH2(text)) return;
    $el.addClass('chapter-head');
    if (tag === 'h1') $el.addClass('part-divider');

    // Skip drop-cap entirely for TOC (first item is bold structural list, not body prose)
    if (/^Table of Contents/i.test(text.trim())) return;

    // Find first true body paragraph for drop cap
    let $cur = $el.next();
    while ($cur.length) {
      const t = $cur.prop('tagName')?.toLowerCase();
      if (t === 'h1' || t === 'h2' || t === 'h3' || t === 'h4') break;
      if (t === 'p') {
        const inner = ($cur.html() || '').trim();
        const text2 = $cur.text().trim();
        const isImageOnly = /^<img\b[^>]*>$/i.test(inner);
        const isStrongOnly = /^<strong>[^<]+<\/strong>\.?$/i.test(inner);
        const isEmOnly = /^<em>[^<]+<\/em>\.?$/i.test(inner);
        const isShort = text2.length < 50;
        const isAttr = /^—\s/.test(text2);
        if (!isImageOnly && !isStrongOnly && !isEmOnly && !isShort && !isAttr) {
          $cur.addClass('chapter-opener');
          break;
        }
      }
      $cur = $cur.next();
    }
  });

  // Vertically center short standalone front-matter pages
  if (opts.front) {
    ['Dedication', 'Epigraph', 'A Note Before You Start'].forEach(label => {
      $('#book > h2.chapter-head').each((_, el) => {
        const $el = $(el);
        if (!$el.text().trim().toLowerCase().startsWith(label.toLowerCase())) return;
        $el.addClass('center-page-head');
      });
    });
  }

  // hr → scene break
  $('hr').addClass('scene-break');

  // Mark attribution / signature paragraphs (start with em-dash) so we can keep them with prev block
  $('#book > p').each((_, el) => {
    const $el = $(el);
    const t = $el.text().trim();
    if (/^—\s/.test(t) && t.length < 80) $el.addClass('attribution');
  });

  return $('#book').parent().html();
}

const frontHtmlBody = postProcess(md.render(frontMD), { front: true });
const bodyHtmlBody = postProcess(md.render(bodyMD), { front: false });

// ---------- 6. ASSEMBLE FULL HTML ----------
const css = fs.readFileSync(path.resolve('scripts/book.css'), 'utf8');

function fullHtml(inner) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<title>The Ultimate Stroke Recovery Revolution</title>
<style>${FONT_FACES}\n${css}</style>
</head><body>${inner}</body></html>`;
}

fs.writeFileSync(TMP_FRONT_HTML, fullHtml(frontHtmlBody));
fs.writeFileSync(TMP_BODY_HTML, fullHtml(bodyHtmlBody));

// ---------- 7. RENDER BOTH PDFs ----------
const browser = await puppeteer.launch({
  headless: true,
  executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
});

async function renderPdf(htmlPath, outPdf) {
  const page = await browser.newPage();
  await page.goto(url.pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0', timeout: 180000 });
  await page.evaluateHandle('document.fonts.ready');
  await page.pdf({
    path: outPdf,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.85in', bottom: '0.85in', left: '0.95in', right: '0.95in' },
    displayHeaderFooter: false,
    preferCSSPageSize: false,
  });
  await page.close();
}

await renderPdf(TMP_FRONT_HTML, TMP_FRONT_PDF);
await renderPdf(TMP_BODY_HTML, TMP_BODY_PDF);
await browser.close();

// ---------- 8. MERGE + STAMP PAGE NUMBERS ----------
function romanize(n) {
  const m = [['m',1000],['cm',900],['d',500],['cd',400],['c',100],['xc',90],['l',50],['xl',40],['x',10],['ix',9],['v',5],['iv',4],['i',1]];
  let s = ''; for (const [k,v] of m) { while (n >= v) { s += k; n -= v; } } return s;
}

const finalDoc = await PDFDocument.create();
const font = await finalDoc.embedFont(StandardFonts.TimesRoman);

function stampNumber(page, text) {
  const { width } = page.getSize();
  const size = 10;
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (width - w) / 2,
    y: 32,
    size,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });
}

const frontDoc = await PDFDocument.load(fs.readFileSync(TMP_FRONT_PDF));
const bodyDoc = await PDFDocument.load(fs.readFileSync(TMP_BODY_PDF));

const frontPages = await finalDoc.copyPages(frontDoc, frontDoc.getPageIndices());
frontPages.forEach((p, i) => {
  finalDoc.addPage(p);
  // Cover (i=0) unnumbered. Numbering "ii" begins on the second front-matter page.
  if (i === 0) return;
  stampNumber(p, romanize(i + 1));
});

const bodyPages = await finalDoc.copyPages(bodyDoc, bodyDoc.getPageIndices());
bodyPages.forEach((p, i) => {
  finalDoc.addPage(p);
  stampNumber(p, String(i + 1));
});

const bytes = await finalDoc.save();
fs.writeFileSync(OUT_PDF, bytes);

// Cleanup temp files
[TMP_FRONT_HTML, TMP_BODY_HTML, TMP_FRONT_PDF, TMP_BODY_PDF].forEach(f => {
  try { fs.unlinkSync(f); } catch {}
});

console.log(`PDF: ${OUT_PDF}`);
console.log(`  Front matter: ${frontPages.length} pages (cover + ${frontPages.length - 1} numbered i..${romanize(frontPages.length)})`);
console.log(`  Body:         ${bodyPages.length} pages (1..${bodyPages.length})`);
console.log(`  Total:        ${frontPages.length + bodyPages.length} pages, ${(bytes.length/1024/1024).toFixed(1)} MB`);
