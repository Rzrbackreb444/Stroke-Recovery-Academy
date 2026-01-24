import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Palette, 
  Globe, 
  Key, 
  DollarSign, 
  Shield,
  Upload,
  Check,
  AlertCircle,
  Sparkles,
  Building2,
  Crown,
  Zap,
  Eye,
  EyeOff,
  Copy,
  ExternalLink
} from "lucide-react";

const pricingTiers = {
  basic: {
    name: "Basic White Label",
    price: 99,
    features: [
      "Custom branding (logo, colors)",
      "Use your own API keys",
      "Custom domain support",
      "5 creator accounts",
      "Basic analytics",
    ],
  },
  professional: {
    name: "Professional White Label",
    price: 299,
    features: [
      "Everything in Basic",
      "Hide KreAIte branding completely",
      "Unlimited creator accounts",
      "Custom revenue split (up to 95/5)",
      "Priority support",
      "Advanced analytics",
    ],
  },
  enterprise: {
    name: "Enterprise White Label",
    price: 999,
    features: [
      "Everything in Professional",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee (99.9% uptime)",
      "White-glove onboarding",
      "Full API access",
    ],
  },
};

export default function WhiteLabelPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("branding");
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  
  const [config, setConfig] = useState({
    brandName: "",
    logoUrl: "",
    faviconUrl: "",
    primaryColor: "#C9941A",
    accentColor: "#1a1a1a",
    backgroundColor: "#FAF8F3",
    customDomain: "",
    openaiApiKey: "",
    anthropicApiKey: "",
    geminiApiKey: "",
    grokApiKey: "",
    perplexityApiKey: "",
    mistralApiKey: "",
    cohereApiKey: "",
    deepseekApiKey: "",
    groqApiKey: "",
    togetherApiKey: "",
    huggingfaceApiKey: "",
    replicateApiKey: "",
    stabilityApiKey: "",
    leonardoApiKey: "",
    midJourneyApiKey: "",
    runwayApiKey: "",
    elevenLabsApiKey: "",
    removeBgApiKey: "",
    githubApiKey: "",
    serpApiKey: "",
    awsAccessKey: "",
    awsSecretKey: "",
    cloudflareApiKey: "",
    hideKreaiteBranding: false,
    customFooterText: "",
    customTermsUrl: "",
    customPrivacyUrl: "",
    creatorRevenueShare: 85,
  });

  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ["/api/white-label/config"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof config) => {
      return apiRequest("POST", "/api/white-label/config", data);
    },
    onSuccess: () => {
      toast({ title: "Settings saved", description: "Your white label configuration has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/white-label/config"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  const toggleApiKeyVisibility = (key: string) => {
    setShowApiKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "API key copied to clipboard." });
  };

  const apiKeyFields = [
    { key: "openaiApiKey", label: "OpenAI API Key", placeholder: "sk-...", icon: Sparkles, category: "Text Generation" },
    { key: "anthropicApiKey", label: "Anthropic (Claude) API Key", placeholder: "sk-ant-...", icon: Zap, category: "Text Generation" },
    { key: "geminiApiKey", label: "Google Gemini API Key", placeholder: "AIza...", icon: Sparkles, category: "Text Generation" },
    { key: "grokApiKey", label: "Grok (xAI) API Key", placeholder: "xai-...", icon: Zap, category: "Text Generation" },
    { key: "perplexityApiKey", label: "Perplexity API Key", placeholder: "pplx-...", icon: Sparkles, category: "Text Generation" },
    { key: "mistralApiKey", label: "Mistral AI API Key", placeholder: "...", icon: Zap, category: "Text Generation" },
    { key: "cohereApiKey", label: "Cohere API Key", placeholder: "...", icon: Sparkles, category: "Text Generation" },
    { key: "deepseekApiKey", label: "DeepSeek API Key", placeholder: "...", icon: Zap, category: "Text Generation" },
    { key: "groqApiKey", label: "Groq API Key", placeholder: "gsk_...", icon: Zap, category: "Text Generation" },
    { key: "togetherApiKey", label: "Together AI API Key", placeholder: "...", icon: Sparkles, category: "Text Generation" },
    { key: "huggingfaceApiKey", label: "Hugging Face API Key", placeholder: "hf_...", icon: Sparkles, category: "ML Models" },
    { key: "replicateApiKey", label: "Replicate API Key", placeholder: "r8_...", icon: Zap, category: "ML Models" },
    { key: "stabilityApiKey", label: "Stability AI API Key", placeholder: "sk-...", icon: Palette, category: "Image Generation" },
    { key: "leonardoApiKey", label: "Leonardo AI API Key", placeholder: "...", icon: Palette, category: "Image Generation" },
    { key: "midJourneyApiKey", label: "MidJourney API Key", placeholder: "...", icon: Palette, category: "Image Generation" },
    { key: "runwayApiKey", label: "Runway ML API Key", placeholder: "...", icon: Palette, category: "Video Generation" },
    { key: "elevenLabsApiKey", label: "ElevenLabs API Key", placeholder: "...", icon: Zap, category: "Voice/Audio" },
    { key: "removeBgApiKey", label: "Remove.bg API Key", placeholder: "...", icon: Palette, category: "Image Processing" },
    { key: "githubApiKey", label: "GitHub API Token", placeholder: "ghp_...", icon: Key, category: "Developer Tools" },
    { key: "serpApiKey", label: "SERP API Key", placeholder: "...", icon: Sparkles, category: "Developer Tools" },
    { key: "awsAccessKey", label: "AWS Access Key", placeholder: "AKIA...", icon: Key, category: "Cloud Services" },
    { key: "awsSecretKey", label: "AWS Secret Key", placeholder: "...", icon: Key, category: "Cloud Services" },
    { key: "cloudflareApiKey", label: "Cloudflare API Key", placeholder: "...", icon: Key, category: "Cloud Services" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a1a] font-serif">White Label Branding</h1>
            <p className="text-muted-foreground mt-1">
              Customize and rebrand KreAIte as your own platform
            </p>
          </div>
          <Badge variant="outline" className="bg-[#C9941A]/10 text-[#C9941A] border-[#C9941A]">
            <Crown className="w-3 h-3 mr-1" />
            Enterprise Feature
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(pricingTiers).map(([tier, info]) => (
            <Card key={tier} className={`relative ${tier === "professional" ? "border-[#C9941A] border-2" : ""}`}>
              {tier === "professional" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#C9941A] text-white">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {tier === "basic" && <Building2 className="w-5 h-5" />}
                  {tier === "professional" && <Crown className="w-5 h-5 text-[#C9941A]" />}
                  {tier === "enterprise" && <Shield className="w-5 h-5" />}
                  {info.name}
                </CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${info.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {info.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full mt-4 ${tier === "professional" ? "bg-[#C9941A] hover:bg-[#C9941A]/90" : ""}`}
                  variant={tier === "professional" ? "default" : "outline"}
                  data-testid={`button-subscribe-${tier}`}
                >
                  {tier === "enterprise" ? "Contact Sales" : "Subscribe"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configure Your White Label Platform</CardTitle>
            <CardDescription>
              Customize branding, add your API keys, and configure your platform settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="branding" className="flex items-center gap-2" data-testid="tab-branding">
                  <Palette className="w-4 h-4" />
                  Branding
                </TabsTrigger>
                <TabsTrigger value="domain" className="flex items-center gap-2" data-testid="tab-domain">
                  <Globe className="w-4 h-4" />
                  Domain
                </TabsTrigger>
                <TabsTrigger value="api-keys" className="flex items-center gap-2" data-testid="tab-api-keys">
                  <Key className="w-4 h-4" />
                  API Keys
                </TabsTrigger>
                <TabsTrigger value="revenue" className="flex items-center gap-2" data-testid="tab-revenue">
                  <DollarSign className="w-4 h-4" />
                  Revenue
                </TabsTrigger>
              </TabsList>

              <TabsContent value="branding" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="brandName">Platform Name</Label>
                      <Input
                        id="brandName"
                        value={config.brandName}
                        onChange={(e) => setConfig(prev => ({ ...prev, brandName: e.target.value }))}
                        placeholder="Your Platform Name"
                        data-testid="input-brand-name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="logoUrl">Logo URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="logoUrl"
                          value={config.logoUrl}
                          onChange={(e) => setConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                          placeholder="https://your-logo.png"
                          data-testid="input-logo-url"
                        />
                        <Button variant="outline" size="icon">
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="faviconUrl">Favicon URL</Label>
                      <Input
                        id="faviconUrl"
                        value={config.faviconUrl}
                        onChange={(e) => setConfig(prev => ({ ...prev, faviconUrl: e.target.value }))}
                        placeholder="https://your-favicon.ico"
                        data-testid="input-favicon-url"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          id="primaryColor"
                          value={config.primaryColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-16 h-10 p-1"
                          data-testid="input-primary-color"
                        />
                        <Input
                          value={config.primaryColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                          placeholder="#C9941A"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          id="accentColor"
                          value={config.accentColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                          className="w-16 h-10 p-1"
                          data-testid="input-accent-color"
                        />
                        <Input
                          value={config.accentColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                          placeholder="#1a1a1a"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="backgroundColor">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          id="backgroundColor"
                          value={config.backgroundColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                          className="w-16 h-10 p-1"
                          data-testid="input-background-color"
                        />
                        <Input
                          value={config.backgroundColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                          placeholder="#FAF8F3"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Hide KreAIte Branding</Label>
                      <p className="text-sm text-muted-foreground">
                        Remove all KreAIte branding from your platform (Professional tier required)
                      </p>
                    </div>
                    <Switch
                      checked={config.hideKreaiteBranding}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, hideKreaiteBranding: checked }))}
                      data-testid="switch-hide-branding"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customFooterText">Custom Footer Text</Label>
                    <Input
                      id="customFooterText"
                      value={config.customFooterText}
                      onChange={(e) => setConfig(prev => ({ ...prev, customFooterText: e.target.value }))}
                      placeholder="© 2024 Your Company. All rights reserved."
                      data-testid="input-custom-footer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customTermsUrl">Terms of Service URL</Label>
                      <Input
                        id="customTermsUrl"
                        value={config.customTermsUrl}
                        onChange={(e) => setConfig(prev => ({ ...prev, customTermsUrl: e.target.value }))}
                        placeholder="https://yourdomain.com/terms"
                        data-testid="input-terms-url"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customPrivacyUrl">Privacy Policy URL</Label>
                      <Input
                        id="customPrivacyUrl"
                        value={config.customPrivacyUrl}
                        onChange={(e) => setConfig(prev => ({ ...prev, customPrivacyUrl: e.target.value }))}
                        placeholder="https://yourdomain.com/privacy"
                        data-testid="input-privacy-url"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="domain" className="space-y-6">
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Globe className="w-8 h-8 text-[#C9941A]" />
                      <div>
                        <h3 className="font-semibold">Custom Domain Setup</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Connect your own domain to run your white-labeled platform
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customDomain">Custom Domain</Label>
                    <div className="flex gap-2">
                      <Input
                        id="customDomain"
                        value={config.customDomain}
                        onChange={(e) => setConfig(prev => ({ ...prev, customDomain: e.target.value }))}
                        placeholder="create.yourdomain.com"
                        data-testid="input-custom-domain"
                      />
                      <Button variant="outline" data-testid="button-verify-domain">
                        Verify
                      </Button>
                    </div>
                  </div>

                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-amber-800">DNS Configuration Required</p>
                          <p className="text-amber-700 mt-1">
                            Add a CNAME record pointing to <code className="bg-amber-100 px-1 rounded">app.kreaite.xyz</code>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="api-keys" className="space-y-6">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800">Secure API Key Storage - 18+ AI Providers Supported</p>
                        <p className="text-blue-700 mt-1">
                          Your API keys are encrypted at rest and never exposed. Use your own keys for complete control over costs, rate limits, and model access. Supports OpenAI, Anthropic, Gemini, Hugging Face, Mistral, and more.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {["Text Generation", "ML Models", "Image Generation", "Video Generation", "Voice/Audio", "Image Processing", "Developer Tools", "Cloud Services"].map((category) => {
                  const categoryFields = apiKeyFields.filter(f => f.category === category);
                  if (categoryFields.length === 0) return null;
                  
                  return (
                    <div key={category} className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{category}</h4>
                      <div className="grid gap-3">
                        {categoryFields.map(({ key, label, placeholder, icon: Icon }) => (
                          <div key={key} className="flex items-center gap-3">
                            <Label htmlFor={key} className="flex items-center gap-2 min-w-[200px]">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                              {label}
                            </Label>
                            <div className="flex gap-2 flex-1">
                              <Input
                                id={key}
                                type={showApiKeys[key] ? "text" : "password"}
                                value={(config as any)[key]}
                                onChange={(e) => setConfig(prev => ({ ...prev, [key]: e.target.value }))}
                                placeholder={placeholder}
                                className="flex-1"
                                data-testid={`input-${key}`}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleApiKeyVisibility(key)}
                                data-testid={`button-toggle-${key}`}
                              >
                                {showApiKeys[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              {(config as any)[key] && (
                                <Button variant="outline" size="icon" onClick={() => copyToClipboard((config as any)[key])}>
                                  <Copy className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  );
                })}

                <div className="flex items-center gap-2 pt-4">
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Need API keys? Get them from the provider dashboards: OpenAI, Anthropic, Google AI Studio, Hugging Face, Stability AI, etc.
                  </span>
                </div>
              </TabsContent>

              <TabsContent value="revenue" className="space-y-6">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-800">Revenue Sharing</p>
                        <p className="text-green-700 mt-1">
                          Configure how revenue is split between creators on your platform and your platform fee.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <div>
                    <Label>Creator Revenue Share: {config.creatorRevenueShare}%</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <input
                        type="range"
                        min="70"
                        max="95"
                        value={config.creatorRevenueShare}
                        onChange={(e) => setConfig(prev => ({ ...prev, creatorRevenueShare: parseInt(e.target.value) }))}
                        className="flex-1"
                        data-testid="slider-revenue-share"
                      />
                      <span className="text-sm font-medium w-12 text-right">{config.creatorRevenueShare}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your platform keeps {100 - config.creatorRevenueShare}% of sales
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <p className="text-3xl font-bold text-green-600">{config.creatorRevenueShare}%</p>
                        <p className="text-sm text-muted-foreground">To Creators</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <p className="text-3xl font-bold text-[#C9941A]">{100 - config.creatorRevenueShare}%</p>
                        <p className="text-sm text-muted-foreground">Platform Fee</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Example Revenue Split</h4>
                    <p className="text-sm text-muted-foreground">
                      On a $100 sale:
                    </p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>Creator receives: <span className="font-medium">${config.creatorRevenueShare}</span></li>
                      <li>Your platform keeps: <span className="font-medium">${100 - config.creatorRevenueShare}</span></li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
              <Button variant="outline" data-testid="button-preview">
                Preview Changes
              </Button>
              <Button 
                onClick={() => saveMutation.mutate(config)}
                disabled={saveMutation.isPending}
                className="bg-[#C9941A] hover:bg-[#C9941A]/90"
                data-testid="button-save-config"
              >
                {saveMutation.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
