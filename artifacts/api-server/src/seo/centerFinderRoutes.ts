// SSR routes for the Recovery Center Finder:
//   GET /recovery/centers/:metroSlug         — metro hub with 15-25 real centers
//   GET /recovery/center/:placeId            — per-center detail page
//   GET /sitemap-centers.xml                 — sitemap covering all metros + cached centers
//
// All pages render the same dark/gold SRA shell as the landing pages, with full
// JSON-LD (LocalBusiness for centers, MedicalWebPage for hubs) and an internal-link
// cluster back to /for/* and /learn/* hubs for SEO juice.

import type { Express } from "express";
import { renderSsrPage } from "./ssrShell";
import { METROS, getMetroBySlug } from "./metros";
import {
  findOrFetchCentersNear,
  getCenterByPlaceId,
  getCentersForMetro,
  getAllPersistedPlaceIds,
  isPlacesConfigured,
  type CenterDTO,
} from "../recoveryCentersService";

const SITE_URL = "https://strokerecoveryacademy.com";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Allow only http(s) URLs in SSR <a href> output. Returns null for any other
// scheme (javascript:, data:, vbscript:, file:, etc.) so callers can omit the
// link rather than render a stored-XSS gadget.
function safeHttpUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  // Strip any leading control chars or whitespace before scheme detection.
  const lower = trimmed.toLowerCase();
  // Allow protocol-relative //example.com (treated as https by browsers).
  if (lower.startsWith("//")) return esc(trimmed);
  if (!lower.startsWith("http://") && !lower.startsWith("https://")) return null;
  // Final URL parse to make sure it's well-formed; if not, drop it.
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return esc(u.toString());
  } catch {
    return null;
  }
}

// Tel: link helper — keep digits/+ only.
function safeTelUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[^0-9+]/g, "");
  if (!cleaned) return null;
  return `tel:${cleaned}`;
}

function categoryLabel(c: string): string {
  switch (c) {
    case "rehab":    return "Stroke Rehab Center";
    case "neuro":    return "Neurologist / Neuro Clinic";
    case "hospital": return "Hospital";
    case "pt":       return "Physical Therapy";
    case "ot":       return "Occupational Therapy";
    case "slp":      return "Speech-Language Pathology";
    default:         return "Therapy / Clinic";
  }
}

function fmtMiles(d?: number): string {
  if (d === undefined || d === null || isNaN(d)) return "";
  if (d < 0.1) return "less than 0.1 mi";
  return `${d.toFixed(1)} mi`;
}

function renderStars(rating?: number | null): string {
  if (!rating) return "";
  const r = Number(rating);
  if (isNaN(r)) return "";
  return `${r.toFixed(1)} ★`;
}

