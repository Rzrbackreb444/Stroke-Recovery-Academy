import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Radio as RadioIcon,
  Heart,
  Share2,
  Music,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import faultLineUrl from "@assets/fault-line-(icu)_1777781081423.mp3";
import whiteCoatsUrl from "@assets/white-coats_1777781117732.mp3";
import wheeledOutUrl from "@assets/wheeled-out-(discharge)_1777781117732.mp3";
import handicrapUrl from "@assets/handicrap_2_1777781117732.mp3";
import maximumBenefitUrl from "@assets/maximum-benefit-(interlude)_1777781929626.mp3";
import wheelchairWarriorUrl from "@assets/wheelchair-warrior_1777781929626.mp3";

interface RadioTrack {
  id: string;
  title: string;
  artist: string;
  vibe: string;
  story: string;
  audioUrl: string;
  durationLabel: string;
  hashtags: string[];
}

// Seed catalog — founder + early-survivor-supplied tracks. Survivor-generated
// anthems will graduate into this rotation once curation flow ships.
const SEED_CATALOG: RadioTrack[] = [
  {
    id: "fault-line-icu",
    title: "Fault Line (ICU)",
    artist: "Stroked-Out Sasquatch",
    vibe: "Rock Anthem",
    story:
      "Written from the ICU. The fault line is the moment your body splits in two — before the stroke and after. This song is the fight to put yourself back together.",
    audioUrl: faultLineUrl,
    durationLabel: "Full track",
    hashtags: ["#StrokeRecovery", "#FaultLine", "#SasquatchRadio"],
  },
  {
    id: "white-coats",
    title: "White Coats",
    artist: "Stroked-Out Sasquatch",
    vibe: "Hip-Hop Fight Song",
    story:
      "Every survivor knows the white coat parade — the rounds, the shrugs, the timelines that don't fit you. This one's for taking your recovery back from the people who said it was finished.",
    audioUrl: whiteCoatsUrl,
    durationLabel: "Full track",
    hashtags: ["#StrokeRecovery", "#WhiteCoats", "#SasquatchRadio"],
  },
  {
    id: "wheeled-out-discharge",
    title: "Wheeled Out (Discharge)",
    artist: "Stroked-Out Sasquatch",
    vibe: "Country Grit",
    story:
      "The day they roll you to the curb and tell you good luck. Discharge isn't the finish line — it's where the real work starts. This is the song for the ride home.",
    audioUrl: wheeledOutUrl,
    durationLabel: "Full track",
    hashtags: ["#StrokeRecovery", "#Discharge", "#SasquatchRadio"],
  },
  {
    id: "handicrap",
    title: "Handi-Crap",
    artist: "Stroked-Out Sasquatch",
    vibe: "Hip-Hop Fight Song",
    story:
      "Reclaiming the word the world tries to put on us. Disability isn't the punchline — it's the proving ground. Turn it up.",
    audioUrl: handicrapUrl,
    durationLabel: "Full track",
    hashtags: ["#StrokeRecovery", "#Disability", "#SasquatchRadio"],
  },
  {
    id: "maximum-benefit",
    title: "Maximum Benefit (Interlude)",
    artist: "Stroked-Out Sasquatch",
    vibe: "Spoken-Word Interlude",
    story:
      "The phrase every survivor hears: 'You've reached maximum benefit.' Insurance-speak for they're done with you. This interlude is the answer — recovery doesn't end when their coverage does.",
    audioUrl: maximumBenefitUrl,
    durationLabel: "Interlude",
    hashtags: ["#StrokeRecovery", "#MaximumBenefit", "#SasquatchRadio"],
  },
  {
    id: "wheelchair-warrior",
    title: "Wheelchair Warrior",
    artist: "Stroked-Out Sasquatch",
    vibe: "Rock Anthem",
    story:
      "Wheels aren't a defeat — they're the mount you ride into the next round. For every survivor who refuses to let their chair define the ceiling.",
    audioUrl: wheelchairWarriorUrl,
    durationLabel: "Full track",
    hashtags: ["#StrokeRecovery", "#WheelchairWarrior", "#SasquatchRadio"],
  },
];

