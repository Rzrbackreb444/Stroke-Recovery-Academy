import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as queryClientImpl } from "@/lib/queryClient";
import {
  Music,
  Sparkles,
  Loader2,
  Download,
  Share2,
  AlertTriangle,
  Phone,
  HelpCircle,
  Lock,
  Maximize2,
  X,
} from "lucide-react";

type VibeOption =
  | "rock_anthem"
  | "hip_hop_fight"
  | "country_grit"
  | "gospel_rise"
  | "lofi_recovery"
  | "ambient_meditation";

const VIBE_LABELS: Record<VibeOption, string> = {
  rock_anthem: "Rock Anthem",
  hip_hop_fight: "Hip-Hop Fight Song",
  country_grit: "Country Grit",
  gospel_rise: "Gospel Rise",
  lofi_recovery: "Lo-Fi Recovery",
  ambient_meditation: "Ambient Meditation",
};

interface ScriptSection {
  name: string;
  voice: string;
  productionCue: string;
  lines: string[];
}

interface AnthemScript {
  shape: "script";
  title: string;
  hook: string;
  bpm: number;
  key: string;
  sections: ScriptSection[];
  realityFooter: string;
}

interface ComposeResponse {
  shape: "anthem" | "script" | "needs_clarification" | "refused" | "crisis";
  id?: number;
  title?: string;
  script?: AnthemScript;
  audioUrl?: string;
  durationMs?: number;
  bpm?: number;
  isShared?: boolean;
  shareId?: string | null;
  question?: string;
  reason?: string;
  category?: string;
  message?: string;
  resources?: Array<{
    label: string;
    detail: string;
    action: { type: "tel" | "sms" | "url"; value: string };
  }>;
}

interface UsageStatus {
  month: string;
  anthemBuilderCount: number;
  limit: number | null;
  premium: boolean;
}

interface AnthemListItem {
  id: number;
  title: string;
  scriptData: AnthemScript;
  audioUrl: string | null;
  durationMs: number | null;
  bpm: number | null;
  isShared: boolean;
  shareId: string | null;
  createdAt: string;
}

const VOICE_BADGE_LABEL: Record<string, string> = {
  spoken_male: "Spoken",
  rapped_male: "Rap",
  sung_male: "Sung",
  screamed_male: "Scream",
  robotic_female: "Narrator",
  layered_choir: "Choir",
};

