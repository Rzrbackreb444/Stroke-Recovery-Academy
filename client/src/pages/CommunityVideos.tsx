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
import { useToast } from "@/hooks/use-toast";
import {
  Upload, Play, Heart, MessageCircle, Eye, CheckCircle2,
  Sparkles, Pin, X, ImagePlus, Video, ChevronLeft,
  ArrowUpFromLine, BarChart2, Grid3X3, Zap, UserPlus, UserCheck,
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

function VideoThumbnailCard({ video, onClick }: { video: VideoCard; onClick: () => void }) {
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
  const [tags, setTags] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const captureThumbnail = (videoFile: File) => {
    return new Promise<Blob | null>((resolve) => {
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.src = URL.createObjectURL(videoFile);
      v.addEventListener("loadedmetadata", () => {
        setDuration(Math.round(v.duration));
        v.currentTime = Math.min(1, v.duration * 0.1);
      });
      v.addEventListener("seeked", () => {
        const canvas = document.createElement("canvas");
        canvas.width = v.videoWidth || 640;
        canvas.height = v.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(v, 0, 0);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.88);
        URL.revokeObjectURL(v.src);
      });
      v.addEventListener("error", () => resolve(null));
      v.load();
    });
  };

  const handleFileSelected = async (f: File) => {
    if (!f.type.startsWith("video/")) {
      toast({ title: "Select a video file", variant: "destructive" });
      return;
    }
    if (f.size > 500 * 1024 * 1024) {
      toast({ title: "File must be under 500 MB", variant: "destructive" });
      return;
    }
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    const thumb = await captureThumbnail(f);
    setThumbnail(thumb);
    if (thumb) setThumbnailUrl(URL.createObjectURL(thumb));
    setStep("details");
  };

  const uploadWithProgress = (url: string, data: Blob | File, onProgress: (pct: number) => void) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener("load", () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`))));
      xhr.addEventListener("error", () => reject(new Error("Network error")));
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", data instanceof File ? data.type : "image/jpeg");
      xhr.send(data);
    });
  };

  const handleSubmit = async () => {
    if (!file || !title.trim()) return;
    setStep("uploading");
    try {
      // 1. Get video upload URL
      setProgressLabel("Requesting upload slot…");
      const { uploadURL: videoUploadUrl, objectPath: videoObjectPath } = await apiRequest("POST", "/api/community/video/upload-url");

      // 2. Upload video
      setProgressLabel("Uploading video…");
      await uploadWithProgress(videoUploadUrl, file, (pct) => setProgress(Math.round(pct * 0.85)));

      // 3. Upload thumbnail if we have one
      let thumbnailObjectPath: string | undefined;
      if (thumbnail) {
        setProgressLabel("Uploading thumbnail…");
        setProgress(86);
        const { uploadURL: thumbUrl, objectPath: thumbPath } = await apiRequest("POST", "/api/community/video/thumbnail-url");
        await uploadWithProgress(thumbUrl, thumbnail, () => {});
        thumbnailObjectPath = thumbPath;
      }

      // 4. Finalize
      setProgressLabel("Saving video…");
      setProgress(95);
      await apiRequest("POST", "/api/community/video", {
        objectPath: videoObjectPath,
        thumbnailObjectPath,
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" data-testid="upload-modal">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-5 py-4 rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#E2741B]" />
            <span className="font-semibold text-white">Post a Spark</span>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-upload"><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-5 space-y-5">
          {step === "guide" && (
            <div className="space-y-5">
              <div className="text-center space-y-2 pb-1">
                <div className="w-14 h-14 rounded-full bg-[#E2741B]/10 border border-[#E2741B]/30 flex items-center justify-center mx-auto">
                  <Zap className="w-7 h-7 text-[#E2741B]" />
                </div>
                <h2 className="text-white font-bold text-lg">What is a Spark?</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Sparks are short recovery videos — raw, real, and made by survivors. No studio. No script. Just proof that the work is happening.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">What to post</p>
                {[
                  { icon: "💪", label: "A rep you couldn't do last month", sub: "Show the before, the struggle, or the win" },
                  { icon: "🧠", label: "A cognitive or speech moment", sub: "Word-finding, reading aloud, memory exercises" },
                  { icon: "📅", label: "A day-in-the-life clip", sub: "Morning routine, PT appointment, small victory" },
                  { icon: "💡", label: "A tip that actually helped you", sub: "Tools, hacks, mindset — share what works" },
                ].map(({ icon, label, sub }) => (
                  <div key={label} className="flex gap-3 items-start bg-zinc-800/50 rounded-xl p-3">
                    <span className="text-xl mt-0.5">{icon}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{label}</p>
                      <p className="text-zinc-500 text-xs">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Format tips</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { top: "Portrait", bot: "vertical 9:16" },
                    { top: "15 sec – 3 min", bot: "shorter = more views" },
                    { top: "Raw wins", bot: "perfect loses" },
                  ].map(({ top, bot }) => (
                    <div key={top} className="space-y-0.5">
                      <p className="text-white text-xs font-semibold">{top}</p>
                      <p className="text-zinc-500 text-xs">{bot}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="w-full bg-[#E2741B] hover:bg-[#E2741B]/90 text-white font-semibold"
                onClick={() => setStep("select")}
                data-testid="button-guide-continue"
              >
                <Upload className="w-4 h-4 mr-2" /> Pick my video
              </Button>
            </div>
          )}

          {step === "select" && (
            <div
              className="border-2 border-dashed border-zinc-700 rounded-xl p-10 text-center cursor-pointer hover-elevate transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileSelected(f); }}
              data-testid="drop-zone"
            >
              <ArrowUpFromLine className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
              <p className="text-zinc-300 font-medium mb-1">Drag & drop your video</p>
              <p className="text-zinc-500 text-sm">or click to select — MP4, MOV, WebM up to 500 MB</p>
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); }} />
            </div>
          )}

          {step === "details" && (
            <>
              {thumbnailUrl && (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800">
                  <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="text-xs bg-black/60 text-white border-0">Auto-captured thumbnail</Badge>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's this recovery moment about?"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  maxLength={120}
                  data-testid="input-video-title"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share your story, what you were working on, any wins or struggles…"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none"
                  rows={3}
                  maxLength={2000}
                  data-testid="input-video-description"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Recovery areas in this video</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(DEFICIT_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDeficit(key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        selectedDeficits.includes(key)
                          ? "bg-[#E2741B] border-[#E2741B] text-white"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                      }`}
                      data-testid={`toggle-deficit-${key}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Tags <span className="text-zinc-500 text-xs">(comma-separated)</span></label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="walking, arm exercises, speech therapy…"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  data-testid="input-video-tags"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => { setStep("select"); setFile(null); setThumbnailUrl(null); }} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  className="flex-1 bg-[#E2741B] hover:bg-[#E2741B]/90 text-white font-semibold"
                  data-testid="button-submit-upload"
                >
                  <Zap className="w-4 h-4 mr-2" /> Post Spark
                </Button>
              </div>
            </>
          )}

          {(step === "uploading" || step === "done") && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#E2741B]/10 border border-[#E2741B]/30 flex items-center justify-center mx-auto">
                {step === "done"
                  ? <CheckCircle2 className="w-8 h-8 text-[#E2741B]" />
                  : <ArrowUpFromLine className="w-8 h-8 text-[#E2741B] animate-bounce" />
                }
              </div>
              <p className="text-white font-semibold">{step === "done" ? "Video posted!" : "Uploading…"}</p>
              <p className="text-zinc-400 text-sm">{progressLabel}</p>
              <Progress value={progress} className="h-2" />
              <p className="text-zinc-500 text-xs">{progress}%</p>
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
                <VideoThumbnailCard key={v.id} video={v} onClick={() => handleVideoClick(v.id)} />
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
    </div>
  );
}
