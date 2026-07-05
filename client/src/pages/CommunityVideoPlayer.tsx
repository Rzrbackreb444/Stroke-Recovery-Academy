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
  Sparkles, Pin, MoreHorizontal, Trash2, Repeat2, Bookmark,
  UserPlus, UserCheck, Zap, FastForward, Rewind,
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
  repostCount: number;
  saveCount: number;
  shareCount: number;
  isFeatured: boolean;
  isPinned: boolean;
  isPremium: boolean;
  source: string;
  createdAt: string;
  uploaderName: string;
  uploaderAvatar: string | null;
  uploaderIsTherapist: boolean;
  uploaderUsername: string | null;
  uploaderFollowerCount: number;
  isLikedByMe: boolean;
  isRepostedByMe: boolean;
  isSavedByMe: boolean;
  isFollowingUploader: boolean;
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

// ── TikTok-style action button ─────────────────────────────────────────────

function ActionButton({
  icon: Icon,
  count,
  active,
  activeColor = "text-white",
  fillWhenActive = false,
  onClick,
  label,
}: {
  icon: any;
  count?: number;
  active?: boolean;
  activeColor?: string;
  fillWhenActive?: boolean;
  onClick?: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 group"
      aria-label={label}
      data-testid={`action-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          bg-black/50 backdrop-blur-md border transition-all duration-150
          group-active:scale-90
          ${active ? "border-white/50 bg-black/70" : "border-white/20"}
        `}
      >
        <Icon
          className={`w-5 h-5 transition-colors ${
            active && fillWhenActive ? `${activeColor} fill-current` : active ? activeColor : "text-white"
          }`}
        />
      </div>
      {count !== undefined && (
        <span className="text-white text-[11px] font-bold tabular-nums drop-shadow-md select-none">
          {fmtCount(count)}
        </span>
      )}
    </button>
  );
}

// ── Video player ──────────────────────────────────────────────────────────────

