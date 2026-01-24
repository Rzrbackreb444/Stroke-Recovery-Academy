import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, Zap, Music, BookOpen, 
  Video, GraduationCap, Gamepad2, Gift,
  Sparkles, Image, CircleDot, Spade, Crown, TreePine,
  Target, Ticket, Grid3X3, Star, ChevronRight
} from "lucide-react";
import sasquatchLogo from "../assets/sasquatch-logo.png";

const GAMES = [
  {
    id: "slots",
    name: "Sasquatch Slots",
    description: "5-reel premium Vegas-style slots with progressive jackpot",
    icon: Gamepad2,
    href: "/slots",
    status: "live",
    gradient: "from-orange-500 via-red-500 to-pink-600",
    bgImage: "radial-gradient(ellipse at 30% 30%, rgba(249, 115, 22, 0.3) 0%, transparent 50%)",
    prizes: ["100,000 Jackpot", "Free Spins"],
    hot: true,
  },
  {
    id: "powerball",
    name: "Sasquatch Powerball",
    description: "Pick your numbers, watch the balls drop - match 5 + Red Ball to win!",
    icon: Target,
    href: "/powerball",
    status: "live",
    gradient: "from-red-600 via-red-500 to-yellow-500",
    bgImage: "radial-gradient(ellipse at 70% 30%, rgba(239, 68, 68, 0.3) 0%, transparent 50%)",
    prizes: ["1M Jackpot", "Instant Win"],
    hot: true,
  },
  {
    id: "scratchoff",
    name: "Scratch-Offs",
    description: "Silver, Gold, Platinum & Sasquatch Special scratch cards",
    icon: Ticket,
    href: "/scratch-off",
    status: "live",
    gradient: "from-purple-500 via-pink-500 to-yellow-400",
    bgImage: "radial-gradient(ellipse at 50% 70%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)",
    prizes: ["50,000 Max", "Instant Reveal"],
    new: true,
  },
  {
    id: "bingo",
    name: "Sasquatch Bingo",
    description: "Classic bingo with Line, Corners, X-Pattern & Blackout wins",
    icon: Grid3X3,
    href: "/bingo",
    status: "live",
    gradient: "from-blue-500 via-purple-500 to-pink-500",
    bgImage: "radial-gradient(ellipse at 30% 70%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
    prizes: ["25x Blackout", "Auto-Daub"],
    new: true,
  },
  {
    id: "blackjack",
    name: "Bigfoot Blackjack",
    description: "Classic 21 with professional dealer AI and side bets",
    icon: Spade,
    href: "/blackjack",
    status: "live",
    gradient: "from-emerald-600 to-green-700",
    bgImage: "radial-gradient(ellipse at 70% 50%, rgba(16, 185, 129, 0.2) 0%, transparent 50%)",
    prizes: ["3:2 Blackjack", "Insurance"],
  },
  {
    id: "roulette",
    name: "Sasquatch Roulette",
    description: "European-style single-zero wheel with inside & outside bets",
    icon: CircleDot,
    href: "/roulette",
    status: "live",
    gradient: "from-green-600 to-teal-600",
    bgImage: "radial-gradient(ellipse at 50% 30%, rgba(20, 184, 166, 0.2) 0%, transparent 50%)",
    prizes: ["35:1 Straight", "Even Money"],
  },
  {
    id: "holdem",
    name: "Cryptid Hold'em",
    description: "Texas Hold'em poker vs intelligent AI opponents",
    icon: Crown,
    href: "/texas-holdem",
    status: "live",
    gradient: "from-amber-500 to-orange-600",
    bgImage: "radial-gradient(ellipse at 30% 50%, rgba(245, 158, 11, 0.2) 0%, transparent 50%)",
    prizes: ["Tournament Mode", "All-In"],
  },
  {
    id: "survival",
    name: "Outlast the Sasquatch",
    description: "7-day wilderness survival challenge - manage resources, evade the beast",
    icon: TreePine,
    href: "/wilderness-survival",
    status: "live",
    gradient: "from-green-700 to-emerald-600",
    bgImage: "radial-gradient(ellipse at 70% 70%, rgba(34, 197, 94, 0.2) 0%, transparent 50%)",
    prizes: ["5x Survival", "Daily Bonus"],
  },
];

