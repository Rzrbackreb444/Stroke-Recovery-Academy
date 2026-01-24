import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Coins, ChevronLeft, Heart, Flame, Apple, 
  Footprints, TreePine, Tent, Search, Eye,
  Moon, Sun, Wind, Snowflake, Trophy, Skull, RefreshCw
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import sasquatchLogo from "../assets/sasquatch-logo.png";

interface GameState {
  health: number;
  warmth: number;
  hunger: number;
  day: number;
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
  weather: 'clear' | 'rain' | 'snow' | 'storm';
  inventory: string[];
  sasquatchDistance: number;
  events: string[];
  result?: 'SURVIVED' | 'CAUGHT' | 'PERISHED';
  winAmount?: number;
}

const ACTIONS = [
  { id: 'forage', name: 'Forage', icon: Search, description: 'Search for food and supplies', risk: 'low' },
  { id: 'fire', name: 'Make Fire', icon: Flame, description: 'Build a fire for warmth', risk: 'medium' },
  { id: 'hide', name: 'Hide', icon: TreePine, description: 'Find cover from the Sasquatch', risk: 'none' },
  { id: 'run', name: 'Run', icon: Footprints, description: 'Sprint to gain distance', risk: 'high' },
  { id: 'trap', name: 'Set Trap', icon: Tent, description: 'Hunt for meat', risk: 'medium' },
  { id: 'rest', name: 'Rest', icon: Moon, description: 'Sleep to regain health (advances day)', risk: 'low' },
];

