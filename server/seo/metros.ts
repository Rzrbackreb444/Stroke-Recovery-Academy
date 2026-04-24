// 50 top US metros for the SSR Recovery Center Finder hubs.
// Centroids are approximate downtown lat/lng — good enough for a 25-mi search.

export interface Metro {
  slug: string;       // url-safe (e.g., "new-york-ny")
  city: string;       // human (e.g., "New York")
  state: string;      // 2-letter
  stateName: string;  // long
  lat: number;
  lng: number;
  population?: number; // metro pop (rough)
}

export const METROS: Metro[] = [
  { slug: "new-york-ny",      city: "New York",       state: "NY", stateName: "New York",       lat: 40.7128, lng: -74.0060 },
  { slug: "los-angeles-ca",   city: "Los Angeles",    state: "CA", stateName: "California",     lat: 34.0522, lng: -118.2437 },
  { slug: "chicago-il",       city: "Chicago",        state: "IL", stateName: "Illinois",       lat: 41.8781, lng: -87.6298 },
  { slug: "houston-tx",       city: "Houston",        state: "TX", stateName: "Texas",          lat: 29.7604, lng: -95.3698 },
  { slug: "phoenix-az",       city: "Phoenix",        state: "AZ", stateName: "Arizona",        lat: 33.4484, lng: -112.0740 },
  { slug: "philadelphia-pa",  city: "Philadelphia",   state: "PA", stateName: "Pennsylvania",   lat: 39.9526, lng: -75.1652 },
  { slug: "san-antonio-tx",   city: "San Antonio",    state: "TX", stateName: "Texas",          lat: 29.4241, lng: -98.4936 },
  { slug: "san-diego-ca",     city: "San Diego",      state: "CA", stateName: "California",     lat: 32.7157, lng: -117.1611 },
  { slug: "dallas-tx",        city: "Dallas",         state: "TX", stateName: "Texas",          lat: 32.7767, lng: -96.7970 },
  { slug: "austin-tx",        city: "Austin",         state: "TX", stateName: "Texas",          lat: 30.2672, lng: -97.7431 },
  { slug: "jacksonville-fl",  city: "Jacksonville",   state: "FL", stateName: "Florida",        lat: 30.3322, lng: -81.6557 },
  { slug: "fort-worth-tx",    city: "Fort Worth",     state: "TX", stateName: "Texas",          lat: 32.7555, lng: -97.3308 },
  { slug: "columbus-oh",      city: "Columbus",       state: "OH", stateName: "Ohio",           lat: 39.9612, lng: -82.9988 },
  { slug: "charlotte-nc",     city: "Charlotte",      state: "NC", stateName: "North Carolina", lat: 35.2271, lng: -80.8431 },
  { slug: "san-francisco-ca", city: "San Francisco",  state: "CA", stateName: "California",     lat: 37.7749, lng: -122.4194 },
  { slug: "indianapolis-in",  city: "Indianapolis",   state: "IN", stateName: "Indiana",        lat: 39.7684, lng: -86.1581 },
  { slug: "seattle-wa",       city: "Seattle",        state: "WA", stateName: "Washington",     lat: 47.6062, lng: -122.3321 },
  { slug: "denver-co",        city: "Denver",         state: "CO", stateName: "Colorado",       lat: 39.7392, lng: -104.9903 },
  { slug: "washington-dc",    city: "Washington",     state: "DC", stateName: "District of Columbia", lat: 38.9072, lng: -77.0369 },
  { slug: "boston-ma",        city: "Boston",         state: "MA", stateName: "Massachusetts",  lat: 42.3601, lng: -71.0589 },
  { slug: "el-paso-tx",       city: "El Paso",        state: "TX", stateName: "Texas",          lat: 31.7619, lng: -106.4850 },
  { slug: "nashville-tn",     city: "Nashville",      state: "TN", stateName: "Tennessee",      lat: 36.1627, lng: -86.7816 },
  { slug: "detroit-mi",       city: "Detroit",        state: "MI", stateName: "Michigan",       lat: 42.3314, lng: -83.0458 },
  { slug: "oklahoma-city-ok", city: "Oklahoma City",  state: "OK", stateName: "Oklahoma",       lat: 35.4676, lng: -97.5164 },
  { slug: "portland-or",      city: "Portland",       state: "OR", stateName: "Oregon",         lat: 45.5152, lng: -122.6784 },
  { slug: "las-vegas-nv",     city: "Las Vegas",      state: "NV", stateName: "Nevada",         lat: 36.1699, lng: -115.1398 },
  { slug: "memphis-tn",       city: "Memphis",        state: "TN", stateName: "Tennessee",      lat: 35.1495, lng: -90.0490 },
  { slug: "louisville-ky",    city: "Louisville",     state: "KY", stateName: "Kentucky",       lat: 38.2527, lng: -85.7585 },
  { slug: "baltimore-md",     city: "Baltimore",      state: "MD", stateName: "Maryland",       lat: 39.2904, lng: -76.6122 },
  { slug: "milwaukee-wi",     city: "Milwaukee",      state: "WI", stateName: "Wisconsin",      lat: 43.0389, lng: -87.9065 },
  { slug: "albuquerque-nm",   city: "Albuquerque",    state: "NM", stateName: "New Mexico",     lat: 35.0844, lng: -106.6504 },
  { slug: "tucson-az",        city: "Tucson",         state: "AZ", stateName: "Arizona",        lat: 32.2226, lng: -110.9747 },
  { slug: "fresno-ca",        city: "Fresno",         state: "CA", stateName: "California",     lat: 36.7378, lng: -119.7871 },
  { slug: "sacramento-ca",    city: "Sacramento",     state: "CA", stateName: "California",     lat: 38.5816, lng: -121.4944 },
  { slug: "kansas-city-mo",   city: "Kansas City",    state: "MO", stateName: "Missouri",       lat: 39.0997, lng: -94.5786 },
  { slug: "atlanta-ga",       city: "Atlanta",        state: "GA", stateName: "Georgia",        lat: 33.7490, lng: -84.3880 },
  { slug: "miami-fl",         city: "Miami",          state: "FL", stateName: "Florida",        lat: 25.7617, lng: -80.1918 },
  { slug: "tampa-fl",         city: "Tampa",          state: "FL", stateName: "Florida",        lat: 27.9506, lng: -82.4572 },
  { slug: "orlando-fl",       city: "Orlando",        state: "FL", stateName: "Florida",        lat: 28.5383, lng: -81.3792 },
  { slug: "minneapolis-mn",   city: "Minneapolis",    state: "MN", stateName: "Minnesota",      lat: 44.9778, lng: -93.2650 },
  { slug: "saint-louis-mo",   city: "St. Louis",      state: "MO", stateName: "Missouri",       lat: 38.6270, lng: -90.1994 },
  { slug: "pittsburgh-pa",    city: "Pittsburgh",     state: "PA", stateName: "Pennsylvania",   lat: 40.4406, lng: -79.9959 },
  { slug: "cincinnati-oh",    city: "Cincinnati",     state: "OH", stateName: "Ohio",           lat: 39.1031, lng: -84.5120 },
  { slug: "cleveland-oh",     city: "Cleveland",      state: "OH", stateName: "Ohio",           lat: 41.4993, lng: -81.6944 },
  { slug: "raleigh-nc",       city: "Raleigh",        state: "NC", stateName: "North Carolina", lat: 35.7796, lng: -78.6382 },
  { slug: "salt-lake-city-ut",city: "Salt Lake City", state: "UT", stateName: "Utah",           lat: 40.7608, lng: -111.8910 },
  { slug: "richmond-va",      city: "Richmond",       state: "VA", stateName: "Virginia",       lat: 37.5407, lng: -77.4360 },
  { slug: "buffalo-ny",       city: "Buffalo",        state: "NY", stateName: "New York",       lat: 42.8864, lng: -78.8784 },
  { slug: "new-orleans-la",   city: "New Orleans",    state: "LA", stateName: "Louisiana",      lat: 29.9511, lng: -90.0715 },
  { slug: "hartford-ct",      city: "Hartford",       state: "CT", stateName: "Connecticut",    lat: 41.7658, lng: -72.6734 },
];

export function getMetroBySlug(slug: string): Metro | undefined {
  return METROS.find(m => m.slug === slug.toLowerCase());
}

export function findNearestMetro(lat: number, lng: number): Metro {
  let best = METROS[0];
  let bestDist = Number.MAX_SAFE_INTEGER;
  for (const m of METROS) {
    const dx = m.lat - lat;
    const dy = m.lng - lng;
    const d = dx * dx + dy * dy;
    if (d < bestDist) { bestDist = d; best = m; }
  }
  return best;
}
