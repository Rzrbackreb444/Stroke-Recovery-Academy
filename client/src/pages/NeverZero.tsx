import { useEffect, useState } from "react";
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
  Flame, Trophy, Target, Calendar, Zap, MessageCircle, Loader2, RefreshCw,
  CheckCircle2, AlertCircle, ArrowRight, History, Award, Sparkles,
  Footprints, Droplet, Brain, Heart, Users, BookOpen, PartyPopper,
} from "lucide-react";

const categories = [
  { value: "movement", label: "Movement" },
  { value: "therapy", label: "Therapy" },
  { value: "self_care", label: "Self-Care" },
  { value: "mindset", label: "Mindset" },
  { value: "connection", label: "Connection" },
  { value: "learning", label: "Learning" },
  { value: "custom", label: "Custom" },
];

type AuditPayload = {
  auditId: number | null;
  auditDate: string;
  message: string;
  streak: number;
  longestStreak: number;
  totalDays: number;
  todayCount: number;
  categoriesCovered: string[];
  categoriesMissed: string[];
  stoodOut: string | null;
  missing: string | null;
  verdict: string | null;
  tomorrow: string | null;
  todayLogs: Array<{ id: number; action: string; category: string; notes: string | null; createdAt: string }>;
  streakBand: 'spark' | 'ember' | 'blaze' | 'wildfire' | 'legend';
  fromCache: boolean;
};

const TIERS: Record<AuditPayload['streakBand'], { label: string; min: number; next: number | null; color: string; tagline: string }> = {
  spark:    { label: "Spark",    min: 0,   next: 7,   color: "#E2741B", tagline: "Lighting the fire." },
  ember:    { label: "Ember",    min: 7,   next: 14,  color: "#E07B00", tagline: "Heat is building." },
  blaze:    { label: "Blaze",    min: 14,  next: 30,  color: "#F97316", tagline: "Burning steady." },
  wildfire: { label: "Wildfire", min: 30,  next: 100, color: "#EF4444", tagline: "Unstoppable now." },
  legend:   { label: "Legend",   min: 100, next: null, color: "#FACC15", tagline: "Living diploma." },
};

const TIER_ORDER: AuditPayload['streakBand'][] = ['spark', 'ember', 'blaze', 'wildfire', 'legend'];

const TIER_CELEBRATION: Record<AuditPayload['streakBand'], { headline: string; quote: string }> = {
  spark:    { headline: "The Spark is lit.", quote: "Every fire I've ever seen started exactly like this. One rep. One day. You showed up." },
  ember:    { headline: "Day 7 — that's an Ember now.", quote: "A week of showing up rewires more than a month of thinking about it. Don't let the heat die." },
  blaze:    { headline: "Day 14 — Blaze tier.", quote: "Two weeks. The brain is officially listening. This is where most survivors quit. You didn't." },
  wildfire: { headline: "Day 30 — Wildfire.", quote: "Thirty days. Habit. Identity. You're not 'trying to recover' anymore. You're a survivor who recovers daily. Period." },
  legend:   { headline: "Day 100 — Legend.", quote: "100 days. You are the proof now. Somebody on day 1 is going to read your story and find their fire. Pass it forward." },
};

const catLabel = (v: string) => categories.find((c) => c.value === v)?.label ?? v;

type QuickLogPreset = { label: string; category: string; action: string; icon: any };
const QUICK_LOG_PRESETS: QuickLogPreset[] = [
  { label: "Walked",     category: "movement",   action: "Walked — no zero day",        icon: Footprints },
  { label: "Stretched",  category: "movement",   action: "Stretched the affected side", icon: Sparkles },
  { label: "Hydrated",   category: "self_care",  action: "Drank water — brain fuel",     icon: Droplet },
  { label: "Breathwork", category: "mindset",    action: "Breathwork — 4-4-8 reset",     icon: Brain },
  { label: "Read",       category: "learning",   action: "Read recovery material",       icon: BookOpen },
  { label: "Reached out",category: "connection", action: "Reached out to another survivor", icon: Users },
  { label: "Mirror therapy", category: "therapy", action: "Mirror therapy reps",        icon: Heart },
];

