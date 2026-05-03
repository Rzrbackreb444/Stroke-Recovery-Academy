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
  AlertTriangle, Square, Volume2,
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

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!recordedBlob) throw new Error("No recording");
      const audioBase64 = await blobToBase64(recordedBlob);
      const res = await apiRequest("POST", "/api/voice-clones", {
        name,
        description,
        consentAccepted: true,
        audioBase64,
        audioMimeType: recordedBlob.type,
        sampleDurationSec: elapsed,
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
      discardRecording();
    },
    onError: (e: any) => {
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

  const canSubmit =
    !!recordedBlob &&
    elapsed >= MIN_DURATION &&
    name.trim().length > 0 &&
    consentChecked &&
    !createMutation.isPending;

  const isAdmin = (user as any)?.role === "admin";

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
          <div className="p-3 rounded-md bg-[#C9941A]/20 border border-[#C9941A]/40">
            <Mic2 className="w-7 h-7 text-[#C9941A]" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Survivor Voice Cloning</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Use your own voice across the platform — Anthem narration, Anchor Studio,
              Daily Quote, and Coach replies.
            </p>
          </div>
          <Badge className="bg-[#C9941A]/20 text-[#C9941A] border border-[#C9941A]/40">
            Beta · Admin-gated
          </Badge>
        </div>

        {!isAdmin && (
          <Alert className="mb-6 border-[#C9941A]/40 bg-[#C9941A]/10">
            <AlertTriangle className="h-4 w-4 text-[#C9941A]" />
            <AlertTitle>Coming soon for survivors</AlertTitle>
            <AlertDescription className="text-zinc-300">
              Voice cloning will launch as a $9/month add-on. We're stress-testing it with
              admins first to make sure the consent flow and audio quality hold up.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-[#1a1a1a]/80 border-[#333]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#C9941A]" />
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
                <div className="flex items-center gap-2 text-sm font-medium text-[#C9941A]">
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
                      elapsed >= MIN_DURATION ? "text-[#C9941A]" : "text-zinc-500"
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
                      className="bg-[#C9941A] hover:bg-[#C9941A] text-black"
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
                className="w-full bg-[#C9941A] hover:bg-[#C9941A] text-black disabled:opacity-50"
                data-testid="button-create-clone"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Cloning…
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5 mr-2" /> Clone this voice
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a]/80 border-[#333]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic2 className="w-5 h-5 text-[#C9941A]" />
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