// ---------- METRO HUB ----------
async function renderMetroHubHtml(metroSlug: string): Promise<string | null> {
  const metro = getMetroBySlug(metroSlug);
  if (!metro) return null;

  // Try cached metro centers first; if sparse, fan out fresh.
  let centers = await getCentersForMetro(metro.slug, 25);
  if (centers.length < 12 && isPlacesConfigured()) {
    centers = await findOrFetchCentersNear(metro.lat, metro.lng, {
      radiusMeters: 40000,
      metroSlug: metro.slug,
      enrichDetails: false, // keep page-build fast; details enriched on demand
    });
  } else {
    // attach a stable distance for display from the metro centroid
    centers = centers.map(c => ({
      ...c,
      distanceMiles: haversineMiles(metro.lat, metro.lng, c.lat, c.lng),
    })).sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0));
  }

  const hasReal = centers.length > 0;
  const cityState = `${metro.city}, ${metro.state}`;
  const h1 = `Stroke Recovery Centers in ${cityState}`;
  const titleStr = `Stroke Recovery Centers in ${cityState} | Top Rehab + Neuro + Therapy`;
  // Meta description: keep under 160 chars for ideal SERP rendering.
  const descRaw = `${centers.length || "Verified"} stroke rehab centers, neurologists, PTs, OTs, and SLPs in ${cityState} — ranked by distance. Call ahead and bring our "what to ask" checklist.`;
  const description = descRaw.length > 160 ? descRaw.slice(0, 157).replace(/\s+\S*$/, '') + '…' : descRaw;

  // Build LocalBusiness JSON-LD blocks (top 10 only) for ItemList
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Stroke Recovery Centers in ${cityState}`,
    itemListElement: centers.slice(0, 10).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "MedicalBusiness",
        "@id": `${SITE_URL}/recovery/center/${encodeURIComponent(c.placeId)}`,
        name: c.name,
        address: c.address,
        telephone: c.phone || undefined,
        url: c.website || undefined,
        geo: { "@type": "GeoCoordinates", latitude: c.lat, longitude: c.lng },
        aggregateRating: c.rating
          ? { "@type": "AggregateRating", ratingValue: c.rating, reviewCount: c.reviewsCount || 1 }
          : undefined,
      },
    })),
  };

  // Body sections — write these as plain HTML in a section, embedded in the SSR shell.
  const centerCardsHtml = hasReal
    // nosemgrep: javascript.lang.security.html-in-template-string
    ? `<div style="display:grid;gap:14px;margin-top:12px">${centers.map(c => {
        const safeWebsite = safeHttpUrl(c.website);
        const safeTel = safeTelUrl(c.phone);
        return `
        <article style="background:#111;border:1px solid #1f1f1f;border-radius:8px;padding:18px">
          <header style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;align-items:baseline">
            <h3 style="margin:0;font-family:'Playfair Display',serif;font-size:1.25rem;color:#f5f5f5">
              <a href="/recovery/center/${encodeURIComponent(c.placeId)}" style="color:#f5f5f5;text-decoration:none">${esc(c.name)}</a>
            </h3>
            <span style="color:#C9941A;font-weight:600;font-size:.85rem;letter-spacing:.5px;text-transform:uppercase">${esc(categoryLabel(String(c.category)))}</span>
          </header>
          <p style="color:#bbb;margin:8px 0 6px;font-size:.95rem">${esc(c.address)}</p>
          <p style="color:#999;font-size:.85rem;margin:0">
            // nosemgrep: javascript.lang.security.html-in-template-string
            ${c.distanceMiles !== undefined ? `<span>${esc(fmtMiles(c.distanceMiles))} from downtown</span>` : ""}
            // nosemgrep: javascript.lang.security.html-in-template-string
            ${c.rating ? `<span style="margin-left:14px;color:#C9941A">${esc(renderStars(c.rating))} (${c.reviewsCount || 0})</span>` : ""}
            // nosemgrep: javascript.lang.security.html-in-template-string
            ${safeTel ? `<span style="margin-left:14px"><a href="${safeTel}" style="color:#bbb;text-decoration:underline">${esc(c.phone || "")}</a></span>` : ""}
            // nosemgrep: javascript.lang.security.html-in-template-string
            ${safeWebsite ? `<span style="margin-left:14px"><a href="${safeWebsite}" rel="nofollow noopener" target="_blank" style="color:#bbb;text-decoration:underline">Website</a></span>` : ""}
          </p>
          // nosemgrep: javascript.lang.security.html-in-template-string
          ${c.services?.length ? `<p style="color:#888;font-size:.8rem;margin:8px 0 0">${c.services.map(s => esc(s)).join(" · ")}</p>` : ""}
        </article>
      `;
      }).join("")}</div>`
    : `<p style="color:#bbb;margin-top:12px"><strong>Live data temporarily unavailable.</strong> Use the <a href="/recovery/center-finder" style="color:#C9941A">Recovery Center Finder</a> for an instant search by ZIP code.</p>`;

  const cfg = {
    url: `/recovery/centers/${metro.slug}`,
    title: titleStr.length > 65 ? `Stroke Recovery Centers in ${cityState}` : titleStr,
    description,
    h1,
    hero: {
      eyebrow: `${cityState} · Stroke Recovery`,
      subhead: `Inpatient rehab, neurologists, physical / occupational / speech therapy — all the recovery resources we could verify in ${metro.city}.`,
      ctaPrimary: { href: "/recovery/center-finder", label: "Search by ZIP code" },
      ctaSecondary: { href: "/recovery/sasquatch-coach", label: "Ask Sasquatch Coach" },
    },
    sections: [
      {
        h2: `What you'll find on this page`,
        paragraphs: [
          `This page lists stroke recovery centers, neurologists, and rehabilitation therapists in and around ${cityState}, sourced from Google Places and refreshed every 30 days. Centers are ranked by category — inpatient rehab and neurology first, then PT/OT/SLP — and by distance from downtown ${metro.city}.`,
          `Stroke recovery isn't one specialty. Most survivors need a team: a neurologist for medical management, an inpatient rehab program early on, and outpatient PT, OT, and SLP for the long haul. The list below covers all five so you can build your team in one place.`,
        ],
      },
      {
        h2: `Centers near downtown ${metro.city}`,
        paragraphs: [hasReal ? `Showing ${centers.length} verified centers within ~25 miles of downtown ${metro.city}, ${metro.state}, ranked by category and distance.` : `Live results are loading. Try the live search below.`],
        rawHtml: centerCardsHtml,
      },
      {
        h2: `What to ask on your first visit`,
        paragraphs: [
          `When you call or visit any of these centers, ask the same handful of questions. The answers tell you whether the team understands stroke recovery as a long game — or just as billable visits.`,
        ],
        bullets: [
          `"How many stroke survivors do you see per month, and what's a typical recovery arc?"`,
          `"Do you offer task-specific repetition rather than passive modalities like ultrasound and e-stim?"`,
          `"Do you treat neuroplasticity as ongoing — or do you stop when insurance stops?"`,
          `"Will my PT, OT, and SLP coordinate, or am I telling each one what the others said?"`,
          `"Can I bring my home program for review and progression?"`,
          `"Are you willing to push intensity — high reps, harder challenges — when I plateau?"`,
        ],
      },
      {
        h2: `What "good" looks like in stroke rehab`,
        paragraphs: [
          `A great stroke recovery team measures progress objectively (Fugl-Meyer, 10-meter walk, grip dynamometer), pushes intensity past comfortable, and graduates you with a long-term home program — not just a stack of discharge papers. They believe neuroplasticity continues for years, not weeks. They ask what you want your life to look like at year five, not just whether you can stand from a chair.`,
          `If a center can't answer those questions, that's information too. Keep moving down the list.`,
        ],
      },
    ],
    faqs: [
      { q: `Are these stroke recovery centers in ${cityState} verified?`, a: `Yes — every center on this page is sourced from Google Places (the same data Google Maps uses) and refreshed every 30 days. We dedupe across multiple search queries so a center listed under "rehab," "neurology," and "physical therapy" only appears once. Always call ahead to confirm hours, insurance, and stroke-specific programs before your first visit.` },
      { q: `Which type of center should I call first?`, a: `If you are within the first 90 days post-stroke and not already in rehab, prioritize an inpatient or comprehensive outpatient stroke rehab program. If you've plateaued or are years out, a neurologist plus an outpatient PT/OT/SLP team is usually the right combination. The Sasquatch Coach can walk you through the decision in plain language.` },
      { q: `How far should I be willing to drive for stroke rehab?`, a: `For inpatient rehab, an extra 30-60 minutes is almost always worth it for a higher-volume stroke program. For outpatient PT/OT/SLP, location matters more — you'll be going 2-3 times a week for months. Pick the closest team that meets the "what good looks like" bar above.` },
      { q: `What if there are no specialty stroke centers in ${cityState}?`, a: `Many small metros don't have a dedicated stroke specialist. In that case you build your team: a general neurologist, a PT and OT willing to learn, and a strong home program. The Stroke Recovery Academy daily routine and 66-Day Challenge are designed for exactly this scenario — when you have to be the program.` },
      { q: `Do you list price or insurance acceptance?`, a: `Not yet — insurance and cash-pay rates change too often for us to publish accurately. Always call the center directly. Most accept Medicare, Medicaid (varies), and major private insurance for stroke rehab; cash-pay rates for follow-on PT/OT/SLP vary widely.` },
    ],
    related: [
      { href: "/programs/sasquatch-method", label: "The Sasquatch Method", blurb: "Nick's stroke recovery system." },
      { href: "/programs/daily-routine", label: "Daily Recovery Routine", blurb: "5-level structured day." },
      { href: "/learn/neuroplasticity-after-stroke", label: "Neuroplasticity After Stroke", blurb: "How the brain rewires." },
      { href: "/learn/hemiparesis-recovery", label: "Hemiparesis Recovery", blurb: "Get the weak side back." },
      { href: "/recovery/center-finder", label: "Live Center Finder", blurb: "Search any U.S. ZIP code." },
    ],
    keywords: [
      `stroke recovery ${metro.city}`,
      `stroke rehab ${metro.city}`,
      `neurologist ${metro.city}`,
      `physical therapy ${metro.city} stroke`,
      `occupational therapy ${metro.city}`,
      `speech therapy ${metro.city}`,
    ],
  };

  // Render the standard SSR page, then inject the ItemList JSON-LD just before </head>.
  let html = renderSsrPage(cfg as any);
  // nosemgrep: javascript.lang.security.html-in-template-string
  const inject = `<script type="application/ld+json">${JSON.stringify(itemList).replace(/<\/script/gi, "<\\/script")}</script>\n</head>`;
  html = html.replace("</head>", inject);
  return html;
}

