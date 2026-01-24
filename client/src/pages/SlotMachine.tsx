import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Sparkles, Trophy, Zap, Crown, Flame, BookOpen, Music, Video, GraduationCap, Image, Cpu, Rocket, Star } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const SYMBOLS = [
  { icon: BookOpen, name: "Book", value: 3, color: "text-amber-400" },
  { icon: Music, name: "Music", value: 4, color: "text-purple-400" },
  { icon: Video, name: "Video", value: 5, color: "text-red-400" },
  { icon: GraduationCap, name: "Course", value: 6, color: "text-blue-400" },
  { icon: Image, name: "Image", value: 8, color: "text-green-400" },
  { icon: Cpu, name: "AI", value: 10, color: "text-cyan-400" },
  { icon: Crown, name: "Crown", value: 15, color: "text-yellow-400" },
  { icon: Rocket, name: "Jackpot", value: 50, color: "text-pink-400" },
];

const REEL_ITEMS = 20;

export default function SlotMachine() {
  const { toast } = useToast();
  const [reelPositions, setReelPositions] = useState([0, 0, 0]);
  const [spinning, setSpinning] = useState([false, false, false]);
  const [finalSymbols, setFinalSymbols] = useState([0, 0, 0]);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [multiplier, setMultiplier] = useState(1);
  const [streak, setStreak] = useState(0);
  const [showJackpot, setShowJackpot] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: wallet } = useQuery<{ balance: number }>({
    queryKey: ["/api/credits/balance"],
  });

  const spinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/slot-spin", { bet: betAmount * multiplier });
      return res.json();
    },
    onSuccess: (data) => {
      setFinalSymbols(data.symbolIndices);
      setLastWin(data.winnings);
      
      if (data.winnings > 0) {
        setStreak(s => s + 1);
        if (data.isJackpot) {
          setShowJackpot(true);
          setTimeout(() => setShowJackpot(false), 3000);
        }
        toast({
          title: data.isJackpot ? "🚀 JACKPOT!" : "Winner!",
          description: `You won ${data.winnings} credits!`,
        });
      } else {
        setStreak(0);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Spin failed",
        description: error.message || "Not enough credits",
        variant: "destructive",
      });
      setSpinning([false, false, false]);
    },
  });

  const handleSpin = () => {
    if (spinning.some(s => s) || !wallet || wallet.balance < betAmount * multiplier) return;
    
    setLastWin(null);
    setSpinning([true, true, true]);

    // Staggered reel stops for dramatic effect
    setTimeout(() => {
      setSpinning([false, true, true]);
    }, 800);
    
    setTimeout(() => {
      setSpinning([false, false, true]);
    }, 1200);
    
    setTimeout(() => {
      setSpinning([false, false, false]);
      spinMutation.mutate();
    }, 1600);
  };

  const ReelSymbol = ({ symbolIndex, isSpinning, reelIndex }: { symbolIndex: number; isSpinning: boolean; reelIndex: number }) => {
    const [displayIndex, setDisplayIndex] = useState(symbolIndex);
    
    useEffect(() => {
      if (isSpinning) {
        const interval = setInterval(() => {
          setDisplayIndex(Math.floor(Math.random() * SYMBOLS.length));
        }, 80);
        return () => clearInterval(interval);
      } else {
        setDisplayIndex(finalSymbols[reelIndex]);
      }
    }, [isSpinning, reelIndex]);

    const symbol = SYMBOLS[displayIndex] || SYMBOLS[0];
    const Icon = symbol.icon;

    return (
      <div className={`relative w-28 h-28 rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
        isSpinning 
          ? "bg-gradient-to-b from-gray-800 to-gray-900 animate-pulse" 
          : "bg-gradient-to-b from-gray-900 to-black"
      } border-2 ${lastWin && lastWin > 0 && !isSpinning ? "border-[#C9941A] shadow-lg shadow-[#C9941A]/50" : "border-gray-700"}`}>
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-t from-transparent via-transparent to-white/5`} />
        <Icon className={`w-14 h-14 ${symbol.color} ${isSpinning ? "blur-sm" : ""} drop-shadow-lg`} />
        <span className={`text-xs mt-1 font-bold ${symbol.color} ${isSpinning ? "opacity-0" : "opacity-100"}`}>
          {symbol.name}
        </span>
        {!isSpinning && symbol.value >= 15 && (
          <Sparkles className="absolute top-1 right-1 w-4 h-4 text-yellow-400 animate-pulse" />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-[#C9941A]/10" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#C9941A]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      
      {/* Jackpot overlay */}
      {showJackpot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-pulse">
          <div className="text-center">
            <Rocket className="w-32 h-32 mx-auto text-pink-400 animate-bounce" />
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 animate-pulse">
              JACKPOT!
            </h1>
            <p className="text-3xl text-white mt-4">{lastWin} CREDITS!</p>
          </div>
        </div>
      )}

      <div className="relative z-10 p-4 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#C9941A] via-yellow-300 to-[#C9941A] flex items-center justify-center gap-3">
            <Flame className="w-10 h-10 text-orange-500 animate-pulse" />
            KREATOR SLOTS
            <Flame className="w-10 h-10 text-orange-500 animate-pulse" />
          </h1>
          <p className="text-gray-400 mt-2">Spin to win credits for your creative projects</p>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <Badge className="bg-gradient-to-r from-[#C9941A] to-amber-600 text-black px-4 py-2 text-lg" data-testid="badge-balance">
            <Coins className="w-5 h-5 mr-2" />
            {wallet?.balance?.toLocaleString() ?? 0}
          </Badge>
          {streak > 0 && (
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 text-lg animate-pulse" data-testid="badge-streak">
              <Flame className="w-5 h-5 mr-2" />
              {streak} Streak!
            </Badge>
          )}
        </div>

        {/* Main slot machine */}
        <Card className="bg-gradient-to-b from-gray-900 via-gray-900 to-black border-2 border-[#C9941A]/50 shadow-2xl shadow-[#C9941A]/20 overflow-hidden">
          {/* Top decoration */}
          <div className="h-2 bg-gradient-to-r from-transparent via-[#C9941A] to-transparent" />
          
          <CardContent className="p-6 md:p-8">
            {/* Reels container */}
            <div className="relative bg-black/50 rounded-2xl p-6 md:p-8 border border-gray-800 mb-6">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl" />
              
              {/* Glow effect behind reels */}
              <div className="absolute inset-4 bg-gradient-to-r from-purple-500/20 via-[#C9941A]/20 to-cyan-500/20 blur-xl rounded-xl" />
              
              <div className="relative flex justify-center gap-4 md:gap-6">
                {[0, 1, 2].map((reelIndex) => (
                  <ReelSymbol
                    key={reelIndex}
                    symbolIndex={finalSymbols[reelIndex]}
                    isSpinning={spinning[reelIndex]}
                    reelIndex={reelIndex}
                  />
                ))}
              </div>

              {/* Win line indicator */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#C9941A]/50 to-transparent pointer-events-none" />
            </div>

            {/* Result display */}
            {lastWin !== null && !spinning.some(s => s) && (
              <div className={`text-center p-4 rounded-xl mb-6 transition-all ${
                lastWin > 0 
                  ? "bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/50" 
                  : "bg-gradient-to-r from-red-900/30 to-rose-900/30 border border-red-500/30"
              }`}>
                {lastWin > 0 ? (
                  <div className="flex items-center justify-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                    <span className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-green-400">
                      +{lastWin.toLocaleString()} CREDITS
                    </span>
                    <Trophy className="w-8 h-8 text-yellow-400" />
                  </div>
                ) : (
                  <p className="text-gray-400 text-lg">No match - try again!</p>
                )}
              </div>
            )}

            {/* Bet controls */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <span className="text-gray-400 font-medium">BET:</span>
                <div className="flex gap-2">
                  {[5, 10, 25, 50, 100].map((amount) => (
                    <Button
                      key={amount}
                      variant={betAmount === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBetAmount(amount)}
                      disabled={spinning.some(s => s)}
                      className={`min-w-[50px] ${
                        betAmount === amount 
                          ? "bg-[#C9941A] hover:bg-[#b8860b] text-black font-bold" 
                          : "border-gray-700 text-gray-400 hover:border-[#C9941A] hover:text-[#C9941A]"
                      }`}
                      data-testid={`button-bet-${amount}`}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <span className="text-gray-400 font-medium">MULTIPLIER:</span>
                <div className="flex gap-2">
                  {[1, 2, 5, 10].map((mult) => (
                    <Button
                      key={mult}
                      variant={multiplier === mult ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMultiplier(mult)}
                      disabled={spinning.some(s => s)}
                      className={`min-w-[50px] ${
                        multiplier === mult 
                          ? "bg-purple-600 hover:bg-purple-700 text-white font-bold" 
                          : "border-gray-700 text-gray-400 hover:border-purple-500 hover:text-purple-400"
                      }`}
                      data-testid={`button-mult-${mult}`}
                    >
                      {mult}x
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Spin button */}
            <Button
              onClick={handleSpin}
              disabled={spinning.some(s => s) || !wallet || wallet.balance < betAmount * multiplier}
              className="w-full h-16 md:h-20 mt-6 text-xl md:text-2xl font-black bg-gradient-to-r from-[#C9941A] via-yellow-500 to-[#C9941A] hover:from-yellow-500 hover:via-[#C9941A] hover:to-yellow-500 text-black shadow-lg shadow-[#C9941A]/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              data-testid="button-spin"
            >
              {spinning.some(s => s) ? (
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8 animate-spin" />
                  SPINNING...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8" />
                  SPIN FOR {(betAmount * multiplier).toLocaleString()} CREDITS
                  <Zap className="w-8 h-8" />
                </div>
              )}
            </Button>
          </CardContent>

          {/* Bottom decoration */}
          <div className="h-2 bg-gradient-to-r from-transparent via-[#C9941A] to-transparent" />
        </Card>

        {/* Paytable */}
        <Card className="mt-6 bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <h3 className="text-center text-[#C9941A] font-bold mb-4 flex items-center justify-center gap-2">
              <Star className="w-5 h-5" />
              PAYTABLE
              <Star className="w-5 h-5" />
            </h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {SYMBOLS.map((symbol, i) => {
                const Icon = symbol.icon;
                return (
                  <div key={i} className="flex flex-col items-center p-2 rounded-lg bg-black/30 border border-gray-800">
                    <Icon className={`w-6 h-6 ${symbol.color}`} />
                    <span className="text-xs text-gray-400 mt-1">{symbol.value}x</span>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-gray-500 text-xs mt-3">
              Match 2 = 2x bet | Match 3 = symbol value × bet × multiplier
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
