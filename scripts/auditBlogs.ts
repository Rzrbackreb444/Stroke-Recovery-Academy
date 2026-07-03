import * as blog from '../server/seo/blogContent';
import fs from 'fs';
import path from 'path';

const IMG_DIR = path.resolve('client/public');
type Post = { url: string; title: string; description: string; h1: string; sections: any[]; faqs?: any[]; related?: any[]; productCard?: any; image?: string; hero?: any };

const posts: Post[] = Object.values(blog as Record<string, any>)
  .filter(v => v && typeof v === 'object' && typeof v.url === 'string' && v.url.startsWith('/blog/') && Array.isArray(v.sections)) as Post[];

const strip = (s: string) => s.replace(/<[^>]+>/g, ' ');
const w = (s?: string) => s ? strip(s).trim().split(/\s+/).filter(Boolean).length : 0;
const wc = (p: Post) => {
  let n = 0;
  for (const s of p.sections) {
    for (const x of s.paragraphs||[]) n += w(x);
    for (const x of s.bullets||[]) n += w(x);
    if (typeof s.body === 'string') n += w(s.body);
    if (typeof s.rawHtml === 'string') n += w(s.rawHtml);
    for (const st of s.steps||[]) n += w(st.name) + w(st.text);
    n += w(s.h2) + w(s.heading);
  }
  for (const f of p.faqs||[]) n += w(f.q) + w(f.a);
  return n;
};
const imgOk = (src?: string) => !src || src.startsWith('http') || fs.existsSync(path.join(IMG_DIR, src.replace(/^\//,'')));

const rows = posts.map(p => {
  const issues: string[] = [];
  if (p.title.length > 65) issues.push(`title${p.title.length}`);
  if (p.description.length < 140 || p.description.length > 160) issues.push(`desc${p.description.length}`);
  if ((p.faqs||[]).length < 4) issues.push(`faq${(p.faqs||[]).length}`);
  if ((p.related||[]).length < 3) issues.push(`rel${(p.related||[]).length}`);
  if (p.image && !imgOk(p.image)) issues.push(`heroImg`);
  for (const s of p.sections) {
    const im = s.image; if (!im) continue;
    if (typeof im === 'string') { if (!imgOk(im)) issues.push(`img!`); }
    else { if (!imgOk(im.src)) issues.push(`img!`); if (!im.alt || !im.alt.trim()) issues.push(`noalt`); }
  }
  const links: string[] = [];
  if (p.hero?.ctaPrimary?.href) links.push(p.hero.ctaPrimary.href);
  if (p.productCard?.link) links.push(p.productCard.link);
  for (const s of p.sections) for (const pr of (s.products||[])) if (pr.link) links.push(pr.link);
  for (const l of links) { if (/a\.co\//.test(l)) issues.push(`a.co`); }
  return { slug: p.url.replace('/blog/',''), words: wc(p), issues };
});

rows.sort((a,b)=>a.words-b.words);
console.log(`Audited ${rows.length} posts.\n`);
console.log(`=== WORD COUNT (ascending) ===`);
for (const r of rows) console.log(`${String(r.words).padStart(5)}  ${r.slug}${r.issues.length?'  ['+r.issues.join(',')+']':''}`);
const thin = rows.filter(r=>r.words<800), mid = rows.filter(r=>r.words>=800&&r.words<1200), ok = rows.filter(r=>r.words>=1200);
console.log(`\nBuckets: <800 (thin) = ${thin.length}; 800-1199 = ${mid.length}; >=1200 = ${ok.length}`);
const tc: Record<string,number> = {};
for (const r of rows) for (const i of r.issues) { const k=i.replace(/[0-9]+$/,''); tc[k]=(tc[k]||0)+1; }
console.log(`Technical issue counts:`, tc);