// ---------- PER-CENTER DETAIL ----------
async function renderCenterDetailHtml(placeId: string): Promise<string | null> {
  const c = await getCenterByPlaceId(placeId);
  if (!c) return null;

  const titleStr = `${c.name} — ${categoryLabel(String(c.category))}${c.city ? ` in ${c.city}, ${c.state}` : ""}`;
  const titleSafe = titleStr.length > 70 ? `${c.name} | Stroke Recovery Center` : titleStr;
  const description = `${c.name} — ${c.address}. ${categoryLabel(String(c.category))}${c.rating ? `, rated ${Number(c.rating).toFixed(1)}/5 from ${c.reviewsCount} Google reviews` : ""}. Services include ${(c.services || []).slice(0, 4).join(", ")}.`.slice(0, 160);

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "@id": `${SITE_URL}/recovery/center/${encodeURIComponent(c.placeId)}`,
    name: c.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: c.street || undefined,
      addressLocality: c.city || undefined,
      addressRegion: c.state || undefined,
      postalCode: c.postalCode || undefined,
      addressCountry: "US",
    },
    geo: { "@type": "GeoCoordinates", latitude: c.lat, longitude: c.lng },
    telephone: c.phone || undefined,
    url: c.website || undefined,
    sameAs: c.googleMapsUrl ? [c.googleMapsUrl] : undefined,
    aggregateRating: c.rating
      ? { "@type": "AggregateRating", ratingValue: c.rating, reviewCount: c.reviewsCount || 1 }
      : undefined,
    medicalSpecialty: ["PhysicalTherapy", "Neurologic", "Rehabilitation"],
  };

  // Build the body as a single section with HTML cards (using the rawHtml trick).
  const safeWebsite = safeHttpUrl(c.website);
  const safeMapUrl = safeHttpUrl(c.googleMapsUrl);
  const safeTel = safeTelUrl(c.phone);
  const detailHtml = `
    <div style="background:#111;border:1px solid #1f1f1f;border-radius:8px;padding:22px;margin-top:10px">
      <p style="color:#bbb;margin:0 0 4px"><strong style="color:#C9941A;text-transform:uppercase;letter-spacing:.5px;font-size:.8rem">${esc(categoryLabel(String(c.category)))}</strong></p>
      <p style="color:#f5f5f5;margin:0 0 12px;font-size:1.1rem">${esc(c.address)}</p>
      <ul style="list-style:none;padding:0;margin:0;color:#bbb;line-height:1.8">
        ${safeTel ? `<li><strong style="color:#999">Phone:</strong> <a href="${safeTel}" style="color:#C9941A">${esc(c.phone || "")}</a></li>` : ""}
        ${safeWebsite ? `<li><strong style="color:#999">Website:</strong> <a href="${safeWebsite}" rel="nofollow noopener" target="_blank" style="color:#C9941A">${safeWebsite}</a></li>` : ""}
        ${safeMapUrl ? `<li><strong style="color:#999">Map:</strong> <a href="${safeMapUrl}" rel="nofollow noopener" target="_blank" style="color:#C9941A">Open in Google Maps</a></li>` : ""}
        ${c.rating ? `<li><strong style="color:#999">Google rating:</strong> ${esc(renderStars(c.rating))} (${c.reviewsCount || 0} reviews)</li>` : ""}
      </ul>
      ${c.services?.length ? `<p style="color:#999;margin:14px 0 0;font-size:.9rem"><strong>Services:</strong> ${c.services.map(s => esc(s)).join(" · ")}</p>` : ""}
    </div>
  `;

  const cfg = {
    url: `/recovery/center/${encodeURIComponent(c.placeId)}`,
    title: titleSafe,
    description,
    h1: c.name,
    hero: {
      eyebrow: c.city && c.state ? `${c.city}, ${c.state}` : "Stroke Recovery Center",
      subhead: `${categoryLabel(String(c.category))} listed on Stroke Recovery Academy. Verify all details by phone before your first visit.`,
      ctaPrimary: c.city && c.state ? { href: `/recovery/centers/${slugifyCityState(c.city, c.state)}`, label: `See more centers in ${c.city}` } : { href: "/recovery/center-finder", label: "Search Center Finder" },
      ctaSecondary: { href: "/recovery/sasquatch-coach", label: "Ask Sasquatch Coach" },
    },
    sections: [
      { h2: ``, rawHtml: detailHtml } as any,
      {
        h2: `What to ask on your first visit`,
        paragraphs: [
          `Bring this list. The answers tell you whether this team understands stroke recovery as a long-game neuroplasticity project — or just as billable visits.`,
        ],
        bullets: [
          `"How many stroke survivors do you currently see, and what's a typical arc?"`,
          `"Do you offer task-specific repetition, not just passive modalities?"`,
          `"How will you measure my progress objectively (Fugl-Meyer, 10-meter walk, grip)?"`,
          `"Will you build me a home program I can keep doing after discharge?"`,
          `"How will my PT, OT, SLP, and neurologist coordinate?"`,
          `"What happens when I plateau — do you push intensity, or do you stop?"`,
        ],
      },
      {
        h2: `Insurance, hours, and accuracy`,
        paragraphs: [
          `Hours, insurance acceptance, and stroke-specific programs change frequently. Always call ahead. The data on this page is sourced from Google Places (the same data Google Maps uses) and refreshed regularly, but it is not a substitute for confirming directly with the center.`,
          `If anything on this page is wrong, contact us at nick@strokerecoveryacademy.com and we'll correct it within 48 hours.`,
        ],
      },
    ],
    faqs: [
      { q: `Is ${c.name} a stroke recovery specialist?`, a: `${c.name} is listed on Stroke Recovery Academy as a ${categoryLabel(String(c.category))}. Stroke recovery often requires a team — neurology + inpatient rehab + outpatient PT/OT/SLP. Whether ${c.name} is the right starting point depends on your stage of recovery. Call ahead and ask the questions in the "What to ask" list above.` },
      { q: `How do I verify Google reviews and ratings?`, a: `Open the Google Maps link above to see live reviews and ratings. The number on this page is a snapshot from our last refresh; Google updates continuously.` },
      { q: `Does ${c.name} accept Medicare or my insurance?`, a: `We don't list payer information because it changes too often to publish accurately. Call ${c.phone ? c.phone : "the center"} directly and ask: "Do you accept [your insurance] for stroke rehabilitation?"` },
      { q: `What if I'm years out from my stroke?`, a: `Plenty of survivors make meaningful gains 5, 10, even 15+ years post-stroke — neuroplasticity does not have a hard cutoff. The barrier is usually intensity and consistency, not biology. Bring your home program and ask whether the team is willing to push intensity past your comfort zone.` },
      { q: `What if this listing is wrong or out of date?`, a: `Email nick@strokerecoveryacademy.com with the correction and we'll update within 48 hours. We refresh from Google Places every 30 days, but business hours and phone numbers can change in between.` },
    ],
    related: [
      ...(c.city && c.state ? [{ href: `/recovery/centers/${slugifyCityState(c.city, c.state)}`, label: `More centers in ${c.city}, ${c.state}`, blurb: "Same metro." }] : []),
      { href: "/programs/sasquatch-method", label: "The Sasquatch Method", blurb: "Nick's stroke recovery system." },
      { href: "/programs/daily-routine", label: "Daily Recovery Routine", blurb: "Build your structure." },
      { href: "/learn/neuroplasticity-after-stroke", label: "How Neuroplasticity Works", blurb: "Why the work matters." },
      { href: "/recovery/center-finder", label: "Recovery Center Finder", blurb: "Search by ZIP code." },
    ],
    keywords: [
      c.name,
      c.city ? `${c.name} ${c.city}` : c.name,
      `stroke rehab ${c.city || ""}`,
      `${categoryLabel(String(c.category))} ${c.city || ""}`,
    ].filter(Boolean) as string[],
  };

  let html = renderSsrPage(cfg as any);
  // nosemgrep: javascript.lang.security.html-in-template-string
  const inject = `<script type="application/ld+json">${JSON.stringify(localBusinessSchema).replace(/<\/script/gi, "<\\/script")}</script>\n</head>`;
  html = html.replace("</head>", inject);
  return html;
}

