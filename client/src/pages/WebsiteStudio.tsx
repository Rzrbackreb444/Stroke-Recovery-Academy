import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Globe,
  Palette,
  Layout,
  Type,
  Image,
  Search,
  FileText,
  Settings,
  Eye,
  Smartphone,
  Monitor,
  Tablet,
  Plus,
  Sparkles,
  Wand2,
  Download,
  Upload,
  ExternalLink,
  ChevronRight,
  Check,
  Loader2,
  GripVertical,
  Trash2,
  Copy,
  LayoutGrid,
  Home,
  Users,
  Mail,
  Phone,
  MapPin,
  Star,
  Zap,
  Shield,
  ArrowRight,
  Building2,
  Briefcase,
  Heart,
  Camera,
  ShoppingBag,
  Brush,
  Code,
  Rocket,
  Target,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  MousePointer,
  Layers,
  Move,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  List,
  Link2,
  MoreVertical,
  Save,
  Undo,
  Redo,
  PanelLeft,
  PanelRight,
  Play,
  Pause,
  BarChart3,
  PenTool,
  Hexagon,
  Circle,
  Square,
  Triangle,
  Crown,
  Gem,
  RefreshCw,
} from "lucide-react";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";

const websiteTemplates = [
  {
    id: "business-pro",
    name: "Business Pro",
    category: "Business",
    description: "Professional business website with services, team, and contact pages",
    thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
    pages: ["Home", "About", "Services", "Team", "Contact"],
    popular: true,
  },
  {
    id: "creative-portfolio",
    name: "Creative Portfolio",
    category: "Portfolio",
    description: "Showcase your work with stunning galleries and project pages",
    thumbnail: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=300&fit=crop",
    pages: ["Home", "Portfolio", "About", "Contact"],
    popular: true,
  },
  {
    id: "blog-starter",
    name: "Blog Starter",
    category: "Blog",
    description: "Clean, readable blog template with categories and newsletter signup",
    thumbnail: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop",
    pages: ["Home", "Blog", "Categories", "About", "Contact"],
    popular: false,
  },
  {
    id: "nonprofit-heart",
    name: "Nonprofit Heart",
    category: "Nonprofit",
    description: "Mission-driven design with donation integration and volunteer signup",
    thumbnail: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=300&fit=crop",
    pages: ["Home", "Mission", "Programs", "Donate", "Get Involved"],
    popular: false,
  },
  {
    id: "local-service",
    name: "Local Service",
    category: "Local Business",
    description: "Perfect for contractors, salons, restaurants with booking and reviews",
    thumbnail: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=300&fit=crop",
    pages: ["Home", "Services", "Gallery", "Reviews", "Book Now"],
    popular: true,
  },
  {
    id: "ecommerce-starter",
    name: "Shop Starter",
    category: "E-commerce",
    description: "Product showcase with shopping cart and checkout ready",
    thumbnail: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=300&fit=crop",
    pages: ["Home", "Shop", "Product", "Cart", "Checkout"],
    popular: false,
  },
  {
    id: "coach-consultant",
    name: "Coach & Consultant",
    category: "Professional",
    description: "Build authority with testimonials, services, and booking",
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
    pages: ["Home", "About", "Services", "Testimonials", "Book a Call"],
    popular: false,
  },
  {
    id: "restaurant-menu",
    name: "Restaurant & Menu",
    category: "Food & Drink",
    description: "Appetizing design with menu, gallery, and reservations",
    thumbnail: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
    pages: ["Home", "Menu", "Gallery", "About", "Reservations"],
    popular: false,
  },
];

const sectionComponents = [
  { id: "hero", name: "Hero Section", icon: Rocket, category: "Headers" },
  { id: "features", name: "Features Grid", icon: LayoutGrid, category: "Content" },
  { id: "services", name: "Services List", icon: Briefcase, category: "Content" },
  { id: "testimonials", name: "Testimonials", icon: Star, category: "Social Proof" },
  { id: "team", name: "Team Members", icon: Users, category: "About" },
  { id: "gallery", name: "Image Gallery", icon: Camera, category: "Media" },
  { id: "pricing", name: "Pricing Table", icon: TrendingUp, category: "Sales" },
  { id: "cta", name: "Call to Action", icon: Target, category: "Conversion" },
  { id: "contact", name: "Contact Form", icon: Mail, category: "Forms" },
  { id: "faq", name: "FAQ Accordion", icon: FileText, category: "Content" },
  { id: "stats", name: "Statistics", icon: BarChart3, category: "Social Proof" },
  { id: "blog-grid", name: "Blog Posts", icon: FileText, category: "Content" },
  { id: "newsletter", name: "Newsletter", icon: Mail, category: "Forms" },
  { id: "footer", name: "Footer", icon: Layout, category: "Footers" },
];

