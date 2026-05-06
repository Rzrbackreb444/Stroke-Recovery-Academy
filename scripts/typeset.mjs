import fs from 'fs';
import path from 'path';
import url from 'url';
import MarkdownIt from 'markdown-it';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

const ROOT = path.resolve('attached_assets/book_v2');
const MD = path.join(ROOT, 'THE-ULTIMATE-STROKE-RECOVERY-REVOLUTION-v3.md');
const OUT_HTML = path.join(ROOT, 'book-typeset.html');
const OUT_PDF = path.join(ROOT, 'THE-ULTIMATE-STROKE-RECOVERY-REVOLUTION.pdf');

const md = new MarkdownIt({ html: true, linkify: true, typographer: true, breaks: false });

const raw = fs.readFileSync(MD, 'utf8');
let html = md.render(raw);

const $ = cheerio.load(`<div id="book">${html}</div>`, { decodeEntities: false });

// Resolve relative image paths to file:// URLs so puppeteer can load them
$('img').each((_, el) => {
  const src = $(el).attr('src') || '';
  if (!/^(https?:|file:|data:)/.test(src)) {
    const abs = path.resolve(ROOT, src);
    $(el).attr('src', url.pathToFileURL(abs).href);
  }
});

// Identify chapter-opening headings (H1 + most H2s, but NOT minor part-section dividers
// that already sit inside a Part). Page-break before these AND drop-cap the first paragraph.
const isChapterH2 = (text) =>
  /^(Chapter\s|Case\s|Case Study\s|Appendix\s|Copyright|Dedication|Epigraph|A Note Before|Disclaimer|Foreword|Author's Note|Preface|How to Read|Table of Contents|Introduction|From 0%|Day\s\d|Always|Builder's Science Sidebar|What These Nine|Breakdown to|The Science of|Breakthrough Techniques|The Psychology|Beyond Comeback|Inspiring Others)/i.test(text.trim());

$('#book > h1, #book > h2').each((_, el) => {
  const $el = $(el);
  const tag = el.tagName.toLowerCase();
  const text = $el.text();

  if (tag === 'h2' && !isChapterH2(text)) return;

  $el.addClass('chapter-head');

  // Walk forward to first <p> that isn't inside a blockquote/list — that's the body opener.
  let $cur = $el.next();
  while ($cur.length) {
    const t = $cur.prop('tagName')?.toLowerCase();
    if (t === 'h1' || t === 'h2' || t === 'h3') break;
    if (t === 'p') {
      // Skip pure image-only paragraphs
      const inner = $cur.html()?.trim() || '';
      const isImageOnly = /^<img\b[^>]*>$/i.test(inner);
      if (!isImageOnly) {
        $cur.addClass('chapter-opener');
        break;
      }
    }
    $cur = $cur.next();
  }
});

// Promote horizontal rules already in the source as soft scene breaks rather than page breaks
$('hr').addClass('scene-break');

// Mark the title block specifically (first H1 at very top)
$('#book > h1').first().addClass('book-title');

const cssPath = path.resolve('scripts/book.css');
const css = fs.readFileSync(cssPath, 'utf8');

const finalHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>The Ultimate Stroke Recovery Revolution</title>
<style>${css}</style>
</head>
<body>
${$('#book').parent().html()}
</body>
</html>`;

fs.writeFileSync(OUT_HTML, finalHtml);
console.log('HTML:', OUT_HTML, fs.statSync(OUT_HTML).size, 'bytes');

const browser = await puppeteer.launch({
  headless: true,
  executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
});
const page = await browser.newPage();
await page.goto(url.pathToFileURL(OUT_HTML).href, { waitUntil: 'networkidle0', timeout: 120000 });
await page.pdf({
  path: OUT_PDF,
  format: 'Letter',
  printBackground: true,
  margin: { top: '0.85in', bottom: '0.85in', left: '0.95in', right: '0.95in' },
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: `
    <div style="font-family: 'Source Serif Pro', Georgia, serif; font-size: 9px; color: #666; width: 100%; text-align: center; padding: 0 1in;">
      <span class="pageNumber"></span>
    </div>`,
  preferCSSPageSize: false,
});
await browser.close();
console.log('PDF :', OUT_PDF, fs.statSync(OUT_PDF).size, 'bytes');
