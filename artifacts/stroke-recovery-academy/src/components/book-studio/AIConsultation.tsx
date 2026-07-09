import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Send,
  Sparkles,
  Loader2,
  BookOpen,
  TrendingUp,
  DollarSign,
  Target,
  Users,
  Lightbulb,
  PenTool,
  BarChart3,
  Award,
  Zap,
  Brain,
  FileText,
  Copy,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  consultationType?: string;
}

interface ConsultationType {
  id: string;
  name: string;
  description: string;
  icon: typeof BookOpen;
  prompts: string[];
}

const CONSULTATION_TYPES: ConsultationType[] = [
  {
    id: 'monetization',
    name: 'Monetization Strategy',
    description: 'Revenue streams and pricing',
    icon: DollarSign,
    prompts: [
      'How should I price my ebook vs print?',
      'What are the best revenue streams for authors?',
      'Should I offer bundles or standalone products?',
      'How do I set up passive income from my book?',
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing & Launch',
    description: 'Book promotion strategies',
    icon: TrendingUp,
    prompts: [
      'Create a 30-day book launch plan',
      'What are the best platforms to promote my book?',
      'How do I build an email list for my book?',
      'What social media strategy works for authors?',
    ],
  },
  {
    id: 'publishing',
    name: 'Publishing Options',
    description: 'Traditional vs self-publishing',
    icon: BookOpen,
    prompts: [
      'Should I self-publish or go traditional?',
      'What are the pros and cons of KDP?',
      'How do I find a literary agent?',
      'What formats should I publish in?',
    ],
  },
  {
    id: 'audience',
    name: 'Audience Building',
    description: 'Finding and growing readers',
    icon: Users,
    prompts: [
      'How do I identify my target reader?',
      'What makes a book go viral?',
      'How do I get more book reviews?',
      'Building a reader community',
    ],
  },
  {
    id: 'writing',
    name: 'Writing Craft',
    description: 'Improve your writing',
    icon: PenTool,
    prompts: [
      'How do I overcome writer\'s block?',
      'Tips for writing compelling dialogue',
      'How to structure a non-fiction book',
      'Creating memorable characters',
    ],
  },
  {
    id: 'doctrine',
    name: 'Doctrine & Consistency',
    description: 'Maintain story consistency',
    icon: Brain,
    prompts: [
      'Check my worldbuilding for contradictions',
      'Review my character arcs for consistency',
      'Analyze my plot for timeline issues',
      'Validate my magic system rules',
    ],
  },
];

interface AIConsultationProps {
  bookTitle?: string;
  genre?: string;
  chapterContent?: string;
  onInsertSuggestion?: (text: string) => void;
}

export default function AIConsultation({ bookTitle, genre, chapterContent, onInsertSuggestion }: AIConsultationProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedType, setSelectedType] = useState<string>('monetization');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || message;
    if (!messageToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
      consultationType: selectedType,
    };

    setMessages([...messages, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const consultationType = CONSULTATION_TYPES.find(t => t.id === selectedType);
      
      const response = await fetch('/api/ai/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          consultationType: selectedType,
          bookTitle: bookTitle || '',
          genre: genre || '',
          context: chapterContent?.slice(0, 2000) || '',
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      if (data.response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          consultationType: selectedType,
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const fallbackResponse = generateFallbackResponse(messageToSend, selectedType);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fallbackResponse,
          timestamp: new Date(),
          consultationType: selectedType,
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      const fallbackResponse = generateFallbackResponse(messageToSend, selectedType);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
        consultationType: selectedType,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackResponse = (query: string, type: string): string => {
    const responses: Record<string, string> = {
      monetization: `Great question about monetization! Here are some key strategies for "${bookTitle || 'your book'}":\n\n**Pricing Strategy:**\n- Ebook: $2.99-$9.99 (sweet spot is $4.99)\n- Paperback: $12.99-$19.99\n- Hardcover: $24.99-$34.99\n\n**Revenue Streams:**\n1. Direct book sales (Amazon, your website)\n2. Audiobook versions (ACX/Audible)\n3. Course/workbook companions\n4. Speaking engagements\n5. Coaching/consulting\n\n**Action Items:**\n- Set up pre-orders 3 months before launch\n- Create a tiered pricing strategy\n- Consider a launch discount (20-30% off)`,
      
      marketing: `Here's a marketing framework for your book:\n\n**Pre-Launch (3 months out):**\n- Build email list with lead magnet\n- Create social media content calendar\n- Reach out to influencers/reviewers\n\n**Launch Week:**\n- Email blast to your list\n- Social media blitz\n- Amazon ads campaign\n- Book giveaways\n\n**Post-Launch:**\n- Maintain weekly content\n- Gather and share reviews\n- Consider podcast tour\n\n**Key Metrics to Track:**\n- Email open rates (aim for 25%+)\n- Social engagement\n- Sales rank on Amazon\n- Review velocity`,
      
      publishing: `Publishing options for "${bookTitle || 'your book'}":\n\n**Self-Publishing (Recommended for most):**\n✅ Higher royalties (35-70%)\n✅ Full creative control\n✅ Faster to market\n❌ Upfront costs\n❌ Marketing responsibility\n\n**Traditional Publishing:**\n✅ Advance payment\n✅ Distribution reach\n✅ Marketing support\n❌ Lower royalties (10-15%)\n❌ Less control\n❌ 1-2 year timeline\n\n**Hybrid Options:**\n- Use KDP for ebook/paperback\n- Lulu or IngramSpark for hardcover\n- Consider audiobook through ACX`,
      
      audience: `Building your reader audience:\n\n**Identify Your Ideal Reader:**\n- Age, interests, reading habits\n- What problems does your book solve?\n- Where do they hang out online?\n\n**Growth Strategies:**\n1. Newsletter with valuable content\n2. Reader magnets (free chapters, bonus content)\n3. Book clubs and communities\n4. Amazon also-boughts optimization\n\n**Review Building:**\n- ARC (Advance Reader Copy) team\n- NetGalley or BookSirens\n- Direct outreach to book bloggers`,
      
      writing: `Writing craft advice:\n\n**Structure:**\n- Hook readers in first 3 pages\n- End chapters on mini-cliffhangers\n- Vary sentence length for rhythm\n\n**Character Development:**\n- Give each character a unique voice\n- Show don't tell emotions\n- Create meaningful flaws\n\n**Dialogue Tips:**\n- Cut small talk\n- Use subtext\n- Show conflict through conversation\n\n**Editing Process:**\n1. Developmental edit (big picture)\n2. Line edit (prose quality)\n3. Copy edit (grammar/consistency)\n4. Proofread (final polish)`,
      
      doctrine: `Doctrine/Consistency Check:\n\n**I'll analyze your content for:**\n- Character trait consistency\n- Timeline accuracy\n- Worldbuilding rules\n- Plot hole detection\n- Magic/technology system logic\n\n**Common Issues Found:**\n1. Character eye color changes\n2. Distance/travel time inconsistencies\n3. Technology anachronisms\n4. Forgotten subplots\n5. Contradictory character motivations\n\nPaste a specific passage or describe the elements you want me to check for consistency.`,
    };
    
    return responses[type] || responses.monetization;
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Response copied to clipboard",
    });
  };

  const clearChat = () => {
    setMessages([]);
    toast({
      title: "Chat cleared",
      description: "Starting fresh conversation",
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI Book Consultant
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Get expert advice on publishing, marketing, and monetization
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 grid grid-cols-2">
          <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
          <TabsTrigger value="topics" className="text-xs">Quick Topics</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0">
          <div className="px-4 pt-4">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger data-testid="select-consultation-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONSULTATION_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      <span>{type.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Ask me anything about your book, publishing, or marketing strategy!
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {CONSULTATION_TYPES.find(t => t.id === selectedType)?.prompts.slice(0, 2).map((prompt, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="text-xs justify-start"
                        onClick={() => sendMessage(prompt)}
                      >
                        <Zap className="w-3 h-3 mr-2 text-primary" />
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className={msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
                        {msg.role === 'user' ? 'U' : 'AI'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <Card className={msg.role === 'user' ? 'bg-primary text-primary-foreground ml-8' : 'mr-8'}>
                        <CardContent className="p-3">
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </CardContent>
                      </Card>
                      {msg.role === 'assistant' && (
                        <div className="flex gap-1 mt-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyMessage(msg.content)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                          {onInsertSuggestion && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onInsertSuggestion(msg.content)}>
                              <FileText className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-secondary">AI</AvatarFallback>
                  </Avatar>
                  <Card className="mr-8">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about publishing, marketing, pricing..."
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={isLoading}
                data-testid="input-consultation-message"
              />
              <Button onClick={() => sendMessage()} disabled={isLoading || !message.trim()} data-testid="button-send-message">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" className="mt-2 w-full text-xs" onClick={clearChat}>
                <RotateCcw className="w-3 h-3 mr-1" />
                Clear conversation
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="topics" className="flex-1 p-4">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {CONSULTATION_TYPES.map((type) => (
                <Card key={type.id} className="hover-elevate cursor-pointer" onClick={() => { setSelectedType(type.id); setActiveTab('chat'); }}>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <type.icon className="w-4 h-4 text-primary" />
                      {type.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-xs text-muted-foreground mb-2">{type.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {type.prompts.slice(0, 2).map((prompt, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {prompt.slice(0, 30)}...
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
