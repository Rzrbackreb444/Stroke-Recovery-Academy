// Uber-legit Recovery Center Finder service.
// - Geocodes ZIP / city
// - Fans out 5 Google Places queries (stroke rehab, neurologist, PT, OT, SLP)
// - Dedupes by place_id
// - Computes Haversine distance in miles
// - Persists to recovery_centers (30-day TTL)
// - Provides metro-hub helpers for SSR landing pages

import { db } from "./db";
import { recoveryCenters, recoveryMetroCache } from "@workspace/db";
import { sql, eq, gte, inArray } from "drizzle-orm";

const KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.PLACES_API_KEY;
const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";
const GEOCODE_BASE = "https://maps.googleapis.com/maps/api/geocode";

export const REFRESH_TTL_DAYS = 30;
const REFRESH_TTL_MS = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;

export type CenterCategory =
  | "rehab"       // inpatient/outpatient stroke rehab, IRF
  | "neuro"       // neurologists, neuro clinics
  | "pt"          // physical therapy
  | "ot"          // occupational therapy
  | "slp"         // speech-language pathology
  | "hospital"    // general hospital w/ rehab unit
  | "therapy";    // catch-all therapy/clinic

interface FanoutQuery { q: string; cat: CenterCategory }
const FANOUT_QUERIES: FanoutQuery[] = [
  { q: "stroke rehabilitation center", cat: "rehab" },
  { q: "neurologist",                  cat: "neuro" },
  { q: "physical therapy clinic",      cat: "pt" },
  { q: "occupational therapy",         cat: "ot" },
  { q: "speech language pathologist",  cat: "slp" },
];

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: { open_now?: boolean };
  types: string[];
  business_status?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  url?: string;
  address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
}

export interface CenterDTO {
  placeId: string;
  name: string;
  address: string;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  lat: number;
  lng: number;
  phone?: string | null;
  website?: string | null;
  googleMapsUrl?: string | null;
  rating?: number | null;
  reviewsCount?: number;
  category: CenterCategory | string;
  services: string[];
  distanceMiles?: number;
  fetchedAt?: Date;
}

// ---------- math ----------
export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.7613; // miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ---------- geocoding ----------
export interface GeocodeResult {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  postalCode?: string;
  formattedAddress: string;
}

export async function geocodeQuery(q: string): Promise<GeocodeResult | null> {
  if (!KEY) return null;
  const url = `${GEOCODE_BASE}/json?address=${encodeURIComponent(q)}&components=country:US&key=${KEY}`;
  const res = await fetch(url);
  const data: any = await res.json();
  if (data.status !== "OK" || !data.results?.[0]) return null;
  const r = data.results[0];
  const comps: Array<{ long_name: string; short_name: string; types: string[] }> = r.address_components || [];
  const find = (t: string) => comps.find(c => c.types.includes(t));
  return {
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    city: find("locality")?.long_name || find("postal_town")?.long_name || find("administrative_area_level_2")?.long_name,
    state: find("administrative_area_level_1")?.short_name,
    postalCode: find("postal_code")?.long_name,
    formattedAddress: r.formatted_address,
  };
}

// ---------- categorization ----------
function inferCategory(name: string, googleTypes: string[], sourceCat: CenterCategory): CenterCategory {
  const n = name.toLowerCase();
  if (n.includes("hospital") || googleTypes.includes("hospital")) {
    if (n.includes("rehab")) return "rehab";
    return "hospital";
  }
  if (n.includes("rehab") || n.includes("rehabilitation")) return "rehab";
  if (n.includes("neuro")) return "neuro";
  if (n.includes("speech")) return "slp";
  if (n.includes("occupational")) return "ot";
  if (n.includes("physical therapy") || n.includes("physiotherap")) return "pt";
  return sourceCat;
}

function inferServices(name: string, googleTypes: string[]): string[] {
  const n = name.toLowerCase();
  const s = new Set<string>();
  if (n.includes("physical") || n.includes("physiotherap") || googleTypes.includes("physiotherapist")) s.add("Physical Therapy");
  if (n.includes("occupational")) s.add("Occupational Therapy");
  if (n.includes("speech") || n.includes("language") || n.includes("aphasia")) s.add("Speech Therapy");
  if (n.includes("neuro") || n.includes("brain") || n.includes("stroke")) s.add("Neurological Rehabilitation");
  if (n.includes("aquatic") || n.includes("pool")) s.add("Aquatic Therapy");
  if (n.includes("cognitive")) s.add("Cognitive Therapy");
  if (n.includes("hospital")) s.add("Acute Care");
  if (n.includes("inpatient") || n.includes("acute rehab")) s.add("Inpatient Rehab");
  if (n.includes("outpatient")) s.add("Outpatient Rehab");
  if (n.includes("balance") || n.includes("vestibular")) s.add("Balance Training");
  if (n.includes("home health") || n.includes("home care")) s.add("Home Health");
  if (s.size === 0) s.add("Rehabilitation Services");
  return Array.from(s);
}

