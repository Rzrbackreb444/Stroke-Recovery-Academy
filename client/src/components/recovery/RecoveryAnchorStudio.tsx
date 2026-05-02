import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Anchor,
  Brain,
  MessageCircle,
  Heart,
  Sparkles,
  Loader2,
  Volume2,
  Lock,
  Crown,
  Share2,
  Check,
  Copy,
  HelpCircle,
  ShieldOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import CrisisCard, { type CrisisResource } from "@/components/recovery/CrisisCard";

type AnchorType = "affirmation" | "speech" | "memory";

interface AnchorOutput {
  shape: "anchor";
  anchorType: AnchorType;
  title: string;
  lines: string[];
  callResponse?: { sasquatch: string[]; you: string[] } | null;
  mnemonic?: { facts: string[]; hookStamp: string } | null;
  producerNotes: string;
  realityFooter: string;
}

type EngineResponse =
  | {
      shape: "anchor";
      id: number;
      output: AnchorOutput;
      audioUrl: string | null;
      isShared: boolean;
      shareId: string | null;
      createdAt: string;
    }
  | {
      shape: "audit";
      anchorType: AnchorType;
      purposeAnchor: string;
      previewLines: string[];
      previewProducerNotes: string;
    }
  | {
      shape: "crisis";
      category: string;
      message: string;
      resources: CrisisResource[];
    }
  | { shape: "needs_clarification"; question: string; reason: string }
  | { shape: "refused"; reason: string };

interface AnchorUsage {
  month: string;
  anchorRenderCount: number;
  limit: number | null;
  premium: boolean;
}

const TYPES: Array<{
  id: AnchorType;
  label: string;
  description: string;
  placeholder: string;
  Icon: typeof Heart;
}> = {
  // typed-as-array but written as object then cast — simpler readability
} as any;

const ANCHOR_TYPE_META: Array<{
  id: AnchorType;
  label: string;
  description: string;
  placeholder: string;
  Icon: typeof Heart;
}> = [
  {
    id: "affirmation",
    label: "Affirmation",
    description: "One belief, encoded as a 4-line survivor anthem.",
    placeholder: 'e.g. "I rebuild faster every week, even when nobody sees it."',
    Icon: Heart,
  },
  {
    id: "speech",
    label: "Speech",
    description: "Short rhythmic phrase for word-finding practice. Two-voice call-and-response.",
    placeholder: 'e.g. "I want my own name, my wife\'s name, and the word \'water\' back in my mouth."',
    Icon: MessageCircle,
  },
  {
    id: "memory",
    label: "Memory",
    description: "Encode names, addresses, medication times, daily routines into a sung mnemonic.",
    placeholder: 'e.g. "Pills at 8am: aspirin, statin, blood-pressure. Therapy Tuesday at 2pm with Sara."',
    Icon: Brain,
  },
];

