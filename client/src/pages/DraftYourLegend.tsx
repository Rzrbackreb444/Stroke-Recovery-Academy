import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecoveryHeader from "@/components/RecoveryHeader";
import { 
  BookOpen, PenTool, Save, ChevronLeft, ChevronRight, 
  Sparkles, FileText, Trophy, Clock, Plus, Trash2
} from "lucide-react";

const defaultChapters = [
  { id: 1, title: "Before the Storm", subtitle: "Life before stroke", content: "", prompts: ["What was your life like before?", "What were your dreams and goals?", "Who were the important people in your life?"] },
  { id: 2, title: "The Day Everything Changed", subtitle: "When the stroke happened", content: "", prompts: ["What do you remember about that day?", "Who was with you?", "What were the first signs?"] },
  { id: 3, title: "The Dark Days", subtitle: "Early recovery struggles", content: "", prompts: ["What was the hardest part?", "What fears did you face?", "What kept you going?"] },
  { id: 4, title: "Finding My Fight", subtitle: "Discovering inner strength", content: "", prompts: ["When did you first feel hope?", "What breakthrough moment changed things?", "Who inspired you?"] },
  { id: 5, title: "Small Victories", subtitle: "The wins that mattered", content: "", prompts: ["What small victory meant the most?", "How did you celebrate progress?", "What surprised you about yourself?"] },
  { id: 6, title: "The Sasquatch Rises", subtitle: "Becoming unstoppable", content: "", prompts: ["How have you grown?", "What can you do now that seemed impossible?", "How do you help others?"] },
  { id: 7, title: "My Legend Continues", subtitle: "Looking to the future", content: "", prompts: ["What are your new dreams?", "What advice would you give others?", "How will you be remembered?"] },
];

export default function DraftYourLegend() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentChapter, setCurrentChapter] = useState(0);
  const [legend, setLegend] = useState({
    title: "My Recovery Legend",
    subtitle: "",
    chapters: defaultChapters,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const { data: savedLegend, isLoading } = useQuery<any>({
    queryKey: ["/api/recovery/legend"],
  });

  useEffect(() => {
    if (savedLegend) {
      setLegend({
        title: savedLegend.title || "My Recovery Legend",
        subtitle: savedLegend.subtitle || "",
        chapters: savedLegend.chapters ? JSON.parse(savedLegend.chapters) : defaultChapters,
      });
    }
  }, [savedLegend]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/recovery/legend", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/legend"] });
      setHasChanges(false);
      toast({ title: "Legend saved!", description: "Your story is being preserved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not save your legend", variant: "destructive" });
    },
  });

  const handleSave = () => {
    const totalWords = legend.chapters.reduce((sum, ch) => {
      return sum + (ch.content?.split(/\s+/).filter(Boolean).length || 0);
    }, 0);

    saveMutation.mutate({
      title: legend.title,
      subtitle: legend.subtitle,
      chapters: legend.chapters,
      currentChapter: currentChapter + 1,
      totalWordCount: totalWords,
      status: totalWords > 1000 ? "in_progress" : "draft",
    });
  };

  const updateChapterContent = (content: string) => {
    const newChapters = [...legend.chapters];
    newChapters[currentChapter] = { ...newChapters[currentChapter], content };
    setLegend({ ...legend, chapters: newChapters });
    setHasChanges(true);
  };

  const chapter = legend.chapters[currentChapter];
  const totalWords = legend.chapters.reduce((sum, ch) => {
    return sum + (ch.content?.split(/\s+/).filter(Boolean).length || 0);
  }, 0);
  const completedChapters = legend.chapters.filter(ch => ch.content && ch.content.length > 100).length;
  const progress = (completedChapters / legend.chapters.length) * 100;

  return (
    <div className="min-h-screen bg-black text-white">
      <RecoveryHeader />
      
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-orange-500" />
              Draft Your Legend
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Write your recovery story - your memoir of resilience
            </p>
          </div>
          
          <Button 
            onClick={handleSave} 
            className="bg-orange-500 hover:bg-orange-600"
            disabled={saveMutation.isPending || !hasChanges}
            data-testid="button-save-legend"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Legend"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-orange-500" />
              <span className="text-gray-400 text-sm">Total Words</span>
            </div>
            <div className="text-2xl font-bold">{totalWords.toLocaleString()}</div>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-gray-400 text-sm">Chapters Complete</span>
            </div>
            <div className="text-2xl font-bold">{completedChapters} / {legend.chapters.length}</div>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-gray-400 text-sm">Progress</span>
            </div>
            <Progress value={progress} className="h-2 mt-2" />
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="bg-zinc-900 border-zinc-800 p-4">
              <h3 className="font-semibold mb-3 text-sm text-gray-400">CHAPTERS</h3>
              <div className="space-y-2">
                {legend.chapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => setCurrentChapter(idx)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      idx === currentChapter 
                        ? 'bg-orange-500/20 border border-orange-500' 
                        : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                    data-testid={`chapter-${idx + 1}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-orange-500 font-bold">{idx + 1}</span>
                      <span className="text-sm font-medium truncate">{ch.title}</span>
                    </div>
                    {ch.content && ch.content.length > 100 && (
                      <Badge className="mt-1 bg-green-500/20 text-green-400 text-xs">
                        Complete
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="border-orange-500 text-orange-500">
                    Chapter {currentChapter + 1}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentChapter(Math.max(0, currentChapter - 1))}
                      disabled={currentChapter === 0}
                      data-testid="button-prev-chapter"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentChapter(Math.min(legend.chapters.length - 1, currentChapter + 1))}
                      disabled={currentChapter === legend.chapters.length - 1}
                      data-testid="button-next-chapter"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <h2 className="text-2xl font-bold">{chapter.title}</h2>
                <p className="text-gray-400">{chapter.subtitle}</p>
              </div>

              <div className="mb-6 p-4 bg-zinc-800/50 rounded-lg">
                <h4 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Writing Prompts
                </h4>
                <ul className="space-y-1">
                  {chapter.prompts?.map((prompt, idx) => (
                    <li key={idx} className="text-gray-400 text-sm flex items-start gap-2">
                      <span className="text-orange-500">•</span>
                      {prompt}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <PenTool className="h-4 w-4 text-orange-500" />
                  Your Story
                </Label>
                <Textarea
                  placeholder="Start writing your story... Let your journey flow onto the page. This is your legend."
                  value={chapter.content || ""}
                  onChange={(e) => updateChapterContent(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 min-h-[400px] text-lg leading-relaxed"
                  data-testid="textarea-chapter-content"
                />
                <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                  <span>
                    {chapter.content?.split(/\s+/).filter(Boolean).length || 0} words in this chapter
                  </span>
                  {hasChanges && (
                    <span className="text-orange-400">Unsaved changes</span>
                  )}
                </div>
              </div>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 p-6 mt-4">
              <h3 className="font-semibold mb-4">Book Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Book Title</Label>
                  <Input
                    value={legend.title}
                    onChange={(e) => {
                      setLegend({ ...legend, title: e.target.value });
                      setHasChanges(true);
                    }}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                    placeholder="My Recovery Legend"
                    data-testid="input-legend-title"
                  />
                </div>
                <div>
                  <Label>Subtitle (optional)</Label>
                  <Input
                    value={legend.subtitle}
                    onChange={(e) => {
                      setLegend({ ...legend, subtitle: e.target.value });
                      setHasChanges(true);
                    }}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                    placeholder="A Stroke Survivor's Journey"
                    data-testid="input-legend-subtitle"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