const logoStyles = [
  { id: "modern", name: "Modern", description: "Clean lines, minimal design" },
  { id: "classic", name: "Classic", description: "Timeless, professional look" },
  { id: "playful", name: "Playful", description: "Fun, approachable vibe" },
  { id: "bold", name: "Bold", description: "Strong, impactful presence" },
  { id: "elegant", name: "Elegant", description: "Sophisticated, refined style" },
  { id: "tech", name: "Tech", description: "Futuristic, innovative feel" },
];

const iconTypes = [
  { id: "abstract", name: "Abstract Shape", icon: Hexagon },
  { id: "lettermark", name: "Letter/Initials", icon: Type },
  { id: "icon", name: "Symbol/Icon", icon: Gem },
  { id: "wordmark", name: "Text Only", icon: AlignCenter },
];

const colorPresets = [
  { name: "Ocean", primary: "#0ea5e9", secondary: "#0369a1", accent: "#f0f9ff" },
  { name: "Forest", primary: "#22c55e", secondary: "#15803d", accent: "#f0fdf4" },
  { name: "Sunset", primary: "#f97316", secondary: "#c2410c", accent: "#fff7ed" },
  { name: "Royal", primary: "#8b5cf6", secondary: "#6d28d9", accent: "#faf5ff" },
  { name: "Rose", primary: "#ec4899", secondary: "#be185d", accent: "#fdf2f8" },
  { name: "Slate", primary: "#64748b", secondary: "#334155", accent: "#f8fafc" },
  { name: "Gold", primary: "#C9941A", secondary: "#92700C", accent: "#FAF8F3" },
  { name: "Crimson", primary: "#dc2626", secondary: "#991b1b", accent: "#fef2f2" },
];

const fontPairings = [
  { heading: "Playfair Display", body: "Inter", style: "Classic & Modern" },
  { heading: "Montserrat", body: "Open Sans", style: "Clean & Professional" },
  { heading: "Poppins", body: "Roboto", style: "Friendly & Approachable" },
  { heading: "Crimson Pro", body: "Lato", style: "Elegant & Readable" },
  { heading: "Bebas Neue", body: "Source Sans Pro", style: "Bold & Impactful" },
  { heading: "Merriweather", body: "Nunito", style: "Literary & Warm" },
];

