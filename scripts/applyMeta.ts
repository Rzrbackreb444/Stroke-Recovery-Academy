import fs from 'fs';
const file = 'server/seo/blogContent.ts';
let lines = fs.readFileSync(file, 'utf8').split('\n');
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const titles: Record<string,string> = {
  'adaptive-eating-utensils-stroke': 'Adaptive Eating Utensils for Stroke Survivors',
  'best-adjustable-bed-wedge-pillow-stroke-recovery': 'Best Adjustable Beds & Wedge Pillows for Stroke',
  'complete-stroke-recovery-home-kit': 'The Complete Stroke Recovery Home Kit',
  'compression-garments-stroke-recovery-edema': 'Compression Socks & Sleeves for Stroke Edema',
  'best-elliptical-machine-stroke-recovery': 'Best Elliptical Machines for Stroke Recovery',
  'gait-training-home-stroke-recovery': 'Gait Training at Home After Stroke: Gear Guide',
  'best-grip-strengthener-stroke-recovery': 'Best Grip Strengtheners for Stroke Recovery',
  'google-search-console-indexing-website': 'Get Google Search Console to Index Your Site',
  'best-blood-pressure-monitor-stroke-survivor': 'Best Blood Pressure Monitor for Stroke Survivors',
  'hot-tub-hydrotherapy-stroke-recovery': 'Hot Tub Hydrotherapy for Stroke Recovery',
  'best-massage-gun-stroke-spasticity': 'Best Massage Guns for Stroke Spasticity',
  'parallel-bars-stroke-recovery': 'Parallel Bars for Stroke Recovery at Home',
  'best-resistance-bands-stroke-recovery': 'Best Resistance Bands for Stroke Recovery',
  'saebo-stroke-recovery-devices': 'Saebo Devices for Stroke Recovery: Honest Review',
  'best-smart-home-devices-stroke-survivors': 'Best Smart Home Devices for Stroke Survivors',
  'best-speech-therapy-apps-tools-aphasia-stroke': 'Best Speech Therapy Apps for Aphasia After Stroke',
  'stair-lift-stroke-survivor': 'Stair Lifts for Stroke Survivors: When to Buy',
  'best-standing-desk-stroke-recovery-return-to-work': 'Best Standing Desks for Stroke Survivors',
  'best-stationary-bike-stroke-recovery': 'Best Stationary Bikes for Stroke Recovery',
  'stroke-recovery-gift-guide': 'Stroke Recovery Gift Guide: What Actually Helps',
  'supplements-stroke-recovery': 'Supplements for Stroke Recovery: What I Took',
  'best-tens-unit-stroke-recovery': 'Best TENS Units for Stroke Recovery: NMES Guide',
  'threshold-ramps-grab-bars-stroke-home-accessibility': 'Home Accessibility After Stroke: Ramps & Grab Bars',
  'best-treadmill-stroke-recovery': 'Best Treadmills for Stroke Recovery: PT Picks',
  'best-walking-aids-stroke-survivors': 'Best Walking Aids for Stroke: Canes to Rollators',
  'best-weighted-vest-stroke-balance-training': 'Best Weighted Vests for Stroke Balance Training',
};

