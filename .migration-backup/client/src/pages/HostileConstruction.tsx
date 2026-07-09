import { Link } from "wouter";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink, BookOpen, QrCode } from "lucide-react";
import { SiYoutubemusic, SiSpotify, SiApplemusic } from "react-icons/si";
import {
  HOSTILE_CONSTRUCTION_ALBUM,
  HOSTILE_CONSTRUCTION_TRACKS,
} from "@shared/hostileConstruction";
import { ALBUM_COVER, HOSTILE_AUDIO } from "@/lib/hostileAudio";

export default function HostileConstruction() {
  const album = HOSTILE_CONSTRUCTION_ALBUM;
  const tracks = HOSTILE_CONSTRUCTION_TRACKS;

  return (
    <div className="min-h-screen bg-background">
      <RecoverySEO
        title="Hostile Construction — The Stroked-Out Sasquatch Album"
        description="The official soundtrack of the recovery rebuild. 17 tracks, every one a tool. Listen, share, and play it loud while you do the reps."
        canonical="/hostile-construction"
      />
      <RecoveryHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        <section className="grid gap-8 md:grid-cols-[280px_1fr] items-start">
          <img
            src={ALBUM_COVER}
            alt="Hostile Construction album cover"
            className="w-full rounded-md border"
            data-testid="img-album-cover"
          />
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Album</p>
              <h1 className="text-4xl md:text-5xl font-bold" data-testid="text-album-title">
                {album.title}
              </h1>
              <p className="text-lg text-muted-foreground mt-1">{album.artist}</p>
            </div>
            <p className="text-base">{album.tagline}</p>
            <div className="flex flex-wrap gap-2">
              {album.youtubePlaylist && (
                <Button asChild variant="outline" data-testid="link-album-youtube">
                  <a href={album.youtubePlaylist} target="_blank" rel="noopener noreferrer">
                    <SiYoutubemusic className="w-4 h-4 mr-2" /> YouTube Music
                  </a>
                </Button>
              )}
              {album.spotifyAlbum && (
                <Button asChild variant="outline" data-testid="link-album-spotify">
                  <a href={album.spotifyAlbum} target="_blank" rel="noopener noreferrer">
                    <SiSpotify className="w-4 h-4 mr-2" /> Spotify
                  </a>
                </Button>
              )}
              {album.appleAlbum && (
                <Button asChild variant="outline" data-testid="link-album-apple">
                  <a href={album.appleAlbum} target="_blank" rel="noopener noreferrer">
                    <SiApplemusic className="w-4 h-4 mr-2" /> Apple Music
                  </a>
                </Button>
              )}
              <Button asChild variant="default" data-testid="link-album-radio">
                <Link href="/recovery/radio">
                  <Play className="w-4 h-4 mr-2" /> Play in Sasquatch Radio
                </Link>
              </Button>
            </div>
            {(!album.youtubePlaylist || !album.spotifyAlbum || !album.appleAlbum) && (
              <p className="text-xs text-muted-foreground">
                Streaming-platform links populate as soon as you paste them into{" "}
                <code className="bg-muted px-1 py-0.5 rounded">shared/hostileConstruction.ts</code>.
              </p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Tracklist</h2>
          <p className="text-sm text-muted-foreground">
            Every Track Sync block in the book points to one of these pages. Tap a track to open its
            page, hear the cut, and grab the QR for print layouts.
          </p>
          <div className="space-y-2">
            {tracks.map((t, i) => {
              const audio = HOSTILE_AUDIO[t.slug];
              return (
                <Card key={t.slug} className="p-4 hover-elevate">
                  <Link
                    href={`/track/${t.slug}`}
                    className="grid grid-cols-[2rem_1fr_auto] gap-4 items-center"
                    data-testid={`link-track-${t.slug}`}
                  >
                    <span className="text-muted-foreground text-sm tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium truncate">{t.title}</span>
                        {t.bookChapter && (
                          <Badge variant="secondary" className="text-xs">
                            <BookOpen className="w-3 h-3 mr-1" />
                            Ch. {t.bookChapter}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{t.vibe}</p>
                    </div>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {t.durationLabel}
                    </span>
                  </Link>
                  {audio && (
                    <audio
                      controls
                      preload="none"
                      src={audio}
                      className="w-full mt-3"
                      data-testid={`audio-${t.slug}`}
                    />
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <QrCode className="w-5 h-5 mt-1 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">For the print book</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Each track page (e.g. <code className="bg-muted px-1 py-0.5 rounded">/track/fault-line</code>)
                  auto-renders a QR code sized for the manuscript. Print-ready, no broken YouTube
                  links, swap streaming platforms underneath without ever reprinting the book.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
