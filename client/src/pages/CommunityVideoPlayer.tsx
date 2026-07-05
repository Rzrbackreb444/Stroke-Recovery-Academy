import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, MessageCircle, Eye, Play, Pause, Volume2, VolumeX,
  Maximize, Minimize, ChevronLeft, Share2, CheckCircle2,
  Sparkles, Pin, MoreHorizontal, Trash2, FastForward, Rewind,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Types ─────────────────────────────────────────────────────────────────────

interface VideoDetail {
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
}

interface Comment {
  id: number;
  videoId: number;
  userId: string;
  body: string;
  createdAt: string;
  userName: string;
  userAvatar: string | null;
  userIsTherapist: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

const DEFICIT_COLORS: Record<string, string> = {
  motor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  speech: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  cognitive: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  fatigue: "bg-red-500/20 text-red-300 border-red-500/30",
  vision: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  swallowing: "bg-green-500/20 text-green-300 border-green-500/30",
  emotional: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  sensory: "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

// ── Custom video player ───────────────────────────────────────────────────────

function VideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const resetHideTimer = () => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { if (playing) setShowControls(false); }, 3000);
  };

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
    resetHideTimer();
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    setDuration(v.duration || 0);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    const v = videoRef.current;
    if (!bar || !v) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
    resetHideTimer();
  };

  const skip = (secs: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + secs));
    resetHideTimer();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    resetHideTimer();
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {});
    }
    resetHideTimer();
  };

  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative bg-black w-full aspect-video rounded-xl overflow-hidden group"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (playing) setShowControls(false); }}
      data-testid="video-player"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => setPlaying(false)}
        onClick={togglePlay}
        playsInline
      />

      {/* Center play/pause tap target */}
      {!playing && (
        <button
          className="absolute inset-0 flex items-center justify-center"
          onClick={togglePlay}
          aria-label="Play"
        >
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </button>
      )}

      {/* Controls bar */}
      <div className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${showControls || !playing ? "opacity-100" : "opacity-0"}`}>
        <div className="bg-gradient-to-t from-black/90 to-transparent pt-8 pb-3 px-4">
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="w-full h-1 bg-white/20 rounded-full cursor-pointer mb-3 group/bar hover:h-1.5 transition-all"
            onClick={seek}
          >
            <div
              className="h-full bg-[#E2741B] rounded-full relative"
              style={{ width: `${pct}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Play/pause */}
            <button onClick={togglePlay} className="text-white hover:text-[#E2741B] transition-colors" aria-label={playing ? "Pause" : "Play"}>
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Skip back */}
            <button onClick={() => skip(-10)} className="text-white/70 hover:text-white transition-colors" aria-label="Rewind 10s">
              <Rewind className="w-4 h-4" />
            </button>

            {/* Skip forward */}
            <button onClick={() => skip(10)} className="text-white/70 hover:text-white transition-colors" aria-label="Skip 10s">
              <FastForward className="w-4 h-4" />
            </button>

            {/* Mute */}
            <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors" aria-label="Toggle mute">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Time */}
            <span className="text-white/70 text-xs flex-1">
              {fmtDuration(currentTime)} / {fmtDuration(duration)}
            </span>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors" aria-label="Toggle fullscreen">
              {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Comment item ──────────────────────────────────────────────────────────────

function CommentItem({ comment, currentUserId }: { comment: Comment; currentUserId: string | null }) {
  return (
    <div className="flex gap-3 py-3 border-b border-zinc-800/50 last:border-0" data-testid={`comment-${comment.id}`}>
      <Link href={`/recovery/videos/profile/${comment.userId}`}>
        <Avatar className="w-8 h-8 flex-shrink-0 cursor-pointer">
          <AvatarImage src={comment.userAvatar ?? undefined} />
          <AvatarFallback className="text-xs bg-zinc-700 text-white">{comment.userName[0]}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Link href={`/recovery/videos/profile/${comment.userId}`}>
            <span className="text-sm font-semibold text-white hover:text-[#E2741B] transition-colors cursor-pointer">
              {comment.userName}
            </span>
          </Link>
          {comment.userIsTherapist && <CheckCircle2 className="w-3 h-3 text-blue-400 flex-shrink-0" />}
          <span className="text-zinc-500 text-xs">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-zinc-300 text-sm leading-relaxed">{comment.body}</p>
      </div>
    </div>
  );
}

// ── Main player page ──────────────────────────────────────────────────────────

export default function CommunityVideoPlayer() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [commentBody, setCommentBody] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const currentUserId: string | null = user ? ((user as any).claims?.sub ?? (user as any).id) : null;
  const videoId = parseInt(params.id ?? "0", 10);

  const { data: video, isLoading } = useQuery<VideoDetail>({
    queryKey: ["/api/community/video", videoId],
    queryFn: () => fetch(`/api/community/video/${videoId}`).then((r) => r.json()),
    enabled: !isNaN(videoId) && videoId > 0,
    staleTime: 60_000,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ["/api/community/video", videoId, "comments"],
    queryFn: () => fetch(`/api/community/video/${videoId}/comments`).then((r) => r.json()),
    enabled: !isNaN(videoId) && videoId > 0,
    staleTime: 30_000,
  });

  // Sync like state from video data
  useEffect(() => {
    if (video) {
      setLiked(video.isLikedByMe);
      setLikeCount(video.likeCount);
    }
  }, [video]);

  const likeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/community/video/${videoId}/like`),
    onMutate: () => {
      // Optimistic
      setLiked((prev) => !prev);
      setLikeCount((prev) => liked ? prev - 1 : prev + 1);
    },
    onSuccess: (data: any) => {
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    },
    onError: () => {
      // Revert
      setLiked((prev) => !prev);
      setLikeCount((prev) => liked ? prev + 1 : prev - 1);
      toast({ title: "Sign in to like videos", variant: "destructive" });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) => apiRequest("POST", `/api/community/video/${videoId}/comment`, { body }),
    onSuccess: () => {
      setCommentBody("");
      qc.invalidateQueries({ queryKey: ["/api/community/video", videoId, "comments"] });
      qc.invalidateQueries({ queryKey: ["/api/community/video", videoId] });
    },
    onError: () => toast({ title: "Could not post comment", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/community/video/${videoId}`),
    onSuccess: () => { navigate("/recovery/videos"); toast({ title: "Video deleted" }); },
    onError: () => toast({ title: "Could not delete video", variant: "destructive" }),
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: video?.title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      toast({ title: "Link copied to clipboard" });
    }
  };

  const handleLike = () => {
    if (!user) { toast({ title: "Sign in to like videos" }); return; }
    likeMutation.mutate();
  };

  const handleComment = () => {
    if (!user) { toast({ title: "Sign in to comment" }); return; }
    if (!commentBody.trim()) return;
    commentMutation.mutate(commentBody.trim());
  };

  const isOwner = currentUserId && video?.uploaderId === currentUserId;
  const isAdmin = (user as any)?.role === "admin";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#E2741B] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!video || (video as any).message) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
          <Play className="w-7 h-7 text-zinc-600" />
        </div>
        <h2 className="text-white text-xl font-bold mb-2">Video not found</h2>
        <p className="text-zinc-500 text-sm mb-6">It may have been removed or made private.</p>
        <Button onClick={() => navigate("/recovery/videos")} variant="outline" className="border-zinc-700 text-zinc-300">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to videos
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Back nav */}
      <div className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate("/recovery/videos")}
            className="text-zinc-400 hover:text-white"
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-sm font-semibold text-zinc-300 truncate flex-1">{video.title}</h1>
          {(isOwner || isAdmin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-white" data-testid="button-video-options">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer"
                  onClick={() => deleteMutation.mutate()}
                  data-testid="button-delete-video"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete video
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-[1fr_380px] gap-8">
        {/* ── Left column: player + info ── */}
        <div className="space-y-5">
          <VideoPlayer src={video.videoUrl} poster={video.thumbnailUrl ?? undefined} />

          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            {video.isFeatured && (
              <Badge className="bg-[#E2741B]/20 text-[#E2741B] border-[#E2741B]/40 gap-1">
                <Sparkles className="w-3 h-3" /> Featured
              </Badge>
            )}
            {video.isPinned && (
              <Badge variant="outline" className="border-zinc-600 text-zinc-400 gap-1">
                <Pin className="w-3 h-3" /> Pinned
              </Badge>
            )}
            {video.deficitTags.map((tag) => (
              <Badge key={tag} className={`border text-xs ${DEFICIT_COLORS[tag] ?? "bg-zinc-700/50 text-zinc-300 border-zinc-600"}`}>
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </Badge>
            ))}
            {video.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="border-zinc-700 text-zinc-500 text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Title + meta */}
          <div>
            <h2 className="text-xl font-bold text-white leading-snug mb-2">{video.title}</h2>
            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {fmtCount(video.viewCount)} views</span>
              <span>{timeAgo(video.createdAt)}</span>
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-3 py-3 border-y border-zinc-800">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                liked
                  ? "bg-red-500/15 text-red-400 border border-red-500/30"
                  : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700"
              }`}
              data-testid="button-like"
            >
              <Heart className={`w-4 h-4 transition-all ${liked ? "fill-red-400 text-red-400 scale-110" : ""}`} />
              {fmtCount(likeCount)}
            </button>

            <button
              onClick={() => commentInputRef.current?.focus()}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-all"
              data-testid="button-comment"
            >
              <MessageCircle className="w-4 h-4" />
              {fmtCount(video.commentCount)}
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-all ml-auto"
              data-testid="button-share"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>

          {/* Uploader */}
          <div className="flex items-center gap-3 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <Link href={`/recovery/videos/profile/${video.uploaderId}`}>
              <Avatar className="w-12 h-12 cursor-pointer flex-shrink-0">
                <AvatarImage src={video.uploaderAvatar ?? undefined} />
                <AvatarFallback className="bg-zinc-700 text-white font-semibold">{video.uploaderName[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Link href={`/recovery/videos/profile/${video.uploaderId}`}>
                  <span className="font-semibold text-white hover:text-[#E2741B] transition-colors cursor-pointer">
                    {video.uploaderName}
                  </span>
                </Link>
                {video.uploaderIsTherapist && (
                  <span className="flex items-center gap-1 text-xs text-blue-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Therapist
                  </span>
                )}
              </div>
              <p className="text-zinc-500 text-sm">Stroke Recovery Community</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:border-[#E2741B] hover:text-[#E2741B] shrink-0"
              onClick={() => navigate(`/recovery/videos/profile/${video.uploaderId}`)}
              data-testid="button-view-profile"
            >
              View profile
            </Button>
          </div>

          {/* Description */}
          {video.description && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{video.description}</p>
            </div>
          )}

          {/* Comments section (mobile — shown here; desktop — right column) */}
          <div className="lg:hidden">
            <CommentSection
              comments={comments}
              commentsLoading={commentsLoading}
              commentBody={commentBody}
              setCommentBody={setCommentBody}
              onSubmit={handleComment}
              submitting={commentMutation.isPending}
              currentUserId={currentUserId}
              commentInputRef={commentInputRef}
              user={user}
            />
          </div>
        </div>

        {/* ── Right column: comments (desktop) ── */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <CommentSection
              comments={comments}
              commentsLoading={commentsLoading}
              commentBody={commentBody}
              setCommentBody={setCommentBody}
              onSubmit={handleComment}
              submitting={commentMutation.isPending}
              currentUserId={currentUserId}
              commentInputRef={commentInputRef}
              user={user}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Comment section (shared mobile/desktop) ───────────────────────────────────

function CommentSection({
  comments, commentsLoading, commentBody, setCommentBody, onSubmit, submitting, currentUserId, commentInputRef, user,
}: {
  comments: Comment[];
  commentsLoading: boolean;
  commentBody: string;
  setCommentBody: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  currentUserId: string | null;
  commentInputRef: React.RefObject<HTMLTextAreaElement>;
  user: any;
}) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h3 className="font-semibold text-white text-sm">
          Comments <span className="text-zinc-500 font-normal">{comments.length > 0 ? `(${comments.length})` : ""}</span>
        </h3>
      </div>

      {/* Input */}
      {user && (
        <div className="px-4 py-3 border-b border-zinc-800">
          <Textarea
            ref={commentInputRef}
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Share your thoughts, encouragement, or experience…"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none text-sm"
            rows={2}
            maxLength={1000}
            data-testid="input-comment"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
            }}
          />
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              onClick={onSubmit}
              disabled={!commentBody.trim() || submitting}
              className="bg-[#E2741B] text-white hover:bg-[#E2741B]/90 font-semibold"
              data-testid="button-submit-comment"
            >
              {submitting ? "Posting…" : "Post"}
            </Button>
          </div>
        </div>
      )}

      {/* Comment list */}
      <div className="px-4 max-h-[480px] overflow-y-auto">
        {commentsLoading ? (
          <div className="py-8 flex justify-center">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-10 text-center">
            <MessageCircle className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-zinc-500 text-sm">No comments yet — be the first.</p>
          </div>
        ) : (
          comments.map((c) => (
            <CommentItem key={c.id} comment={c} currentUserId={currentUserId} />
          ))
        )}
      </div>
    </div>
  );
}
