import * as blog from '../server/seo/blogContent';
const posts = Object.values(blog as Record<string, any>).filter((v:any)=>v&&typeof v==='object'&&typeof v.url==='string'&&v.url.startsWith('/blog/')&&Array.isArray(v.sections)) as any[];
console.log('=== TITLES > 65 ===');
for (const p of posts) if (p.title.length>65) console.log(`${p.url.replace('/blog/','')}\n  [${p.title.length}] ${p.title}`);
console.log('\n=== DESCRIPTIONS out of 140-160 ===');
for (const p of posts) if (p.description.length<140||p.description.length>160) console.log(`${p.url.replace('/blog/','')}\n  [${p.description.length}] ${p.description}`);
console.log('\n=== FAQ < 4 (slug: count) ===');
for (const p of posts) if ((p.faqs||[]).length<4) console.log(`${p.url.replace('/blog/','')}: ${(p.faqs||[]).length}`);
