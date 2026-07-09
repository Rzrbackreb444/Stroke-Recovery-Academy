import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Zap, ChevronLeft, CheckCircle2, UserPlus, UserCheck,
  Eye, Heart, Play, Pin, Sparkles, Video,
} from "lucide-react";
import { useState } from "react";

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtDuration(s: number | null): string {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
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
  videos: any[];
  isOwnProfile: boolean;
  isFollowedByMe: boolean;
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  // Step 1: resolve username → userId
  const { data: resolveData, isLoading: resolving, isError: resolveError } = useQuery<{ userId: string }>({
    queryKey: [`/api/sparks/profile/${username}`],
    queryFn: () => fetch(`/api/sparks/profile/${username}`).then((r) => {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    }),
    retry: false,
    staleTime: 60_000,
  });

  const profileUserId = resolveData?.userId;

  // Step 2: full profile data
  const { data: profile, isLoading: profileLoading } = useQuery<ProfileData>({
    queryKey: [`/api/community/videos/profile`, profileUserId],
    queryFn: () => fetch(`/api/community/videos/profile/${profileUserId}`).then((r) => r.json()),
    enabled: !!profileUserId,
    staleTime: 30_000,
  });

  const [following, setFollowing] = useState<boolean | null>(null);
  const [followerCount, setFollowerCount] = useState<number | null>(null);

  const isFollowing = following !== null ? following : (profile?.isFollowedByMe ?? false);
  const displayFollowerCount = followerCount !== null ? followerCount : (profile?.uploader.followerCount ?? 0);

  const followMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/sparks/follow/${profileUserId}`),
    onMutate: () => {
      setFollowing((f) => !(f !== null ? f : profile?.isFollowedByMe ?? false));
      setFollowerCount((c) => {
        const base = c !== null ? c : (profile?.uploader.followerCount ?? 0);
        return isFollowing ? Math.max(0, base - 1) : base + 1;
      });
    },
    onSuccess: (data: any) => {
      setFollowing(data.following);
      setFollowerCount(data.followerCount);
      qc.invalidateQueries({ queryKey: [`/api/community/videos/profile`, profileUserId] });
    },
    onError: () => {
      setFollowing(null);
      setFollowerCount(null);
      toast({ title: "Could not update follow", variant: "destructive" });
    },
  });

  const isLoading = resolving || profileLoading;

  if (resolveError) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-white font-semibold mb-2">@{username} not found</p>
          <Button onClick={() => navigate("/sparks")} variant="outline" size="sm">Back to Sparks</Button>
        </div>
      </div>
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/60">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
            <button onClick={() => navigate("/sparks")} className="text-zinc-400 hover:text-white flex items-center gap-1.5">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <Zap className="w-4 h-4 text-[#E2741B]" />
            <span className="text-white font-semibold">Sparks</span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="text-center py-12">
            <div className="w-24 h-24 rounded-full bg-zinc-800 animate-pulse mx-auto mb-4" />
            <div className="h-5 bg-zinc-800 rounded w-40 mx-auto mb-2 animate-pulse" />
            <div className="h-3 bg-zinc-800 rounded w-24 mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[9/16] rounded-xl bg-zinc-800 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { uploader, videos, isOwnProfile } = profile;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate("/sparks")}
            className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
            data-testid="button-back-sparks"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">Feed</span>
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Zap className="w-4 h-4 text-[#E2741B]" />
            <span className="text-white font-semibold">Sparks</span>
          </div>
          {isOwnProfile && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/sparks/settings")}
              className="border-zinc-700 text-zinc-300 text-xs"
              data-testid="button-edit-profile"
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile header */}
      <div className="border-b border-zinc-800 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col items-center sm:flex-row sm:items-start gap-6">
          {/* Avatar */}
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

          {/* Info */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap mb-1">
              <h1 className="text-xl font-bold text-white">{uploader.name}</h1>
              {uploader.isTherapist && (
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">Verified</Badge>
              )}
            </div>
            {uploader.username && (
              <p className="text-zinc-500 text-sm mb-2">@{uploader.username}</p>
            )}
            {uploader.bio && (
              <p className="text-zinc-400 text-sm mb-3 max-w-sm">{uploader.bio}</p>
            )}

            {/* Stats */}
            <div className="flex gap-6 justify-center sm:justify-start mb-4">
              <div className="text-center">
                <p className="text-white font-bold text-lg leading-none">{fmtCount(uploader.videoCount)}</p>
                <p className="text-zinc-500 text-xs mt-0.5">Sparks</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg leading-none">{fmtCount(displayFollowerCount)}</p>
                <p className="text-zinc-500 text-xs mt-0.5">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg leading-none">{fmtCount(uploader.followingCount)}</p>
                <p className="text-zinc-500 text-xs mt-0.5">Following</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg leading-none">{fmtCount(uploader.totalViews)}</p>
                <p className="text-zinc-500 text-xs mt-0.5">Views</p>
              </div>
            </div>

            {/* Follow / Edit button */}
            {isOwnProfile ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/sparks/settings")}
                className="border-zinc-700 text-zinc-300"
                data-testid="button-edit-profile-inline"
              >
                Edit Profile
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  if (!user) { toast({ title: "Sign in to follow" }); return; }
                  followMutation.mutate();
                }}
                disabled={followMutation.isPending}
                className={isFollowing
                  ? "border-zinc-700 text-zinc-300 bg-transparent border hover:bg-zinc-800"
                  : "bg-[#E2741B] hover:bg-[#E2741B]/90 text-white"
                }
                data-testid="button-follow-profile"
              >
                {isFollowing
                  ? <><UserCheck className="w-3.5 h-3.5 mr-1.5" /> Following</>
                  : <><UserPlus className="w-3.5 h-3.5 mr-1.5" /> Follow</>
                }
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Videos grid */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {videos.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Video className="w-10 h-10 text-zinc-600 mb-3" />
            <p className="text-white font-semibold mb-1">No Sparks yet</p>
            <p className="text-zinc-500 text-sm">
              {isOwnProfile ? "Upload your first recovery video." : "Nothing uploaded yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {videos.map((video: any) => (
              <Link key={video.id} href={`/sparks/${video.id}`}>
                <div
                  className="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer bg-zinc-900 group"
                  data-testid={`video-card-${video.id}`}
                >
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                    {video.isPinned && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold bg-black/60 text-white px-2 py-0.5 rounded-full">
                        <Pin className="w-2.5 h-2.5" /> Pinned
                      </span>
                    )}
                    {video.isFeatured && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold bg-[#E2741B]/90 text-white px-2 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {/* Duration */}
                  {video.durationSeconds && (
                    <span className="absolute top-2 right-2 text-[10px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded">
                      {fmtDuration(video.durationSeconds)}
                    </span>
                  )}

                  {/* Play center */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom stats */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-white text-xs font-semibold line-clamp-2 leading-tight mb-1">{video.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5 text-white/70 text-[10px]">
                        <Eye className="w-3 h-3" /> {fmtCount(video.viewCount)}
                      </span>
                      <span className="flex items-center gap-0.5 text-white/70 text-[10px]">
                        <Heart className="w-3 h-3" /> {fmtCount(video.likeCount)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