const descs: Record<string,string> = {
  'best-adjustable-bed-wedge-pillow-stroke-recovery': "Bed positioning after stroke affects spasticity, shoulder subluxation, aspiration risk, and sleep. Here's exactly what to buy and how to set it up right.",
  'afo-vs-electric-ankle-trainer': "AFO braces vs electric ankle rehabilitation trainers for foot drop — the pros, cons, costs, and the exact order I wish I'd bought them in after my stroke.",
  'best-balance-board-stroke-recovery': "Balance board training after stroke rebuilds the proprioceptive pathways stroke damages and cuts fall risk. A 7-year survivor's guide to the boards worth buying.",
  'best-brain-games-books-stroke-cognitive-recovery': "Memory, processing speed, attention, word-finding — cognitive deficits after stroke are real and addressable. The books and games that actually challenge you.",
  'can-you-drive-after-a-stroke': "When and how to return to driving after a stroke — the medical clearance process, driving evaluations, and the honest answer survivors actually need to hear.",
  'best-elliptical-machine-stroke-recovery': "Ellipticals are one of the best low-impact cardio tools for stroke survivors: reciprocal arm-leg motion, zero joint impact. What to buy and what to avoid.",
  'can-you-fully-recover-from-a-stroke': "Can you fully recover from a stroke? The honest answer from a survivor who went from total paralysis to 90% function over seven years of daily recovery work.",
  'best-grip-strengthener-stroke-recovery': "Grip strength after stroke doesn't rebuild itself. The right tools, used correctly, speed it up. What works — and what to avoid if spasticity is still present.",
  'google-search-console-indexing-website': "Getting Google Search Console to index your site isn't a mystery, it's a checklist. Here's the exact process that got 48 blog posts indexed in 90 days.",
  'best-home-gym-stroke-recovery': "The home gym stations that actually work for stroke survivors — one-sided weakness, seated exercise, full-body rebuilding. Real equipment, real prices.",
  'hot-tub-hydrotherapy-stroke-recovery': "Hydrotherapy for stroke recovery — how hot tubs reduce spasticity, improve circulation, and rebuild proprioception. Real brands, prices, and setup that works.",
  'best-massage-gun-stroke-spasticity': "Percussion therapy can reduce spasticity tone before exercise and improve range of motion after stroke — if you use the right device. Here's the honest guide.",
  'online-stroke-recovery-coach': "Nick Kremers, a 7-year stroke survivor, built a top stroke recovery resource from a wheelchair. Real protocols, real accountability, and the story behind it.",
  'best-pedal-exerciser-stroke-recovery': "Passive leg cycling can increase spasticity; active pedaling rebuilds it. A 7-year survivor's guide to the under-desk pedal exerciser that works for stroke.",
  'red-light-therapy-stroke-recovery': "Red light therapy (photobiomodulation) has emerging evidence for neurological recovery and solid evidence for muscle and inflammation. An honest survivor's take.",
  'saebo-stroke-recovery-devices': "Saebo stroke recovery devices — the Flex, the ReJoyce, and the Glove. Real reviews, real results, and the daily protocol that actually makes them work for you.",
  'best-smart-home-devices-stroke-survivors': "For survivors with aphasia, hemiplegia, or fatigue, smart home tech can restore independence that seemed gone. What actually works and what's worth the money.",
  'best-speech-therapy-apps-tools-aphasia-stroke': "Aphasia and dysarthria affect a third of stroke survivors. Between clinic visits, daily practice prevents plateau. The apps and tools that make it work at home.",
  'stair-lift-stroke-survivor': "The stair lift decision after stroke — when to buy, what to pay, and why a stair lift is independence, not surrender. Real prices, brands, and recommendations.",
  'best-standing-desk-stroke-recovery-return-to-work': "Returning to a desk job after stroke takes more than willpower — it takes a workstation built for hemiplegia, fatigue, and posture asymmetry. Here's the setup.",
  'best-stationary-bike-stroke-recovery': "Stationary bikes are the safest cardio starting point for most stroke survivors: back support, no balance demand, bilateral leg training. What actually works.",
  'best-tens-unit-stroke-recovery': "TENS and NMES units are among the most clinically relevant tools for post-stroke shoulder pain and spasticity. What the evidence supports and which to buy.",
  'threshold-ramps-grab-bars-stroke-home-accessibility': "Most falls after stroke happen at thresholds, in bathrooms, and on stairs. Here's how to spend $50-$500 on the home modifications that actually prevent them.",
  'best-treadmill-stroke-recovery': "A home treadmill can extend gait retraining beyond clinic hours — but only the right machine, used the right way. Here's what matters for stroke survivors.",
  'best-weighted-vest-stroke-balance-training': "Weighted vests add load to gait and balance training in a way that challenges the nervous system after stroke. Here's the evidence and which vests to buy.",
  'best-wheelchair-stroke-survivor': "The right wheelchair after stroke supports a hemiplegic posture, one-handed propulsion, and safe transfers that preserve independence. A survivor's buying guide.",
};

function setField(startIdx: number, key: string, val: string): boolean {
  for (let i = startIdx; i < Math.min(startIdx + 8, lines.length); i++) {
    const m = lines[i].match(new RegExp('^(\\s*)' + key + ':\\s'));
    if (m) { lines[i] = `${m[1]}${key}: '${esc(val)}',`; return true; }
  }
  return false;
}

const slugs = new Set([...Object.keys(titles), ...Object.keys(descs)]);
let ok = 0, miss = 0;
for (const slug of slugs) {
  const idx = lines.findIndex(l => l.includes(`slug: '${slug}'`));
  if (idx < 0) { console.log('SLUG NOT FOUND:', slug); miss++; continue; }
  if (titles[slug] && !setField(idx, 'title', titles[slug])) console.log('title not set:', slug);
  if (descs[slug] && !setField(idx, 'description', descs[slug])) console.log('desc not set:', slug);
  ok++;
}
fs.writeFileSync(file, lines.join('\n'));
console.log(`Applied to ${ok} slugs; ${miss} missing.`);
