import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Sparkles, Trophy, Zap, Crown, Flame, Trees, Mountain, Footprints, Eye, Moon, Star, Tent, Axe } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import sasquatchLogo from "@assets/sasquatch-logo.png";

// Sasquatch-themed symbols - Beat the Stroked Out Sasquatch!
const SYMBOLS = [
  { icon: Trees, name: "Forest", value: 2, color: "text-green-500", bg: "bg-green-900/30" },
  { icon: Footprints, name: "Tracks", value: 3, color: "text-amber-600", bg: "bg-amber-900/30" },
  { icon: Mountain, name: "Mountain", value: 4, color: "text-slate-400", bg: "bg-slate-800/50" },
  { icon: Tent, name: "Camp", value: 5, color: "text-orange-400", bg: "bg-orange-900/30" },
  { icon: Moon, name: "Night", value: 8, color: "text-blue-300", bg: "bg-blue-900/30" },
  { icon: Eye, name: "Spotted", value: 10, color: "text-red-400", bg: "bg-red-900/30" },
  { icon: Crown, name: "Legend", value: 15, color: "text-yellow-400", bg: "bg-yellow-900/30" },
  { icon: Axe, name: "SASQUATCH", value: 50, color: "text-orange-500", bg: "bg-orange-800/40" },
];