export default function NeverZero() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [form, setForm] = useState({ category: "movement", action: "", notes: "", reps: 1 });
  const [celebrationTier, setCelebrationTier] = useState<AuditPayload['streakBand'] | null>(null);
  const [quickLogPending, setQuickLogPending] = useState<string | null>(null);

  const { data: streakData } = useQuery<any>({
    queryKey: ["/api/recovery/never-zero"],
    enabled: isAuthenticated,
  });

  const { data: historyData } = useQuery<{ audits: AuditPayload[] }>({
    queryKey: ["/api/recovery/never-zero/audit"],
    enabled: isAuthenticated,
  });

  const reportMut = useMutation({
    mutationFn: async (force: boolean = false) => {
      const res = await apiRequest("POST", "/api/recovery/never-zero/report", { force });
      return (await res.json()) as AuditPayload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/never-zero/audit"] });
    },
    onError: (e: any) => {
      if (e?.status === 401) {
        toast({ title: "Sign in to send your report", description: "Sasquatch only reads check-ins from signed-in survivors.", variant: "destructive" });
        return;
      }
      toast({ title: "Couldn't reach Sasquatch", description: String(e?.message ?? "Try again in a moment."), variant: "destructive" });
    },
  });

  const logMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/recovery/never-zero", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/never-zero"] });
      setLogDialogOpen(false);
      setForm({ category: "movement", action: "", notes: "", reps: 1 });
      setQuickLogPending(null);
      toast({ title: "Rep logged", description: "Sending today's audit to Sasquatch…" });
      reportMut.mutate(true); // force-refresh the audit since reps changed
    },
    onError: (e: any) => {
      setQuickLogPending(null);
      if (e?.status === 401) {
        toast({ title: "Sign in to log your rep", variant: "destructive" });
        return;
      }
      toast({ title: "Couldn't save your rep", description: String(e?.message ?? ""), variant: "destructive" });
    },
  });

  const handleQuickLog = (preset: QuickLogPreset) => {
    if (logMutation.isPending) return;
    setQuickLogPending(preset.label);
    logMutation.mutate({ category: preset.category, action: preset.action, notes: "", reps: 1 });
  };

  // Auto-fetch today's audit on mount so signed-in survivors see Sasquatch's
  // voice immediately. Cached server-side so this is one cheap DB read on
  // re-visits within the same day.
  useEffect(() => {
    if (isAuthenticated && !reportMut.data && !reportMut.isPending) {
      reportMut.mutate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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
  const hasLoggedToday = streakData?.loggedToday || false;
  const audit = reportMut.data;
  const currentBand: AuditPayload['streakBand'] = audit?.streakBand ?? (currentStreak >= 100 ? 'legend' : currentStreak >= 30 ? 'wildfire' : currentStreak >= 14 ? 'blaze' : currentStreak >= 7 ? 'ember' : 'spark');
  const tier = TIERS[currentBand];
  const nextTier = tier.next != null ? Object.values(TIERS).find((t) => t.min === tier.next) : null;
  const toNext = tier.next != null ? Math.max(0, tier.next - currentStreak) : 0;
  const tierProgress = tier.next != null ? Math.min(100, Math.round(((currentStreak - tier.min) / (tier.next - tier.min)) * 100)) : 100;
  const history = (historyData?.audits ?? []).filter((a) => a.auditDate !== audit?.auditDate);

  // Tier-crossing celebration. Compare current band against the highest band
  // we've previously shown (in localStorage) — fire only when crossing UP.
  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return;
    if (currentStreak < 1) return;
    const KEY = "nz-tier-seen";
    const prev = window.localStorage.getItem(KEY) as AuditPayload['streakBand'] | null;
    const prevIdx = prev ? TIER_ORDER.indexOf(prev) : -1;
    const curIdx = TIER_ORDER.indexOf(currentBand);
    if (prevIdx >= 0 && curIdx > prevIdx) {
      setCelebrationTier(currentBand);
    }
    if (curIdx > prevIdx) {
      window.localStorage.setItem(KEY, currentBand);
    }
  }, [currentBand, currentStreak, isAuthenticated]);

  // Weekly recap — last 7 audits (today included), aggregated.
  const weekAudits = [audit, ...history].filter(Boolean).slice(0, 7) as AuditPayload[];
  const weekReps = weekAudits.reduce((s, a) => s + (a.todayCount || 0), 0);
  const weekCategoryUnion = Array.from(new Set(weekAudits.flatMap((a) => a.categoriesCovered ?? [])));

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoveryHeader />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-1">
            <Flame className="h-8 w-8" style={{ color: tier.color }} />
            Never Zero
          </h1>
          <p className="text-gray-300 italic">Daily check-in. Sasquatch audits. You stay accountable.</p>
        </div>

        {/* Tier + streak hero */}
        <Card className="mb-6 p-6 border" style={{ background: `linear-gradient(135deg, ${tier.color}22, #1a1a1a)`, borderColor: `${tier.color}55` }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ background: `${tier.color}25`, border: `1px solid ${tier.color}` }}>
                <Award className="h-7 w-7" style={{ color: tier.color }} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: tier.color }}>{tier.label} tier</div>
                <div className="text-4xl font-black" data-testid="text-current-streak" style={{ color: tier.color }}>{currentStreak}<span className="text-base font-semibold text-white/60 ml-2">day streak</span></div>
                <div className="text-sm text-white/70 italic">{tier.tagline}</div>
              </div>
            </div>
            <div className="text-right text-sm text-white/80 space-y-1">
              <div className="flex items-center gap-2 justify-end"><Trophy className="h-4 w-4 text-yellow-500" /> Best: <span className="font-bold text-white">{longestStreak}</span></div>
              <div className="flex items-center gap-2 justify-end"><Calendar className="h-4 w-4" style={{ color: tier.color }} /> Total days: <span className="font-bold text-white">{totalDays}</span></div>
            </div>
          </div>
          {nextTier && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                <span>{toNext} more to <span className="font-semibold" style={{ color: nextTier.color }}>{nextTier.label}</span></span>
                <span>{currentStreak} / {tier.next}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full transition-all" style={{ width: `${tierProgress}%`, background: tier.color }} />
              </div>
            </div>
          )}
        </Card>

        {/* Check-in CTA */}
        {hasLoggedToday ? (
          <Card className="mb-6 p-5 bg-[#1a1a1a] border-green-500/40 flex items-center gap-3">
            <CheckCircle2 className="h-7 w-7 text-green-500 shrink-0" />
            <div className="flex-1">
              <div className="font-bold">Today's check-in is in.</div>
              <div className="text-sm text-white/60">Sasquatch is reading your reps below. Add another anytime to deepen the audit.</div>
            </div>
            <Button onClick={() => setLogDialogOpen(true)} variant="outline" className="border-[#E2741B]/50 text-[#E2741B]" data-testid="button-add-another">
              <Zap className="h-4 w-4 mr-2" /> Add another
            </Button>
          </Card>
        ) : (
          <Card className="mb-6 p-5 bg-[#E2741B]/10 border-[#E2741B]/50 flex items-center gap-3">
            <AlertCircle className="h-7 w-7 text-[#E2741B] shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-[#E2741B]">No rep yet today.</div>
              <div className="text-sm text-white/70">Log one — anything — and Sasquatch will audit your day.</div>
            </div>
            <Button onClick={() => setLogDialogOpen(true)} className="bg-[#E2741B] text-black font-bold" data-testid="button-log-action">
              <Zap className="h-4 w-4 mr-2" /> Log my 1 rep
            </Button>
          </Card>
        )}

        {/* Quick-log chips — one tap, no dialog. Reduces friction to ~zero. */}
        <Card className="mb-6 p-4 bg-[#1a1a1a] border-[#333]">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-[#E2741B]" />
            <h3 className="text-sm font-semibold text-white/90">Quick-log a rep</h3>
            <span className="text-xs text-white/50">— one tap, Sasquatch audits the moment you log</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_LOG_PRESETS.map((p) => {
              const Icon = p.icon;
              const pending = quickLogPending === p.label;
              return (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLog(p)}
                  disabled={logMutation.isPending}
                  className="border-[#E2741B]/40 text-white/85 hover:text-[#E2741B] hover:border-[#E2741B]"
                  data-testid={`quick-log-${p.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Icon className="h-3.5 w-3.5 mr-1.5" />}
                  {p.label}
                </Button>
              );
            })}
          </div>
        </Card>

        {/* Sasquatch audit */}
        <Card className="mb-6 p-6 bg-[#1a1a1a] border-[#E2741B]/40" data-testid="card-sasquatch-audit">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-[#E2741B]/15 border border-[#E2741B]/40 flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5 text-[#E2741B]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-[#E2741B]">Today's Sasquatch Audit</h2>
                {audit && (
                  <Badge className="bg-[#E2741B]/20 text-[#E2741B] border border-[#E2741B]/40 text-xs">
                    Day {audit.streak} · {audit.todayCount} {audit.todayCount === 1 ? "rep" : "reps"}
                  </Badge>
                )}
                {audit?.fromCache && <span className="text-[10px] text-white/40 uppercase tracking-wider">cached</span>}
              </div>
              <p className="text-xs text-white/50 mt-0.5">Honest accountability from a 7-year survivor — not a textbook.</p>
            </div>
            {audit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => reportMut.mutate(true)}
                disabled={reportMut.isPending}
                className="text-white/60 hover:text-[#E2741B]"
                data-testid="button-refresh-audit"
              >
                <RefreshCw className={`h-4 w-4 ${reportMut.isPending ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>

          {reportMut.isPending && !audit ? (
            <div className="flex items-center gap-2 text-white/60 py-6 justify-center">
              <Loader2 className="h-5 w-5 animate-spin" /> Sasquatch is reviewing your day…
            </div>
          ) : audit && audit.todayCount === 0 ? (
            <p className="text-white/70 italic py-2">{audit.message}</p>
          ) : audit ? (
            <div className="space-y-4">
              {audit.stoodOut && (
                <AuditLine label="What stood out" tone="positive" body={audit.stoodOut} />
              )}
              {audit.missing && (
                <AuditLine label="What's missing" tone="warn" body={audit.missing} />
              )}
              {audit.verdict && (
                <AuditLine label="Verdict" tone="verdict" body={audit.verdict} />
              )}
              {audit.tomorrow && (
                <AuditLine label="Tomorrow's 1 rep" tone="next" body={audit.tomorrow} />
              )}

              {/* Coverage */}
              <div className="pt-3 border-t border-white/10">
                <div className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Category coverage today</div>
                <div className="flex flex-wrap gap-1.5">
                  {audit.categoriesCovered.map((c) => (
                    <Badge key={c} className="bg-green-500/15 text-green-300 border border-green-500/30 text-xs" data-testid={`chip-covered-${c}`}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> {catLabel(c)}
                    </Badge>
                  ))}
                  {audit.categoriesMissed.filter((c) => c !== 'custom').map((c) => (
                    <Badge key={c} variant="outline" className="border-white/20 text-white/40 text-xs" data-testid={`chip-missed-${c}`}>
                      {catLabel(c)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Today's reps list */}
              {audit.todayLogs.length > 0 && (
                <div className="pt-3 border-t border-white/10">
                  <div className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Today's reps</div>
                  <ul className="space-y-1.5">
                    {audit.todayLogs.map((l) => (
                      <li key={l.id} className="text-sm text-white/85 flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#E2741B] shrink-0 mt-0.5" />
                        <span className="flex-1">{l.action}{l.notes && <span className="text-white/50 italic"> — {l.notes}</span>}</span>
                        <Badge variant="outline" className="text-[10px] border-white/20 text-white/60">{catLabel(l.category)}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-white/60 italic">Log your first rep today to get audited.</p>
          )}
        </Card>

        {/* Weekly recap — last 7 audited days at a glance. */}
        {weekAudits.length >= 2 && (
          <Card className="mb-6 p-5 bg-[#1a1a1a] border-[#333]">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#E2741B]" /> Last {weekAudits.length} audited days
              </h3>
              <div className="flex items-center gap-3 text-xs text-white/70">
                <span><span className="font-bold text-white">{weekReps}</span> reps</span>
                <span>·</span>
                <span><span className="font-bold text-white">{weekCategoryUnion.length}</span> categories touched</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {weekAudits.slice().reverse().map((a) => {
                const intensity = Math.min(100, (a.todayCount || 0) * 25);
                return (
                  <div
                    key={a.auditDate}
                    className="aspect-square rounded border flex flex-col items-center justify-center text-[10px] gap-0.5"
                    style={{
                      background: a.todayCount > 0 ? `rgba(226,116,27, ${0.15 + intensity / 400})` : "rgba(255,255,255,0.04)",
                      borderColor: a.todayCount > 0 ? "rgba(226,116,27, 0.5)" : "rgba(255,255,255,0.1)",
                    }}
                    title={`${a.auditDate} — ${a.todayCount} reps`}
                    data-testid={`recap-${a.auditDate}`}
                  >
                    <span className="text-white/60 font-mono">{a.auditDate.slice(5)}</span>
                    <span className="text-[#E2741B] font-bold">{a.todayCount}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* History timeline */}
        {history.length > 0 && (
          <Card className="mb-6 p-6 bg-[#1a1a1a] border-[#333]">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-[#E2741B]" /> Sasquatch's Log
              <span className="text-xs text-white/40 font-normal ml-2">past audits, in his own words</span>
            </h3>
            <div className="space-y-4">
              {history.slice(0, 10).map((a) => (
                <div key={a.auditId ?? a.auditDate} className="border-l-2 border-[#E2741B]/40 pl-4" data-testid={`history-${a.auditDate}`}>
                  <div className="flex items-center gap-2 mb-1 text-xs text-white/50">
                    <span className="font-mono">{a.auditDate}</span>
                    <span>·</span>
                    <span>Day {a.streak}</span>
                    <span>·</span>
                    <span>{a.todayCount} {a.todayCount === 1 ? "rep" : "reps"}</span>
                  </div>
                  {a.verdict && <p className="text-sm text-white/85 leading-relaxed">{a.verdict}</p>}
                  {a.tomorrow && <p className="text-xs text-[#E2741B]/80 mt-1 flex items-center gap-1"><ArrowRight className="h-3 w-3" />{a.tomorrow}</p>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Philosophy strip — kept short */}
        <Card className="mb-6 p-5 bg-[#1a1a1a] border-[#333]">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><Target className="h-4 w-4 text-[#E2741B]" /> The rule</h3>
          <p className="text-sm text-white/70">
            Do at least <span className="text-[#E2741B] font-semibold">one</span> thing for your recovery every day. One rep saves the streak. Sasquatch reads it. Sasquatch reports back. That's the loop.
          </p>
        </Card>

        {/* Tier-crossing celebration — fires once per band crossing, persisted in localStorage. */}
        <Dialog open={!!celebrationTier} onOpenChange={(open) => !open && setCelebrationTier(null)}>
          <DialogContent className="bg-[#0D0D0D] border-2 max-w-md text-white" style={{ borderColor: celebrationTier ? TIERS[celebrationTier].color : '#E2741B' }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <PartyPopper className="h-6 w-6" style={{ color: celebrationTier ? TIERS[celebrationTier].color : '#E2741B' }} />
                {celebrationTier ? TIER_CELEBRATION[celebrationTier].headline : 'New tier'}
              </DialogTitle>
            </DialogHeader>
            {celebrationTier && (
              <div className="space-y-4 mt-2">
                <div
                  className="h-20 w-20 rounded-full mx-auto flex items-center justify-center"
                  style={{ background: `${TIERS[celebrationTier].color}25`, border: `2px solid ${TIERS[celebrationTier].color}` }}
                >
                  <Award className="h-10 w-10" style={{ color: TIERS[celebrationTier].color }} />
                </div>
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: TIERS[celebrationTier].color }}>
                    {TIERS[celebrationTier].label} tier unlocked
                  </div>
                  <div className="text-sm text-white/60 italic mt-1">{TIERS[celebrationTier].tagline}</div>
                </div>
                <p className="text-sm leading-relaxed text-white/85 italic border-l-2 pl-4" style={{ borderColor: TIERS[celebrationTier].color }}>
                  "{TIER_CELEBRATION[celebrationTier].quote}"
                </p>
                <p className="text-xs text-white/40 text-center">— Nick "Sasquatch" Kremers</p>
                <Button
                  onClick={() => setCelebrationTier(null)}
                  className="w-full font-bold text-black"
                  style={{ backgroundColor: TIERS[celebrationTier].color }}
                  data-testid="button-celebration-continue"
                >
                  Keep the streak alive
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Log dialog */}
        <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
          <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-[#E2741B]" /> Log your 1 rep</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#333] mt-1" data-testid="select-category"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#333]">
                    {categories.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>What did you do? *</Label>
                <Input placeholder="e.g., 1 arm stretch, drank a glass of water…" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} className="bg-[#1a1a1a] border-[#333] mt-1" data-testid="input-action" />
                <p className="text-xs text-white/50 mt-1 flex items-center gap-1"><Sparkles className="h-3 w-3" />Sasquatch sees this. Be honest — 1 rep is enough.</p>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea placeholder="How did it feel? Any context for Sasquatch?" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-[#1a1a1a] border-[#333] mt-1" rows={2} />
              </div>
              <Button onClick={handleSubmit} className="w-full bg-[#E2741B] text-black font-bold py-6" disabled={logMutation.isPending} data-testid="button-save-action">
                {logMutation.isPending ? "Saving…" : "Save & audit my day"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function AuditLine({ label, tone, body }: { label: string; tone: 'positive' | 'warn' | 'verdict' | 'next'; body: string }) {
  const colorMap = {
    positive: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300' },
    warn:     { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300' },
    verdict:  { bg: 'bg-[#E2741B]/10',  border: 'border-[#E2741B]/40',  text: 'text-[#E2741B]' },
    next:     { bg: 'bg-blue-500/10',  border: 'border-blue-500/30',  text: 'text-blue-300' },
  } as const;
  const c = colorMap[tone];
  return (
    <div className={`rounded-md border ${c.bg} ${c.border} p-3`}>
      <div className={`text-[10px] uppercase tracking-widest font-bold ${c.text} mb-1`}>{label}</div>
      <p className="text-sm text-white/90 leading-relaxed">{body}</p>
    </div>
  );
}
