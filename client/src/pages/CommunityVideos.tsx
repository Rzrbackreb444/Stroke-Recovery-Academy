import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, Play, Heart, MessageCircle, Eye, CheckCircle2,
  Sparkles, Pin, X, ImagePlus, Video, ChevronLeft,
  ArrowUpFromLine, BarChart2, Grid3X3, Zap, UserPlus, UserCheck, Hash, Loader2, Flame,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface VideoCard {
  id: number;
  uploaderId: string | null;
  title: string;
  description: string | null;
  tags: string[];
  deficitTags: string[];
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isFeatured: boolean;
  isPinned: boolean;
  isPremium: boolean;
  source: string;
  createdAt: string;
  uploaderName: string;
  uploaderAvatar: string | null;
  uploaderIsTherapist: boolean;
  isLikedByMe: boolean;
  boostedUntil?: string | null;
  score?: number;
}

interface ProfileData {
  uploader: {
    id: string;
    name: string;
    avatar: string | null;
    isTherapist: boolean;
    bio: string | null;
    username: string | null;
    videoCount: number;
    totalViews: number;
    totalLikes: number;
    followerCount: number;
    followingCount: number;
  };
  videos: VideoCard[];
  isOwnProfile: boolean;
  isFollowedByMe: boolean;
}

const DEFICIT_LABELS: Record<string, string> = {
  motor: "Motor",
  speech: "Speech",
  cognitive: "Cognitive",
  fatigue: "Fatigue",
  vision: "Vision",
  swallowing: "Swallowing",
  emotional: "Emotional",
  sensory: "Sensory",
};

function fmtDuration(s: number | null): string {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── Video card with hover-preview ─────────────────────────────────────────────

function VideoThumbnailCard({ video, onClick, onBoost }: { video: VideoCard; onClick: () => void; onBoost?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering] = useState(false);

  const handleMouseEnter = () => {
    setHovering(true);
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  };
  const handleMouseLeave = () => {
    setHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      className="group relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer bg-zinc-900"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      data-testid={`video-card-${video.id}`}
    >
      {/* Thumbnail / preview */}
      {video.thumbnailUrl ? (
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hovering ? "opacity-0" : "opacity-100"}`}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 transition-opacity duration-300 ${hovering ? "opacity-0" : "opacity-100"}`} />
      )}

      {/* Muted preview video on hover */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        muted
        playsInline
        loop
        preload="none"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hovering ? "opacity-100" : "opacity-0"}`}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {/* Badges */}
      <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
        {video.isPinned && (
          <span className="flex items-center gap-1 text-[10px] font-semibold bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
            <Pin className="w-2.5 h-2.5" /> Pinned
          </span>
        )}
        {video.isFeatured && (
          <span className="flex items-center gap-1 text-[10px] font-semibold bg-[#E2741B]/90 text-white px-2 py-0.5 rounded-full">
            <Sparkles className="w-2.5 h-2.5" /> Featured
          </span>
        )}
        {video.boostedUntil && new Date(video.boostedUntil) > new Date() && (
          <span className="flex items-center gap-1 text-[10px] font-semibold bg-amber-500/90 text-white px-2 py-0.5 rounded-full">
            <Flame className="w-2.5 h-2.5" /> Boosted
          </span>
        )}
      </div>

      {/* Duration */}
      {video.durationSeconds && (
        <span className="absolute top-2 right-2 text-[10px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
          {fmtDuration(video.durationSeconds)}
        </span>
      )}

      {/* Play icon (center, shows on hover) */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${hovering ? "opacity-0" : "opacity-100"}`}>
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <p className="text-white text-xs font-semibold line-clamp-2 leading-tight mb-1.5">{video.title}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Avatar className="w-5 h-5 border border-white/20">
              <AvatarImage src={video.uploaderAvatar ?? undefined} />
              <AvatarFallback className="text-[8px] bg-zinc-700 text-white">{video.uploaderName[0]}</AvatarFallback>
            </Avatar>
            <span className="text-white/80 text-[10px] font-medium truncate max-w-[80px]">{video.uploaderName}</span>
            {video.uploaderIsTherapist && <CheckCircle2 className="w-3 h-3 text-blue-400 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5 text-white/70 text-[10px]">
              <Eye className="w-3 h-3" /> {fmtCount(video.viewCount)}
            </span>
            <span className="flex items-center gap-0.5 text-white/70 text-[10px]">
              <Heart className={`w-3 h-3 ${video.isLikedByMe ? "fill-red-400 text-red-400" : ""}`} /> {fmtCount(video.likeCount)}
            </span>
          </div>
        </div>
        {/* Boost button — only shown on own profile */}
        {onBoost && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onBoost(); }}
            className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-semibold bg-black/60 text-amber-400 px-2 py-0.5 rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
            data-testid={`button-boost-video-${video.id}`}
          >
            <Flame className="w-2.5 h-2.5" /> Boost
          </button>
        )}
      </div>
    </div>
  );
}

