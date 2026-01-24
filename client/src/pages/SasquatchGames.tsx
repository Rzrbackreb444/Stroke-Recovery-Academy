import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, Trophy, Zap, Eye, Music, BookOpen, 
  Video, GraduationCap, Gamepad2, Gift, Star, 
  Sparkles, Target, Brain, Puzzle, Grid3X3,
  Search, Image
} from "lucide-react";
import sasquatchLogo from "../assets/sasquatch-logo.png";

const GAMES = [
  {
    id: "slots",
    name: "Sasquatch Slots",
    description: "Spin to win credits, free songs, courses, and more!",
    icon: Gamepad2,
    href: "/slots",
    status: "live",
    rtp: "92%",
    prizes: ["Credits", "Free Songs", "Course Access", "Book Templates"],
  },
  {
    id: "staring",
    name: "Staring Contest",
    description: "Out-stare the Sasquatch using your webcam. Don't blink!",
    icon: Eye,
    href: "/staring-contest",
    status: "coming",
    rtp: "90%",
    prizes: ["1.8x Credits", "Image Credits"],
  },
  {
    id: "word-forge",
    name: "Word Forge",
    description: "AI-generated crosswords from your book content",
    icon: Grid3X3,
    href: "/word-forge",
    status: "coming",
    prizes: ["Writing Credits", "AI Tokens"],
  },
  {
    id: "story-search",
    name: "Story Search",
    description: "Word search puzzles with literary terms",
    icon: Search,
    href: "/story-search",
    status: "coming",
    prizes: ["Book Templates", "Publishing Credits"],
  },
  {
    id: "spot-ai",
    name: "Spot the AI",
    description: "Find AI-generated images among real photos",
    icon: Image,
    href: "/spot-ai",
    status: "coming",
    prizes: ["Image Credits", "Stock Photos"],
  },
  {
    id: "creator-quest",
    name: "Creator Quest",
    description: "Digital board game - level up your creator journey",
    icon: Target,
    href: "/creator-quest",
    status: "coming",
    prizes: ["Full Courses", "Premium Access"],
  },
];

const PRIZE_TYPES = [
  { icon: Coins, name: "Credits", color: "text-yellow-400" },
  { icon: Music, name: "Free Songs", color: "text-purple-400" },
  { icon: GraduationCap, name: "Course Access", color: "text-blue-400" },
  { icon: BookOpen, name: "Book Templates", color: "text-green-400" },
  { icon: Video, name: "Video Templates", color: "text-red-400" },
  { icon: Image, name: "Image Credits", color: "text-pink-400" },
];

