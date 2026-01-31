import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import SEO from "@/components/SEO";
import { 
  Search, Globe, BarChart3, Link2, FileText, 
  Target, TrendingUp, Mic, MapPin, Languages,
  Loader2, CheckCircle, AlertCircle, ArrowRight,
  Zap, Brain, Eye
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import GlobalHeader from "@/components/GlobalHeader";

interface AnalysisResult {
  score?: number;
  issues?: string[];
  recommendations?: string[];
  keywords?: Array<{ keyword: string; volume?: number; difficulty?: string }>;
  content?: string;
}

export default function SEOCommandCenter() {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [keywords, setKeywords] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async ({ endpoint, data }: { endpoint: string; data: any }) => {
      const res = await apiRequest("POST", `/api/seo/${endpoint}`, data);
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({ title: "Analysis complete", description: "Results are ready below" });
    },
    onError: (error: any) => {
      toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
    },
  });

  const tools = [
    {
      id: "analyze-website",
      name: "Website Analyzer",
      description: "Full SEO audit for any website",
      icon: Globe,
      fields: ["url"],
    },
    {
      id: "research-keywords",
      name: "Keyword Research",
      description: "AI-powered keyword suggestions",
      icon: Search,
      fields: ["keywords"],
    },
    {
      id: "optimize-content",
      name: "Content Optimizer",
      description: "SEO scoring and recommendations",
      icon: FileText,
      fields: ["content", "keywords"],
    },
    {
      id: "analyze-competitors",
      name: "Competitor Analysis",
      description: "Compare domain metrics",
      icon: BarChart3,
      fields: ["url"],
    },
    {
      id: "analyze-backlinks",
      name: "Backlink Profiler",
      description: "Analyze backlink structure",
      icon: Link2,
      fields: ["url"],
    },
    {
      id: "generate-sitemap",
      name: "Sitemap Generator",
      description: "Generate sitemap.xml",
      icon: Target,
      fields: ["url"],
    },
    {
      id: "generate-robots-txt",
      name: "Robots.txt Builder",
      description: "Create optimized robots.txt",
      icon: FileText,
      fields: ["url"],
    },
    {
      id: "local-business-schema",
      name: "Local SEO Schema",
      description: "LocalBusiness structured data",
      icon: MapPin,
      fields: ["url"],
    },
    {
      id: "hreflang-tags",
      name: "Hreflang Generator",
      description: "Multi-language tag generation",
      icon: Languages,
      fields: ["url"],
    },
  ];

  const handleAnalyze = (toolId: string) => {
    const data: any = {};
    if (url) data.url = url;
    if (content) data.content = content;
    if (keywords) data.keywords = keywords.split(",").map(k => k.trim());
    
    analyzeMutation.mutate({ endpoint: toolId, data });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <SEO 
        title="SEO Command Center"
        description="Enterprise-grade SEO optimization tools including website analysis, keyword research, content optimization, competitor analysis, and structured data generation for maximum search visibility."
        canonicalUrl="https://kreaite.xyz/seo-command-center"
        keywords={["SEO tools", "keyword research", "content optimization", "website analysis", "SEO checker"]}
        author="KreAIte"
        expertise="Advanced SEO and search optimization strategies"
        experience="Platform established 2024 with proven SEO methodologies"
        authoritativeness="Comprehensive SEO analysis and optimization platform"
        trustworthiness="Transparent SEO metrics and verified recommendations"
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "SEO Command Center", url: "/seo-command-center" }]}
      />
      <GlobalHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">SEO Command Center</h1>
          </div>
          <p className="text-muted-foreground">
            Enterprise-grade SEO and AEO tools for external website optimization
          </p>
        </div>

        <Tabs defaultValue="tools" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tools" data-testid="tab-tools">SEO Tools</TabsTrigger>
            <TabsTrigger value="aeo" data-testid="tab-aeo">AEO (Voice Search)</TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Analysis</CardTitle>
                <CardDescription>Enter a URL or content to analyze</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Website URL</Label>
                    <Input
                      id="url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      data-testid="input-url"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Target Keywords (comma-separated)</Label>
                    <Input
                      id="keywords"
                      placeholder="seo tools, website analyzer, keyword research"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      data-testid="input-keywords"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content to Optimize (optional)</Label>
                  <Textarea
                    id="content"
                    placeholder="Paste your content here for SEO analysis..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    data-testid="input-content"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool) => (
                <Card key={tool.id} className="hover-elevate">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <tool.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{tool.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                        <Button
                          size="sm"
                          className="mt-3 w-full"
                          onClick={() => handleAnalyze(tool.id)}
                          disabled={analyzeMutation.isPending}
                          data-testid={`button-${tool.id}`}
                        >
                          {analyzeMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Zap className="h-4 w-4 mr-2" />
                          )}
                          Analyze
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="aeo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  Answer Engine Optimization (AEO)
                </CardTitle>
                <CardDescription>
                  Optimize your content for voice search and AI assistants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <Brain className="h-8 w-8 mx-auto text-primary mb-2" />
                      <h4 className="font-semibold">FAQ Schema</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Structure Q&A for featured snippets
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <Eye className="h-8 w-8 mx-auto text-primary mb-2" />
                      <h4 className="font-semibold">HowTo Schema</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Step-by-step guides for voice search
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <Mic className="h-8 w-8 mx-auto text-primary mb-2" />
                      <h4 className="font-semibold">Speakable Schema</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Mark content for text-to-speech
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">E-E-A-T Signals</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Experience, Expertise, Authoritativeness, and Trust signals help your content rank better.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Author Credentials</Badge>
                    <Badge variant="outline">Source Citations</Badge>
                    <Badge variant="outline">Fact-Checking</Badge>
                    <Badge variant="outline">Reviewer Info</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {result ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.score !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>SEO Score</span>
                        <span className="font-bold">{result.score}/100</span>
                      </div>
                      <Progress value={result.score} className="h-2" />
                    </div>
                  )}
                  
                  {result.issues && result.issues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        Issues Found
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {result.issues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2 text-muted-foreground">
                            <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.recommendations && result.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Recommendations
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-muted-foreground">
                            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.keywords && result.keywords.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Keyword Suggestions</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.keywords.map((kw, i) => (
                          <Badge key={i} variant="secondary">
                            {kw.keyword}
                            {kw.volume && <span className="ml-1 opacity-60">({kw.volume})</span>}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.content && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Generated Content</h4>
                      <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">
                        {result.content}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg">No Results Yet</h3>
                  <p className="text-muted-foreground mt-1">
                    Run an analysis from the SEO Tools tab to see results here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
