import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, ChevronLeft, Trophy, RefreshCw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import sasquatchLogo from "../assets/sasquatch-logo.png";

interface PlayingCard {
  suit: string;
  rank: string;
  value: number;
  hidden?: boolean;
}

type GameState = 'betting' | 'playing' | 'dealer' | 'finished';

const SUITS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const SUIT_COLORS = { hearts: 'text-red-500', diamonds: 'text-red-500', clubs: 'text-gray-900', spades: 'text-gray-900' };

export default function Blackjack() {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState>('betting');
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([]);
  const [bet, setBet] = useState(25);
  const [result, setResult] = useState<string | null>(null);
  const [winAmount, setWinAmount] = useState(0);

  const { data: wallet } = useQuery<{ balance: number }>({
    queryKey: ["/api/credits/balance"],
  });

  const calculateHand = (hand: PlayingCard[]): number => {
    let total = 0;
    let aces = 0;
    
    for (const card of hand) {
      if (card.hidden) continue;
      if (card.rank === 'A') {
        aces++;
        total += 11;
      } else if (['K', 'Q', 'J'].includes(card.rank)) {
        total += 10;
      } else {
        total += parseInt(card.rank);
      }
    }
    
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    
    return total;
  };

  const dealMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/blackjack-deal", { bet });
      return res.json();
    },
    onSuccess: (data) => {
      setPlayerHand(data.playerHand);
      setDealerHand(data.dealerHand);
      setGameState('playing');
      setResult(null);
      setWinAmount(0);
      
      if (data.result) {
        setResult(data.result);
        setWinAmount(data.winAmount || 0);
        setGameState('finished');
        setDealerHand(data.dealerFinalHand || data.dealerHand);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
    },
    onError: (error: any) => {
      toast({ title: "Deal failed", description: error.message, variant: "destructive" });
    },
  });

  const actionMutation = useMutation({
    mutationFn: async (action: 'hit' | 'stand' | 'double') => {
      const res = await apiRequest("POST", "/api/games/blackjack-action", { 
        action, 
        playerHand, 
        dealerHand: dealerHand.map(c => ({ ...c, hidden: false })),
        bet 
      });
      return res.json();
    },
    onSuccess: (data) => {
      setPlayerHand(data.playerHand);
      setDealerHand(data.dealerHand);
      
      if (data.result) {
        setResult(data.result);
        setWinAmount(data.winAmount || 0);
        setGameState('finished');
        
        if (data.winAmount > 0) {
          toast({ title: data.result, description: `Won ${data.winAmount} credits!` });
        } else {
          toast({ title: data.result, variant: "destructive" });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
    },
    onError: (error: any) => {
      toast({ title: "Action failed", description: error.message, variant: "destructive" });
    },
  });

  const PlayingCardComponent = ({ card, index, isDealer = false }: { card: PlayingCard; index: number; isDealer?: boolean }) => {
    const suitSymbol = SUITS[card.suit as keyof typeof SUITS] || card.suit;
    const suitColor = SUIT_COLORS[card.suit as keyof typeof SUIT_COLORS] || 'text-gray-900';
    
    if (card.hidden) {
      return (
        <div 
          className="w-16 h-24 md:w-20 md:h-28 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 border-2 border-blue-600 shadow-xl flex items-center justify-center"
          style={{ 
            transform: `translateX(${index * -30}px) rotate(${(index - 1) * 3}deg)`,
            zIndex: index
          }}
        >
          <div className="w-12 h-18 border border-blue-400/30 rounded flex items-center justify-center">
            <img src={sasquatchLogo} alt="Card back" className="w-8 h-8 rounded opacity-50" />
          </div>
        </div>
      );
    }
    
    return (
      <div 
        className="w-16 h-24 md:w-20 md:h-28 rounded-lg bg-white border-2 border-gray-300 shadow-xl flex flex-col p-1.5 relative"
        style={{ 
          transform: `translateX(${index * -30}px) rotate(${(index - 1) * 3}deg)`,
          zIndex: index
        }}
      >
        <div className={`text-sm font-bold ${suitColor}`}>
          {card.rank}
          <span className="ml-0.5">{suitSymbol}</span>
        </div>
        <div className={`flex-1 flex items-center justify-center text-3xl ${suitColor}`}>
          {suitSymbol}
        </div>
        <div className={`text-sm font-bold self-end rotate-180 ${suitColor}`}>
          {card.rank}
          <span className="ml-0.5">{suitSymbol}</span>
        </div>
      </div>
    );
  };

  const newGame = () => {
    setGameState('betting');
    setPlayerHand([]);
    setDealerHand([]);
    setResult(null);
    setWinAmount(0);
  };

  const playerTotal = calculateHand(playerHand);
  const dealerTotal = calculateHand(dealerHand);

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(34, 197, 94, 0.15) 0%, transparent 60%)'
        }}
      />

      <div className="relative z-10 p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/games">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" data-testid="button-back">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Games
            </Button>
          </Link>
          <Badge className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 text-lg font-bold" data-testid="badge-balance">
            <Coins className="w-5 h-5 mr-2" />
            {wallet?.balance?.toLocaleString() ?? 0}
          </Badge>
        </div>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={sasquatchLogo} alt="Sasquatch" className="w-12 h-12 rounded-full border-2 border-emerald-500" />
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400 bg-clip-text text-transparent">
              SASQUATCH BLACKJACK
            </h1>
          </div>
          <p className="text-gray-500 text-sm">Blackjack pays 3:2</p>
        </div>

        <Card className="bg-gradient-to-b from-green-900/40 to-green-950/60 border-2 border-green-700/50 shadow-2xl">
          <CardContent className="p-6 md:p-8">
            <div className="min-h-[140px] mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm uppercase tracking-wide">Dealer</span>
                {dealerHand.length > 0 && (
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    {gameState === 'finished' ? dealerTotal : '?'}
                  </Badge>
                )}
              </div>
              <div className="flex justify-center pl-16">
                {dealerHand.map((card, i) => (
                  <PlayingCardComponent key={i} card={card} index={i} isDealer />
                ))}
              </div>
            </div>

            {result && (
              <div className={`text-center py-4 mb-6 rounded-xl ${
                winAmount > 0 
                  ? 'bg-gradient-to-r from-yellow-900/50 to-amber-900/50 border border-yellow-500/50' 
                  : 'bg-gray-800/50 border border-gray-600'
              }`}>
                <div className="flex items-center justify-center gap-3">
                  {winAmount > 0 && <Trophy className="w-6 h-6 text-yellow-400" />}
                  <span className={`text-2xl font-bold ${winAmount > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {result}
                  </span>
                  {winAmount > 0 && (
                    <span className="text-[#C9941A] font-bold">+{winAmount}</span>
                  )}
                </div>
              </div>
            )}

            <div className="min-h-[140px] mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm uppercase tracking-wide">Your Hand</span>
                {playerHand.length > 0 && (
                  <Badge className={`${playerTotal > 21 ? 'bg-red-600' : playerTotal === 21 ? 'bg-yellow-600' : 'bg-gray-700'}`}>
                    {playerTotal}
                  </Badge>
                )}
              </div>
              <div className="flex justify-center pl-16">
                {playerHand.map((card, i) => (
                  <PlayingCardComponent key={i} card={card} index={i} />
                ))}
              </div>
            </div>

            {gameState === 'betting' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-gray-400">Bet:</span>
                  {[10, 25, 50, 100, 250].map((amount) => (
                    <Button
                      key={amount}
                      variant={bet === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBet(amount)}
                      className={bet === amount ? "bg-emerald-600" : "border-gray-600"}
                      data-testid={`button-bet-${amount}`}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={() => dealMutation.mutate()}
                  disabled={!wallet || wallet.balance < bet || dealMutation.isPending}
                  className="w-full h-14 text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600"
                  data-testid="button-deal"
                >
                  DEAL ({bet})
                </Button>
              </div>
            )}

            {gameState === 'playing' && (
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => actionMutation.mutate('hit')}
                  disabled={actionMutation.isPending}
                  className="flex-1 h-14 text-lg font-bold bg-blue-600 hover:bg-blue-500"
                  data-testid="button-hit"
                >
                  HIT
                </Button>
                <Button
                  onClick={() => actionMutation.mutate('stand')}
                  disabled={actionMutation.isPending}
                  className="flex-1 h-14 text-lg font-bold bg-red-600 hover:bg-red-500"
                  data-testid="button-stand"
                >
                  STAND
                </Button>
                {playerHand.length === 2 && wallet && wallet.balance >= bet * 2 && (
                  <Button
                    onClick={() => actionMutation.mutate('double')}
                    disabled={actionMutation.isPending}
                    className="flex-1 h-14 text-lg font-bold bg-yellow-600 hover:bg-yellow-500"
                    data-testid="button-double"
                  >
                    DOUBLE
                  </Button>
                )}
              </div>
            )}

            {gameState === 'finished' && (
              <Button
                onClick={newGame}
                className="w-full h-14 text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600"
                data-testid="button-new-game"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                NEW GAME
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