function UsagePill({ usage }: { usage: AnchorUsage | undefined }) {
  if (!usage) return null;
  if (usage.premium) {
    return (
      <Badge variant="outline" className="border-amber-500/50 text-amber-300 bg-amber-500/10">
        <Crown className="h-3 w-3 mr-1" /> Premium · unlimited renders
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-700/50 text-amber-200" data-testid="badge-anchor-usage">
      Renders: {usage.anchorRenderCount}/{usage.limit ?? 0} this month
    </Badge>
  );
}

export default function RecoveryAnchorStudio() {
  const { toast } = useToast();
  const [anchorType, setAnchorType] = useState<AnchorType>("affirmation");
  const [text, setText] = useState("");
  const [result, setResult] = useState<EngineResponse | null>(null);

  const { data: usage } = useQuery<AnchorUsage>({
    queryKey: ["/api/recovery/anchor/usage"],
    staleTime: 30_000,
  });

  const auditMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/recovery/anchor/audit", { anchorType, text });
      return (await res.json()) as EngineResponse;
    },
    onSuccess: (data) => setResult(data),
    onError: (err: any) =>
      toast({
        variant: "destructive",
        title: "Couldn't generate the preview",
        description: err?.message ?? "Please try again.",
      }),
  });

  const renderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/recovery/anchor/render", { anchorType, text });
      return (await res.json()) as EngineResponse;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/anchor/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/anchor/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/anchor/list"] });
    },
    onError: (err: any) =>
      toast({
        variant: "destructive",
        title: "Couldn't render the anchor",
        description: err?.message ?? "Please try again.",
      }),
  });

  const overLimit = !!usage && !usage.premium && usage.limit !== null && usage.anchorRenderCount >= usage.limit;
  const inputValid = text.trim().length >= 3;
  const auditing = auditMutation.isPending;
  const rendering = renderMutation.isPending;

  return (
    <Card className="bg-zinc-900/60 border-amber-900/30" data-testid="card-recovery-anchor-studio">
      <CardHeader>
        <CardTitle className="text-amber-100 flex items-center gap-2">
          <Anchor className="h-5 w-5 text-amber-400" />
          Recovery Anchor Studio
        </CardTitle>
        <CardDescription className="text-amber-100/70 leading-relaxed">
          A musical-mnemonic encoder for the words, phrases, and facts your stroke tried to take.
          Inspired by Melodic Intonation Therapy and Rhythmic Auditory Stimulation — built for use
          between your real clinical sessions, not in place of them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <UsagePill usage={usage} />

        <div>
          <p className="text-sm font-semibold text-amber-100 mb-3">Anchor type</p>
          <div className="grid sm:grid-cols-3 gap-2">
            {ANCHOR_TYPE_META.map((t) => {
              const active = anchorType === t.id;
              const Icon = t.Icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setAnchorType(t.id);
                    setResult(null);
                  }}
                  className={`text-left rounded-md border p-3 hover-elevate active-elevate-2 ${
                    active
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-amber-900/30 bg-zinc-950/40"
                  }`}
                  data-testid={`button-anchor-type-${t.id}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${active ? "text-amber-300" : "text-amber-500/70"}`} />
                    <span className="text-sm font-bold text-amber-100">{t.label}</span>
                  </div>
                  <p className="text-xs text-amber-100/60 leading-relaxed">{t.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-amber-100 mb-2 block">
            What do you want to anchor?
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={ANCHOR_TYPE_META.find((t) => t.id === anchorType)?.placeholder}
            className="bg-zinc-950 border-amber-900/40 text-amber-50 min-h-[110px]"
            data-testid="textarea-anchor-input"
          />
          <p className="text-[11px] text-amber-100/50 mt-1.5">
            Plain language. One belief, one phrase, or one short list. Preview is free; render
            charges your monthly anchor quota.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!inputValid || auditing || rendering}
            onClick={() => auditMutation.mutate()}
            className="border-amber-700 text-amber-200 hover:text-amber-100"
            data-testid="button-anchor-audit"
          >
            {auditing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Previewing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" /> Preview Anchor (free)
              </>
            )}
          </Button>
          <Button
            type="button"
            disabled={!inputValid || auditing || rendering || overLimit}
            onClick={() => renderMutation.mutate()}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950"
            data-testid="button-anchor-render"
          >
            {rendering ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Rendering…
              </>
            ) : overLimit ? (
              <>
                <Lock className="h-4 w-4 mr-2" /> Free limit reached
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 mr-2" /> Render Full Anchor
              </>
            )}
          </Button>
        </div>

        {result && <ResultPanel result={result} onClear={() => setResult(null)} />}
      </CardContent>
    </Card>
  );
}

