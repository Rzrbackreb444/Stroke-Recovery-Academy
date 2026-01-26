import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Rocket,
  FileDown,
  Globe,
  DollarSign,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Printer,
  Headphones,
  Loader2,
  Info,
  TrendingUp,
  Store,
  Library,
  Smartphone,
  Calculator,
  Zap,
  Crown,
  ChevronRight,
} from "lucide-react";

interface PublishingPlatform {
  id: string;
  name: string;
  type: string;
  logo: string;
  description: string;
  royaltyRate: string;
  features: string[];
  apiAvailable: boolean;
  setupUrl: string;
  status: string;
}

interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  description: string;
  platforms: string[];
  features: string[];
}

const platformIcons: Record<string, typeof Store> = {
  amazon_kdp: BookOpen,
  apple_books: Smartphone,
  barnes_noble: Store,
  lulu: Printer,
  draft2digital: Globe,
  ingram_spark: Library,
  kobo: BookOpen,
  google_play: Smartphone,
  smashwords: Globe,
  scribd: BookOpen,
  overdrive: Library,
};

const platformColors: Record<string, string> = {
  amazon_kdp: "bg-orange-500",
  apple_books: "bg-gray-800",
  barnes_noble: "bg-green-600",
  lulu: "bg-blue-600",
  draft2digital: "bg-purple-600",
  ingram_spark: "bg-red-600",
  kobo: "bg-teal-600",
  google_play: "bg-blue-500",
  smashwords: "bg-indigo-600",
  scribd: "bg-yellow-600",
  overdrive: "bg-pink-600",
};

