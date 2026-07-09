import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mic,
  Sparkles,
  ShieldCheck,
  UploadCloud,
  Activity,
  Brain,
  Flame,
  Compass,
  Video as VideoIcon,
  AlertTriangle,
  PhoneCall,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

type Status = "processing" | "complete" | "failed";

interface AnalysisOutput {
  headline: string;
  summary: string;
  encouragement: string;
  scoreBreakdown: { speech: number; energy: number; mindset: number; momentum: number };
  progressSignals: { label: string; evidence: string }[];
  strengthAreas: { area: string; insight: string }[];
  focusAreas: { area: string; nextStep: string }[];
  recommendedExercises: { name: string; reason: string }[];
  publishableQuote?: string;
  redFlags?: string[];
}

interface CrisisPayload {
  crisis: { category: string; message: string; resources: string[] };
}

interface PollResponse {
  publicToken: string;
  status: Status;
  submittedAt: string;
  completedAt: string | null;
  durationSec: number | null;
  errorMessage: string | null;
  analysis: AnalysisOutput | CrisisPayload | null;
  firstName: string;
  consentToShare: boolean;
}

interface PublicTestimonial {
  id: number;
  handle: string;
  quote: string;
  headline: string;
  recoveryStage: string | null;
  focusArea: string | null;
  completedAt: string | null;
  videoUrl: string;
}

const MAX_BYTES = 100 * 1024 * 1024;