export default function SlotMachine() {
  const { toast } = useToast();
  const [spinning, setSpinning] = useState([false, false, false]);
  const [finalSymbols, setFinalSymbols] = useState([0, 1, 2]);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [multiplier, setMultiplier] = useState(1);
  const [streak, setStreak] = useState(0);
  const [showJackpot, setShowJackpot] = useState(false);
  const [totalSpins, setTotalSpins] = useState(0);

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
      setTotalSpins(s => s + 1);
      
      if (data.winnings > 0) {
        setStreak(s => s + 1);
        if (data.isJackpot) {
          setShowJackpot(true);
          setTimeout(() => setShowJackpot(false), 4000);
        }
        toast({
          title: data.isJackpot ? "SASQUATCH JACKPOT!" : "You beat the Sasquatch!",
          description: `Won ${data.winnings} credits!`,
        });
      } else {
        setStreak(0);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
    },
    onError: (error: any) => {
      toast({
        title: "The Sasquatch blocked your spin",
        description: error.message || "Insufficient credits",
        variant: "destructive",
      });
      setSpinning([false, false, false]);
    },
  });

  const handleSpin = () => {
    if (spinning.some(s => s) || !wallet || wallet.balance < betAmount * multiplier) return;
    
    setLastWin(null);
    setSpinning([true, true, true]);

    setTimeout(() => setSpinning([false, true, true]), 600);
    setTimeout(() => setSpinning([false, false, true]), 1000);
    setTimeout(() => {
      setSpinning([false, false, false]);
      spinMutation.mutate();
    }, 1400);
  };

  const ReelSymbol = ({ symbolIndex, isSpinning, reelIndex }: { symbolIndex: number; isSpinning: boolean; reelIndex: number }) => {
    const [displayIndex, setDisplayIndex] = useState(symbolIndex);
    
    useEffect(() => {
      if (isSpinning) {
        const interval = setInterval(() => {
          setDisplayIndex(Math.floor(Math.random() * SYMBOLS.length));
        }, 60);
        return () => clearInterval(interval);
      } else {
        setDisplayIndex(finalSymbols[reelIndex]);
      }
    }, [isSpinning, reelIndex]);

    const symbol = SYMBOLS[displayIndex] || SYMBOLS[0];
    const Icon = symbol.icon;

    return (
      <div className={`relative w-24 h-24 md:w-32 md:h-32 rounded-xl flex flex-col items-center justify-center transition-all duration-200 ${symbol.bg} border-2 ${
        lastWin && lastWin > 0 && !isSpinning 
          ? "border-orange-500 shadow-lg shadow-orange-500/40 animate-pulse" 
          : "border-gray-700"
      }`}>
        <Icon className={`w-10 h-10 md:w-14 md:h-14 ${symbol.color} ${isSpinning ? "blur-sm animate-spin" : ""} drop-shadow-lg`} />
        <span className={`text-[10px] md:text-xs mt-1 font-bold text-gray-300 uppercase tracking-wider ${isSpinning ? "opacity-0" : "opacity-100"}`}>
          {symbol.name}
        </span>
        {!isSpinning && symbol.value >= 15 && (
          <Star className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-[#1a1a1a] to-black relative overflow-hidden">
      {/* Forest background effect */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-green-900/30 to-transparent" />
      </div>
      
      {/* Orange glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" />
      
      {/* Jackpot overlay */}
      {showJackpot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
          <div className="text-center">
            <img src={sasquatchLogo} alt="Sasquatch" className="w-48 h-48 mx-auto animate-bounce rounded-full" />
            <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-500 to-orange-600 mt-4">
              JACKPOT!
            </h1>
            <p className="text-3xl text-white mt-4 font-bold">{lastWin?.toLocaleString()} CREDITS!</p>
            <p className="text-orange-400 mt-2">You defeated the Stroked Out Sasquatch!</p>
          </div>
        </div>
      )}

      <div className="relative z-10 p-4 md:p-8 max-w-4xl mx-auto">
        {/* Header with Sasquatch */}
        <div className="text-center mb-6">
          <img src={sasquatchLogo} alt="Stroked Out Sasquatch" className="w-24 h-24 mx-auto rounded-full border-4 border-orange-500 shadow-lg shadow-orange-500/30 mb-4" />
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-gray-200 to-orange-400">
            BEAT THE SASQUATCH
          </h1>
          <p className="text-gray-500 mt-1">Stroked Out Sasquatch Slots • 92% RTP • Provably Fair</p>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <Badge className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-2 text-base font-bold" data-testid="badge-balance">
            <Coins className="w-4 h-4 mr-2" />
            {wallet?.balance?.toLocaleString() ?? 0}
          </Badge>
          {streak >= 2 && (
            <Badge className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 text-base animate-pulse" data-testid="badge-streak">
              <Flame className="w-4 h-4 mr-2" />
              {streak}x HOT
            </Badge>
          )}
          {totalSpins > 0 && (
            <Badge variant="outline" className="border-gray-700 text-gray-400 px-3 py-2">
              <Eye className="w-4 h-4 mr-1" />
              {totalSpins} hunts
            </Badge>
          )}
        </div>

        {/* Slot machine */}
        <Card className="bg-gradient-to-b from-gray-900 to-black border-2 border-orange-600/40 shadow-2xl shadow-orange-500/10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600" />
          
          <CardContent className="p-4 md:p-8">
            {/* Reels */}
            <div className="relative bg-black/60 rounded-2xl p-4 md:p-8 border border-gray-800 mb-6">
              <div className="absolute inset-4 bg-gradient-to-r from-orange-600/10 via-yellow-500/10 to-orange-600/10 blur-2xl rounded-xl" />
              
              <div className="relative flex justify-center gap-3 md:gap-6">
                {[0, 1, 2].map((reelIndex) => (
                  <ReelSymbol
                    key={reelIndex}
                    symbolIndex={finalSymbols[reelIndex]}
                    isSpinning={spinning[reelIndex]}
                    reelIndex={reelIndex}
                  />
                ))}
              </div>

              <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent pointer-events-none" />
            </div>

            {/* Result */}
            {lastWin !== null && !spinning.some(s => s) && (
              <div className={`text-center p-4 rounded-xl mb-6 ${
                lastWin > 0 
                  ? "bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/40" 
                  : "bg-gray-900/50 border border-gray-700"
              }`}>
                {lastWin > 0 ? (
                  <div className="flex items-center justify-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-400 animate-bounce" />
                    <span className="text-2xl md:text-3xl font-black text-green-400">
                      +{lastWin.toLocaleString()} CREDITS
                    </span>
                    <Trophy className="w-8 h-8 text-yellow-400 animate-bounce" />
                  </div>
                ) : (
                  <p className="text-gray-500">The Sasquatch wins this round... Try again!</p>
                )}
              </div>
            )}

            {/* Bet controls */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-center gap-3">
                <span className="text-gray-500 font-medium uppercase text-sm">Bet:</span>
                <div className="flex gap-2">
                  {[5, 10, 25, 50, 100].map((amount) => (
                    <Button
                      key={amount}
                      variant={betAmount === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBetAmount(amount)}
                      disabled={spinning.some(s => s)}
                      className={`min-w-[48px] ${
                        betAmount === amount 
                          ? "bg-orange-600 hover:bg-orange-700 text-white font-bold border-0" 
                          : "border-gray-700 text-gray-400 hover:border-orange-500 hover:text-orange-400 bg-transparent"
                      }`}
                      data-testid={`button-bet-${amount}`}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-3">
                <span className="text-gray-500 font-medium uppercase text-sm">Risk:</span>
                <div className="flex gap-2">
                  {[1, 2, 5, 10].map((mult) => (
                    <Button
                      key={mult}
                      variant={multiplier === mult ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMultiplier(mult)}
                      disabled={spinning.some(s => s)}
                      className={`min-w-[48px] ${
                        multiplier === mult 
                          ? "bg-red-700 hover:bg-red-800 text-white font-bold border-0" 
                          : "border-gray-700 text-gray-400 hover:border-red-500 hover:text-red-400 bg-transparent"
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
              className="w-full h-16 md:h-20 mt-6 text-xl md:text-2xl font-black bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 hover:from-orange-500 hover:via-orange-400 hover:to-orange-500 text-white shadow-lg shadow-orange-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] border-0"
              data-testid="button-spin"
            >
              {spinning.some(s => s) ? (
                <div className="flex items-center gap-3">
                  <Footprints className="w-8 h-8 animate-bounce" />
                  <span className="animate-pulse">HUNTING...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8" />
                  HUNT ({(betAmount * multiplier).toLocaleString()})
                  <Zap className="w-8 h-8" />
                </div>
              )}
            </Button>

            {wallet && wallet.balance < betAmount * multiplier && (
              <p className="text-center text-red-400 text-sm mt-3">
                Need {(betAmount * multiplier).toLocaleString()} credits to hunt
              </p>
            )}
          </CardContent>

          <div className="h-1 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600" />
        </Card>

        {/* Paytable */}
        <Card className="mt-6 bg-gray-900/60 border-gray-800">
          <CardContent className="p-4">
            <h3 className="text-center text-orange-400 font-bold mb-4 flex items-center justify-center gap-2 uppercase tracking-wider text-sm">
              <Eye className="w-4 h-4" />
              Sasquatch Paytable
              <Eye className="w-4 h-4" />
            </h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {SYMBOLS.map((symbol, i) => {
                const Icon = symbol.icon;
                return (
                  <div key={i} className={`flex flex-col items-center p-2 rounded-lg ${symbol.bg} border border-gray-800`}>
                    <Icon className={`w-5 h-5 ${symbol.color}`} />
                    <span className="text-[10px] text-gray-500 mt-1">{symbol.value}x</span>
                  </div>
                );
              })}
            </div>
            <div className="text-center text-gray-600 text-xs mt-4">
              <p>Match 2 = 2× bet • Match 3 = symbol × bet × risk</p>
              <p className="text-gray-500 mt-1">House Edge: 8% • Fair Play Guaranteed</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
