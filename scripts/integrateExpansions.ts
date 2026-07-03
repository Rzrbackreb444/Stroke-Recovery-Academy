import fs from 'fs';
import path from 'path';

const FILE = process.env.TARGET || 'server/seo/blogContent.ts';
const DIR = process.env.EXP_DIR || '/tmp/expansions';

let lines = fs.readFileSync(FILE, 'utf8').split('\n');

const norm = (s: string) => String(s)
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201C\u201D]/g, '"')
  .replace(/\u2026/g, '...');
const escS = (s: string) => norm(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

function emitStrArr(key: string, arr: string[] | undefined, indent: string): string[] {
  if (!arr || !arr.length) return [];
  const out = [`${indent}${key}: [`];
  for (const s of arr) out.push(`${indent}  '${escS(s)}',`);
  out.push(`${indent}],`);
  return out;
}
function emitSection(sec: any): string[] {
  const o: string[] = ['    {'];
  const i = '      ';
  if (sec.h2) o.push(`${i}h2: '${escS(sec.h2)}',`);
  if (sec.paragraphs) o.push(...emitStrArr('paragraphs', sec.paragraphs, i));
  if (sec.bullets) o.push(...emitStrArr('bullets', sec.bullets, i));
  if (sec.relatedLinks && sec.relatedLinks.length) {
    o.push(`${i}relatedLinks: [`);
    for (const r of sec.relatedLinks) o.push(`${i}  { href: '${escS(r.href)}', label: '${escS(r.label)}' },`);
    o.push(`${i}],`);
  }
  o.push('    },');
  return o;
}
function emitFaq(f: any): string { return `    { q: '${escS(f.q)}', a: '${escS(f.a)}' },`; }

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json'));
let done = 0;
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
  const slug = data.slug;
  const slugIdx = lines.findIndex(l => l.includes(`slug: '${slug}'`));
  if (slugIdx < 0) { console.log('MISSING SLUG', slug); continue; }
  let faqIdx = -1;
  for (let i = slugIdx; i < lines.length; i++) { if (/^\s*faqs:\s*\[/.test(lines[i])) { faqIdx = i; break; } }
  if (faqIdx < 0) { console.log('NO FAQS', slug); continue; }
  let secClose = -1;
  for (let i = faqIdx - 1; i > slugIdx; i--) { if (/^  \],\s*$/.test(lines[i])) { secClose = i; break; } }
  if (secClose < 0) { console.log('NO SEC CLOSE', slug); continue; }
  const secLines: string[] = [];
  for (const sec of (data.newSections || [])) secLines.push(...emitSection(sec));
  const faqLines: string[] = (data.newFaqs || []).map(emitFaq);
  lines.splice(secClose, 0, ...secLines);
  const newFaqIdx = faqIdx + secLines.length;
  lines.splice(newFaqIdx + 1, 0, ...faqLines);
  console.log('OK', slug, '+sec', (data.newSections || []).length, '+faq', (data.newFaqs || []).length);
  done++;
}
fs.writeFileSync(FILE, lines.join('\n'));
console.log(`WROTE ${FILE} (${done} posts)`);
