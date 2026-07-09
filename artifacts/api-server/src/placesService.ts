// Google Places API Service for Recovery Center Finder

import { redactZip } from "./lib/redact";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.PLACES_API_KEY;
const GOOGLE_PLACES_BASE_URL = "https://maps.googleapis.com/maps/api/place";

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: { open_now: boolean };
  types: string[];
  formatted_phone_number?: string;
  website?: string;
  business_status?: string;
}

interface SearchResult {
  results: PlaceResult[];
  status: string;
  next_page_token?: string;
}

export interface RecoveryCenter {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating: number;
  reviews: number;
  type: "rehab" | "neuro" | "therapy" | "hospital";
  services: string[];
  distance?: string;
  hours?: string;
  lat: number;
  lng: number;
  isOpen?: boolean;
}

const RECOVERY_CENTER_TYPES = [
  "physiotherapy",
  "hospital",
  "doctor",
  "health",
  "medical_clinic",
  "rehabilitation_center",
];

const TYPE_KEYWORDS = {
  rehab: ["rehabilitation", "physical therapy", "physiotherapy", "rehab"],
  neuro: ["neurology", "neurologist", "brain", "stroke"],
  therapy: ["therapy", "therapist", "counseling", "psychology"],
  hospital: ["hospital", "medical center", "clinic"],
};

function categorizeCenter(name: string, types: string[]): "rehab" | "neuro" | "therapy" | "hospital" {
  const nameLower = name.toLowerCase();
  const typesLower = types.map(t => t.toLowerCase());
  
  for (const [category, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (keywords.some(kw => nameLower.includes(kw) || typesLower.some(t => t.includes(kw)))) {
      return category as "rehab" | "neuro" | "therapy" | "hospital";
    }
  }
  
  return "hospital";
}

function extractServices(types: string[], name: string): string[] {
  const services: string[] = [];
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes("physical") || types.includes("physiotherapist")) {
    services.push("Physical Therapy");
  }
  if (nameLower.includes("occupational")) {
    services.push("Occupational Therapy");
  }
  if (nameLower.includes("speech") || nameLower.includes("language")) {
    services.push("Speech Therapy");
  }
  if (nameLower.includes("neuro") || nameLower.includes("stroke")) {
    services.push("Neurological Rehabilitation");
  }
  if (nameLower.includes("cognitive")) {
    services.push("Cognitive Therapy");
  }
  
  if (services.length === 0) {
    services.push("General Rehabilitation");
  }
  
  return services;
}

export async function searchRecoveryCenters(
  zipCode: string,
  searchQuery?: string,
  type?: string
): Promise<RecoveryCenter[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.log("Google Places API not configured, returning sample data");
    return getSampleCenters(zipCode);
  }

  try {
    // First, geocode the ZIP code to get coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zipCode)}&key=${GOOGLE_PLACES_API_KEY}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json() as any;
    
    if (geocodeData.status !== "OK" || !geocodeData.results?.[0]) {
      console.log("Geocoding failed for ZIP:", redactZip(zipCode));
      return getSampleCenters(zipCode);
    }
    
    const { lat, lng } = geocodeData.results[0].geometry.location;
    
    // Search for rehabilitation centers near the location
    const query = searchQuery 
      ? `${searchQuery} stroke rehabilitation` 
      : "stroke rehabilitation center physical therapy";
    
    const searchUrl = `${GOOGLE_PLACES_BASE_URL}/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=50000&key=${GOOGLE_PLACES_API_KEY}`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json() as SearchResult;
    
    if (searchData.status !== "OK") {
      console.log("Places search failed:", searchData.status);
      return getSampleCenters(zipCode);
    }
    
    const centers: RecoveryCenter[] = searchData.results.slice(0, 10).map((place) => ({
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number,
      website: place.website,
      rating: place.rating || 4.0,
      reviews: place.user_ratings_total || 0,
      type: categorizeCenter(place.name, place.types),
      services: extractServices(place.types, place.name),
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      isOpen: place.opening_hours?.open_now,
    }));
    
    // Filter by type if specified
    if (type && type !== "all") {
      return centers.filter(c => c.type === type);
    }
    
    return centers;
  } catch (error) {
    console.error("Error searching recovery centers:", error);
    return getSampleCenters(zipCode);
  }
}

function getSampleCenters(zipCode: string): RecoveryCenter[] {
  // Return sample data when API is not available
  return [
    {
      id: "sample-1",
      name: "National Stroke Recovery Center",
      address: `123 Recovery Way, ${zipCode}`,
      phone: "(555) 123-4567",
      website: "https://strokerecovery.org",
      rating: 4.8,
      reviews: 234,
      type: "rehab",
      services: ["Physical Therapy", "Occupational Therapy", "Speech Therapy"],
      distance: "2.3 miles",
      hours: "Mon-Fri 8am-6pm",
      lat: 30.2672,
      lng: -97.7431,
    },
    {
      id: "sample-2",
      name: "NeuroRehab Specialists",
      address: `456 Brain Health Blvd, ${zipCode}`,
      phone: "(555) 234-5678",
      website: "https://neurorehab.com",
      rating: 4.9,
      reviews: 189,
      type: "neuro",
      services: ["Neurological Rehab", "Cognitive Therapy", "Balance Training"],
      distance: "4.1 miles",
      hours: "Mon-Sat 7am-7pm",
      lat: 30.2700,
      lng: -97.7500,
    },
    {
      id: "sample-3",
      name: "Stroke Survivors Therapy Center",
      address: `789 Healing Lane, ${zipCode}`,
      phone: "(555) 345-6789",
      website: "https://strokesurvivors.org",
      rating: 4.7,
      reviews: 156,
      type: "therapy",
      services: ["Group Therapy", "Individual Counseling", "Support Groups"],
      distance: "5.8 miles",
      hours: "Mon-Fri 9am-5pm",
      lat: 30.2650,
      lng: -97.7400,
    },
    {
      id: "sample-4",
      name: "Advanced Movement Rehabilitation",
      address: `321 Motion Ave, ${zipCode}`,
      phone: "(555) 456-7890",
      website: "https://advancedmovement.com",
      rating: 4.6,
      reviews: 98,
      type: "rehab",
      services: ["Gait Training", "Constraint Therapy", "Aquatic Therapy"],
      distance: "7.2 miles",
      hours: "Mon-Fri 8am-8pm",
      lat: 30.2600,
      lng: -97.7350,
    },
  ];
}

export function isPlacesConfigured(): boolean {
  return !!GOOGLE_PLACES_API_KEY;
}
