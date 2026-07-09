import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Plus,
  Lock,
  Music2,
  Disc3,
  Globe,
  Crown,
  ArrowRight,
} from "lucide-react";

interface AlbumRow {
  id: number;
  title: string;
  artist: string | null;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  shareSlug: string | null;
  trackCount: number;
  updatedAt: string;
}

interface AlbumsResponse {
  items: AlbumRow[];
  tier: "creator" | "pro" | "label";
  limits: {
    albumsAllowed: number;
    tracksPerAlbum: number;
    publicSharePages: boolean;
    customShareSlug: boolean;
    distributionMetadata: boolean;
  };
}

const TIER_LABEL: Record<string, string> = {
  creator: "Creator",
  pro: "Pro",
  label: "Label",
};

export default function SurvivorAlbums() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [openNew, setOpenNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");

  const albums = useQuery<AlbumsResponse>({
    queryKey: ["/api/albums"],
    enabled: isAuthenticated,
    retry: false,
  });

  const noSubscription =
    albums.error &&
    (albums.error as any)?.message?.includes("tier_no_subscription");

  const createAlbum = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/albums", {
        title: newTitle,
        artist: newArtist || undefined,
      }),
    onSuccess: async (res: any) => {
      const data = await res.json();
      toast({ title: "Album created" });
      setOpenNew(false);
      setNewTitle("");
      setNewArtist("");
      qc.invalidateQueries({ queryKey: ["/api/albums"] });
      // Navigate into editor
      window.location.href = `/sasquatch-studio/albums/${data.album.id}`;
    },
    onError: (e: any) =>
      toast({
        title: "Couldn't create album",
        description: e?.message,
        variant: "destructive",
      }),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
          <Lock className="w-10 h-10 mx-auto text-muted-foreground" />
          <h1 className="text-3xl font-bold">Sign in to build albums</h1>
          <Button asChild data-testid="link-albums-signin">
            <a href="/api/login">Sign in</a>
          </Button>
        </main>
      </div>
    );
  }

  const items = albums.data?.items || [];
  const limits = albums.data?.limits;
  const tier = albums.data?.tier || "creator";
  const atLimit =
    limits && limits.albumsAllowed !== -1 && items.length >= limits.albumsAllowed;

  return (
    <div className="min-h-screen bg-background">
      <RecoverySEO
        title="My Albums — Sasquatch Studio"
        description="Build, sequence, and download your survivor albums. Pick tracks from your cloned-voice generations or upload anything. Walk away with a polished album you can play anywhere."
        canonical="/sasquatch-studio/albums"
      />
      <RecoveryHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        {noSubscription && (
          <Card className="p-6 space-y-3 border-primary/40">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Unlock the Album Builder</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              The Album Builder is part of Sasquatch Studio. Pick a tier and you'll be back
              here in a minute, building albums.
            </p>
            <Button asChild data-testid="link-no-sub-upgrade">
              <Link href="/sasquatch-studio">See plans</Link>
            </Button>
          </Card>
        )}
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <Badge variant="secondary">
              <Disc3 className="w-3 h-3 mr-1" /> Album Builder
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold">My Albums</h1>
            <p className="text-muted-foreground max-w-2xl">
              Pick tracks from your cloned-voice generations or upload your own.
              Reorder, name, add a cover. Then download the whole thing as a ZIP
              you can play anywhere — phone, car, anywhere.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" data-testid="link-back-studio">
              <Link href="/sasquatch-studio">
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Back to Studio
              </Link>
            </Button>
            <Dialog open={openNew} onOpenChange={setOpenNew}>
              <DialogTrigger asChild>
                <Button
                  disabled={!!atLimit}
                  data-testid="button-new-album"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Album
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New album</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="al-title">Title *</Label>
                    <Input
                      id="al-title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Hostile Construction"
                      data-testid="input-album-title"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="al-artist">Artist (optional)</Label>
                    <Input
                      id="al-artist"
                      value={newArtist}
                      onChange={(e) => setNewArtist(e.target.value)}
                      placeholder="e.g. Stroked-Out Sasquatch"
                      data-testid="input-album-artist"
                    />
                  </div>
                  <Button
                    onClick={() => createAlbum.mutate()}
                    disabled={createAlbum.isPending || !newTitle.trim()}
                    data-testid="button-create-album"
                  >
                    {createAlbum.isPending && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Tier strip */}
        <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Crown className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Plan:</span>
            <Badge data-testid="badge-tier">{TIER_LABEL[tier]}</Badge>
            {limits && (
              <span className="text-muted-foreground">
                ·{" "}
                {limits.albumsAllowed === -1
                  ? "Unlimited albums"
                  : `${items.length} / ${limits.albumsAllowed} albums`}
                {" · "}
                {limits.tracksPerAlbum === -1
                  ? "Unlimited tracks"
                  : `${limits.tracksPerAlbum} tracks/album`}
              </span>
            )}
          </div>
          {tier !== "label" && (
            <Button
              asChild
              size="sm"
              variant="outline"
              data-testid="link-upgrade-tier"
            >
              <Link href="/sasquatch-studio">Upgrade plan</Link>
            </Button>
          )}
        </Card>

        {atLimit && (
          <Card className="p-4 border-primary/40">
            <p className="text-sm">
              You've reached your album limit for the{" "}
              <strong>{TIER_LABEL[tier]}</strong> tier. Upgrade to Pro for
              unlimited albums.
            </p>
            <Button
              asChild
              size="sm"
              className="mt-2"
              data-testid="link-upgrade-from-limit"
            >
              <Link href="/sasquatch-studio">See plans</Link>
            </Button>
          </Card>
        )}

        {/* Album grid */}
        {albums.isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <Music2 className="w-10 h-10 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">No albums yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Click "New Album" to start. Drop in your Studio generations,
              upload MP3s, set the order, add a cover. When it's done, hit
              download — you'll get the whole album in one ZIP.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => (
              <Link
                key={a.id}
                href={`/sasquatch-studio/albums/${a.id}`}
                data-testid={`link-album-${a.id}`}
              >
                <Card className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer">
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                    {a.coverUrl ? (
                      <img
                        src={a.coverUrl}
                        alt={a.title}
                        className="w-full h-full object-cover"
                        data-testid={`img-cover-${a.id}`}
                      />
                    ) : (
                      <Disc3 className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-4 space-y-1">
                    <h3 className="font-semibold truncate" data-testid={`text-title-${a.id}`}>
                      {a.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {a.artist || "No artist"} · {a.trackCount} track
                      {a.trackCount === 1 ? "" : "s"}
                    </p>
                    {a.isPublic && a.shareSlug && (
                      <Badge variant="secondary" className="text-xs">
                        <Globe className="w-3 h-3 mr-1" /> Public
                      </Badge>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