const PRIZE_TYPES = [
  { icon: Coins, name: "Credits", color: "text-yellow-400", desc: "Use in all studios" },
  { icon: Music, name: "Music", color: "text-purple-400", desc: "Free song generations" },
  { icon: BookOpen, name: "Templates", color: "text-green-400", desc: "Premium book templates" },
  { icon: Image, name: "Images", color: "text-pink-400", desc: "AI image credits" },
];

export default function SasquatchGames() {
  const { data: wallet } = useQuery<{ balance: number }>({
    queryKey: ["/api/credits/balance"],
  });

  return (
    <div className="min-h-screen bg-[#050508] relative overflow-hidden">
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(249, 115, 22, 0.12) 0%, transparent 40%),
            radial-gradient(ellipse at 80% 30%, rgba(239, 68, 68, 0.08) 0%, transparent 35%),
            radial-gradient(ellipse at 50% 80%, rgba(168, 85, 247, 0.08) 0%, transparent 40%)
          `
        }}
      />
      
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500" />
      
      <div className="relative max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-gray-400 hover:text-white" data-testid="button-back">
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" className="border-yellow-500/30 text-yellow-400" data-testid="button-free-play">
              <Zap className="w-4 h-4 mr-2" />
              Free Play Mode
            </Button>
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-black text-white">{wallet?.balance?.toLocaleString() ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 blur-3xl bg-orange-500/30 rounded-full" />
            <img 
              src={sasquatchLogo} 
              alt="Sasquatch" 
              className="relative w-32 h-32 rounded-full border-4 border-orange-500 shadow-2xl shadow-orange-500/30"
            />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1.5 text-sm font-bold shadow-lg animate-pulse">
                <Gift className="w-4 h-4 mr-1.5" />
                DAILY BONUS READY
              </Badge>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-orange-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
              BEAT THE SASQUATCH
            </span>
          </h1>
          
          <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-8">
            Premium casino games with real rewards. Win credits to power all 6 creative studios.
            <span className="text-orange-400 font-semibold"> No cash payouts - credits only.</span>
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {PRIZE_TYPES.map((prize) => (
              <div key={prize.name} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/80 border border-gray-800">
                <prize.icon className={`w-4 h-4 ${prize.color}`} />
                <span className="text-white font-medium text-sm">{prize.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-12">
          {GAMES.map((game) => (
            <Link key={game.id} href={game.href}>
              <Card 
                className={`group relative bg-gray-900/60 backdrop-blur border-gray-800 overflow-hidden cursor-pointer transition-all duration-300 hover:border-orange-500/60 hover:shadow-2xl hover:shadow-orange-500/10 hover:scale-[1.02] h-full`}
                data-testid={`game-card-${game.id}`}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: game.bgImage }}
                />
                
                <div className={`h-1.5 bg-gradient-to-r ${game.gradient}`} />
                
                <CardContent className="relative p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${game.gradient} shadow-lg group-hover:scale-110 transition-transform`}>
                      <game.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex gap-1.5">
                      {game.hot && (
                        <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 animate-pulse">
                          HOT
                        </Badge>
                      )}
                      {game.new && (
                        <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">
                          NEW
                        </Badge>
                      )}
                      {game.status === "live" && !game.hot && !game.new && (
                        <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">
                          LIVE
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-orange-300 transition-colors">
                    {game.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {game.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {game.prizes.map((prize, i) => (
                      <Badge key={i} variant="outline" className="border-gray-700 text-gray-400 text-xs">
                        {prize}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="bg-gradient-to-r from-orange-600/10 via-red-600/10 to-yellow-600/10 border-orange-500/20">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Star className="w-8 h-8 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">How It Works</h2>
              <Star className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-gray-400 max-w-3xl mx-auto mb-6">
              All games use platform credits - <span className="text-orange-400 font-semibold">no real money gambling</span>. 
              Credits you win can be used across all 6 KreAIte studios: Book, Music, Video, Course, Image, and Doctrine Engine.
              Operated by Stroke Lyfe Inc (501c3) for charitable entertainment.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="bg-green-500/20 text-green-400 border-0 px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                Free Play Available
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-400 border-0 px-4 py-2">
                <Gift className="w-4 h-4 mr-2" />
                Daily Bonuses
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-400 border-0 px-4 py-2">
                <Zap className="w-4 h-4 mr-2" />
                Instant Rewards
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
