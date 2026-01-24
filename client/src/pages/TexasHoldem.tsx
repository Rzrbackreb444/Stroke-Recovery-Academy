import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, ChevronLeft, Trophy, Users, RefreshCw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import sasquatchLogo from "../assets/sasquatch-logo.png";

interface PlayingCard {
  suit: string;
  rank: string;
}

interface Player {
  name: string;
  cards: PlayingCard[];
  chips: number;
  bet: number;
  folded: boolean;
  isAI: boolean;
  avatar?: string;
}

type GamePhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

const SUITS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const SUIT_COLORS = { hearts: 'text-red-500', diamonds: 'text-red-500', clubs: 'text-gray-900', spades: 'text-gray-900' };

const AI_NAMES = ['Sasquatch Sam', 'Bigfoot Betty', 'Yeti Yolanda', 'Cryptid Carl'];

export default function TexasHoldem() {
  const { toast } = useToast();
  const [gamePhase, setGamePhase] = useState<GamePhase>('waiting');
  const [players, setPlayers] = useState<Player[]>([]);
  const [communityCards, setCommunityCards] = useState<PlayingCard[]>([]);
  const [pot, setPot] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [buyIn, setBuyIn] = useState(100);
  const [result, setResult] = useState<string | null>(null);
  const [winAmount, setWinAmount] = useState(0);
  const [handRank, setHandRank] = useState<string | null>(null);

  const { data: wallet } = useQuery<{ balance: number }>({
    queryKey: ["/api/credits/balance"],
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/holdem-start", { buyIn });
      return res.json();
    },
    onSuccess: (data) => {
      setPlayers(data.players);
      setCommunityCards([]);
      setPot(data.pot);
      setCurrentBet(data.bigBlind);
      setGamePhase('preflop');
      setResult(null);
      setWinAmount(0);
      setHandRank(null);
      queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to start", description: error.message, variant: "destructive" });
    },
  });

  const actionMutation = useMutation({
    mutationFn: async (action: { type: 'fold' | 'check' | 'call' | 'raise'; amount?: number }) => {
      const res = await apiRequest("POST", "/api/games/holdem-action", {
        action: action.type,
        amount: action.amount,
        gameState: { players, communityCards, pot, currentBet, gamePhase }
      });
      return res.json();
    },
    onSuccess: (data) => {
      setPlayers(data.players);
      setCommunityCards(data.communityCards);
      setPot(data.pot);
      setCurrentBet(data.currentBet);
      setGamePhase(data.gamePhase);
      
      if (data.result) {
        setResult(data.result);
        setWinAmount(data.winAmount || 0);
        setHandRank(data.handRank);
        
        if (data.winAmount > 0) {
          toast({ title: "You Won!", description: `${data.handRank} - ${data.winAmount} credits!` });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
    },
    onError: (error: any) => {
      toast({ title: "Action failed", description: error.message, variant: "destructive" });
    },
  });

  const PlayingCardComponent = ({ card, hidden = false, small = false }: { card: PlayingCard; hidden?: boolean; small?: boolean }) => {
    const suitSymbol = SUITS[card.suit as keyof typeof SUITS] || card.suit;
    const suitColor = SUIT_COLORS[card.suit as keyof typeof SUIT_COLORS] || 'text-gray-900';
    
    const sizeClass = small ? 'w-10 h-14' : 'w-14 h-20';
    const textSize = small ? 'text-xs' : 'text-sm';
    const iconSize = small ? 'text-lg' : 'text-2xl';
    
    if (hidden) {
      return (
        <div className={`${sizeClass} rounded-lg bg-gradient-to-br from-orange-700 to-orange-900 border border-orange-500 shadow-lg flex items-center justify-center`}>
          <img src={sasquatchLogo} alt="Card back" className="w-6 h-6 rounded opacity-60" />
        </div>
      );
    }
    
    return (
      <div className={`${sizeClass} rounded-lg bg-white border border-gray-300 shadow-lg flex flex-col p-1 relative`}>
        <div className={`${textSize} font-bold ${suitColor}`}>
          {card.rank}
        </div>
        <div className={`flex-1 flex items-center justify-center ${iconSize} ${suitColor}`}>
          {suitSymbol}
        </div>
      </div>
    );
  };

  const PlayerSeat = ({ player, position, isUser = false }: { player: Player; position: string; isUser?: boolean }) => {
    const positionStyles: Record<string, string> = {
      'top': 'top-4 left-1/2 -translate-x-1/2',
      'top-left': 'top-16 left-8',
      'top-right': 'top-16 right-8',
      'bottom': 'bottom-4 left-1/2 -translate-x-1/2',
    };

    return (
      <div className={`absolute ${positionStyles[position]} flex flex-col items-center`}>
        <div className={`relative ${player.folded ? 'opacity-40' : ''}`}>
          <div className={`w-12 h-12 rounded-full border-2 ${isUser ? 'border-yellow-400' : 'border-gray-600'} overflow-hidden bg-gray-800`}>
            <img src={sasquatchLogo} alt={player.name} className="w-full h-full object-cover" />
          </div>
          {!player.folded && player.bet > 0 && (
            <Badge className="absolute -bottom-1 -right-1 bg-yellow-600 text-[10px] px-1">
              {player.bet}
            </Badge>
          )}
        </div>
        <span className={`text-xs mt-1 ${isUser ? 'text-yellow-400' : 'text-gray-400'}`}>
          {isUser ? 'You' : player.name}
        </span>
        <span className="text-[10px] text-gray-500">{player.chips}</span>
        
        {player.cards.length > 0 && (
          <div className="flex gap-1 mt-2">
            {player.cards.map((card, i) => (
              <PlayingCardComponent 
                key={i} 
                card={card} 
                hidden={!isUser && gamePhase !== 'showdown'} 
                small 
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const player = players[playerIndex];
  const callAmount = currentBet - (player?.bet || 0);
  const canCheck = callAmount === 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(139, 69, 19, 0.2) 0%, transparent 60%)'
        }}
      />

      <div className="relative z-10 p-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/games">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" data-testid="button-back">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Games
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-gray-600 text-gray-400">
              <Users className="w-4 h-4 mr-1" />
              {players.filter(p => !p.folded).length} / {players.length}
            </Badge>
            <Badge className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2 text-lg font-bold" data-testid="badge-balance">
              <Coins className="w-5 h-5 mr-2" />
              {wallet?.balance?.toLocaleString() ?? 0}
            </Badge>
          </div>
        </div>

        <div className="text-center mb-4">
          <h1 className="text-2xl font-black bg-gradient-to-r from-amber-400 via-orange-300 to-amber-400 bg-clip-text text-transparent">
            SASQUATCH HOLD'EM
          </h1>
        </div>

        <Card className="bg-gradient-to-b from-green-900/60 to-green-950/80 border-2 border-amber-700/50 shadow-2xl">
          <CardContent className="p-4 relative min-h-[500px]">
            <div className="absolute inset-8 rounded-[100px] bg-gradient-to-b from-green-800 to-green-900 border-8 border-amber-800 shadow-inner" />
            
            {players.length >= 4 && (
              <>
                <PlayerSeat player={players[2]} position="top" />
                <PlayerSeat player={players[1]} position="top-left" />
                <PlayerSeat player={players[3]} position="top-right" />
                <PlayerSeat player={players[0]} position="bottom" isUser />
              </>
            )}

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex flex-col items-center">
                <div className="flex gap-2 mb-4">
                  {communityCards.map((card, i) => (
                    <PlayingCardComponent key={i} card={card} />
                  ))}
                  {[...Array(5 - communityCards.length)].map((_, i) => (
                    <div key={`empty-${i}`} className="w-14 h-20 rounded-lg border-2 border-dashed border-gray-600/30" />
                  ))}
                </div>
                
                {pot > 0 && (
                  <Badge className="bg-yellow-600 text-lg font-bold px-4 py-2">
                    POT: {pot}
                  </Badge>
                )}
              </div>
            </div>

            {result && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 rounded-xl p-6 text-center z-20">
                {winAmount > 0 && <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2" />}
                <h3 className={`text-2xl font-bold ${winAmount > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {result}
                </h3>
                {handRank && <p className="text-gray-400 mt-1">{handRank}</p>}
                {winAmount > 0 && <p className="text-green-400 text-xl font-bold mt-2">+{winAmount}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4 bg-gray-900/80 border-gray-700">
          <CardContent className="p-4">
            {gamePhase === 'waiting' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-gray-400">Buy-in:</span>
                  {[50, 100, 250, 500].map((amount) => (
                    <Button
                      key={amount}
                      variant={buyIn === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBuyIn(amount)}
                      className={buyIn === amount ? "bg-amber-600" : "border-gray-600"}
                      data-testid={`button-buyin-${amount}`}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={() => startMutation.mutate()}
                  disabled={!wallet || wallet.balance < buyIn || startMutation.isPending}
                  className="w-full h-14 text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600"
                  data-testid="button-start"
                >
                  JOIN TABLE ({buyIn})
                </Button>
              </div>
            )}

            {gamePhase !== 'waiting' && gamePhase !== 'showdown' && player && !player.folded && (
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => actionMutation.mutate({ type: 'fold' })}
                  disabled={actionMutation.isPending}
                  variant="outline"
                  className="flex-1 h-12 border-red-600 text-red-400 hover:bg-red-900/30"
                  data-testid="button-fold"
                >
                  FOLD
                </Button>
                {canCheck ? (
                  <Button
                    onClick={() => actionMutation.mutate({ type: 'check' })}
                    disabled={actionMutation.isPending}
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-500"
                    data-testid="button-check"
                  >
                    CHECK
                  </Button>
                ) : (
                  <Button
                    onClick={() => actionMutation.mutate({ type: 'call' })}
                    disabled={actionMutation.isPending || (player?.chips || 0) < callAmount}
                    className="flex-1 h-12 bg-green-600 hover:bg-green-500"
                    data-testid="button-call"
                  >
                    CALL ({callAmount})
                  </Button>
                )}
                <Button
                  onClick={() => actionMutation.mutate({ type: 'raise', amount: currentBet * 2 })}
                  disabled={actionMutation.isPending || (player?.chips || 0) < currentBet * 2}
                  className="flex-1 h-12 bg-amber-600 hover:bg-amber-500"
                  data-testid="button-raise"
                >
                  RAISE ({currentBet * 2})
                </Button>
              </div>
            )}

            {(gamePhase === 'showdown' || result) && (
              <Button
                onClick={() => {
                  setGamePhase('waiting');
                  setPlayers([]);
                  setCommunityCards([]);
                  setPot(0);
                  setResult(null);
                }}
                className="w-full h-14 text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600"
                data-testid="button-new-hand"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                NEW HAND
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
