import { useState, useRef } from "react";
import { Link } from "wouter";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Share2,
  Copy,
  Download,
  Flame,
  Heart,
  Quote,
  ArrowRight,
  Music,
  Video as VideoIcon,
} from "lucide-react";
import { SiFacebook, SiX, SiWhatsapp } from "react-icons/si";

const VIDEO_SRC = "/videos/squatchy-anthem.mp4";
const AUDIO_SRC = "/videos/stand-up.mp3";
const SHARE_URL =
  typeof window !== "undefined" ? `${window.location.origin}/recovery/anthem` : "https://strokerecoveryacademy.com/recovery/anthem";
const SHARE_COPY: Record<TrackId, string> = {
  squatchy: '"Squatchy" — From wheelchair to warrior. The Stroked-Out Sasquatch anthem.',
  "stand-up": '"Stand Up!" — Knocked down ain\'t down for the count. The new Stroked-Out Sasquatch single.',
};

type TrackId = "squatchy" | "stand-up";

interface TrackVerse {
  label: string;
  body: string;
}

interface Track {
  id: TrackId;
  title: string;
  kind: "video" | "audio";
  src: string;
  poster?: string;
  badge: string;
  tagline: string;
  verses: TrackVerse[];
  hook: string;
  hashtags: string[];
}

const TRACKS: Track[] = [
  {
    id: "squatchy",
    title: "Squatchy",
    kind: "video",
    src: VIDEO_SRC,
    poster: "/videos/squatchy-poster.jpg",
    badge: "Track 01 · Anthem",
    tagline: "From wheelchair to warrior. Get up. Get loud. Get Squatchy.",
    verses: [
      {
        label: "The Story",
        body: `"Squatchy" is a powerful rock anthem about rising after being knocked down. Inspired by the Stroked-Out Sasquatch's real journey — spending 2.5 years in a wheelchair after a massive stroke, then defying every "never" to reach 90%+ and still rising.`,
      },
      {
        label: "The Energy",
        body: `With a massive, chantable hook and raw, triumphant energy, this track celebrates resilience, fatherhood fire, and the daily grind of turning rock bottom into comeback.`,
      },
      {
        label: "The Mantra",
        body: `From wheelchair to warrior — get up, get loud, and get Squatchy. Heart still thumpin'? Life still pumpin'. Keep swinging.`,
      },
    ],
    hook: `"Heart still thumpin'? Life still pumpin'. Keep swinging."`,
    hashtags: [
      "Squatchy",
      "StrokeRecovery",
      "OvercomingAdversity",
      "NeverGiveUp",
      "SasquatchMindset",
      "StrokeSurvivor",
      "Resilience",
      "RecoveryJourney",
      "InspirationalMusic",
      "KeepSwinging",
    ],
  },
  {
    id: "stand-up",
    title: "Stand Up!",
    kind: "audio",
    src: AUDIO_SRC,
    badge: "Track 02 · Recovery Single",
    tagline: "Knocked down isn't the end. Stand up — every single day.",
    verses: [
      {
        label: "The Story",
        body: `"Stand Up!" is the second single from the Stroked-Out Sasquatch — a defiant, fist-in-the-air rock track for anyone the world tried to count out. Born from 2.5 years in a wheelchair, fifty staples, and a doctor's "probably never," it's the song Nick wrote to the version of himself who had to learn standing all over again.`,
      },
      {
        label: "The Energy",
        body: `Driving drums, gritty guitars, and a chant-along chorus you'll be screaming on the second listen. It's not a sad recovery ballad — it's the soundtrack you put on before therapy, before the hard rep, before the day you didn't think you had in you.`,
      },
      {
        label: "The Message",
        body: `Recovery isn't a finish line — it's a decision you make every morning. Your knees might shake. Your body might quit on you for a second. Stand up anyway. Stand up loud. Stand up for the survivor who's watching you do it.`,
      },
    ],
    hook: `"Knocked down ain't the same as down for the count. Stand up. Stand up. Stand up."`,
    hashtags: [
      "StandUp",
      "Squatchy",
      "StrokeRecovery",
      "NeverGiveUp",
      "SasquatchMindset",
      "StrokeSurvivor",
      "Resilience",
      "RecoveryAnthem",
      "FightSong",
      "KeepSwinging",
    ],
  },
];

