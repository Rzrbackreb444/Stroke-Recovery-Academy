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
  Flame, Trophy, Target, Calendar, Zap,
  TrendingUp, CheckCircle2, AlertCircle, MessageCircle, Loader2, Send,
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

type SasquatchReport = {
  message: string;
  streak: number;
  todayCount: number;
  todayLogs: Array<{ id: number; action: string; category: string; notes: string | null; createdAt: string }>;
};

export default function NeverZero() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [form, setForm] = useState({
    category: "movement",
    action: "",
    notes: "",
    reps: 1,
  });

  const { data: streakData } = useQuery<any>({
    queryKey: ["/api/recovery/never-zero"],
    enabled: isAuthenticated,
  });

  // Sasquatch's daily accountability report — fetched once per day per user.
  // Stays fresh after every new log via invalidation in the mutation onSuccess.
  const reportMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/recovery/never-zero/report", {});
      return (await res.json()) as SasquatchReport;
    },
    onError: (e: any) => {
      if (e?.status === 401) {
        toast({
          title: "Sign in to send your report",
          description: "Sasquatch only reads check-ins from signed-in survivors.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Couldn't reach Sasquatch",
        description: String(e?.message ?? "Try again in a moment."),
        variant: "destructive",
      });
    },
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
        description: "1 rep counts. Sending your report to Sasquatch…",
      });
      // Auto-trigger Sasquatch report so the survivor sees the accountability
      // loop close immediately — the whole point of this feature.
      reportMut.mutate();
    },
    onError: (e: any) => {
      if (e?.status === 401) {
        toast({
          title: "Sign in to log your rep",
          description: "Your session expired. Sign in and try again.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Couldn't save your rep",
        description: String(e?.message ?? "Try again in a moment."),
        variant: "destructive",
      });
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
  const report = reportMut.data;

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return "Start your streak today!";
    if (streak < 7) return "Building momentum!";
    if (streak < 30) return "You're on fire!";
    if (streak < 100) return "Unstoppable force!";
    return "LEGENDARY!";
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoveryHeader />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-2">
            <Flame className="h-8 w-8 text-[#C9941A]" />
            Never Zero
          </h1>
          <p className="text-gray-300 text-lg italic">
            For survivors who are serious about recovery and want accountability.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Do one thing. Anything. Just don't hit zero. Sasquatch reads every check-in.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-[#C9941A]/50 p-6 text-center">
            <Flame className="h-12 w-12 text-[#C9941A] mx-auto mb-3" />
            <div className="text-5xl font-bold text-[#C9941A]" data-testid="text-current-streak">{currentStreak}</div>
            <div className="text-gray-300 mt-1">Day Streak</div>
            <p className="text-gray-400 text-sm mt-2">{getStreakMessage(currentStreak)}</p>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#333] p-6 text-center">
            <Trophy className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <div className="text-3xl font-bold">{longestStreak}</div>
            <div className="text-gray-400">Best Streak</div>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#333] p-6 text-center">
            <Calendar className="h-10 w-10 text-[#C9941A] mx-auto mb-3" />
            <div className="text-3xl font-bold">{totalDays}</div>
            <div className="text-gray-400">Total Days Active</div>
          </Card>
        </div>

        {hasLoggedToday ? (
          <Card className="bg-[#C9941A]/10 border-green-500/50 p-6 mb-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-[#C9941A] mx-auto mb-3" />
            <h3 className="text-xl font-bold text-[#C9941A]">Streak Saved for Today!</h3>
            <p className="text-gray-400 mt-2">You did it. Come back tomorrow to keep it going.</p>
            {!report && !reportMut.isPending && (
              <Button
                onClick={() => reportMut.mutate()}
                size="sm"
                variant="outline"
                className="mt-4 border-[#C9941A]/50 text-[#C9941A] hover:bg-[#C9941A]/10"
                data-testid="button-fetch-sasquatch-report"
              >
                <Send className="h-4 w-4 mr-2" />
                Send today's report to Sasquatch
              </Button>
            )}
          </Card>
        ) : (
          <Card className="bg-[#C9941A]/10 border-[#C9941A]/50 p-6 mb-8 text-center">
            <AlertCircle className="h-12 w-12 text-[#C9941A] mx-auto mb-3" />
            <h3 className="text-xl font-bold text-[#C9941A]">Don't Break Your Streak!</h3>
            <p className="text-gray-400 mt-2 mb-4">Log just ONE action to save today's streak — Sasquatch is waiting.</p>
            <Button
              onClick={() => setLogDialogOpen(true)}
              className="bg-[#C9941A] text-lg px-8 py-6"
              data-testid="button-log-action"
            >
              <Zap className="h-5 w-5 mr-2" />
              Log My 1 Rep
            </Button>
          </Card>
        )}

        {/* ── Sasquatch's daily report ───────────────────────────── */}
        {(reportMut.isPending || report) && (
          <Card className="bg-[#1a1a1a] border-[#C9941A]/40 p-6 mb-8" data-testid="card-sasquatch-report">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#C9941A]/15 border border-[#C9941A]/40 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-5 w-5 text-[#C9941A]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-[#C9941A]">Sasquatch's Report</h3>
                  {report && (
                    <Badge className="bg-[#C9941A]/20 text-[#C9941A] border border-[#C9941A]/40 text-xs">
                      Day {report.streak} · {report.todayCount} {report.todayCount === 1 ? "rep" : "reps"} today
                    </Badge>
                  )}
                </div>
                {reportMut.isPending ? (
                  <div className="flex items-center gap-2 text-white/60">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm italic">Sasquatch is reviewing your day…</span>
                  </div>
                ) : report ? (
                  <p className="text-white/90 leading-relaxed whitespace-pre-line" data-testid="text-sasquatch-message">
                    {report.message}
                  </p>
                ) : null}
              </div>
            </div>
            {report && report.todayLogs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs uppercase tracking-wider text-white/50 mb-2">Today's reps</p>
                <ul className="space-y-1">
                  {report.todayLogs.map((l) => (
                    <li key={l.id} className="text-sm text-white/80 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#C9941A] flex-shrink-0 mt-0.5" />
                      <span>{l.action}</span>
                      <Badge variant="outline" className="text-xs ml-auto">
                        {categories.find((c) => c.value === l.category)?.label || l.category}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        <Card className="bg-[#1a1a1a] border-[#333] p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-[#C9941A]" />
            The Never Zero Philosophy
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#1a1a1a]/50 rounded-lg">
              <h4 className="font-semibold text-[#C9941A] mb-2">The Rule</h4>
              <p className="text-gray-400 text-sm">
                Every day, do at least ONE thing for your recovery. One rep. One step. One stretch.
                That's all it takes to save your streak.
              </p>
            </div>
            <div className="p-4 bg-[#1a1a1a]/50 rounded-lg">
              <h4 className="font-semibold text-[#C9941A] mb-2">Why It Works</h4>
              <p className="text-gray-400 text-sm">
                Bad days happen. But doing even the smallest thing keeps you in the game.
                1 rep compounds over time into massive progress — and Sasquatch holds you to it.
              </p>
            </div>
          </div>
        </Card>

        {logs.length > 0 && (
          <Card className="bg-[#1a1a1a] border-[#333] p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#C9941A]" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {logs.slice(0, 10).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-[#1a1a1a]/50 rounded-lg">
                  <div className="p-2 rounded bg-[#C9941A]/20">
                    <CheckCircle2 className="h-4 w-4 text-[#C9941A]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.action}</span>
                      <Badge variant="outline" className="text-xs">
                        {categories.find(c => c.value === log.difficulty)?.label || log.difficulty}
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
          <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#C9941A]" />
                Log Your 1 Rep
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#333] mt-1" data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#333]">
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
                  className="bg-[#1a1a1a] border-[#333] mt-1"
                  data-testid="input-action"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Sasquatch sees this. Be honest — 1 rep is enough.
                </p>
              </div>

              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="How did you feel? Any wins to celebrate?"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="bg-[#1a1a1a] border-[#333] mt-1"
                  rows={2}
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full bg-[#C9941A] text-lg py-6"
                disabled={logMutation.isPending}
                data-testid="button-save-action"
              >
                {logMutation.isPending ? "Saving…" : "Save & report to Sasquatch"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
