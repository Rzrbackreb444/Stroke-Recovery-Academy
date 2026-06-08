import fs from 'fs';
import path from 'path';
import url from 'url';
import MarkdownIt from 'markdown-it';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const ROOT = path.resolve('attached_assets/book_v2');
const MD = path.join(ROOT, 'SAMPLE-preview.md');
const TMP_HTML = path.join(ROOT, '.sample.html');
const TMP_PDF = path.join(ROOT, '.sample.pdf');
const OUT_PDF = path.resolve('public/book/sample.pdf');

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

let raw = fs.readFileSync(MD, 'utf8');
raw = raw.replace(/^\*\*END OF BOOK\*\*\s*\n?/gm, '');
raw = raw.replace(/\n---\s*\n*$/g, '\n').replace(/\s+$/, '\n');
raw = raw.replace(/\n{4,}/g, '\n\n\n');

// Cover + title page
const WEB_IMG_DIR = path.join(ROOT, 'images-web');
const hasWebImages = fs.existsSync(WEB_IMG_DIR);
function resolveImg(relName) {
  if (hasWebImages) {
    const jpg = path.join(WEB_IMG_DIR, relName.replace(/\.png$/i, '.jpg'));
    if (fs.existsSync(jpg)) return jpg;
  }
  return path.join(ROOT, 'images', relName);
}
const coverPath = resolveImg('sasquatch-cover.png');
const coverB64 = fs.readFileSync(coverPath).toString('base64');
const coverMime = coverPath.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
const coverUrl = `data:${coverMime};base64,${coverB64}`;
const qrUrl = url.pathToFileURL(resolveImg('qr-scan-me.png')).href;
const titleBlock = `
<div class=\"cover-page\"><img class=\"cover-image\" src=\"${coverUrl}\" alt=\"The Ultimate Stroke Recovery Revolution\" /></div>
<div class=\"title-page\">
  <div class=\"title-inner\">
    <div class=\"title-rule\"></div>
    <h1 class=\"book-title-main\">The Ultimate<br/>Stroke Recovery<br/>Revolution</h1>
    <div class=\"title-rule\"></div>
    <p class=\"title-subtitle\">From 0% to 90%+ and Still Rising</p>
    <p class=\"title-tagline\">The battle-tested blueprint defying every \"never.\"</p>
    <div class=\"title-spacer\"></div>
    <p class=\"title-author\">Nicholas \"Stroked-Out Sasquatch\" Kremers</p>
    <p class=\"title-author-credit\">Founder &middot; Stroke Recovery Academy</p>
    <p class=\"title-promise\"><em>Because recovery isn't healing &mdash; it's construction.</em></p>
    <img class=\"title-qr\" src=\"${qrUrl}\" alt=\"\" />
    <p class=\"title-qr-caption\">strokerecoveryacademy.com/book</p>
  </div>
</div>
`;