// quick haversine duplicate to avoid circular import
function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.7613;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function slugifyCityState(city: string, state: string): string {
  const c = city.toLowerCase().replace(/\./g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const s = state.toLowerCase();
  return `${c}-${s}`;
}

// ---------- ROUTING ----------
export function registerCenterFinderRoutes(app: Express): void {
  // Metro hub
  app.get("/recovery/centers/:metroSlug", async (req, res) => {
    try {
      const slug = req.params.metroSlug.toLowerCase();
      const html = await renderMetroHubHtml(slug);
      if (!html) {
        res.status(404).send("Metro not found");
        return;
      }
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Cache-Control", "public, max-age=600, stale-while-revalidate=86400");
      res.set("X-SRA-SSR", "centers-metro");
      res.send(html);
    } catch (e) {
      console.error("[centers] metro SSR error:", e);
      res.status(500).send("Center hub temporarily unavailable.");
    }
  });

  // Per-center detail
  app.get("/recovery/center/:placeId", async (req, res) => {
    try {
      const placeId = req.params.placeId;
      const html = await renderCenterDetailHtml(placeId);
      if (!html) {
        res.status(404).send("Center not found");
        return;
      }
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Cache-Control", "public, max-age=600, stale-while-revalidate=86400");
      res.set("X-SRA-SSR", "center-detail");
      res.send(html);
    } catch (e) {
      console.error("[centers] detail SSR error:", e);
      res.status(500).send("Center detail temporarily unavailable.");
    }
  });

  // Sitemap for centers
  app.get("/sitemap-centers.xml", async (_req, res) => {
    const today = new Date().toISOString().split("T")[0];
    // nosemgrep: javascript.lang.security.html-in-template-string
    const metroEntries = METROS.map(m => `  <url>
    <loc>${SITE_URL}/recovery/centers/${m.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`).join("\n");

    let centerEntries = "";
    try {
      const ids = await getAllPersistedPlaceIds();
      // nosemgrep: javascript.lang.security.html-in-template-string
      centerEntries = ids.map(id => `  <url>
    <loc>${SITE_URL}/recovery/center/${encodeURIComponent(id)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.65</priority>
  </url>`).join("\n");
    } catch (e) {
      console.error("[centers] sitemap error:", e);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${metroEntries}
${centerEntries}
</urlset>`;
    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(xml);
  });
}

// Used by the master sitemap-index
export function getCenterFinderSitemapUrls(): { url: string; lastmod: string; priority: string; changefreq: string }[] {
  const today = new Date().toISOString().split("T")[0];
  return METROS.map(m => ({
    url: `/recovery/centers/${m.slug}`,
    lastmod: today,
    priority: "0.85",
    changefreq: "weekly",
  }));
}
