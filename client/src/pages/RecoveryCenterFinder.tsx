import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import SEO from "@/components/SEO";
import SasquatchChatWidget from "@/components/recovery/SasquatchChatWidget";
import { 
  MapPin, Search, Phone, Globe, Star, Clock, 
  Navigation, Building2, Heart, Brain, Dumbbell, AlertCircle,
  ExternalLink, CheckCircle
} from "lucide-react";

interface RecoveryCenter {
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

const centerTypes = [
  { id: "all", label: "All Centers", icon: Building2 },
  { id: "rehab", label: "Rehabilitation", icon: Dumbbell },
  { id: "neuro", label: "Neurology", icon: Brain },
  { id: "therapy", label: "Therapy", icon: Heart },
];

const typeColors = {
  rehab: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  neuro: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  therapy: "bg-green-500/20 text-green-400 border-green-500/30",
  hospital: "bg-red-500/20 text-red-400 border-red-500/30",
};

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

  const filteredCenters = centers.filter(center => {
    const matchesType = activeType === "all" || center.type === activeType;
    const matchesSearch = !searchQuery || 
      center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <SEO
        title="Recovery Center Finder | Stroke Recovery Academy"
        description="Find stroke rehabilitation centers, neurologists, and therapy services near you."
        canonical="/recovery/center-finder"
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3 mb-3">
            <MapPin className="h-10 w-10 text-[#C9941A]" />
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
              className="bg-[#C9941A] text-black font-semibold hover:bg-[#C9941A]/90" 
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
                className={activeType === type.id ? "bg-[#C9941A] text-black" : "border-[#333] text-gray-300"}
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
            <MapPin className="h-16 w-16 text-[#C9941A] mx-auto mb-4" />
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
              <p className="text-gray-400 text-sm mb-2">
                Found {filteredCenters.length} center{filteredCenters.length !== 1 ? 's' : ''} near {searchParams.zipCode}
              </p>
            )}
            
            {filteredCenters.map((center) => (
              <Card 
                key={center.id} 
                className="bg-[#1a1a1a] border-[#333] p-6 hover:border-[#C9941A]/30 transition-all duration-200" 
                data-testid={`card-center-${center.id}`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-white">{center.name}</h3>
                      <Badge className={typeColors[center.type]}>
                        {center.type.charAt(0).toUpperCase() + center.type.slice(1)}
                      </Badge>
                      {center.isOpen !== undefined && (
                        <Badge className={center.isOpen ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                          {center.isOpen ? "Open Now" : "Closed"}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {center.address}
                      </span>
                      {center.hours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {center.hours}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-[#C9941A] fill-[#C9941A]" />
                        <span className="font-semibold text-white">{center.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-gray-500">({center.reviews} reviews)</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {center.services.map((service) => (
                        <Badge key={service} variant="outline" className="border-[#333] text-gray-300">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[140px]">
                    {center.phone && (
                      <Button 
                        className="bg-[#C9941A] text-black hover:bg-[#C9941A]/90" 
                        onClick={() => window.open(`tel:${center.phone}`)}
                        data-testid={`button-call-${center.id}`}
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
                        data-testid={`button-website-${center.id}`}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Website
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="border-[#333] text-gray-300"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.name + ' ' + center.address)}`, '_blank')}
                      data-testid={`button-directions-${center.id}`}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Directions
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {searchParams.zipCode && !isLoading && !error && filteredCenters.length === 0 && (
          <Card className="bg-[#1a1a1a] border-[#333] p-12 text-center">
            <MapPin className="h-16 w-16 text-[#C9941A] mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No centers found</h3>
            <p className="text-gray-400 mb-4">
              Try adjusting your search filters or expanding your search area
            </p>
            <Button 
              variant="outline" 
              className="border-[#C9941A] text-[#C9941A]"
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
