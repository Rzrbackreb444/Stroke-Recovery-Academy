import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import SquatchQRAnalytics from "@/components/SquatchQRAnalytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Plus,
  Sparkles,
  FolderOpen,
  BarChart3,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Star,
  Edit,
  Trash2,
  QrCode,
  Eye,
  Loader2,
  Search,
  Filter,
  Flame,
  Heart,
  Zap,
  Calendar,
  Brain,
  Briefcase,
  Smile,
  Target,
} from "lucide-react";

const FOREST_GREEN = "#C9941A";
const GOLD = "#C9941A";

const toneOptions = [
  { id: "tough-love", name: "Tough Love", icon: Flame, color: "#DC2626", example: "No excuses. Get it done." },
  { id: "gentle", name: "Gentle Encouragement", icon: Heart, color: "#10B981", example: "You're making progress every day." },
  { id: "recovery", name: "Recovery Warrior", icon: Zap, color: "#8B5CF6", example: "You survived. Now thrive." },
  { id: "ritual", name: "Daily Ritual", icon: Calendar, color: "#F59E0B", example: "Start with intention, end with gratitude." },
  { id: "mindfulness", name: "Mindfulness", icon: Brain, color: "#06B6D4", example: "Be present. This moment matters." },
  { id: "professional", name: "Professional", icon: Briefcase, color: "#6366F1", example: "Excellence is a habit, not an act." },
  { id: "humorous", name: "Humorous", icon: Smile, color: "#EC4899", example: "Life's too short for boring days." },
  { id: "actionable", name: "Actionable", icon: Target, color: "#14B8A6", example: "Today's task: Take one bold step." },
];

interface Quote {
  id: number;
  text: string;
  author?: string;
  tone: string;
  industry: string;
  rating: number;
  isApproved: boolean;
}