raw = raw.replace(/^# THE ULTIMATE[\s\S]*?(?=^## Copyright)/m, titleBlock + '\n');

const md = new MarkdownIt({ html: true, linkify: true, typographer: true, breaks: false });

function postProcess(htmlInput, opts = {}) {
  const $ = cheerio.load(`<div id=\"book\">${htmlInput}</div>`, { decodeEntities: false });

  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (/^(https?:|file:|data:)/.test(src)) return;
    let resolved = src;
    if (hasWebImages) {
      const m = src.match(/(^|\/)images\/([^/]+)\.png$/i);
      if (m) resolved = src.replace(/images\/([^/]+)\.png$/i, 'images-web/$1.jpg');
    }
    const abs = path.resolve(ROOT, resolved);
    if (fs.existsSync(abs)) {
      $(el).attr('src', url.pathToFileURL(abs).href);
    } else {
      $(el).attr('src', url.pathToFileURL(path.resolve(ROOT, src)).href);
    }
  });

  $('img[src*=\"qr-scan-me\"]').attr('alt', '');

  const isChapterH2 = (text) =>
    /^(Chapter\s|Case\s|Case Study\s|Appendix\s|Copyright|Dedication|Epigraph|A Note Before|Disclaimer|Foreword|Author.s Note|Preface|How to Read|How to Use|Table of Contents|Introduction|Day\s\d|Always|What These Nine|Breakdown to|The Science of|Breakthrough Techniques|The Psychology|Beyond Comeback|Inspiring Others|Acknowledgments|About the Author|The Builder.s Seal|The Soundtrack|Stories from the Tribe|Mental Mastery|Sample Preview)/i
      .test(text.trim());

  $('#book > h1, #book > h2').each((_, el) => {
    const $el = $(el);
    const tag = el.tagName.toLowerCase();
    const text = $el.text();
    if (tag === 'h2' && !isChapterH2(text)) return;
    $el.addClass('chapter-head');
    if (tag === 'h1') $el.addClass('part-divider');

    if (/^Table of Contents/i.test(text.trim())) return;

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
        const isAttr = /^\u2014\s/.test(text2);
        if (!isImageOnly && !isStrongOnly && !isEmOnly && !isShort && !isAttr) {
          $cur.addClass('chapter-opener');
          break;
        }
      }
      $cur = $cur.next();
    }
  });

  if (opts.front) {
    ['Dedication', 'Epigraph', 'A Note Before You Start'].forEach(label => {
      $('#book > h2.chapter-head').each((_, el) => {
        const $el = $(el);
        if (!$el.text().trim().toLowerCase().startsWith(label.toLowerCase())) return;
        $el.addClass('center-page-head');
      });
    });
  }

  $('hr').addClass('scene-break');

  $('#book > p').each((_, el) => {
    const $el = $(el);
    const t = $el.text().trim();
    if (/^\u2014\s/.test(t) && t.length < 80) $el.addClass('attribution');
  });

  return $('#book').parent().html();
}

const htmlBody = postProcess(md.render(raw), { front: true });
const css = fs.readFileSync(path.resolve('scripts/book.css'), 'utf8');

const fullHtml = `<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"/><title>The Ultimate Stroke Recovery Revolution — Sample Preview</title><style>${FONT_FACES}\n${css}</style></head><body>${htmlBody}</body></html>`;
fs.writeFileSync(TMP_HTML, fullHtml);

const browser = await puppeteer.launch({
  headless: true,
  executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
});

const page = await browser.newPage();
await page.goto(url.pathToFileURL(TMP_HTML).href, { waitUntil: 'networkidle0', timeout: 180000 });
await page.evaluateHandle('document.fonts.ready');
await page.pdf({
  path: TMP_PDF,
  format: 'Letter',
  printBackground: true,
  margin: { top: '0.85in', bottom: '0.85in', left: '0.95in', right: '0.95in' },
  displayHeaderFooter: false,
  preferCSSPageSize: false,
});
await page.close();
await browser.close();

const finalDoc = await PDFDocument.create();
const font = await finalDoc.embedFont(StandardFonts.TimesRoman);
function stampNumber(page, text) {
  const { width } = page.getSize();
  const size = 10;
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (width - w) / 2, y: 32, size, font, color: rgb(0.45, 0.45, 0.45) });
}
function romanize(n) {
  const m = [['m',1000],['cm',900],['d',500],['cd',400],['c',100],['xc',90],['l',50],['xl',40],['x',10],['ix',9],['v',5],['iv',4],['i',1]];
  let s = ''; for (const [k,v] of m) { while (n >= v) { s += k; n -= v; } } return s;
}

const tmpDoc = await PDFDocument.load(fs.readFileSync(TMP_PDF));
const pages = await finalDoc.copyPages(tmpDoc, tmpDoc.getPageIndices());
pages.forEach((p, i) => {
  finalDoc.addPage(p);
  if (i === 0) return;
  stampNumber(p, romanize(i + 1));
});

const bytes = await finalDoc.save();

// Ensure directory exists
fs.mkdirSync(path.dirname(OUT_PDF), { recursive: true });
fs.writeFileSync(OUT_PDF, bytes);

try { fs.unlinkSync(TMP_HTML); } catch {}
try { fs.unlinkSync(TMP_PDF); } catch {}

console.log(`Sample PDF: ${OUT_PDF}`);
console.log(`  Pages: ${pages.length}`);
console.log(`  Size: ${(bytes.length/1024/1024).toFixed(1)} MB`);
