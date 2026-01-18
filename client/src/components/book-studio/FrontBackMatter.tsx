import { useState, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useBookStudio } from "@/lib/contexts/BookStudioContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  FileText,
  Sparkles,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Eye,
  EyeOff,
  Loader2,
  Heart,
  Quote,
  List,
  BookMarked,
  Lightbulb,
  Wand2,
  RefreshCw,
  Download,
  Copy,
  AlignLeft,
  AlignCenter,
  User,
  MessageSquare,
  Award,
  Calendar,
} from "lucide-react";

interface MatterSection {
  id: string;
  type: 'front' | 'back';
  category: 'dedication' | 'foreword' | 'preface' | 'toc' | 'epigraph' | 'acknowledgments' | 'about_author' | 'appendix' | 'epilogue' | 'glossary' | 'bibliography' | 'index';
  title: string;
  content: string;
  isEnabled: boolean;
  order: number;
}

interface FrontBackMatterProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert?: (content: string, position: 'front' | 'back') => void;
}

const MATTER_TEMPLATES: Omit<MatterSection, 'id' | 'order'>[] = [
  { type: 'front', category: 'dedication', title: 'Dedication', content: '', isEnabled: true },
  { type: 'front', category: 'epigraph', title: 'Epigraph', content: '', isEnabled: false },
  { type: 'front', category: 'foreword', title: 'Foreword', content: '', isEnabled: true },
  { type: 'front', category: 'preface', title: 'Preface', content: '', isEnabled: false },
  { type: 'front', category: 'toc', title: 'Table of Contents', content: '', isEnabled: true },
  { type: 'back', category: 'epilogue', title: 'Epilogue', content: '', isEnabled: false },
  { type: 'back', category: 'acknowledgments', title: 'Acknowledgments', content: '', isEnabled: true },
  { type: 'back', category: 'about_author', title: 'About the Author', content: '', isEnabled: true },
  { type: 'back', category: 'appendix', title: 'Appendix', content: '', isEnabled: false },
  { type: 'back', category: 'glossary', title: 'Glossary', content: '', isEnabled: false },
  { type: 'back', category: 'bibliography', title: 'Bibliography', content: '', isEnabled: false },
];

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  dedication: Heart,
  epigraph: Quote,
  foreword: MessageSquare,
  preface: AlignLeft,
  toc: List,
  epilogue: BookMarked,
  acknowledgments: Award,
  about_author: User,
  appendix: FileText,
  glossary: AlignLeft,
  bibliography: BookOpen,
  index: List,
};

