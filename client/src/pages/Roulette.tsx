import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, ChevronLeft, RotateCcw, Trophy, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import sasquatchLogo from "../assets/sasquatch-logo.png";

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const BLACK_NUMBERS = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

type BetType = 'number' | 'red' | 'black' | 'odd' | 'even' | '1-18' | '19-36' | '1st12' | '2nd12' | '3rd12';

interface Bet {
  type: BetType;
  value: number | null;
  amount: number;
}

export default function Roulette() {
  const { toast } = useToast();
  const [bets, setBets] = useState<Bet[]>([]);
  const [chipAmount, setChipAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);

  const { data: wallet } = useQuery<{ balance: number }>({
    queryKey: ["/api/credits/balance"],
  });

  const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);

  const spinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/roulette-spin", { bets });
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data.result);
      setLastWin(data.totalWin);
      
      if (data.totalWin > 0) {
        toast({
          title: "Winner!",
          description: `Ball landed on ${data.result}! You won ${data.totalWin} credits!`,
        });
      } else {
        toast({
          title: `Ball landed on ${data.result}`,
          description: "No wins this round",
          variant: "destructive",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Spin failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSpin = () => {
    if (spinning || bets.length === 0 || !wallet || wallet.balance < totalBet) return;
    
    setSpinning(true);
    setResult(null);
    setLastWin(null);
    
    const newRotation = wheelRotation + 1440 + Math.random() * 360;
    setWheelRotation(newRotation);
    
    setTimeout(() => {
      setSpinning(false);
      spinMutation.mutate();
    }, 4000);
  };

  const placeBet = (type: BetType, value: number | null = null) => {
    if (!wallet || wallet.balance < totalBet + chipAmount) return;
    setBets([...bets, { type, value, amount: chipAmount }]);
  };

  const clearBets = () => {
    setBets([]);
    setResult(null);
    setLastWin(null);
  };

  const getNumberColor = (n: number): string => {
    if (n === 0) return 'bg-[#C9941A]';
    return RED_NUMBERS.includes(n) ? 'bg-red-600' : 'bg-[#1a1a1a]';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)'
        }}
      />

      <div className="relative z-10 p-4 md:p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/games">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" data-testid="button-back">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Games
            </Button>
          </Link>
          <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 text-lg font-bold" data-testid="badge-balance">
            <Coins className="w-5 h-5 mr-2" />
            {wallet?.balance?.toLocaleString() ?? 0}
          </Badge>
        </div>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={sasquatchLogo} alt="Sasquatch" className="w-12 h-12 rounded-full border-2 border-green-500" />
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 bg-clip-text text-transparent">
              SASQUATCH ROULETTE
            </h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-[#1a1a1a]/80 border-green-600/30">
            <CardContent className="p-6">
              <div className="relative w-64 h-64 mx-auto mb-6">
                <div 
                  className="w-full h-full rounded-full border-8 border-amber-700 bg-gradient-to-br from-amber-900 to-amber-800 flex items-center justify-center shadow-2xl"
                  style={{
                    transform: `rotate(${wheelRotation}deg)`,
                    transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                  }}
                >
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white shadow-lg" />
                  </div>
                  
                  {[...Array(37)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute text-[8px] font-bold text-white"
                      style={{
                        transform: `rotate(${i * (360/37)}deg) translateY(-100px)`,
                        color: i === 0 ? '#22c55e' : RED_NUMBERS.includes(i) ? '#ef4444' : '#1f2937'
                      }}
                    >
                      {i}
                    </div>
                  ))}
                </div>
                
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-4 h-6 bg-yellow-400 clip-triangle" />
              </div>

              {result !== null && (
                <div className="text-center mb-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getNumberColor(result)} text-white text-2xl font-bold shadow-lg`}>
                    {result}
                  </div>
                  {lastWin !== null && lastWin > 0 && (
                    <div className="mt-2 text-[#C9941A] font-bold text-xl flex items-center justify-center gap-2">
                      <Trophy className="w-5 h-5" />
                      +{lastWin.toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-center gap-2 mb-4">
                {[5, 10, 25, 50, 100].map((amount) => (
                  <Button
                    key={amount}
                    variant={chipAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChipAmount(amount)}
                    className={chipAmount === amount ? "bg-[#C9941A]" : "border-gray-600"}
                    data-testid={`button-chip-${amount}`}
                  >
                    {amount}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSpin}
                  disabled={spinning || bets.length === 0 || !wallet || wallet.balance < totalBet}
                  className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600"
                  data-testid="button-spin"
                >
                  {spinning ? "SPINNING..." : `SPIN (${totalBet})`}
                </Button>
                <Button
                  onClick={clearBets}
                  variant="outline"
                  className="h-14 px-4 border-gray-600"
                  disabled={spinning}
                  data-testid="button-clear"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a]/80 border-green-600/30">
            <CardContent className="p-4">
              <div className="grid grid-cols-13 gap-1 mb-4">
                <div 
                  onClick={() => !spinning && placeBet('number', 0)}
                  className="col-span-1 row-span-3 bg-[#C9941A] hover:bg-[#C9941A] rounded flex items-center justify-center text-white font-bold cursor-pointer h-24 transition-colors"
                  data-testid="bet-0"
                >
                  0
                </div>
                {[...Array(36)].map((_, i) => {
                  const n = i + 1;
                  return (
                    <div
                      key={n}
                      onClick={() => !spinning && placeBet('number', n)}
                      className={`${getNumberColor(n)} hover:opacity-80 rounded flex items-center justify-center text-white text-sm font-bold cursor-pointer h-8 transition-opacity`}
                      data-testid={`bet-${n}`}
                    >
                      {n}
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <Button
                  onClick={() => !spinning && placeBet('1st12')}
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                  disabled={spinning}
                >
                  1st 12
                </Button>
                <Button
                  onClick={() => !spinning && placeBet('2nd12')}
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                  disabled={spinning}
                >
                  2nd 12
                </Button>
                <Button
                  onClick={() => !spinning && placeBet('3rd12')}
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                  disabled={spinning}
                >
                  3rd 12
                </Button>
              </div>

              <div className="grid grid-cols-6 gap-2 mb-4">
                <Button
                  onClick={() => !spinning && placeBet('1-18')}
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                  disabled={spinning}
                >
                  1-18
                </Button>
                <Button
                  onClick={() => !spinning && placeBet('even')}
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                  disabled={spinning}
                >
                  EVEN
                </Button>
                <Button
                  onClick={() => !spinning && placeBet('red')}
                  className="bg-red-600 hover:bg-red-500"
                  disabled={spinning}
                >
                  RED
                </Button>
                <Button
                  onClick={() => !spinning && placeBet('black')}
                  className="bg-gray-800 hover:bg-gray-700"
                  disabled={spinning}
                >
                  BLACK
                </Button>
                <Button
                  onClick={() => !spinning && placeBet('odd')}
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                  disabled={spinning}
                >
                  ODD
                </Button>
                <Button
                  onClick={() => !spinning && placeBet('19-36')}
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                  disabled={spinning}
                >
                  19-36
                </Button>
              </div>

              {bets.length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <h4 className="text-sm text-gray-400 mb-2">Current Bets:</h4>
                  <div className="flex flex-wrap gap-2">
                    {bets.map((bet, i) => (
                      <Badge key={i} variant="outline" className="border-green-500/50 text-[#C9941A]">
                        {bet.type === 'number' ? `#${bet.value}` : bet.type}: {bet.amount}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
