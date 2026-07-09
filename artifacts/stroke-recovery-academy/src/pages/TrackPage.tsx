import { useParams, Link } from "wouter";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Headphones, ExternalLink } from "lucide-react";
import { SiYoutubemusic, SiSpotify, SiApplemusic, SiAmazon } from "react-icons/si";
import {
  HOSTILE_CONSTRUCTION_TRACKS,
  getTrackBySlug,
} from "@shared/hostileConstruction";
import { ALBUM_COVER, HOSTILE_AUDIO } from "@/lib/hostileAudio";

function NotFound({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-background">
      <RecoveryHeader />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <h1 className="text-3xl font-bold">Track not found</h1>
        <p className="text-muted-foreground">No Hostile Construction track at "{slug}".</p>
        <Button asChild variant="default">
          <Link href="/hostile-construction">Back to album</Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}

export default function TrackPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const track = getTrackBySlug(slug);

  if (!track) return <NotFound slug={slug} />;

  const audio = HOSTILE_AUDIO[track.slug];
  const trackUrl = typeof window !== "undefined" ? window.location.href : "";
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(trackUrl)}`;
  const idx = HOSTILE_CONSTRUCTION_TRACKS.findIndex((t) => t.slug === track.slug);
  const prev = idx > 0 ? HOSTILE_CONSTRUCTION_TRACKS[idx - 1] : null;
  const next = idx < HOSTILE_CONSTRUCTION_TRACKS.length - 1 ? HOSTILE_CONSTRUCTION_TRACKS[idx + 1] : null;

  return (
    <div className="min-h-screen bg-background">
      <RecoverySEO
        title={`${track.title} — Stroked-Out Sasquatch | Hostile Construction`}
        description={track.vibe}
        canonical={`/track/${track.slug}`}
      />
      <RecoveryHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <div>
          <Button asChild variant="ghost" size="sm" data-testid="link-back-album">
            <Link href="/hostile-construction">
              <ArrowLeft className="w-4 h-4 mr-2" /> Hostile Construction
            </Link>
          </Button>
        </div>

        <section className="grid gap-6 md:grid-cols-[200px_1fr] items-start">
          <img
            src={ALBUM_COVER}
            alt="Hostile Construction"
            className="w-full rounded-md border"
            data-testid="img-track-cover"
          />
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Track {String(idx + 1).padStart(2, "0")} · Hostile Construction
            </p>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight" data-testid="text-track-title">
              {track.title}
            </h1>
            <p className="text-muted-foreground">Stroked-Out Sasquatch · {track.durationLabel}</p>
            {track.bookChapter && (
              <Badge variant="secondary">
                <BookOpen className="w-3 h-3 mr-1" />
                Book Sync · Chapter {track.bookChapter}
                {track.bookChapterTitle ? `: ${track.bookChapterTitle}` : ""}
              </Badge>
            )}
          </div>
        </section>

        {audio && (
          <Card className="p-4">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Headphones className="w-4 h-4" /> Play it now
            </p>
            <audio
              controls
              src={audio}
              className="w-full"
              data-testid="audio-player"
              preload="metadata"
            />
          </Card>
        )}

        <section className="grid gap-3 sm:grid-cols-2">
          {track.youtube && (
            <Button asChild variant="outline" size="lg" data-testid="link-listen-youtube">
              <a href={track.youtube} target="_blank" rel="noopener noreferrer">
                <SiYoutubemusic className="w-4 h-4 mr-2" /> YouTube Music
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
            </Button>
          )}
          {track.spotify && (
            <Button asChild variant="outline" size="lg" data-testid="link-listen-spotify">
              <a href={track.spotify} target="_blank" rel="noopener noreferrer">
                <SiSpotify className="w-4 h-4 mr-2" /> Spotify
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
            </Button>
          )}
          {track.apple && (
            <Button asChild variant="outline" size="lg" data-testid="link-listen-apple">
              <a href={track.apple} target="_blank" rel="noopener noreferrer">
                <SiApplemusic className="w-4 h-4 mr-2" /> Apple Music
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
            </Button>
          )}
          {track.amazon && (
            <Button asChild variant="outline" size="lg" data-testid="link-listen-amazon">
              <a href={track.amazon} target="_blank" rel="noopener noreferrer">
                <SiAmazon className="w-4 h-4 mr-2" /> Amazon Music
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
            </Button>
          )}
        </section>

        {!track.youtube && !track.spotify && !track.apple && (
          <Card className="p-4 border-dashed">
            <p className="text-sm text-muted-foreground">
              Streaming links land here as soon as the URLs are pasted into{" "}
              <code className="bg-muted px-1 py-0.5 rounded">shared/hostileConstruction.ts</code>.
              In the meantime, the player above plays the official cut.
            </p>
          </Card>
        )}

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">🎧 Sasquatch Track Sync</h2>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">The Vibe</p>
            <p className="mt-1">{track.vibe}</p>
          </div>
          {track.syncAction && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">The Action</p>
              <p className="mt-1">{track.syncAction}</p>
            </div>
          )}
          {track.story && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">The Story</p>
              <p className="mt-1">{track.story}</p>
            </div>
          )}
        </Card>

        <Card className="p-6 grid gap-4 sm:grid-cols-[160px_1fr] items-center">
          <img
            src={qrSrc}
            alt={`QR code linking to ${track.title}`}
            className="w-40 h-40 bg-white p-2 rounded-md border"
            data-testid="img-qr-code"
          />
          <div>
            <h3 className="font-semibold">Print-ready QR</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Drop this QR next to the Track Sync block in the manuscript. Readers scan, land here,
              tap any platform. No dead YouTube links in 2027.
            </p>
            <p className="text-xs text-muted-foreground mt-2 break-all">{trackUrl}</p>
          </div>
        </Card>

        <nav className="flex items-center justify-between pt-4 border-t">
          {prev ? (
            <Button asChild variant="ghost" data-testid="link-prev-track">
              <Link href={`/track/${prev.slug}`}>
                <ArrowLeft className="w-4 h-4 mr-2" /> {prev.title}
              </Link>
            </Button>
          ) : <span />}
          {next ? (
            <Button asChild variant="ghost" data-testid="link-next-track">
              <Link href={`/track/${next.slug}`}>
                {next.title} <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Link>
            </Button>
          ) : <span />}
        </nav>
      </main>

      <Footer />
    </div>
  );
}
