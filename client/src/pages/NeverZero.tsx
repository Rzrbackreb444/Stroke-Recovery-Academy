import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RecoveryHeader from "@/components/RecoveryHeader";
import { 
  Flame, Plus, Trophy, Target, Calendar, Zap, Star, 
  Clock, TrendingUp, Award, CheckCircle2, AlertCircle
} from "lucide-react";

const categories = [
  { value: "movement", label: "Movement", examples: "1 stretch, 1 step, 1 exercise" },
  { value: "therapy", label: "Therapy", examples: "1 minute of speech practice, 1 cognitive exercise" },
  { value: "self_care", label: "Self-Care", examples: "1 healthy meal, 1 glass of water, 1 minute of rest" },
  { value: "mindset", label: "Mindset", examples: "1 positive thought, 1 gratitude moment" },
  { value: "connection", label: "Connection", examples: "1 text, 1 call, 1 conversation" },
  { value: "learning", label: "Learning", examples: "1 page read, 1 lesson watched" },
  { value: "custom", label: "Custom", examples: "Define your own" },
];

export default function NeverZero() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [form, setForm] = useState({
    category: "movement",
    action: "",
    notes: "",
    reps: 1,
  });

  const { data: streakData, isLoading } = useQuery<any>({
    queryKey: ["/api/recovery/never-zero"],
  });

  const logMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/recovery/never-zero", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/never-zero"] });
      setLogDialogOpen(false);
      setForm({ category: "movement", action: "", notes: "", reps: 1 });
      toast({ 
        title: "Streak Saved!", 
        description: "1 rep counts. You did something today!" 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not log your action", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!form.action.trim()) {
      toast({ title: "Required", description: "What did you do today?", variant: "destructive" });
      return;
    }
    logMutation.mutate(form);
  };

  const currentStreak = streakData?.currentStreak || 0;
  const longestStreak = streakData?.longestStreak || 0;
  const totalDays = streakData?.totalDays || 0;
  const logs = streakData?.logs || [];
  const hasLoggedToday = streakData?.loggedToday || false;

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return "Start your streak today!";
    if (streak < 7) return "Building momentum!";
    if (streak < 30) return "You're on fire!";
    if (streak < 100) return "Unstoppable force!";
    return "LEGENDARY!";
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <RecoveryHeader />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-2">
            <Flame className="h-8 w-8 text-orange-500" />
            Never Zero
          </h1>
          <p className="text-gray-400 text-lg">
            "1 rep = saved streak"
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Do one thing. Anything. Just don't hit zero.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/50 p-6 text-center">
            <Flame className="h-12 w-12 text-orange-500 mx-auto mb-3" />
            <div className="text-5xl font-bold text-orange-500">{currentStreak}</div>
            <div className="text-gray-300 mt-1">Day Streak</div>
            <p className="text-gray-400 text-sm mt-2">{getStreakMessage(currentStreak)}</p>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800 p-6 text-center">
            <Trophy className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <div className="text-3xl font-bold">{longestStreak}</div>
            <div className="text-gray-400">Best Streak</div>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800 p-6 text-center">
            <Calendar className="h-10 w-10 text-green-500 mx-auto mb-3" />
            <div className="text-3xl font-bold">{totalDays}</div>
            <div className="text-gray-400">Total Days Active</div>
          </Card>
        </div>

        {hasLoggedToday ? (
          <Card className="bg-green-500/10 border-green-500/50 p-6 mb-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-green-400">Streak Saved for Today!</h3>
            <p className="text-gray-400 mt-2">You did it. Come back tomorrow to keep it going.</p>
          </Card>
        ) : (
          <Card className="bg-orange-500/10 border-orange-500/50 p-6 mb-8 text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-orange-400">Don't Break Your Streak!</h3>
            <p className="text-gray-400 mt-2 mb-4">Log just ONE action to save today's streak.</p>
            <Button 
              onClick={() => setLogDialogOpen(true)} 
              className="bg-orange-500 text-lg px-8 py-6"
              data-testid="button-log-action"
            >
              <Zap className="h-5 w-5 mr-2" />
              Log My 1 Rep
            </Button>
          </Card>
        )}

        <Card className="bg-zinc-900 border-zinc-800 p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            The Never Zero Philosophy
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <h4 className="font-semibold text-orange-400 mb-2">The Rule</h4>
              <p className="text-gray-400 text-sm">
                Every day, do at least ONE thing for your recovery. One rep. One step. One stretch. 
                That's all it takes to save your streak.
              </p>
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <h4 className="font-semibold text-orange-400 mb-2">Why It Works</h4>
              <p className="text-gray-400 text-sm">
                Bad days happen. But doing even the smallest thing keeps you in the game. 
                1 rep compounds over time into massive progress.
              </p>
            </div>
          </div>
        </Card>

        {logs.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {logs.slice(0, 10).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
                  <div className="p-2 rounded bg-orange-500/20">
                    <CheckCircle2 className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.action}</span>
                      <Badge variant="outline" className="text-xs">
                        {categories.find(c => c.value === log.category)?.label || log.category}
                      </Badge>
                    </div>
                    {log.notes && <p className="text-gray-400 text-sm mt-1">{log.notes}</p>}
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(log.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                Log Your 1 Rep
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1" data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div>
                          <div>{c.label}</div>
                          <div className="text-xs text-gray-500">{c.examples}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>What did you do? *</Label>
                <Input
                  placeholder="e.g., Did 1 arm stretch, Drank a glass of water..."
                  value={form.action}
                  onChange={(e) => setForm({ ...form, action: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                  data-testid="input-action"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Remember: 1 rep counts. Anything is better than nothing.
                </p>
              </div>

              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="How did you feel? Any wins to celebrate?"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                  rows={2}
                />
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full bg-orange-500 text-lg py-6"
                disabled={logMutation.isPending}
                data-testid="button-save-action"
              >
                {logMutation.isPending ? "Saving..." : "Save My Streak!"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
