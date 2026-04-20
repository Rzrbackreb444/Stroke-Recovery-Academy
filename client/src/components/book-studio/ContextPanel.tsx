import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useBookStudio } from "@/lib/contexts/BookStudioContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Sparkles,
  Lightbulb,
  CheckCircle,
  Circle,
  FileText,
  Target,
  MessageSquare,
  PenTool,
  ChevronRight,
  X,
  Plus,
  Save,
} from "lucide-react";
import { NavigatorItem } from "./ProjectNavigator";

interface ContextPanelProps {
  selectedItem: NavigatorItem | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function ContextPanel({
  selectedItem,
  isCollapsed = false,
  onToggleCollapse,
}: ContextPanelProps) {
  const { 
    bookOutline, 
    brainstormIdeas,
    addBrainstormIdea,
    contentAnalysis,
    imagePrompts,
    recommendations 
  } = useBookStudio();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("outline");
  const [quickNote, setQuickNote] = useState("");

  if (isCollapsed) {
    return (
      <div className="w-10 h-full bg-sidebar border-l border-sidebar-border flex flex-col items-center py-4 gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onToggleCollapse}
          data-testid="button-expand-context"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
        </Button>
        <div className="flex flex-col gap-2 mt-4">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Outline" aria-label="Outline" data-testid="button-outline"
            onClick={() => { setActiveTab("outline"); onToggleCollapse?.(); }}>
            <BookOpen className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="AI Suggestions" aria-label="AI Suggestions" data-testid="button-ai-suggestions"
            onClick={() => { setActiveTab("ai"); onToggleCollapse?.(); }}>
            <Sparkles className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Notes" aria-label="Notes" data-testid="button-notes"
            onClick={() => { setActiveTab("notes"); onToggleCollapse?.(); }}>
            <FileText className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  const currentChapter = selectedItem?.type === 'chapter' && selectedItem.chapterIndex !== undefined
    ? bookOutline?.chapters?.[selectedItem.chapterIndex]
    : null;

  const relatedIdeas = brainstormIdeas.filter(idea => {
    if (!currentChapter) return false;
    const chapterContent = (currentChapter.description + ' ' + currentChapter.title).toLowerCase();
    return idea.content.toLowerCase().split(' ').some(word => 
      word.length > 4 && chapterContent.includes(word)
    );
  }).slice(0, 5);

  const relatedPrompts = imagePrompts.filter(prompt => 
    prompt.chapterNumber === (selectedItem?.chapterIndex ?? -1) + 1
  );

  return (
    <div className="flex flex-col h-full bg-sidebar border-l border-sidebar-border w-80">
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-serif font-semibold text-sidebar-foreground">
            Context
          </h2>
        </div>
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onToggleCollapse}
            data-testid="button-collapse-context"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 grid grid-cols-3 h-8">
          <TabsTrigger value="outline" className="text-xs" data-testid="tab-outline">
            Outline
          </TabsTrigger>
          <TabsTrigger value="ai" className="text-xs" data-testid="tab-ai">
            AI
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs" data-testid="tab-notes">
            Notes
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="outline" className="p-4 space-y-4 mt-0">
            {currentChapter ? (
              <>
                <Card className="bg-card/50 border-sidebar-border">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Target className="w-3.5 h-3.5" />
                      Current Chapter
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <h3 className="font-serif font-semibold text-sm text-foreground">
                      {currentChapter.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {currentChapter.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px]">
                        {currentChapter.targetWordCount.toLocaleString()} words target
                      </Badge>
                      <Badge 
                        variant={currentChapter.status === 'complete' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {currentChapter.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {currentChapter.keyPoints && currentChapter.keyPoints.length > 0 && (
                  <Card className="bg-card/50 border-sidebar-border">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Key Points
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 space-y-1.5">
                      {currentChapter.keyPoints.map((point, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Circle className="w-2 h-2 mt-1.5 text-primary shrink-0" />
                          <span className="text-xs text-foreground">{point}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {relatedIdeas.length > 0 && (
                  <Card className="bg-card/50 border-sidebar-border">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <Lightbulb className="w-3.5 h-3.5" />
                        Related Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 space-y-2">
                      {relatedIdeas.map((idea) => (
                        <div key={idea.id} className="text-xs">
                          <Badge variant="outline" className="text-[10px] mb-1">
                            {idea.type}
                          </Badge>
                          <p className="text-foreground/80 line-clamp-2">
                            {idea.content}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : bookOutline ? (
              <Card className="bg-card/50 border-sidebar-border">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    Book Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <h3 className="font-serif font-semibold text-sm text-foreground">
                    {bookOutline.title}
                  </h3>
                  {bookOutline.subtitle && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {bookOutline.subtitle}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <Badge variant="outline" className="text-[10px]">
                      {bookOutline.genre}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {bookOutline.chapters?.length || 0} chapters
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {bookOutline.targetWordCount.toLocaleString()} words
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No outline created yet</p>
                <p className="text-[10px] mt-1">Create an outline in the Plan step</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai" className="p-4 space-y-4 mt-0">
            {recommendations && Object.keys(recommendations).length > 0 ? (
              <>
                {recommendations.immediate && recommendations.immediate.length > 0 && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium text-primary flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        Immediate Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 space-y-1.5">
                      {recommendations.immediate.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                          <span className="text-xs text-foreground">{rec}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {recommendations.content && recommendations.content.length > 0 && (
                  <Card className="bg-card/50 border-sidebar-border">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <PenTool className="w-3.5 h-3.5" />
                        Content Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 space-y-1.5">
                      {recommendations.content.slice(0, 5).map((rec, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Circle className="w-2 h-2 mt-1.5 text-muted-foreground shrink-0" />
                          <span className="text-xs text-foreground/80">{rec}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {relatedPrompts.length > 0 && (
                  <Card className="bg-card/50 border-sidebar-border">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Image Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 space-y-2">
                      {relatedPrompts.map((prompt) => (
                        <div key={prompt.id} className="text-xs">
                          <p className="font-medium text-foreground">{prompt.title}</p>
                          <p className="text-muted-foreground line-clamp-2 mt-0.5">
                            {prompt.prompt}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No AI suggestions yet</p>
                <p className="text-[10px] mt-1">Analyze your content for recommendations</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="p-4 space-y-4 mt-0">
            <div className="space-y-2">
              <Textarea
                placeholder="Quick note for this section..."
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                className="min-h-[80px] text-xs bg-card/50 border-sidebar-border resize-none"
                data-testid="textarea-quick-note"
              />
              <Button 
                size="sm" 
                className="w-full h-7 text-xs"
                disabled={!quickNote.trim()}
                data-testid="button-save-note"
                onClick={() => {
                  if (!quickNote.trim()) return;
                  addBrainstormIdea({ type: "note", content: quickNote.trim() });
                  setQuickNote("");
                  toast({ title: "Note saved", description: "Your note has been added." });
                }}
              >
                <Save className="w-3 h-3 mr-1.5" />
                Save Note
              </Button>
            </div>

            <div className="border-t border-sidebar-border pt-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                Recent Notes
              </h4>
              {brainstormIdeas.filter(i => i.type === 'note').length > 0 ? (
                <div className="space-y-2">
                  {brainstormIdeas
                    .filter(i => i.type === 'note')
                    .slice(0, 5)
                    .map((note) => (
                      <Card key={note.id} className="bg-card/30 border-sidebar-border">
                        <CardContent className="p-2">
                          <p className="text-xs text-foreground/80 line-clamp-3">
                            {note.content}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No notes yet
                </p>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