function parseAddressComponents(comps?: Array<{ long_name: string; short_name: string; types: string[] }>) {
  const out: { street?: string; city?: string; state?: string; postalCode?: string } = {};
  if (!comps) return out;
  const find = (t: string) => comps.find(c => c.types.includes(t));
  const num = find("street_number")?.long_name;
  const route = find("route")?.long_name;
  out.street = [num, route].filter(Boolean).join(" ") || undefined;
  out.city = find("locality")?.long_name || find("postal_town")?.long_name || find("administrative_area_level_2")?.long_name;
  out.state = find("administrative_area_level_1")?.short_name;
  out.postalCode = find("postal_code")?.long_name;
  return out;
}

// ---------- Google Places ----------
async function textSearch(query: string, lat: number, lng: number, radiusMeters = 50000): Promise<PlaceResult[]> {
  if (!KEY) return [];
  const all: PlaceResult[] = [];
  let pageToken: string | undefined = undefined;
  for (let page = 0; page < 2; page++) {
    const url = pageToken
      ? `${PLACES_BASE}/textsearch/json?pagetoken=${pageToken}&key=${KEY}`
      : `${PLACES_BASE}/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${radiusMeters}&key=${KEY}`;
    if (pageToken) await new Promise(r => setTimeout(r, 1800)); // Google requires delay before next_page_token works
    try {
      const res = await fetch(url);
      const data: any = await res.json();
      if (data.status === "OK" && Array.isArray(data.results)) {
        all.push(...data.results);
        pageToken = data.next_page_token;
        if (!pageToken) break;
      } else {
        break;
      }
    } catch (e) {
      console.error("[centers] textSearch error:", e);
      break;
    }
  }
  return all;
}

async function placeDetails(placeId: string): Promise<Partial<PlaceResult> | null> {
  if (!KEY) return null;
  try {
    const fields = [
      "place_id","name","formatted_address","geometry","rating","user_ratings_total",
      "opening_hours","types","business_status","formatted_phone_number","international_phone_number",
      "website","url","address_component"
    ].join(",");
    const url = `${PLACES_BASE}/details/json?place_id=${placeId}&fields=${fields}&key=${KEY}`;
    const res = await fetch(url);
    const data: any = await res.json();
    if (data.status !== "OK") return null;
    return data.result;
  } catch (e) {
    console.error("[centers] placeDetails error:", e);
    return null;
  }
}

// ---------- main fan-out ----------
export interface FanoutOptions {
  radiusMeters?: number;
  metroSlug?: string;
  enrichDetails?: boolean;
  forceRefresh?: boolean;
}

/**
 * Fetch (or use cached) centers near a lat/lng. Persists to DB. Returns
 * deduped, distance-sorted centers (rehab/neuro prioritised first).
 */