function ResultPanel({ result, onClear }: { result: EngineResponse; onClear: () => void }) {
  if (result.shape === "crisis") {
    return (
      <div className="space-y-3">
        <CrisisCard message={result.message} resources={result.resources} />
        <Button variant="ghost" onClick={onClear} className="text-amber-100/60">
          Close
        </Button>
      </div>
    );
  }

  if (result.shape === "needs_clarification") {
    return (
      <div
        className="border border-amber-700/40 bg-amber-950/20 rounded-md p-4 space-y-3"
        data-testid="anchor-needs-clarification"
      >
        <div className="flex items-start gap-2">
          <HelpCircle className="h-5 w-5 text-amber-300 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-100">One quick question</p>
            <p className="text-sm text-amber-100/80 leading-relaxed mt-1">{result.question}</p>
            {result.reason && (
              <p className="text-xs text-amber-100/50 leading-relaxed mt-2">{result.reason}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-amber-100/60">
          Add the answer to your input above and try again.
        </p>
      </div>
    );
  }

  if (result.shape === "refused") {
    return (
      <div
        className="border border-zinc-700 bg-zinc-950/60 rounded-md p-4 flex items-start gap-2"
        data-testid="anchor-refused"
      >
        <ShieldOff className="h-5 w-5 text-zinc-400 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-zinc-200">Can't encode this one</p>
          <p className="text-xs text-zinc-400 leading-relaxed mt-1">{result.reason}</p>
        </div>
      </div>
    );
  }

  if (result.shape === "audit") {
    return (
      <div
        className="border border-amber-700/40 bg-amber-950/10 rounded-md p-4 space-y-3"
        data-testid="anchor-audit-preview"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-300" />
          <p className="text-xs uppercase tracking-widest text-amber-300 font-bold">
            Preview · free
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-100/50 mb-1">Distilled goal</p>
          <p className="text-sm text-amber-100 leading-relaxed">{result.purposeAnchor}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-100/50 mb-1">Skeleton lines</p>
          <ul className="space-y-1">
            {result.previewLines.map((line, i) => (
              <li key={i} className="text-sm text-amber-100/80 font-mono">
                · {line}
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-amber-900/30 pt-3">
          <p className="text-xs uppercase tracking-widest text-amber-100/50 mb-1">
            Producer notes
          </p>
          <p className="text-xs text-amber-100/70 leading-relaxed">
            {result.previewProducerNotes}
          </p>
        </div>
        <p className="text-[11px] text-amber-100/50 leading-relaxed pt-1">
          This is the engine's outline. Hit <span className="font-bold">Render Full Anchor</span>{" "}
          to compose the polished version with voice.
        </p>
      </div>
    );
  }

  // shape === "anchor"
  return <RenderedAnchor result={result} />;
}

function RenderedAnchor({
  result,
}: {
  result: Extract<EngineResponse, { shape: "anchor" }>;
}) {
  const { toast } = useToast();
  const [isShared, setIsShared] = useState(result.isShared);
  const [shareId, setShareId] = useState<string | null>(result.shareId);
  const [copied, setCopied] = useState(false);

  const shareToggle = useMutation({
    mutationFn: async (next: boolean) => {
      const res = await apiRequest("POST", `/api/recovery/anchor/${result.id}/share`, {
        isShared: next,
      });
      return (await res.json()) as { isShared: boolean; shareId: string | null };
    },
    onSuccess: (data) => {
      setIsShared(data.isShared);
      setShareId(data.shareId);
      toast({
        title: data.isShared ? "Shared publicly" : "Made private",
        description: data.isShared
          ? "Anyone with the link can hear your anchor."
          : "Your anchor is private again.",
      });
    },
    onError: (e: any) =>
      toast({ variant: "destructive", title: "Couldn't change sharing", description: e?.message }),
  });

  const checkIn = useMutation({
    mutationFn: async (status: "remembered" | "struggled" | "forgot") => {
      const res = await apiRequest("POST", `/api/recovery/anchor/${result.id}/check-in`, {
        status,
      });
      return (await res.json()) as { ok: true };
    },
    onSuccess: () => toast({ title: "Got it", description: "Recorded — your anchor is learning you." }),
    onError: (e: any) =>
      toast({ variant: "destructive", title: "Couldn't record check-in", description: e?.message }),
  });

  const o = result.output;
  const shareUrl =
    typeof window !== "undefined" && shareId ? `${window.location.origin}/anchor/s/${shareId}` : "";

  const onCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ variant: "destructive", title: "Couldn't copy link" });
    }
  };

  return (
    <div
      className="border border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-zinc-950/60 rounded-lg p-5 space-y-4"
      data-testid="anchor-rendered"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-300 font-bold">
            {result.output.anchorType} anchor
          </p>
          <h3 className="text-xl font-bold text-amber-100 mt-1" data-testid="text-anchor-title">
            {o.title}
          </h3>
        </div>
      </div>

      <ol className="space-y-1.5">
        {o.lines.map((line, i) => (
          <li
            key={i}
            className="text-base text-amber-50 leading-relaxed pl-3 border-l-2 border-amber-500/40"
            data-testid={`text-anchor-line-${i}`}
          >
            {line}
          </li>
        ))}
      </ol>

      {o.callResponse && (
        <div className="bg-zinc-950/60 border border-amber-900/30 rounded-md p-3 space-y-2">
          <p className="text-xs uppercase tracking-widest text-amber-300/80 mb-1">
            Call & response (you echo Sasquatch)
          </p>
          {o.callResponse.sasquatch.map((line, i) => (
            <div key={i} className="grid grid-cols-[80px_1fr] gap-2 items-baseline">
              <span className="text-[10px] uppercase text-amber-400">Sasquatch</span>
              <span className="text-sm text-amber-100">{line}</span>
              <span className="text-[10px] uppercase text-amber-400/60">You</span>
              <span className="text-sm text-amber-100/70 italic">{o.callResponse?.you[i] ?? line}</span>
            </div>
          ))}
        </div>
      )}

      {o.mnemonic && (
        <div className="bg-zinc-950/60 border border-amber-900/30 rounded-md p-3 space-y-1">
          <p className="text-xs uppercase tracking-widest text-amber-300/80 mb-1">
            Hook stamp · {o.mnemonic.hookStamp}
          </p>
          <ul className="text-sm text-amber-100/80 space-y-1">
            {o.mnemonic.facts.map((f, i) => (
              <li key={i}>· {f}</li>
            ))}
          </ul>
        </div>
      )}

      {result.audioUrl && (
        <audio
          controls
          src={result.audioUrl}
          className="w-full"
          data-testid="audio-anchor"
        />
      )}

      <div className="border-t border-amber-900/30 pt-3 space-y-2">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-amber-100/50 mb-1">
            Producer notes
          </p>
          <p className="text-xs text-amber-100/70 leading-relaxed">{o.producerNotes}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-amber-100/50 mb-1">
            Reality check
          </p>
          <p className="text-xs text-amber-100/60 leading-relaxed italic">{o.realityFooter}</p>
        </div>
      </div>

      <div className="border-t border-amber-900/30 pt-3 space-y-3">
        <div>
          <p className="text-xs font-semibold text-amber-100 mb-2">
            Did you remember it from yesterday?
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-700/60 text-emerald-300"
              onClick={() => checkIn.mutate("remembered")}
              disabled={checkIn.isPending}
              data-testid="button-check-in-remembered"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Remembered
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-700/60 text-amber-300"
              onClick={() => checkIn.mutate("struggled")}
              disabled={checkIn.isPending}
              data-testid="button-check-in-struggled"
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Struggled
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-700 text-zinc-300"
              onClick={() => checkIn.mutate("forgot")}
              disabled={checkIn.isPending}
              data-testid="button-check-in-forgot"
            >
              <XCircle className="h-3.5 w-3.5 mr-1.5" /> Forgot
            </Button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-amber-100">Share publicly</p>
              <p className="text-[11px] text-amber-100/50 leading-relaxed mt-0.5">
                Off by default. Toggling on mints a private link anyone can open.
              </p>
            </div>
            <Button
              size="sm"
              variant={isShared ? "default" : "outline"}
              className={
                isShared
                  ? "bg-amber-500 hover:bg-amber-400 text-zinc-950"
                  : "border-amber-700 text-amber-200"
              }
              onClick={() => shareToggle.mutate(!isShared)}
              disabled={shareToggle.isPending}
              data-testid="button-share-toggle"
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5" /> {isShared ? "Shared" : "Share"}
            </Button>
          </div>
          {isShared && shareUrl && (
            <div className="mt-2 flex items-center gap-2">
              <code className="text-[11px] text-amber-200 bg-zinc-950 border border-amber-900/30 rounded px-2 py-1 truncate flex-1">
                {shareUrl}
              </code>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-700 text-amber-200"
                onClick={onCopy}
                data-testid="button-copy-share-link"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