export default function WebsiteStudio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showEditor, setShowEditor] = useState(false);
  const [editorPanel, setEditorPanel] = useState<"components" | "design" | "seo" | "settings">("components");

  const { data: templatesData } = useQuery<{ templates: typeof websiteTemplates }>({
    queryKey: ['/api/website-builder/templates'],
  });

  const { data: userWebsites } = useQuery<{ websites: any[] }>({
    queryKey: ['/api/website-builder/websites'],
    enabled: !!user,
  });

  const createWebsiteMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/website-builder/websites', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/website-builder/websites'] });
      toast({ title: "Website Created", description: "Your website project has been created successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create website", variant: "destructive" });
    },
  });

  const publishWebsiteMutation = useMutation({
    mutationFn: async ({ websiteId, slug }: { websiteId: number; slug: string }) => {
      return apiRequest(`/api/website-builder/publish/${websiteId}`, {
        method: 'POST',
        body: JSON.stringify({ slug }),
      });
    },
    onSuccess: (data: any) => {
      toast({ title: "Website Published!", description: `Your site is now live at ${data.url}` });
    },
    onError: (error: any) => {
      toast({ title: "Publish Failed", description: error.message || "Could not publish website", variant: "destructive" });
    },
  });

  const templates = templatesData?.templates || websiteTemplates;
  
  const [websiteData, setWebsiteData] = useState({
    name: "",
    slug: "",
    industry: "",
    businessName: "",
    description: "",
    primaryColor: "#C9941A",
    secondaryColor: "#1a1a1a",
    accentColor: "#FAF8F3",
    fontHeading: "Playfair Display",
    fontBody: "Inter",
  });

  const [logoData, setLogoData] = useState({
    businessName: "",
    industry: "",
    style: "modern",
    iconType: "abstract",
    primaryColor: "#C9941A",
  });

  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [generatedLogos, setGeneratedLogos] = useState<string[]>([]);

  const [pageSections, setPageSections] = useState([
    { id: "hero-1", type: "hero", title: "Hero Section" },
    { id: "features-1", type: "features", title: "Features Grid" },
    { id: "testimonials-1", type: "testimonials", title: "Testimonials" },
    { id: "cta-1", type: "cta", title: "Call to Action" },
  ]);

  const handleGenerateLogo = async () => {
    if (!logoData.businessName) return;
    
    setIsGeneratingLogo(true);
    try {
      const response = await fetch('/api/website-builder/generate-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: logoData.businessName,
          industry: logoData.industry,
          style: logoData.style,
          iconType: logoData.iconType,
          primaryColor: logoData.primaryColor,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedLogos(data.logos || []);
      } else {
        setGeneratedLogos([
          `https://placehold.co/200x200/${logoData.primaryColor.replace('#', '')}/ffffff?text=${encodeURIComponent(logoData.businessName.charAt(0))}`,
          `https://placehold.co/200x200/1a1a1a/ffffff?text=${encodeURIComponent(logoData.businessName.charAt(0))}`,
          `https://placehold.co/200x200/${logoData.primaryColor.replace('#', '')}/ffffff?text=${encodeURIComponent(logoData.businessName.substring(0, 2).toUpperCase())}`,
          `https://placehold.co/200x200/ffffff/${logoData.primaryColor.replace('#', '')}?text=${encodeURIComponent(logoData.businessName.charAt(0))}`,
        ]);
      }
    } catch (error) {
      console.error('Logo generation error:', error);
      setGeneratedLogos([
        `https://placehold.co/200x200/${logoData.primaryColor.replace('#', '')}/ffffff?text=${encodeURIComponent(logoData.businessName.charAt(0))}`,
        `https://placehold.co/200x200/1a1a1a/ffffff?text=${encodeURIComponent(logoData.businessName.charAt(0))}`,
      ]);
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = websiteTemplates.find(t => t.id === templateId);
    if (template) {
      setWebsiteData(prev => ({
        ...prev,
        industry: template.category,
      }));
    }
  };

  const handleStartBuilding = () => {
    setShowEditor(true);
  };

  if (showEditor) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowEditor(false)}
              data-testid="button-back-to-studio"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span className="font-medium">{websiteData.name || "My Website"}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md p-1 bg-muted/50">
              <Button
                variant={previewDevice === "desktop" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setPreviewDevice("desktop")}
                data-testid="button-preview-desktop"
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={previewDevice === "tablet" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setPreviewDevice("tablet")}
                data-testid="button-preview-tablet"
              >
                <Tablet className="w-4 h-4" />
              </Button>
              <Button
                variant={previewDevice === "mobile" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setPreviewDevice("mobile")}
                data-testid="button-preview-mobile"
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="icon" data-testid="button-undo">
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-redo">
              <Redo className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm" data-testid="button-preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button size="sm" className="bg-primary" data-testid="button-publish">
              <Rocket className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <aside className="w-64 border-r bg-card flex flex-col shrink-0">
            <div className="p-2 border-b">
              <div className="flex gap-1">
                {[
                  { id: "components", icon: Layers, label: "Sections" },
                  { id: "design", icon: Palette, label: "Design" },
                  { id: "seo", icon: Search, label: "SEO" },
                  { id: "settings", icon: Settings, label: "Settings" },
                ].map((panel) => (
                  <Button
                    key={panel.id}
                    variant={editorPanel === panel.id ? "secondary" : "ghost"}
                    size="sm"
                    className="flex-1 flex-col h-14 gap-1"
                    onClick={() => setEditorPanel(panel.id as typeof editorPanel)}
                    data-testid={`button-panel-${panel.id}`}
                  >
                    <panel.icon className="w-4 h-4" />
                    <span className="text-xs">{panel.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <ScrollArea className="flex-1">
              {editorPanel === "components" && (
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Page Sections</h4>
                    <div className="space-y-2">
                      {pageSections.map((section, index) => (
                        <div
                          key={section.id}
                          className="flex items-center gap-2 p-2 rounded-md border bg-muted/30 group hover-elevate cursor-move"
                        >
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          <span className="flex-1 text-sm">{section.title}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3">Add Section</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {sectionComponents.slice(0, 8).map((component) => (
                        <Button
                          key={component.id}
                          variant="outline"
                          className="h-auto py-3 flex-col gap-1"
                          data-testid={`button-add-${component.id}`}
                        >
                          <component.icon className="w-4 h-4" />
                          <span className="text-xs">{component.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {editorPanel === "design" && (
                <div className="p-4 space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Colors</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Primary</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <div 
                            className="w-8 h-8 rounded-md border"
                            style={{ backgroundColor: websiteData.primaryColor }}
                          />
                          <Input 
                            value={websiteData.primaryColor}
                            onChange={(e) => setWebsiteData(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="flex-1 h-8"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Secondary</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <div 
                            className="w-8 h-8 rounded-md border"
                            style={{ backgroundColor: websiteData.secondaryColor }}
                          />
                          <Input 
                            value={websiteData.secondaryColor}
                            onChange={(e) => setWebsiteData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            className="flex-1 h-8"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label className="text-xs text-muted-foreground">Presets</Label>
                      <div className="grid grid-cols-4 gap-2 mt-1">
                        {colorPresets.map((preset) => (
                          <button
                            key={preset.name}
                            className="w-full aspect-square rounded-md border overflow-hidden hover-elevate"
                            onClick={() => setWebsiteData(prev => ({
                              ...prev,
                              primaryColor: preset.primary,
                              secondaryColor: preset.secondary,
                              accentColor: preset.accent,
                            }))}
                            title={preset.name}
                          >
                            <div className="h-1/2" style={{ backgroundColor: preset.primary }} />
                            <div className="h-1/2" style={{ backgroundColor: preset.secondary }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3">Typography</h4>
                    <div className="space-y-3">
                      {fontPairings.map((pair, index) => (
                        <button
                          key={index}
                          className={`w-full p-3 rounded-md border text-left hover-elevate ${
                            websiteData.fontHeading === pair.heading ? "border-primary bg-primary/5" : ""
                          }`}
                          onClick={() => setWebsiteData(prev => ({
                            ...prev,
                            fontHeading: pair.heading,
                            fontBody: pair.body,
                          }))}
                        >
                          <div className="text-sm font-medium" style={{ fontFamily: pair.heading }}>
                            {pair.heading}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1" style={{ fontFamily: pair.body }}>
                            {pair.body} - {pair.style}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {editorPanel === "seo" && (
                <div className="p-4 space-y-4">
                  <div className="p-3 rounded-md bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-medium">AI SEO Assistant</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Automatically optimize your site for search engines
                    </p>
                    <Button size="sm" className="w-full mt-2" data-testid="button-optimize-seo">
                      <Wand2 className="w-3 h-3 mr-2" />
                      Auto-Optimize
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Page Title</Label>
                      <Input placeholder="My Amazing Website | Business Name" className="mt-1" />
                      <p className="text-xs text-muted-foreground mt-1">60 characters recommended</p>
                    </div>
                    <div>
                      <Label className="text-xs">Meta Description</Label>
                      <Textarea 
                        placeholder="Describe your website in 150-160 characters..." 
                        className="mt-1 resize-none"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Focus Keyword</Label>
                      <Input placeholder="e.g., web design agency" className="mt-1" />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">SEO Score</h4>
                      <Badge variant="secondary">Good</Badge>
                    </div>
                    <Progress value={75} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Your site scores 75/100. Add meta descriptions to improve.
                    </p>
                  </div>
                </div>
              )}

              {editorPanel === "settings" && (
                <div className="p-4 space-y-4">
                  <div>
                    <Label className="text-xs">Site Name</Label>
                    <Input 
                      value={websiteData.name}
                      onChange={(e) => setWebsiteData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Website"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Site URL</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <Input 
                        value={websiteData.slug}
                        onChange={(e) => setWebsiteData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="my-site"
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground">.kreaite.xyz</span>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-xs">Favicon</Label>
                    <div className="mt-1 border-2 border-dashed rounded-md p-4 text-center">
                      <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">Upload favicon (32x32px)</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Google Analytics ID</Label>
                    <Input placeholder="G-XXXXXXXXXX" className="mt-1" />
                  </div>
                </div>
              )}
            </ScrollArea>
          </aside>

          <main className="flex-1 bg-muted/30 p-6 overflow-auto">
            <div 
              className={`mx-auto bg-white rounded-lg shadow-lg overflow-hidden transition-all ${
                previewDevice === "desktop" ? "w-full" :
                previewDevice === "tablet" ? "w-[768px]" : "w-[375px]"
              }`}
              style={{ minHeight: "calc(100vh - 200px)" }}
            >
              <div className="h-10 bg-gray-100 flex items-center px-4 gap-2 border-b">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-500 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {websiteData.slug || "your-site"}.kreaite.xyz
                  </div>
                </div>
              </div>

              <div className="relative min-h-[600px]">
                <section 
                  className="relative h-[500px] flex items-center justify-center text-white"
                  style={{ 
                    background: `linear-gradient(135deg, ${websiteData.primaryColor} 0%, ${websiteData.secondaryColor} 100%)` 
                  }}
                >
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative z-10 text-center max-w-2xl px-6">
                    <h1 
                      className="text-4xl md:text-5xl font-bold mb-4"
                      style={{ fontFamily: websiteData.fontHeading }}
                    >
                      {websiteData.businessName || "Your Business Name"}
                    </h1>
                    <p 
                      className="text-lg md:text-xl opacity-90 mb-8"
                      style={{ fontFamily: websiteData.fontBody }}
                    >
                      {websiteData.description || "Add a compelling tagline that captures what you do"}
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button size="lg" variant="secondary">
                        Get Started
                      </Button>
                      <Button size="lg" variant="outline" className="border-white text-white backdrop-blur-sm">
                        Learn More
                      </Button>
                    </div>
                  </div>
                </section>

                <section className="py-16 px-6" style={{ backgroundColor: websiteData.accentColor }}>
                  <div className="max-w-4xl mx-auto text-center">
                    <h2 
                      className="text-3xl font-bold mb-4"
                      style={{ fontFamily: websiteData.fontHeading, color: websiteData.secondaryColor }}
                    >
                      Why Choose Us
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8 mt-10">
                      {[
                        { icon: Zap, title: "Fast & Reliable", desc: "Lightning-fast performance you can count on" },
                        { icon: Shield, title: "Secure & Safe", desc: "Your data is protected with enterprise security" },
                        { icon: Heart, title: "Customer First", desc: "Dedicated support team ready to help" },
                      ].map((feature, i) => (
                        <div key={i} className="text-center">
                          <div 
                            className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                            style={{ backgroundColor: `${websiteData.primaryColor}20` }}
                          >
                            <feature.icon className="w-7 h-7" style={{ color: websiteData.primaryColor }} />
                          </div>
                          <h3 
                            className="font-semibold mb-2"
                            style={{ fontFamily: websiteData.fontHeading, color: websiteData.secondaryColor }}
                          >
                            {feature.title}
                          </h3>
                          <p className="text-sm text-gray-600" style={{ fontFamily: websiteData.fontBody }}>
                            {feature.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="py-16 px-6 bg-white">
                  <div className="max-w-4xl mx-auto text-center">
                    <h2 
                      className="text-3xl font-bold mb-10"
                      style={{ fontFamily: websiteData.fontHeading, color: websiteData.secondaryColor }}
                    >
                      What Our Clients Say
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      {[
                        { name: "Sarah Johnson", role: "CEO, TechStart", quote: "Absolutely transformed our online presence. Highly recommended!" },
                        { name: "Michael Chen", role: "Founder, GrowthLab", quote: "The best investment we made for our business this year." },
                      ].map((testimonial, i) => (
                        <Card key={i} className="text-left">
                          <CardContent className="pt-6">
                            <div className="flex gap-1 mb-3">
                              {[1,2,3,4,5].map(star => (
                                <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                            <p className="text-gray-600 mb-4" style={{ fontFamily: websiteData.fontBody }}>
                              "{testimonial.quote}"
                            </p>
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                                style={{ backgroundColor: websiteData.primaryColor }}
                              >
                                {testimonial.name[0]}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{testimonial.name}</p>
                                <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </section>

                <section 
                  className="py-16 px-6 text-white text-center"
                  style={{ backgroundColor: websiteData.secondaryColor }}
                >
                  <h2 
                    className="text-3xl font-bold mb-4"
                    style={{ fontFamily: websiteData.fontHeading }}
                  >
                    Ready to Get Started?
                  </h2>
                  <p className="mb-8 opacity-90" style={{ fontFamily: websiteData.fontBody }}>
                    Join thousands of satisfied customers today
                  </p>
                  <Button size="lg" style={{ backgroundColor: websiteData.primaryColor }}>
                    Contact Us Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CreatorHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Website Builder Studio
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Playfair Display" }}>
            Build Your Dream Website
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create a stunning, SEO-optimized website in minutes. No coding required.
            Choose a template, customize, and publish with free hosting.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
            <TabsTrigger value="templates" className="gap-2" data-testid="tab-templates">
              <Layout className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-2" data-testid="tab-branding">
              <Palette className="w-4 h-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="logo" className="gap-2" data-testid="tab-logo">
              <PenTool className="w-4 h-4" />
              Logo
            </TabsTrigger>
            <TabsTrigger value="sites" className="gap-2" data-testid="tab-sites">
              <Globe className="w-4 h-4" />
              My Sites
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {["All", "Business", "Portfolio", "Blog", "E-commerce", "Nonprofit"].map((cat) => (
                  <Button 
                    key={cat} 
                    variant={cat === "All" ? "secondary" : "outline"} 
                    size="sm"
                    data-testid={`button-filter-${cat.toLowerCase()}`}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input placeholder="Search templates..." className="w-64" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {templates.map((template) => (
                <Card 
                  key={template.id}
                  className={`group cursor-pointer overflow-hidden hover-elevate ${
                    selectedTemplate === template.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleSelectTemplate(template.id)}
                  data-testid={`card-template-${template.id}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={template.thumbnail} 
                      alt={template.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    {template.popular && (
                      <Badge className="absolute top-2 right-2 bg-primary">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Popular
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary">
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button size="sm">
                        Select
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{template.name}</h3>
                      <Badge variant="outline" className="text-xs">{template.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                    <div className="flex gap-1 mt-3 flex-wrap">
                      {template.pages.slice(0, 3).map((page) => (
                        <Badge key={page} variant="secondary" className="text-xs">{page}</Badge>
                      ))}
                      {template.pages.length > 3 && (
                        <Badge variant="secondary" className="text-xs">+{template.pages.length - 3}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedTemplate && (
              <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 flex items-center justify-between z-50">
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {websiteTemplates.find(t => t.id === selectedTemplate)?.name} selected
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ready to customize your website
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                    Choose Different
                  </Button>
                  <Button onClick={handleStartBuilding} data-testid="button-start-building">
                    Start Building
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="branding" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Business Information
                  </CardTitle>
                  <CardDescription>Tell us about your business to personalize your site</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Business Name</Label>
                    <Input 
                      value={websiteData.businessName}
                      onChange={(e) => setWebsiteData(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="Acme Corporation"
                    />
                  </div>
                  <div>
                    <Label>Industry</Label>
                    <Select 
                      value={websiteData.industry}
                      onValueChange={(v) => setWebsiteData(prev => ({ ...prev, industry: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="hospitality">Hospitality</SelectItem>
                        <SelectItem value="nonprofit">Nonprofit</SelectItem>
                        <SelectItem value="creative">Creative/Design</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tagline / Description</Label>
                    <Textarea 
                      value={websiteData.description}
                      onChange={(e) => setWebsiteData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="A brief description of what you do..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Brand Colors
                  </CardTitle>
                  <CardDescription>Choose colors that represent your brand</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        className={`aspect-square rounded-lg overflow-hidden border-2 hover-elevate ${
                          websiteData.primaryColor === preset.primary ? "border-primary" : "border-transparent"
                        }`}
                        onClick={() => setWebsiteData(prev => ({
                          ...prev,
                          primaryColor: preset.primary,
                          secondaryColor: preset.secondary,
                          accentColor: preset.accent,
                        }))}
                        title={preset.name}
                      >
                        <div className="h-1/2" style={{ backgroundColor: preset.primary }} />
                        <div className="h-1/2" style={{ backgroundColor: preset.secondary }} />
                      </button>
                    ))}
                  </div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs">Primary</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="color" 
                          value={websiteData.primaryColor}
                          onChange={(e) => setWebsiteData(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                        <Input 
                          value={websiteData.primaryColor}
                          onChange={(e) => setWebsiteData(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Secondary</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="color" 
                          value={websiteData.secondaryColor}
                          onChange={(e) => setWebsiteData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                        <Input 
                          value={websiteData.secondaryColor}
                          onChange={(e) => setWebsiteData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Accent</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="color" 
                          value={websiteData.accentColor}
                          onChange={(e) => setWebsiteData(prev => ({ ...prev, accentColor: e.target.value }))}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                        <Input 
                          value={websiteData.accentColor}
                          onChange={(e) => setWebsiteData(prev => ({ ...prev, accentColor: e.target.value }))}
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Typography
                  </CardTitle>
                  <CardDescription>Select fonts that match your brand personality</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {fontPairings.map((pair, index) => (
                      <button
                        key={index}
                        className={`p-4 rounded-lg border text-left hover-elevate ${
                          websiteData.fontHeading === pair.heading ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => setWebsiteData(prev => ({
                          ...prev,
                          fontHeading: pair.heading,
                          fontBody: pair.body,
                        }))}
                      >
                        <div 
                          className="text-xl font-bold mb-2"
                          style={{ fontFamily: pair.heading }}
                        >
                          {pair.heading}
                        </div>
                        <div 
                          className="text-sm text-muted-foreground"
                          style={{ fontFamily: pair.body }}
                        >
                          Body: {pair.body}
                        </div>
                        <Badge variant="secondary" className="mt-2 text-xs">{pair.style}</Badge>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logo" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    AI Logo Generator
                  </CardTitle>
                  <CardDescription>Create a professional logo in seconds with AI</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Business Name</Label>
                    <Input 
                      value={logoData.businessName}
                      onChange={(e) => setLogoData(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="Your Business Name"
                    />
                  </div>
                  <div>
                    <Label>Industry</Label>
                    <Input 
                      value={logoData.industry}
                      onChange={(e) => setLogoData(prev => ({ ...prev, industry: e.target.value }))}
                      placeholder="e.g., Technology, Healthcare, Restaurant"
                    />
                  </div>
                  <div>
                    <Label>Style</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {logoStyles.map((style) => (
                        <button
                          key={style.id}
                          className={`p-3 rounded-lg border text-center hover-elevate ${
                            logoData.style === style.id ? "border-primary bg-primary/5" : ""
                          }`}
                          onClick={() => setLogoData(prev => ({ ...prev, style: style.id }))}
                        >
                          <div className="font-medium text-sm">{style.name}</div>
                          <div className="text-xs text-muted-foreground">{style.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Icon Type</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {iconTypes.map((type) => (
                        <button
                          key={type.id}
                          className={`p-3 rounded-lg border text-center hover-elevate ${
                            logoData.iconType === type.id ? "border-primary bg-primary/5" : ""
                          }`}
                          onClick={() => setLogoData(prev => ({ ...prev, iconType: type.id }))}
                        >
                          <type.icon className="w-5 h-5 mx-auto mb-1" />
                          <div className="text-xs">{type.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input 
                        type="color" 
                        value={logoData.primaryColor}
                        onChange={(e) => setLogoData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <Input 
                        value={logoData.primaryColor}
                        onChange={(e) => setLogoData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleGenerateLogo}
                    disabled={isGeneratingLogo || !logoData.businessName}
                    data-testid="button-generate-logo"
                  >
                    {isGeneratingLogo ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Logo Ideas
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Generated Logos
                  </CardTitle>
                  <CardDescription>Click a logo to select it for your website</CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedLogos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {generatedLogos.map((logo, index) => (
                        <div
                          key={index}
                          className="aspect-square rounded-lg border overflow-hidden cursor-pointer hover-elevate group relative"
                        >
                          <img src={logo} alt={`Logo option ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="sm" variant="secondary">
                              <Check className="w-4 h-4 mr-1" />
                              Select
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <PenTool className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Generated logos will appear here</p>
                        <p className="text-sm mt-1">Fill out the form and click generate</p>
                      </div>
                    </div>
                  )}
                  {generatedLogos.length > 0 && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={handleGenerateLogo}
                      disabled={isGeneratingLogo}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Generate More Options
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sites" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">My Websites</h2>
                <p className="text-muted-foreground">Manage and edit your published sites</p>
              </div>
              <Button onClick={() => setActiveTab("templates")} data-testid="button-create-new-site">
                <Plus className="w-4 h-4 mr-2" />
                Create New Site
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Plus className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-2">Create Your First Website</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Choose a template and start building
                  </p>
                  <Button onClick={() => setActiveTab("templates")}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}