export async function findOrFetchCentersNear(
  lat: number,
  lng: number,
  opts: FanoutOptions = {}
): Promise<CenterDTO[]> {
  const radius = opts.radiusMeters ?? 40000; // ~25 mi
  const radiusMiles = radius / 1609.344;
  const metroSlug = opts.metroSlug;

  // 1) try cache first (if we have ANY recent rows in box)
  if (!opts.forceRefresh) {
    const cutoff = new Date(Date.now() - REFRESH_TTL_MS);
    const cached = await db.execute<any>(sql`
      SELECT * FROM recovery_centers
      WHERE refreshed_at >= ${cutoff}
        AND lat BETWEEN ${lat - radiusMiles / 69} AND ${lat + radiusMiles / 69}
        AND lng BETWEEN ${lng - radiusMiles / 55} AND ${lng + radiusMiles / 55}
      LIMIT 200
    `);
    const rows: any[] = (cached as any).rows || cached;
    const inRange = rows
      .map(r => withDistance(rowToDto(r), lat, lng))
      .filter(c => (c.distanceMiles ?? 999) <= radiusMiles);
    if (inRange.length >= 12) {
      return sortCenters(inRange);
    }
  }

  // 2) fan out fresh queries
  if (!KEY) {
    return []; // honest empty when not configured
  }

  const seen = new Map<string, { place: PlaceResult; sourceCats: Set<CenterCategory>; sourceQueries: Set<string> }>();
  for (const fq of FANOUT_QUERIES) {
    const results = await textSearch(fq.q, lat, lng, radius);
    for (const r of results) {
      if (!r.place_id) continue;
      if (!seen.has(r.place_id)) {
        seen.set(r.place_id, { place: r, sourceCats: new Set([fq.cat]), sourceQueries: new Set([fq.q]) });
      } else {
        const e = seen.get(r.place_id)!;
        e.sourceCats.add(fq.cat);
        e.sourceQueries.add(fq.q);
      }
    }
  }

  // 3) optionally enrich top-N with details (phone, website, hours, address comps)
  const list = Array.from(seen.values())
    .map(e => ({
      ...e,
      distance: haversineMiles(lat, lng, e.place.geometry.location.lat, e.place.geometry.location.lng),
    }))
    .filter(e => e.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance);

  const enrichLimit = opts.enrichDetails === false ? 0 : Math.min(20, list.length);
  for (let i = 0; i < enrichLimit; i++) {
    const detail = await placeDetails(list[i].place.place_id);
    if (detail) list[i].place = { ...list[i].place, ...detail } as PlaceResult;
  }

  // 4) persist
  const dtos: CenterDTO[] = [];
  for (const e of list) {
    const p = e.place;
    const sourceCat: CenterCategory = e.sourceCats.has("rehab") ? "rehab"
      : e.sourceCats.has("neuro") ? "neuro"
      : (Array.from(e.sourceCats)[0] || "therapy");
    const cat = inferCategory(p.name, p.types || [], sourceCat);
    const services = inferServices(p.name, p.types || []);
    const addr = parseAddressComponents(p.address_components);
    const phone = p.formatted_phone_number || p.international_phone_number || null;
    const gmapsUrl = p.url || `https://www.google.com/maps/place/?q=place_id:${p.place_id}`;

    try {
      await db.execute(sql`
        INSERT INTO recovery_centers (
          place_id, name, formatted_address, street, city, state, postal_code, country,
          lat, lng, phone, website, google_maps_url, rating, reviews_count, business_status,
          category, services, google_types, source_queries, metro_slugs, raw, fetched_at, refreshed_at
        ) VALUES (
          ${p.place_id}, ${p.name}, ${p.formatted_address}, ${addr.street ?? null}, ${addr.city ?? null},
          ${addr.state ?? null}, ${addr.postalCode ?? null}, 'US',
          ${p.geometry.location.lat}, ${p.geometry.location.lng},
          ${phone}, ${p.website ?? null}, ${gmapsUrl},
          ${p.rating ?? null}, ${p.user_ratings_total ?? 0}, ${p.business_status ?? null},
          ${cat}, ${JSON.stringify(services)}::jsonb, ${JSON.stringify(p.types || [])}::jsonb,
          ${JSON.stringify(Array.from(e.sourceQueries))}::jsonb,
          ${JSON.stringify(metroSlug ? [metroSlug] : [])}::jsonb,
          ${JSON.stringify(p)}::jsonb, NOW(), NOW()
        )
        ON CONFLICT (place_id) DO UPDATE SET
          name = EXCLUDED.name,
          formatted_address = EXCLUDED.formatted_address,
          street = COALESCE(EXCLUDED.street, recovery_centers.street),
          city = COALESCE(EXCLUDED.city, recovery_centers.city),
          state = COALESCE(EXCLUDED.state, recovery_centers.state),
          postal_code = COALESCE(EXCLUDED.postal_code, recovery_centers.postal_code),
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          phone = COALESCE(EXCLUDED.phone, recovery_centers.phone),
          website = COALESCE(EXCLUDED.website, recovery_centers.website),
          google_maps_url = EXCLUDED.google_maps_url,
          rating = EXCLUDED.rating,
          reviews_count = EXCLUDED.reviews_count,
          business_status = EXCLUDED.business_status,
          category = EXCLUDED.category,
          services = EXCLUDED.services,
          google_types = EXCLUDED.google_types,
          source_queries = (
            SELECT jsonb_agg(DISTINCT v)
            FROM jsonb_array_elements_text(recovery_centers.source_queries || EXCLUDED.source_queries) v
          ),
          metro_slugs = (
            SELECT jsonb_agg(DISTINCT v)
            FROM jsonb_array_elements_text(recovery_centers.metro_slugs || EXCLUDED.metro_slugs) v
          ),
          refreshed_at = NOW()
      `);
    } catch (err) {
      console.error("[centers] persist error:", err);
    }

    dtos.push({
      placeId: p.place_id,
      name: p.name,
      address: p.formatted_address,
      street: addr.street ?? null,
      city: addr.city ?? null,
      state: addr.state ?? null,
      postalCode: addr.postalCode ?? null,
      lat: p.geometry.location.lat,
      lng: p.geometry.location.lng,
      phone,
      website: p.website ?? null,
      googleMapsUrl: gmapsUrl,
      rating: p.rating ?? null,
      reviewsCount: p.user_ratings_total ?? 0,
      category: cat,
      services,
      distanceMiles: e.distance,
    });
  }

  if (metroSlug) {
    try {
      await db.execute(sql`
        INSERT INTO recovery_metro_cache (metro_slug, centers_count, last_refreshed)
        VALUES (${metroSlug}, ${dtos.length}, NOW())
        ON CONFLICT (metro_slug) DO UPDATE
          SET centers_count = EXCLUDED.centers_count,
              last_refreshed = EXCLUDED.last_refreshed
      `);
    } catch (e) { console.error("[centers] metro cache error:", e); }
  }

  return sortCenters(dtos);
}