export default function SasquatchGames() {
  const { data: wallet } = useQuery<{ balance: number }>({
    queryKey: ["/api/credits/balance"],
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-[#1a1a1a] to-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-transparent to-orange-600/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/10 blur-[100px] rounded-full" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-12 text-center">
          <img 
            src={sasquatchLogo} 
            alt="Stroked Out Sasquatch" 
            className="w-32 h-32 mx-auto rounded-full border-4 border-orange-500 shadow-2xl shadow-orange-500/30 mb-6"
          />
          
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-white to-orange-400 mb-4">
            BEAT THE SASQUATCH
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
            The gamified creation studio. Win free songs, courses, templates, and credits 
            while you create. All within the KreAIte ecosystem.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge className="bg-orange-600/20 text-orange-400 border border-orange-500/30 px-4 py-2" data-testid="badge-balance">
              <Coins className="w-4 h-4 mr-2" />
              {wallet?.balance?.toLocaleString() ?? 0} Credits
            </Badge>
            <Badge className="bg-green-600/20 text-green-400 border border-green-500/30 px-4 py-2">
              <Gift className="w-4 h-4 mr-2" />
              Daily Free Spin
            </Badge>
            <Badge className="bg-purple-600/20 text-purple-400 border border-purple-500/30 px-4 py-2">
              <Star className="w-4 h-4 mr-2" />
              Provably Fair
            </Badge>
          </div>
        </div>
      </div>

      {/* Prize Types */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-center text-gray-500 uppercase tracking-wider text-sm mb-6 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          Win Real Prizes
          <Sparkles className="w-4 h-4" />
        </h2>
        
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {PRIZE_TYPES.map((prize) => (
            <div 
              key={prize.name}
              className="flex flex-col items-center p-4 rounded-xl bg-gray-900/50 border border-gray-800"
            >
              <prize.icon className={`w-8 h-8 ${prize.color} mb-2`} />
              <span className="text-xs text-gray-400 text-center">{prize.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Games Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Gamepad2 className="w-6 h-6 text-orange-400" />
          Sasquatch Games
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES.map((game) => (
            <Card 
              key={game.id}
              className={`bg-gray-900/60 border-gray-800 overflow-hidden transition-all hover:border-orange-500/50 ${
                game.status === "live" ? "hover:shadow-lg hover:shadow-orange-500/10" : "opacity-70"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${game.status === "live" ? "bg-orange-600/20" : "bg-gray-800"}`}>
                      <game.icon className={`w-6 h-6 ${game.status === "live" ? "text-orange-400" : "text-gray-500"}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white">{game.name}</CardTitle>
                      {game.rtp && (
                        <span className="text-xs text-gray-500">{game.rtp} RTP</span>
                      )}
                    </div>
                  </div>
                  <Badge 
                    className={game.status === "live" 
                      ? "bg-green-600/20 text-green-400 border-green-500/30" 
                      : "bg-gray-700/50 text-gray-500 border-gray-600"
                    }
                  >
                    {game.status === "live" ? "PLAY NOW" : "COMING SOON"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">{game.description}</p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {game.prizes.map((prize) => (
                    <Badge 
                      key={prize} 
                      variant="outline" 
                      className="text-xs border-gray-700 text-gray-400"
                    >
                      {prize}
                    </Badge>
                  ))}
                </div>

                {game.status === "live" ? (
                  <Link href={game.href}>
                    <Button 
                      className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold"
                      data-testid={`button-play-${game.id}`}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Play Now
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-700 text-gray-500"
                    disabled
                  >
                    Coming Soon
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Card className="bg-gradient-to-r from-orange-900/20 to-gray-900/60 border-orange-500/20">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-3">
              <Brain className="w-6 h-6 text-orange-400" />
              How Beat the Sasquatch Works
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-orange-600/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-black text-orange-400">1</span>
                </div>
                <h3 className="font-bold text-white mb-2">Play Games</h3>
                <p className="text-gray-400 text-sm">
                  Use credits to play slots, puzzles, and challenges. Get a free daily spin!
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-orange-600/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-black text-orange-400">2</span>
                </div>
                <h3 className="font-bold text-white mb-2">Win Prizes</h3>
                <p className="text-gray-400 text-sm">
                  Beat the Sasquatch to win credits, free songs, courses, and premium content.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-orange-600/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-black text-orange-400">3</span>
                </div>
                <h3 className="font-bold text-white mb-2">Create More</h3>
                <p className="text-gray-400 text-sm">
                  Redeem prizes across all 6 studios. No cash outs - only creation value!
                </p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gray-900/60 rounded-xl border border-gray-800 text-center">
              <p className="text-gray-500 text-sm">
                <strong className="text-orange-400">Fair Play Guaranteed:</strong> All games use provably fair algorithms with transparent odds. 
                Credits are redeemable only for platform services - never for cash.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-invert prose-orange max-w-none">
          <h2 className="text-xl font-bold text-white mb-4">The Gamified Creation Studio</h2>
          <p className="text-gray-400">
            KreAIte combines AI-powered content creation with gamification to make the creative process 
            more engaging. Beat the Stroked Out Sasquatch across multiple games to earn rewards that 
            directly enhance your creative output - from AI music generation to professional book publishing.
          </p>
          <p className="text-gray-500 text-sm mt-4">
            Unlike traditional gaming platforms, all prizes are redeemable exclusively within the KreAIte 
            ecosystem. This credit-based reward system encourages creators to explore all 6 studios: 
            Book, Music, Video, Course, Image, and Doctrine Engine.
          </p>
        </div>
      </div>
    </div>
  );
}
