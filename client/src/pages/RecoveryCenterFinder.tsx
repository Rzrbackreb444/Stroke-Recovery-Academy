import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import SasquatchChatWidget from "@/components/recovery/SasquatchChatWidget";
import { 
  MapPin, Search, Phone, Globe, Star, Clock, 
  Navigation, Filter, Building2, Heart, Brain, Dumbbell
} from "lucide-react";

const centerTypes = [
  { id: "all", label: "All Centers", icon: Building2 },
  { id: "rehab", label: "Rehabilitation", icon: Dumbbell },
  { id: "neuro", label: "Neurology", icon: Brain },
  { id: "therapy", label: "Therapy", icon: Heart },
];

const recoveryCenters = [
  {
    id: 1,
    name: "National Stroke Recovery Center",
    type: "rehab",
    address: "123 Recovery Way, Austin, TX 78701",
    phone: "(512) 555-0100",
    website: "https://strokerecovery.org",
    rating: 4.8,
    reviews: 234,
    services: ["Physical Therapy", "Occupational Therapy", "Speech Therapy"],
    distance: "2.3 miles",
    hours: "Mon-Fri 8am-6pm",
  },
  {
    id: 2,
    name: "NeuroRehab Specialists",
    type: "neuro",
    address: "456 Brain Health Blvd, Austin, TX 78702",
    phone: "(512) 555-0200",
    website: "https://neurorehab.com",
    rating: 4.9,
    reviews: 189,
    services: ["Neurological Rehab", "Cognitive Therapy", "Balance Training"],
    distance: "4.1 miles",
    hours: "Mon-Sat 7am-7pm",
  },
  {
    id: 3,
    name: "Stroke Survivors Therapy Center",
    type: "therapy",
    address: "789 Healing Lane, Austin, TX 78703",
    phone: "(512) 555-0300",
    website: "https://strokesurvivors.org",
    rating: 4.7,
    reviews: 156,
    services: ["Group Therapy", "Individual Counseling", "Support Groups"],
    distance: "5.8 miles",
    hours: "Mon-Fri 9am-5pm",
  },
  {
    id: 4,
    name: "Advanced Movement Rehabilitation",
    type: "rehab",
    address: "321 Motion Ave, Austin, TX 78704",
    phone: "(512) 555-0400",
    website: "https://advancedmovement.com",
    rating: 4.6,
    reviews: 98,
    services: ["Gait Training", "Constraint Therapy", "Aquatic Therapy"],
    distance: "7.2 miles",
    hours: "Mon-Fri 8am-8pm",
  },
];

export default function RecoveryCenterFinder() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [zipCode, setZipCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchedZip, setSearchedZip] = useState("");

  const handleFindCenters = () => {
    if (!zipCode.trim()) return;
    setIsSearching(true);
    setSearchedZip(zipCode.trim());
    setTimeout(() => setIsSearching(false), 500);
  };

  const extractZipFromAddress = (address: string): string => {
    const match = address.match(/\b(\d{5})\b/);
    return match ? match[1] : "";
  };

  const filteredCenters = recoveryCenters.filter(center => {
    const matchesType = activeType === "all" || center.type === activeType;
    const matchesSearch = center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         center.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const centerZip = extractZipFromAddress(center.address);
    const matchesZip = !searchedZip || centerZip.startsWith(searchedZip.slice(0, 3));
    return matchesType && matchesSearch && matchesZip;
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
        </div>

        <Card className="bg-[#1a1a1a] border-[#333] p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                placeholder="Enter ZIP code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
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
                className="bg-[#0D0D0D] border-[#333] pl-10 text-white"
                data-testid="input-search-centers"
              />
            </div>
            <Button 
              className="bg-[#C9941A] text-black font-semibold" 
              onClick={handleFindCenters}
              disabled={isSearching}
              data-testid="button-find-centers"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isSearching ? "Searching..." : "Find Centers"}
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

        <div className="grid gap-4">
          {filteredCenters.map((center) => (
            <Card key={center.id} className="bg-[#1a1a1a] border-[#333] p-6 hover:border-[#C9941A]/30 transition-colors" data-testid={`card-center-${center.id}`}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{center.name}</h3>
                    <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30">
                      {center.distance}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-gray-400 text-sm mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {center.address}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {center.hours}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-[#C9941A] fill-[#C9941A]" />
                      <span className="font-semibold text-white">{center.rating}</span>
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

                <div className="flex flex-col gap-2">
                  <Button className="bg-[#C9941A] text-black" data-testid={`button-call-${center.id}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </Button>
                  <Button variant="outline" className="border-[#333] text-gray-300" data-testid={`button-website-${center.id}`}>
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredCenters.length === 0 && (
          <Card className="bg-[#1a1a1a] border-[#333] p-12 text-center">
            <MapPin className="h-16 w-16 text-[#C9941A] mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No centers found</h3>
            <p className="text-gray-400">Try adjusting your search or expanding your area</p>
          </Card>
        )}
      </main>

      <SasquatchChatWidget />
    </div>
  );
}
