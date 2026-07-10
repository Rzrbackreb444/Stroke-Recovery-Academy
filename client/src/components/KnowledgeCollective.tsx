import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Quote, MessageSquare, ArrowUpRight, Search, Users, Zap, TrendingUp, BookOpen, DollarSign, Film, Crown, Star, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollectiveCategory {
  title: string;
  description: string;
  threads: number;
  lastActive: string;
  growth: string;
  icon: typeof Quote;
}

interface TopStrategist {
  name: string;
  earnings: string;
  rank: number;
  specialty: string;
}

interface KnowledgeCollectiveProps {
  onCategorySelect?: (category: string) => void;
  className?: string;
}

export default function KnowledgeCollective({ onCategorySelect, className }: KnowledgeCollectiveProps) {
  const categories: CollectiveCategory[] = [
    { 
      title: "Doctrine Architecture", 
      description: "Framework design, systematic content structures, institutional methodology",
      threads: 142, 
      lastActive: "2m ago", 
      growth: "+12%",
      icon: BookOpen
    },
    { 
      title: "Revenue Strategies", 
      description: "Monetization tactics, pricing models, marketplace optimization",
      threads: 89, 
      lastActive: "15m ago", 
      growth: "+8%",
      icon: DollarSign
    },
    { 
      title: "Cinematic Scaffolding", 
      description: "Visual storytelling, scene architecture, narrative pacing techniques",
      threads: 64, 
      lastActive: "1h ago", 
      growth: "+15%",
      icon: Film
    },
    { 
      title: "Institutional Assets", 
      description: "Template libraries, workflow automation, production-grade tooling",
      threads: 212, 
      lastActive: "5m ago", 
      growth: "+22%",
      icon: Crown
    }
  ];

  const topStrategists: TopStrategist[] = [
    { name: "Sarah M.", earnings: "$142K", rank: 1, specialty: "Doctrine" },
    { name: "Dr. Lisa K.", earnings: "$89K", rank: 2, specialty: "Courses" },
    { name: "Marcus J.", earnings: "$112K", rank: 3, specialty: "Music" },
    { name: "Emily R.", earnings: "$78K", rank: 4, specialty: "Books" },
    { name: "David L.", earnings: "$65K", rank: 5, specialty: "Video" }
  ];

  const trendingTopics = [
    { topic: "AI-First Publishing Pipeline", posts: 47 },
    { topic: "85% Margin Optimization", posts: 34 },
    { topic: "Cross-Studio Workflows", posts: 28 },
    { topic: "Doctrine Export Templates", posts: 23 }
  ];

  return (
    <div className={cn("p-6 md:p-10 space-y-10 bg-[#FAF8F3] min-h-screen font-sans max-w-7xl mx-auto", className)}>
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b-2 border-[#E2741B]/20 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#E2741B] text-white">
              <Users className="w-5 h-5" />
            </div>
            <Badge className="bg-[#E2741B]/10 text-[#E2741B] border-none text-[9px] uppercase px-3 py-1 font-black tracking-widest">
              Institutional Exchange
            </Badge>
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic text-[#1A1A1A]">
            The Collective
          </h2>
          <p className="text-[11px] uppercase tracking-[0.3em] md:tracking-[0.5em] font-bold opacity-40 mt-3">
            Institutional Peer Exchange & Strategy Archive
          </p>
        </div>
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
          <Input 
            className="w-full bg-white border-2 border-[#E2741B]/10 p-4 pl-12 text-[12px] font-bold uppercase tracking-widest focus:border-[#E2741B] outline-none transition-all shadow-sm rounded-none h-14" 
            placeholder="Search Doctrines..."
            aria-label="Search doctrines"
            data-testid="input-search-doctrines"
          />
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6 lg:gap-10">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Card 
                key={cat.title} 
                className="bg-white border-2 border-[#E2741B]/5 rounded-none shadow-[0_15px_40px_rgba(0,0,0,0.02)] hover:border-[#E2741B]/30 hover:translate-x-1 transition-all cursor-pointer group"
                onClick={() => onCategorySelect?.(cat.title)}
                data-testid={`category-card-${cat.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start md:items-center gap-4 md:gap-6">
                    <div className="p-4 md:p-5 bg-[#FAF8F3] text-[#E2741B] group-hover:bg-[#1A1A1A] group-hover:text-white transition-all shrink-0">
                      <IconComponent className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg md:text-xl font-black uppercase tracking-wider">{cat.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-md">{cat.description}</p>
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] uppercase font-bold tracking-[0.15em] opacity-50">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> {cat.threads} Threads
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {cat.lastActive}
                        </span>
                        <Badge className="bg-[#E2741B]/10 text-green-600 border-none px-2 py-0 text-[8px] font-black">
                          <TrendingUp className="w-2.5 h-2.5 mr-1" />
                          {cat.growth}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all text-[#E2741B] shrink-0 hidden md:block" />
                </CardContent>
              </Card>
            );
          })}

          <div className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-50">Trending Discussions</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] uppercase tracking-widest text-[#E2741B] hover:bg-[#E2741B]/10"
                data-testid="button-view-all-trending"
              >
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {trendingTopics.map((topic) => (
                <Card 
                  key={topic.topic}
                  className="bg-white/50 border border-[#E2741B]/10 rounded-none p-4 hover:bg-white hover:border-[#E2741B]/20 transition-all cursor-pointer group"
                  data-testid={`trending-topic-${topic.topic.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-[#E2741B] rounded-full animate-pulse" />
                      <span className="text-sm font-bold group-hover:text-[#E2741B] transition-colors">{topic.topic}</span>
                    </div>
                    <Badge variant="secondary" className="text-[9px]">{topic.posts} posts</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="bg-[#1A1A1A] text-white border-none rounded-none shadow-2xl p-6 md:p-8 relative overflow-hidden">
            <Zap className="absolute -right-8 -bottom-8 w-32 h-32 md:w-40 md:h-40 opacity-10 text-[#E2741B]" />
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-[12px] uppercase tracking-[0.4em] font-black text-[#E2741B]">Top Strategists</h4>
              <Crown className="w-5 h-5 text-[#E2741B]" />
            </div>
            <div className="space-y-4 relative z-10">
              {topStrategists.map((user) => (
                <div 
                  key={user.name} 
                  className="flex items-center justify-between group cursor-pointer p-2 -mx-2 hover:bg-white/5 transition-all"
                  data-testid={`strategist-${user.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-white/10 flex items-center justify-center font-black text-xs group-hover:bg-[#E2741B] transition-all">
                        {user.name[0]}
                      </div>
                      {user.rank <= 3 && (
                        <div className={cn(
                          "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black",
                          user.rank === 1 ? "bg-[#E2741B] text-white" : 
                          user.rank === 2 ? "bg-gray-400 text-white" : 
                          "bg-amber-700 text-white"
                        )}>
                          {user.rank}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase opacity-70 group-hover:opacity-100 block">{user.name}</span>
                      <span className="text-[9px] opacity-40 uppercase tracking-wider">{user.specialty}</span>
                    </div>
                  </div>
                  <span className="text-[#E2741B] font-mono text-[11px] font-bold">{user.earnings}</span>
                </div>
              ))}
            </div>
            <Button 
              className="w-full mt-6 bg-[#E2741B] hover:bg-[#E2741B]/80 text-white rounded-none text-[10px] uppercase tracking-widest font-black"
              data-testid="button-view-leaderboard"
            >
              <Star className="w-3.5 h-3.5 mr-2" />
              Full Leaderboard
            </Button>
          </Card>

          <Card className="bg-gradient-to-br from-[#E2741B]/10 to-[#E2741B]/5 border-2 border-[#E2741B]/20 rounded-none p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-[#E2741B] text-white flex items-center justify-center">
                <Quote className="w-8 h-8" />
              </div>
              <h4 className="font-black uppercase tracking-wider">Share Your Doctrine</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Contribute to the collective intelligence. Share frameworks, strategies, and institutional knowledge.
              </p>
              <Button 
                className="w-full bg-[#1A1A1A] hover:bg-[#1A1A1A]/80 text-white rounded-none text-[10px] uppercase tracking-widest font-black"
                data-testid="button-create-doctrine"
              >
                Create New Thread
              </Button>
            </div>
          </Card>

          <div className="p-4 border-2 border-dashed border-[#E2741B]/20 bg-[#FAF8F3]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#E2741B]/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#E2741B]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider opacity-60">This Week's Stats</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-black text-[#E2741B]">2,847</div>
                <div className="text-[9px] uppercase tracking-widest opacity-40">New Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-[#1A1A1A]">156</div>
                <div className="text-[9px] uppercase tracking-widest opacity-40">Active Authors</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
