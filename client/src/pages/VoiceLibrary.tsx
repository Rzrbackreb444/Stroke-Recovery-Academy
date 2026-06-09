import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import GlobalHeader from "@/components/GlobalHeader";
import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Mic2, Play, Pause, Plus, Trash2, ArrowLeft, Loader2, ShieldCheck,
  AlertTriangle, Square, Volume2, Lock, CreditCard, Sparkles, CheckCircle2,
} from "lucide-react";

interface VoiceClone {
  id: number;
  name: string;
  description: string | null;
  status: string;
  voiceModelId: string | null;
  sampleDurationSec: number | null;
  consentSignedAt: string | null;
  usageCount: number;
  createdAt: string;
}

interface VoiceListResponse {
  voices: VoiceClone[];
  consentText: string;
}

interface EntitlementResponse {
  hasSubscription: boolean;
  configured: boolean;
  subscriptionPriceAmountCents: number;
  perClonePriceAmountCents: number;
}

const MIN_DURATION = 30;
const TARGET_DURATION = 90;
const MAX_DURATION = 180;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export default function VoiceLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<number | null>(null);

  const [previewingId, setPreviewingId] = useState<number | null>(null);
  const [previewText, setPreviewText] = useState(
    "Recovery is not a deadline. It is a direction.",
  );
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const { data, isLoading } = useQuery<VoiceListResponse>({
    queryKey: ["/api/voice-clones"],
    enabled: !!user,
  });

  const { data: entitlement, isLoading: entLoading } = useQuery<EntitlementResponse>({
    queryKey: ["/api/voice-clones/entitlement"],
    enabled: !!user,
  });

  // Per-clone purchase token returned by Stripe Checkout success URL
  // (?clone_session_id=cs_...). Persisted to sessionStorage so a refresh,
  // accidental navigation, or browser-crash between purchase and mint never
  // strands a paid $5 slot client-side. Cleared only on successful mint or
  // when the survivor explicitly discards.
  const CLONE_TOKEN_KEY = "voiceClonePendingSessionId";
  const [pendingCloneSessionId, setPendingCloneSessionIdState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(CLONE_TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const setPendingCloneSessionId = (v: string | null) => {
    try {
      if (v) sessionStorage.setItem(CLONE_TOKEN_KEY, v);
      else sessionStorage.removeItem(CLONE_TOKEN_KEY);
    } catch {
      /* private mode / quota */
    }
    setPendingCloneSessionIdState(v);
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("clone_session_id");
    const subscribed = params.get("subscribed");
    const canceled = params.get("canceled");
    if (sid) {
      setPendingCloneSessionId(sid);
      toast({
        title: "Clone slot ready",
        description: "Record your sample below to mint your voice.",
      });
    }
    if (subscribed) {
      queryClient.invalidateQueries({ queryKey: ["/api/voice-clones/entitlement"] });
      toast({ title: "Subscription active", description: "Voice cloning unlocked." });
    }
    if (canceled) {
      toast({ title: "Checkout canceled", variant: "destructive" });
    }
    if (sid || subscribed || canceled) {
      window.history.replaceState({}, "", "/voice-library");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const consentText = data?.consentText || "";
  const voices = data?.voices ?? [];

  const cleanupRecorder = () => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
  };

  useEffect(() => () => cleanupRecorder(), []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        cleanupRecorder();
      };
      mr.start();
      recorderRef.current = mr;
      setIsRecording(true);
      setElapsed(0);
      const start = Date.now();
      tickRef.current = window.setInterval(() => {
        const s = Math.floor((Date.now() - start) / 1000);
        setElapsed(s);
        if (s >= MAX_DURATION) {
          mr.stop();
          setIsRecording(false);
        }
      }, 250);
    } catch (e: any) {
      toast({
        title: "Microphone blocked",
        description: e?.message || "Please allow microphone access and try again.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setIsRecording(false);
  };

  const discardRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setElapsed(0);
  };

  const checkoutMutation = useMutation({
    mutationFn: async (mode: "subscription" | "clone") => {
      const res = await apiRequest("POST", "/api/voice-clones/checkout", { mode });
      return (await res.json()) as { url: string };
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
    onError: (e: any) => {
      if (e?.status === 401) {
        toast({
          title: "Sign in to clone your voice",
          description: "Your session expired. Sign in and try again.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Checkout failed",
        description: e?.message || "Could not start Stripe checkout.",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!recordedBlob) throw new Error("No recording");
      if (!pendingCloneSessionId) throw new Error("Missing clone purchase token");
      const audioBase64 = await blobToBase64(recordedBlob);
      const res = await apiRequest("POST", "/api/voice-clones", {
        name,
        description,
        consentAccepted: true,
        audioBase64,
        audioMimeType: recordedBlob.type,
        sampleDurationSec: elapsed,
        stripeSessionId: pendingCloneSessionId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/voice-clones"] });
      toast({
        title: "Voice cloned",
        description: `"${name}" is ready to use across the platform.`,
      });
      setName("");
      setDescription("");
      setConsentChecked(false);
      setPendingCloneSessionId(null);
      discardRecording();
    },
    onError: (e: any) => {
      if (e?.status === 401) {
        toast({
          title: "Sign in to save your clone",
          description: "Your session expired. Sign in and re-record — the audio sample isn't saved to disk.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Clone failed",
        description: e?.message || "Could not create voice clone.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/voice-clones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/voice-clones"] });
      toast({ title: "Voice deleted" });
    },
    onError: (e: any) => {
      toast({
        title: "Delete failed",
        description: e?.message || "Could not delete voice.",
        variant: "destructive",
      });
    },
  });

  const previewVoice = async (voice: VoiceClone) => {
    if (previewingId === voice.id) {
      previewAudioRef.current?.pause();
      previewAudioRef.current = null;
      setPreviewingId(null);
      return;
    }
    let url: string | null = null;
    try {
      setPreviewingId(voice.id);
      const res = await apiRequest("POST", `/api/voice-clones/${voice.id}/preview`, {
        text: previewText,
      });
      const blob = await res.blob();
      url = URL.createObjectURL(blob);
      const localUrl = url;
      const audio = new Audio(localUrl);
      previewAudioRef.current = audio;
      const cleanup = () => {
        URL.revokeObjectURL(localUrl);
        if (previewAudioRef.current === audio) previewAudioRef.current = null;
        setPreviewingId(null);
      };
      audio.onended = cleanup;
      audio.onerror = cleanup;
      audio.onpause = () => {
        if (audio.currentTime > 0 && !audio.ended) cleanup();
      };
      await audio.play();
    } catch (e: any) {
      if (url) URL.revokeObjectURL(url);
      setPreviewingId(null);
      toast({
        title: "Preview failed",
        description: e?.message || "Could not generate preview.",
        variant: "destructive",
      });
    }
  };

  const hasSub = !!entitlement?.hasSubscription;
  const billingConfigured = !!entitlement?.configured;
  const subPriceDisplay = entitlement
    ? `$${(entitlement.subscriptionPriceAmountCents / 100).toFixed(0)}/mo`
    : "$9/mo";
  const clonePriceDisplay = entitlement
    ? `$${(entitlement.perClonePriceAmountCents / 100).toFixed(0)}`
    : "$5";

  const canSubmit =
    hasSub &&
    !!pendingCloneSessionId &&
    !!recordedBlob &&
    elapsed >= MIN_DURATION &&
    name.trim().length > 0 &&
    consentChecked &&
    !createMutation.isPending;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-zinc-100">
      <SEO
        title="Survivor Voice Cloning | Stroke Recovery Academy"
        description="Clone your voice and use it across Anthem, Anchor Studio, and Coach. Survivor-owned, consent-gated voice cloning."
        canonical="/voice-library"
      />
      <GlobalHeader />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/recovery">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="p-3 rounded-md bg-[#E2741B]/20 border border-[#E2741B]/40">
            <Mic2 className="w-7 h-7 text-[#E2741B]" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Survivor Voice Cloning</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Use your own voice across the platform — Anthem narration, Anchor Studio,
              Daily Quote, and Coach replies.
            </p>
          </div>
          <Badge className="bg-[#E2741B]/20 text-[#E2741B] border border-[#E2741B]/40">
            {subPriceDisplay} add-on
          </Badge>
        </div>

        {!entLoading && !billingConfigured && (
          <Alert className="mb-6 border-amber-500/40 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertTitle>Stripe products not set up yet</AlertTitle>
            <AlertDescription className="text-zinc-300">
              An admin needs to run the one-time Stripe setup before survivors can subscribe.
              {(user as any)?.role === "admin" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-3"
                  onClick={async () => {
                    try {
                      const r = await apiRequest("POST", "/api/admin/voice-clones/setup-stripe", {});
                      const j = await r.json();
                      toast({ title: "Stripe configured", description: `Sub price: ${j.subscriptionPriceId}` });
                      queryClient.invalidateQueries({ queryKey: ["/api/voice-clones/entitlement"] });
                    } catch (e: any) {
                      toast({ title: "Setup failed", description: e?.message, variant: "destructive" });
                    }
                  }}
                  data-testid="button-stripe-setup"
                >
                  Run setup now
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {billingConfigured && !hasSub && (
          <Card className="mb-6 bg-gradient-to-br from-[#E2741B]/15 to-transparent border-[#E2741B]/40">
            <CardContent className="py-6 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="p-3 rounded-md bg-[#E2741B]/20 border border-[#E2741B]/40">
                <Lock className="w-6 h-6 text-[#E2741B]" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold">Unlock voice cloning — {subPriceDisplay}</div>
                <p className="text-sm text-zinc-400 mt-1">
                  Use your own voice across Anthem narration, Recovery Anchor, Daily Quote, and
                  Coach replies. Each new clone is {clonePriceDisplay}. Cancel anytime.
                </p>
              </div>
              <Button
                size="lg"
                className="bg-[#E2741B] hover:bg-[#E2741B] text-black"
                onClick={() => checkoutMutation.mutate("subscription")}
                disabled={checkoutMutation.isPending}
                data-testid="button-subscribe"
              >
                {checkoutMutation.isPending ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 mr-2" />
                )}
                Subscribe
              </Button>
            </CardContent>
          </Card>
        )}

        {hasSub && !pendingCloneSessionId && (
          <Alert className="mb-6 border-emerald-500/40 bg-emerald-500/10">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <AlertTitle>Subscription active</AlertTitle>
            <AlertDescription className="text-zinc-300 flex items-center gap-3 flex-wrap">
              To mint a new voice, purchase a clone slot for {clonePriceDisplay}.
              <Button
                size="sm"
                variant="outline"
                onClick={() => checkoutMutation.mutate("clone")}
                disabled={checkoutMutation.isPending}
                data-testid="button-buy-clone-slot"
              >
                <CreditCard className="w-4 h-4 mr-2" /> Buy clone slot ({clonePriceDisplay})
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {hasSub && pendingCloneSessionId && (
          <Alert className="mb-6 border-[#E2741B]/40 bg-[#E2741B]/10">
            <Sparkles className="h-4 w-4 text-[#E2741B]" />
            <AlertTitle>Clone slot ready</AlertTitle>
            <AlertDescription className="text-zinc-300 flex flex-wrap items-center gap-3">
              <span className="flex-1 min-w-[200px]">
                Your {clonePriceDisplay} purchase is queued. Record your sample below and submit to
                mint your voice. The slot is consumed only on a successful clone.
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="text-zinc-400"
                onClick={() => {
                  if (confirm("Discard this paid clone slot? This cannot be undone.")) {
                    setPendingCloneSessionId(null);
                  }
                }}
                data-testid="button-discard-clone-token"
              >
                Discard slot
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-[#1a1a1a]/80 border-[#333]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#E2741B]" />
                Create a new voice
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Record {MIN_DURATION}-{MAX_DURATION} seconds of clean speech in a quiet
                room. {TARGET_DURATION}s is the sweet spot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="voice-name">Voice name</Label>
                <Input
                  id="voice-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My voice (April 2026)"
                  className="bg-[#0D0D0D] border-[#333] mt-1"
                  maxLength={60}
                  data-testid="input-voice-name"
                />
              </div>
              <div>
                <Label htmlFor="voice-desc">Description (optional)</Label>
                <Textarea
                  id="voice-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Anything that helps you remember which voice this is."
                  className="bg-[#0D0D0D] border-[#333] mt-1"
                  rows={2}
                  maxLength={500}
                  data-testid="input-voice-desc"
                />
              </div>

              <div className="rounded-md border border-[#333] bg-[#0D0D0D] p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-[#E2741B]">
                  <ShieldCheck className="w-4 h-4" /> Consent statement
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Read this aloud as part of your recording, then check the box to confirm.
                </p>
                <p
                  className="text-sm text-zinc-200 italic leading-relaxed"
                  data-testid="text-consent-statement"
                >
                  "{consentText || "Loading consent statement..."}"
                </p>
                <div className="flex items-start gap-2 pt-1">
                  <Checkbox
                    id="consent"
                    checked={consentChecked}
                    onCheckedChange={(v) => setConsentChecked(v === true)}
                    data-testid="checkbox-consent"
                  />
                  <Label
                    htmlFor="consent"
                    className="text-xs text-zinc-300 leading-snug cursor-pointer"
                  >
                    I confirm I am the owner of this voice and I read the statement aloud
                    in the recording above.
                  </Label>
                </div>
              </div>

              <div className="rounded-md border border-[#333] bg-[#0D0D0D] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium">
                    {isRecording ? "Recording…" : recordedBlob ? "Sample ready" : "Ready to record"}
                  </div>
                  <div
                    className={`text-sm font-mono ${
                      elapsed >= MIN_DURATION ? "text-[#E2741B]" : "text-zinc-500"
                    }`}
                    data-testid="text-elapsed"
                  >
                    {elapsed}s / {MAX_DURATION}s
                  </div>
                </div>

                {recordedUrl && !isRecording && (
                  <audio
                    src={recordedUrl}
                    controls
                    className="w-full mb-3"
                    data-testid="audio-recorded-sample"
                  />
                )}

                <div className="flex flex-wrap gap-2">
                  {!isRecording && !recordedBlob && (
                    <Button
                      onClick={startRecording}
                      className="bg-[#E2741B] hover:bg-[#E2741B] text-black"
                      data-testid="button-record-start"
                    >
                      <Mic2 className="w-4 h-4 mr-2" /> Start recording
                    </Button>
                  )}
                  {isRecording && (
                    <Button
                      onClick={stopRecording}
                      variant="destructive"
                      data-testid="button-record-stop"
                    >
                      <Square className="w-4 h-4 mr-2" /> Stop
                    </Button>
                  )}
                  {recordedBlob && !isRecording && (
                    <Button
                      onClick={discardRecording}
                      variant="outline"
                      data-testid="button-record-discard"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Re-record
                    </Button>
                  )}
                </div>
                {recordedBlob && elapsed < MIN_DURATION && (
                  <p className="text-xs text-amber-400 mt-2">
                    Sample is too short. Need at least {MIN_DURATION} seconds.
                  </p>
                )}
              </div>

              <Button
                onClick={() => createMutation.mutate()}
                disabled={!canSubmit}
                size="lg"
                className="w-full bg-[#E2741B] hover:bg-[#E2741B] text-black disabled:opacity-50"
                data-testid="button-create-clone"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Cloning…
                  </>
                ) : !hasSub ? (
                  <>
                    <Lock className="w-5 h-5 mr-2" /> Subscribe to clone
                  </>
                ) : !pendingCloneSessionId ? (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" /> Buy {clonePriceDisplay} slot first
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5 mr-2" /> Mint voice ({clonePriceDisplay} slot)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a]/80 border-[#333]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic2 className="w-5 h-5 text-[#E2741B]" />
                My voices ({voices.length})
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Preview, manage, and (later) wire into Anthem / Anchor / Coach.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="preview-text" className="text-xs">
                  Preview text
                </Label>
                <Input
                  id="preview-text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="bg-[#0D0D0D] border-[#333] mt-1"
                  maxLength={500}
                  data-testid="input-preview-text"
                />
              </div>

              {isLoading ? (
                <div className="flex items-center gap-2 text-zinc-500 py-8 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading voices…
                </div>
              ) : voices.length === 0 ? (
                <div className="text-center py-10 text-zinc-500">
                  <Mic2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No cloned voices yet.</p>
                  <p className="text-xs mt-1">Record a sample on the left to start.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {voices.map((voice) => (
                    <div
                      key={voice.id}
                      className="rounded-md border border-[#333] bg-[#0D0D0D] p-3"
                      data-testid={`card-voice-${voice.id}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <div
                            className="font-medium text-zinc-100 truncate"
                            data-testid={`text-voice-name-${voice.id}`}
                          >
                            {voice.name}
                          </div>
                          {voice.description && (
                            <div className="text-xs text-zinc-500 line-clamp-2 mt-0.5">
                              {voice.description}
                            </div>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            voice.status === "ready"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-zinc-700 text-zinc-300"
                          }
                          data-testid={`badge-status-${voice.id}`}
                        >
                          {voice.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 mb-2">
                        <span>{voice.sampleDurationSec ?? "?"}s sample</span>
                        <span>·</span>
                        <span>used {voice.usageCount}×</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => previewVoice(voice)}
                          disabled={voice.status !== "ready" || (previewingId !== null && previewingId !== voice.id)}
                          data-testid={`button-preview-${voice.id}`}
                        >
                          {previewingId === voice.id ? (
                            <>
                              <Pause className="w-3 h-3 mr-1" /> Stop
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" /> Preview
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => {
                            if (confirm(`Delete voice "${voice.name}"? This removes it from ElevenLabs too.`)) {
                              deleteMutation.mutate(voice.id);
                            }
                          }}
                          data-testid={`button-delete-${voice.id}`}
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