export default function FreeAnalysisForVideo() {
  const { toast } = useToast();

  // ── Form state ────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [storyText, setStoryText] = useState("");
  const [recoveryStage, setRecoveryStage] = useState<string>("");
  const [focusArea, setFocusArea] = useState<string>("");
  const [consentToShare, setConsentToShare] = useState(true);
  const [consentToContact, setConsentToContact] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ── Submission token (drives polling + result section) ───────────
  const [token, setToken] = useState<string | null>(null);

  // ── Submit mutation ──────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Please attach a video file.");
      if (file.size > MAX_BYTES) throw new Error("Video is over 100MB. Trim it down and try again.");
      if (!name.trim()) throw new Error("Tell us your name.");
      if (!email.trim()) throw new Error("Add an email so we can reach you.");
      if (!consentToShare) throw new Error("Free analysis requires permission to share your testimonial — you can stay anonymous on the public page.");

      const fd = new FormData();
      fd.append("video", file);
      fd.append("name", name.trim());
      fd.append("email", email.trim());
      if (phone.trim()) fd.append("phone", phone.trim());
      if (storyText.trim()) fd.append("storyText", storyText.trim());
      if (recoveryStage) fd.append("recoveryStage", recoveryStage);
      if (focusArea) fd.append("focusArea", focusArea);
      fd.append("consentToShare", "true");
      if (consentToContact) fd.append("consentToContact", "true");

      const res = await fetch("/api/free-analysis/submit", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Submission failed.");
      return data as { publicToken: string; status: Status; message: string };
    },
    onSuccess: (data) => {
      setToken(data.publicToken);
      try {
        sessionStorage.setItem("free-analysis-last-token", data.publicToken);
      } catch {}
      setTimeout(() => {
        document.getElementById("analysis-status")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    },
    onError: (err: any) => {
      toast({ title: "Couldn't submit", description: err?.message || "Please try again.", variant: "destructive" });
    },
  });

  // ── Resume an in-flight submission across page reloads ───────────
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("free-analysis-last-token");
      if (saved && !token) setToken(saved);
    } catch {}
  }, [token]);

  // ── Polling ──────────────────────────────────────────────────────
  // Stop refetching once the row is terminal, OR once we've hit 5
  // consecutive errors (e.g. expired token, network down, backend
  // restart) — past 5 errors we surface an explicit error card with
  // a retry button instead of letting the spinner run forever.
  const MAX_POLL_ERRORS = 5;
  const pollQuery = useQuery<PollResponse>({
    queryKey: ["/api/free-analysis/by-token", token],
    queryFn: async () => {
      const res = await fetch(`/api/free-analysis/by-token/${encodeURIComponent(token!)}`, { credentials: "include" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({} as any)))?.message || "Failed to load analysis.");
      return res.json();
    },
    enabled: !!token,
    retry: false,
    refetchInterval: (q) => {
      const data = q.state.data as PollResponse | undefined;
      if (data?.status === "complete" || data?.status === "failed") return false;
      if (q.state.errorUpdateCount >= MAX_POLL_ERRORS) return false;
      return 4000;
    },
  });
  const pollHardFailed = pollQuery.isError && (pollQuery.errorUpdateCount >= MAX_POLL_ERRORS);

  // ── Public testimonials ──────────────────────────────────────────
  const testimonialsQuery = useQuery<{ items: PublicTestimonial[] }>({
    queryKey: ["/api/free-analysis/testimonials"],
  });

  const status: Status | undefined = pollQuery.data?.status;
  const analysis = pollQuery.data?.analysis;
  const isCrisis = !!(analysis && (analysis as CrisisPayload).crisis);
  const real = !isCrisis ? (analysis as AnalysisOutput | undefined) : undefined;
  const crisis = isCrisis ? (analysis as CrisisPayload).crisis : undefined;

  // Friendly elapsed timer while we wait for Gemini
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (status !== "processing") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  const fileSizeMb = useMemo(() => (file ? (file.size / 1024 / 1024).toFixed(1) : ""), [file]);

  function pickAnotherVideo() {
    setToken(null);
    try { sessionStorage.removeItem("free-analysis-last-token"); } catch {}
    setFile(null);
    setElapsed(0);
    fileInputRef.current?.click();
  }

  function handleFile(f: File | null) {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast({ title: "Too large", description: "Videos must be 100MB or smaller. A 60-second clip in 720p usually fits.", variant: "destructive" });
      return;
    }
    setFile(f);
  }

  // ── Drag & drop handlers ─────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SEO
        title="Free AI Video Analysis for Stroke Survivors | Stroke Recovery Academy"
        description="Upload a 30-90s recovery video. Get an honest, stroke-specific AI analysis of your speech, energy, mindset, and momentum — plus your next concrete step. Free in exchange for sharing your story."
      />

      {/* ─────────── Hero ─────────── */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-5xl px-6 py-16 md:py-24">
          <Badge className="mb-5 bg-amber-500/15 text-amber-300 border border-amber-500/30 hover-elevate">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Free for the first 100 survivors this month
          </Badge>
          <h1
            className="text-4xl md:text-6xl font-black leading-[1.05] tracking-tight"
            data-testid="text-free-analysis-title"
          >
            Free AI analysis of your <span className="text-amber-400">recovery video</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg md:text-xl text-white/70 leading-relaxed" data-testid="text-free-analysis-subtitle">
            Upload a 30-90 second clip — speech, walking, an exercise, anything. You'll get an honest, stroke-specific read on your speech, energy, mindset, and momentum, plus the exact next thing to try. In exchange, we feature your story so other survivors know they're not alone.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/60">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> No clinical jargon</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 60-90 seconds to results</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> You stay anonymous if you want</span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="bg-amber-500 text-black hover:bg-amber-400"
              onClick={() => document.getElementById("submit-form")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              data-testid="button-hero-cta"
            >
              Upload my video <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/5 backdrop-blur border-white/10 hover:bg-white/10"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              data-testid="button-how-it-works"
            >
              How it works
            </Button>
          </div>
        </div>
      </section>

      {/* ─────────── How it works ─────────── */}
      <section id="how-it-works" className="border-b border-white/5">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-10" data-testid="text-how-title">Three steps. Sixty seconds. No fluff.</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: VideoIcon, title: "Upload your clip", body: "30-90 seconds. Speech, an exercise, walking, anything. Phone video is fine. Up to 100MB." },
              { icon: Brain,    title: "AI does the read", body: "Gemini 2.5 watches the video and reads any audio. Trained on stroke recovery — not generic life-coach fluff." },
              { icon: Compass,  title: "Get your next step", body: "Honest scores, the wins you might be missing, and the exact next exercise to try inside the platform." },
            ].map((s, i) => (
              <Card key={i} className="bg-white/[0.03] border-white/10" data-testid={`card-step-${i}`}>
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-md bg-amber-500/15 flex items-center justify-center mb-4">
                    <s.icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-xs font-mono text-white/40 mb-1">STEP {i + 1}</div>
                  <div className="text-lg font-semibold mb-1">{s.title}</div>
                  <p className="text-sm text-white/60 leading-relaxed">{s.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── Submit form ─────────── */}
      <section id="submit-form" className="border-b border-white/5">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-form-title">Your free analysis</h2>
          <p className="text-white/60 mb-8">Takes about a minute. Your video stays private until you approve it for the public page.</p>

          <form
            onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(); }}
            className="space-y-7"
            data-testid="form-free-analysis"
          >
            {/* ── Video upload ── */}
            <div>
              <Label className="mb-2 block text-sm font-semibold">Your recovery video</Label>
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-md border-2 border-dashed p-6 cursor-pointer transition-colors ${
                  isDragging ? "border-amber-400 bg-amber-500/5" : "border-white/15 bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
                data-testid="dropzone-video"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.webm,.m4v,.mkv"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                  data-testid="input-video"
                />
                {file && previewUrl ? (
                  <div className="flex items-start gap-4">
                    <video src={previewUrl} className="w-40 h-28 rounded bg-black object-cover" muted playsInline />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate" data-testid="text-video-name">{file.name}</div>
                      <div className="text-sm text-white/50 mt-0.5">{fileSizeMb} MB · {file.type || "video"}</div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-3 bg-white/5 border-white/10"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        data-testid="button-replace-video"
                      >
                        Replace
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <UploadCloud className="w-10 h-10 text-white/40 mx-auto mb-3" />
                    <div className="font-medium">Drop your video here, or click to browse</div>
                    <div className="text-sm text-white/50 mt-1">mp4 · mov · webm · up to 100MB · 30-90s recommended</div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Identity ── */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fa-name" className="mb-1.5 block text-sm font-semibold">Your name</Label>
                <Input
                  id="fa-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="First Last"
                  className="bg-white/5 border-white/10"
                  data-testid="input-name"
                />
              </div>
              <div>
                <Label htmlFor="fa-email" className="mb-1.5 block text-sm font-semibold">Email</Label>
                <Input
                  id="fa-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="bg-white/5 border-white/10"
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label className="mb-1.5 block text-sm font-semibold">Recovery stage</Label>
                <Select value={recoveryStage} onValueChange={setRecoveryStage}>
                  <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-stage"><SelectValue placeholder="Pick one" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acute">Acute (0-1 month)</SelectItem>
                    <SelectItem value="subacute">Subacute (1-6 months)</SelectItem>
                    <SelectItem value="chronic">Chronic (6+ months)</SelectItem>
                    <SelectItem value="unsure">Not sure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-semibold">Focus area</Label>
                <Select value={focusArea} onValueChange={setFocusArea}>
                  <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-focus"><SelectValue placeholder="What matters most?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="speech">Speech</SelectItem>
                    <SelectItem value="mobility">Mobility</SelectItem>
                    <SelectItem value="cognition">Cognition / memory</SelectItem>
                    <SelectItem value="overall">Overall recovery</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fa-phone" className="mb-1.5 block text-sm font-semibold">Phone <span className="text-white/40 font-normal">(optional)</span></Label>
                <Input
                  id="fa-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                  className="bg-white/5 border-white/10"
                  data-testid="input-phone"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="fa-story" className="mb-1.5 block text-sm font-semibold">Your story <span className="text-white/40 font-normal">(optional, but helps the analysis)</span></Label>
              <Textarea
                id="fa-story"
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                rows={4}
                placeholder="What happened, where you're at, and what you're working on. A few sentences is plenty."
                className="bg-white/5 border-white/10 resize-none"
                data-testid="textarea-story"
              />
              <div className="text-xs text-white/40 mt-1 text-right">{storyText.length}/2000</div>
            </div>

            {/* ── Consent ── */}
            <div className="space-y-3 rounded-md border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="fa-consent-share"
                  checked={consentToShare}
                  onCheckedChange={(v) => setConsentToShare(v === true)}
                  className="mt-0.5"
                  data-testid="checkbox-consent-share"
                />
                <Label htmlFor="fa-consent-share" className="text-sm font-normal leading-relaxed cursor-pointer">
                  <span className="font-semibold">I'm okay being featured as a public testimonial.</span>{" "}
                  <span className="text-white/60">You can stay anonymous (we'll only use a first name + initial). Required for the free analysis — this is the trade.</span>
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="fa-consent-contact"
                  checked={consentToContact}
                  onCheckedChange={(v) => setConsentToContact(v === true)}
                  className="mt-0.5"
                  data-testid="checkbox-consent-contact"
                />
                <Label htmlFor="fa-consent-contact" className="text-sm font-normal leading-relaxed cursor-pointer">
                  <span className="font-semibold">It's okay to email me about my results and next steps.</span>{" "}
                  <span className="text-white/60">No spam. Ever. One follow-up plus your monthly recovery report.</span>
                </Label>
              </div>
            </div>

            {/* ── Submit ── */}
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-white/50 max-w-md">
                Not medical advice. We don't diagnose. If anything urgent shows up, our system flags it for human follow-up.
              </p>
              <Button
                type="submit"
                size="lg"
                disabled={submitMutation.isPending || !file}
                className="bg-amber-500 text-black hover:bg-amber-400 min-w-[180px]"
                data-testid="button-submit-analysis"
              >
                {submitMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…</>
                ) : (
                  <>Run my free analysis <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* ─────────── Status / results ─────────── */}
      {token && (
        <section id="analysis-status" className="border-b border-white/5">
          <div className="mx-auto max-w-3xl px-6 py-16">
            {/* Polling hard-failed (token unknown / repeated errors) */}
            {pollHardFailed && (
              <Card className="bg-rose-950/20 border-rose-500/30" data-testid="card-status-poll-error">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                  <div className="text-xl font-semibold mb-1.5">We lost the trail on your submission</div>
                  <p className="text-white/70">
                    Your link may have expired or our system hiccuped. Submitting again only takes a minute, and we'll keep an eye on it this time.
                  </p>
                  <Button
                    onClick={pickAnotherVideo}
                    className="mt-5 bg-amber-500 text-black hover:bg-amber-400"
                    data-testid="button-poll-retry"
                  >
                    Submit again
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Loading / processing state */}
            {!pollHardFailed && (!pollQuery.data || status === "processing") && (
              <Card className="bg-white/[0.03] border-white/10" data-testid="card-status-processing">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
                  </div>
                  <div className="text-xl font-semibold mb-1.5">Analyzing your video…</div>
                  <p className="text-white/60">
                    {pollQuery.data?.firstName ? `Hang tight, ${pollQuery.data.firstName}.` : "Hang tight."}{" "}
                    Gemini is watching the clip and reading what you said. Usually 30-90 seconds.
                  </p>
                  <div className="mt-6 max-w-sm mx-auto">
                    <Progress value={Math.min(90, elapsed * 1.2)} className="h-1.5 bg-white/10" />
                    <div className="text-xs text-white/40 mt-2">{elapsed}s elapsed</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Failed */}
            {status === "failed" && (
              <Card className="bg-rose-950/20 border-rose-500/30" data-testid="card-status-failed">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                  <div className="text-xl font-semibold mb-1.5">We couldn't finish the analysis</div>
                  <p className="text-white/70">{pollQuery.data?.errorMessage || "Something went sideways. Try a shorter clip (≤60s) or a different format."}</p>
                  <Button
                    onClick={pickAnotherVideo}
                    className="mt-5 bg-amber-500 text-black hover:bg-amber-400"
                    data-testid="button-retry"
                  >
                    Try another video
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Crisis */}
            {status === "complete" && crisis && (
              <Card className="bg-rose-950/20 border-rose-500/30" data-testid="card-status-crisis">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <PhoneCall className="w-7 h-7 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xl font-semibold mb-2">We hear you. Please reach out for support right now.</div>
                      <p className="text-white/80 leading-relaxed mb-4 whitespace-pre-line">{crisis.message}</p>
                      <ul className="space-y-1.5">
                        {crisis.resources.map((r, i) => (
                          <li key={i} className="text-white/70 text-sm" data-testid={`text-crisis-resource-${i}`}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Success */}
            {status === "complete" && real && (
              <div className="space-y-6" data-testid="card-status-complete">
                {/* Headline + summary */}
                <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
                  <CardContent className="p-7">
                    <div className="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-2">Your read</div>
                    <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-3" data-testid="text-analysis-headline">
                      {real.headline}
                    </h3>
                    <p className="text-white/80 leading-relaxed" data-testid="text-analysis-summary">{real.summary}</p>
                  </CardContent>
                </Card>

                {/* Score breakdown */}
                <div className="grid sm:grid-cols-4 gap-3">
                  {([
                    { key: "speech",   label: "Speech",   icon: Mic },
                    { key: "energy",   label: "Energy",   icon: Flame },
                    { key: "mindset",  label: "Mindset",  icon: Brain },
                    { key: "momentum", label: "Momentum", icon: Activity },
                  ] as const).map(({ key, label, icon: Icon }) => {
                    const v = real.scoreBreakdown[key] ?? 0;
                    return (
                      <Card key={key} className="bg-white/[0.03] border-white/10" data-testid={`card-score-${key}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="text-sm font-medium text-white/70 inline-flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5 text-amber-400" /> {label}
                            </div>
                            <div className="text-2xl font-bold tabular-nums" data-testid={`text-score-${key}`}>{v}</div>
                          </div>
                          <Progress value={v} className="h-1.5 bg-white/10" />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Encouragement */}
                <Card className="bg-white/[0.03] border-white/10">
                  <CardContent className="p-6">
                    <div className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-2">From the coach</div>
                    <p className="text-lg leading-relaxed font-serif italic" data-testid="text-encouragement">"{real.encouragement}"</p>
                  </CardContent>
                </Card>

                {/* Three columns: signals / strengths / focus */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="bg-white/[0.03] border-white/10">
                    <CardContent className="p-5">
                      <div className="text-sm font-bold text-emerald-400 mb-3 inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Wins we saw
                      </div>
                      <ul className="space-y-3">
                        {real.progressSignals.map((s, i) => (
                          <li key={i} data-testid={`item-signal-${i}`}>
                            <div className="text-sm font-semibold">{s.label}</div>
                            <div className="text-xs text-white/60 mt-0.5 leading-relaxed">{s.evidence}</div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/[0.03] border-white/10">
                    <CardContent className="p-5">
                      <div className="text-sm font-bold text-sky-400 mb-3 inline-flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> Lean in here
                      </div>
                      <ul className="space-y-3">
                        {real.strengthAreas.map((s, i) => (
                          <li key={i} data-testid={`item-strength-${i}`}>
                            <div className="text-sm font-semibold">{s.area}</div>
                            <div className="text-xs text-white/60 mt-0.5 leading-relaxed">{s.insight}</div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/[0.03] border-white/10">
                    <CardContent className="p-5">
                      <div className="text-sm font-bold text-amber-400 mb-3 inline-flex items-center gap-1.5">
                        <Compass className="w-4 h-4" /> Next focus
                      </div>
                      <ul className="space-y-3">
                        {real.focusAreas.map((s, i) => (
                          <li key={i} data-testid={`item-focus-${i}`}>
                            <div className="text-sm font-semibold">{s.area}</div>
                            <div className="text-xs text-white/60 mt-0.5 leading-relaxed">{s.nextStep}</div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommended exercises */}
                <Card className="bg-white/[0.03] border-white/10">
                  <CardContent className="p-6">
                    <div className="text-sm font-bold text-white/80 mb-4">Try these next inside the platform</div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {real.recommendedExercises.map((ex, i) => (
                        <Link key={i} href={hrefForExercise(ex.name)}>
                          <a className="block rounded-md border border-white/10 bg-white/[0.02] p-4 hover-elevate active-elevate-2" data-testid={`link-exercise-${i}`}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-semibold text-amber-400">{ex.name}</div>
                              <ArrowRight className="w-4 h-4 text-white/40" />
                            </div>
                            <div className="text-xs text-white/60 mt-1.5 leading-relaxed">{ex.reason}</div>
                          </a>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Red flags */}
                {real.redFlags && real.redFlags.length > 0 && (
                  <Card className="bg-rose-950/20 border-rose-500/30">
                    <CardContent className="p-5">
                      <div className="text-sm font-bold text-rose-300 mb-2 inline-flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> Worth checking with a clinician
                      </div>
                      <ul className="space-y-1.5">
                        {real.redFlags.map((f, i) => (
                          <li key={i} className="text-sm text-white/80" data-testid={`text-redflag-${i}`}>• {f}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Submitter's testimonial preview */}
                {real.publishableQuote && (
                  <Card className="bg-white/[0.03] border-white/10">
                    <CardContent className="p-6">
                      <div className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-2">If you let us, this is the testimonial we'll feature</div>
                      <p className="text-lg leading-relaxed font-serif italic" data-testid="text-publishable-quote">"{real.publishableQuote}"</p>
                      <div className="mt-3 text-sm text-white/60">— {pollQuery.data?.firstName || "Survivor"}</div>
                    </CardContent>
                  </Card>
                )}

                {/* Final CTA */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button asChild size="lg" className="bg-amber-500 text-black hover:bg-amber-400">
                    <Link href="/recovery/circuit"><a data-testid="button-go-circuit">Start today's Daily Circuit <ArrowRight className="ml-2 w-4 h-4" /></a></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="bg-white/5 border-white/10">
                    <Link href="/recovery/coach"><a data-testid="button-go-coach">Talk to Coach Sasquatch</a></Link>
                  </Button>
                  <Button onClick={pickAnotherVideo} size="lg" variant="outline" className="bg-white/5 border-white/10" data-testid="button-another">
                    Submit another video
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─────────── Approved testimonials ─────────── */}
      <section className="border-b border-white/5">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold" data-testid="text-testimonials-title">Survivors who said yes</h2>
              <p className="text-white/60 mt-1.5">Real videos. Real reads. Anonymized handles.</p>
            </div>
            <Badge className="bg-white/5 border border-white/10">{testimonialsQuery.data?.items?.length || 0} featured</Badge>
          </div>

          {testimonialsQuery.isLoading ? (
            <div className="text-white/50 text-sm">Loading testimonials…</div>
          ) : !testimonialsQuery.data?.items?.length ? (
            <Card className="bg-white/[0.03] border-white/10">
              <CardContent className="p-8 text-center text-white/60">
                Be the first to share. Your story might be the one another survivor needs to see today.
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testimonialsQuery.data.items.map((t) => (
                <Card key={t.id} className="bg-white/[0.03] border-white/10 overflow-hidden" data-testid={`card-testimonial-${t.id}`}>
                  <video
                    src={t.videoUrl}
                    className="w-full aspect-video bg-black object-cover"
                    controls
                    preload="metadata"
                    data-testid={`video-testimonial-${t.id}`}
                  />
                  <CardContent className="p-5">
                    <p className="text-base leading-relaxed font-serif italic" data-testid={`text-testimonial-quote-${t.id}`}>"{t.quote}"</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm font-semibold" data-testid={`text-testimonial-handle-${t.id}`}>{t.handle}</div>
                      <div className="flex items-center gap-1.5 text-xs text-white/50">
                        {t.recoveryStage && <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">{t.recoveryStage}</Badge>}
                        {t.focusArea && <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">{t.focusArea}</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─────────── Footer trust strip ─────────── */}
      <section>
        <div className="mx-auto max-w-3xl px-6 py-12 text-center">
          <p className="text-sm text-white/50 leading-relaxed">
            This is informational, not medical advice. We don't diagnose, prescribe, or replace your care team. Read our{" "}
            <Link href="/legal/medical-disclaimer"><a className="text-amber-400 underline">medical disclaimer</a></Link>.
          </p>
        </div>
      </section>
    </div>
  );
}

// Map a Gemini-suggested platform exercise name to its actual route in the app.
function hrefForExercise(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("daily circuit") || n.includes("circuit")) return "/recovery/circuit";
  if (n.includes("lyric"))                                  return "/recovery/lyrics";
  if (n.includes("motivation"))                             return "/recovery/motivation";
  if (n.includes("brain gym") || n.includes("brain"))       return "/recovery/brain-gym";
  if (n.includes("anthem"))                                 return "/recovery/anthem";
  if (n.includes("coach") || n.includes("sasquatch"))       return "/recovery/coach";
  if (n.includes("anchor"))                                 return "/recovery/anchor/today";
  return "/recovery/today";
}