export default function WildernessSurvival() {
  const { toast } = useToast();
  const [bet, setBet] = useState(25);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isActing, setIsActing] = useState(false);

  const { data: wallet } = useQuery<{ balance: number }>({
    queryKey: ["/api/credits/balance"],
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/survival-start", { bet });
      return res.json();
    },
    onSuccess: (data) => {
      setGameState({
        ...data,
        timeOfDay: 'dawn',
        weather: 'clear',
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to start", description: error.message, variant: "destructive" });
    },
  });

  const actionMutation = useMutation({
    mutationFn: async (action: string) => {
      const res = await apiRequest("POST", "/api/games/survival-action", { 
        action, 
        gameState,
        bet 
      });
      return res.json();
    },
    onSuccess: (data) => {
      setGameState(prev => ({
        ...prev!,
        ...data,
        timeOfDay: getTimeOfDay(data.day),
        weather: getWeather(),
      }));
      setIsActing(false);
      
      if (data.result) {
        queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
        if (data.winAmount > 0) {
          toast({ title: "You Survived!", description: `Won ${data.winAmount} credits!` });
        }
      }
    },
    onError: (error: any) => {
      toast({ title: "Action failed", description: error.message, variant: "destructive" });
      setIsActing(false);
    },
  });

  const getTimeOfDay = (day: number): 'dawn' | 'day' | 'dusk' | 'night' => {
    const times: ('dawn' | 'day' | 'dusk' | 'night')[] = ['dawn', 'day', 'dusk', 'night'];
    return times[day % 4];
  };

  const getWeather = (): 'clear' | 'rain' | 'snow' | 'storm' => {
    const r = Math.random();
    if (r < 0.5) return 'clear';
    if (r < 0.7) return 'rain';
    if (r < 0.85) return 'snow';
    return 'storm';
  };

  const handleAction = (actionId: string) => {
    if (isActing || !gameState || gameState.result) return;
    setIsActing(true);
    actionMutation.mutate(actionId);
  };

  const getTimeIcon = () => {
    switch (gameState?.timeOfDay) {
      case 'dawn': return <Sun className="w-5 h-5 text-orange-400" />;
      case 'day': return <Sun className="w-5 h-5 text-yellow-400" />;
      case 'dusk': return <Sun className="w-5 h-5 text-orange-600" />;
      case 'night': return <Moon className="w-5 h-5 text-blue-400" />;
    }
  };

  const getWeatherIcon = () => {
    switch (gameState?.weather) {
      case 'clear': return <Sun className="w-4 h-4 text-yellow-400" />;
      case 'rain': return <Wind className="w-4 h-4 text-blue-400" />;
      case 'snow': return <Snowflake className="w-4 h-4 text-cyan-300" />;
      case 'storm': return <Wind className="w-4 h-4 text-purple-400" />;
    }
  };

  const getSasquatchProximity = () => {
    if (!gameState) return 'safe';
    if (gameState.sasquatchDistance <= 2) return 'danger';
    if (gameState.sasquatchDistance <= 5) return 'warning';
    return 'safe';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          background: gameState?.timeOfDay === 'night' 
            ? 'radial-gradient(ellipse at 50% 30%, rgba(30, 58, 138, 0.2) 0%, transparent 50%)'
            : 'radial-gradient(ellipse at 50% 30%, rgba(34, 197, 94, 0.15) 0%, transparent 50%)'
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
          <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 text-lg font-bold" data-testid="badge-balance">
            <Coins className="w-5 h-5 mr-2" />
            {wallet?.balance?.toLocaleString() ?? 0}
          </Badge>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 bg-clip-text text-transparent mb-1">
            OUTLAST THE SASQUATCH
          </h1>
          <p className="text-gray-500 text-sm">Survive 7 days in the wilderness</p>
        </div>

        {!gameState ? (
          <Card className="bg-gray-900/80 border-green-600/30">
            <CardContent className="p-8 text-center">
              <img src={sasquatchLogo} alt="Sasquatch" className="w-24 h-24 mx-auto rounded-full border-4 border-green-500 mb-6" />
              
              <h2 className="text-xl font-bold text-white mb-2">Enter the Wilderness</h2>
              <p className="text-gray-400 mb-6">
                Survive 7 days while the Stroked Out Sasquatch hunts you. 
                Manage your health, warmth, and hunger while staying ahead.
              </p>
              
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-gray-400">Entry:</span>
                {[10, 25, 50, 100].map((amount) => (
                  <Button
                    key={amount}
                    variant={bet === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBet(amount)}
                    className={bet === amount ? "bg-green-600" : "border-gray-600"}
                    data-testid={`button-bet-${amount}`}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
              
              <p className="text-green-400 text-sm mb-4">Win 5x your entry if you survive!</p>
              
              <Button
                onClick={() => startMutation.mutate()}
                disabled={!wallet || wallet.balance < bet || startMutation.isPending}
                className="w-full h-14 text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600"
                data-testid="button-start"
              >
                {startMutation.isPending ? "Entering..." : `ENTER WILDERNESS (${bet})`}
              </Button>
            </CardContent>
          </Card>
        ) : gameState.result ? (
          <Card className={`border-2 ${
            gameState.result === 'SURVIVED' 
              ? 'bg-green-900/30 border-green-500' 
              : 'bg-red-900/30 border-red-500'
          }`}>
            <CardContent className="p-8 text-center">
              {gameState.result === 'SURVIVED' ? (
                <>
                  <Trophy className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
                  <h2 className="text-3xl font-black text-green-400 mb-2">YOU SURVIVED!</h2>
                  <p className="text-gray-400 mb-4">You outlasted the Sasquatch for 7 days!</p>
                  <p className="text-2xl font-bold text-green-400">+{gameState.winAmount} Credits</p>
                </>
              ) : (
                <>
                  <Skull className="w-16 h-16 mx-auto text-red-400 mb-4" />
                  <h2 className="text-3xl font-black text-red-400 mb-2">
                    {gameState.result === 'CAUGHT' ? 'CAUGHT!' : 'PERISHED'}
                  </h2>
                  <p className="text-gray-400 mb-4">
                    {gameState.result === 'CAUGHT' 
                      ? 'The Sasquatch found you...' 
                      : 'You did not survive the wilderness...'}
                  </p>
                  <p className="text-gray-500">Survived {gameState.day} day{gameState.day !== 1 ? 's' : ''}</p>
                </>
              )}
              
              <Button
                onClick={() => setGameState(null)}
                className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600"
                data-testid="button-play-again"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Card className="bg-gray-900/80 border-gray-700">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-gray-400">Health</span>
                  </div>
                  <Progress value={gameState.health} className="h-2" />
                  <span className="text-xs text-gray-500">{gameState.health}%</span>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900/80 border-gray-700">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-gray-400">Warmth</span>
                  </div>
                  <Progress value={gameState.warmth} className="h-2" />
                  <span className="text-xs text-gray-500">{gameState.warmth}%</span>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900/80 border-gray-700">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Apple className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-400">Hunger</span>
                  </div>
                  <Progress value={gameState.hunger} className="h-2" />
                  <span className="text-xs text-gray-500">{gameState.hunger}%</span>
                </CardContent>
              </Card>
              
              <Card className={`border ${
                getSasquatchProximity() === 'danger' ? 'bg-red-900/30 border-red-500 animate-pulse' :
                getSasquatchProximity() === 'warning' ? 'bg-orange-900/30 border-orange-500' :
                'bg-gray-900/80 border-gray-700'
              }`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-gray-400">Sasquatch</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(10)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-3 rounded-sm ${
                          i < gameState.sasquatchDistance ? 'bg-green-500' : 'bg-red-500'
                        }`} 
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-3">
                {getTimeIcon()}
                <span className="text-white font-bold">Day {gameState.day} / 7</span>
              </div>
              <div className="flex items-center gap-2">
                {getWeatherIcon()}
                <span className="text-gray-400 text-sm capitalize">{gameState.weather}</span>
              </div>
            </div>

            <Card className="bg-gray-900/80 border-gray-700 mb-4">
              <CardContent className="p-4">
                <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">Event Log</h3>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {gameState.events.slice(-5).map((event, i) => (
                    <p key={i} className="text-sm text-gray-400">{event}</p>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ACTIONS.map((action) => (
                <Button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  disabled={isActing}
                  variant="outline"
                  className={`h-auto py-4 flex flex-col items-center gap-2 border-gray-700 hover:border-green-500 hover:bg-green-900/20 ${
                    isActing ? 'opacity-50' : ''
                  }`}
                  data-testid={`button-${action.id}`}
                >
                  <action.icon className="w-6 h-6 text-green-400" />
                  <span className="font-bold text-white">{action.name}</span>
                  <span className="text-xs text-gray-500">{action.description}</span>
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