function VideoPlayer({
  src,
  poster,
  onEnded,
}: {
  src: string;
  poster?: string;
  onEnded?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimer.current) clearTimeout(controlsTimer.current); };
  }, [resetControlsTimer]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
    resetControlsTimer();
  };

  const seek = (seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + seconds));
    resetControlsTimer();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * duration;
    resetControlsTimer();
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handle = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handle);
    return () => document.removeEventListener("fullscreenchange", handle);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative bg-black w-full h-full overflow-hidden"
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster ?? undefined}
        playsInline
        muted={muted}
        className="w-full h-full object-contain"
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (v) setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
        }}
        onLoadedMetadata={() => {
          const v = videoRef.current;
          if (v) setDuration(v.duration);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); onEnded?.(); }}
      />

      {/* Center tap area - big play button */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${!playing ? "opacity-100" : "opacity-0"}`}>
        <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
          <Play className="w-7 h-7 text-white fill-white ml-1" />
        </div>
      </div>

      {/* Controls overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-200 ${showControls ? "opacity-100" : "opacity-0"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="px-3 pb-1">
          <div
            className="relative h-1 bg-white/20 rounded-full cursor-pointer group/bar"
            onClick={handleProgressClick}
          >
            <div
              className="absolute left-0 top-0 h-full bg-[#E2741B] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/bar:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex items-center gap-2 px-3 pb-3 bg-gradient-to-t from-black/80 to-transparent pt-4">
          <button onClick={togglePlay} className="text-white" data-testid="button-play-pause">
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
          </button>
          <button onClick={() => seek(-10)} className="text-white/80" data-testid="button-rewind">
            <Rewind className="w-4 h-4" />
          </button>
          <button onClick={() => seek(10)} className="text-white/80" data-testid="button-forward">
            <FastForward className="w-4 h-4" />
          </button>
          <span className="text-white/70 text-xs tabular-nums flex-1">
            {fmtDuration(duration * (progress / 100))} / {fmtDuration(duration)}
          </span>
          <button onClick={() => setMuted((m) => !m)} className="text-white/80" data-testid="button-mute">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button onClick={toggleFullscreen} className="text-white/80" data-testid="button-fullscreen">
            {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Comment item ──────────────────────────────────────────────────────────────

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-3 py-3 border-b border-zinc-800/60 last:border-0">
      <Avatar className="w-8 h-8 flex-shrink-0 mt-0.5">
        <AvatarImage src={comment.userAvatar ?? undefined} />
        <AvatarFallback className="text-xs bg-zinc-700 text-white">{comment.userName[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-white text-sm font-semibold">{comment.userName}</span>
          {comment.userIsTherapist && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
          <span className="text-zinc-500 text-xs">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-zinc-300 text-sm leading-relaxed">{comment.body}</p>
      </div>
    </div>
  );
}

// ── Comments panel ────────────────────────────────────────────────────────────

function CommentsPanel({
  videoId,
  count,
  commentInputRef,
}: {
  videoId: number;
  count: number;
  commentInputRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [draft, setDraft] = useState("");

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/community/video/${videoId}/comments`],
  });

  const postMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/community/video/${videoId}/comment`, { body: draft }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: [`/api/community/video/${videoId}/comments`] });
      qc.invalidateQueries({ queryKey: [`/api/community/video/${videoId}`] });
    },
    onError: () => toast({ title: "Could not post comment", variant: "destructive" }),
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <h3 className="text-white font-semibold text-sm">Comments <span className="text-zinc-500 font-normal ml-1">{count}</span></h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {isLoading ? (
          <div className="space-y-3 pt-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-zinc-800 rounded animate-pulse w-24" />
                  <div className="h-3 bg-zinc-800 rounded animate-pulse w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="py-10 text-center">
            <MessageCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-500 text-sm">Be first to comment</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/40">
            {comments.map((c) => <CommentItem key={c.id} comment={c} />)}
          </div>
        )}
      </div>

      {user && (
        <div className="px-4 py-3 border-t border-zinc-800 flex-shrink-0">
          <Textarea
            ref={commentInputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment…"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none text-sm min-h-[60px]"
            rows={2}
            maxLength={1000}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && draft.trim()) {
                postMutation.mutate();
              }
            }}
            data-testid="input-comment"
          />
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              onClick={() => postMutation.mutate()}
              disabled={!draft.trim() || postMutation.isPending}
              className="bg-[#E2741B] hover:bg-[#E2741B]/90 text-white"
              data-testid="button-post-comment"
            >
              {postMutation.isPending ? "Posting…" : "Post"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CommunityVideoPlayer() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);

  const videoId = parseInt(id ?? "", 10);
  const ownUserId: string | null = user ? ((user as any).claims?.sub ?? (user as any).id) : null;

  const { data: video, isLoading, isError } = useQuery<VideoDetail>({
    queryKey: [`/api/community/video/${videoId}`],
    enabled: !isNaN(videoId),
    retry: false,
  });

  // ── Engagement state ───────────────────────────────────────────────────────
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    if (video) {
      setLiked(video.isLikedByMe);
      setLikeCount(video.likeCount);
      setReposted(video.isRepostedByMe);
      setRepostCount(video.repostCount);
      setSaved(video.isSavedByMe);
      setSaveCount(video.saveCount);
      setFollowing(video.isFollowingUploader);
      setFollowerCount(video.uploaderFollowerCount);
      setCommentCount(video.commentCount);
    }
  }, [video]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const likeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/community/video/${videoId}/like`),
    onMutate: () => {
      setLiked((l) => !l);
      setLikeCount((c) => liked ? Math.max(0, c - 1) : c + 1);
    },
    onSuccess: (data: any) => {
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    },
    onError: () => {
      setLiked(video?.isLikedByMe ?? false);
      setLikeCount(video?.likeCount ?? 0);
    },
  });

  const repostMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/community/video/${videoId}/repost`),
    onMutate: () => {
      setReposted((r) => !r);
      setRepostCount((c) => reposted ? Math.max(0, c - 1) : c + 1);
    },
    onSuccess: (data: any) => {
      setReposted(data.reposted);
      setRepostCount(data.repostCount);
    },
    onError: () => {
      setReposted(video?.isRepostedByMe ?? false);
      setRepostCount(video?.repostCount ?? 0);
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/community/video/${videoId}/save`),
    onMutate: () => {
      setSaved((s) => !s);
      setSaveCount((c) => saved ? Math.max(0, c - 1) : c + 1);
    },
    onSuccess: (data: any) => {
      setSaved(data.saved);
      setSaveCount(data.saveCount);
    },
    onError: () => {
      setSaved(video?.isSavedByMe ?? false);
      setSaveCount(video?.saveCount ?? 0);
    },
  });

  const followMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/sparks/follow/${video?.uploaderId}`),
    onMutate: () => {
      setFollowing((f) => !f);
      setFollowerCount((c) => following ? Math.max(0, c - 1) : c + 1);
    },
    onSuccess: (data: any) => {
      setFollowing(data.following);
      setFollowerCount(data.followerCount);
    },
    onError: () => {
      setFollowing(video?.isFollowingUploader ?? false);
      setFollowerCount(video?.uploaderFollowerCount ?? 0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/community/video/${videoId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/community/videos"] });
      navigate("/sparks");
    },
    onError: () => toast({ title: "Could not delete", variant: "destructive" }),
  });

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: video?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied" });
      }
    } catch (_) {}
  };

  const scrollToComments = () => {
    commentInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    commentInputRef.current?.focus();
  };

  const isOwner = ownUserId && video?.uploaderId === ownUserId;
  const isAdmin = user && (user as any).role === "admin";
  const profileHref = video?.uploaderUsername
    ? `/sparks/u/${video.uploaderUsername}`
    : `/sparks/profile/${video?.uploaderId}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Zap className="w-8 h-8 text-[#E2741B] animate-pulse" />
          <p className="text-zinc-500 text-sm">Loading spark…</p>
        </div>
      </div>
    );
  }

  if (isError || !video) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-white font-semibold mb-2">Video not found</p>
          <Button onClick={() => navigate("/sparks")} variant="outline" size="sm">Back to Sparks</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ── Top nav ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate("/sparks")}
            className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">Feed</span>
          </button>
          <div className="flex items-center gap-2 flex-1">
            <img src="/sparks-logo.png" alt="Sparks" className="h-7 w-7 rounded-lg object-cover" />
            <span className="text-white font-semibold">Sparks</span>
          </div>

          {(isOwner || isAdmin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" data-testid="button-more-options">
                  <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                {isOwner && (
                  <DropdownMenuItem
                    className="text-red-400 cursor-pointer"
                    onClick={() => { if (confirm("Delete this Spark?")) deleteMutation.mutate(); }}
                    data-testid="menuitem-delete-video"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Spark
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <>
                    <DropdownMenuItem
                      onClick={() => apiRequest("PATCH", `/api/community/video/${videoId}`, { isFeatured: !video.isFeatured }).then(() => qc.invalidateQueries({ queryKey: [`/api/community/video/${videoId}`] }))}
                      className="cursor-pointer text-zinc-200"
                    >
                      <Sparkles className="w-4 h-4 mr-2" /> {video.isFeatured ? "Unfeature" : "Feature"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => apiRequest("PATCH", `/api/community/video/${videoId}`, { isPinned: !video.isPinned }).then(() => qc.invalidateQueries({ queryKey: [`/api/community/video/${videoId}`] }))}
                      className="cursor-pointer text-zinc-200"
                    >
                      <Pin className="w-4 h-4 mr-2" /> {video.isPinned ? "Unpin" : "Pin"}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-6 lg:grid lg:grid-cols-[1fr_360px] lg:gap-8">

        {/* ── Left: Video + info ─────────────────────────────────────────────── */}
        <div>
          {/* Portrait video player with TikTok action sidebar */}
          <div className="relative mx-auto" style={{ aspectRatio: "9/16", maxHeight: "min(75vh, 680px)", maxWidth: "calc(min(75vh, 680px) * 9 / 16)" }}>
            {/* Video container (overflow-hidden for rounding) */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden border border-zinc-800/50">
              <VideoPlayer
                src={video.videoUrl}
                poster={video.thumbnailUrl ?? undefined}
              />
            </div>

            {/* Uploader avatar (top-right, outside overflow) */}
            <div className="absolute top-4 right-3 z-20 flex flex-col items-center gap-1">
              <Link href={profileHref}>
                <div className="relative">
                  <Avatar className="w-11 h-11 border-2 border-white shadow-lg">
                    <AvatarImage src={video.uploaderAvatar ?? undefined} />
                    <AvatarFallback className="text-sm bg-zinc-700 text-white font-bold">{video.uploaderName[0]}</AvatarFallback>
                  </Avatar>
                  {!isOwner && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!user) { toast({ title: "Sign in to follow" }); return; } followMutation.mutate(); }}
                      className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center shadow transition-colors ${following ? "bg-zinc-700 border border-zinc-500" : "bg-[#E2741B]"}`}
                      data-testid="button-quick-follow"
                    >
                      {following ? <span className="text-white text-[8px] font-bold">✓</span> : <span className="text-white text-[10px] font-bold">+</span>}
                    </button>
                  )}
                </div>
              </Link>
            </div>

            {/* Badges (featured/pinned) */}
            <div className="absolute top-4 left-3 z-20 flex flex-col gap-1.5">
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

            {/* TikTok action sidebar */}
            <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-5">
              <ActionButton
                icon={Heart}
                count={likeCount}
                active={liked}
                activeColor="text-red-400"
                fillWhenActive
                onClick={() => { if (!user) { toast({ title: "Sign in to like" }); return; } likeMutation.mutate(); }}
                label="Like"
              />
              <ActionButton
                icon={MessageCircle}
                count={commentCount}
                onClick={scrollToComments}
                label="Comment"
              />
              <ActionButton
                icon={Repeat2}
                count={repostCount}
                active={reposted}
                activeColor="text-green-400"
                onClick={() => { if (!user) { toast({ title: "Sign in to repost" }); return; } repostMutation.mutate(); }}
                label="Repost"
              />
              <ActionButton
                icon={Bookmark}
                count={saveCount}
                active={saved}
                activeColor="text-yellow-400"
                fillWhenActive
                onClick={() => { if (!user) { toast({ title: "Sign in to save" }); return; } saveMutation.mutate(); }}
                label="Save"
              />
              <ActionButton
                icon={Share2}
                onClick={handleShare}
                label="Share"
              />
            </div>
          </div>

          {/* ── Video info ──────────────────────────────────────────────────── */}
          <div className="mt-4 space-y-4">
            {/* Title + badges */}
            <div>
              <h1 className="text-white text-xl font-bold leading-tight mb-2">{video.title}</h1>
              <div className="flex items-center gap-3 text-zinc-500 text-sm flex-wrap">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {fmtCount(video.viewCount)} views
                </span>
                <span>{timeAgo(video.createdAt)}</span>
              </div>
            </div>

            {/* Deficit badges */}
            {video.deficitTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {video.deficitTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs bg-zinc-800 text-zinc-300 border-zinc-700 capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Hashtag pills */}
            {video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {video.tags.map((tag) => (
                  <span key={tag} className="text-[#E2741B] text-sm font-medium hover:text-[#E2741B]/80 cursor-pointer transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Uploader card */}
            <div className="flex items-center gap-3 bg-zinc-900 rounded-xl p-4 border border-zinc-800/50">
              <Link href={profileHref}>
                <Avatar className="w-12 h-12 border border-zinc-700 flex-shrink-0">
                  <AvatarImage src={video.uploaderAvatar ?? undefined} />
                  <AvatarFallback className="text-base font-bold bg-zinc-800 text-white">{video.uploaderName[0]}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={profileHref}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white font-semibold hover:underline">{video.uploaderName}</span>
                    {video.uploaderIsTherapist && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                  </div>
                  {video.uploaderUsername && (
                    <p className="text-zinc-500 text-sm">@{video.uploaderUsername}</p>
                  )}
                </Link>
                <p className="text-zinc-600 text-xs mt-0.5">{fmtCount(followerCount)} followers</p>
              </div>
              {!isOwner && (
                <Button
                  size="sm"
                  variant={following ? "outline" : "default"}
                  onClick={() => { if (!user) { toast({ title: "Sign in to follow" }); return; } followMutation.mutate(); }}
                  className={following ? "border-zinc-700 text-zinc-300" : "bg-[#E2741B] hover:bg-[#E2741B]/90 text-white"}
                  disabled={followMutation.isPending}
                  data-testid="button-follow"
                >
                  {following
                    ? <><UserCheck className="w-3.5 h-3.5 mr-1.5" /> Following</>
                    : <><UserPlus className="w-3.5 h-3.5 mr-1.5" /> Follow</>
                  }
                </Button>
              )}
            </div>

            {/* Description */}
            {video.description && (
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">{video.description}</p>
            )}

            {/* Mobile comments */}
            <div className="lg:hidden bg-zinc-900 rounded-xl border border-zinc-800/50 overflow-hidden" style={{ minHeight: 320 }}>
              <CommentsPanel videoId={videoId} count={commentCount} commentInputRef={commentInputRef} />
            </div>
          </div>
        </div>

        {/* ── Right: Comments (desktop) ───────────────────────────────────── */}
        <div className="hidden lg:flex flex-col bg-zinc-900 rounded-xl border border-zinc-800/50 overflow-hidden" style={{ height: "calc(min(75vh, 680px) + 48px)" }}>
          <CommentsPanel videoId={videoId} count={commentCount} commentInputRef={commentInputRef} />
        </div>
      </div>
    </div>
  );
}