export default function PublishingHub() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [listPrice, setListPrice] = useState("9.99");
  const [printCost, setPrintCost] = useState("2.50");
  const [selectedFormat, setSelectedFormat] = useState<string>("epub3");
  const [showRoyaltyDialog, setShowRoyaltyDialog] = useState(false);

  const { data: platformsData, isLoading } = useQuery<{
    platforms: PublishingPlatform[];
    formats: ExportFormat[];
    totalPlatforms: number;
  }>({
    queryKey: ["/api/publishing-platforms"],
  });

  const { data: strategiesData } = useQuery<{
    strategies: Record<string, any>;
  }>({
    queryKey: ["/api/publishing-platforms/distribution-strategies"],
  });

  const platforms = platformsData?.platforms || [];
  const formats = platformsData?.formats || [];
  const strategies = strategiesData?.strategies || {};

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const selectStrategy = (strategyPlatforms: string[]) => {
    setSelectedPlatforms(strategyPlatforms);
  };

  const calculateEstimatedRoyalty = (platform: PublishingPlatform): number => {
    const price = parseFloat(listPrice) || 0;
    const cost = parseFloat(printCost) || 0;
    
    const rates: Record<string, number> = {
      amazon_kdp: price >= 2.99 && price <= 9.99 ? 0.70 : 0.35,
      apple_books: 0.70,
      barnes_noble: price >= 2.99 ? 0.65 : 0.40,
      lulu: 0.80,
      draft2digital: 0.60,
      ingram_spark: 0.40,
      kobo: price >= 2.99 ? 0.70 : 0.45,
      google_play: 0.52,
      smashwords: 0.60,
    };

    const rate = rates[platform.id] || 0.50;
    return Math.max(0, (price * rate) - (platform.type === 'print' ? cost : 0));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-foreground" data-testid="text-publishing-hub-title">
          Universal Publishing Hub
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Distribute your book to {platforms.length}+ platforms worldwide. Export in any format.
          Maximize your reach and earnings.
        </p>
      </div>

      <Tabs defaultValue="platforms" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid" data-testid="tabs-publishing">
          <TabsTrigger value="platforms" data-testid="tab-platforms">Platforms</TabsTrigger>
          <TabsTrigger value="formats" data-testid="tab-formats">Export Formats</TabsTrigger>
          <TabsTrigger value="royalties" data-testid="tab-royalties">Royalty Calculator</TabsTrigger>
          <TabsTrigger value="strategies" data-testid="tab-strategies">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-6 mt-6">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {selectedPlatforms.length} Selected
              </Badge>
              {selectedPlatforms.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPlatforms([])}
                  data-testid="button-clear-selection"
                >
                  Clear
                </Button>
              )}
            </div>
            <Button
              onClick={() => setSelectedPlatforms(platforms.map(p => p.id))}
              variant="outline"
              size="sm"
              data-testid="button-select-all"
            >
              Select All Platforms
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform) => {
              const Icon = platformIcons[platform.id] || Globe;
              const isSelected = selectedPlatforms.includes(platform.id);
              const estimatedRoyalty = calculateEstimatedRoyalty(platform);

              return (
                <Card
                  key={platform.id}
                  className={`cursor-pointer transition-all hover-elevate ${
                    isSelected ? "ring-2 ring-primary border-primary" : ""
                  }`}
                  onClick={() => togglePlatform(platform.id)}
                  data-testid={`card-platform-${platform.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${platformColors[platform.id] || "bg-gray-500"} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{platform.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {platform.type}
                            </Badge>
                            {platform.apiAvailable && (
                              <Badge variant="outline" className="text-xs text-green-600">
                                API
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => togglePlatform(platform.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {platform.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Royalty:</span>
                      <span className="font-semibold text-green-600">{platform.royaltyRate}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Est. per sale:</span>
                      <span className="font-bold text-primary">${estimatedRoyalty.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {platform.features.slice(0, 3).map((feature, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {platform.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{platform.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <a
                      href={platform.setupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Setup Account <ExternalLink className="w-3 h-3" />
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="formats" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formats.map((format) => (
              <Card
                key={format.id}
                className={`cursor-pointer transition-all hover-elevate ${
                  selectedFormat === format.id ? "ring-2 ring-primary border-primary" : ""
                }`}
                onClick={() => setSelectedFormat(format.id)}
                data-testid={`card-format-${format.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileDown className="w-4 h-4 text-primary" />
                      {format.name}
                    </CardTitle>
                    <Badge variant="outline">{format.extension}</Badge>
                  </div>
                  <CardDescription>{format.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {format.features.map((feature, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Compatible with:</p>
                    <div className="flex flex-wrap gap-1">
                      {format.platforms.slice(0, 4).map((platformId) => {
                        const platform = platforms.find(p => p.id === platformId);
                        return platform ? (
                          <Badge key={platformId} variant="outline" className="text-xs">
                            {platform.name}
                          </Badge>
                        ) : null;
                      })}
                      {format.platforms.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{format.platforms.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Export Selected Format
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Selected: <strong>{formats.find(f => f.id === selectedFormat)?.name || "None"}</strong>
                </p>
              </div>
              <Button className="gap-2" data-testid="button-export-format">
                <FileDown className="w-4 h-4" />
                Export {formats.find(f => f.id === selectedFormat)?.extension || ""}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="royalties" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Royalty Calculator
              </CardTitle>
              <CardDescription>
                Compare earnings across all publishing platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="list-price">List Price ($)</Label>
                  <Input
                    id="list-price"
                    type="number"
                    step="0.01"
                    value={listPrice}
                    onChange={(e) => setListPrice(e.target.value)}
                    data-testid="input-list-price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="print-cost">Print Cost ($ for POD)</Label>
                  <Input
                    id="print-cost"
                    type="number"
                    step="0.01"
                    value={printCost}
                    onChange={(e) => setPrintCost(e.target.value)}
                    data-testid="input-print-cost"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                {platforms.map((platform) => {
                  const royalty = calculateEstimatedRoyalty(platform);
                  const maxRoyalty = parseFloat(listPrice) * 0.80;
                  const percentage = maxRoyalty > 0 ? (royalty / maxRoyalty) * 100 : 0;

                  return (
                    <div key={platform.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded ${platformColors[platform.id] || "bg-gray-500"} flex items-center justify-center`}>
                            {(() => {
                              const Icon = platformIcons[platform.id] || Globe;
                              return <Icon className="w-3 h-3 text-white" />;
                            })()}
                          </div>
                          <span className="text-sm font-medium">{platform.name}</span>
                          <Badge variant="outline" className="text-xs">{platform.royaltyRate}</Badge>
                        </div>
                        <span className="font-bold text-green-600">${royalty.toFixed(2)}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(strategies).map(([key, strategy]: [string, any]) => (
              <Card key={key} className="hover-elevate">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {key === 'wide' && <Globe className="w-5 h-5 text-blue-500" />}
                      {key === 'kdp_exclusive' && <Crown className="w-5 h-5 text-orange-500" />}
                      {key === 'hybrid' && <TrendingUp className="w-5 h-5 text-purple-500" />}
                      {key === 'library_focus' && <Library className="w-5 h-5 text-green-500" />}
                      {strategy.name}
                    </CardTitle>
                  </div>
                  <CardDescription>{strategy.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {strategy.platforms?.map((platformId: string) => (
                      <Badge key={platformId} variant="secondary" className="text-xs">
                        {platforms.find(p => p.id === platformId)?.name || platformId}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-green-600 mb-1">Pros:</p>
                      <ul className="space-y-1">
                        {strategy.pros?.map((pro: string, i: number) => (
                          <li key={i} className="flex items-start gap-1">
                            <CheckCircle2 className="w-3 h-3 mt-1 text-green-500 flex-shrink-0" />
                            <span className="text-muted-foreground">{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-red-600 mb-1">Cons:</p>
                      <ul className="space-y-1">
                        {strategy.cons?.map((con: string, i: number) => (
                          <li key={i} className="flex items-start gap-1">
                            <Info className="w-3 h-3 mt-1 text-red-500 flex-shrink-0" />
                            <span className="text-muted-foreground">{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Button
                    className="w-full gap-2"
                    variant="outline"
                    onClick={() => selectStrategy(strategy.platforms || [])}
                    data-testid={`button-strategy-${key}`}
                  >
                    Use This Strategy
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {selectedPlatforms.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
            <div>
              <h3 className="font-bold text-lg">Ready to Publish?</h3>
              <p className="text-sm text-muted-foreground">
                You've selected {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''}. 
                Export your book and start distributing.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" data-testid="button-export-all">
                <FileDown className="w-4 h-4" />
                Export Files
              </Button>
              <Button className="gap-2" data-testid="button-start-distribution">
                <Rocket className="w-4 h-4" />
                Start Distribution
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
