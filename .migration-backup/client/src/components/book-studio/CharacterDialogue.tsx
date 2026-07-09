import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBookStudio } from "@/lib/contexts/BookStudioContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Users,
  Send,
  Sparkles,
  MessageSquare,
  Edit,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  Loader2,
  Quote,
  User,
  Settings,
  Brain,
  Zap,
  Mic,
  Volume2,
  Check,
  X,
  ChevronRight,
  Wand2,
  BookOpen,
  Download,
} from "lucide-react";

interface Character {
  id: string;
  name: string;
  role: string;
  age?: string;
  personality: string;
  backstory: string;
  speechPattern: string;
  vocabulary: string[];
  quirks: string[];
  emotionalState: string;
  goals: string;
  relationships: string;
  voiceTone: 'formal' | 'casual' | 'poetic' | 'gruff' | 'mysterious' | 'cheerful';
}

interface DialogueMessage {
  id: string;
  role: 'user' | 'character';
  characterId?: string;
  characterName?: string;
  content: string;
  timestamp: Date;
  isNarration?: boolean;
}

interface DialogueSession {
  id: string;
  title: string;
  characters: string[];
  messages: DialogueMessage[];
  createdAt: Date;
  scene?: string;
}

interface CharacterDialogueProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertDialogue?: (dialogue: string) => void;
}

