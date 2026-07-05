import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, MessageCircle, Play, Volume2, VolumeX,
  ChevronLeft, ChevronUp, ChevronDown, Share2, CheckCircle2,
  Sparkles, Pin, MoreHorizontal, Trash2, Repeat2, Bookmark,
  Zap, X, Flag,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
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

interface AdjacentVideos {
  prevId: number | null;
  nextId: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
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

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

// ── Action button ─────────────────────────────────────────────────────────────

function ActionButton({
  icon: Icon, count, active, activeColor = "text-white",
  fillWhenActive = false, onClick, label,
}: {
  icon: any; count?: number; active?: boolean; activeColor?: string;
  fillWhenActive?: boolean; onClick?: () => void; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 group"
      aria-label={label}
      data-testid={`action-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-md border transition-all duration-150 group-active:scale-90 ${active ? "border-white/50 bg-black/70" : "border-white/20"}`}>
        <Icon className={`w-5 h-5 transition-colors ${active && fillWhenActive ? `${activeColor} fill-current` : active ? activeColor : "text-white"}`} />
      </div>
      {count !== undefined && (
        <span className="text-white text-[11px] font-bold tabular-nums drop-shadow-md select-none">{fmtCount(count)}</span>
      )}
    </button>
  );
}

// ── Video player ──────────────────────────────────────────────────────────────

function VideoPlayer({ src, poster, onEnded }: {
  src: string; poster?: string; onEnded?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);

  // Auto-play on src change
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = 1;
    setSpeed(1);
    setProgress(0);
    v.play().then(() => setPlaying(true)).catch(() => {});
  }, [src]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    v.playbackRate = next;
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted((m) => !m);
  };

  return (
    <div className="absolute inset-0" onClick={togglePlay} data-testid="video-tap-area">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        muted={muted}
        preload="auto"
        className="w-full h-full object-cover"
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (v) setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); onEnded?.(); }}
      />

      {/* Pause overlay */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${!playing ? "opacity-100" : "opacity-0"}`}>
        <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <Play className="w-8 h-8 text-white fill-white ml-1" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 pointer-events-none">
        <div className="h-full bg-[#E2741B]" style={{ width: `${progress}%` }} />
      </div>

      {/* Mute + speed — bottom-left, above info overlay */}
      <div className="absolute bottom-5 left-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={toggleMute}
          className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center"
          data-testid="button-mute"
        >
          {muted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
        </button>
        <button
          onClick={cycleSpeed}
          className="h-8 px-2.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center"
          data-testid="button-speed"
        >
          <span className="text-white text-xs font-bold">{speed}x</span>
        </button>
      </div>
    </div>
  );
}

// ── Comment item ──────────────────────────────────────────────────────────────

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-3 py-3 border-b border-zinc-800/50 last:border-0">
      <Avatar className="w-8 h-8 flex-shrink-0 mt-0.5">
        <AvatarImage src={comment.userAvatar ?? undefined} />
        <AvatarFallback className="text-xs bg-zinc-700 text-white">{comment.userName[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className="text-white text-sm font-semibold">{comment.userName}</span>
          {comment.userIsTherapist && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
          <span className="text-zinc-500 text-xs">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-zinc-300 text-sm leading-relaxed break-words">{comment.body}</p>
      </div>
    </div>
  );
}

// ── Comments drawer ───────────────────────────────────────────────────────────

function CommentsDrawer({ videoId, count, onClose, onCommentPosted }: {
  videoId: number; count: number; onClose: () => void; onCommentPosted: () => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/community/video/${videoId}/comments`],
  });

  const postMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/community/video/${videoId}/comment`, { body: draft }),
    onSuccess: () => {
      setDraft("");
      onCommentPosted();
      qc.invalidateQueries({ queryKey: [`/api/community/video/${videoId}/comments`] });
    },
    onError: () => toast({ title: "Could not post comment", variant: "destructive" }),
  });

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-50 bg-zinc-950 rounded-t-2xl flex flex-col overflow-hidden"
      style={{ height: "75vh" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex-shrink-0">
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
          <span className="text-white font-semibold text-sm">
            Comments <span className="text-zinc-500 font-normal ml-1">{count}</span>
          </span>
          <button onClick={onClose} data-testid="button-close-comments">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {isLoading ? (
          <div className="space-y-4 pt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-zinc-800 rounded animate-pulse w-24" />
                  <div className="h-3 bg-zinc-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center">
            <MessageCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-500 text-sm">Be first to comment</p>
          </div>
        ) : (
          <div>{comments.map((c) => <CommentItem key={c.id} comment={c} />)}</div>
        )}
      </div>

      {user ? (
        <div className="flex-shrink-0 px-4 py-3 border-t border-zinc-800 flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment…"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none text-sm min-h-[40px] max-h-[120px]"
            rows={1}
            maxLength={1000}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && draft.trim()) postMutation.mutate();
            }}
            data-testid="input-comment"
          />
          <Button
            size="sm"
            onClick={() => postMutation.mutate()}
            disabled={!draft.trim() || postMutation.isPending}
            className="bg-[#E2741B] hover:bg-[#E2741B]/90 text-white flex-shrink-0"
            data-testid="button-post-comment"
          >
            {postMutation.isPending ? "…" : "Post"}
          </Button>
        </div>
      ) : (
        <div className="flex-shrink-0 px-4 py-3 border-t border-zinc-800 text-center">
          <a href="/api/login">
            <Button size="sm" className="bg-[#E2741B] hover:bg-[#E2741B]/90 text-white">Sign in to comment</Button>
          </a>
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
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const wheelAccum = useRef(0);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videoId = parseInt(id ?? "", 10);
  const ownUserId: string | null = user ? ((user as any).claims?.sub ?? (user as any).id) : null;

  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  const { data: video, isLoading, isError } = useQuery<VideoDetail>({
    queryKey: [`/api/community/video/${videoId}`],
    enabled: !isNaN(videoId),
    retry: false,
  });

  const { data: adjacent } = useQuery<AdjacentVideos>({
    queryKey: [`/api/community/videos/adjacent/${videoId}`],
    enabled: !isNaN(videoId),
    staleTime: 60_000,
  });

  const nextId = adjacent?.nextId ?? null;
  const prevId = adjacent?.prevId ?? null;

  useEffect(() => {
    if (!video) return;
    setLiked(video.isLikedByMe);
    setLikeCount(video.likeCount);
    setReposted(video.isRepostedByMe);
    setRepostCount(video.repostCount);
    setSaved(video.isSavedByMe);
    setSaveCount(video.saveCount);
    setFollowing(video.isFollowingUploader);
    setFollowerCount(video.uploaderFollowerCount);
    setCommentCount(video.commentCount);
  }, [video]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goNext = useCallback(() => { if (nextId) navigate(`/sparks/${nextId}`); }, [nextId, navigate]);
  const goPrev = useCallback(() => { if (prevId) navigate(`/sparks/${prevId}`); }, [prevId, navigate]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (showComments) return;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (showComments) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (delta > 80) goNext();
    else if (delta < -80) goPrev();
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    if (showComments) return;
    e.preventDefault();
    wheelAccum.current += e.deltaY;
    if (wheelTimer.current) clearTimeout(wheelTimer.current);
    wheelTimer.current = setTimeout(() => {
      if (wheelAccum.current > 150) goNext();
      else if (wheelAccum.current < -150) goPrev();
      wheelAccum.current = 0;
    }, 80);
  }, [showComments, goNext, goPrev]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const likeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/community/video/${videoId}/like`),
    onMutate: () => { setLiked((l) => !l); setLikeCount((c) => liked ? Math.max(0, c - 1) : c + 1); },
    onSuccess: (data: any) => { setLiked(data.liked); setLikeCount(data.likeCount); },
    onError: () => { setLiked(video?.isLikedByMe ?? false); setLikeCount(video?.likeCount ?? 0); },
  });

  const repostMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/community/video/${videoId}/repost`),
    onMutate: () => { setReposted((r) => !r); setRepostCount((c) => reposted ? Math.max(0, c - 1) : c + 1); },
    onSuccess: (data: any) => { setReposted(data.reposted); setRepostCount(data.repostCount); },
    onError: () => { setReposted(video?.isRepostedByMe ?? false); setRepostCount(video?.repostCount ?? 0); },
  });

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/community/video/${videoId}/save`),
    onMutate: () => { setSaved((s) => !s); setSaveCount((c) => saved ? Math.max(0, c - 1) : c + 1); },
    onSuccess: (data: any) => { setSaved(data.saved); setSaveCount(data.saveCount); },
    onError: () => { setSaved(video?.isSavedByMe ?? false); setSaveCount(video?.saveCount ?? 0); },
  });

  const followMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/sparks/follow/${video?.uploaderId}`),
    onMutate: () => { setFollowing((f) => !f); setFollowerCount((c) => following ? Math.max(0, c - 1) : c + 1); },
    onSuccess: (data: any) => { setFollowing(data.following); setFollowerCount(data.followerCount); },
    onError: () => { setFollowing(video?.isFollowingUploader ?? false); setFollowerCount(video?.uploaderFollowerCount ?? 0); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/community/video/${videoId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/community/videos"] }); navigate("/sparks"); },
    onError: () => toast({ title: "Could not delete", variant: "destructive" }),
  });

  const reportMutation = useMutation({
    mutationFn: (reason: string) => apiRequest("POST", `/api/community/video/${videoId}/report`, { reason }),
    onSuccess: () => toast({ title: "Reported — we'll review" }),
    onError: () => toast({ title: "Could not submit report", variant: "destructive" }),
  });

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: video?.title, url });
      else { await navigator.clipboard.writeText(url); toast({ title: "Link copied" }); }
    } catch (_) {}
  };

  const handleFollow = () => {
    if (!user) { toast({ title: "Sign in to follow" }); return; }
    followMutation.mutate();
  };
  const handleLike = () => { if (!user) { toast({ title: "Sign in to like" }); return; } likeMutation.mutate(); };
  const handleRepost = () => { if (!user) { toast({ title: "Sign in to repost" }); return; } repostMutation.mutate(); };
  const handleSave = () => { if (!user) { toast({ title: "Sign in to save" }); return; } saveMutation.mutate(); };

  const isOwner = !!(ownUserId && video?.uploaderId === ownUserId);
  const isAdmin = !!(user && (user as any).role === "admin");
  const profileHref = video?.uploaderUsername
    ? `/sparks/u/${video.uploaderUsername}`
    : `/sparks/profile/${video?.uploaderId}`;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <Zap className="w-8 h-8 text-[#E2741B] animate-pulse" />
      </div>
    );
  }
  if (isError || !video) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50 px-4">
        <div className="text-center">
          <p className="text-white font-semibold mb-3">Video not found</p>
          <Button onClick={() => navigate("/sparks")} variant="outline" size="sm" className="border-zinc-600 text-zinc-300">
            Back to Sparks
          </Button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-testid="sparks-player"
    >
      {/* Video fills screen */}
      <VideoPlayer
        src={video.videoUrl}
        poster={video.thumbnailUrl ?? undefined}
        onEnded={goNext}
      />

      {/* Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/75 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
      </div>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/sparks")}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center"
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex gap-6">
            <span className="text-white font-bold text-sm border-b-2 border-white pb-0.5">For You</span>
            <span
              className="text-white/50 font-semibold text-sm cursor-pointer hover:text-white/80 transition-colors pb-0.5"
              onClick={() => navigate("/sparks")}
            >
              Following
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center"
                data-testid="button-more-options"
              >
                <MoreHorizontal className="w-5 h-5 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700 min-w-[180px]">
              <DropdownMenuItem
                className="text-zinc-200 cursor-pointer"
                onClick={() => reportMutation.mutate("inappropriate")}
                data-testid="menuitem-report"
              >
                <Flag className="w-4 h-4 mr-2 text-zinc-400" /> Report this Spark
              </DropdownMenuItem>
              {(isOwner || isAdmin) && <DropdownMenuSeparator className="bg-zinc-700" />}
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
                    className="text-zinc-200 cursor-pointer"
                    onClick={() => apiRequest("PATCH", `/api/community/video/${videoId}`, { isFeatured: !video.isFeatured }).then(() => qc.invalidateQueries({ queryKey: [`/api/community/video/${videoId}`] }))}
                  >
                    <Sparkles className="w-4 h-4 mr-2" /> {video.isFeatured ? "Unfeature" : "Feature"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-zinc-200 cursor-pointer"
                    onClick={() => apiRequest("PATCH", `/api/community/video/${videoId}`, { isPinned: !video.isPinned }).then(() => qc.invalidateQueries({ queryKey: [`/api/community/video/${videoId}`] }))}
                  >
                    <Pin className="w-4 h-4 mr-2" /> {video.isPinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Creator info — bottom left ───────────────────────────────────────── */}
      <div className="absolute bottom-8 left-4 right-24 z-20">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Link href={profileHref}>
            <Avatar className="w-8 h-8 border-2 border-white shadow flex-shrink-0">
              <AvatarImage src={video.uploaderAvatar ?? undefined} />
              <AvatarFallback className="text-xs bg-zinc-700 text-white font-bold">{video.uploaderName[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex items-center gap-1 min-w-0">
            <Link href={profileHref}>
              <span className="text-white font-semibold text-sm hover:underline truncate max-w-[120px]">{video.uploaderName}</span>
            </Link>
            {video.uploaderIsTherapist && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
            {video.uploaderUsername && (
              <span className="text-white/50 text-xs truncate">@{video.uploaderUsername}</span>
            )}
          </div>
          {!isOwner && (
            <button
              onClick={handleFollow}
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors flex-shrink-0 ${following ? "border-white/40 text-white/60" : "border-white text-white"}`}
              data-testid="button-follow-inline"
            >
              {following ? "Following" : "+ Follow"}
            </button>
          )}
        </div>

        <div className="flex items-start gap-1.5 mb-1">
          {video.isPinned && <Pin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />}
          {video.isFeatured && <Sparkles className="w-3.5 h-3.5 text-[#E2741B] flex-shrink-0 mt-0.5" />}
          <p className="text-white font-semibold text-sm line-clamp-2 leading-snug">{video.title}</p>
        </div>

        {video.description && (
          <p className="text-white/60 text-xs line-clamp-2 mb-1.5 leading-relaxed">{video.description}</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {video.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="text-[#E2741B] text-xs font-medium">#{tag}</span>
          ))}
          {video.deficitTags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[11px] bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full capitalize">{tag}</span>
          ))}
        </div>
      </div>

      {/* ── Right action sidebar ─────────────────────────────────────────────── */}
      <div className="absolute right-3 bottom-8 z-20 flex flex-col items-center gap-5">
        {/* Avatar with quick-follow pip */}
        <div className="relative mb-1">
          <Link href={profileHref}>
            <Avatar className="w-11 h-11 border-2 border-white shadow-lg">
              <AvatarImage src={video.uploaderAvatar ?? undefined} />
              <AvatarFallback className="text-sm bg-zinc-700 text-white font-bold">{video.uploaderName[0]}</AvatarFallback>
            </Avatar>
          </Link>
          {!isOwner && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFollow(); }}
              className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center shadow transition-colors ${following ? "bg-zinc-700 border border-zinc-500" : "bg-[#E2741B]"}`}
              data-testid="button-quick-follow"
            >
              {following
                ? <span className="text-white text-[8px] font-bold">✓</span>
                : <span className="text-white text-[10px] font-bold">+</span>
              }
            </button>
          )}
        </div>

        <ActionButton icon={Heart} count={likeCount} active={liked} activeColor="text-red-400" fillWhenActive onClick={handleLike} label="Like" />
        <ActionButton icon={MessageCircle} count={commentCount} onClick={() => setShowComments(true)} label="Comment" />
        <ActionButton icon={Repeat2} count={repostCount} active={reposted} activeColor="text-green-400" onClick={handleRepost} label="Repost" />
        <ActionButton icon={Bookmark} count={saveCount} active={saved} activeColor="text-yellow-400" fillWhenActive onClick={handleSave} label="Save" />
        <ActionButton icon={Share2} onClick={handleShare} label="Share" />
      </div>

      {/* ── Desktop swipe arrows (hover-reveal) ─────────────────────────────── */}
      {prevId && !showComments && (
        <button
          onClick={goPrev}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+100px)] z-20 opacity-0 hover:opacity-70 focus:opacity-70 transition-opacity"
          data-testid="button-prev-video"
          aria-label="Previous video"
        >
          <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <ChevronUp className="w-5 h-5 text-white" />
          </div>
        </button>
      )}
      {nextId && !showComments && (
        <button
          onClick={goNext}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[calc(50%+40px)] z-20 opacity-0 hover:opacity-70 focus:opacity-70 transition-opacity"
          data-testid="button-next-video"
          aria-label="Next video"
        >
          <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <ChevronDown className="w-5 h-5 text-white" />
          </div>
        </button>
      )}

      {/* ── Comments drawer ──────────────────────────────────────────────────── */}
      {showComments && (
        <>
          <div className="absolute inset-0 bg-black/40 z-40" onClick={() => setShowComments(false)} />
          <CommentsDrawer
            videoId={videoId}
            count={commentCount}
            onClose={() => setShowComments(false)}
            onCommentPosted={() => setCommentCount((c) => c + 1)}
          />
        </>
      )}
    </div>
  );
}
