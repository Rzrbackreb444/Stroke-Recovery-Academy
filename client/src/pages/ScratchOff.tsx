import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, ChevronLeft, Trophy, Sparkles, RefreshCw, Gift
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import sasquatchLogo from "../assets/sasquatch-logo.png";

interface CardData {
  symbols: string[];
  values: number[];
  winAmount: number;
  isWinner: boolean;
}

const CARD_TYPES = [
  { id: 'silver', name: 'Silver', cost: 5, maxPrize: 500, color: 'from-gray-400 to-gray-600' },
  { id: 'gold', name: 'Gold', cost: 10, maxPrize: 2500, color: 'from-yellow-400 to-yellow-600' },
  { id: 'platinum', name: 'Platinum', cost: 25, maxPrize: 10000, color: 'from-purple-400 to-purple-600' },
  { id: 'sasquatch', name: 'Sasquatch Special', cost: 50, maxPrize: 50000, color: 'from-green-400 to-emerald-600' },
];

const SYMBOLS = ['🍒', '💎', '🌟', '7️⃣', '🍀', '💰', '🎰', '👣'];

export default function ScratchOff() {
  const { toast } = useToast();
  const [selectedCard, setSelectedCard] = useState(CARD_TYPES[0]);
  const [freePlay, setFreePlay] = useState(false);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [scratched, setScratched] = useState<boolean[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  const { data: wallet } = useQuery<{ balance: number }>({
    queryKey: ["/api/credits/balance"],
  });

  const generateCard = (): CardData => {
    const symbols: string[] = [];
    const values: number[] = [];
    
    const isWinner = Math.random() < 0.3;
    
    if (isWinner) {
      const winSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      const winValue = Math.floor(Math.random() * selectedCard.maxPrize * 0.5) + selectedCard.cost;
      const winCount = Math.random() < 0.3 ? 3 : 2;
      
      for (let i = 0; i < 9; i++) {
        if (i < winCount) {
          symbols.push(winSymbol);
          values.push(winValue);
        } else {
          const otherSymbols = SYMBOLS.filter(s => s !== winSymbol);
          symbols.push(otherSymbols[Math.floor(Math.random() * otherSymbols.length)]);
          values.push(Math.floor(Math.random() * 100) + 10);
        }
      }
      
      for (let i = symbols.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
        [values[i], values[j]] = [values[j], values[i]];
      }
      
      return { symbols, values, winAmount: winValue * winCount, isWinner: true };
    } else {
      for (let i = 0; i < 9; i++) {
        symbols.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
        values.push(Math.floor(Math.random() * 100) + 10);
      }
      return { symbols, values, winAmount: 0, isWinner: false };
    }
  };

  const buyMutation = useMutation({
    mutationFn: async () => {
      if (freePlay) return { success: true };
      const res = await apiRequest("POST", "/api/games/scratch-buy", { 
        cardType: selectedCard.id,
        cost: selectedCard.cost 
      });
      return res.json();
    },
    onSuccess: () => {
      const card = generateCard();
      setCardData(card);
      setScratched(Array(9).fill(false));
      setGameComplete(false);
      if (!freePlay) {
        queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
      }
    },
    onError: (error: any) => {
      toast({ title: "Failed to buy card", description: error.message, variant: "destructive" });
    },
  });

  const winMutation = useMutation({
    mutationFn: async (winAmount: number) => {
      if (freePlay) return { winAmount };
      const res = await apiRequest("POST", "/api/games/scratch-win", { winAmount });
      return res.json();
    },
    onSuccess: (data) => {
      if (!freePlay) {
        queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
      }
    },
  });

  const initCanvas = (canvas: HTMLCanvasElement | null, index: number) => {
    if (!canvas) return;
    canvasRefs.current[index] = canvas;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#9CA3AF');
    gradient.addColorStop(0.5, '#6B7280');
    gradient.addColorStop(1, '#4B5563');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'center';
    ctx.fillText('SCRATCH', canvas.width / 2, canvas.height / 2 + 4);
  };

  const handleScratch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, index: number) => {
    if (scratched[index] || !cardData) return;
    
    const canvas = canvasRefs.current[index];
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparentPixels = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] < 128) transparentPixels++;
    }
    const percentScratched = transparentPixels / (imageData.data.length / 4);
    
    if (percentScratched > 0.5) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const newScratched = [...scratched];
      newScratched[index] = true;
      setScratched(newScratched);
      
      if (newScratched.every(s => s)) {
        setGameComplete(true);
        if (cardData.isWinner && cardData.winAmount > 0) {
          winMutation.mutate(cardData.winAmount);
          toast({ 
            title: "Winner!", 
            description: freePlay ? `You would win ${cardData.winAmount} credits!` : `Won ${cardData.winAmount} credits!` 
          });
        }
      }
    }
  };

  const revealAll = () => {
    if (!cardData) return;
    setIsRevealing(true);
    
    scratched.forEach((s, i) => {
      if (!s) {
        setTimeout(() => {
          const canvas = canvasRefs.current[i];
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
          setScratched(prev => {
            const newScratched = [...prev];
            newScratched[i] = true;
            return newScratched;
          });
        }, i * 200);
      }
    });
    
    setTimeout(() => {
      setIsRevealing(false);
      setGameComplete(true);
      if (cardData.isWinner && cardData.winAmount > 0) {
        winMutation.mutate(cardData.winAmount);
        toast({ 
          title: "Winner!", 
          description: freePlay ? `You would win ${cardData.winAmount} credits!` : `Won ${cardData.winAmount} credits!` 
        });
      }
    }, 9 * 200 + 500);
  };

  const resetGame = () => {
    setCardData(null);
    setScratched([]);
    setGameComplete(false);
  };

  useEffect(() => {
    if (cardData && scratched.length > 0) {
      canvasRefs.current.forEach((_, i) => {
        if (!scratched[i]) {
          const canvas = canvasRefs.current[i];
          if (canvas) initCanvas(canvas, i);
        }
      });
    }
  }, [cardData]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(168, 85, 247, 0.15) 0%, transparent 40%),
          radial-gradient(ellipse at 70% 80%, rgba(234, 179, 8, 0.1) 0%, transparent 40%)
        `
      }} />

      <div className="relative z-10 p-4 md:p-6 max-w-4xl mx-auto">
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
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-lg font-bold" data-testid="badge-balance">
              <Coins className="w-5 h-5 mr-2" />
              {wallet?.balance?.toLocaleString() ?? 0}
            </Badge>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-1">
            SASQUATCH SCRATCH-OFFS
          </h1>
          <p className="text-gray-500 text-sm">Match 3 symbols to win!</p>
        </div>

        {!cardData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CARD_TYPES.map((card) => (
                <Card 
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className={`cursor-pointer transition-all ${
                    selectedCard.id === card.id 
                      ? 'ring-2 ring-yellow-400 scale-105' 
                      : 'hover:scale-102'
                  } bg-[#1a1a1a]/80 border-[#333]`}
                  data-testid={`card-type-${card.id}`}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 shadow-lg`}>
                      <Gift className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-white font-bold">{card.name}</h3>
                    <p className="text-gray-400 text-sm">{card.cost} credits</p>
                    <p className="text-yellow-400 text-xs mt-1">Win up to {card.maxPrize.toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={() => buyMutation.mutate()}
                disabled={!freePlay && (!wallet || wallet.balance < selectedCard.cost) || buyMutation.isPending}
                className={`h-14 px-8 text-xl font-bold bg-gradient-to-r ${selectedCard.color}`}
                data-testid="button-buy"
              >
                {buyMutation.isPending ? "..." : freePlay ? `GET ${selectedCard.name} (FREE)` : `BUY ${selectedCard.name} (${selectedCard.cost})`}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className={`bg-gradient-to-br ${selectedCard.color} p-1`}>
              <div className="bg-[#1a1a1a] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-white/20 text-white">{selectedCard.name}</Badge>
                  <span className="text-gray-400 text-sm">Match 3 to Win!</span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {cardData.symbols.map((symbol, i) => (
                    <div 
                      key={i} 
                      className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden"
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl">{symbol}</span>
                        <span className="text-yellow-400 font-bold text-sm mt-1">{cardData.values[i]}</span>
                      </div>
                      
                      {!scratched[i] && (
                        <canvas
                          ref={(el) => initCanvas(el, i)}
                          width={100}
                          height={100}
                          className="absolute inset-0 w-full h-full cursor-pointer touch-none"
                          onMouseMove={(e) => e.buttons === 1 && handleScratch(e, i)}
                          onMouseDown={(e) => handleScratch(e, i)}
                          onTouchMove={(e) => handleScratch(e, i)}
                          onTouchStart={(e) => handleScratch(e, i)}
                          data-testid={`scratch-area-${i}`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {!gameComplete && !scratched.every(s => s) && (
                  <Button
                    onClick={revealAll}
                    disabled={isRevealing}
                    variant="outline"
                    className="w-full border-white/30 text-white hover:bg-white/10"
                    data-testid="button-reveal"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isRevealing ? "Revealing..." : "REVEAL ALL"}
                  </Button>
                )}

                {gameComplete && (
                  <div className={`text-center p-4 rounded-xl ${
                    cardData.isWinner 
                      ? 'bg-gradient-to-r from-yellow-600/30 to-green-600/30 border border-yellow-500' 
                      : 'bg-gray-800/50'
                  }`}>
                    {cardData.isWinner ? (
                      <>
                        <Trophy className="w-12 h-12 mx-auto text-yellow-400 mb-2" />
                        <h3 className="text-2xl font-black text-yellow-400">WINNER!</h3>
                        <p className="text-3xl font-black text-[#C9941A] mt-2">
                          +{cardData.winAmount.toLocaleString()} {freePlay ? '(Demo)' : 'Credits'}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-400">No match this time. Try again!</p>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {gameComplete && (
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={resetGame}
                  variant="outline"
                  className="border-gray-600"
                  data-testid="button-new-card"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Choose New Card
                </Button>
                <Button
                  onClick={() => buyMutation.mutate()}
                  disabled={!freePlay && (!wallet || wallet.balance < selectedCard.cost)}
                  className={`bg-gradient-to-r ${selectedCard.color}`}
                  data-testid="button-same-again"
                >
                  Buy Another {selectedCard.name}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