const VOICE_TONES = [
  { value: 'formal', label: 'Formal', description: 'Professional, proper speech' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, everyday language' },
  { value: 'poetic', label: 'Poetic', description: 'Lyrical, metaphorical style' },
  { value: 'gruff', label: 'Gruff', description: 'Short, rough responses' },
  { value: 'mysterious', label: 'Mysterious', description: 'Cryptic, enigmatic' },
  { value: 'cheerful', label: 'Cheerful', description: 'Upbeat, positive energy' },
];

const DEFAULT_CHARACTERS: Character[] = [
  {
    id: 'char-1',
    name: 'Nicholas',
    role: 'Protagonist',
    age: '45',
    personality: 'Determined, resilient, empathetic. Has overcome tremendous personal challenges and uses that experience to help others.',
    backstory: 'After surviving a severe stroke, Nicholas dedicated his life to recovery and helping others on their journey. His personal experience gives him unique insight into the struggles of rehabilitation.',
    speechPattern: 'Direct and encouraging. Uses medical terminology naturally but explains it simply. Often shares personal anecdotes.',
    vocabulary: ['recovery', 'neuroplasticity', 'progress', 'determination'],
    quirks: ['Often pauses to reflect before speaking', 'Uses hand gestures when explaining'],
    emotionalState: 'Hopeful but realistic',
    goals: 'To help as many stroke survivors as possible achieve meaningful recovery',
    relationships: 'Mentor to many, friend to fellow survivors',
    voiceTone: 'casual',
  },
];

export default function CharacterDialogue({
  isOpen,
  onClose,
  onInsertDialogue,
}: CharacterDialogueProps) {
  const { toast } = useToast();
  const { bookTitle, brainProjectId } = useBookStudio();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [characters, setCharacters] = useState<Character[]>(DEFAULT_CHARACTERS);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(DEFAULT_CHARACTERS[0]);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sceneContext, setSceneContext] = useState("");
  const [activeTab, setActiveTab] = useState<'dialogue' | 'characters' | 'settings'>('dialogue');
  const [isEditingCharacter, setIsEditingCharacter] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

  const { data: brainMemories } = useQuery({
    queryKey: ['/api/author-brain/memories', brainProjectId],
    enabled: !!brainProjectId,
  });

  const characterMemories = useMemo(() => {
    if (!brainMemories) return [];
    return (brainMemories as any[]).filter(m => m.contentType === 'character');
  }, [brainMemories]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateResponse = useMutation({
    mutationFn: async (userMessage: string) => {
      if (!selectedCharacter) throw new Error("No character selected");

      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.role === 'character' ? `[${m.characterName}]: ${m.content}` : m.content,
      }));

      const systemPrompt = `You are ${selectedCharacter.name}, a ${selectedCharacter.role} in a story.

CHARACTER PROFILE:
- Age: ${selectedCharacter.age || 'Unknown'}
- Personality: ${selectedCharacter.personality}
- Backstory: ${selectedCharacter.backstory}
- Speech Pattern: ${selectedCharacter.speechPattern}
- Vocabulary they often use: ${selectedCharacter.vocabulary.join(', ')}
- Quirks: ${selectedCharacter.quirks.join(', ')}
- Current emotional state: ${selectedCharacter.emotionalState}
- Goals: ${selectedCharacter.goals}
- Relationships: ${selectedCharacter.relationships}
- Voice Tone: ${selectedCharacter.voiceTone}

${sceneContext ? `CURRENT SCENE: ${sceneContext}` : ''}

INSTRUCTIONS:
- Respond AS this character, staying true to their voice and personality
- Use their typical vocabulary and speech patterns
- Show their emotional state through word choice and tone
- Keep responses conversational and natural
- Include character quirks where appropriate
- Respond in first person as the character
- Keep responses under 100 words unless the scene demands more`;

      const response = await apiRequest('POST', '/api/book-studio/chat', {
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: userMessage },
        ],
        character: selectedCharacter.name,
      });

      const data = await response.json();
      return data.response || data.content || "...";
    },
    onSuccess: (response) => {
      if (selectedCharacter) {
        const characterMessage: DialogueMessage = {
          id: `msg-${Date.now()}`,
          role: 'character',
          characterId: selectedCharacter.id,
          characterName: selectedCharacter.name,
          content: response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, characterMessage]);
      }
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
      toast({ title: "Failed to generate response", variant: "destructive" });
    },
  });

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !selectedCharacter) return;

    const userMessage: DialogueMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsGenerating(true);

    generateResponse.mutate(inputMessage);
  }, [inputMessage, selectedCharacter, generateResponse]);

  const handleAddNarration = useCallback(() => {
    const narration: DialogueMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage || '[Describe the scene or action...]',
      timestamp: new Date(),
      isNarration: true,
    };
    setMessages(prev => [...prev, narration]);
    setInputMessage("");
  }, [inputMessage]);

  const exportDialogue = useCallback(() => {
    const formatted = messages.map(m => {
      if (m.isNarration) {
        return `*${m.content}*`;
      }
      if (m.role === 'character') {
        return `**${m.characterName}:** "${m.content}"`;
      }
      return `**You:** ${m.content}`;
    }).join('\n\n');

    onInsertDialogue?.(formatted);
    toast({ title: "Dialogue exported to manuscript" });
  }, [messages, onInsertDialogue, toast]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    toast({ title: "Conversation cleared" });
  }, [toast]);

  const saveCharacter = useCallback(() => {
    if (!editingCharacter) return;
    
    setCharacters(prev => {
      const exists = prev.find(c => c.id === editingCharacter.id);
      if (exists) {
        return prev.map(c => c.id === editingCharacter.id ? editingCharacter : c);
      }
      return [...prev, editingCharacter];
    });
    
    setIsEditingCharacter(false);
    setEditingCharacter(null);
    toast({ title: "Character saved" });
  }, [editingCharacter, toast]);

  const createNewCharacter = useCallback(() => {
    const newChar: Character = {
      id: `char-${Date.now()}`,
      name: 'New Character',
      role: 'Supporting',
      personality: '',
      backstory: '',
      speechPattern: '',
      vocabulary: [],
      quirks: [],
      emotionalState: 'neutral',
      goals: '',
      relationships: '',
      voiceTone: 'casual',
    };
    setEditingCharacter(newChar);
    setIsEditingCharacter(true);
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[600px] sm:max-w-[600px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Deep Dialogue Engine
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-2 justify-start">
            <TabsTrigger value="dialogue" className="gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              Dialogue
            </TabsTrigger>
            <TabsTrigger value="characters" className="gap-1">
              <Users className="w-3.5 h-3.5" />
              Characters
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1">
              <Settings className="w-3.5 h-3.5" />
              Scene
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dialogue" className="flex-1 m-0 flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Speaking with:</span>
                <Select
                  value={selectedCharacter?.id || ''}
                  onValueChange={(v) => setSelectedCharacter(characters.find(c => c.id === v) || null)}
                >
                  <SelectTrigger className="h-7 w-[180px] text-xs">
                    <SelectValue placeholder="Select character" />
                  </SelectTrigger>
                  <SelectContent>
                    {characters.map(char => (
                      <SelectItem key={char.id} value={char.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-[8px]">{getInitials(char.name)}</AvatarFallback>
                          </Avatar>
                          <span>{char.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedCharacter && (
                  <Badge variant="outline" className="text-[9px]">
                    {selectedCharacter.voiceTone}
                  </Badge>
                )}
              </div>
            </div>

            <ScrollArea ref={scrollRef} className="flex-1 px-4">
              <div className="py-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <h3 className="font-medium mb-2">Start a Dialogue</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Select a character and start a conversation. The AI will respond in their unique voice and personality.
                    </p>
                  </div>
                )}
                
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      msg.role === 'user' && !msg.isNarration && "justify-end"
                    )}
                  >
                    {msg.isNarration ? (
                      <div className="w-full text-center">
                        <p className="text-sm italic text-muted-foreground bg-muted/30 rounded px-4 py-2">
                          {msg.content}
                        </p>
                      </div>
                    ) : msg.role === 'character' ? (
                      <>
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(msg.characterName || 'C')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 max-w-[80%]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">{msg.characterName}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {msg.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <Card className="bg-muted/30">
                            <CardContent className="p-3">
                              <p className="text-sm">{msg.content}</p>
                            </CardContent>
                          </Card>
                          <div className="flex items-center gap-1 mt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-1"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.content);
                                toast({ title: "Copied" });
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="max-w-[80%]">
                        <Card className="bg-primary text-primary-foreground">
                          <CardContent className="p-3">
                            <p className="text-sm">{msg.content}</p>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                ))}
                
                {isGenerating && (
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </AvatarFallback>
                    </Avatar>
                    <Card className="bg-muted/30">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            {selectedCharacter?.name} is thinking...
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t space-y-2">
              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Say something to ${selectedCharacter?.name || 'the character'}...`}
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7"
                    onClick={handleAddNarration}
                  >
                    <Quote className="w-3.5 h-3.5 mr-1" />
                    Add Narration
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7"
                    onClick={clearConversation}
                    disabled={messages.length === 0}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7"
                    onClick={exportDialogue}
                    disabled={messages.length === 0}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Export
                  </Button>
                  <Button
                    size="sm"
                    className="h-7"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || !selectedCharacter || isGenerating}
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="characters" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={createNewCharacter}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Character
                </Button>
                
                {characters.map(char => (
                  <Card
                    key={char.id}
                    className={cn(
                      "cursor-pointer hover:shadow-sm",
                      selectedCharacter?.id === char.id && "ring-1 ring-primary"
                    )}
                    onClick={() => setSelectedCharacter(char)}
                  >
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">{getInitials(char.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{char.name}</p>
                            <p className="text-[10px] text-muted-foreground font-normal">{char.role}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCharacter(char);
                            setIsEditingCharacter(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-xs text-muted-foreground line-clamp-2">{char.personality}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Badge variant="outline" className="text-[8px]">{char.voiceTone}</Badge>
                        {char.quirks.slice(0, 2).map(q => (
                          <Badge key={q} variant="secondary" className="text-[8px]">{q}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {characterMemories.map((memory: any) => (
                  <Card key={memory.id} className="border-dashed">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Brain className="w-4 h-4 text-primary" />
                        <span>{memory.title}</span>
                        <Badge variant="outline" className="text-[8px]">From Brain</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-xs text-muted-foreground line-clamp-2">{memory.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Scene Context</label>
                  <Textarea
                    value={sceneContext}
                    onChange={(e) => setSceneContext(e.target.value)}
                    placeholder="Describe the current scene, setting, or situation..."
                    className="min-h-[100px]"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    This context helps characters respond more appropriately to the scene.
                  </p>
                </div>
                
                {selectedCharacter && (
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm">Current Character Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <span className="ml-2 font-medium">{selectedCharacter.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Speech Pattern:</span>
                        <p className="text-muted-foreground mt-1">{selectedCharacter.speechPattern}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Emotional State:</span>
                        <span className="ml-2">{selectedCharacter.emotionalState}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Goals:</span>
                        <p className="text-muted-foreground mt-1">{selectedCharacter.goals}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {isEditingCharacter && editingCharacter && (
          <Sheet open={isEditingCharacter} onOpenChange={setIsEditingCharacter}>
            <SheetContent className="w-[500px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>
                  {characters.find(c => c.id === editingCharacter.id) ? 'Edit' : 'Create'} Character
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Name</label>
                    <Input
                      value={editingCharacter.name}
                      onChange={(e) => setEditingCharacter({ ...editingCharacter, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Role</label>
                    <Input
                      value={editingCharacter.role}
                      onChange={(e) => setEditingCharacter({ ...editingCharacter, role: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium mb-1 block">Voice Tone</label>
                  <Select
                    value={editingCharacter.voiceTone}
                    onValueChange={(v) => setEditingCharacter({ ...editingCharacter, voiceTone: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICE_TONES.map(tone => (
                        <SelectItem key={tone.value} value={tone.value}>
                          <div>
                            <p className="font-medium">{tone.label}</p>
                            <p className="text-xs text-muted-foreground">{tone.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-xs font-medium mb-1 block">Personality</label>
                  <Textarea
                    value={editingCharacter.personality}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, personality: e.target.value })}
                    placeholder="Describe their personality traits..."
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium mb-1 block">Speech Pattern</label>
                  <Textarea
                    value={editingCharacter.speechPattern}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, speechPattern: e.target.value })}
                    placeholder="How do they speak? What's unique about their dialogue?"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium mb-1 block">Backstory</label>
                  <Textarea
                    value={editingCharacter.backstory}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, backstory: e.target.value })}
                    placeholder="Their history and background..."
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium mb-1 block">Current Emotional State</label>
                  <Input
                    value={editingCharacter.emotionalState}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, emotionalState: e.target.value })}
                    placeholder="e.g., anxious, hopeful, angry"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium mb-1 block">Goals</label>
                  <Textarea
                    value={editingCharacter.goals}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, goals: e.target.value })}
                    placeholder="What do they want to achieve?"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsEditingCharacter(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={saveCharacter}>
                    <Check className="w-4 h-4 mr-2" />
                    Save Character
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </SheetContent>
    </Sheet>
  );
}
