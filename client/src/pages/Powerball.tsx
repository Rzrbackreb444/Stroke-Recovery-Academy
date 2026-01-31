import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, ChevronLeft, Trophy, Zap, Sparkles, RefreshCw, Star, Target
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import sasquatchLogo from "../assets/sasquatch-logo.png";

interface GameState {
  playerNumbers: number[];
  powerball: number | null;
  drawnNumbers: number[];
  drawnPowerball: number | null;
  phase: 'picking' | 'drawing' | 'complete';
  matches: number;
  powerballMatch: boolean;
  winAmount: number;
}

const PAYOUTS = [
  { matches: 0, powerball: true, payout: 4, label: "Powerball Only" },
  { matches: 1, powerball: true, payout: 4, label: "1 + PB" },
  { matches: 2, powerball: true, payout: 7, label: "2 + PB" },
  { matches: 3, powerball: false, payout: 7, label: "3 Numbers" },
  { matches: 3, powerball: true, payout: 100, label: "3 + PB" },
  { matches: 4, powerball: false, payout: 100, label: "4 Numbers" },
  { matches: 4, powerball: true, payout: 5000, label: "4 + PB" },
  { matches: 5, powerball: false, payout: 100000, label: "5 Numbers" },
  { matches: 5, powerball: true, payout: 0, label: "JACKPOT", isJackpot: true },
];

