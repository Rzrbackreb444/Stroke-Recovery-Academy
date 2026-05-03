import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Music2, Crown, Loader2, Sparkles, Copy, Check, Share2, Trash2, Lock, AlertTriangle, ExternalLink } from "lucide-react";
import { SiApplemusic, SiItunes, SiTiktok, SiYoutubemusic } from "react-icons/si";
import strokedOutSasquatchCover from "@assets/679586462_1618728516086893_8759763875674995547_n_1777817377755.jpg";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Singer = "male" | "female" | "duet" | "auto";
type Genre =
  | "hip-hop" | "pop" | "rock" | "rnb" | "country" | "folk"
  | "electronic" | "indie" | "soul" | "gospel" | "jazz"
  | "industrial" | "cinematic" | "other";

const GENRE_OPTIONS: { value: Genre; label: string }[] = [
  { value: "hip-hop", label: "Hip-Hop" },
  { value: "pop", label: "Pop" },
  { value: "rock", label: "Rock" },
  { value: "rnb", label: "R&B" },
  { value: "country", label: "Country" },
  { value: "folk", label: "Folk" },
  { value: "electronic", label: "Electronic" },
  { value: "indie", label: "Indie" },
  { value: "soul", label: "Soul" },
  { value: "gospel", label: "Gospel" },
  { value: "jazz", label: "Jazz" },
  { value: "industrial", label: "Industrial" },
  { value: "cinematic", label: "Cinematic" },
  { value: "other", label: "Other / Let Gemini Pick" },
];

interface LyricsOutput {
  title: string;
  styleHeader: { style: string; tempo: string; vibe: string };
  sections: Array<{
    label: string;
    sceneNote?: string | null;
    lines: Array<{ voice?: string | null; direction?: string | null; text: string }>;
  }>;
  hashtags?: string[];
  producerNotes?: string;
}

interface UsageStatus {
  month: string;
  lyricsDraftCount: number;
  limit: number | null;
  premium: boolean;
}

interface DraftRow {
  id: number;
  storyText: string;
  genre: string;
  singer: string;
  lyricsData: LyricsOutput;
  isShared: boolean;
  shareId: string | null;
  createdAt: string;
}

interface GenerateResponse {
  shape: "lyrics" | "crisis" | "refused";
  id?: number;
  output?: LyricsOutput;
  isShared?: boolean;
  shareId?: string | null;
  message?: string;
  reason?: string;
  category?: string;
  resources?: Array<{ label: string; detail: string; action: { type: string; value: string } }>;
}