function withDistance(c: CenterDTO, lat: number, lng: number): CenterDTO {
  return { ...c, distanceMiles: haversineMiles(lat, lng, c.lat, c.lng) };
}

function categoryRank(cat: string): number {
  switch (cat) {
    case "rehab": return 0;
    case "neuro": return 1;
    case "hospital": return 2;
    case "pt": return 3;
    case "ot": return 4;
    case "slp": return 5;
    default: return 6;
  }
}

function sortCenters(arr: CenterDTO[]): CenterDTO[] {
  return [...arr].sort((a, b) => {
    const ra = categoryRank(a.category); const rb = categoryRank(b.category);
    if (ra !== rb) return ra - rb;
    return (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0);
  });
}

function rowToDto(row: any): CenterDTO {
  return {
    placeId: row.place_id,
    name: row.name,
    address: row.formatted_address,
    street: row.street, city: row.city, state: row.state, postalCode: row.postal_code,
    lat: Number(row.lat), lng: Number(row.lng),
    phone: row.phone, website: row.website, googleMapsUrl: row.google_maps_url,
    rating: row.rating !== null ? Number(row.rating) : null,
    reviewsCount: row.reviews_count ?? 0,
    category: row.category,
    services: Array.isArray(row.services) ? row.services : [],
    fetchedAt: row.fetched_at,
  };
}

// ---------- public lookups ----------
export async function getCenterByPlaceId(placeId: string): Promise<CenterDTO | null> {
  const result = await db.execute<any>(sql`SELECT * FROM recovery_centers WHERE place_id = ${placeId} LIMIT 1`);
  const rows: any[] = (result as any).rows || result;
  return rows[0] ? rowToDto(rows[0]) : null;
}

export async function getCentersForMetro(metroSlug: string, limit = 25): Promise<CenterDTO[]> {
  const result = await db.execute<any>(sql`
    SELECT * FROM recovery_centers
    WHERE metro_slugs ? ${metroSlug}
    ORDER BY
      CASE category
        WHEN 'rehab' THEN 0 WHEN 'neuro' THEN 1 WHEN 'hospital' THEN 2
        WHEN 'pt' THEN 3 WHEN 'ot' THEN 4 WHEN 'slp' THEN 5 ELSE 6
      END,
      reviews_count DESC NULLS LAST
    LIMIT ${limit}
  `);
  const rows: any[] = (result as any).rows || result;
  return rows.map(rowToDto);
}

export async function getAllPersistedPlaceIds(): Promise<string[]> {
  const result = await db.execute<any>(sql`SELECT place_id FROM recovery_centers ORDER BY refreshed_at DESC LIMIT 5000`);
  const rows: any[] = (result as any).rows || result;
  return rows.map(r => r.place_id);
}

export function isPlacesConfigured(): boolean {
  return !!KEY;
}
