import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Mic,
  Square,
  Wand2,
  Trash2,
  Loader2,
  CheckCircle2,
  CreditCard,
  Sparkles,
  Headphones,
  Lock,
  BookOpen,
  Music2,
  Disc3,
  Crown,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  STUDIO_TIERS,
  TIER_ORDER,
  TIER_RANK,
  type StudioTier,
  type BillingPeriod,
  type TierDef,
} from "@shared/studioTiers";

interface Voice {
  id: number;
  name: string;
  description: string | null;
  elevenlabsVoiceId: string;
  createdAt: string;
}
interface StudioStatus {
  active: boolean;
  tier: StudioTier;
  billingPeriod: BillingPeriod;
  features: TierDef["features"];
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
    charactersUsedThisPeriod: number;
    monthlyCharacterCap: number;
    voicesAllowed: number;
    albumsAllowed: number;
    tier: StudioTier;
    billingPeriod: BillingPeriod;
  } | null;
  voices: Voice[];
}
interface Generation {
  id: number;
  voiceName: string | null;
  kind: string;
  title: string | null;
  text: string;
  audioUrl: string;
  durationSeconds: number | null;
  createdAt: string;
}

const KIND_LABEL: Record<string, string> = {
  speech: "Speech",
  audiobook_chapter: "Audiobook chapter",
  poem: "Poem",
  anthem_lyric: "Anthem lyric",
  affirmation: "Affirmation",
};