// ── Upload modal ──────────────────────────────────────────────────────────────

function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState<"guide" | "select" | "details" | "uploading" | "done">("guide");
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<Blob | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDeficits, setSelectedDeficits] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const extractFrames = (videoFile: File, count: number): Promise<string[]> =>
    new Promise((resolve) => {
      const vid = document.createElement("video");
      vid.muted = true; vid.playsInline = true; vid.preload = "metadata";
      vid.src = URL.createObjectURL(videoFile);
      const frames: string[] = [];
      let seekIndex = 0;
      vid.addEventListener("loadedmetadata", () => {
        const dur = Math.min(vid.duration || 1, 90);
        const timestamps = Array.from({ length: count }, (_, i) => ((i + 1) / (count + 1)) * dur);
        const seekNext = () => {
          if (seekIndex >= timestamps.length) { URL.revokeObjectURL(vid.src); resolve(frames); return; }
          vid.currentTime = timestamps[seekIndex];
        };
        vid.addEventListener("seeked", () => {
          try {
            const canvas = document.createElement("canvas");
            const scale = Math.min(1, 480 / (vid.videoWidth || 480));
            canvas.width = Math.round((vid.videoWidth || 480) * scale);
            canvas.height = Math.round((vid.videoHeight || 270) * scale);
            canvas.getContext("2d")?.drawImage(vid, 0, 0, canvas.width, canvas.height);
            const b64 = canvas.toDataURL("image/jpeg", 0.72).split(",")[1];
            if (b64) frames.push(b64);
          } catch {}
          seekIndex++;
          seekNext();
        });
        seekNext();
      });
      vid.addEventListener("error", () => resolve([]));
      vid.load();
    });

  const handleCoverSelected = (f: File) => {
    if (!f.type.startsWith("image/")) { toast({ title: "Select an image file", variant: "destructive" }); return; }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxW = 720, maxH = 1280;
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        setThumbnail(blob);
        setThumbnailUrl(URL.createObjectURL(blob));
        toast({ title: "Cover updated — looks great." });
      }, "image/jpeg", 0.92);
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(f);
  };

  const generateMetadata = async () => {
    setIsGenerating(true);
    try {
      const frames = file ? await extractFrames(file, 3) : [];
      const context = [title.trim(), description.trim()].filter(Boolean).join(" — ");
      if (!context && frames.length === 0) {
        toast({ title: "Add a brief description first so AI has something to work with.", variant: "destructive" });
        return;
      }
      const res = await apiRequest("POST", "/api/community/video/generate-metadata", {
        prompt: context || "stroke recovery video",
        frames,
      });
      const data = await res.json();
      if (data.message) throw new Error(data.message);
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (Array.isArray(data.hashtags) && data.hashtags.length) {
        setSelectedTags((prev) => [...new Set([...prev, ...data.hashtags])].slice(0, 20));
      }
      toast({ title: "Generated — review and tweak before posting." });
    } catch (err: any) {
      toast({ title: err.message ?? "Generation failed", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const debouncedTagQ = tagInput.replace(/^#/, "").trim();
  const { data: tagSuggestions } = useQuery<{ tags: { tag: string; count: number }[] }>({
    queryKey: ["/api/community/tags/search", debouncedTagQ],
    queryFn: () =>
      fetch(`/api/community/tags/search?q=${encodeURIComponent(debouncedTagQ)}`).then((r) => r.json()),
    enabled: debouncedTagQ.length >= 1,
    staleTime: 10_000,
  });
  const filteredSuggestions = (tagSuggestions?.tags ?? []).filter(
    (s) => !selectedTags.includes(s.tag.toLowerCase()),
  );

  const captureThumbnail = (videoFile: File) =>
    new Promise<Blob | null>((resolve) => {
      const v = document.createElement("video");
      v.muted = true; v.playsInline = true;
      v.src = URL.createObjectURL(videoFile);
      v.addEventListener("loadedmetadata", () => {
        setDuration(Math.round(v.duration));
        v.currentTime = Math.min(1, v.duration * 0.1);
      });
      v.addEventListener("seeked", () => {
        const canvas = document.createElement("canvas");
        canvas.width = v.videoWidth || 640; canvas.height = v.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(v, 0, 0);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.88);
        URL.revokeObjectURL(v.src);
      });
      v.addEventListener("error", () => resolve(null));
      v.load();
    });

  const handleFileSelected = async (f: File) => {
    if (!f.type.startsWith("video/")) { toast({ title: "Select a video file", variant: "destructive" }); return; }
    if (f.size > 500 * 1024 * 1024) { toast({ title: "File must be under 500 MB", variant: "destructive" }); return; }
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    const thumb = await captureThumbnail(f);
    setThumbnail(thumb);
    if (thumb) setThumbnailUrl(URL.createObjectURL(thumb));
    setStep("details");
  };

  const uploadWithProgress = (url: string, data: Blob | File, onProgress: (pct: number) => void) =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); });
      xhr.addEventListener("load", () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`))));
      xhr.addEventListener("error", () => reject(new Error("Network error")));
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", data instanceof File ? data.type : "image/jpeg");
      xhr.send(data);
    });

  const handleSubmit = async () => {
    if (!file || !title.trim()) return;
    setStep("uploading");
    try {
      setProgressLabel("Requesting upload slot…");
      const videoUrlRes = await apiRequest("POST", "/api/community/video/upload-url");
      const { uploadURL: videoUploadUrl, objectPath: videoObjectPath } = await videoUrlRes.json();

      setProgressLabel("Uploading video…");
      await uploadWithProgress(videoUploadUrl, file, (pct) => setProgress(Math.round(pct * 0.85)));

      let thumbnailObjectPath: string | undefined;
      if (thumbnail) {
        setProgressLabel("Uploading thumbnail…");
        setProgress(86);
        const thumbUrlRes = await apiRequest("POST", "/api/community/video/thumbnail-url");
        const { uploadURL: thumbUrl, objectPath: thumbPath } = await thumbUrlRes.json();
        await uploadWithProgress(thumbUrl, thumbnail, () => {});
        thumbnailObjectPath = thumbPath;
      }

      setProgressLabel("Saving video…");
      setProgress(95);
      await apiRequest("POST", "/api/community/video", {
        objectPath: videoObjectPath,
        thumbnailObjectPath,
        title: title.trim(),
        description: description.trim() || undefined,
        tags: selectedTags,
        deficitTags: selectedDeficits,
        durationSeconds: duration ?? undefined,
        fileSizeBytes: file.size,
      });

      setProgress(100);
      setProgressLabel("Done!");
      setStep("done");
      setTimeout(() => { onSuccess(); onClose(); }, 1200);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setStep("details");
      setProgress(0);
    }
  };

  const toggleDeficit = (key: string) =>
    setSelectedDeficits((prev) => prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]);

  const addTag = (raw: string) => {
    const clean = raw.replace(/^#/, "").trim().toLowerCase().replace(/\s+/g, "");
    if (clean && !selectedTags.includes(clean) && selectedTags.length < 10) {
      setSelectedTags((prev) => [...prev, clean]);
    }
    setTagInput("");
    setShowTagSuggestions(false);
  };

  const removeTag = (tag: string) => setSelectedTags((prev) => prev.filter((t) => t !== tag));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative bg-white w-full max-w-lg max-h-[95vh] overflow-y-auto shadow-2xl rounded-t-3xl sm:rounded-2xl"
        data-testid="upload-modal"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center gap-2 px-4 py-3 z-10 rounded-t-3xl sm:rounded-t-2xl">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => (step === "details" ? setStep("select") : onClose())}
            className="text-gray-600 -ml-1 flex-shrink-0"
            data-testid="button-close-upload"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="font-semibold text-gray-900 text-base flex-1">Post a Spark</span>
          {step === "details" && (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="bg-[#E2741B] text-white rounded-full px-5 font-semibold text-sm h-8"
              data-testid="button-submit-upload"
            >
              Post
            </Button>
          )}
        </div>

        <div className="p-4 space-y-0">
          {/* ── Guide ── */}
          {step === "guide" && (
            <div className="space-y-4 py-1">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-[#E2741B]/10 border border-[#E2741B]/20 flex items-center justify-center mx-auto">
                  <Zap className="w-7 h-7 text-[#E2741B]" />
                </div>
                <h2 className="text-gray-900 font-bold text-lg">What is a Spark?</h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Short recovery videos — raw, real, made by survivors. No studio. No script. Just proof the work is happening.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-1">What to post</p>
                {[
                  { label: "A rep you couldn't do last month", sub: "Show the before, the struggle, or the win" },
                  { label: "A cognitive or speech moment", sub: "Word-finding, reading aloud, memory exercises" },
                  { label: "A day-in-the-life clip", sub: "Morning routine, PT appointment, small victory" },
                  { label: "A tip that actually helped you", sub: "Tools, hacks, mindset — share what works" },
                ].map(({ label, sub }) => (
                  <div key={label} className="flex gap-3 items-start bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E2741B] mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-900 text-sm font-medium">{label}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 grid grid-cols-3 gap-2 text-center">
                {[
                  { top: "Portrait", bot: "9:16 vertical" },
                  { top: "15s – 3min", bot: "shorter = more views" },
                  { top: "Raw wins", bot: "perfect loses" },
                ].map(({ top, bot }) => (
                  <div key={top}>
                    <p className="text-gray-900 text-xs font-bold">{top}</p>
                    <p className="text-gray-400 text-xs">{bot}</p>
                  </div>
                ))}
              </div>
              <Button
                className="w-full bg-[#E2741B] hover:bg-[#E2741B]/90 text-white font-semibold rounded-full"
                onClick={() => setStep("select")}
                data-testid="button-guide-continue"
              >
                <Upload className="w-4 h-4 mr-2" /> Pick my video
              </Button>
            </div>
          )}

          {/* ── Select ── */}
          {step === "select" && (
            <div
              className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center cursor-pointer hover:border-[#E2741B]/40 transition-colors my-2"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileSelected(f); }}
              data-testid="drop-zone"
            >
              <ArrowUpFromLine className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700 font-medium mb-1">Drag & drop your video</p>
              <p className="text-gray-400 text-sm">or click to select — MP4, MOV, WebM up to 500 MB</p>
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); }} />
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleCoverSelected(f); e.target.value = ""; }}} />
            </div>
          )}

          {/* ── Details ── */}
          {step === "details" && (
            <div className="space-y-0">
              {/* AI generate row */}
              <div className="flex justify-end pt-2 pb-1">
                <button
                  type="button"
                  onClick={generateMetadata}
                  disabled={isGenerating}
                  data-testid="button-ai-generate-metadata"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E2741B] hover:text-[#C06B3E] disabled:opacity-50 transition-colors"
                >
                  {isGenerating
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Sparkles className="w-3.5 h-3.5" />}
                  {isGenerating ? "Generating…" : "Auto-fill with AI"}
                </button>
              </div>

              {/* Caption + cover */}
              <div className="flex gap-3 items-start py-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your recovery moment…"
                    className="bg-transparent border-0 shadow-none resize-none text-gray-900 placeholder:text-gray-300 p-0 text-sm focus-visible:ring-0 leading-relaxed min-h-[80px]"
                    rows={4}
                    maxLength={2000}
                    data-testid="input-video-description"
                  />
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add a title *"
                    maxLength={120}
                    className="w-full text-sm text-gray-500 placeholder:text-gray-300 border-0 outline-none bg-transparent"
                    data-testid="input-video-title"
                  />
                </div>
                <div
                  className="w-[72px] flex-shrink-0 rounded-xl overflow-hidden border border-gray-200 relative bg-gray-100 cursor-pointer group"
                  style={{ aspectRatio: "9/16" }}
                  onClick={() => coverInputRef.current?.click()}
                  title="Set cover photo"
                  data-testid="button-change-cover"
                >
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                      <ImagePlus className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] font-semibold text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {thumbnailUrl ? "Change" : "Set cover"}
                  </div>
                  <div className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImagePlus className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
              </div>

              {/* Hashtags row */}
              <div className="border-t border-gray-100 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-600 text-sm font-medium hover:border-gray-300 transition-colors"
                  >
                    <Hash className="w-3.5 h-3.5" />
                    Hashtags
                  </button>
                </div>

                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 bg-orange-50 text-[#E2741B] text-xs font-semibold px-2.5 py-1 rounded-full border border-orange-100"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-orange-300 hover:text-orange-500 leading-none"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <div className="flex items-center gap-2 border border-gray-200 rounded-full px-3.5 py-2 bg-gray-50 focus-within:border-[#E2741B] focus-within:bg-white transition-colors">
                    <span className="text-gray-400 text-sm font-medium">#</span>
                    <input
                      value={tagInput}
                      onChange={(e) => { setTagInput(e.target.value); setShowTagSuggestions(true); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); if (tagInput.trim()) addTag(tagInput); }
                        if (e.key === "Backspace" && !tagInput && selectedTags.length > 0) removeTag(selectedTags[selectedTags.length - 1]);
                      }}
                      onFocus={() => { if (tagInput.trim()) setShowTagSuggestions(true); }}
                      onBlur={() => setTimeout(() => setShowTagSuggestions(false), 160)}
                      placeholder="Search or add tags…"
                      className="bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none flex-1"
                      data-testid="input-video-tags"
                    />
                    {tagInput.trim() && (
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); addTag(tagInput); }}
                        className="text-xs font-semibold text-[#E2741B] flex-shrink-0"
                      >
                        Add
                      </button>
                    )}
                  </div>

                  {showTagSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-lg z-20 overflow-hidden">
                      {filteredSuggestions.map((item) => (
                        <button
                          key={item.tag}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); addTag(item.tag); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0"
                        >
                          <span className="text-sm font-medium text-gray-900">#{item.tag}</span>
                          <span className="text-xs text-gray-400">
                            {item.count === 0 ? "New" : `${item.count} video${item.count !== 1 ? "s" : ""}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {showTagSuggestions && debouncedTagQ.length >= 1 && filteredSuggestions.length === 0 && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-lg z-20 overflow-hidden">
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); addTag(tagInput); }}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-left"
                      >
                        <span className="text-sm font-medium text-gray-900">#{debouncedTagQ}</span>
                        <span className="text-xs text-[#E2741B] font-semibold">New tag</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recovery areas */}
              <div className="border-t border-gray-100 py-3">
                <div className="flex items-center gap-2 mb-2.5">
                  <Zap className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Recovery areas</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(DEFICIT_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDeficit(key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        selectedDeficits.includes(key)
                          ? "bg-[#E2741B] border-[#E2741B] text-white"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                      data-testid={`toggle-deficit-${key}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Post button */}
              <div className="border-t border-gray-100 pt-4 pb-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  className="w-full bg-[#E2741B] hover:bg-[#E2741B]/90 text-white font-semibold rounded-full h-11"
                  data-testid="button-submit-upload-bottom"
                >
                  <Zap className="w-4 h-4 mr-2" /> Post Spark
                </Button>
              </div>
            </div>
          )}

          {/* ── Uploading / done ── */}
          {(step === "uploading" || step === "done") && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#E2741B]/10 border border-[#E2741B]/20 flex items-center justify-center mx-auto">
                {step === "done"
                  ? <CheckCircle2 className="w-8 h-8 text-[#E2741B]" />
                  : <ArrowUpFromLine className="w-8 h-8 text-[#E2741B] animate-bounce" />}
              </div>
              <p className="text-gray-900 font-semibold">{step === "done" ? "Video posted!" : "Uploading…"}</p>
              <p className="text-gray-500 text-sm">{progressLabel}</p>
              <Progress value={progress} className="h-1.5 mx-4" />
              <p className="text-gray-400 text-xs">{progress}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Profile header ─────────────────────────────────────────────────────────────

function ProfileHeader({ data, onUpload }: { data: ProfileData; onUpload: () => void }) {
  const { uploader, isOwnProfile, isFollowedByMe } = data;
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const ownUserId: string | null = user ? ((user as any).claims?.sub ?? (user as any).id) : null;

  const [following, setFollowing] = useState(isFollowedByMe);
  const [followerCount, setFollowerCount] = useState(uploader.followerCount);

  const followMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/sparks/follow/${uploader.id}`),
    onMutate: () => {
      setFollowing((f) => !f);
      setFollowerCount((c) => following ? Math.max(0, c - 1) : c + 1);
    },
    onSuccess: (d: any) => { setFollowing(d.following); setFollowerCount(d.followerCount); },
    onError: () => { setFollowing(isFollowedByMe); setFollowerCount(uploader.followerCount); },
  });

  const profileHref = uploader.username ? `/sparks/u/${uploader.username}` : `/sparks/profile/${uploader.id}`;

  return (
    <div className="py-8 px-4 border-b border-zinc-800">
      <div className="max-w-5xl mx-auto flex flex-col items-center sm:flex-row sm:items-start gap-6">
        <div className="relative flex-shrink-0">
          <Avatar className="w-24 h-24 border-2 border-[#E2741B]/50">
            <AvatarImage src={uploader.avatar ?? undefined} />
            <AvatarFallback className="text-2xl font-bold bg-zinc-800 text-white">{uploader.name[0]}</AvatarFallback>
          </Avatar>
          {uploader.isTherapist && (
            <span className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h2 className="text-xl font-bold text-white mb-0.5">{uploader.name}</h2>
          {uploader.username && <p className="text-zinc-500 text-sm mb-1">@{uploader.username}</p>}
          {uploader.isTherapist && <p className="text-blue-400 text-xs font-medium mb-2">Verified Therapist</p>}
          {uploader.bio && <p className="text-zinc-400 text-sm max-w-sm mb-3 line-clamp-2">{uploader.bio}</p>}
          <div className="flex gap-6 justify-center sm:justify-start mb-4">
            <div className="text-center">
              <p className="text-white font-bold text-base leading-none">{fmtCount(uploader.videoCount)}</p>
              <p className="text-zinc-500 text-xs mt-0.5">Sparks</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-base leading-none">{fmtCount(followerCount)}</p>
              <p className="text-zinc-500 text-xs mt-0.5">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-base leading-none">{fmtCount(uploader.followingCount)}</p>
              <p className="text-zinc-500 text-xs mt-0.5">Following</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-base leading-none">{fmtCount(uploader.totalViews)}</p>
              <p className="text-zinc-500 text-xs mt-0.5">Views</p>
            </div>
          </div>
          <div className="flex gap-2 justify-center sm:justify-start">
            {isOwnProfile ? (
              <>
                <Button onClick={onUpload} className="bg-[#E2741B] text-white font-semibold hover:bg-[#E2741B]/90" data-testid="button-upload-video">
                  <Upload className="w-4 h-4 mr-2" /> Upload Spark
                </Button>
                <Button variant="outline" onClick={() => window.location.href = "/sparks/settings"} className="border-zinc-700 text-zinc-300">
                  Edit Profile
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => { if (!user) { toast({ title: "Sign in to follow" }); return; } followMutation.mutate(); }}
                disabled={followMutation.isPending}
                className={following ? "border-zinc-700 text-zinc-300 bg-transparent border hover:bg-zinc-800" : "bg-[#E2741B] hover:bg-[#E2741B]/90 text-white"}
                data-testid="button-follow-profile"
              >
                {following ? <><UserCheck className="w-3.5 h-3.5 mr-1.5" /> Following</> : <><UserPlus className="w-3.5 h-3.5 mr-1.5" /> Follow</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyFeed({ isOwnProfile, onUpload }: { isOwnProfile?: boolean; onUpload?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
        <Video className="w-9 h-9 text-zinc-600" />
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">No videos yet</h3>
      <p className="text-zinc-500 text-sm max-w-xs mb-6">
        {isOwnProfile
          ? "Upload your first recovery video — your progress inspires the whole community."
          : "This survivor hasn't uploaded any videos yet."}
      </p>
      {isOwnProfile && onUpload && (
        <Button onClick={onUpload} className="bg-[#E2741B] text-white font-semibold hover:bg-[#E2741B]/90">
          <Upload className="w-4 h-4 mr-2" /> Upload First Video
        </Button>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function VideoSkeleton() {
  return (
    <div className="aspect-[9/16] rounded-xl bg-zinc-800 animate-pulse" />
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CommunityVideos() {
  const [, navigate] = useLocation();
  const params = useParams<{ userId?: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();

  // If a userId is in the URL we're on the profile route
  const urlUserId = params.userId ?? null;
  const ownUserId: string | null = user ? ((user as any).claims?.sub ?? (user as any).id) : null;

  const [activeTab, setActiveTab] = useState<"feed" | "following" | "profile">(urlUserId ? "profile" : "feed");
  const [showUpload, setShowUpload] = useState(false);
  const [boostVideoId, setBoostVideoId] = useState<number | null>(null);

  const boostMutation = useMutation({
    mutationFn: async ({ id, days }: { id: number; days: number }) => {
      const res = await apiRequest("POST", `/api/community/video/${id}/boost`, { days });
      if (!res.ok) throw new Error((await res.json()).message ?? "Boost failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/community/videos"] });
      qc.invalidateQueries({ queryKey: ["/api/community/profile"] });
      setBoostVideoId(null);
      toast({ title: "Boosted — your Spark will rank higher in the feed." });
    },
    onError: (e: any) => toast({ title: e.message ?? "Boost failed", variant: "destructive" }),
  });
  const [page, setPage] = useState(0);
  const [allVideos, setAllVideos] = useState<VideoCard[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Which userId to show on the profile tab
  const profileUserId = urlUserId ?? ownUserId;

  // Debounce search input (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset page + accumulated list when search/topic changes
  useEffect(() => {
    setPage(0);
    setAllVideos([]);
  }, [debouncedSearch, activeTopic]);

  const feedQuery = useQuery<{ videos: VideoCard[]; hasMore: boolean; page: number }>({
    queryKey: ["/api/community/videos", page, debouncedSearch, activeTopic],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page) });
      if (debouncedSearch) p.set("q", debouncedSearch);
      if (activeTopic) p.set("topic", activeTopic);
      return fetch(`/api/community/videos?${p}`).then((r) => r.json());
    },
    staleTime: 30_000,
  });

  const followingQuery = useQuery<{ videos: VideoCard[]; hasMore: boolean; page: number }>({
    queryKey: ["/api/community/videos/following", 0],
    queryFn: () => fetch("/api/community/videos/following?page=0").then((r) => r.json()),
    enabled: activeTab === "following" && !!user,
    staleTime: 30_000,
  });

  const profileQuery = useQuery<ProfileData>({
    queryKey: ["/api/community/videos/profile", profileUserId],
    queryFn: () => fetch(`/api/community/videos/profile/${profileUserId}`).then((r) => r.json()),
    enabled: activeTab === "profile" && !!profileUserId,
    staleTime: 30_000,
  });

  // Accumulate pages
  useEffect(() => {
    if (feedQuery.data?.videos) {
      setAllVideos((prev) => {
        const ids = new Set(prev.map((v) => v.id));
        const fresh = feedQuery.data!.videos.filter((v) => !ids.has(v.id));
        return page === 0 ? feedQuery.data!.videos : [...prev, ...fresh];
      });
    }
  }, [feedQuery.data, page]);

  // Infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && feedQuery.data?.hasMore && !feedQuery.isFetching) {
        setPage((p) => p + 1);
      }
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [feedQuery.data?.hasMore, feedQuery.isFetching]);

  const handleVideoClick = (id: number) => navigate(`/sparks/${id}`);

  const handleUploadSuccess = () => {
    setPage(0);
    setAllVideos([]);
    qc.invalidateQueries({ queryKey: ["/api/community/videos"] });
    qc.invalidateQueries({ queryKey: ["/api/community/videos/profile", profileUserId] });
  };

  const rawVideos =
    activeTab === "feed" ? allVideos :
    activeTab === "following" ? (followingQuery.data?.videos ?? []) :
    (profileQuery.data?.videos ?? []);

  // Client-side filter for instant chip + search response
  const displayVideos = rawVideos.filter((v) => {
    if (activeTopic && !v.deficitTags.includes(activeTopic)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        v.title.toLowerCase().includes(q) ||
        v.uploaderName.toLowerCase().includes(q) ||
        v.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });
  const isLoading =
    activeTab === "feed" ? (feedQuery.isLoading && page === 0) :
    activeTab === "following" ? followingQuery.isLoading :
    profileQuery.isLoading;
  const profileData = profileQuery.data;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={handleUploadSuccess} />}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/sparks-logo.png" alt="Sparks" className="h-8 w-8 rounded-lg object-cover" />
            <h1 className="text-lg font-bold tracking-tight">Sparks</h1>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <Button
                size="sm"
                onClick={() => setShowUpload(true)}
                className="bg-[#E2741B] text-white font-semibold hover:bg-[#E2741B]/90"
                data-testid="button-upload-header"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-6 border-t border-zinc-800 overflow-x-auto">
          <button
            className={`flex items-center gap-1.5 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === "feed" ? "border-[#E2741B] text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
            onClick={() => setActiveTab("feed")}
            data-testid="tab-feed"
          >
            <Grid3X3 className="w-4 h-4" /> For You
          </button>
          {user && (
            <button
              className={`flex items-center gap-1.5 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === "following" ? "border-[#E2741B] text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
              onClick={() => setActiveTab("following")}
              data-testid="tab-following"
            >
              <UserCheck className="w-4 h-4" /> Following
            </button>
          )}
          {user && (!urlUserId || urlUserId === ownUserId) && (
            <button
              className={`flex items-center gap-1.5 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === "profile" ? "border-[#E2741B] text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
              onClick={() => setActiveTab("profile")}
              data-testid="tab-profile"
            >
              <BarChart2 className="w-4 h-4" /> My Sparks
            </button>
          )}
          {urlUserId && urlUserId !== ownUserId && (
            <button
              className="flex items-center gap-1.5 py-2.5 text-sm font-semibold border-b-2 border-[#E2741B] text-white whitespace-nowrap"
              data-testid="tab-profile-other"
            >
              <BarChart2 className="w-4 h-4" /> Profile
            </button>
          )}
        </div>
      </div>

      {/* Search bar + deficit chips — feed / following */}
      {(activeTab === "feed" || activeTab === "following") && (
        <div className="max-w-5xl mx-auto px-4 pt-3 pb-1 space-y-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Sparks, creators, tags…"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-9 text-sm"
            data-testid="input-search"
          />
          <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
            {Object.entries(DEFICIT_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTopic(activeTopic === key ? null : key)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeTopic === key
                    ? "bg-[#E2741B] border-[#E2741B] text-white"
                    : "bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
                }`}
                data-testid={`chip-topic-${key}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Profile header (profile tab) */}
      {activeTab === "profile" && profileData && (
        <ProfileHeader data={profileData} onUpload={() => setShowUpload(true)} />
      )}

      {/* Sparks intro hero — feed tab only */}
      {activeTab === "feed" && (
        <div className="max-w-5xl mx-auto px-4 pt-6 pb-2">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-[#E2741B]/10 border border-zinc-800 p-6 sm:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#E2741B]/5 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <img src="/sparks-logo.png" alt="Sparks" className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />
                  <div>
                    <p className="text-white font-bold text-base leading-none">Sparks</p>
                    <p className="text-zinc-500 text-xs mt-0.5">by Stroke Recovery Academy</p>
                  </div>
                </div>
                <h2 className="text-white font-bold text-xl sm:text-2xl leading-snug">
                  Short recovery videos.<br className="hidden sm:block" /> Made by survivors, for survivors.
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-lg">
                  No studio. No script. Just real people doing the real work — showing up for reps, celebrating small wins, and proving every day that recovery is possible. Post a clip from your session. Share what's working. Inspire the next person in the fight.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["Real reps", "Honest wins", "Tips that work", "Day-in-the-life", "Speech & cognition"].map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium border border-zinc-700">{tag}</span>
                  ))}
                </div>
              </div>
              {user ? (
                <div className="flex-shrink-0">
                  <Button
                    onClick={() => setShowUpload(true)}
                    className="bg-[#E2741B] hover:bg-[#E2741B]/90 text-white font-bold px-6 py-5 text-base"
                    data-testid="button-upload-hero"
                  >
                    <Zap className="w-4 h-4 mr-2" /> Post your first Spark
                  </Button>
                  <p className="text-zinc-600 text-xs text-center mt-2">Portrait · 15 sec – 3 min · Raw beats perfect</p>
                </div>
              ) : (
                <div className="flex-shrink-0">
                  <a href="/api/login">
                    <Button className="bg-[#E2741B] hover:bg-[#E2741B]/90 text-white font-bold px-6 py-5 text-base" data-testid="button-hero-signin">
                      Sign in to post
                    </Button>
                  </a>
                  <p className="text-zinc-600 text-xs text-center mt-2">Free to watch. Sign in to post.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video grid */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => <VideoSkeleton key={i} />)}
          </div>
        ) : displayVideos.length === 0 ? (
          <EmptyFeed
            isOwnProfile={activeTab === "profile"}
            onUpload={() => setShowUpload(true)}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {displayVideos.map((v) => (
                <VideoThumbnailCard
                  key={v.id}
                  video={v}
                  onClick={() => handleVideoClick(v.id)}
                  onBoost={activeTab === "profile" && v.uploaderId === ownUserId ? () => setBoostVideoId(v.id) : undefined}
                />
              ))}
            </div>

            {/* Infinite scroll sentinel (feed only) */}
            {activeTab === "feed" && (
              <div ref={loadMoreRef} className="mt-8 flex justify-center">
                {feedQuery.isFetching && page > 0 && (
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-[#E2741B] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Boost dialog */}
      {boostVideoId !== null && (
        <Dialog open onOpenChange={() => setBoostVideoId(null)}>
          <DialogContent className="max-w-xs bg-zinc-950 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Flame className="w-4 h-4 text-amber-500" /> Boost this Spark
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Boosted videos rank higher in the Sparks feed. Choose how long.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {([1, 3, 7, 30] as const).map((days) => (
                <Button
                  key={days}
                  variant="outline"
                  className="border-zinc-700 text-white"
                  disabled={boostMutation.isPending}
                  onClick={() => boostMutation.mutate({ id: boostVideoId, days })}
                  data-testid={`button-boost-${days}d`}
                >
                  {days} {days === 1 ? "day" : "days"}
                </Button>
              ))}
            </div>
            {boostMutation.isPending && (
              <div className="flex justify-center pt-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#E2741B]" />
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
