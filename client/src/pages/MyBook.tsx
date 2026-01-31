import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import SasquatchChatWidget from "@/components/recovery/SasquatchChatWidget";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, Plus, Edit3, Eye, Download, Save,
  Clock, Calendar, FileText, Sparkles, ChevronRight, PenTool,
  CheckCircle, AlertCircle, Loader2, X, ChevronDown, ChevronUp
} from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  lastEdited: string;
}

interface RecoveryBook {
  id?: number;
  title: string;
  subtitle: string;
  chapters: Chapter[];
  wordCount: number;
  lastSaved: string | null;
}

const MEMOIR_PROMPTS = [
  { id: "before-stroke", title: "Life Before the Stroke", prompt: "Describe your life before the stroke. What were you doing? What were your dreams?" },
  { id: "the-day", title: "The Day It Happened", prompt: "Walk through the day of your stroke. What do you remember? What were the first signs?" },
  { id: "hospital", title: "Hospital & Early Recovery", prompt: "Describe your time in the hospital. The doctors, the therapists, the emotions..." },
  { id: "going-home", title: "Going Home", prompt: "What was it like returning home? What challenges did you face?" },
  { id: "rehabilitation", title: "The Rehabilitation Journey", prompt: "Describe your rehabilitation process. The exercises, the small victories, the setbacks..." },
  { id: "support-system", title: "My Support System", prompt: "Who helped you through this? How did relationships change?" },
  { id: "turning-point", title: "The Turning Point", prompt: "Was there a moment when things started to click? When you knew you'd be okay?" },
  { id: "lessons-learned", title: "Lessons Learned", prompt: "What has this experience taught you? How have you grown?" },
  { id: "message-to-survivors", title: "Message to Fellow Survivors", prompt: "What would you tell someone who just had a stroke? What advice would you give?" },
  { id: "future", title: "Looking Forward", prompt: "What are your goals now? What does the future look like?" },
];

