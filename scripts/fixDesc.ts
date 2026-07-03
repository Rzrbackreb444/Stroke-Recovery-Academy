import fs from 'fs';
const file = 'server/seo/blogContent.ts';
let lines = fs.readFileSync(file, 'utf8').split('\n');
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const descs: Record<string,string> = {
  'best-balance-board-stroke-recovery': "Balance board training after stroke rebuilds the proprioceptive pathways stroke damages and cuts fall risk. A 7-year survivor's guide to boards worth buying.",
  'compression-garments-stroke-recovery-edema': "Post-stroke edema in the affected limb is nearly universal, and compression garments are one of the best-evidenced fixes. What to buy and how to use them.",
  'red-light-therapy-stroke-recovery': "Red light therapy (photobiomodulation) has emerging evidence for neurological recovery and solid evidence for muscle and inflammation. An honest take.",
  'best-wheelchair-stroke-survivor': "The right wheelchair after stroke supports a hemiplegic posture, one-handed propulsion, and safe transfers that preserve independence. A survivor's guide.",
};
function setField(startIdx: number, key: string, val: string): boolean {
  for (let i = startIdx; i < Math.min(startIdx + 8, lines.length); i++) {
    const m = lines[i].match(new RegExp('^(\\s*)' + key + ':\\s'));
    if (m) { lines[i] = `${m[1]}${key}: '${esc(val)}',`; return true; }
  }
  return false;
}
for (const [slug, val] of Object.entries(descs)) {
  const idx = lines.findIndex(l => l.includes(`slug: '${slug}'`));
  if (idx < 0) { console.log('MISSING', slug); continue; }
  if (!setField(idx, 'description', val)) console.log('not set', slug);
}
fs.writeFileSync(file, lines.join('\n'));
console.log('done', Object.keys(descs).map(s=>[s, descs[s].length]));
