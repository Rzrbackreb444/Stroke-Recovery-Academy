import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Hls from "hls.js";
import { Button } from "@/components/ui/button";
import {
  Play, Pause, Volume2, VolumeX, Rewind, FastForward, Captions, Gauge, Loader2, Languages,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AvailLocale { locale: string; name: string; ready: boolean; }
interface TranslationsResp {
  available: AvailLocale[];
  translations: Array<{ id: number; videoId: number; locale: string; transcriptText: string | null; captionVttUrl: string | null }>;
}

interface LessonVideo {
  id: number;
  lessonId: number;
  url: string;
  hlsUrl: string | null;
  duration: number | null;
  captionVttUrl: string | null;
  transcriptText: string | null;
  chapters: { start: number; title: string }[] | null;
  transcriptionStatus: "pending" | "processing" | "ready" | "failed";
  transcriptionError: string | null;
}

interface Props { lessonId: number; }

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function fmtTime(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}

export default function LessonVideoPlayer({ lessonId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [captionsOn, setCaptionsOn] = useState(true);

  const { toast } = useToast();
  const [locale, setLocale] = useState<string>("en");

  const { data, isLoading } = useQuery<{ video: LessonVideo }>({
    queryKey: ["/api/lessons", lessonId, "video"],
    refetchInterval: (q) => {
      const s = (q.state.data as any)?.video?.transcriptionStatus;
      return s === "processing" || s === "pending" ? 4000 : false;
    },
  });
  const video = data?.video;

  // P4-03: available + ready translations for this video.
  const transQ = useQuery<TranslationsResp>({
    queryKey: ["/api/lessons", video?.id, "translations"],
    enabled: !!video?.id,
  });

  const translateM = useMutation({
    mutationFn: async (target: string) => {
      const r = await apiRequest("POST", `/api/lessons/${video!.id}/translate`, { locale: target });
      return r.json();
    },
    onSuccess: (_d, target) => {
      toast({ title: "Translation ready", description: `Captions and transcript are now available.` });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", video?.id, "translations"] });
      setLocale(target);
    },
    onError: (err: any) => {
      toast({ title: "Translation failed", description: err?.message || "Try another language.", variant: "destructive" });
    },
  });

  const activeTranslation = locale !== "en"
    ? transQ.data?.translations.find(t => t.locale === locale)
    : null;
  const activeVttUrl = activeTranslation?.captionVttUrl || video?.captionVttUrl || null;
  const activeTranscript = activeTranslation?.transcriptText || video?.transcriptText || null;

  // HLS.js wiring (only if hlsUrl present)
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !video) return;
    const src = video.hlsUrl || video.url;
    if (video.hlsUrl && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(el);
      return () => hls.destroy();
    }
    el.src = src;
  }, [video?.url, video?.hlsUrl]);

  // Keyboard: space / ← → / J K L / M / C
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(document.activeElement === el || (document.activeElement as any)?.closest?.("[data-video-root]"))) return;
      const k = e.key.toLowerCase();
      if (k === " " || k === "k") { e.preventDefault(); el.paused ? el.play() : el.pause(); }
      else if (k === "arrowleft" || k === "j") { e.preventDefault(); el.currentTime = Math.max(0, el.currentTime - 5); }
      else if (k === "arrowright" || k === "l") { e.preventDefault(); el.currentTime = Math.min(el.duration || 0, el.currentTime + 5); }
      else if (k === "m") { el.muted = !el.muted; setMuted(el.muted); }
      else if (k === "c") setCaptionsOn(v => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Caption track visibility toggle
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    for (let i = 0; i < el.textTracks.length; i++) {
      el.textTracks[i].mode = captionsOn ? "showing" : "hidden";
    }
  }, [captionsOn, video?.captionVttUrl]);

  useEffect(() => {
    const el = videoRef.current;
    if (el) el.playbackRate = speed;
  }, [speed]);

  if (isLoading) {
    return <div className="aspect-video bg-black rounded-md border border-[#333] flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#E2741B] animate-spin" /></div>;
  }
  if (!video) {
    return <div className="aspect-video bg-black rounded-md border border-[#333] flex items-center justify-center text-gray-500 text-sm">No video yet for this lesson.</div>;
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div data-video-root className="bg-black rounded-md border border-[#333] overflow-hidden" data-testid={`lesson-video-${lessonId}`}>
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full aspect-video bg-black"
          controls={false}
          tabIndex={0}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setCurrent((e.target as HTMLVideoElement).currentTime)}
          onLoadedMetadata={(e) => setDuration((e.target as HTMLVideoElement).duration || video.duration || 0)}
          onVolumeChange={(e) => setMuted((e.target as HTMLVideoElement).muted)}
          aria-label="Lesson video"
          data-testid="video-element"
        >
          {activeVttUrl && (
            <track key={`${activeVttUrl}-${locale}`} kind="captions" src={activeVttUrl} srcLang={locale} label={locale.toUpperCase()} default />
          )}
        </video>

        {video.transcriptionStatus === "processing" && (
          <div className="absolute top-2 right-2 bg-[#1a1a1a]/90 border border-[#E2741B]/40 text-[#E2741B] text-xs rounded-md px-2 py-1 flex items-center gap-1" data-testid="status-captions-processing">
            <Loader2 className="w-3 h-3 animate-spin" /> Generating captions…
          </div>
        )}
        {video.transcriptionStatus === "failed" && (
          <div className="absolute top-2 right-2 bg-red-900/60 border border-red-500/40 text-red-200 text-xs rounded-md px-2 py-1" data-testid="status-captions-failed" title={video.transcriptionError || undefined}>
            Captions unavailable
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-3 py-2 bg-[#0D0D0D] border-t border-[#333] flex items-center gap-2 text-gray-300 text-sm flex-wrap">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => videoRef.current?.[playing ? "pause" : "play"]()} data-testid="button-play-pause" aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => videoRef.current && (videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10))} data-testid="button-rewind" aria-label="Back 10s">
          <Rewind className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => videoRef.current && (videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10))} data-testid="button-forward" aria-label="Forward 10s">
          <FastForward className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { if (videoRef.current) { videoRef.current.muted = !videoRef.current.muted; setMuted(videoRef.current.muted); } }} data-testid="button-mute" aria-label={muted ? "Unmute" : "Mute"}>
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>

        <div className="flex-1 min-w-[120px] flex items-center gap-2">
          <div className="text-xs tabular-nums" data-testid="text-current-time">{fmtTime(current)}</div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={(e) => { const el = videoRef.current; if (el) el.currentTime = Number(e.target.value); }}
            className="flex-1 accent-[#E2741B]"
            aria-label="Seek"
            data-testid="input-seek"
          />
          <div className="text-xs tabular-nums text-gray-500" data-testid="text-duration">{fmtTime(duration)}</div>
        </div>

        <label className="flex items-center gap-1 text-xs">
          <Gauge className="w-3.5 h-3.5 text-gray-500" />
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="bg-[#1a1a1a] border border-[#333] rounded px-1.5 py-0.5 text-xs"
            data-testid="select-speed"
            aria-label="Playback speed"
          >
            {SPEEDS.map(s => <option key={s} value={s}>{s}×</option>)}
          </select>
        </label>

        {activeVttUrl && (
          <Button size="icon" variant={captionsOn ? "default" : "ghost"} className="h-8 w-8" onClick={() => setCaptionsOn(v => !v)} data-testid="button-captions" aria-pressed={captionsOn} aria-label="Toggle captions">
            <Captions className="w-4 h-4" />
          </Button>
        )}

        {/* P4-03: translation picker */}
        {transQ.data?.available?.length ? (
          <label className="flex items-center gap-1 text-xs">
            <Languages className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={locale}
              onChange={(e) => {
                const v = e.target.value;
                const opt = transQ.data!.available.find(a => a.locale === v);
                if (v !== "en" && opt && !opt.ready) {
                  translateM.mutate(v);
                } else {
                  setLocale(v);
                }
              }}
              disabled={translateM.isPending}
              className="bg-[#1a1a1a] border border-[#333] rounded px-1.5 py-0.5 text-xs"
              data-testid="select-language"
              aria-label="Caption language"
            >
              <option value="en">English</option>
              {transQ.data.available.map(a => (
                <option key={a.locale} value={a.locale}>
                  {a.name}{a.ready ? "" : " — translate"}
                </option>
              ))}
            </select>
            {translateM.isPending && <Loader2 className="w-3 h-3 animate-spin text-[#E2741B]" />}
          </label>
        ) : null}
      </div>

      {/* Chapters */}
      {video.chapters && video.chapters.length > 0 && (
        <div className="px-3 py-2 bg-[#0D0D0D] border-t border-[#333] flex gap-2 overflow-x-auto" data-testid="chapter-list">
          {video.chapters.map((c, i) => (
            <button
              key={i}
              onClick={() => { const el = videoRef.current; if (el) { el.currentTime = c.start; el.play(); } }}
              className="shrink-0 text-xs text-gray-400 hover:text-[#E2741B] hover-elevate rounded-md px-2 py-1 border border-[#333]"
              data-testid={`button-chapter-${i}`}
            >
              <span className="text-[#E2741B] mr-1 tabular-nums">{fmtTime(c.start)}</span>
              {c.title}
            </button>
          ))}
        </div>
      )}

      {/* Transcript (locale-aware) */}
      {activeTranscript && (
        <details className="px-3 py-2 bg-[#0D0D0D] border-t border-[#333] text-xs text-gray-400" data-testid="transcript-panel">
          <summary className="cursor-pointer text-[#E2741B] hover:underline">
            Transcript {locale !== "en" && <span className="text-gray-500 ml-1">({locale.toUpperCase()})</span>}
          </summary>
          <p className="mt-2 whitespace-pre-wrap leading-relaxed">{activeTranscript}</p>
        </details>
      )}
    </div>
  );
}