export default function MyBook() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [chapterContent, setChapterContent] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { data: book, isLoading } = useQuery<RecoveryBook>({
    queryKey: ['/api/recovery/my-book'],
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { chapterId: string; title: string; content: string }) => {
      const res = await apiRequest('POST', '/api/recovery/my-book/chapter', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recovery/my-book'] });
      setLastSaved(new Date());
      toast({
        title: "Chapter Saved",
        description: "Your progress has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Could not save your chapter. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (book?.chapters) {
      const contentMap: Record<string, string> = {};
      book.chapters.forEach((ch: Chapter) => {
        contentMap[ch.id] = ch.content || '';
      });
      setChapterContent(contentMap);
    }
  }, [book]);

  const handleContentChange = (chapterId: string, content: string) => {
    setChapterContent(prev => ({ ...prev, [chapterId]: content }));
  };

  const handleSaveChapter = async (chapterId: string, title: string) => {
    const content = chapterContent[chapterId] || '';
    setIsSaving(true);
    await saveMutation.mutateAsync({ chapterId, title, content });
    setIsSaving(false);
  };

  const getWordCount = (chapterId: string) => {
    const content = chapterContent[chapterId] || '';
    return content.split(/\s+/).filter(Boolean).length;
  };

  const totalWords = Object.values(chapterContent).reduce((sum, content) => {
    return sum + (content?.split(/\s+/).filter(Boolean).length || 0);
  }, 0);

  const chaptersStarted = Object.values(chapterContent).filter(c => c && c.length > 0).length;
  const progressPercent = (chaptersStarted / MEMOIR_PROMPTS.length) * 100;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#C9941A] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="bg-[#1a1a1a] border-[#333] p-12 text-center">
            <BookOpen className="h-16 w-16 text-[#C9941A] mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Sign In to Write Your Story</h2>
            <p className="text-gray-400 mb-6">
              Your recovery memoir will be saved securely to your account
            </p>
            <Link href="/api/login">
              <Button className="bg-[#C9941A] text-black font-semibold">
                Sign In to Continue
              </Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <SEO
        title="My Recovery Story | Stroke Recovery Academy"
        description="Write your personal stroke recovery memoir with guided prompts and AI assistance."
        canonical="/my-book"
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
              <BookOpen className="h-10 w-10 text-[#C9941A]" />
              My Recovery Story
            </h1>
            <p className="text-gray-400">
              Your personal memoir - one chapter at a time
            </p>
          </div>
          {lastSaved && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Saved {lastSaved.toLocaleTimeString()}
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-[#1a1a1a] border-[#333] p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#C9941A]/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-[#C9941A]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalWords.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Words Written</p>
              </div>
            </div>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#333] p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#C9941A]/20 flex items-center justify-center">
                <PenTool className="h-6 w-6 text-[#C9941A]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{chaptersStarted} / {MEMOIR_PROMPTS.length}</p>
                <p className="text-gray-400 text-sm">Chapters Started</p>
              </div>
            </div>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#333] p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#C9941A]/20 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-[#C9941A]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(progressPercent)}%</p>
                <p className="text-gray-400 text-sm">Complete</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="bg-[#1a1a1a] border-[#333] p-4 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Overall Progress</span>
            <span className="text-sm text-[#C9941A] font-semibold">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-3 bg-[#333] [&>div]:bg-gradient-to-r [&>div]:from-[#C9941A] [&>div]:to-[#E5B84C]" />
        </Card>

        <Card className="bg-gradient-to-br from-[#C9941A]/10 to-[#1a1a1a] border-[#C9941A]/30 p-6 mb-8">
          <div className="flex items-center gap-4">
            <Sparkles className="h-8 w-8 text-[#C9941A]" />
            <div className="flex-1">
              <h3 className="font-bold mb-1">AI Writing Coach Available</h3>
              <p className="text-gray-400 text-sm">
                Stuck on a chapter? Ask Sasquatch Coach for help with prompts, suggestions, 
                or to work through difficult memories together.
              </p>
            </div>
          </div>
        </Card>

        <h2 className="text-2xl font-bold mb-4">Your Chapters</h2>
        <p className="text-gray-400 mb-6">
          Click on any chapter to start writing. Your work is automatically saved.
        </p>

        <div className="space-y-4">
          {MEMOIR_PROMPTS.map((chapter, index) => {
            const wordCount = getWordCount(chapter.id);
            const isActive = activeChapter === chapter.id;
            const hasContent = wordCount > 0;
            
            return (
              <Card 
                key={chapter.id} 
                className={`bg-[#1a1a1a] border-[#333] overflow-hidden transition-all duration-300 ${isActive ? 'border-[#C9941A]' : 'hover:border-[#C9941A]/30'}`}
                data-testid={`card-chapter-${chapter.id}`}
              >
                <button
                  className="w-full p-6 text-left flex items-center justify-between"
                  onClick={() => setActiveChapter(isActive ? null : chapter.id)}
                  data-testid={`button-toggle-${chapter.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasContent ? 'bg-[#C9941A]' : 'bg-[#333]'}`}>
                      {hasContent ? (
                        <CheckCircle className="h-5 w-5 text-black" />
                      ) : (
                        <span className="text-gray-400 font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{chapter.title}</h3>
                      <p className="text-sm text-gray-500">
                        {wordCount > 0 ? `${wordCount.toLocaleString()} words` : 'Not started'}
                      </p>
                    </div>
                  </div>
                  {isActive ? (
                    <ChevronUp className="h-5 w-5 text-[#C9941A]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                
                {isActive && (
                  <div className="px-6 pb-6 border-t border-[#333]">
                    <div className="bg-[#0D0D0D] rounded-lg p-4 mt-4 mb-4">
                      <p className="text-gray-300 text-sm italic">
                        "{chapter.prompt}"
                      </p>
                    </div>
                    
                    <Textarea
                      placeholder="Start writing your story here..."
                      value={chapterContent[chapter.id] || ''}
                      onChange={(e) => handleContentChange(chapter.id, e.target.value)}
                      className="bg-[#0D0D0D] border-[#333] text-white min-h-[300px] mb-4 resize-none"
                      data-testid={`textarea-${chapter.id}`}
                    />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {getWordCount(chapter.id).toLocaleString()} words
                      </span>
                      <Button
                        className="bg-[#C9941A] text-black"
                        onClick={() => handleSaveChapter(chapter.id, chapter.title)}
                        disabled={saveMutation.isPending}
                        data-testid={`button-save-${chapter.id}`}
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Chapter
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <Card className="bg-[#1a1a1a] border-[#333] p-8 mt-8 text-center">
          <Download className="h-12 w-12 text-[#C9941A] mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Ready to Share Your Story?</h3>
          <p className="text-gray-400 mb-6">
            When you're ready, export your memoir as a PDF or submit it for professional publishing 
            through our Book Studio.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" className="border-[#333] text-gray-300" disabled={totalWords < 1000}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Link href="/book-studio">
              <Button className="bg-[#C9941A] text-black">
                <Edit3 className="h-4 w-4 mr-2" />
                Open in Book Studio
              </Button>
            </Link>
          </div>
          {totalWords < 1000 && (
            <p className="text-xs text-gray-500 mt-4">
              Write at least 1,000 words to unlock export options
            </p>
          )}
        </Card>
      </main>

      <SasquatchChatWidget />
    </div>
  );
}