export default function LyricsStudio() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [storyText, setStoryText] = useState("");
  const [genre, setGenre] = useState<Genre>("hip-hop");
  const [singer, setSinger] = useState<Singer>("auto");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const usage = useQuery<UsageStatus>({
    queryKey: ["/api/lyrics/usage"],
    enabled: isAuthenticated,
  });

  const drafts = useQuery<DraftRow[]>({
    queryKey: ["/api/lyrics/list"],
    enabled: isAuthenticated,
  });

  const generate = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/lyrics/generate", {
        storyText: storyText.trim(),
        genre,
        singer,
      });
      return (await res.json()) as GenerateResponse;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/lyrics/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lyrics/list"] });
      if (data.shape === "lyrics") {
        toast({ title: "Lyrics ready", description: `"${data.output?.title}" is in your library.` });
      } else if (data.shape === "refused") {
        toast({
          variant: "destructive",
          title: "Couldn't write that one",
          description: data.reason ?? "Try a different angle on the story.",
        });
      }
    },
    onError: async (err: any) => {
      let msg = err?.message ?? "Generation failed";
      try {
        const body = err?.message?.startsWith("{") ? JSON.parse(err.message) : null;
        if (body?.message) msg = body.message;
      } catch {}
      toast({ variant: "destructive", title: "Couldn't generate lyrics", description: msg });
    },
  });

  const toggleShare = useMutation({
    mutationFn: async ({ id, isShared }: { id: number; isShared: boolean }) => {
      const res = await apiRequest("POST", `/api/lyrics/${id}/share`, { isShared });
      return (await res.json()) as { isShared: boolean; shareId: string | null };
    },
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/lyrics/list"] });
      if (result?.id === vars.id) {
        setResult({ ...result, isShared: data.isShared, shareId: data.shareId });
      }
      if (data.isShared && data.shareId) {
        const url = `${window.location.origin}/lyrics/s/${data.shareId}`;
        toast({ title: "Public link is live", description: url });
      } else {
        toast({ title: "Set back to private", description: "The public link no longer works." });
      }
    },
  });

  const deleteDraft = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/lyrics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lyrics/list"] });
      toast({ title: "Draft deleted" });
    },
  });

  const renderForCopy = (o: LyricsOutput): string => {
    const head = `THE ARCHITECT'S SPECIFICATIONS\n• Style: ${o.styleHeader.style}\n• Tempo: ${o.styleHeader.tempo}\n• Vibe: ${o.styleHeader.vibe}\n\nTITLE: ${o.title}\n`;
    const body = o.sections
      .map((s) => {
        const head = s.label;
        const scene = s.sceneNote ? `\n${s.sceneNote.startsWith("(") ? s.sceneNote : `(${s.sceneNote})`}` : "";
        const lines = s.lines
          .map((l) => {
            const voiceTag = l.voice ? `(${l.voice}${l.direction ? ` — ${l.direction}` : ""})\n` : "";
            return `${voiceTag}${l.text}`;
          })
          .join("\n");
        return `${head}${scene}\n${lines}`;
      })
      .join("\n\n");
    const tail = o.hashtags?.length ? `\n\n${o.hashtags.map((h) => `#${h}`).join(" ")}` : "";
    return `${head}\n${body}${tail}`;
  };

  const handleCopy = (o: LyricsOutput) => {
    navigator.clipboard.writeText(renderForCopy(o));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    toast({ title: "Copied", description: "Production sheet copied to clipboard." });
  };

  const lyricsResult = result?.shape === "lyrics" ? result : null;
  const crisisResult = result?.shape === "crisis" ? result : null;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9941A]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
        <Card className="bg-[#111] border-[#222] max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#C9941A]">
              <Lock className="h-5 w-5" />
              Sign in to use Lyrics Studio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-400">
              Lyrics Studio turns your story into a Grammy-grade production sheet.
              Sign in to start writing.
            </p>
            <Link href="/auth">
              <Button className="w-full bg-[#C9941A] hover:bg-[#b08016] text-black" data-testid="button-sign-in">
                Sign in
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-24">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        {/* Featured album — proof of what survivors build with these tools */}
        <FeaturedAlbumBanner />

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Music2 className="h-6 w-6 text-[#C9941A]" />
              <h1 className="text-2xl lg:text-3xl font-bold">Lyrics Studio</h1>
              <Badge className="bg-[#C9941A]/15 text-[#C9941A] border border-[#C9941A]/30 gap-1">
                <Crown className="h-3 w-3" /> PRO
              </Badge>
            </div>
            <p className="text-sm text-gray-400 max-w-2xl">
              Your story, your voice — turned into a full song production sheet.
              Suno-ready, Udio-ready, producer-ready.
            </p>
          </div>
          {usage.data && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111] border border-[#222]"
              data-testid="status-usage"
            >
              <Sparkles className="h-4 w-4 text-[#C9941A]" />
              <span className="text-xs text-gray-400">
                {usage.data.premium ? (
                  <span className="text-[#C9941A] font-semibold">Premium · unlimited</span>
                ) : (
                  <>
                    <span className="text-white font-semibold">{usage.data.lyricsDraftCount}</span>
                    <span className="text-gray-500"> / {usage.data.limit} this month</span>
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input */}
          <Card className="bg-[#111] border-[#222]">
            <CardHeader>
              <CardTitle className="text-base text-white">Your story</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="story" className="text-xs text-gray-400 uppercase tracking-wide">
                  Style, description, or story
                </Label>
                <Textarea
                  id="story"
                  data-testid="input-story"
                  placeholder="Tell me the song. What happened, what you felt, the aesthetic, the line you want hammered home. Write it raw — I'll shape it into verses."
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value.slice(0, 5000))}
                  rows={10}
                  className="bg-[#0a0a0a] border-[#222] text-white placeholder:text-gray-600 resize-y min-h-[200px]"
                />
                <div className="text-xs text-gray-500 text-right">
                  {storyText.length} / 5000
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-400 uppercase tracking-wide">Genre</Label>
                <Select value={genre} onValueChange={(v) => setGenre(v as Genre)}>
                  <SelectTrigger className="bg-[#0a0a0a] border-[#222] text-white" data-testid="select-genre">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#222]">
                    {GENRE_OPTIONS.map((g) => (
                      <SelectItem key={g.value} value={g.value} data-testid={`option-genre-${g.value}`}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-400 uppercase tracking-wide">Singer</Label>
                <RadioGroup value={singer} onValueChange={(v) => setSinger(v as Singer)} className="grid grid-cols-2 gap-2">
                  {[
                    { v: "male", label: "Male lead" },
                    { v: "female", label: "Female lead" },
                    { v: "duet", label: "Duet (both)" },
                    { v: "auto", label: "Let Gemini decide" },
                  ].map((opt) => (
                    <label
                      key={opt.v}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-md border cursor-pointer transition-colors ${
                        singer === opt.v
                          ? "border-[#C9941A] bg-[#C9941A]/10"
                          : "border-[#222] bg-[#0a0a0a] hover:border-[#333]"
                      }`}
                      data-testid={`radio-singer-${opt.v}`}
                    >
                      <RadioGroupItem value={opt.v} className="border-gray-500 text-[#C9941A]" />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <Button
                onClick={() => generate.mutate()}
                disabled={generate.isPending || storyText.trim().length < 10}
                className="w-full bg-[#C9941A] hover:bg-[#b08016] text-black font-semibold"
                data-testid="button-generate"
              >
                {generate.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Writing your song…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate lyrics
                  </>
                )}
              </Button>
              {usage.data && !usage.data.premium && usage.data.lyricsDraftCount >= (usage.data.limit ?? 1) && (
                <div className="text-xs text-amber-400/90 flex items-start gap-2 p-3 rounded-md bg-amber-400/5 border border-amber-400/20">
                  <Crown className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    Free monthly draft used. Upgrade to premium for unlimited lyric drafts.{" "}
                    <Link href="/pricing" className="underline font-semibold">View plans →</Link>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Output */}
          <Card className="bg-[#111] border-[#222]">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base text-white">Production sheet</CardTitle>
              {lyricsResult?.output && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#222] text-gray-300 hover:text-white"
                    onClick={() => handleCopy(lyricsResult.output!)}
                    data-testid="button-copy"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!result && (
                <div className="text-center py-16 text-gray-500 text-sm">
                  <Music2 className="h-10 w-10 mx-auto mb-3 text-gray-700" />
                  Your generated lyrics will appear here.
                </div>
              )}

              {crisisResult && (
                <div className="space-y-4 p-4 rounded-md bg-red-500/5 border border-red-500/30">
                  <div className="flex items-start gap-2 text-red-300">
                    <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{crisisResult.message}</p>
                  </div>
                  {crisisResult.resources?.map((r, i) => (
                    <a
                      key={i}
                      href={r.action.type === "tel" ? `tel:${r.action.value}` : r.action.type === "sms" ? `sms:${r.action.value}` : r.action.value}
                      className="block p-3 rounded-md bg-[#0a0a0a] border border-[#222] hover:border-[#333] transition-colors"
                      data-testid={`link-crisis-${i}`}
                    >
                      <div className="text-sm font-semibold text-white">{r.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{r.detail}</div>
                    </a>
                  ))}
                </div>
              )}

              {lyricsResult?.output && (
                <LyricsRender
                  output={lyricsResult.output}
                  draftId={lyricsResult.id}
                  isShared={lyricsResult.isShared ?? false}
                  shareId={lyricsResult.shareId ?? null}
                  onShareToggle={(isShared) => {
                    if (lyricsResult.id) toggleShare.mutate({ id: lyricsResult.id, isShared });
                  }}
                  shareLoading={toggleShare.isPending}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Library */}
        {drafts.data && drafts.data.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold mb-4 text-white">Your lyric library</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {drafts.data.map((d) => (
                <Card key={d.id} className="bg-[#111] border-[#222] hover-elevate" data-testid={`card-draft-${d.id}`}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-white truncate flex-1">
                        {d.lyricsData.title}
                      </h3>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-gray-500 hover:text-red-400 -mt-1 -mr-1 h-7 w-7"
                        onClick={() => {
                          if (confirm(`Delete "${d.lyricsData.title}"?`)) deleteDraft.mutate(d.id);
                        }}
                        data-testid={`button-delete-${d.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-1">
                      {d.lyricsData.styleHeader?.style}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] border-[#222] text-gray-400">
                        {d.genre}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-[#222] text-gray-400">
                        {d.singer}
                      </Badge>
                      {d.isShared && (
                        <Badge className="text-[10px] bg-[#C9941A]/15 text-[#C9941A] border-[#C9941A]/30">
                          <Share2 className="h-2.5 w-2.5 mr-1" /> Public
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-[#222] text-gray-300 hover:text-white text-xs h-8"
                      onClick={() =>
                        setResult({
                          shape: "lyrics",
                          id: d.id,
                          output: d.lyricsData,
                          isShared: d.isShared,
                          shareId: d.shareId,
                        })
                      }
                      data-testid={`button-open-${d.id}`}
                    >
                      Open
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FeaturedAlbumBanner() {
  // STROKED OUT SASQUATCH — survivor-authored album available on all major
  // streaming platforms. Lives at the top of the Lyrics Studio so survivors
  // see real proof-of-concept the moment they land on the page: this is
  // what these tools build.
  const platforms = [
    { name: "Apple Music", icon: SiApplemusic, href: "https://music.apple.com/us/search?term=Stroked%20Out%20Sasquatch", color: "text-white" },
    { name: "iTunes (ringtones)", icon: SiItunes, href: "https://music.apple.com/us/search?term=Stroked%20Out%20Sasquatch&types=ringtones", color: "text-[#FB5BC5]" },
    { name: "YouTube Music", icon: SiYoutubemusic, href: "https://music.youtube.com/search?q=Stroked%20Out%20Sasquatch", color: "text-[#FF0000]" },
    { name: "TikTok", icon: SiTiktok, href: "https://www.tiktok.com/search?q=Stroked%20Out%20Sasquatch", color: "text-white" },
  ];
  return (
    <div
      className="mb-8 rounded-xl overflow-hidden border border-[#222] bg-gradient-to-br from-[#0a1410] via-[#0a0a0a] to-[#1a0a05]"
      data-testid="banner-featured-album"
    >
      <div className="grid md:grid-cols-[200px_1fr] gap-4 md:gap-6 p-4 md:p-6 items-center">
        <img
          src={strokedOutSasquatchCover}
          alt="Stroked Out Sasquatch album cover"
          className="w-full max-w-[200px] mx-auto rounded-lg shadow-2xl"
          data-testid="img-featured-album-cover"
        />
        <div className="space-y-3 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#C9941A]/15 text-[#C9941A] border border-[#C9941A]/30">
            <Sparkles className="h-3 w-3" />
            Built with these tools
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight" data-testid="text-featured-album-title">
            STROKED OUT SASQUATCH
          </h2>
          <p className="text-sm text-gray-400 max-w-xl">
            A survivor-authored album. Out now on every major platform — proof of
            what your story sounds like when you write it without permission.
          </p>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
            {platforms.map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0a0a0a] border border-[#222] hover-elevate text-xs text-gray-200 hover:text-white transition-colors"
                data-testid={`link-platform-${p.name.toLowerCase().replace(/\s/g, "-")}`}
              >
                <p.icon className={`h-3.5 w-3.5 ${p.color}`} />
                {p.name}
                <ExternalLink className="h-3 w-3 text-gray-500" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LyricsRender({
  output,
  draftId,
  isShared,
  shareId,
  onShareToggle,
  shareLoading,
}: {
  output: LyricsOutput;
  draftId?: number;
  isShared: boolean;
  shareId: string | null;
  onShareToggle: (s: boolean) => void;
  shareLoading: boolean;
}) {
  const shareUrl = shareId ? `${window.location.origin}/lyrics/s/${shareId}` : null;
  return (
    <div className="space-y-5">
      {/* Spec block */}
      <div className="p-4 rounded-md bg-[#0a0a0a] border border-[#222] text-sm space-y-1">
        <div className="text-xs font-bold uppercase tracking-wider text-[#C9941A] mb-2">
          The Architect's Specifications
        </div>
        <div><span className="text-gray-500">• Style:</span> <span className="text-white">{output.styleHeader.style}</span></div>
        <div><span className="text-gray-500">• Tempo:</span> <span className="text-white">{output.styleHeader.tempo}</span></div>
        <div><span className="text-gray-500">• Vibe:</span> <span className="text-white">{output.styleHeader.vibe}</span></div>
      </div>

      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Title</div>
        <h2 className="text-xl font-bold text-[#C9941A]" data-testid="text-lyrics-title">{output.title}</h2>
      </div>

      {output.sections.map((s, i) => (
        <div key={i} className="space-y-2" data-testid={`section-lyrics-${i}`}>
          <div className="text-sm font-bold text-[#C9941A]">{s.label}</div>
          {s.sceneNote && (
            <div className="text-xs italic text-gray-500 leading-relaxed">
              {s.sceneNote.startsWith("(") ? s.sceneNote : `(${s.sceneNote})`}
            </div>
          )}
          <div className="space-y-1.5 text-sm leading-relaxed">
            {s.lines.map((l, li) => (
              <div key={li}>
                {l.voice && (
                  <div className="text-xs text-gray-500 italic">
                    ({l.voice}{l.direction ? ` — ${l.direction}` : ""})
                  </div>
                )}
                <div className="text-gray-100">{l.text}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {output.hashtags && output.hashtags.length > 0 && (
        <div className="text-xs text-gray-500 leading-relaxed pt-2 border-t border-[#222]">
          {output.hashtags.map((h) => `#${h}`).join(" ")}
        </div>
      )}

      {output.producerNotes && (
        <div className="p-3 rounded-md bg-[#0a0a0a] border border-[#222]">
          <div className="text-xs font-semibold text-[#C9941A] mb-1 uppercase tracking-wide">Producer notes</div>
          <p className="text-xs text-gray-400 leading-relaxed">{output.producerNotes}</p>
        </div>
      )}

      {draftId && (
        <div className="pt-3 border-t border-[#222] space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Public share link</div>
              <div className="text-xs text-gray-500">Off by default. Toggle on to mint a shareable URL.</div>
            </div>
            <Switch
              checked={isShared}
              onCheckedChange={onShareToggle}
              disabled={shareLoading}
              data-testid="switch-share"
            />
          </div>
          {shareUrl && (
            <div className="text-xs p-2 rounded bg-[#0a0a0a] border border-[#222] text-[#C9941A] break-all" data-testid="text-share-url">
              {shareUrl}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