interface Project {
  id: number;
  name: string;
  industry: string;
  totalScans: number;
  isPublished: boolean;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function SquatchQRStudio() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("projects");
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedTone, setSelectedTone] = useState("");
  const [quoteCount, setQuoteCount] = useState([20]);
  const [generatedQuotes, setGeneratedQuotes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    industry: "",
    targetAudience: "",
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/quote-studio/categories"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/quote-studio/projects"],
  });

  const { data: quotesData } = useQuery<{ quotes: Quote[]; total: number }>({
    queryKey: ["/api/quote-studio/quotes"],
  });

  const generateQuotesMutation = useMutation({
    mutationFn: async (params: { industry: string; tone: string; targetAudience?: string; count: number }) => {
      const res = await apiRequest("POST", "/api/quote-studio/quotes/generate", params);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedQuotes(data.quotes || []);
      toast({ title: "Quotes generated!", description: `${data.quotes?.length || 0} quotes created` });
    },
    onError: (error: any) => {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (project: any) => {
      const res = await apiRequest("POST", "/api/quote-studio/projects", project);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quote-studio/projects"] });
      toast({ title: "Project created!", description: "Your QR project is ready" });
      setActiveTab("projects");
      resetWizard();
    },
    onError: (error: any) => {
      toast({ title: "Creation failed", description: error.message, variant: "destructive" });
    },
  });

  const approveQuoteMutation = useMutation({
    mutationFn: async ({ id, isApproved, rating }: { id: number; isApproved?: boolean; rating?: number }) => {
      const res = await apiRequest("PATCH", `/api/quote-studio/quotes/${id}`, { isApproved, rating });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quote-studio/quotes"] });
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/quote-studio/quotes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quote-studio/quotes"] });
      toast({ title: "Quote deleted" });
    },
  });

  const resetWizard = () => {
    setWizardStep(1);
    setSelectedTone("");
    setQuoteCount([20]);
    setGeneratedQuotes([]);
    setNewProject({ name: "", description: "", industry: "", targetAudience: "" });
  };

  const handleGenerateQuotes = () => {
    if (!newProject.industry || !selectedTone) {
      toast({ title: "Missing info", description: "Please select industry and tone", variant: "destructive" });
      return;
    }
    generateQuotesMutation.mutate({
      industry: newProject.industry,
      tone: selectedTone,
      targetAudience: newProject.targetAudience,
      count: quoteCount[0],
    });
  };

  const handleCreateProject = () => {
    const approvedQuoteIds = generatedQuotes.filter(q => q.isApproved !== false).map(q => q.id);
    createProjectMutation.mutate({
      ...newProject,
      quoteIds: approvedQuoteIds,
    });
  };

  const renderStarRating = (rating: number, quoteId: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => approveQuoteMutation.mutate({ id: quoteId, rating: star })}
          className="focus:outline-none"
          data-testid={`rating-star-${star}-${quoteId}`}
        >
          <Star
            className={`w-4 h-4 ${star <= rating ? "fill-[#C9941A] text-[#C9941A]" : "text-white/30"}`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D0D0D]" data-testid="squatchqr-studio">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              SquatchQR Studio
            </h1>
            <p className="text-white/60 mt-1">Create and manage your dynamic QR experiences</p>
          </div>
          <Button
            onClick={() => { setActiveTab("create"); resetWizard(); }}
            className="gap-2"
            style={{ backgroundColor: GOLD }}
            data-testid="button-new-project"
          >
            <Plus className="w-4 h-4" /> New Project
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#1a1a1a] border border-white/10 mb-8">
            <TabsTrigger value="projects" className="data-[state=active]:bg-[#C9941A] data-[state=active]:text-white" data-testid="tab-projects">
              <FolderOpen className="w-4 h-4 mr-2" /> My Projects
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-[#C9941A] data-[state=active]:text-white" data-testid="tab-create">
              <Plus className="w-4 h-4 mr-2" /> Create New
            </TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:bg-[#C9941A] data-[state=active]:text-white" data-testid="tab-library">
              <BookOpen className="w-4 h-4 mr-2" /> Quote Library
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#C9941A] data-[state=active]:text-white" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            {projects.length === 0 ? (
              <Card className="bg-[#1a1a1a] border-white/10">
                <CardContent className="py-16 text-center">
                  <QrCode className="w-16 h-16 text-white/30 mx-auto mb-4" />
                  <h3 className="text-xl text-white mb-2">No projects yet</h3>
                  <p className="text-white/60 mb-6">Create your first dynamic QR code project</p>
                  <Button onClick={() => setActiveTab("create")} style={{ backgroundColor: GOLD }} data-testid="button-create-first">
                    Create Your First Project
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card key={project.id} className="bg-[#1a1a1a] border-white/10 hover:border-[#C9941A]/50 transition-all group" data-testid={`project-card-${project.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-white">{project.name}</CardTitle>
                          <Badge variant="outline" className="mt-2 text-white/70 border-white/20">
                            {project.industry}
                          </Badge>
                        </div>
                        {project.isPublished ? (
                          <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-green-500/30">Live</Badge>
                        ) : (
                          <Badge variant="outline" className="text-white/50 border-white/20">Draft</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-white/60 mb-4">
                        <span>{project.totalScans} scans</span>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="outline" className="flex-1 border-white/20 text-white" data-testid={`button-edit-${project.id}`}>
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 border-white/20 text-white" data-testid={`button-view-${project.id}`}>
                          <Eye className="w-4 h-4 mr-1" /> View QR
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create">
            <Card className="bg-[#1a1a1a] border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">
                      {wizardStep === 1 && "Project Details"}
                      {wizardStep === 2 && "Choose Your Tone"}
                      {wizardStep === 3 && "Generate Quotes"}
                      {wizardStep === 4 && "Review & Approve"}
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Step {wizardStep} of 4
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`w-8 h-2 rounded-full ${step <= wizardStep ? "bg-[#C9941A]" : "bg-white/20"}`}
                      />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {wizardStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm text-white/80 mb-2 block">Project Name</label>
                      <Input
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        placeholder="e.g., Squatch Mix Daily Spark"
                        className="bg-[#0D0D0D] border-white/20 text-white"
                        data-testid="input-project-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/80 mb-2 block">Description</label>
                      <Textarea
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        placeholder="What is this QR project for?"
                        className="bg-[#0D0D0D] border-white/20 text-white"
                        data-testid="input-project-description"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/80 mb-2 block">Industry</label>
                      <Select
                        value={newProject.industry}
                        onValueChange={(value) => setNewProject({ ...newProject, industry: value })}
                      >
                        <SelectTrigger className="bg-[#0D0D0D] border-white/20 text-white" data-testid="select-industry">
                          <SelectValue placeholder="Select an industry" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-white/20">
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.slug} className="text-white">
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-white/80 mb-2 block">Target Audience (optional)</label>
                      <Input
                        value={newProject.targetAudience}
                        onChange={(e) => setNewProject({ ...newProject, targetAudience: e.target.value })}
                        placeholder="e.g., stroke survivors, entrepreneurs, laundromat owners"
                        className="bg-[#0D0D0D] border-white/20 text-white"
                        data-testid="input-target-audience"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => setWizardStep(2)}
                        disabled={!newProject.name || !newProject.industry}
                        style={{ backgroundColor: GOLD }}
                        data-testid="button-next-step1"
                      >
                        Next <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-6">
                    <p className="text-white/60">Select the tone for your quotes. This determines the voice and style of your daily messages.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {toneOptions.map((tone) => (
                        <button
                          key={tone.id}
                          onClick={() => setSelectedTone(tone.id)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            selectedTone === tone.id
                              ? "border-[#C9941A] bg-[#C9941A]/10"
                              : "border-white/10 bg-[#0D0D0D] hover:border-white/30"
                          }`}
                          data-testid={`tone-option-${tone.id}`}
                        >
                          <tone.icon className="w-6 h-6 mb-2" style={{ color: tone.color }} />
                          <h4 className="text-white font-medium text-sm">{tone.name}</h4>
                          <p className="text-white/50 text-xs mt-1 italic">"{tone.example}"</p>
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setWizardStep(1)} className="border-white/20 text-white" data-testid="button-back-step2">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button onClick={() => setWizardStep(3)} disabled={!selectedTone} style={{ backgroundColor: GOLD }} data-testid="button-next-step2">
                        Next <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm text-white/80 mb-2 block">Number of quotes to generate</label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={quoteCount}
                          onValueChange={setQuoteCount}
                          min={5}
                          max={50}
                          step={5}
                          className="flex-1"
                          data-testid="slider-quote-count"
                        />
                        <span className="text-white font-bold w-12">{quoteCount[0]}</span>
                      </div>
                    </div>
                    <Button
                      onClick={handleGenerateQuotes}
                      disabled={generateQuotesMutation.isPending}
                      className="w-full gap-2"
                      style={{ backgroundColor: FOREST_GREEN }}
                      data-testid="button-generate-quotes"
                    >
                      {generateQuotesMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Generate with AI</>
                      )}
                    </Button>

                    {generatedQuotes.length > 0 && (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {generatedQuotes.map((quote, i) => (
                          <div key={quote.id || i} className="p-4 bg-[#0D0D0D] rounded-lg border border-white/10">
                            <p className="text-white text-sm">"{quote.text}"</p>
                            {quote.author && <p className="text-white/50 text-xs mt-1">— {quote.author}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setWizardStep(2)} className="border-white/20 text-white" data-testid="button-back-step3">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button
                        onClick={() => setWizardStep(4)}
                        disabled={generatedQuotes.length === 0}
                        style={{ backgroundColor: GOLD }}
                        data-testid="button-next-step3"
                      >
                        Review Quotes <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {wizardStep === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-white/60">{generatedQuotes.length} quotes ready for approval</p>
                      <Button size="sm" variant="outline" className="border-white/20 text-white" data-testid="button-approve-all">
                        <Check className="w-4 h-4 mr-1" /> Approve All
                      </Button>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {generatedQuotes.map((quote, i) => (
                        <div key={quote.id || i} className="p-4 bg-[#0D0D0D] rounded-lg border border-white/10 flex items-start gap-4">
                          <input type="checkbox" defaultChecked className="mt-1" />
                          <div className="flex-1">
                            <p className="text-white text-sm">"{quote.text}"</p>
                            <div className="flex items-center gap-4 mt-2">
                              {renderStarRating(quote.rating || 0, quote.id)}
                            </div>
                          </div>
                          <button className="text-white/50 hover:text-red-400" data-testid={`delete-quote-${i}`}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setWizardStep(3)} className="border-white/20 text-white" data-testid="button-back-step4">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button
                        onClick={handleCreateProject}
                        disabled={createProjectMutation.isPending}
                        style={{ backgroundColor: GOLD }}
                        data-testid="button-create-project"
                      >
                        {createProjectMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</>
                        ) : (
                          <>Create Project <Check className="w-4 h-4 ml-2" /></>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library">
            <Card className="bg-[#1a1a1a] border-white/10">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input
                      placeholder="Search quotes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-[#0D0D0D] border-white/20 text-white"
                      data-testid="input-search-quotes"
                    />
                  </div>
                  <Button variant="outline" className="border-white/20 text-white gap-2" data-testid="button-filter">
                    <Filter className="w-4 h-4" /> Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!quotesData?.quotes?.length ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <p className="text-white/60">No quotes yet. Create a project to generate quotes.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quotesData.quotes.map((quote) => (
                      <div key={quote.id} className="p-4 bg-[#0D0D0D] rounded-lg border border-white/10 flex items-start justify-between gap-4" data-testid={`quote-row-${quote.id}`}>
                        <div className="flex-1">
                          <p className="text-white text-sm">"{quote.text}"</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="text-xs text-white/60 border-white/20">{quote.industry}</Badge>
                            <Badge variant="outline" className="text-xs text-white/60 border-white/20">{quote.tone}</Badge>
                            {renderStarRating(quote.rating, quote.id)}
                            {quote.isApproved ? (
                              <Badge className="bg-[#C9941A]/20 text-[#C9941A] text-xs">Approved</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-white/50">Pending</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => approveQuoteMutation.mutate({ id: quote.id, isApproved: !quote.isApproved })}
                            className="text-white/50 hover:text-[#C9941A]"
                            data-testid={`approve-quote-${quote.id}`}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteQuoteMutation.mutate(quote.id)}
                            className="text-white/50 hover:text-red-400"
                            data-testid={`delete-quote-${quote.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <SquatchQRAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
