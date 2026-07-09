import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Disc3,
  Music2,
} from "lucide-react";

interface ShareTrack {
  id: number;
  position: number;
  title: string;
  audioUrl: string;
  durationSeconds: number | null;
}
interface ShareAlbum {
  id: number;
  title: string;
  artist: string | null;
  description: string | null;
  coverUrl: string | null;
  shareSlug: string;
}
interface ShareResponse {
  album: ShareAlbum;
  tracks: ShareTrack[];
}

function formatTime(sec: number | null | undefined): string {
  if (!sec || !Number.isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function AlbumShare() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const detail = useQuery<ShareResponse>({
    queryKey: ["/api/albums/share", slug],
  });

  const tracks = detail.data?.tracks || [];
  const album = detail.data?.album;
  const current = tracks[currentIndex];
  const totalDuration = tracks.reduce((s, t) => s + (t.durationSeconds || 0), 0);

  useEffect(() => {
    if (audioRef.current && current) {
      audioRef.current.src = current.audioUrl;
      if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [current?.id]);

  useEffect(() => {
    return () => {
      try { audioRef.current?.pause(); } catch {}
    };
  }, []);

  function next() {
    if (currentIndex < tracks.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    } else setIsPlaying(false);
  }
  function prev() {
    if ((audioRef.current?.currentTime ?? 0) > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      return;
    }
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
    }
  }

  if (detail.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-background">
        <RecoveryHeader />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center space-y-3">
          <Disc3 className="w-10 h-10 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Album not found</h1>
          <p className="text-muted-foreground">
            This album may be private or the link may be wrong.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <RecoverySEO
        title={`${album.title}${album.artist ? ` — ${album.artist}` : ""}`}
        description={album.description || `Listen to ${album.title} on Sasquatch Sound.`}
        canonical={`/album/${album.shareSlug}`}
      />
      <RecoveryHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <Card className="p-5 md:p-6 space-y-5">
          <div className="grid gap-6 md:grid-cols-[200px_1fr] items-start">
            <div className="aspect-square bg-muted rounded-md overflow-hidden">
              {album.coverUrl ? (
                <img
                  src={album.coverUrl}
                  alt={album.title}
                  className="w-full h-full object-cover"
                  data-testid="img-share-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Disc3 className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Album
                </p>
                <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-share-title">
                  {album.title}
                </h1>
                {album.artist && (
                  <p className="text-base text-muted-foreground">{album.artist}</p>
                )}
              </div>
              {album.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {album.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {tracks.length} track{tracks.length === 1 ? "" : "s"} · {formatTime(totalDuration)}
              </p>

              <Card className="p-3 bg-card">
                <audio
                  ref={audioRef}
                  preload="metadata"
                  onTimeUpdate={(e) =>
                    setProgress((e.target as HTMLAudioElement).currentTime)
                  }
                  onLoadedMetadata={(e) =>
                    setDuration((e.target as HTMLAudioElement).duration)
                  }
                  onEnded={next}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  data-testid="audio-share-player"
                />
                <div className="flex items-center gap-3">
                  <Button size="icon" variant="ghost" onClick={prev} disabled={!current}>
                    <SkipBack className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={() => {
                      if (!current) return;
                      if (isPlaying) audioRef.current?.pause();
                      else audioRef.current?.play().catch(() => {});
                    }}
                    disabled={!current}
                    data-testid="button-share-play"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={next}
                    disabled={!current || currentIndex >= tracks.length - 1}
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span className="truncate">
                        {current ? `${currentIndex + 1}. ${current.title}` : "—"}
                      </span>
                      <span className="tabular-nums shrink-0 ml-2">
                        {formatTime(progress)} / {formatTime(duration)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      step={0.1}
                      value={progress}
                      onChange={(e) => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = Number(e.target.value);
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Music2 className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Tracklist</h2>
          </div>
          {tracks.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setCurrentIndex(i);
                setIsPlaying(true);
              }}
              className={`w-full grid grid-cols-[2rem_1fr_auto] gap-3 items-center p-2 rounded-md border text-left hover-elevate ${
                currentIndex === i ? "bg-accent/30" : ""
              }`}
              data-testid={`button-share-track-${t.id}`}
            >
              <span className="text-sm tabular-nums text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-medium truncate">{t.title}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatTime(t.durationSeconds)}
              </span>
            </button>
          ))}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Built with <a href="/sasquatch-studio" className="underline">Sasquatch Studio</a>
        </p>
      </main>

      <Footer />
    </div>
  );
}
