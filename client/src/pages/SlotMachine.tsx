import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, Sparkles, Trophy, Zap, Crown, Flame, Trees, Mountain, 
  Footprints, Eye, Moon, Star, Tent, Axe, Volume2, VolumeX,
  ChevronLeft, Gift, Gem, Diamond
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import sasquatchLogo from "../assets/sasquatch-logo.png";

const SYMBOLS = [
  { icon: "🌲", name: "Forest", value: 2, color: "#22c55e", glow: "0 0 20px #22c55e", isImage: false },
  { icon: "👣", name: "Tracks", value: 3, color: "#d97706", glow: "0 0 20px #d97706", isImage: false },
  { icon: "⛰️", name: "Peak", value: 4, color: "#64748b", glow: "0 0 20px #64748b", isImage: false },
  { icon: "🏕️", name: "Camp", value: 5, color: "#f97316", glow: "0 0 20px #f97316", isImage: false },
  { icon: "🌙", name: "Night", value: 8, color: "#60a5fa", glow: "0 0 20px #60a5fa", isImage: false },
  { icon: "👁️", name: "Spotted", value: 12, color: "#ef4444", glow: "0 0 20px #ef4444", isImage: false },
  { icon: "👑", name: "Crown", value: 20, color: "#fbbf24", glow: "0 0 30px #fbbf24", isImage: false },
  { icon: "7️⃣", name: "LUCKY 7", value: 35, color: "#ec4899", glow: "0 0 40px #ec4899", isImage: false },
  { icon: "💎", name: "DIAMOND", value: 75, color: "#06b6d4", glow: "0 0 50px #06b6d4", isImage: false },
  { icon: "SASQUATCH", name: "BIGFOOT", value: 500, color: "#ff6b35", glow: "0 0 60px #ff6b35, 0 0 100px #ff6b35", isImage: true },
];

const REEL_ITEMS = 20;
const SPIN_DURATION = 2500;

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
}