export default function Powerball() {
  const { toast } = useToast();
  const [bet, setBet] = useState(2);
  const [freePlay, setFreePlay] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    playerNumbers: [],
    powerball: null,
    drawnNumbers: [],
    drawnPowerball: null,
    phase: 'picking',
    matches: 0,
    powerballMatch: false,
    winAmount: 0,
  });
  const [currentDrawIndex, setCurrentDrawIndex] = useState(-1);
  const [jackpot, setJackpot] = useState(1000000);
  const ballContainerRef = useRef<HTMLDivElement>(null);

  const { data: wallet } = useQuery<{ balance: number }>({
    queryKey: ["/api/credits/balance"],
  });

  const playMutation = useMutation({
    mutationFn: async () => {
      if (freePlay) return { success: true };
      const res = await apiRequest("POST", "/api/games/powerball-play", { 
        bet,
        numbers: gameState.playerNumbers,
        powerball: gameState.powerball 
      });
      return res.json();
    },
    onSuccess: () => {
      if (!freePlay) {
        queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
      }
      startDraw();
    },
    onError: (error: any) => {
      toast({ title: "Failed to play", description: error.message, variant: "destructive" });
    },
  });

  const winMutation = useMutation({
    mutationFn: async (winAmount: number) => {
      if (freePlay) return { winAmount };
      const res = await apiRequest("POST", "/api/games/powerball-win", { 
        bet,
        winAmount 
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (!freePlay) {
        queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
      }
    },
  });

  const selectNumber = (num: number) => {
    if (gameState.phase !== 'picking') return;
    if (gameState.playerNumbers.includes(num)) {
      setGameState(prev => ({
        ...prev,
        playerNumbers: prev.playerNumbers.filter(n => n !== num)
      }));
    } else if (gameState.playerNumbers.length < 5) {
      setGameState(prev => ({
        ...prev,
        playerNumbers: [...prev.playerNumbers, num].sort((a, b) => a - b)
      }));
    }
  };

  const selectPowerball = (num: number) => {
    if (gameState.phase !== 'picking') return;
    setGameState(prev => ({
      ...prev,
      powerball: prev.powerball === num ? null : num
    }));
  };

  const quickPick = () => {
    const numbers: number[] = [];
    const available = Array.from({ length: 69 }, (_, i) => i + 1);
    for (let i = 0; i < 5; i++) {
      const idx = Math.floor(Math.random() * available.length);
      numbers.push(available.splice(idx, 1)[0]);
    }
    const powerball = Math.floor(Math.random() * 26) + 1;
    setGameState(prev => ({
      ...prev,
      playerNumbers: numbers.sort((a, b) => a - b),
      powerball
    }));
  };

  const startDraw = () => {
    const drawnNumbers: number[] = [];
    const available = Array.from({ length: 69 }, (_, i) => i + 1);
    for (let i = 0; i < 5; i++) {
      const idx = Math.floor(Math.random() * available.length);
      drawnNumbers.push(available.splice(idx, 1)[0]);
    }
    const drawnPowerball = Math.floor(Math.random() * 26) + 1;
    
    setGameState(prev => ({
      ...prev,
      drawnNumbers: [],
      drawnPowerball: null,
      phase: 'drawing',
    }));
    setCurrentDrawIndex(0);

    drawnNumbers.forEach((num, idx) => {
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          drawnNumbers: [...prev.drawnNumbers, num]
        }));
        setCurrentDrawIndex(idx + 1);
      }, (idx + 1) * 1000);
    });

    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        drawnPowerball: drawnPowerball
      }));
    }, 6500);

    setTimeout(() => {
      const matches = gameState.playerNumbers.filter(n => drawnNumbers.includes(n)).length;
      const powerballMatch = gameState.powerball === drawnPowerball;
      
      let winAmount = 0;
      const payout = PAYOUTS.find(p => p.matches === matches && p.powerball === powerballMatch);
      if (payout) {
        winAmount = payout.isJackpot ? jackpot : payout.payout * bet;
      }
      
      setGameState(prev => ({
        ...prev,
        drawnNumbers,
        drawnPowerball,
        phase: 'complete',
        matches,
        powerballMatch,
        winAmount
      }));

      if (winAmount > 0) {
        winMutation.mutate(winAmount);
        toast({ 
          title: winAmount >= jackpot ? "JACKPOT!!!" : "Winner!", 
          description: freePlay ? `You would win ${winAmount} credits!` : `Won ${winAmount} credits!` 
        });
      }
    }, 7500);
  };

  const resetGame = () => {
    setGameState({
      playerNumbers: [],
      powerball: null,
      drawnNumbers: [],
      drawnPowerball: null,
      phase: 'picking',
      matches: 0,
      powerballMatch: false,
      winAmount: 0,
    });
    setCurrentDrawIndex(-1);
  };

  const canPlay = gameState.playerNumbers.length === 5 && gameState.powerball !== null;

  return (
    <div className="min-h-screen bg-[#0a0408] relative overflow-hidden">
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(220, 38, 38, 0.2) 0%, transparent 40%),
          radial-gradient(ellipse at 70% 80%, rgba(234, 179, 8, 0.15) 0%, transparent 40%),
          radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 60%)
        `
      }} />
      
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600" />

      <div className="relative z-10 p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/games">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" data-testid="button-back">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Games
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant={freePlay ? "default" : "outline"}
              size="sm"
              onClick={() => setFreePlay(!freePlay)}
              className={freePlay ? "bg-[#C9941A]" : "border-gray-600"}
              data-testid="button-freeplay"
            >
              {freePlay ? "FREE PLAY" : "BET MODE"}
            </Button>
            <Badge className="bg-gradient-to-r from-red-600 to-yellow-600 text-white px-4 py-2 text-lg font-bold" data-testid="badge-balance">
              <Coins className="w-5 h-5 mr-2" />
              {wallet?.balance?.toLocaleString() ?? 0}
            </Badge>
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black">
              <span className="text-white">SASQUATCH</span>
              <span className="bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent ml-2">POWERBALL</span>
            </h1>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-2xl font-black text-yellow-400">
              JACKPOT: {jackpot.toLocaleString()} CREDITS
            </span>
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </div>
        </div>

        {gameState.phase === 'picking' && (
          <>
            <Card className="bg-[#1a1a1a]/80 border-red-600/30 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg">Pick 5 Numbers (1-69)</h3>
                  <Badge className="bg-white/10">{gameState.playerNumbers.length}/5</Badge>
                </div>
                
                <div className="grid grid-cols-10 md:grid-cols-15 gap-1 mb-6">
                  {Array.from({ length: 69 }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      onClick={() => selectNumber(num)}
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full text-sm font-bold transition-all ${
                        gameState.playerNumbers.includes(num)
                          ? 'bg-gradient-to-br from-white to-gray-200 text-black shadow-lg shadow-white/30 scale-110'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                      data-testid={`number-${num}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-red-400 font-bold text-lg">Pick Powerball (1-26)</h3>
                  <Badge className="bg-red-500/20 text-red-400">{gameState.powerball ? '1/1' : '0/1'}</Badge>
                </div>
                
                <div className="grid grid-cols-9 md:grid-cols-13 gap-1">
                  {Array.from({ length: 26 }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      onClick={() => selectPowerball(num)}
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full text-sm font-bold transition-all ${
                        gameState.powerball === num
                          ? 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/50 scale-110'
                          : 'bg-gray-800 text-gray-300 hover:bg-red-900/50'
                      }`}
                      data-testid={`powerball-${num}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 bg-[#1a1a1a]/80 rounded-full px-4 py-2">
                {gameState.playerNumbers.map((num, i) => (
                  <div key={i} className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-gray-200 flex items-center justify-center text-black font-bold text-lg shadow-lg">
                    {num}
                  </div>
                ))}
                {Array.from({ length: 5 - gameState.playerNumbers.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-12 h-12 rounded-full bg-gray-800 border-2 border-dashed border-gray-600" />
                ))}
                <div className="w-1 h-8 bg-gray-700 mx-2" />
                {gameState.powerball ? (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-red-500/50">
                    {gameState.powerball}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-800 border-2 border-dashed border-red-600" />
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
              <Button
                onClick={quickPick}
                variant="outline"
                className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                data-testid="button-quickpick"
              >
                <Zap className="w-4 h-4 mr-2" />
                QUICK PICK
              </Button>
              
              {!freePlay && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Bet:</span>
                  {[2, 5, 10, 25].map((amount) => (
                    <Button
                      key={amount}
                      variant={bet === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBet(amount)}
                      className={bet === amount ? "bg-red-600" : "border-gray-600"}
                      data-testid={`button-bet-${amount}`}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              )}
              
              <Button
                onClick={() => playMutation.mutate()}
                disabled={!canPlay || (!freePlay && (!wallet || wallet.balance < bet)) || playMutation.isPending}
                className="h-14 px-8 text-xl font-bold bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-500 hover:to-yellow-500"
                data-testid="button-play"
              >
                {playMutation.isPending ? "..." : freePlay ? "PLAY FREE" : `PLAY (${bet} CREDITS)`}
              </Button>
            </div>
          </>
        )}

        {(gameState.phase === 'drawing' || gameState.phase === 'complete') && (
          <Card className="bg-[#1a1a1a]/80 border-yellow-600/30">
            <CardContent className="p-8">
              <h3 className="text-center text-white font-bold text-xl mb-6">
                {gameState.phase === 'drawing' ? 'DRAWING NUMBERS...' : 'RESULTS'}
              </h3>
              
              <div className="text-center text-gray-400 text-sm mb-4">Your Numbers</div>
              <div className="flex items-center justify-center gap-3 mb-8">
                {gameState.playerNumbers.map((num, i) => {
                  const isMatch = gameState.drawnNumbers.includes(num);
                  return (
                    <div 
                      key={i} 
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-500 ${
                        isMatch 
                          ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-500/50 scale-110' 
                          : 'bg-gradient-to-br from-gray-600 to-gray-700 text-gray-300'
                      }`}
                    >
                      {num}
                    </div>
                  );
                })}
                <div className="w-1 h-10 bg-gray-700 mx-2" />
                <div 
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-500 ${
                    gameState.powerballMatch 
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-500/50 scale-110' 
                      : 'bg-gradient-to-br from-red-700 to-red-900 text-white'
                  }`}
                >
                  {gameState.powerball}
                </div>
              </div>

              <div className="text-center text-gray-400 text-sm mb-4">Winning Numbers</div>
              <div ref={ballContainerRef} className="flex items-center justify-center gap-3 mb-8 min-h-[60px]">
                {gameState.drawnNumbers.map((num, i) => {
                  const isMatch = gameState.playerNumbers.includes(num);
                  return (
                    <div 
                      key={i}
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold animate-bounce ${
                        isMatch 
                          ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-500/50' 
                          : 'bg-gradient-to-br from-white to-gray-200 text-black shadow-lg'
                      }`}
                      style={{ animationDelay: `${i * 100}ms`, animationDuration: '0.5s' }}
                    >
                      {num}
                    </div>
                  );
                })}
                {gameState.phase === 'drawing' && gameState.drawnNumbers.length < 5 && (
                  <div className="w-14 h-14 rounded-full bg-gray-800 animate-pulse flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                  </div>
                )}
                {gameState.drawnNumbers.length === 5 && (
                  <>
                    <div className="w-1 h-10 bg-gray-700 mx-2" />
                    {gameState.drawnPowerball ? (
                      <div 
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold animate-bounce ${
                          gameState.powerballMatch 
                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-500/50' 
                            : 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/50'
                        }`}
                      >
                        {gameState.drawnPowerball}
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-red-900 animate-pulse flex items-center justify-center">
                        <Star className="w-6 h-6 text-red-400" />
                      </div>
                    )}
                  </>
                )}
              </div>

              {gameState.phase === 'complete' && (
                <div className={`text-center p-6 rounded-xl ${
                  gameState.winAmount > 0 
                    ? 'bg-gradient-to-r from-yellow-600/20 to-green-600/20 border border-yellow-500' 
                    : 'bg-gray-800/50'
                }`}>
                  {gameState.winAmount > 0 ? (
                    <>
                      <Trophy className="w-16 h-16 mx-auto text-yellow-400 mb-3" />
                      <h3 className="text-3xl font-black text-yellow-400 mb-2">
                        {gameState.winAmount >= jackpot ? 'JACKPOT!!!' : 'WINNER!'}
                      </h3>
                      <p className="text-gray-300 mb-2">
                        {gameState.matches} number{gameState.matches !== 1 ? 's' : ''} 
                        {gameState.powerballMatch ? ' + Powerball' : ''}
                      </p>
                      <p className="text-4xl font-black text-[#C9941A]">
                        +{gameState.winAmount.toLocaleString()} {freePlay ? '(Demo)' : 'Credits'}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-400 text-lg">No winner this time</p>
                      <p className="text-gray-500 mt-2">
                        Matched {gameState.matches} number{gameState.matches !== 1 ? 's' : ''}
                        {gameState.powerballMatch ? ' + Powerball' : ''}
                      </p>
                    </>
                  )}
                  
                  <Button
                    onClick={resetGame}
                    className="mt-6 bg-gradient-to-r from-red-600 to-yellow-600"
                    data-testid="button-play-again"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    PLAY AGAIN
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="bg-[#1a1a1a]/50 border-[#333] mt-8">
          <CardContent className="p-4">
            <h4 className="text-white font-bold mb-3 text-center">Prize Table</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {PAYOUTS.map((p, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-2 text-center">
                  <div className="text-gray-400">{p.label}</div>
                  <div className={`font-bold ${p.isJackpot ? 'text-yellow-400' : 'text-white'}`}>
                    {p.isJackpot ? 'JACKPOT' : `${p.payout}x`}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
