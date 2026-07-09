import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import RecoverySEO, { createLocalBusinessSchema } from "@/components/RecoverySEO";
import SasquatchChatWidget from "@/components/recovery/SasquatchChatWidget";
import {
  MapPin, Search, Phone, Globe, Star, Clock,
  Navigation, Building2, Heart, Brain, Dumbbell, AlertCircle,
  ExternalLink, CheckCircle, ListChecks, Activity, Mic2
} from "lucide-react";
import { Link } from "wouter";

// New API shape (recoveryCentersService) — kept loose to also tolerate old shape.
interface RecoveryCenter {
  // new
  placeId?: string;
  category?: string; // rehab|neuro|hospital|pt|ot|slp|therapy
  distanceMiles?: number;
  reviewsCount?: number;
  // legacy / alias
  id?: string;
  type?: string;
  distance?: string;
  reviews?: number;
  // shared
  name: string;
  address: string;
  phone?: string;
  website?: string;
  googleMapsUrl?: string;
  rating: number;
  services: string[];
  hours?: string;
  lat: number;
  lng: number;
  isOpen?: boolean;
}

const centerTypes = [
  { id: "all",   label: "All Centers",   icon: Building2 },
  { id: "rehab", label: "Stroke Rehab",  icon: Dumbbell },
  { id: "neuro", label: "Neurology",     icon: Brain },
  { id: "pt",    label: "Physical Therapy", icon: Activity },
  { id: "ot",    label: "Occupational",  icon: Heart },
  { id: "slp",   label: "Speech",        icon: Mic2 },
];