export default function SasquatchStudio() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  const status = useQuery<StudioStatus>({
    queryKey: ["/api/sasquatch-studio/me"],
    enabled: isAuthenticated,
  });
  const generations = useQuery<{ items: Generation[] }>({
    queryKey: ["/api/sasquatch-studio/generations"],
    enabled: isAuthenticated && !!status.data?.active,
  });

  // ------- handle stripe success_url ?session_id=... ------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session_id");
    if (!sid || !isAuthenticated) return;
    (async () => {
      try {
        await apiRequest("POST", "/api/sasquatch-studio/verify", {
          sessionId: sid,
        });
        toast({ title: "Welcome to the Studio", description: "Your subscription is active." });
        qc.invalidateQueries({ queryKey: ["/api/sasquatch-studio/me"] });
        window.history.replaceState({}, "", "/sasquatch-studio");
      } catch (e: any) {
        toast({
          title: "Verification failed",
          description: e?.message || "Try refreshing.",
          variant: "destructive",
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ------- subscribe ------
  const subscribe = useMutation({
    mutationFn: async ({ tier, period }: { tier: StudioTier; period: BillingPeriod }) =>
      apiRequest("POST", "/api/sasquatch-studio/checkout", { tier, period }),
    onSuccess: async (res: any) => {
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    },
    onError: (e: any) =>
      toast({ title: "Couldn't start checkout", description: e?.message, variant: "destructive" }),
  });

  const portal = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/sasquatch-studio/portal", {}),
    onSuccess: async (res: any) => {
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    },
  });

  // ------- voice cloning state ------
  const [cloneName, setCloneName] = useState("");
  const [cloneDesc, setCloneDesc] = useState("");
  const [consent, setConsent] = useState(false);
  const [recordedBlobs, setRecordedBlobs] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const tickRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      try {
        recorderRef.current?.state === "recording" && recorderRef.current.stop();
      } catch {}
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlobs((prev) => [...prev, blob]);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      mr.start();
      recorderRef.current = mr;
      setIsRecording(true);
      setRecordSeconds(0);
      tickRef.current = window.setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      toast({
        title: "Microphone blocked",
        description: "Allow mic access or upload an audio file instead.",
        variant: "destructive",
      });
    }
  }
  function stopRecording() {
    recorderRef.current?.stop();
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setIsRecording(false);
  }
  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setRecordedBlobs((prev) => [...prev, ...files]);
    e.target.value = "";
  }

  const cloneVoice = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("name", cloneName);
      fd.append("description", cloneDesc);
      fd.append("consent", "true");
      recordedBlobs.forEach((b, i) => {
        const ext = (b as File).name?.split(".").pop() || "webm";
        const filename = (b as File).name || `sample-${i}.${ext}`;
        fd.append("audio", b, filename);
      });
      const res = await fetch("/api/sasquatch-studio/voices/clone", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Clone failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Voice cloned", description: "Ready to generate." });
      setCloneName("");
      setCloneDesc("");
      setConsent(false);
      setRecordedBlobs([]);
      qc.invalidateQueries({ queryKey: ["/api/sasquatch-studio/me"] });
    },
    onError: (e: any) =>
      toast({ title: "Clone failed", description: e?.message, variant: "destructive" }),
  });

  const deleteVoice = useMutation({
    mutationFn: async (id: number) =>
      apiRequest("DELETE", `/api/sasquatch-studio/voices/${id}`),
    onSuccess: () => {
      toast({ title: "Voice deleted" });
      qc.invalidateQueries({ queryKey: ["/api/sasquatch-studio/me"] });
    },
  });

  // ------- generation form ------
  const [genVoiceId, setGenVoiceId] = useState<string>("");
  const [genKind, setGenKind] = useState<string>("speech");
  const [genTitle, setGenTitle] = useState<string>("");
  const [genText, setGenText] = useState<string>("");

  useEffect(() => {
    if (!genVoiceId && status.data?.voices?.[0]) {
      setGenVoiceId(status.data.voices[0].elevenlabsVoiceId);
    }
  }, [status.data, genVoiceId]);

  const generate = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/sasquatch-studio/generate", {
        voiceId: genVoiceId,
        text: genText,
        kind: genKind,
        title: genTitle || undefined,
      }),
    onSuccess: () => {
      toast({ title: "Audio ready" });
      setGenText("");
      setGenTitle("");
      qc.invalidateQueries({ queryKey: ["/api/sasquatch-studio/generations"] });
      qc.invalidateQueries({ queryKey: ["/api/sasquatch-studio/me"] });
    },
    onError: (e: any) =>
      toast({ title: "Generation failed", description: e?.message, variant: "destructive" }),
  });

  // ============ UI ============
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <RecoverySEO
          title="Sasquatch Studio — clone your voice, build albums, release like a label"
          description="Tiered survivor music & audio studio. Clone your voice, build albums, share publicly, and download everything. Starts at $9.99/month."
          canonical="/sasquatch-studio"
        />
        <RecoveryHeader />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
          <Lock className="w-10 h-10 mx-auto text-muted-foreground" />
          <h1 className="text-3xl font-bold">Sign in to enter the Studio</h1>
          <p className="text-muted-foreground">
            The Sasquatch Studio needs an account so we can keep your cloned voice and audio
            private.
          </p>
          <Button asChild data-testid="link-studio-signin">
            <a href="/api/login">Sign in</a>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const sub = status.data?.subscription;
  const active = status.data?.active;
  const currentTier = status.data?.tier || "creator";
  const voices = status.data?.voices || [];
  const usedPct =
    sub && sub.monthlyCharacterCap > 0
      ? Math.min(100, Math.round((sub.charactersUsedThisPeriod / sub.monthlyCharacterCap) * 100))
      : 0;

  return (
    <div className="min-h-screen bg-background">
      <RecoverySEO
        title="Sasquatch Studio — clone your voice, build albums, release like a label"
        description="Tiered survivor music & audio studio. Clone your voice, build albums, share publicly, and download everything. Starts at $9.99/month."
        canonical="/sasquatch-studio"
      />
      <RecoveryHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 space-y-10">
        {/* Hero */}
        <section className="space-y-3 max-w-3xl">
          <Badge variant="secondary">
            <Sparkles className="w-3 h-3 mr-1" /> Sasquatch Studio
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Clone your voice. Build albums. Release like a label.
          </h1>
          <p className="text-lg text-muted-foreground">
            A studio built for stroke survivors. Clone your real voice, generate audiobooks
            and anthems on the days speaking is hard, then sequence everything into proper
            albums you can download or share.
          </p>
          {active && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild size="lg" data-testid="link-go-to-albums">
                <Link href="/sasquatch-studio/albums">
                  <Disc3 className="w-4 h-4 mr-2" />
                  Open Album Builder
                </Link>
              </Button>
            </div>
          )}
        </section>

        {/* Active membership header */}
        {active && sub && (
          <Card className="p-5 flex flex-wrap items-center justify-between gap-3" data-testid="card-membership-active">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge data-testid="badge-current-tier">
                  <Crown className="w-3 h-3 mr-1" />
                  {STUDIO_TIERS[currentTier].name}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {sub.billingPeriod === "annual" ? "Billed annually" : "Billed monthly"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Renews {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : "—"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {sub.charactersUsedThisPeriod.toLocaleString()} / {sub.monthlyCharacterCap.toLocaleString()} characters used this month
              </p>
              <div className="h-1.5 w-64 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${usedPct}%` }} />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => portal.mutate()}
              disabled={portal.isPending}
              data-testid="button-manage-billing"
            >
              {portal.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Manage billing & upgrade
            </Button>
          </Card>
        )}

        {/* TIER COMPARISON */}
        <section className="space-y-5" data-testid="section-tiers">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">
                {active ? "Upgrade your plan" : "Choose your plan"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {active
                  ? "More characters, more voices, more albums. Manage from the billing portal."
                  : "Cancel anytime. Annual billing saves you about two months."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${billingPeriod === "monthly" ? "font-semibold" : "text-muted-foreground"}`}>
                Monthly
              </span>
              <Switch
                checked={billingPeriod === "annual"}
                onCheckedChange={(v) => setBillingPeriod(v ? "annual" : "monthly")}
                data-testid="switch-billing-period"
              />
              <span className={`text-sm ${billingPeriod === "annual" ? "font-semibold" : "text-muted-foreground"}`}>
                Annual <Badge variant="secondary" className="text-xs ml-1">~2 months free</Badge>
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {TIER_ORDER.map((tierId) => {
              const tier = STUDIO_TIERS[tierId];
              const isCurrent = active && currentTier === tierId;
              const canSwitch = !active || TIER_RANK[tierId] > TIER_RANK[currentTier];
              const price =
                billingPeriod === "monthly" ? tier.monthlyDisplay : tier.annualDisplay;
              const perMonth =
                billingPeriod === "monthly" ? tier.monthlyDisplay : tier.annualEffectivePerMonth;
              return (
                <Card
                  key={tierId}
                  className={`p-6 space-y-4 flex flex-col ${
                    tier.highlight ? "border-primary/60 ring-1 ring-primary/30" : ""
                  }`}
                  data-testid={`card-tier-${tierId}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold">{tier.name}</h3>
                        {tier.highlight && (
                          <Badge variant="secondary" className="text-xs">
                            Most popular
                          </Badge>
                        )}
                        {isCurrent && (
                          <Badge className="text-xs">Current</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{tier.tagline}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">
                      {price}
                      <span className="text-sm text-muted-foreground font-normal ml-1">
                        / {billingPeriod === "monthly" ? "mo" : "yr"}
                      </span>
                    </p>
                    {billingPeriod === "annual" && (
                      <p className="text-xs text-muted-foreground">
                        ≈ {perMonth} per month
                      </p>
                    )}
                  </div>
                  <ul className="space-y-1.5 text-sm flex-1">
                    {tier.perks.map((p) => (
                      <li key={p} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button
                      variant="outline"
                      onClick={() => portal.mutate()}
                      disabled={portal.isPending}
                      data-testid={`button-manage-${tierId}`}
                    >
                      Manage in portal
                    </Button>
                  ) : !active ? (
                    <Button
                      onClick={() =>
                        subscribe.mutate({ tier: tierId, period: billingPeriod })
                      }
                      disabled={subscribe.isPending}
                      variant={tier.highlight ? "default" : "outline"}
                      data-testid={`button-subscribe-${tierId}`}
                    >
                      {subscribe.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CreditCard className="w-4 h-4 mr-2" />
                      )}
                      {tier.cta}
                    </Button>
                  ) : canSwitch ? (
                    <Button
                      onClick={() => portal.mutate()}
                      disabled={portal.isPending}
                      data-testid={`button-upgrade-${tierId}`}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Upgrade to {tier.name}
                    </Button>
                  ) : (
                    <Button variant="ghost" disabled>
                      Lower tier
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* CLONE VOICE */}
        {active && (
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <Mic className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Clone a voice</h2>
              <Badge variant="outline" className="ml-auto">
                {voices.length}/{sub?.voicesAllowed ?? 3} voices
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Record at least 30 seconds of clean speech (1–2 minutes is better). Quiet room,
              one speaker, conversational tone. You can also upload existing audio files.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="clone-name">Voice name *</Label>
                <Input
                  id="clone-name"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="e.g. My voice"
                  data-testid="input-clone-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clone-desc">Description (optional)</Label>
                <Input
                  id="clone-desc"
                  value={cloneDesc}
                  onChange={(e) => setCloneDesc(e.target.value)}
                  placeholder="e.g. Pre-stroke recording, 2018"
                  data-testid="input-clone-desc"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isRecording ? (
                <Button
                  type="button"
                  onClick={startRecording}
                  variant="default"
                  data-testid="button-record-start"
                >
                  <Mic className="w-4 h-4 mr-2" /> Record sample
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={stopRecording}
                  variant="destructive"
                  data-testid="button-record-stop"
                >
                  <Square className="w-4 h-4 mr-2" /> Stop ({recordSeconds}s)
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-upload-audio"
              >
                Upload audio files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                hidden
                onChange={onPickFiles}
              />
              {recordedBlobs.length > 0 && (
                <Badge variant="secondary">{recordedBlobs.length} sample(s) ready</Badge>
              )}
            </div>

            {recordedBlobs.length > 0 && (
              <div className="space-y-2">
                {recordedBlobs.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm p-2 rounded-md border"
                    data-testid={`row-sample-${i}`}
                  >
                    <Headphones className="w-4 h-4" />
                    <span className="flex-1 truncate">
                      Sample {i + 1} · {Math.round(b.size / 1024)} KB
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setRecordedBlobs((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      data-testid={`button-remove-sample-${i}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-start gap-2 pt-1">
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={(v) => setConsent(!!v)}
                data-testid="checkbox-consent"
              />
              <Label htmlFor="consent" className="text-xs leading-relaxed font-normal cursor-pointer">
                I attest that this voice belongs to me (or I have explicit written permission
                from the speaker) and I consent to having it cloned and used to generate audio
                in the Sasquatch Studio. I can delete this voice at any time.
              </Label>
            </div>

            <Button
              onClick={() => cloneVoice.mutate()}
              disabled={
                cloneVoice.isPending ||
                !cloneName.trim() ||
                !consent ||
                recordedBlobs.length === 0
              }
              data-testid="button-create-clone"
            >
              {cloneVoice.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create voice clone
            </Button>
          </Card>
        )}

        {/* MY VOICES */}
        {active && voices.length > 0 && (
          <Card className="p-6 space-y-3">
            <h2 className="text-xl font-semibold">My voices</h2>
            <div className="grid gap-2">
              {voices.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 p-3 border rounded-md"
                  data-testid={`row-voice-${v.id}`}
                >
                  <Mic className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{v.name}</p>
                    {v.description && (
                      <p className="text-xs text-muted-foreground truncate">{v.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Delete voice "${v.name}"? This cannot be undone.`)) {
                        deleteVoice.mutate(v.id);
                      }
                    }}
                    data-testid={`button-delete-voice-${v.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* GENERATE */}
        {active && voices.length > 0 && (
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Generate audio</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Voice</Label>
                <Select value={genVoiceId} onValueChange={setGenVoiceId}>
                  <SelectTrigger data-testid="select-gen-voice">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((v) => (
                      <SelectItem key={v.id} value={v.elevenlabsVoiceId}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={genKind} onValueChange={setGenKind}>
                  <SelectTrigger data-testid="select-gen-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(KIND_LABEL).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Title (optional)</Label>
                <Input
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  placeholder="Chapter 1, Sunrise poem…"
                  data-testid="input-gen-title"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Text</Label>
              <Textarea
                rows={8}
                value={genText}
                onChange={(e) => setGenText(e.target.value)}
                placeholder="Paste a chapter, type a poem, write an affirmation. Up to ~8000 characters per generation."
                data-testid="input-gen-text"
              />
              <p className="text-xs text-muted-foreground text-right">
                {genText.length.toLocaleString()} characters
              </p>
            </div>
            <Button
              onClick={() => generate.mutate()}
              disabled={generate.isPending || !genText.trim() || !genVoiceId}
              data-testid="button-generate"
            >
              {generate.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              <Wand2 className="w-4 h-4 mr-2" />
              Generate audio
            </Button>
          </Card>
        )}

        {/* HISTORY */}
        {active && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <h2 className="text-xl font-semibold">My generations</h2>
              </div>
              <Button asChild variant="outline" size="sm" data-testid="link-album-builder">
                <Link href="/sasquatch-studio/albums">
                  <Disc3 className="w-4 h-4 mr-2" />
                  Build an album
                </Link>
              </Button>
            </div>
            {generations.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : !generations.data?.items.length ? (
              <p className="text-muted-foreground text-sm">
                Nothing yet. Clone a voice and generate your first track above.
              </p>
            ) : (
              <div className="grid gap-3">
                {generations.data.items.map((g) => (
                  <div
                    key={g.id}
                    className="border rounded-md p-3 space-y-2"
                    data-testid={`row-generation-${g.id}`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{KIND_LABEL[g.kind] || g.kind}</Badge>
                      {g.title && <span className="font-medium">{g.title}</span>}
                      {g.voiceName && (
                        <span className="text-xs text-muted-foreground">
                          · {g.voiceName}
                        </span>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(g.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{g.text}</p>
                    <audio
                      controls
                      src={g.audioUrl}
                      className="w-full"
                      data-testid={`audio-generation-${g.id}`}
                    />
                    <div className="flex justify-end">
                      <Button asChild size="sm" variant="ghost" data-testid={`link-download-${g.id}`}>
                        <a href={g.audioUrl} download>
                          Download MP3
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* What you can make */}
        {!active && (
          <section className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: BookOpen, title: "Audiobooks", body: "Narrate your own book in your own voice. Chapter by chapter." },
              { icon: Music2, title: "Anthem lyrics", body: "Lay down vocals on top of Suno tracks for a fully custom anthem." },
              { icon: Disc3, title: "Albums you can share", body: "Sequence your tracks, add a cover, share publicly or download a ZIP." },
            ].map((it) => (
              <Card key={it.title} className="p-5 space-y-2">
                <it.icon className="w-5 h-5" />
                <h3 className="font-semibold">{it.title}</h3>
                <p className="text-sm text-muted-foreground">{it.body}</p>
              </Card>
            ))}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
