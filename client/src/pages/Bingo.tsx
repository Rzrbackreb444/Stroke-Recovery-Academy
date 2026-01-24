import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, ChevronLeft, Trophy, Zap, Volume2, VolumeX, RefreshCw, Star, Pause, Play
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import sasquatchLogo from "../assets/sasquatch-logo.png";

interface BingoCard {
  numbers: (number | null)[][];
  marked: boolean[][];
}

interface GameState {
  card: BingoCard;
  calledNumbers: number[];
  currentNumber: number | null;
  currentLetter: string;
  hasWon: boolean;
  winPattern: string | null;
  winAmount: number;
}

const PATTERNS = [
  { name: "Line", multiplier: 2, description: "5 in a row (any direction)", icon: "━" },
  { name: "Four Corners", multiplier: 3, description: "All 4 corners marked", icon: "◢" },
  { name: "X Pattern", multiplier: 5, description: "Both diagonals", icon: "✕" },
  { name: "Full Card", multiplier: 25, description: "Blackout - all squares", icon: "▮" },
];

export default function Bingo() {
  const { toast } = useToast();
  const [bet, setBet] = useState(10);
  const [freePlay, setFreePlay] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ballAnimation, setBallAnimation] = useState(false);

  const { data: wallet } = useQuery<{ balance: number }>({
    queryKey: ["/api/credits/balance"],
  });

  const generateCard = (): BingoCard => {
    const columns: number[][] = [];
    const ranges = [
      [1, 15], [16, 30], [31, 45], [46, 60], [61, 75]
    ];
    
    for (let col = 0; col < 5; col++) {
      const [min, max] = ranges[col];
      const available = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      const selected: number[] = [];
      for (let i = 0; i < 5; i++) {
        const idx = Math.floor(Math.random() * available.length);
        selected.push(available.splice(idx, 1)[0]);
      }
      columns.push(selected);
    }
    
    const numbers: (number | null)[][] = [];
    for (let row = 0; row < 5; row++) {
      numbers.push(columns.map(col => col[row]));
    }
    numbers[2][2] = null;
    
    const marked = Array(5).fill(null).map((_, row) => 
      Array(5).fill(null).map((_, col) => row === 2 && col === 2)
    );
    
    return { numbers, marked };
  };

  const startMutation = useMutation({
    mutationFn: async () => {
      if (freePlay) return { success: true };
      const res = await apiRequest("POST", "/api/games/bingo-start", { bet });
      return res.json();
    },
    onSuccess: () => {
      const card = generateCard();
      setGameState({
        card,
        calledNumbers: [],
        currentNumber: null,
        currentLetter: '',
        hasWon: false,
        winPattern: null,
        winAmount: 0,
      });
      if (!freePlay) {
        queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
      }
    },
    onError: (error: any) => {
      toast({ title: "Failed to start", description: error.message, variant: "destructive" });
    },
  });

  const checkWin = useCallback((marked: boolean[][]): { won: boolean; pattern: string | null; multiplier: number } => {
    for (let i = 0; i < 5; i++) {
      if (marked[i].every(m => m)) return { won: true, pattern: "Line", multiplier: 2 };
      if (marked.every(row => row[i])) return { won: true, pattern: "Line", multiplier: 2 };
    }
    
    if (marked[0][0] && marked[0][4] && marked[4][0] && marked[4][4]) {
      return { won: true, pattern: "Four Corners", multiplier: 3 };
    }
    
    const diag1 = marked[0][0] && marked[1][1] && marked[2][2] && marked[3][3] && marked[4][4];
    const diag2 = marked[0][4] && marked[1][3] && marked[2][2] && marked[3][1] && marked[4][0];
    if (diag1 && diag2) return { won: true, pattern: "X Pattern", multiplier: 5 };
    if (diag1 || diag2) return { won: true, pattern: "Line", multiplier: 2 };
    
    if (marked.every(row => row.every(m => m))) {
      return { won: true, pattern: "Full Card", multiplier: 25 };
    }
    
    return { won: false, pattern: null, multiplier: 0 };
  }, []);

  const winMutation = useMutation({
    mutationFn: async (data: { pattern: string; multiplier: number }) => {
      if (freePlay) return { winAmount: bet * data.multiplier };
      const res = await apiRequest("POST", "/api/games/bingo-win", { 
        bet, 
        pattern: data.pattern,
        multiplier: data.multiplier 
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (!freePlay) {
        queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
      }
      toast({ title: "BINGO!", description: freePlay ? `You would win ${data.winAmount} credits!` : `Won ${data.winAmount} credits!` });
    },
  });

  const getColumnLetter = (num: number) => {
    if (num <= 15) return 'B';
    if (num <= 30) return 'I';
    if (num <= 45) return 'N';
    if (num <= 60) return 'G';
    return 'O';
  };

  const drawNumber = useCallback(() => {
    if (!gameState || gameState.hasWon || isDrawing) return;
    
    const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
    const available = allNumbers.filter(n => !gameState.calledNumbers.includes(n));
    
    if (available.length === 0) {
      setIsAutoPlay(false);
      return;
    }
    
    setIsDrawing(true);
    setBallAnimation(true);
    const newNumber = available[Math.floor(Math.random() * available.length)];
    
    setTimeout(() => {
      setBallAnimation(false);
      setGameState(prev => {
        if (!prev) return prev;
        
        const newMarked = prev.card.marked.map((row, ri) =>
          row.map((m, ci) => m || prev.card.numbers[ri][ci] === newNumber)
        );
        
        const { won, pattern, multiplier } = checkWin(newMarked);
        
        if (won && pattern) {
          setIsAutoPlay(false);
          winMutation.mutate({ pattern, multiplier });
          return {
            ...prev,
            card: { ...prev.card, marked: newMarked },
            calledNumbers: [...prev.calledNumbers, newNumber],
            currentNumber: newNumber,
            currentLetter: getColumnLetter(newNumber),
            hasWon: true,
            winPattern: pattern,
            winAmount: bet * multiplier,
          };
        }
        
        return {
          ...prev,
          card: { ...prev.card, marked: newMarked },
          calledNumbers: [...prev.calledNumbers, newNumber],
          currentNumber: newNumber,
          currentLetter: getColumnLetter(newNumber),
        };
      });
      setIsDrawing(false);
    }, 800);
  }, [gameState, isDrawing, checkWin, bet, winMutation]);

  useEffect(() => {
    if (isAutoPlay && gameState && !gameState.hasWon) {
      const timer = setTimeout(drawNumber, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAutoPlay, gameState, gameState?.calledNumbers.length, drawNumber]);

  const getNumberColor = (num: number) => {
    if (num <= 15) return 'from-blue-500 to-blue-700';
    if (num <= 30) return 'from-red-500 to-red-700';
    if (num <= 45) return 'from-white to-gray-300 text-black';
    if (num <= 60) return 'from-green-500 to-green-700';
    return 'from-yellow-400 to-yellow-600 text-black';
  };

  const getBgColor = (num: number) => {
    if (num <= 15) return 'bg-blue-600';
    if (num <= 30) return 'bg-red-600';
    if (num <= 45) return 'bg-white text-black';
    if (num <= 60) return 'bg-green-600';
    return 'bg-yellow-500 text-black';
  };

  return (
    <div className="min-h-screen bg-[#050814] relative overflow-hidden">
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
          radial-gradient(ellipse at 0% 100%, rgba(168, 85, 247, 0.1) 0%, transparent 40%),
          radial-gradient(ellipse at 100% 100%, rgba(234, 179, 8, 0.1) 0%, transparent 40%)
        `
      }} />
      
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-500" />

      <div className="relative z-10 p-4 md:p-6 max-w-6xl mx-auto">
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
              className={freePlay ? "bg-green-600" : "border-gray-600"}
              data-testid="button-freeplay"
            >
              {freePlay ? "FREE" : "BET"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-gray-400"
              data-testid="button-sound"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-lg font-bold" data-testid="badge-balance">
              <Coins className="w-5 h-5 mr-2" />
              {wallet?.balance?.toLocaleString() ?? 0}
            </Badge>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            <span className="text-blue-400">B</span>
            <span className="text-red-400">I</span>
            <span className="text-white">N</span>
            <span className="text-green-400">G</span>
            <span className="text-yellow-400">O</span>
            <span className="text-gray-500 ml-3 text-2xl">SASQUATCH</span>
          </h1>
        </div>

        {!gameState ? (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gray-900/80 border-purple-600/30">
              <CardContent className="p-8">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <img src={sasquatchLogo} alt="Sasquatch" className="w-20 h-20 rounded-full border-4 border-purple-500" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">Ready to Play?</h2>
                    <p className="text-gray-400">Match patterns to win big prizes!</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  {PATTERNS.map((pattern) => (
                    <div key={pattern.name} className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
                      <div className="text-3xl mb-2">{pattern.icon}</div>
                      <div className="text-white font-semibold text-sm">{pattern.name}</div>
                      <Badge className="bg-yellow-600 mt-2">{pattern.multiplier}x</Badge>
                    </div>
                  ))}
                </div>
                
                {!freePlay && (
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <span className="text-gray-400">Card Cost:</span>
                    {[5, 10, 25, 50].map((amount) => (
                      <Button
                        key={amount}
                        variant={bet === amount ? "default" : "outline"}
                        size="sm"
                        onClick={() => setBet(amount)}
                        className={bet === amount ? "bg-purple-600" : "border-gray-600"}
                        data-testid={`button-bet-${amount}`}
                      >
                        {amount}
                      </Button>
                    ))}
                  </div>
                )}
                
                <Button
                  onClick={() => startMutation.mutate()}
                  disabled={!freePlay && (!wallet || wallet.balance < bet) || startMutation.isPending}
                  className="w-full h-14 text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
                  data-testid="button-start"
                >
                  {startMutation.isPending ? "Getting Card..." : freePlay ? "PLAY FREE" : `BUY CARD (${bet} CREDITS)`}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className={`bg-gray-900/90 backdrop-blur ${gameState.hasWon ? 'border-2 border-yellow-500 shadow-lg shadow-yellow-500/20' : 'border-gray-700'}`}>
                <CardContent className="p-4 md:p-6">
                  <div className="grid grid-cols-5 gap-1 mb-2">
                    {['B', 'I', 'N', 'G', 'O'].map((letter, i) => (
                      <div 
                        key={letter} 
                        className={`text-center py-3 rounded-t-xl font-black text-2xl md:text-3xl text-white ${
                          i === 0 ? 'bg-blue-600' :
                          i === 1 ? 'bg-red-600' :
                          i === 2 ? 'bg-gray-200 text-black' :
                          i === 3 ? 'bg-green-600' :
                          'bg-yellow-500 text-black'
                        }`}
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-5 gap-1">
                    {gameState.card.numbers.map((row, ri) =>
                      row.map((num, ci) => {
                        const isMarked = gameState.card.marked[ri][ci];
                        const isJustCalled = num === gameState.currentNumber;
                        return (
                          <div
                            key={`${ri}-${ci}`}
                            className={`aspect-square flex items-center justify-center text-xl md:text-2xl font-bold rounded-xl transition-all duration-300 ${
                              num === null 
                                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' 
                                : isMarked
                                  ? `bg-gradient-to-br ${getNumberColor(num)} shadow-lg ${isJustCalled ? 'scale-110 ring-4 ring-white' : ''}`
                                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                            data-testid={`cell-${ri}-${ci}`}
                          >
                            {num === null ? <Star className="w-6 h-6 md:w-8 md:h-8" /> : num}
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {gameState.hasWon && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-yellow-600/20 to-green-600/20 border-2 border-yellow-500 rounded-xl text-center">
                      <Trophy className="w-16 h-16 mx-auto text-yellow-400 mb-3 animate-bounce" />
                      <h3 className="text-4xl font-black text-yellow-400 mb-2">BINGO!</h3>
                      <p className="text-white text-lg">{gameState.winPattern}</p>
                      <p className="text-3xl font-black text-green-400 mt-3">+{gameState.winAmount} {freePlay ? '(Demo)' : 'Credits'}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {!gameState.hasWon && (
                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={drawNumber}
                    disabled={isDrawing || isAutoPlay}
                    className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-purple-600 font-bold text-lg"
                    data-testid="button-draw"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    DRAW NUMBER
                  </Button>
                  <Button
                    onClick={() => setIsAutoPlay(!isAutoPlay)}
                    variant={isAutoPlay ? "destructive" : "outline"}
                    className="h-14 px-8 font-bold"
                    data-testid="button-autoplay"
                  >
                    {isAutoPlay ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                    {isAutoPlay ? "STOP" : "AUTO"}
                  </Button>
                </div>
              )}
              
              {gameState.hasWon && (
                <Button
                  onClick={() => setGameState(null)}
                  className="w-full mt-4 h-14 bg-gradient-to-r from-green-600 to-emerald-600 font-bold text-lg"
                  data-testid="button-new-game"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  NEW GAME
                </Button>
              )}
            </div>
            
            <div className="space-y-4">
              <Card className="bg-gray-900/80 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold mb-4 text-center text-lg">Current Ball</h3>
                  {gameState.currentNumber ? (
                    <div className={`relative w-28 h-28 mx-auto rounded-full flex items-center justify-center shadow-2xl ${ballAnimation ? 'animate-bounce' : ''}`}>
                      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${getNumberColor(gameState.currentNumber)} opacity-20 blur-xl`} />
                      <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${getNumberColor(gameState.currentNumber)} flex flex-col items-center justify-center shadow-lg`}>
                        <span className="text-sm font-bold opacity-80">{gameState.currentLetter}</span>
                        <span className="text-3xl font-black">{gameState.currentNumber}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-28 h-28 mx-auto rounded-full bg-gray-800 border-4 border-dashed border-gray-600 flex items-center justify-center">
                      <span className="text-gray-500 text-lg">?</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900/80 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-bold">Called Numbers</h3>
                    <Badge className="bg-gray-700">{gameState.calledNumbers.length}/75</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto">
                    {gameState.calledNumbers.slice().reverse().map((num, i) => (
                      <div
                        key={num}
                        className={`w-9 h-9 rounded-lg text-sm font-bold flex items-center justify-center ${getBgColor(num)} ${i === 0 ? 'ring-2 ring-white' : ''}`}
                      >
                        {num}
                      </div>
                    ))}
                    {gameState.calledNumbers.length === 0 && (
                      <p className="text-gray-500 text-sm w-full text-center py-4">No numbers called yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