const typeColors: Record<string, string> = {
  rehab:    "bg-blue-500/20 text-blue-400 border-blue-500/30",
  neuro:    "bg-purple-500/20 text-purple-400 border-purple-500/30",
  therapy:  "bg-green-500/20 text-green-400 border-green-500/30",
  hospital: "bg-red-500/20 text-red-400 border-red-500/30",
  pt:       "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  ot:       "bg-amber-500/20 text-amber-400 border-amber-500/30",
  slp:      "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

const categoryLabel = (c: string): string => {
  switch (c) {
    case "rehab":    return "Stroke Rehab";
    case "neuro":    return "Neurology";
    case "hospital": return "Hospital";
    case "pt":       return "Physical Therapy";
    case "ot":       return "Occupational Therapy";
    case "slp":      return "Speech-Language";
    default:         return "Therapy";
  }
};

const fmtDistance = (c: RecoveryCenter): string => {
  if (typeof c.distanceMiles === "number") return `${c.distanceMiles.toFixed(1)} mi`;
  if (typeof c.distance === "string") return c.distance;
  return "";
};

const centerKey = (c: RecoveryCenter, idx: number): string => c.placeId || c.id || String(idx);
const centerCategory = (c: RecoveryCenter): string => (c.category || c.type || "therapy") as string;
const centerReviews = (c: RecoveryCenter): number => c.reviewsCount ?? c.reviews ?? 0;

export default function RecoveryCenterFinder() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [zipCode, setZipCode] = useState("");
  const [searchParams, setSearchParams] = useState({ zipCode: "", query: "", type: "all" });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/recovery/centers', searchParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchParams.zipCode) params.set('zipCode', searchParams.zipCode);
      if (searchParams.query) params.set('query', searchParams.query);
      if (searchParams.type !== 'all') params.set('type', searchParams.type);
      
      const res = await fetch(`/api/recovery/centers?${params}`);
      if (!res.ok) throw new Error('Failed to fetch centers');
      return res.json();
    },
    enabled: !!searchParams.zipCode,
  });

  const handleFindCenters = () => {
    if (!zipCode.trim()) return;
    setSearchParams({
      zipCode: zipCode.trim(),
      query: searchQuery,
      type: activeType,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFindCenters();
    }
  };

  const centers: RecoveryCenter[] = data?.centers || [];
  const isLive = data?.isLive || false;
  const resolved = data?.resolved as { city?: string; state?: string; address?: string } | undefined;

  const filteredCenters = centers.filter(center => {
    const cat = centerCategory(center);
    const matchesType = activeType === "all" || cat === activeType;
    const matchesSearch = !searchQuery ||
      center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoverySEO
        title="Stroke Recovery Center Finder — Find Rehab Centers, Neurologists & Therapists Near You"
        description="Search for stroke rehabilitation centers, neurologists, physical therapists, occupational therapists, and speech-language pathologists near you. Find the right stroke recovery specialists using live Google Maps data."
        canonical="/recovery/center-finder"
        pageType="medical"
        keywords={[
          "stroke rehabilitation center near me", "stroke recovery center", "neurologist near me stroke",
          "physical therapist stroke recovery", "occupational therapist stroke", "speech therapist near me",
          "inpatient stroke rehab", "outpatient stroke therapy", "stroke specialist", "aphasia therapist near me",
          "constraint induced movement therapy near me", "stroke support group near me"
        ]}
        speakableSelectors={["h1", ".center-finder-intro"]}
        breadcrumbs={[{ name: "Recovery Hub", url: "/recovery" }, { name: "Center Finder", url: "/recovery/center-finder" }]}
        additionalSchema={createLocalBusinessSchema({
          name: "Stroke Recovery Academy — Center Finder",
          description: "Directory of stroke rehabilitation centers, neurologists, and therapy providers across the United States",
        })}
        faq={[
          { question: "How do I find a stroke rehabilitation center near me?", answer: "Use our Recovery Center Finder tool above — enter your ZIP code to search Google Maps data for inpatient rehabilitation hospitals, outpatient stroke therapy clinics, neurologists, physical therapists, occupational therapists, and speech-language pathologists in your area. You can also contact your hospital's social worker, ask your neurologist for a referral, or call your insurance company for in-network providers." },
          { question: "What is the difference between inpatient and outpatient stroke rehabilitation?", answer: "Inpatient (acute) rehabilitation is for survivors who need intensive therapy immediately after hospitalization — you live at the facility and receive 3+ hours of therapy daily. Outpatient rehabilitation allows you to live at home while attending therapy sessions 2-5 days per week. Most survivors transition from inpatient to outpatient as they stabilize. The level of care depends on your functional abilities and insurance coverage." },
          { question: "What should I look for in a stroke rehabilitation center?", answer: "Key factors when choosing a stroke rehab center: CARF accreditation (gold standard), a dedicated stroke program with neurologists and rehabilitation specialists, high volume of stroke patients (more experience = better outcomes), comprehensive team (PT, OT, SLP, neuropsychologist, social worker), availability of advanced therapies (robotic therapy, CIMT, constraint-induced movement therapy), and patient-to-staff ratios. Ask for outcome data — good centers track and share their recovery statistics." },
          { question: "How do I qualify for inpatient stroke rehabilitation?", answer: "To qualify for inpatient acute rehabilitation, patients generally must be able to participate in at least 3 hours of therapy daily, have a specific diagnosis that benefits from intensive rehab (stroke qualifies), show potential for functional improvement, and have medical stability. Medicare, Medicaid, and most private insurers cover inpatient rehab when medically necessary. A physiatrist will assess your eligibility." },
          { question: "Is outpatient stroke therapy covered by insurance?", answer: "Most insurance plans including Medicare cover outpatient stroke therapy when medically necessary and ordered by a physician. Medicare Part B covers physical, occupational, and speech therapy with an 80/20 cost split after deductible. Private insurance coverage varies — call your insurer to confirm in-network providers, session limits, and prior authorization requirements. Many therapy centers offer financial assistance for uninsured patients." }
        ]}
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3 mb-3">
            <MapPin className="h-10 w-10 text-[#E2741B]" />
            Recovery Center Finder
          </h1>
          <p className="text-gray-400 text-lg">
            Find rehabilitation centers, therapists, and support services near you
          </p>
          {isLive && (
            <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Live Google Maps Data
            </Badge>
          )}
        </div>

        <Card className="bg-[#1a1a1a] border-[#333] p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                placeholder="Enter ZIP code (e.g., 78701)"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-[#0D0D0D] border-[#333] pl-10 text-white"
                data-testid="input-zip-code"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                placeholder="Search by name or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-[#0D0D0D] border-[#333] pl-10 text-white"
                data-testid="input-search-centers"
              />
            </div>
            <Button 
              className="bg-[#E2741B] text-black font-semibold hover:bg-[#E2741B]/90" 
              onClick={handleFindCenters}
              disabled={isLoading || !zipCode.trim()}
              data-testid="button-find-centers"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isLoading ? "Searching..." : "Find Centers"}
            </Button>
          </div>
        </Card>

        <div className="flex flex-wrap gap-2 mb-6">
          {centerTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                key={type.id}
                variant={activeType === type.id ? "default" : "outline"}
                onClick={() => setActiveType(type.id)}
                className={activeType === type.id ? "bg-[#E2741B] text-black" : "border-[#333] text-gray-300"}
                data-testid={`button-type-${type.id}`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {type.label}
              </Button>
            );
          })}
        </div>

        {!searchParams.zipCode && (
          <Card className="bg-[#1a1a1a] border-[#333] p-12 text-center">
            <MapPin className="h-16 w-16 text-[#E2741B] mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Enter Your ZIP Code</h3>
            <p className="text-gray-400 mb-4">
              We'll search for stroke rehabilitation centers, neurologists, and therapy services in your area
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
              <Badge variant="outline" className="border-[#333]">Physical Therapy</Badge>
              <Badge variant="outline" className="border-[#333]">Occupational Therapy</Badge>
              <Badge variant="outline" className="border-[#333]">Speech Therapy</Badge>
              <Badge variant="outline" className="border-[#333]">Neurologists</Badge>
              <Badge variant="outline" className="border-[#333]">Rehab Centers</Badge>
            </div>
          </Card>
        )}

        {isLoading && (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-[#1a1a1a] border-[#333] p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-3/4 bg-[#333]" />
                    <Skeleton className="h-4 w-full bg-[#333]" />
                    <Skeleton className="h-4 w-1/2 bg-[#333]" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-24 bg-[#333]" />
                      <Skeleton className="h-6 w-24 bg-[#333]" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-32 bg-[#333]" />
                    <Skeleton className="h-10 w-32 bg-[#333]" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card className="bg-red-500/10 border-red-500/30 p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-400 mb-2">Search Failed</h3>
            <p className="text-gray-400 mb-4">We couldn't complete your search. Please try again.</p>
            <Button variant="outline" onClick={() => refetch()} className="border-red-500/30 text-red-400">
              Try Again
            </Button>
          </Card>
        )}

        {searchParams.zipCode && !isLoading && !error && (
          <div className="grid gap-4">
            {filteredCenters.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <p className="text-gray-400 text-sm" data-testid="text-results-summary">
                  Found <span className="text-white font-semibold">{filteredCenters.length}</span> center{filteredCenters.length !== 1 ? 's' : ''}
                  {resolved?.city ? <> near <span className="text-white">{resolved.city}{resolved.state ? `, ${resolved.state}` : ''}</span></> : <> near {searchParams.zipCode}</>}
                </p>
                {isLive && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 self-start" data-testid="badge-live-data">
                    <CheckCircle className="h-3 w-3 mr-1" /> Live Google Places data
                  </Badge>
                )}
              </div>
            )}

            {/* What to Ask guide — shown above results to set the right tone */}
            {filteredCenters.length > 0 && (
              <Card className="bg-[#1a1a1a] border-[#E2741B]/30 p-5 mb-2" data-testid="card-what-to-ask">
                <div className="flex items-start gap-3">
                  <ListChecks className="h-5 w-5 text-[#E2741B] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-2">Bring this list to your first call</h3>
                    <ul className="text-sm text-gray-300 space-y-1.5 leading-relaxed">
                      <li>• "How many stroke survivors do you currently see, and what's a typical recovery arc?"</li>
                      <li>• "Do you offer task-specific repetition, or mostly passive modalities?"</li>
                      <li>• "How will you measure my progress objectively?"</li>
                      <li>• "Will my PT, OT, SLP, and neurologist coordinate?"</li>
                      <li>• "What happens when I plateau — do you push intensity, or stop?"</li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {filteredCenters.map((center, idx) => {
              const k = centerKey(center, idx);
              const cat = centerCategory(center);
              const distStr = fmtDistance(center);
              const reviewCount = centerReviews(center);
              return (
                <Card
                  key={k}
                  className="bg-[#1a1a1a] border-[#333] p-6 hover:border-[#E2741B]/30 transition-all duration-200"
                  data-testid={`card-center-${k}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-2 flex-wrap">
                        {center.placeId ? (
                          <Link href={`/recovery/center/${encodeURIComponent(center.placeId)}`}>
                            <h3 className="text-xl font-bold text-white hover:text-[#E2741B] transition-colors cursor-pointer" data-testid={`text-center-name-${k}`}>{center.name}</h3>
                          </Link>
                        ) : (
                          <h3 className="text-xl font-bold text-white" data-testid={`text-center-name-${k}`}>{center.name}</h3>
                        )}
                        <Badge className={typeColors[cat] || typeColors.therapy} data-testid={`badge-category-${k}`}>
                          {categoryLabel(cat)}
                        </Badge>
                        {center.isOpen !== undefined && (
                          <Badge className={center.isOpen ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                            {center.isOpen ? "Open Now" : "Closed"}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm mb-3">
                        <span className="flex items-center gap-1" data-testid={`text-address-${k}`}>
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          {center.address}
                        </span>
                        {distStr && (
                          <span className="flex items-center gap-1 text-[#E2741B]" data-testid={`text-distance-${k}`}>
                            <Navigation className="h-3.5 w-3.5" />
                            {distStr}
                          </span>
                        )}
                        {center.hours && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {center.hours}
                          </span>
                        )}
                      </div>

                      {!!center.rating && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-[#E2741B] fill-[#E2741B]" />
                            <span className="font-semibold text-white">{Number(center.rating).toFixed(1)}</span>
                          </div>
                          <span className="text-gray-500">({reviewCount} reviews)</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {center.services.map((service) => (
                          <Badge key={service} variant="outline" className="border-[#333] text-gray-300">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:min-w-[160px]">
                      {center.phone && (
                        <Button
                          className="bg-[#E2741B] text-black hover:bg-[#E2741B]/90"
                          onClick={() => window.open(`tel:${center.phone}`)}
                          data-testid={`button-call-${k}`}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call Now
                        </Button>
                      )}
                      {center.website && (
                        <Button
                          variant="outline"
                          className="border-[#333] text-gray-300"
                          onClick={() => window.open(center.website, '_blank')}
                          data-testid={`button-website-${k}`}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Website
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="border-[#333] text-gray-300"
                        onClick={() => window.open(center.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.name + ' ' + center.address)}`, '_blank')}
                        data-testid={`button-directions-${k}`}
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Directions
                      </Button>
                      {center.placeId && (
                        <Link href={`/recovery/center/${encodeURIComponent(center.placeId)}`}>
                          <Button
                            variant="outline"
                            className="w-full border-[#E2741B]/40 text-[#E2741B] hover:bg-[#E2741B]/10"
                            data-testid={`button-detail-${k}`}
                          >
                            Details
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {searchParams.zipCode && !isLoading && !error && filteredCenters.length === 0 && (
          <Card className="bg-[#1a1a1a] border-[#333] p-12 text-center">
            <MapPin className="h-16 w-16 text-[#E2741B] mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No centers found</h3>
            <p className="text-gray-400 mb-4">
              Try adjusting your search filters or expanding your search area
            </p>
            <Button 
              variant="outline" 
              className="border-[#E2741B] text-[#E2741B]"
              onClick={() => {
                setActiveType("all");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </Button>
          </Card>
        )}
      </main>

      <SasquatchChatWidget />
    </div>
  );
}
