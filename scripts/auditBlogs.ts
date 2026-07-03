import * as blog from '../server/seo/blogContent';
import fs from 'fs';
import path from 'path';

const IMG_DIR = path.resolve('client/public');
type Section = { paragraphs?: string[]; bullets?: string[]; image?: any; products?: any[] };
type Post = { url: string; title: string; description: string; h1: string; sections: Section[]; faqs?: any[]; related?: any[]; productCard?: any; image?: string; hero?: any };

const posts: Post[] = Object.values(blog as Record<string, any>)
  .filter(v => v && typeof v === 'object' && typeof v.url === 'string' && v.url.startsWith('/blog/') && Array.isArray(v.sections)) as Post[];

const wc = (p: Post) => p.sections.reduce((n, s) =>
  n + (s.paragraphs||[]).reduce((a,x)=>a+x.trim().split(/\s+/).filter(Boolean).length,0)
    + (s.bullets||[]).reduce((a,x)=>a+x.trim().split(/\s+/).filter(Boolean).length,0), 0);
const imgOk = (src?: string) => !src || src.startsWith('http') || fs.existsSync(path.join(IMG_DIR, src.replace(/^\//,'')));

const rows = posts.map(p => {
  const issues: string[] = [];
  if (p.title.length > 65) issues.push(`title ${p.title.length}>65`);
  if (p.description.length < 140 || p.description.length > 160) issues.push(`desc ${p.description.length}`);
  const w = wc(p); if (w < 1200) issues.push(`words ${w}`);
  if ((p.faqs||[]).length < 4) issues.push(`faq ${(p.faqs||[]).length}`);
  if ((p.related||[]).length < 3) issues.push(`related ${(p.related||[]).length}`);
  if (p.image && !imgOk(p.image)) issues.push(`heroImg ${p.image}`);
  for (const s of p.sections) {
    const im = s.image; if (!im) continue;
    if (typeof im === 'string') { if (!imgOk(im)) issues.push(`img ${im}`); }
    else { if (!imgOk(im.src)) issues.push(`img ${im.src}`); if (!im.alt || !im.alt.trim()) issues.push(`no-alt ${im.src}`); }
  }
  const links: string[] = [];
  if (p.hero?.ctaPrimary?.href) links.push(p.hero.ctaPrimary.href);
  if (p.productCard?.link) links.push(p.productCard.link);
  for (const s of p.sections) for (const pr of (s.products||[])) if (pr.link) links.push(pr.link);
  for (const l of links) { if (l.includes('0dvZe7BM')) issues.push('reused-link'); if (/(^|\/\/|\.)a\.co\//.test(l)) issues.push(`a.co ${l}`); }
  return { slug: p.url.replace('/blog/',''), issues };
});

const bad = rows.filter(r => r.issues.length);
console.log(`Audited ${rows.length} posts. ${bad.length} with issues.\n`);
for (const r of bad) console.log(`- ${r.slug}: ${r.issues.join('; ')}`);
const counts: Record<string,number> = {};
for (const r of bad) for (const i of r.issues) { const k=i.split(' ')[0]; counts[k]=(counts[k]||0)+1; }
console.log(`\nIssue-type counts:`, counts);