// ─────────────────────────────────────────────────────────────────────
// Sasquatch Radio — survivor-anthem streaming player.
// MVP: client-side sequential playback across approved tracks. Phase 2
// adds server-side scheduling, ad-insertion, and Coach-Sasquatch DJ intros.
// ─────────────────────────────────────────────────────────────────────
export default function SasquatchRadio() {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [trackIdx, setTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [listenersOnline] = useState(() => 12 + Math.floor(Math.random() * 40));

  // Fetch survivor-approved tracks and merge with the seed catalog. Seed
  // tracks always lead so the founder set is the cold-start experience.
  const approvedQuery = useQuery<{ tracks: RadioTrack[] }>({
    queryKey: ["/api/recovery/radio/tracks"],
    staleTime: 60_000,
  });

  const tracks = useMemo(() => {
    const approved = approvedQuery.data?.tracks ?? [];
    return [...SEED_CATALOG, ...approved.filter((t) => !!t.audioUrl)];
  }, [approvedQuery.data]);

  const current = tracks[trackIdx] ?? SEED_CATALOG[0];

  // ── Audio element wiring ────────────────────────────────────────
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.play().catch(() => setIsPlaying(false));
    } else {
      el.pause();
    }
  }, [isPlaying, trackIdx]);

  function handleTimeUpdate() {
    const el = audioRef.current;
    if (!el) return;
    setProgress(el.currentTime);
    setDuration(el.duration || 0);
  }

  function handleEnded() {
    next();
  }

  function next() {
    setTrackIdx((i) => (i + 1) % tracks.length);
    setIsPlaying(true);
  }

  function prev() {
    setTrackIdx((i) => (i - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  }

  function seek(pct: number) {
    const el = audioRef.current;
    if (!el || !duration) return;
    el.currentTime = (pct / 100) * duration;
    setProgress(el.currentTime);
  }

  function shareCurrent() {
    const url = `${window.location.origin}/recovery/radio`;
    const text = `Listening to "${current.title}" by ${current.artist} on Sasquatch Radio — survivor-built anthems for the long road back.`;
    if (navigator.share) {
      navigator.share({ title: "Sasquatch Radio", text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${url}`).catch(() => {});
      toast({ title: "Link copied", description: "Share it with another survivor." });
    }
  }

  const progressPct = duration ? (progress / duration) * 100 : 0;
  const fmt = (s: number) => {
    if (!Number.isFinite(s) || s <= 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoverySEO
        title="Sasquatch Radio · Survivor-Built Anthems"
        description="24/7 streaming station playing recovery anthems composed by stroke survivors. Free to listen. Built by survivors, for survivors."
        canonical="/recovery/radio"
      />
      <RecoveryHeader />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-600/40 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-red-300 uppercase tracking-wider">
              Live · {listenersOnline} listening
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-3" data-testid="text-radio-title">
            Sasquatch Radio
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Recovery anthems written by survivors, for survivors. Free to listen, forever.
            Got a song in you? <Link href="/recovery/anthem/build" className="text-[#C9941A] underline">Build your own</Link>.
          </p>
        </section>

        {/* ── Player card ────────────────────────────────────── */}
        <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border-[#C9941A]/30 p-6 sm:p-8 mb-10" data-testid="card-player">
          <audio
            ref={audioRef}
            src={current.audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
            onEnded={handleEnded}
            preload="metadata"
            data-testid="audio-radio"
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-md bg-gradient-to-br from-[#C9941A] to-[#7a5a0f] flex items-center justify-center flex-shrink-0">
              <Music className="w-16 h-16 text-black/70" />
            </div>
            <div className="flex-1 min-w-0">
              <Badge className="bg-[#C9941A]/20 text-[#C9941A] border border-[#C9941A]/40 mb-2">
                {current.vibe}
              </Badge>
              <h2 className="text-3xl font-bold text-white mb-1 truncate" data-testid="text-now-playing-title">
                {current.title}
              </h2>
              <div className="text-white/70 mb-3" data-testid="text-now-playing-artist">{current.artist}</div>
              <p className="text-white/60 text-sm leading-relaxed">{current.story}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <Slider
              value={[progressPct]}
              onValueChange={([v]) => seek(v)}
              max={100}
              step={0.1}
              data-testid="slider-progress"
            />
            <div className="flex justify-between text-xs text-white/50 mt-1">
              <span data-testid="text-time-current">{fmt(progress)}</span>
              <span data-testid="text-time-total">{fmt(duration)}</span>
            </div>
          </div>

          {/* Transport */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMuted((m) => !m)}
                data-testid="button-mute"
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <Slider
                value={[muted ? 0 : volume * 100]}
                onValueChange={([v]) => {
                  setVolume(v / 100);
                  setMuted(false);
                }}
                max={100}
                className="w-24"
                data-testid="slider-volume"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={prev} data-testid="button-prev">
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                onClick={() => setIsPlaying((p) => !p)}
                className="w-14 h-14 rounded-full bg-[#C9941A] text-black hover:bg-[#C9941A]/90"
                data-testid="button-play"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={next} data-testid="button-next">
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" data-testid="button-like">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={shareCurrent} data-testid="button-share">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>

        {/* ── Up next ────────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">In rotation</h2>
            <Badge className="bg-white/10 text-white/70 border-0" data-testid="badge-track-count">
              {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tracks.map((t, i) => (
              <button
                key={t.id}
                onClick={() => {
                  setTrackIdx(i);
                  setIsPlaying(true);
                }}
                className={`flex items-center gap-3 p-3 rounded-md text-left hover-elevate ${
                  i === trackIdx ? "bg-[#C9941A]/10 border border-[#C9941A]/40" : "bg-[#1a1a1a] border border-white/5"
                }`}
                data-testid={`button-track-${t.id}`}
              >
                <div className="w-12 h-12 rounded bg-gradient-to-br from-[#C9941A] to-[#7a5a0f] flex items-center justify-center flex-shrink-0">
                  {i === trackIdx && isPlaying ? (
                    <RadioIcon className="w-5 h-5 text-black animate-pulse" />
                  ) : (
                    <Music className="w-5 h-5 text-black/70" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{t.title}</div>
                  <div className="text-sm text-white/60 truncate">{t.artist} · {t.vibe}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Founder note + CTA ─────────────────────────────── */}
        <Card className="bg-[#1a1a1a] border-white/10 p-6 sm:p-8 text-center">
          <Sparkles className="w-8 h-8 text-[#C9941A] mx-auto mb-3" />
          <h3 className="text-2xl font-semibold mb-2">Add your anthem to the rotation</h3>
          <p className="text-white/70 mb-5 max-w-xl mx-auto">
            Every survivor has a song in them. Build yours in five minutes — verses, chorus,
            real vocals, your story — and submit it to play on Sasquatch Radio.
          </p>
          <Button asChild className="bg-[#C9941A] hover:bg-[#C9941A]/90 text-black font-semibold" data-testid="button-build-anthem-cta">
            <Link href="/recovery/anthem/build">
              <Music className="w-4 h-4 mr-2" />
              Build your anthem
            </Link>
          </Button>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