export default function FrontBackMatter({
  isOpen,
  onClose,
  onInsert,
}: FrontBackMatterProps) {
  const { toast } = useToast();
  const { bookOutline, bookTitle } = useBookStudio();
  const authorName = "Author"; // Default author name

  const [sections, setSections] = useState<MatterSection[]>(() => 
    MATTER_TEMPLATES.map((t, idx) => ({
      ...t,
      id: `section-${idx}`,
      order: idx,
    }))
  );

  const [selectedSection, setSelectedSection] = useState<MatterSection | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'front' | 'back'>('front');

  const frontMatter = useMemo(() => 
    sections.filter(s => s.type === 'front').sort((a, b) => a.order - b.order),
    [sections]
  );

  const backMatter = useMemo(() => 
    sections.filter(s => s.type === 'back').sort((a, b) => a.order - b.order),
    [sections]
  );

  const generateTOC = useCallback(() => {
    if (!bookOutline?.chapters) return '';
    
    const lines: string[] = [];
    lines.push('# Table of Contents\n');
    
    bookOutline.chapters.forEach((chapter, idx) => {
      lines.push(`**Chapter ${idx + 1}**: ${chapter.title}`);
    });
    
    return lines.join('\n');
  }, [bookOutline]);

  const generateSection = useMutation({
    mutationFn: async (section: MatterSection) => {
      setGeneratingId(section.id);
      setIsGenerating(true);
      
      const prompts: Record<string, string> = {
        dedication: `Write a heartfelt book dedication for "${bookTitle || 'my book'}" by ${authorName || 'the author'}. Keep it sincere and brief (2-3 sentences).`,
        foreword: `Write a compelling foreword for "${bookTitle || 'my book'}", a ${bookOutline?.genre || 'book'} by ${authorName || 'the author'}. Explain why this book matters and what readers will gain. Keep it under 300 words.`,
        preface: `Write a preface for "${bookTitle || 'my book'}" explaining the author's journey and motivation for writing this book. Include personal anecdotes. Keep it under 400 words.`,
        epigraph: `Suggest 3 inspiring epigraphs (quotes) that would be perfect for "${bookTitle || 'my book'}", a ${bookOutline?.genre || 'book'}. Include the source/author of each quote.`,
        acknowledgments: `Write acknowledgments for "${bookTitle || 'my book'}". Thank family, editors, publishers, and supporters. Make it personal and genuine. Keep it under 300 words.`,
        about_author: `Write an "About the Author" section for ${authorName || 'the author'}, who wrote "${bookTitle || 'my book'}". Create an engaging author bio in third person. Keep it under 200 words.`,
        epilogue: `Write an epilogue for "${bookTitle || 'my book'}" that provides closure while leaving readers with something to think about. Keep it under 500 words.`,
        appendix: `Create an appendix structure for "${bookTitle || 'my book'}", a ${bookOutline?.genre || 'book'}. Include relevant supplementary materials, resources, and references.`,
        glossary: `Create a glossary of key terms for "${bookTitle || 'my book'}", a ${bookOutline?.genre || 'book'}. Define 10-15 important terms used in the book.`,
        bibliography: `Create a bibliography template for "${bookTitle || 'my book'}". Include proper citation format and example entries.`,
      };

      if (section.category === 'toc') {
        return generateTOC();
      }

      const prompt = prompts[section.category] || `Generate content for the ${section.title} section of "${bookTitle || 'my book'}".`;

      const response = await apiRequest('POST', '/api/book-studio/generate-content', {
        prompt,
        type: section.category,
        bookContext: {
          title: bookTitle,
          author: authorName,
          genre: bookOutline?.genre,
          chapterCount: bookOutline?.chapters?.length || 0,
        },
      });

      const data = await response.json();
      return data.content || `# ${section.title}\n\n[AI-generated content will appear here]`;
    },
    onSuccess: (content, section) => {
      setSections(prev => prev.map(s => 
        s.id === section.id ? { ...s, content } : s
      ));
      setIsGenerating(false);
      setGeneratingId(null);
      toast({ title: `${section.title} generated` });
    },
    onError: (error, section) => {
      setIsGenerating(false);
      setGeneratingId(null);
      
      const fallbackContent = section.category === 'toc' 
        ? generateTOC() 
        : `# ${section.title}\n\n[Content generation failed. Please write your own content here.]`;
      
      setSections(prev => prev.map(s => 
        s.id === section.id ? { ...s, content: fallbackContent } : s
      ));
      
      toast({ title: "Using fallback content", description: "AI generation unavailable" });
    },
  });

  const generateAllEnabled = useMutation({
    mutationFn: async () => {
      const enabledSections = sections.filter(s => s.isEnabled && !s.content);
      
      for (const section of enabledSections) {
        await generateSection.mutateAsync(section);
      }
    },
    onSuccess: () => {
      toast({ title: "All sections generated", description: "Review and customize as needed" });
    },
  });

  const toggleSection = useCallback((id: string) => {
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, isEnabled: !s.isEnabled } : s
    ));
  }, []);

  const updateContent = useCallback((id: string, content: string) => {
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, content } : s
    ));
  }, []);

  const moveSection = useCallback((id: string, direction: 'up' | 'down') => {
    setSections(prev => {
      const section = prev.find(s => s.id === id);
      if (!section) return prev;
      
      const sametype = prev.filter(s => s.type === section.type).sort((a, b) => a.order - b.order);
      const currentIdx = sametype.findIndex(s => s.id === id);
      const swapIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
      
      if (swapIdx < 0 || swapIdx >= sametype.length) return prev;
      
      const swapSection = sametype[swapIdx];
      
      return prev.map(s => {
        if (s.id === id) return { ...s, order: swapSection.order };
        if (s.id === swapSection.id) return { ...s, order: section.order };
        return s;
      });
    });
  }, []);

  const insertAll = useCallback(() => {
    const frontContent = frontMatter
      .filter(s => s.isEnabled && s.content)
      .map(s => s.content)
      .join('\n\n---\n\n');
    
    const backContent = backMatter
      .filter(s => s.isEnabled && s.content)
      .map(s => s.content)
      .join('\n\n---\n\n');
    
    if (frontContent) onInsert?.(frontContent, 'front');
    if (backContent) onInsert?.(backContent, 'back');
    
    toast({ title: "Content inserted", description: "Front and back matter added to manuscript" });
    onClose();
  }, [frontMatter, backMatter, onInsert, onClose, toast]);

  const renderSectionCard = (section: MatterSection, index: number, total: number) => {
    const Icon = CATEGORY_ICONS[section.category] || FileText;
    const isCurrentlyGenerating = generatingId === section.id;
    
    return (
      <Card 
        key={section.id}
        className={cn(
          "transition-all",
          !section.isEnabled && "opacity-60",
          selectedSection?.id === section.id && "ring-1 ring-primary"
        )}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
              <Icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{section.title}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => moveSection(section.id, 'up')}
                disabled={index === 0}
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => moveSection(section.id, 'down')}
                disabled={index === total - 1}
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
              <Switch
                checked={section.isEnabled}
                onCheckedChange={() => toggleSection(section.id)}
              />
            </div>
          </div>
        </CardHeader>
        
        {section.isEnabled && (
          <CardContent className="p-3 pt-0">
            {section.content ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {section.content.slice(0, 100)}...
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px]"
                    onClick={() => setSelectedSection(section)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px]"
                    onClick={() => generateSection.mutate(section)}
                    disabled={isCurrentlyGenerating}
                  >
                    {isCurrentlyGenerating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() => generateSection.mutate(section)}
                disabled={isCurrentlyGenerating}
              >
                {isCurrentlyGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-1" />
                    Generate with AI
                  </>
                )}
              </Button>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Smart Front & Back Matter
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-1">
            <TabsList>
              <TabsTrigger value="front" className="gap-1">
                <FileText className="w-3.5 h-3.5" />
                Front Matter
                <Badge variant="secondary" className="ml-1 text-[9px]">
                  {frontMatter.filter(s => s.isEnabled).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="back" className="gap-1">
                <BookMarked className="w-3.5 h-3.5" />
                Back Matter
                <Badge variant="secondary" className="ml-1 text-[9px]">
                  {backMatter.filter(s => s.isEnabled).length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            
            <Button
              size="sm"
              onClick={() => generateAllEnabled.mutate()}
              disabled={generateAllEnabled.isPending}
            >
              {generateAllEnabled.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 mr-1" />
                  Generate All
                </>
              )}
            </Button>
          </div>

          <TabsContent value="front" className="flex-1 m-0 mt-4 overflow-hidden">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {frontMatter.map((section, idx) => 
                  renderSectionCard(section, idx, frontMatter.length)
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="back" className="flex-1 m-0 mt-4 overflow-hidden">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {backMatter.map((section, idx) => 
                  renderSectionCard(section, idx, backMatter.length)
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={insertAll}>
            <Download className="w-4 h-4 mr-2" />
            Insert All to Manuscript
          </Button>
        </DialogFooter>

        {selectedSection && (
          <Dialog open={!!selectedSection} onOpenChange={() => setSelectedSection(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = CATEGORY_ICONS[selectedSection.category] || FileText;
                    return <Icon className="w-5 h-5 text-primary" />;
                  })()}
                  Edit {selectedSection.title}
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="flex-1 max-h-[50vh]">
                <Textarea
                  value={selectedSection.content}
                  onChange={(e) => updateContent(selectedSection.id, e.target.value)}
                  className="min-h-[300px] font-serif"
                  placeholder={`Write your ${selectedSection.title.toLowerCase()} here...`}
                />
              </ScrollArea>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedSection(null)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generateSection.mutate(selectedSection)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Regenerate
                </Button>
                <Button onClick={() => setSelectedSection(null)}>
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