export default function RecoveryAnthemBuilder() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // ── Form state ────────────────────────────────────────────────────
  const [vibe, setVibe] = useState<VibeOption>("rock_anthem");
  const [deficit, setDeficit] = useState("");
  const [goal, setGoal] = useState("");
  const [fightFor, setFightFor] = useState("");
  const [story, setStory] = useState("");
  const [currentDay, setCurrentDay] = useState(1);
  const [walkingBpm, setWalkingBpm] = useState(90);
  const [lengthSec, setLengthSec] = useState(60);

  // ── Result state ──────────────────────────────────────────────────
  const [result, setResult] = useState<ComposeResponse | null>(null);
  const [exerciseMode, setExerciseMode] = useState(false);

  // ── Queries ───────────────────────────────────────────────────────
  const usageQuery = useQuery<UsageStatus>({
    queryKey: ["/api/recovery/anthem/usage"],
  });

  const listQuery = useQuery<AnthemListItem[]>({
    queryKey: ["/api/recovery/anthem/list"],
  });

  // ── Mutations ─────────────────────────────────────────────────────
  const previewMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/recovery/anthem/preview", buildPayload());
      return (await r.json()) as ComposeResponse;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.shape === "script") {
        toast({
          title: "Lyric preview ready",
          description: "Like what you see? Compose the full song below.",
        });
      }
    },
    onError: (e: any) => {
      toast({ title: "Preview failed", description: e?.message ?? "Try again", variant: "destructive" });
    },
  });

  const composeMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/recovery/anthem/compose", buildPayload());
      return (await r.json()) as ComposeResponse;
    },
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["/api/recovery/anthem/usage"] });
      qc.invalidateQueries({ queryKey: ["/api/recovery/anthem/list"] });
      if (data.shape === "anthem") {
        toast({ title: "Your anthem is here", description: "Press play and turn it up." });
      }
    },
    onError: async (e: any) => {
      // Surface 402 free-tier-limit nicely.
      const msg = String(e?.message ?? "");
      if (msg.includes("402") || msg.toLowerCase().includes("limit")) {
        toast({
          title: "Free anthem used this month",
          description: "Upgrade for unlimited compositions.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Composition failed", description: msg || "Try again", variant: "destructive" });
      }
    },
  });

  function buildPayload() {
    return {
      vibe,
      deficit: deficit.trim(),
      goal: goal.trim(),
      fightFor: fightFor.trim(),
      story: story.trim(),
      currentDay,
      walkingBpm,
      lengthSec,
    };
  }

  const canSubmit = deficit.trim().length >= 2 && goal.trim().length >= 2 && !previewMutation.isPending && !composeMutation.isPending;

  const usageBadge = useMemo(() => {
    if (!usageQuery.data) return null;
    if (usageQuery.data.premium) return "Premium · Unlimited";
    return `${usageQuery.data.anthemBuilderCount}/${usageQuery.data.limit ?? 1} this month`;
  }, [usageQuery.data]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoverySEO title="Build Your Anthem · Stroke Recovery Academy" />
      <RecoveryHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-[#C9941A] mb-2">
            <Music className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Recovery Anthem Studio</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3" data-testid="text-anthem-title">
            Build Your Anthem
          </h1>
          <p className="text-white/70 text-lg max-w-2xl">
            Tell me what your stroke took and what you're fighting back to. I'll write you a full song —
            verses, chorus, the whole thing — with real vocals you can sing, scream, or play on repeat.
          </p>
          {usageBadge && (
            <Badge className="mt-3 bg-[#C9941A]/20 text-[#C9941A] border border-[#C9941A]/40" data-testid="badge-usage">
              {usageBadge}
            </Badge>
          )}
        </header>

        {/* ── Form ─────────────────────────────────────────────── */}
        <Card className="bg-[#1a1a1a] border-white/10 p-6 sm:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="vibe" className="text-white mb-2 block">Vibe</Label>
              <Select value={vibe} onValueChange={(v) => setVibe(v as VibeOption)}>
                <SelectTrigger id="vibe" className="bg-[#0D0D0D] border-white/20 text-white" data-testid="select-vibe">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(VIBE_LABELS) as VibeOption[]).map((v) => (
                    <SelectItem key={v} value={v}>
                      {VIBE_LABELS[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deficit" className="text-white mb-2 block">
                What did the stroke take?
              </Label>
              <Input
                id="deficit"
                value={deficit}
                onChange={(e) => setDeficit(e.target.value)}
                placeholder="left arm, my voice, my balance"
                maxLength={160}
                className="bg-[#0D0D0D] border-white/20 text-white"
                data-testid="input-deficit"
              />
            </div>

            <div>
              <Label htmlFor="goal" className="text-white mb-2 block">
                What are you fighting back to?
              </Label>
              <Input
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="hold my grandson, walk my daughter down the aisle"
                maxLength={160}
                className="bg-[#0D0D0D] border-white/20 text-white"
                data-testid="input-goal"
              />
            </div>

            <div>
              <Label htmlFor="fightFor" className="text-white mb-2 block">
                Who do you fight for? <span className="text-white/40 text-sm">(optional)</span>
              </Label>
              <Input
                id="fightFor"
                value={fightFor}
                onChange={(e) => setFightFor(e.target.value)}
                placeholder="my kids, myself, my wife Linda"
                maxLength={120}
                className="bg-[#0D0D0D] border-white/20 text-white"
                data-testid="input-fightfor"
              />
            </div>

            <div>
              <Label htmlFor="currentDay" className="text-white mb-2 block">
                Day of your 66 <span className="text-white/40 text-sm">(1–66)</span>
              </Label>
              <Input
                id="currentDay"
                type="number"
                min={1}
                max={66}
                value={currentDay}
                onChange={(e) => setCurrentDay(Math.max(1, Math.min(66, Number(e.target.value) || 1)))}
                className="bg-[#0D0D0D] border-white/20 text-white"
                data-testid="input-current-day"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="story" className="text-white mb-2 block">
                Your story <span className="text-white/40 text-sm">(optional — max 2000 chars)</span>
              </Label>
              <Textarea
                id="story"
                value={story}
                onChange={(e) => setStory(e.target.value.slice(0, 2000))}
                placeholder="The day, the moment, the rep that broke through. Anything you want this song to hold."
                rows={4}
                className="bg-[#0D0D0D] border-white/20 text-white resize-none"
                data-testid="textarea-story"
              />
              <div className="text-right text-xs text-white/40 mt-1">{story.length}/2000</div>
            </div>

            <div>
              <Label className="text-white mb-2 block">
                Walking-pace BPM: <span className="text-[#C9941A] font-semibold">{walkingBpm}</span>
              </Label>
              <Slider
                value={[walkingBpm]}
                onValueChange={([v]) => setWalkingBpm(v)}
                min={60}
                max={140}
                step={2}
                data-testid="slider-bpm"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">
                Length: <span className="text-[#C9941A] font-semibold">{lengthSec}s</span>
              </Label>
              <Slider
                value={[lengthSec]}
                onValueChange={([v]) => setLengthSec(v)}
                min={30}
                max={180}
                step={15}
                data-testid="slider-length"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-white/10">
            <Button
              variant="outline"
              onClick={() => previewMutation.mutate()}
              disabled={!canSubmit}
              data-testid="button-preview"
            >
              {previewMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Preview lyrics (free)
            </Button>
            <Button
              className="bg-[#C9941A] hover:bg-[#C9941A]/90 text-black font-semibold"
              onClick={() => composeMutation.mutate()}
              disabled={!canSubmit}
              data-testid="button-compose"
            >
              {composeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Music className="w-4 h-4 mr-2" />
              )}
              Compose full anthem
            </Button>
            {composeMutation.isPending && (
              <span className="text-sm text-white/50">
                ElevenLabs is rendering your song. ~30–90 seconds.
              </span>
            )}
          </div>
        </Card>

        {/* ── Result ───────────────────────────────────────────── */}
        {result && (
          <ResultPanel
            result={result}
            onOpenExercise={() => setExerciseMode(true)}
          />
        )}

        {/* ── Library ──────────────────────────────────────────── */}
        {(listQuery.data?.length ?? 0) > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">Your anthems</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listQuery.data!.map((a) => (
                <Card key={a.id} className="bg-[#1a1a1a] border-white/10 p-5" data-testid={`card-anthem-${a.id}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white">{a.title}</h3>
                    {a.bpm && <Badge className="bg-white/10 text-white/70 border-0">{a.bpm} BPM</Badge>}
                  </div>
                  {a.audioUrl && (
                    <audio
                      controls
                      src={a.audioUrl}
                      className="w-full mt-2"
                      data-testid={`audio-anthem-${a.id}`}
                    />
                  )}
                  <div className="text-xs text-white/40 mt-2">
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      {exerciseMode && result?.shape === "anthem" && result.script && (
        <ExerciseMode
          script={result.script}
          audioUrl={result.audioUrl ?? null}
          onClose={() => setExerciseMode(false)}
        />
      )}

      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Result panel — branches on disposition shape
// ─────────────────────────────────────────────────────────────────────
function ResultPanel({
  result,
  onOpenExercise,
}: {
  result: ComposeResponse;
  onOpenExercise: () => void;
}) {
  if (result.shape === "crisis") {
    return (
      <Card className="bg-red-950/40 border-red-500/40 p-6" data-testid="card-crisis">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-red-100 mb-2">You're not alone right now.</h3>
            <p className="text-red-100/90 mb-4">{result.message}</p>
            <div className="space-y-2">
              {result.resources?.map((r, i) => {
                const href = r.action.type === "tel" ? `tel:${r.action.value}`
                  : r.action.type === "sms" ? `sms:${r.action.value}`
                  : r.action.value;
                return (
                  <a
                    key={i}
                    href={href}
                    className="flex items-start gap-3 p-3 bg-red-900/40 hover-elevate rounded-md"
                    data-testid={`link-crisis-${i}`}
                  >
                    <Phone className="w-5 h-5 text-red-300 mt-0.5" />
                    <div>
                      <div className="font-semibold text-red-100">{r.label}</div>
                      <div className="text-sm text-red-100/80">{r.detail}</div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (result.shape === "needs_clarification") {
    return (
      <Card className="bg-amber-950/30 border-amber-500/30 p-6" data-testid="card-clarification">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-amber-100 mb-1">One more thing</h3>
            <p className="text-amber-100/90">{result.question}</p>
            {result.reason && <p className="text-amber-100/60 text-sm mt-2">{result.reason}</p>}
          </div>
        </div>
      </Card>
    );
  }

  if (result.shape === "refused") {
    return (
      <Card className="bg-white/5 border-white/10 p-6" data-testid="card-refused">
        <div className="flex items-start gap-3">
          <Lock className="w-6 h-6 text-white/40 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">I can't write that one.</h3>
            <p className="text-white/70">{result.reason}</p>
          </div>
        </div>
      </Card>
    );
  }

  // shape: "script" or "anthem"
  const script = result.script;
  if (!script) return null;

  return (
    <Card className="bg-[#1a1a1a] border-white/10 p-6 sm:p-8" data-testid="card-result">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1" data-testid="text-result-title">
            {script.title}
          </h2>
          <div className="flex flex-wrap gap-2 mt-1">
            <Badge className="bg-[#C9941A]/20 text-[#C9941A] border border-[#C9941A]/40">
              {script.bpm} BPM
            </Badge>
            <Badge className="bg-white/10 text-white/70 border-0">{script.key}</Badge>
            {result.shape === "anthem" && (
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Audio ready
              </Badge>
            )}
          </div>
        </div>
        {result.shape === "anthem" && (
          <Button
            variant="outline"
            onClick={onOpenExercise}
            data-testid="button-exercise-mode"
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            Exercise mode
          </Button>
        )}
      </div>

      <div className="bg-black/30 rounded-md p-4 mb-6 border border-[#C9941A]/30">
        <div className="text-xs uppercase tracking-wider text-[#C9941A] mb-1">The hook</div>
        <div className="text-xl font-semibold text-white" data-testid="text-hook">"{script.hook}"</div>
      </div>

      {result.shape === "anthem" && result.audioUrl && (
        <div className="mb-6">
          <audio
            controls
            autoPlay
            src={result.audioUrl}
            className="w-full"
            data-testid="audio-result"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            <Button asChild variant="outline" size="sm" data-testid="button-download">
              <a href={result.audioUrl} download={`${script.title.replace(/\s+/g, "_")}.mp3`}>
                <Download className="w-4 h-4 mr-2" />
                Download MP3
              </a>
            </Button>
            {result.id && (
              <ShareToggleButton anthemId={result.id} initialIsShared={!!result.isShared} initialShareId={result.shareId ?? null} />
            )}
          </div>
        </div>
      )}

      <div className="space-y-5">
        {script.sections.map((s, idx) => (
          <div key={idx} className="border-l-2 border-[#C9941A]/40 pl-4" data-testid={`section-${idx}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold uppercase tracking-wider text-[#C9941A]">
                {s.name}
              </span>
              <Badge className="bg-white/10 text-white/60 border-0 text-xs">
                {VOICE_BADGE_LABEL[s.voice] ?? s.voice}
              </Badge>
            </div>
            {s.productionCue && (
              <div className="text-xs text-white/40 italic mb-2">{s.productionCue}</div>
            )}
            <div className="space-y-1">
              {s.lines.map((line, i) => (
                <p key={i} className="text-white/90 leading-relaxed">{line}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 text-sm text-white/60 italic">
        {script.realityFooter}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Share toggle
// ─────────────────────────────────────────────────────────────────────
function ShareToggleButton({
  anthemId,
  initialIsShared,
  initialShareId,
}: {
  anthemId: number;
  initialIsShared: boolean;
  initialShareId: string | null;
}) {
  const [isShared, setIsShared] = useState(initialIsShared);
  const [shareId, setShareId] = useState(initialShareId);
  const { toast } = useToast();

  const m = useMutation({
    mutationFn: async (next: boolean) => {
      const r = await apiRequest("POST", `/api/recovery/anthem/${anthemId}/share`, { isShared: next });
      return (await r.json()) as { isShared: boolean; shareId: string | null };
    },
    onSuccess: (data) => {
      setIsShared(data.isShared);
      setShareId(data.shareId);
      if (data.isShared && data.shareId) {
        const url = `${window.location.origin}/anthem/s/${data.shareId}`;
        navigator.clipboard.writeText(url).catch(() => {});
        toast({ title: "Share link copied", description: url });
      } else {
        toast({ title: "Share link disabled" });
      }
      queryClientImpl.invalidateQueries({ queryKey: ["/api/recovery/anthem/list"] });
    },
  });

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => m.mutate(!isShared)}
      disabled={m.isPending}
      data-testid="button-share"
    >
      <Share2 className="w-4 h-4 mr-2" />
      {isShared ? "Sharing — copy link" : "Make shareable"}
    </Button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Exercise mode — full-screen big-tap karaoke
// ─────────────────────────────────────────────────────────────────────
function ExerciseMode({
  script,
  audioUrl,
  onClose,
}: {
  script: AnthemScript;
  audioUrl: string | null;
  onClose: () => void;
}) {
  const allLines = useMemo(() => {
    const out: { section: string; text: string }[] = [];
    for (const s of script.sections) {
      for (const ln of s.lines) out.push({ section: s.name, text: ln });
    }
    return out;
  }, [script]);

  const [idx, setIdx] = useState(0);
  const next = () => setIdx((i) => Math.min(i + 1, allLines.length - 1));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" data-testid="overlay-exercise">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="text-white/60 text-sm">{script.title} · {script.bpm} BPM</div>
        <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-exit-exercise">
          <X className="w-6 h-6" />
        </Button>
      </div>

      <button
        onClick={next}
        className="flex-1 flex flex-col items-center justify-center px-6 text-center hover-elevate"
        data-testid="button-next-line"
      >
        <div className="text-[#C9941A] text-sm uppercase tracking-widest mb-4">
          {allLines[idx]?.section}
        </div>
        <p className="text-white text-4xl sm:text-6xl font-bold leading-tight max-w-4xl">
          {allLines[idx]?.text}
        </p>
        <div className="text-white/40 text-sm mt-8">
          Tap anywhere to advance · {idx + 1} / {allLines.length}
        </div>
      </button>

      <div className="border-t border-white/10 p-4">
        {audioUrl && <audio controls autoPlay src={audioUrl} className="w-full mb-3" />}
        <div className="flex justify-between gap-3">
          <Button variant="outline" onClick={prev} disabled={idx === 0} className="flex-1" data-testid="button-prev-line">
            Back
          </Button>
          <Button onClick={next} disabled={idx >= allLines.length - 1} className="flex-1 bg-[#C9941A] text-black hover:bg-[#C9941A]/90" data-testid="button-next-line-bottom">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