export default function RecoveryAnthem() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [activeTrack, setActiveTrack] = useState<TrackId>("squatchy");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const { toast } = useToast();

  const currentTrack = TRACKS.find((t) => t.id === activeTrack)!;
  const currentMediaRef = currentTrack.kind === "video" ? videoRef : audioRef;

  const stopAll = () => {
    [videoRef.current, audioRef.current].forEach((m) => {
      if (m && !m.paused) {
        try { m.pause(); } catch { /* ignore */ }
      }
    });
  };

  const switchTrack = (id: TrackId) => {
    if (id === activeTrack) return;
    stopAll();
    setActiveTrack(id);
    setPlaying(false);
  };

  const togglePlay = () => {
    const m = currentMediaRef.current as HTMLMediaElement | null;
    if (!m) return;
    if (m.paused) {
      m.play().then(() => setPlaying(true)).catch(() => setPlaying(!m.paused));
    } else {
      m.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const m = currentMediaRef.current as HTMLMediaElement | null;
    if (!m) return;
    m.muted = !m.muted;
    setMuted(m.muted);
  };

  const goFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      toast({ title: "Link copied", description: "Share Squatchy with a survivor today." });
    } catch {
      toast({ title: "Copy failed", description: "Long-press the URL bar to copy.", variant: "destructive" });
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: currentTrack.title, text: SHARE_COPY[activeTrack], url: SHARE_URL });
      } catch {
        /* user cancelled */
      }
    } else {
      copyLink();
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoverySEO
        title="Squatchy — The Stroke Recovery Anthem | Stroked-Out Sasquatch"
        description={'"Squatchy" is a rock anthem about rising after being knocked down. From 2.5 years in a wheelchair to 90%+ recovery — Nick Kremers\' real comeback story turned into music. Get up. Get loud. Get Squatchy.'}
        canonical="/recovery/anthem"
      />
      <RecoveryHeader />

      {/* HERO */}
      <section className="relative border-b border-[#333]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E2741B]/15 via-[#0D0D0D] to-[#0D0D0D] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge className="bg-[#E2741B] text-black hover:bg-[#E2741B] font-bold tracking-widest">
              <Flame className="h-3 w-3 mr-1" /> NEW ANTHEM
            </Badge>
            <Badge variant="outline" className="border-[#333] text-gray-400 uppercase tracking-widest text-[10px]">
              Stroked-Out Sasquatch
            </Badge>
            <Badge variant="outline" className="border-[#333] text-gray-400 uppercase tracking-widest text-[10px]">
              Rock · Recovery · Resilience
            </Badge>
          </div>
          <h1
            className="font-black text-white leading-[0.95] tracking-tight mb-4"
            style={{ fontSize: "clamp(2.75rem, 8vw, 5.5rem)", fontFamily: "Playfair Display, Georgia, serif" }}
            data-testid="text-anthem-title"
          >
            Squatchy
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl leading-relaxed">
            From wheelchair to warrior. <span className="text-[#E2741B] font-semibold">Get up. Get loud. Get Squatchy.</span>
          </p>
        </div>
      </section>

      {/* TRACK SWITCHER + PLAYER */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Track tabs */}
        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Available tracks">
          {TRACKS.map((t) => {
            const active = t.id === activeTrack;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => switchTrack(t.id)}
                data-testid={`tab-track-${t.id}`}
                className={`group flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                  active
                    ? "border-[#E2741B] bg-[#E2741B]/15"
                    : "border-[#333] bg-[#1a1a1a] hover-elevate"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${
                    active ? "bg-[#E2741B] text-black" : "bg-[#0D0D0D] text-[#E2741B] border border-[#333]"
                  }`}
                >
                  {t.kind === "video" ? <VideoIcon className="h-4 w-4" /> : <Music className="h-4 w-4" />}
                </div>
                <div>
                  <p className={`text-[10px] uppercase tracking-[0.2em] font-bold ${active ? "text-[#E2741B]" : "text-gray-500"}`}>
                    {t.badge}
                  </p>
                  <p className="text-sm font-bold text-white leading-tight">{t.title}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active player */}
        <div className="relative rounded-xl overflow-hidden border border-[#E2741B]/40 bg-black shadow-[0_0_60px_rgba(226,116,27,0.15)]">
          {/* Video stays mounted so play state survives switching back. */}
          <div className={currentTrack.id === "squatchy" ? "block" : "hidden"}>
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              className="w-full h-auto block bg-black"
              playsInline
              preload="metadata"
              controls
              poster="/videos/squatchy-poster.jpg"
              aria-label="Squatchy — the Stroke Recovery Anthem video by Stroked-Out Sasquatch"
              data-testid="video-anthem"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
          </div>
          <div className={currentTrack.id === "stand-up" ? "block" : "hidden"}>
            <div className="relative w-full bg-gradient-to-br from-[#E2741B]/20 via-[#1a1a1a] to-black p-8 sm:p-12">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-20 h-20 rounded-xl bg-[#E2741B] flex items-center justify-center flex-shrink-0">
                  <Music className="h-10 w-10 text-black" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#E2741B] font-bold mb-1">Stroked-Out Sasquatch · Single</p>
                  <h3 className="text-3xl sm:text-4xl font-black text-white leading-tight" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                    Stand Up!
                  </h3>
                </div>
              </div>
              <audio
                ref={audioRef}
                src={AUDIO_SRC}
                preload="metadata"
                controls
                className="w-full"
                aria-label="Stand Up! — recovery single by Stroked-Out Sasquatch"
                data-testid="audio-stand-up"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        </div>

        {/* Custom action bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            onClick={togglePlay}
            className="bg-[#E2741B] text-black hover:bg-[#B8851A] font-bold"
            data-testid="button-anthem-play"
          >
            {playing ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {playing ? "Pause" : "Play"} {currentTrack.title}
          </Button>
          <Button
            variant="outline"
            onClick={toggleMute}
            className="border-[#333] bg-[#1a1a1a] text-white"
            data-testid="button-anthem-mute"
          >
            {muted ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
            {muted ? "Unmute" : "Mute"}
          </Button>
          {currentTrack.kind === "video" && (
            <Button
              variant="outline"
              onClick={goFullscreen}
              className="border-[#333] bg-[#1a1a1a] text-white"
              data-testid="button-anthem-fullscreen"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Fullscreen
            </Button>
          )}
          <a
            href={currentTrack.src}
            download={currentTrack.kind === "video" ? "Squatchy-Anthem.mp4" : "Stand-Up.mp3"}
            className="ml-auto"
          >
            <Button variant="outline" className="border-[#E2741B]/40 bg-[#1a1a1a] text-[#E2741B]" data-testid="button-anthem-download">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </a>
        </div>

        <p className="mt-3 text-sm text-gray-400 italic" data-testid="text-track-tagline">
          {currentTrack.tagline}
        </p>
      </section>

      {/* STORY + SHARE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#E2741B] font-bold" data-testid="text-active-track-label">
              About · {currentTrack.title}
            </p>
          </div>
          {currentTrack.verses.map((v) => (
            <Card key={`${currentTrack.id}-${v.label}`} className="bg-[#1a1a1a] border-[#333] p-6" data-testid={`card-verse-${v.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="flex items-start gap-3">
                <Quote className="h-5 w-5 text-[#E2741B] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#E2741B] mb-2 font-bold">{v.label}</p>
                  <p className="text-base sm:text-lg text-gray-200 leading-relaxed">{v.body}</p>
                </div>
              </div>
            </Card>
          ))}

          <Card className="bg-gradient-to-br from-[#E2741B]/10 via-[#1a1a1a] to-[#1a1a1a] border-[#E2741B]/30 p-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#E2741B] mb-3 font-bold">The Hook</p>
            <p className="text-2xl sm:text-3xl font-black text-white leading-tight" style={{ fontFamily: "Playfair Display, Georgia, serif" }} data-testid="text-track-hook">
              {currentTrack.hook}
            </p>
          </Card>
        </div>

        {/* SHARE RAIL */}
        <aside className="space-y-4">
          <Card className="bg-[#1a1a1a] border-[#333] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="h-4 w-4 text-[#E2741B]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Share The Anthem</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              One share could reach a survivor having their hardest day. Be that.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={nativeShare} className="bg-[#E2741B] text-black hover:bg-[#B8851A] font-bold w-full" data-testid="button-anthem-share">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" onClick={copyLink} className="border-[#333] bg-[#0D0D0D] text-white w-full" data-testid="button-anthem-copy">
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_COPY[activeTrack])}&url=${encodeURIComponent(SHARE_URL)}&hashtags=${currentTrack.hashtags.join(",")}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-anthem-twitter"
              >
                <Button variant="outline" className="border-[#333] bg-[#0D0D0D] text-white w-full">
                  <SiX className="h-4 w-4 mr-2" />
                  Post on X
                </Button>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-anthem-facebook"
              >
                <Button variant="outline" className="border-[#333] bg-[#0D0D0D] text-white w-full">
                  <SiFacebook className="h-4 w-4 mr-2" />
                  Share on Facebook
                </Button>
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${SHARE_COPY[activeTrack]} ${SHARE_URL}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-anthem-whatsapp"
              >
                <Button variant="outline" className="border-[#333] bg-[#0D0D0D] text-white w-full">
                  <SiWhatsapp className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </a>
            </div>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#333] p-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#E2741B] mb-3 font-bold">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {currentTrack.hashtags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border-[#333] text-gray-400 text-[10px] tracking-wider"
                  data-testid={`badge-tag-${tag.toLowerCase()}`}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#333] p-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#E2741B] mb-2 font-bold">Live It</p>
            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              The anthem isn't just a song — it's the 66-Day program. Train the same way Nick rebuilt himself.
            </p>
            <Link href="/recovery/challenge">
              <Button className="bg-[#E2741B] text-black hover:bg-[#B8851A] font-bold w-full" data-testid="button-anthem-cta-challenge">
                Start the 66-Day Challenge
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </Card>
        </aside>
      </section>

      {/* BOTTOM CTA */}
      <section className="border-t border-[#333] bg-gradient-to-b from-[#0D0D0D] to-[#1a1a1a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 text-center">
          <Heart className="h-8 w-8 text-[#E2741B] mx-auto mb-4" />
          <h2
            className="text-3xl sm:text-5xl font-black text-white mb-4"
            style={{ fontFamily: "Playfair Display, Georgia, serif" }}
          >
            Get up. Get loud. Get Squatchy.
          </h2>
          <p className="text-base sm:text-lg text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            If this anthem hit you, send it to a survivor. Then walk into your recovery like you mean it.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={nativeShare} className="bg-[#E2741B] text-black hover:bg-[#B8851A] font-bold" data-testid="button-anthem-share-bottom">
              <Share2 className="h-4 w-4 mr-2" />
              Share Squatchy
            </Button>
            <Link href="/recovery/dashboard">
              <Button variant="outline" className="border-[#E2741B]/40 bg-[#1a1a1a] text-white" data-testid="button-anthem-dashboard">
                Open Recovery Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