export default function SlotMachine() {
  const { toast } = useToast();
  const [reelPositions, setReelPositions] = useState([0, 0, 0, 0, 0]);
  const [spinning, setSpinning] = useState(false);
  const [finalSymbols, setFinalSymbols] = useState([0, 1, 2, 3, 4]);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [streak, setStreak] = useState(0);
  const [showJackpot, setShowJackpot] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoSpin, setAutoSpin] = useState(false);
  const [winLines, setWinLines] = useState<number[]>([]);
  const [progressiveJackpot, setProgressiveJackpot] = useState(50000);

  const { data: wallet } = useQuery<{ balance: number }>({
    queryKey: ["/api/credits/balance"],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setProgressiveJackpot(prev => prev + Math.random() * 10);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const createParticles = useCallback((count: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 2,
        size: Math.random() * 8 + 4,
        color,
        life: 1,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => setParticles([]), 2000);
  }, []);

  const spinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/slot-spin", { bet: betAmount, reels: 5 });
      return res.json();
    },
    onSuccess: (data) => {
      setFinalSymbols(data.symbolIndices || [0, 1, 2, 3, 4]);
      setLastWin(data.winnings);
      setWinLines(data.winLines || []);
      
      if (data.winnings > 0) {
        setStreak(s => s + 1);
        createParticles(data.winnings > 100 ? 50 : 20, "#fbbf24");
        
        if (data.isJackpot) {
          setShowJackpot(true);
          createParticles(100, "#ff6b35");
          setTimeout(() => setShowJackpot(false), 5000);
        }
        
        toast({
          title: data.isJackpot ? "🦶 BIGFOOT JACKPOT!" : "💰 Winner!",
          description: `Won ${data.winnings.toLocaleString()} credits!`,
        });
      } else {
        setStreak(0);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Spin Failed",
        description: error.message || "Insufficient credits",
        variant: "destructive",
      });
    },
  });

  const handleSpin = useCallback(() => {
    if (spinning || !wallet || wallet.balance < betAmount) return;
    
    setLastWin(null);
    setWinLines([]);
    setSpinning(true);

    const newPositions = reelPositions.map(() => Math.random() * 360 + 720);
    setReelPositions(newPositions);

    setTimeout(() => {
      setSpinning(false);
      spinMutation.mutate();
    }, SPIN_DURATION);
  }, [spinning, wallet, betAmount, reelPositions, spinMutation]);

  useEffect(() => {
    if (autoSpin && !spinning && wallet && wallet.balance >= betAmount) {
      const timer = setTimeout(handleSpin, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoSpin, spinning, wallet, betAmount, handleSpin]);

  const Reel = ({ index, position }: { index: number; position: number }) => {
    const symbolIndex = spinning ? Math.floor(Math.random() * SYMBOLS.length) : finalSymbols[index];
    const symbol = SYMBOLS[symbolIndex] || SYMBOLS[0];
    const isWinning = !spinning && lastWin && lastWin > 0 && winLines.includes(index);

    return (
      <div className="relative">
        <div 
          className={`
            w-20 h-24 md:w-28 md:h-32 rounded-xl flex items-center justify-center
            bg-gradient-to-b from-gray-800 via-gray-900 to-black
            border-2 transition-all duration-300 overflow-hidden
            ${isWinning ? 'border-yellow-400 shadow-[0_0_30px_rgba(251,191,36,0.6)]' : 'border-[#333]'}
          `}
          style={{
            transform: spinning ? `rotateX(${position}deg)` : 'rotateX(0deg)',
            transition: spinning ? `transform ${SPIN_DURATION}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)` : 'none',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30" />
          
          {symbol.isImage ? (
            <img 
              src={sasquatchLogo} 
              alt="Bigfoot Jackpot" 
              className={`w-12 h-12 md:w-16 md:h-16 rounded-full ${spinning ? 'blur-sm animate-pulse' : ''}`}
              style={{ 
                filter: isWinning ? `drop-shadow(${symbol.glow})` : 'drop-shadow(0 0 10px #ff6b35)',
                animation: isWinning ? 'pulse 0.5s infinite' : 'none'
              }}
            />
          ) : (
            <span 
              className={`text-4xl md:text-5xl ${spinning ? 'blur-sm animate-pulse' : ''}`}
              style={{ 
                filter: isWinning ? `drop-shadow(${symbol.glow})` : 'none',
                animation: isWinning ? 'pulse 0.5s infinite' : 'none'
              }}
            >
              {symbol.icon}
            </span>
          )}
        </div>
        
        {isWinning && (
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-yellow-400/20 animate-pulse -z-10" />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(139, 69, 255, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(255, 107, 53, 0.1) 0%, transparent 40%), radial-gradient(ellipse at 20% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 40%)'
        }}
      />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: 0.3 + Math.random() * 0.4
            }}
          />
        ))}
      </div>

      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none animate-ping"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
        />
      ))}

      {showJackpot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="text-center animate-bounce">
            <div className="relative">
              <img src={sasquatchLogo} alt="Bigfoot" className="w-40 h-40 mx-auto rounded-full border-4 border-yellow-400 shadow-[0_0_60px_rgba(251,191,36,0.8)]" />
              <Sparkles className="absolute -top-4 -right-4 w-12 h-12 text-yellow-400 animate-spin" />
              <Sparkles className="absolute -bottom-4 -left-4 w-12 h-12 text-[#C9941A] animate-spin" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black mt-6 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent animate-pulse">
              JACKPOT!
            </h1>
            <p className="text-4xl text-white font-bold mt-4">{lastWin?.toLocaleString()} CREDITS</p>
            <p className="text-[#C9941A] mt-2 text-lg">You caught the Bigfoot!</p>
          </div>
        </div>
      )}

      <div className="relative z-10 p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/games">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" data-testid="button-back">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Games
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-gray-400"
            data-testid="button-sound"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={sasquatchLogo} alt="Sasquatch" className="w-14 h-14 rounded-full border-2 border-[#C9941A] shadow-[0_0_20px_rgba(249,115,22,0.5)]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-orange-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
                SASQUATCH SLOTS
              </h1>
              <p className="text-xs text-gray-500">Beat the Stroked Out Sasquatch</p>
            </div>
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30">
            <Gem className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Progressive Jackpot:</span>
            <span className="text-lg font-bold text-purple-200">{Math.floor(progressiveJackpot).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-4 py-2 text-lg font-bold shadow-lg" data-testid="badge-balance">
            <Coins className="w-5 h-5 mr-2" />
            {wallet?.balance?.toLocaleString() ?? 0}
          </Badge>
          {streak >= 2 && (
            <Badge className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-2 animate-pulse" data-testid="badge-streak">
              <Flame className="w-5 h-5 mr-2" />
              {streak}x STREAK
            </Badge>
          )}
        </div>

        <Card className="bg-gradient-to-b from-gray-900/90 via-gray-900/95 to-black border-2 border-orange-600/50 shadow-[0_0_50px_rgba(249,115,22,0.2)] overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-orange-600 via-yellow-400 to-orange-600" />
          
          <div className="absolute top-4 left-4 right-4 flex justify-between text-xs text-gray-500">
            <span>RTP: 96%</span>
            <span>5 REELS</span>
            <span>243 WAYS</span>
          </div>
          
          <CardContent className="p-6 md:p-8 pt-10">
            <div className="relative bg-black/60 rounded-2xl p-6 md:p-8 border border-[#333] mb-6 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-transparent to-orange-900/10" />
              
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-28 border-y-2 border-yellow-500/30 pointer-events-none" />
              
              <div className="relative flex justify-center gap-2 md:gap-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Reel key={i} index={i} position={reelPositions[i]} />
                ))}
              </div>
            </div>

            {lastWin !== null && !spinning && (
              <div className={`text-center p-4 rounded-xl mb-6 transition-all ${
                lastWin > 0 
                  ? "bg-gradient-to-r from-green-900/50 via-emerald-900/50 to-green-900/50 border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]" 
                  : "bg-[#1a1a1a]/50 border border-[#333]"
              }`}>
                {lastWin > 0 ? (
                  <div className="flex items-center justify-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-400 animate-bounce" />
                    <span className="text-3xl font-black text-[#C9941A]">
                      +{lastWin.toLocaleString()} CREDITS
                    </span>
                    <Trophy className="w-8 h-8 text-yellow-400 animate-bounce" />
                  </div>
                ) : (
                  <p className="text-gray-500">No win this spin... Try again!</p>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              <span className="text-gray-500 font-medium text-sm mr-2">BET:</span>
              {[5, 10, 25, 50, 100, 250].map((amount) => (
                <Button
                  key={amount}
                  variant={betAmount === amount ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBetAmount(amount)}
                  disabled={spinning}
                  className={`min-w-[50px] transition-all ${
                    betAmount === amount 
                      ? "bg-gradient-to-r from-orange-600 to-yellow-600 text-white font-bold border-0 shadow-lg" 
                      : "border-[#333] text-gray-400 hover:border-[#C9941A] hover:text-[#C9941A]"
                  }`}
                  data-testid={`button-bet-${amount}`}
                >
                  {amount}
                </Button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSpin}
                disabled={spinning || !wallet || wallet.balance < betAmount}
                className="flex-1 h-16 md:h-20 text-xl md:text-2xl font-black bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 hover:from-orange-500 hover:via-red-400 hover:to-orange-500 text-white shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] border-0"
                data-testid="button-spin"
              >
                {spinning ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>SPINNING...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Zap className="w-8 h-8" />
                    SPIN ({betAmount})
                    <Zap className="w-8 h-8" />
                  </div>
                )}
              </Button>
              
              <Button
                onClick={() => setAutoSpin(!autoSpin)}
                variant={autoSpin ? "default" : "outline"}
                className={`h-16 md:h-20 px-6 ${autoSpin ? 'bg-[#C9941A] hover:bg-[#C9941A]/80' : 'border-[#333]'}`}
                disabled={!wallet || wallet.balance < betAmount}
                data-testid="button-auto"
              >
                <span className="text-sm font-bold">AUTO</span>
              </Button>
            </div>

            {wallet && wallet.balance < betAmount && (
              <p className="text-center text-red-400 text-sm mt-3">
                Need {betAmount.toLocaleString()} credits to spin
              </p>
            )}
          </CardContent>

          <div className="h-2 bg-gradient-to-r from-orange-600 via-yellow-400 to-orange-600" />
        </Card>

        <Card className="mt-6 bg-[#1a1a1a]/60 border-[#333]">
          <CardContent className="p-4">
            <h3 className="text-center text-[#C9941A] font-bold mb-4 flex items-center justify-center gap-2 uppercase tracking-wider text-sm">
              <Crown className="w-4 h-4" />
              Paytable
              <Crown className="w-4 h-4" />
            </h3>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {SYMBOLS.map((symbol, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col items-center p-2 rounded-lg border transition-colors ${
                    symbol.isImage 
                      ? 'bg-orange-900/30 border-[#C9941A]/50 hover:border-orange-400' 
                      : 'bg-gray-800/50 border-[#333] hover:border-[#C9941A]/50'
                  }`}
                >
                  {symbol.isImage ? (
                    <img src={sasquatchLogo} alt="Bigfoot" className="w-8 h-8 rounded-full" />
                  ) : (
                    <span className="text-2xl">{symbol.icon}</span>
                  )}
                  <span className={`text-[10px] font-bold mt-1 ${symbol.isImage ? 'text-orange-300' : 'text-[#C9941A]'}`}>
                    {symbol.value}x
                  </span>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-600 text-xs mt-4">
              Match 3+ symbols left-to-right for wins • Wild substitutes all except Bigfoot
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
