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
  ExternalLink,
} from "lucide-react";
import { SiApplemusic, SiItunes, SiTiktok, SiYoutubemusic } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import strokedOutSasquatchCover from "@assets/679586462_1618728516086893_8759763875674995547_n_1777817377755.jpg";

import faultLineUrl from "@assets/fault-line-(icu)_1777781081423.mp3";
import whiteCoatsUrl from "@assets/white-coats_1777781117732.mp3";
import wheeledOutUrl from "@assets/wheeled-out-(discharge)_1777781117732.mp3";
import handicrapUrl from "@assets/handicrap_2_1777781117732.mp3";
import maximumBenefitUrl from "@assets/maximum-benefit-(interlude)_1777781929626.mp3";
import wheelchairWarriorUrl from "@assets/wheelchair-warrior_1777781929626.mp3";
import sixtySixDaysUrl from "@assets/sixty-six-days._1777782059888.mp3";
import hostileConstructionUrl from "@assets/hostile-construction_1777782059888.mp3";
import theVanguardUrl from "@assets/the-vanguard_1777782175104.mp3";
import phantomLimbUrl from "@assets/phantom-limb_1777782175104.mp3";
import thePromiseUrl from "@assets/the-promise_1777782175104.mp3";
import iAmTheArchitectUrl from "@assets/i-am-the-architect_1777782175104.mp3";
import strokedOutButNotDoneUrl from "@assets/“stroked-out-(but-not-done)”_1777782389082.mp3";
import blackingOutUrl from "@assets/blacking-out_1777782436717.mp3";
import squatchyUrl from "@assets/squatchy-2_1777782436717.mp3";
import standUpUrl from "@assets/stand-up!_1777782562333.mp3";
import dingNowFightUrl from "@assets/ding-now-fight_1777782562333.mp3";

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
    id: "stroked-out-but-not-done",
    title: "Stroked-Out (But Not Done)",
    artist: "Stroked-Out Sasquatch",
    vibe: "Rock Anthem",
    story:
      "The signature anthem. The project's namesake. Stroke knocked us down — it didn't finish us. This is the flag in the ground for every survivor who refuses to be past tense.",
    audioUrl: strokedOutButNotDoneUrl,
    durationLabel: "Full track",
    hashtags: ["#StrokeRecovery", "#StrokedOutSasquatch", "#NotDone"],
  },
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
  {
    id: "sixty-six-days",
    title: "Sixty-Six Days",
    artist: "Stroked-Out Sasquatch",
    vibe: "Rock Anthem",
    story:
      "Science says it takes 66 days to build a habit. The Sasquatch Transformation Challenge says it's how you rewire a life. This is the soundtrack for the count.",
    audioUrl: sixtySixDaysUrl,
    durationLabel: "Full track",
    hashtags: ["#StrokeRecovery", "#SixtySixDays", "#SasquatchChallenge"],
  },
  {
    id: "hostile-construction",
    title: "Hostile Construction",
    artist: "Stroked-Out Sasquatch",
    vibe: "Hip-Hop Fight Song",
    story:
      "Rebuilding a brain isn't gentle work. Every neural pathway you forge is a hostile construction site — and you're the foreman, the crew, and the city. Hard hats on.",
    audioUrl: hostileConstructionUrl,
    durationLabel: "Full track",
    hashtags: ["#StrokeRecovery", "#Neuroplasticity", "#SasquatchRadio"],
  },
  {
    id: "the-vanguard",
    title: "The Vanguard",
    artist: "Stroked-Out Sasquatch",
    vibe: "Rock Anthem",
    story:
      "Every survivor who steps up before the rest is the vanguard — taking arrows for the ones still in the ICU. This one's for the front line of the recovery movement.",
    audioUrl: theVanguardUrl,
    durationLabel: "Full track",
    hashtags: ["#StrokeRecovery", "#Vanguard", "#SasquatchRadio"],
  },
  {
    id: "phantom-limb",
    title: "Phantom Limb",
    artist: "Stroked-Out Sasquatch",
    vibe: "Lo-Fi Recovery",
    story:
      "The arm that doesn't answer. The hand you still feel. Phantom-limb is the survivor's ghost — and the proof your brain remembers what to fight back to.",
    audioUrl: phantomLimbUrl,
    durationLabel: "Full track",
    hashtags: ["#StrokeRecovery", "#PhantomLimb", "#SasquatchRadio"],
  },
  {
    id: "the-promise",
    title: "The Promise",
    artist: "Stroked-Out Sasquatch",
    vibe: "Gospel Rise",
    story:
      "The promise you made yourself in the hospital bed. To your family. To the survivor you'll be a year from now. This is the song for keeping it.",
    audioUrl: thePromiseUrl,
    durationLabel: "Full track",
    hashtags: ["#StrokeRecovery", "#ThePromise", "#SasquatchRadio"],
  },
  {
    id: "i-am-the-architect",
    title: "I Am The Architect",
    artist: "Stroked-Out Sasquatch",
    vibe: "Hip-Hop Fight Song",
    story:
      "Doctors hand you a blueprint and call it a prognosis. Throw it out. You are the architect of the brain you're building next. Draw it yourself.",
    audioUrl: iAmTheArchitectUrl,
    durationLabel: "Full track",
    hashtags: ["#StrokeRecovery", "#Neuroplasticity", "#Architect"],
  },
  {
    id: "blacking-out",
    title: "Blacking Out",
    artist: "Stroked-Out Sasquatch",
    vibe: "Lo-Fi Recovery",
    story:
      "The moment everything goes dark — and then comes back different. Blacking-out is the survivor's origin story, told in the quiet between the heartbeats.",
    audioUrl: blackingOutUrl,
    durationLabel: "Full track",
    hashtags: ["#StrokeRecovery", "#BlackingOut", "#SasquatchRadio"],
  },
  {
    id: "squatchy",
    title: "Squatchy",
    artist: "Stroked-Out Sasquatch",
    vibe: "Rock Anthem",
    story:
      "The Sasquatch swagger track. Big-footed, big-hearted, big-noise. For the survivor who's done apologizing for taking up space in the world they fought back into.",
    audioUrl: squatchyUrl,
    durationLabel: "Full track",
    hashtags: ["#StrokeRecovery", "#Squatchy", "#SasquatchRadio"],
  },
  {
    id: "stand-up",
    title: "Stand Up!",
    artist: "Stroked-Out Sasquatch",
    vibe: "Rock Anthem",
    story:
      "Two words the rehab gym screams at you a thousand times. Two words you'll one day scream back at the world. This is the song for the first time you do.",
    audioUrl: standUpUrl,
    durationLabel: "Full track",
    hashtags: ["#StrokeRecovery", "#StandUp", "#SasquatchRadio"],
  },
  {
    id: "ding-now-fight",
    title: "Ding — Now Fight",
    artist: "Stroked-Out Sasquatch",
    vibe: "Hip-Hop Fight Song",
    story:
      "The bell rang the moment the stroke hit. Round one started without you. Get up. Ding — now fight. Every day a new round, every round another chance to rewire.",
    audioUrl: dingNowFightUrl,
    durationLabel: "Full track",
    hashtags: ["#StrokeRecovery", "#NowFight", "#SasquatchRadio"],
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
  // Coach Sasquatch DJ — separate audio element so intro playback never
  // races the main track. We pause the main element while the intro
  // plays, then resume on intro `ended`.
  const introRef = useRef<HTMLAudioElement | null>(null);

  const [trackIdx, setTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [listenersOnline] = useState(() => 12 + Math.floor(Math.random() * 40));

  // DJ Mode — persisted client-side preference. Defaults to OFF so first-
  // time listeners aren't surprised by a voice they didn't ask for.
  const [djMode, setDjMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("sasquatchRadio_djMode") === "1";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sasquatchRadio_djMode", djMode ? "1" : "0");
    }
  }, [djMode]);

  // Fetch survivor-approved tracks and merge with the seed catalog. Seed
  // tracks always lead so the founder set is the cold-start experience.
  const approvedQuery = useQuery<{ tracks: RadioTrack[] }>({
    queryKey: ["/api/recovery/radio/tracks"],
    staleTime: 60_000,
  });

  // Pre-fetched DJ intros — public, cached, projects only {trackId, audioUrl}.
  const introsQuery = useQuery<{ intros: Record<string, string> }>({
    queryKey: ["/api/recovery/radio/dj/intros"],
    staleTime: 5 * 60_000,
  });
  const intros = introsQuery.data?.intros ?? {};

  const tracks = useMemo(() => {
    const approved = approvedQuery.data?.tracks ?? [];
    return [...SEED_CATALOG, ...approved.filter((t) => !!t.audioUrl)];
  }, [approvedQuery.data]);

  const current = tracks[trackIdx] ?? SEED_CATALOG[0];
  const currentIntroUrl = djMode ? intros[current.id] : undefined;

  // Tracks which trackIdx already had its intro played in this session,
  // so prev/next/scrub doesn't replay the intro mid-listen.
  const introPlayedFor = useRef<Set<number>>(new Set());

  // ── Audio element wiring ────────────────────────────────────────
  useEffect(() => {
    const el = audioRef.current;
    const intro = introRef.current;
    if (el) el.volume = muted ? 0 : volume;
    if (intro) intro.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // Reset "intro played" memory whenever the user toggles DJ mode so
  // turning it on mid-listen will prepend an intro to the *next* track.
  // ALSO: if the user toggles DJ mode OFF mid-intro, clear the playing-
  // intro state and resume the main track immediately so playback
  // doesn't deadlock with isPlaying=true but no audio progressing.
  useEffect(() => {
    introPlayedFor.current = new Set();
    if (!djMode && isPlayingIntro) {
      const intro = introRef.current;
      if (intro) {
        try { intro.pause(); } catch {}
      }
      setIsPlayingIntro(false);
      const main = audioRef.current;
      if (main && isPlaying) main.play().catch(() => setIsPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [djMode]);

  // Safety net: if the intro audio errors (file missing, decode fail,
  // network drop), don't strand the player — fall through to the main
  // track immediately. Same path as the catch() in the play effect.
  function handleIntroError() {
    setIsPlayingIntro(false);
    const main = audioRef.current;
    if (main && isPlaying) main.play().catch(() => setIsPlaying(false));
  }

  useEffect(() => {
    const main = audioRef.current;
    const intro = introRef.current;
    if (!main) return;
    if (!isPlaying) {
      main.pause();
      intro?.pause();
      setIsPlayingIntro(false);
      return;
    }
    // Should we prepend an intro? Only if DJ mode is on, an intro exists
    // for this track, and we haven't already played it for this index.
    if (currentIntroUrl && intro && !introPlayedFor.current.has(trackIdx)) {
      introPlayedFor.current.add(trackIdx);
      setIsPlayingIntro(true);
      main.pause();
      try {
        intro.currentTime = 0;
      } catch {}
      intro.play().catch(() => {
        // Intro failed — fall through to the main track immediately.
        setIsPlayingIntro(false);
        main.play().catch(() => setIsPlaying(false));
      });
    } else if (!isPlayingIntro) {
      main.play().catch(() => setIsPlaying(false));
    }
    // We deliberately exclude isPlayingIntro from deps — it's set inside
    // this effect and shouldn't retrigger the chain.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, trackIdx, currentIntroUrl]);

  function handleIntroEnded() {
    setIsPlayingIntro(false);
    const main = audioRef.current;
    if (main && isPlaying) {
      main.play().catch(() => setIsPlaying(false));
    }
  }

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

        {/* ── Featured Album ─────────────────────────────────── */}
        <FeaturedAlbumCard />

        {/* ── Player card ────────────────────────────────────── */}
        <Card
          className="relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] via-[#141414] to-[#0a0a0a] border-[#C9941A]/30 p-6 sm:p-8 mb-10 shadow-2xl"
          data-testid="card-player"
        >
          {/* Soft gold ambient glow behind the artwork — only visible while playing */}
          <div
            aria-hidden
            className={`pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#C9941A]/15 blur-3xl transition-opacity duration-700 ${
              isPlaying ? "opacity-100" : "opacity-0"
            }`}
          />

          <audio
            ref={audioRef}
            src={current.audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
            onEnded={handleEnded}
            preload="metadata"
            data-testid="audio-radio"
          />
          {/* Coach Sasquatch DJ intro — separate element, only sources
              when an intro exists for the current track. */}
          {currentIntroUrl && (
            <audio
              ref={introRef}
              src={currentIntroUrl}
              onEnded={handleIntroEnded}
              onError={handleIntroError}
              preload="auto"
              data-testid="audio-dj-intro"
            />
          )}

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-7">
            {/* Album art with gold ring + glow when playing */}
            <div className="relative flex-shrink-0 mx-auto sm:mx-0">
              <div
                aria-hidden
                className={`absolute -inset-1 rounded-lg bg-gradient-to-br from-[#C9941A] via-[#E0B040] to-[#C9941A] opacity-60 blur transition-opacity duration-500 ${
                  isPlaying ? "opacity-70" : "opacity-30"
                }`}
              />
              <img
                src={strokedOutSasquatchCover}
                alt="Stroked Out Sasquatch album cover"
                className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-lg object-cover shadow-2xl ring-1 ring-white/10"
                data-testid="img-now-playing-cover"
              />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                <Badge className="bg-[#C9941A]/15 text-[#C9941A] border border-[#C9941A]/40 hover:bg-[#C9941A]/20">
                  {current.vibe}
                </Badge>
                {isPlaying && !isPlayingIntro && (
                  <span className="inline-flex items-end gap-[3px] h-4" aria-label="Now playing" data-testid="indicator-now-playing">
                    <span className="w-[3px] bg-[#C9941A] rounded-sm sasquatch-eq-bar sasquatch-eq-bar-1" />
                    <span className="w-[3px] bg-[#C9941A] rounded-sm sasquatch-eq-bar sasquatch-eq-bar-2" />
                    <span className="w-[3px] bg-[#C9941A] rounded-sm sasquatch-eq-bar sasquatch-eq-bar-3" />
                  </span>
                )}
              </div>
              <h2
                className="text-2xl sm:text-3xl font-bold text-white mb-1 leading-tight tracking-tight"
                data-testid="text-now-playing-title"
              >
                {current.title}
              </h2>
              <div className="text-white/60 text-sm font-medium mb-3" data-testid="text-now-playing-artist">
                {current.artist}
              </div>
              <p className="text-white/55 text-sm leading-relaxed line-clamp-3">{current.story}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="relative mb-5">
            <Slider
              value={[progressPct]}
              onValueChange={([v]) => seek(v)}
              max={100}
              step={0.1}
              className="sasquatch-progress"
              data-testid="slider-progress"
            />
            <div className="flex justify-between text-[11px] font-mono tracking-wider text-white/50 mt-2 tabular-nums">
              <span data-testid="text-time-current">{fmt(progress)}</span>
              <span data-testid="text-time-total">{fmt(duration)}</span>
            </div>
          </div>

          {/* Transport — three-zone grid; collapses to centered stack on mobile */}
          <div className="relative grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
            {/* Volume (left) */}
            <div className="flex items-center justify-center sm:justify-start gap-2 order-2 sm:order-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMuted((m) => !m)}
                className="text-white/70 hover:text-white"
                data-testid="button-mute"
                aria-label={muted ? "Unmute" : "Mute"}
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
                className="w-24 sasquatch-progress"
                data-testid="slider-volume"
              />
            </div>

            {/* Transport (center) */}
            <div className="flex items-center justify-center gap-3 order-1 sm:order-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={prev}
                className="text-white/80 hover:text-white"
                data-testid="button-prev"
                aria-label="Previous track"
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                onClick={() => setIsPlaying((p) => !p)}
                className="w-16 h-16 rounded-full bg-[#C9941A] text-black hover:bg-[#E0B040] shadow-[0_0_30px_-5px_rgba(201,148,26,0.6)] transition-all duration-200 hover:scale-105 active:scale-95"
                data-testid="button-play"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={next}
                className="text-white/80 hover:text-white"
                data-testid="button-next"
                aria-label="Next track"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            {/* Actions (right) */}
            <div className="flex items-center justify-center sm:justify-end gap-2 order-3">
              <Button
                variant={djMode ? "default" : "outline"}
                size="sm"
                onClick={() => setDjMode((d) => !d)}
                className={djMode ? "bg-[#C9941A] text-black hover:bg-[#E0B040]" : "border-white/20 text-white/80"}
                data-testid="button-dj-mode"
                title={djMode ? "DJ Mode is on — Coach intros between tracks" : "DJ Mode is off"}
              >
                <RadioIcon className="w-4 h-4 mr-1" />
                DJ {djMode ? "On" : "Off"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white"
                data-testid="button-like"
                aria-label="Like"
              >
                <Heart className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={shareCurrent}
                className="text-white/70 hover:text-white"
                data-testid="button-share"
                aria-label="Share"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {isPlayingIntro && (
            <div
              className="relative mt-4 text-center text-xs uppercase tracking-[0.2em] text-[#C9941A]"
              data-testid="text-dj-intro-playing"
            >
              <RadioIcon className="inline w-3 h-3 mr-1.5 -mt-0.5 animate-pulse" />
              Coach Sasquatch DJ · introducing the next track
            </div>
          )}

          {/* Quick "get the album" row — same destinations as the
              FeaturedAlbumCard above, but inline with the player so a
              listener mid-track can grab the album / a ringtone without
              scrolling. */}
          <div className="relative mt-6 pt-5 border-t border-white/5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Get the album</span>
              <div className="flex flex-wrap gap-1.5">
                <a
                  href="https://music.apple.com/us/search?term=Stroked+Out+Sasquatch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0a0a0a] border border-white/10 hover-elevate text-[11px] text-white/80 hover:text-white transition-colors"
                  data-testid="link-player-platform-apple-music"
                >
                  <SiApplemusic className="h-3 w-3" />
                  Apple Music
                </a>
                <a
                  href="https://music.apple.com/us/search?term=Stroked+Out+Sasquatch&types=ringtones"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0a0a0a] border border-white/10 hover-elevate text-[11px] text-white/80 hover:text-white transition-colors"
                  data-testid="link-player-platform-itunes"
                >
                  <SiItunes className="h-3 w-3 text-[#FB5BC5]" />
                  iTunes
                </a>
                <a
                  href="https://music.youtube.com/search?q=Stroked+Out+Sasquatch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0a0a0a] border border-white/10 hover-elevate text-[11px] text-white/80 hover:text-white transition-colors"
                  data-testid="link-player-platform-youtube-music"
                >
                  <SiYoutubemusic className="h-3 w-3 text-[#FF0000]" />
                  YouTube Music
                </a>
                <a
                  href="https://www.tiktok.com/search?q=Stroked%20Out%20Sasquatch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0a0a0a] border border-white/10 hover-elevate text-[11px] text-white/80 hover:text-white transition-colors"
                  data-testid="link-player-platform-tiktok"
                >
                  <SiTiktok className="h-3 w-3" />
                  TikTok
                </a>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Up next ────────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">In rotation</h2>
              <p className="text-xs text-white/40 uppercase tracking-widest mt-0.5">Tap any track to jump in</p>
            </div>
            <Badge className="bg-white/10 text-white/70 border-0" data-testid="badge-track-count">
              {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {tracks.map((t, i) => {
              const isActive = i === trackIdx;
              const isLive = isActive && isPlaying;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTrackIdx(i);
                    setIsPlaying(true);
                  }}
                  className={`group flex items-center gap-3 p-3 rounded-lg text-left hover-elevate transition-colors ${
                    isActive
                      ? "bg-gradient-to-r from-[#C9941A]/15 via-[#C9941A]/5 to-transparent border border-[#C9941A]/40"
                      : "bg-[#161616] border border-white/5"
                  }`}
                  data-testid={`button-track-${t.id}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  {/* Track number / live indicator */}
                  <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 ring-1 ring-white/10">
                    <img src={strokedOutSasquatchCover} alt="" className="w-full h-full object-cover" />
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                        isLive
                          ? "bg-black/55 opacity-100"
                          : isActive
                          ? "bg-black/40 opacity-100"
                          : "bg-black/0 opacity-0 group-hover:opacity-100 group-hover:bg-black/40"
                      }`}
                    >
                      {isLive ? (
                        <span className="inline-flex items-end gap-[2px] h-3.5" aria-label="Playing">
                          <span className="w-[2px] bg-[#C9941A] rounded-sm sasquatch-eq-bar sasquatch-eq-bar-1" />
                          <span className="w-[2px] bg-[#C9941A] rounded-sm sasquatch-eq-bar sasquatch-eq-bar-2" />
                          <span className="w-[2px] bg-[#C9941A] rounded-sm sasquatch-eq-bar sasquatch-eq-bar-3" />
                        </span>
                      ) : (
                        <Play className="w-4 h-4 text-white ml-0.5" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold truncate ${isActive ? "text-[#E0B040]" : "text-white"}`}>
                      {t.title}
                    </div>
                    <div className="text-xs text-white/50 truncate mt-0.5">
                      {t.artist} · {t.vibe}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-[10px] font-mono text-white/30 tabular-nums tracking-wider pr-1">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                </button>
              );
            })}
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

function FeaturedAlbumCard() {
  // STROKED OUT SASQUATCH — the survivor-authored album these tracks come
  // from. Available on every major streaming platform; cover + platform
  // links sit between the hero and the player so listeners can grab the
  // album for offline / mobile listening too.
  const platforms = [
    { name: "Apple Music", icon: SiApplemusic, href: "https://music.apple.com/us/search?term=Stroked+Out+Sasquatch", color: "text-white" },
    { name: "iTunes (ringtones)", icon: SiItunes, href: "https://music.apple.com/us/search?term=Stroked+Out+Sasquatch&types=ringtones", color: "text-[#FB5BC5]" },
    { name: "YouTube Music", icon: SiYoutubemusic, href: "https://music.youtube.com/search?q=Stroked+Out+Sasquatch", color: "text-[#FF0000]" },
    { name: "TikTok", icon: SiTiktok, href: "https://www.tiktok.com/search?q=Stroked%20Out%20Sasquatch", color: "text-white" },
  ];
  return (
    <Card
      className="mb-10 overflow-hidden border-[#C9941A]/30 bg-gradient-to-br from-[#0a1410] via-[#0a0a0a] to-[#1a0a05]"
      data-testid="card-featured-album"
    >
      <div className="grid md:grid-cols-[220px_1fr] gap-4 md:gap-6 p-4 md:p-6 items-center">
        <img
          src={strokedOutSasquatchCover}
          alt="Stroked Out Sasquatch album cover"
          className="w-full max-w-[220px] mx-auto rounded-md shadow-2xl"
          data-testid="img-featured-album-cover"
        />
        <div className="space-y-3 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#C9941A]/15 text-[#C9941A] border border-[#C9941A]/30">
            <Sparkles className="h-3 w-3" />
            Featured Album
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight" data-testid="text-featured-album-title">
            STROKED OUT SASQUATCH
          </h2>
          <p className="text-sm text-white/60 max-w-xl">
            The full album every track on this station was written for. Take it
            with you — out now on every major platform.
          </p>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
            {platforms.map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0a0a0a] border border-white/10 hover-elevate text-xs text-white/80 hover:text-white transition-colors"
                data-testid={`link-album-platform-${p.name.toLowerCase().replace(/\s/g, "-")}`}
              >
                <p.icon className={`h-3.5 w-3.5 ${p.color}`} />
                {p.name}
                <ExternalLink className="h-3 w-3 text-white/40" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
