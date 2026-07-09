import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Upload,
  Wand2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Download,
  Disc3,
  ImageIcon,
  Globe,
  Lock,
  Save,
  Music2,
  FileJson,
  Crown,
  Copy,
  Check,
} from "lucide-react";

interface Track {
  id: number;
  position: number;
  source: string;
  sourceRef: string | null;
  title: string;
  audioUrl: string;
  durationSeconds: number | null;
}

interface Album {
  id: number;
  title: string;
  artist: string | null;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  shareSlug: string | null;
}

interface Features {
  monthlyCharacterCap: number;
  voicesAllowed: number;
  albumsAllowed: number;
  tracksPerAlbum: number;
  publicSharePages: boolean;
  customShareSlug: boolean;
  collaboratorsPerAlbum: number;
  aiCoverGenerator: boolean;
  distributionMetadata: boolean;
  pressKitExport: boolean;
  prioritySupport: boolean;
}

interface AlbumDetail {
  album: Album;
  tracks: Track[];
  features: Features;
}

interface Generation {
  id: number;
  voiceName: string | null;
  kind: string;
  title: string | null;
  text: string;
  audioUrl: string;
  durationSeconds: number | null;
  createdAt: string;
}

function formatTime(sec: number | null | undefined): string {
  if (!sec || !Number.isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function SurvivorAlbumEditor() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const params = useParams<{ id: string }>();
  const albumId = Number(params.id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaArtist, setMetaArtist] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [openGenPicker, setOpenGenPicker] = useState(false);
  const [customSlug, setCustomSlug] = useState("");
  const [copied, setCopied] = useState(false);

  const detail = useQuery<AlbumDetail>({
    queryKey: ["/api/albums", albumId],
    enabled: isAuthenticated && Number.isFinite(albumId),
    retry: false,
  });
  const noSubscription =
    detail.error &&
    (detail.error as any)?.message?.includes("tier_no_subscription");

  const generations = useQuery<{ items: Generation[] }>({
    queryKey: ["/api/sasquatch-studio/generations"],
    enabled: isAuthenticated,
  });

  // Sync local meta editor when album loads
  useEffect(() => {
    if (detail.data?.album) {
      setMetaTitle(detail.data.album.title);
      setMetaArtist(detail.data.album.artist || "");
      setMetaDescription(detail.data.album.description || "");
      setCustomSlug(detail.data.album.shareSlug || "");
    }
  }, [detail.data?.album?.id]);

  const tracks = detail.data?.tracks || [];
  const album = detail.data?.album;
  const features = detail.data?.features;
  const totalDuration = useMemo(
    () => tracks.reduce((s, t) => s + (t.durationSeconds || 0), 0),
    [tracks]
  );

  // Reset current index if it falls out of bounds (e.g. after delete)
  useEffect(() => {
    if (currentIndex >= tracks.length && tracks.length > 0) {
      setCurrentIndex(0);
    }
  }, [tracks.length, currentIndex]);

  const currentTrack = tracks[currentIndex];

  // Auto-load src when current changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.audioUrl;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentTrack?.id]);

  // Cleanup mic-style: stop audio on unmount
  useEffect(() => {
    return () => {
      try {
        audioRef.current?.pause();
      } catch {}
    };
  }, []);

  function play() {
    if (!currentTrack) return;
    audioRef.current?.play().catch(() => setIsPlaying(false));
    setIsPlaying(true);
  }
  function pause() {
    audioRef.current?.pause();
    setIsPlaying(false);
  }
  function next() {
    if (currentIndex < tracks.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
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
  function jumpTo(i: number) {
    setCurrentIndex(i);
    setIsPlaying(true);
  }
  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    if (audioRef.current && Number.isFinite(v)) {
      audioRef.current.currentTime = v;
      setProgress(v);
    }
  }

  // Mutations -----------------------------------------------------------------
  const saveMeta = useMutation({
    mutationFn: async () =>
      apiRequest("PATCH", `/api/albums/${albumId}`, {
        title: metaTitle,
        artist: metaArtist,
        description: metaDescription,
      }),
    onSuccess: () => {
      toast({ title: "Saved" });
      setEditingMeta(false);
      qc.invalidateQueries({ queryKey: ["/api/albums", albumId] });
      qc.invalidateQueries({ queryKey: ["/api/albums"] });
    },
    onError: (e: any) =>
      toast({ title: "Save failed", description: e?.message, variant: "destructive" }),
  });

  const togglePublic = useMutation({
    mutationFn: async (isPublic: boolean) =>
      apiRequest("PATCH", `/api/albums/${albumId}`, { isPublic }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/albums", albumId] });
    },
    onError: (e: any) => {
      toast({
        title: "Couldn't update",
        description: e?.message,
        variant: "destructive",
      });
    },
  });

  const updateSlug = useMutation({
    mutationFn: async () =>
      apiRequest("PATCH", `/api/albums/${albumId}`, { shareSlug: customSlug }),
    onSuccess: () => {
      toast({ title: "Custom URL saved" });
      qc.invalidateQueries({ queryKey: ["/api/albums", albumId] });
    },
    onError: (e: any) =>
      toast({
        title: "Couldn't save URL",
        description: e?.message,
        variant: "destructive",
      }),
  });

  const addTrackFromStudio = useMutation({
    mutationFn: async (g: Generation) =>
      apiRequest("POST", `/api/albums/${albumId}/tracks`, {
        source: "studio",
        sourceRef: String(g.id),
        title: g.title || g.text.slice(0, 60) || "Untitled",
        audioUrl: g.audioUrl,
        durationSeconds: g.durationSeconds || undefined,
      }),
    onSuccess: () => {
      toast({ title: "Track added" });
      setOpenGenPicker(false);
      qc.invalidateQueries({ queryKey: ["/api/albums", albumId] });
    },
    onError: (e: any) =>
      toast({ title: "Couldn't add", description: e?.message, variant: "destructive" }),
  });

  const uploadTrack = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("audio", file);
      fd.append("title", file.name.replace(/\.[^.]+$/, ""));
      const res = await fetch(`/api/albums/${albumId}/tracks/upload`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Track uploaded" });
      qc.invalidateQueries({ queryKey: ["/api/albums", albumId] });
    },
    onError: (e: any) =>
      toast({ title: "Upload failed", description: e?.message, variant: "destructive" }),
  });

  const uploadCover = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("cover", file);
      const res = await fetch(`/api/albums/${albumId}/cover`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Cover saved" });
      qc.invalidateQueries({ queryKey: ["/api/albums", albumId] });
      qc.invalidateQueries({ queryKey: ["/api/albums"] });
    },
    onError: (e: any) =>
      toast({ title: "Cover upload failed", description: e?.message, variant: "destructive" }),
  });

  const deleteTrack = useMutation({
    mutationFn: async (trackId: number) =>
      apiRequest("DELETE", `/api/albums/${albumId}/tracks/${trackId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/albums", albumId] });
    },
  });

  const reorder = useMutation({
    mutationFn: async (trackIds: number[]) =>
      apiRequest("PATCH", `/api/albums/${albumId}/reorder`, { trackIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/albums", albumId] });
    },
  });

  const deleteAlbum = useMutation({
    mutationFn: async () => apiRequest("DELETE", `/api/albums/${albumId}`),
    onSuccess: () => {
      toast({ title: "Album deleted" });
      navigate("/sasquatch-studio/albums");
    },
  });

  function moveTrack(idx: number, dir: -1 | 1) {
    const next = [...tracks];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    reorder.mutate(next.map((t) => t.id));
  }

  function downloadAlbum() {
    window.location.href = `/api/albums/${albumId}/download.zip`;
  }

  function downloadDistribution() {
    window.location.href = `/api/albums/${albumId}/distribution.json`;
  }

  function copyShareUrl() {
    if (!album?.shareSlug) return;
    const url = `${window.location.origin}/album/${album.shareSlug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (authLoading || detail.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div className="space-y-3">
          <Lock className="w-10 h-10 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Sign in to edit albums</h1>
          <Button asChild><a href="/api/login">Sign in</a></Button>
        </div>
      </div>
    );
  }
  if (noSubscription) {
    return (
      <div className="min-h-screen bg-background">
        <RecoveryHeader />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
          <Crown className="w-10 h-10 mx-auto text-primary" />
          <h1 className="text-2xl font-bold">Unlock the Album Builder</h1>
          <p className="text-muted-foreground">
            The Album Builder is part of Sasquatch Studio.
          </p>
          <Button asChild data-testid="link-editor-upgrade">
            <Link href="/sasquatch-studio">See plans</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }
  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">Album not found</h1>
          <Button asChild>
            <Link href="/sasquatch-studio/albums">Back to my albums</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <RecoverySEO
        title={`${album.title} — Album Editor`}
        description="Build, sequence, and download your album."
        canonical={`/sasquatch-studio/albums/${albumId}`}
      />
      <RecoveryHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" data-testid="link-back-albums">
            <Link href="/sasquatch-studio/albums">
              <ArrowLeft className="w-4 h-4 mr-1" /> All albums
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={downloadAlbum}
              disabled={!tracks.length}
              data-testid="button-download-zip"
            >
              <Download className="w-4 h-4 mr-2" />
              Download album (.zip)
            </Button>
            {features?.distributionMetadata && (
              <Button
                variant="outline"
                onClick={downloadDistribution}
                disabled={!tracks.length}
                data-testid="button-download-distribution"
              >
                <FileJson className="w-4 h-4 mr-2" />
                Distribution .json
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm(`Delete "${album.title}"? This cannot be undone.`)) {
                  deleteAlbum.mutate();
                }
              }}
              data-testid="button-delete-album"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* HERO + Album player */}
        <Card className="p-5 md:p-6 space-y-5">
          <div className="grid gap-6 md:grid-cols-[200px_1fr] items-start">
            {/* Cover */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="block w-full aspect-square bg-muted rounded-md overflow-hidden hover-elevate active-elevate-2 relative"
                data-testid="button-cover-upload"
              >
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <ImageIcon className="w-10 h-10" />
                    <span className="text-xs">Click to add cover</span>
                  </div>
                )}
                {uploadCover.isPending && (
                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadCover.mutate(f);
                  e.target.value = "";
                }}
              />
              <p className="text-xs text-muted-foreground text-center">
                Square images look best. JPG or PNG.
              </p>
            </div>

            {/* Meta + player */}
            <div className="space-y-4">
              {!editingMeta ? (
                <div className="space-y-1.5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Album
                  </p>
                  <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-album-title">
                    {album.title}
                  </h1>
                  {album.artist && (
                    <p className="text-base text-muted-foreground">{album.artist}</p>
                  )}
                  {album.description && (
                    <p className="text-sm text-muted-foreground max-w-2xl whitespace-pre-line">
                      {album.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <span data-testid="text-track-count">
                      {tracks.length} track{tracks.length === 1 ? "" : "s"}
                    </span>
                    <span>·</span>
                    <span data-testid="text-runtime">
                      {formatTime(totalDuration)} total
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-1"
                    onClick={() => setEditingMeta(true)}
                    data-testid="button-edit-meta"
                  >
                    Edit details
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      data-testid="input-meta-title"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Artist</Label>
                    <Input
                      value={metaArtist}
                      onChange={(e) => setMetaArtist(e.target.value)}
                      data-testid="input-meta-artist"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      rows={3}
                      data-testid="input-meta-description"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => saveMeta.mutate()}
                      disabled={saveMeta.isPending || !metaTitle.trim()}
                      data-testid="button-save-meta"
                    >
                      {saveMeta.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setEditingMeta(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Player */}
              <Card className="p-3 bg-card">
                <audio
                  ref={audioRef}
                  preload="metadata"
                  onTimeUpdate={(e) =>
                    setProgress((e.target as HTMLAudioElement).currentTime)
                  }
                  onLoadedMetadata={(e) => {
                    const a = e.target as HTMLAudioElement;
                    setDuration(a.duration);
                  }}
                  onEnded={next}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  data-testid="audio-album-player"
                />
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={prev}
                    disabled={!currentTrack}
                    data-testid="button-prev"
                  >
                    <SkipBack className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={isPlaying ? pause : play}
                    disabled={!currentTrack}
                    data-testid="button-play-pause"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={next}
                    disabled={!currentTrack || currentIndex >= tracks.length - 1}
                    data-testid="button-next"
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span className="truncate" data-testid="text-now-playing">
                        {currentTrack
                          ? `${currentIndex + 1}. ${currentTrack.title}`
                          : "No tracks yet"}
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
                      onChange={seek}
                      className="w-full"
                      data-testid="input-scrub"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Card>

        {/* SHARE controls (Pro+) */}
        {features?.publicSharePages ? (
          <Card className="p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Public share page</span>
                <Badge variant="secondary" className="text-xs">Pro</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={album.isPublic}
                  onCheckedChange={(v) => togglePublic.mutate(v)}
                  data-testid="switch-public"
                />
                <span className="text-sm text-muted-foreground">
                  {album.isPublic ? "Public" : "Private"}
                </span>
              </div>
            </div>
            {album.isPublic && album.shareSlug && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/album/${album.shareSlug}`}
                    className="text-xs"
                    data-testid="input-share-url"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyShareUrl}
                    data-testid="button-copy-share"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {features.customShareSlug && (
                  <div className="flex items-center gap-2 pt-2">
                    <Label className="text-xs whitespace-nowrap">
                      Custom URL:
                    </Label>
                    <Input
                      value={customSlug}
                      onChange={(e) =>
                        setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                      }
                      placeholder="my-album-name"
                      className="text-xs"
                      data-testid="input-custom-slug"
                    />
                    <Button
                      size="sm"
                      onClick={() => updateSlug.mutate()}
                      disabled={updateSlug.isPending || !customSlug.trim()}
                      data-testid="button-save-slug"
                    >
                      Save
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-4 flex flex-wrap items-center justify-between gap-3 border-primary/30">
            <div className="flex items-center gap-2 text-sm">
              <Crown className="w-4 h-4 text-primary" />
              <span>
                Want a public share page (e.g. <code>/album/your-album</code>)?
              </span>
            </div>
            <Button asChild size="sm" variant="outline" data-testid="link-upgrade-pro-share">
              <Link href="/sasquatch-studio">Upgrade to Pro</Link>
            </Button>
          </Card>
        )}

        {/* TRACKLIST */}
        <Card className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Music2 className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Tracklist</h2>
              {features && features.tracksPerAlbum !== -1 && (
                <Badge variant="outline" className="text-xs">
                  {tracks.length}/{features.tracksPerAlbum}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Dialog open={openGenPicker} onOpenChange={setOpenGenPicker}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-add-from-studio">
                    <Wand2 className="w-4 h-4 mr-2" />
                    Add from Studio
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add a Studio generation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {generations.isLoading ? (
                      <p className="text-sm text-muted-foreground">Loading…</p>
                    ) : !generations.data?.items.length ? (
                      <p className="text-sm text-muted-foreground">
                        No generations yet. Make some on the Studio page first.
                      </p>
                    ) : (
                      generations.data.items.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => addTrackFromStudio.mutate(g)}
                          className="w-full text-left p-3 border rounded-md hover-elevate flex items-center gap-3"
                          data-testid={`button-pick-gen-${g.id}`}
                        >
                          <Disc3 className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">
                              {g.title || g.text.slice(0, 80) || "Untitled"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {g.voiceName || "voice"} · {g.kind} ·{" "}
                              {formatTime(g.durationSeconds || 0)}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-upload-track"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload MP3
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                hidden
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach((f) => uploadTrack.mutate(f));
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          {tracks.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground space-y-1">
              <p className="text-sm">No tracks yet.</p>
              <p className="text-xs">
                Add one from your Studio generations or upload an MP3 above.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {tracks.map((t, i) => {
                const isCurrent = currentIndex === i;
                return (
                  <div
                    key={t.id}
                    className={`grid grid-cols-[2rem_1fr_auto] gap-3 items-center p-2 rounded-md border ${
                      isCurrent ? "bg-accent/30" : ""
                    }`}
                    data-testid={`row-track-${t.id}`}
                  >
                    <button
                      type="button"
                      onClick={() => jumpTo(i)}
                      className="text-sm tabular-nums text-muted-foreground hover:text-foreground"
                      data-testid={`button-play-track-${t.id}`}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 mx-auto" />
                      ) : (
                        <span>{String(i + 1).padStart(2, "0")}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => jumpTo(i)}
                      className="min-w-0 text-left"
                      data-testid={`button-select-track-${t.id}`}
                    >
                      <p className="font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.source === "studio" ? "Studio generation" : "Upload"} ·{" "}
                        {formatTime(t.durationSeconds)}
                      </p>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => moveTrack(i, -1)}
                        disabled={i === 0 || reorder.isPending}
                        data-testid={`button-up-${t.id}`}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => moveTrack(i, 1)}
                        disabled={i === tracks.length - 1 || reorder.isPending}
                        data-testid={`button-down-${t.id}`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Remove "${t.title}" from album?`)) {
                            deleteTrack.mutate(t.id);
                          }
                        }}
                        data-testid={`button-delete-track-${t.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  );
}
