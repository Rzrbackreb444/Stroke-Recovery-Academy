import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyGiftButton from "@/components/DailyGiftButton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Users, Flame, Heart, Trophy, Lightbulb, PartyPopper,
  ThumbsUp, Image, Video, Send, MessageCircle, Share2,
  Pin, ChevronDown, ChevronUp, Radio, Calendar,
  Milestone, HelpCircle, Star, Camera, Upload, X, Plus, RotateCcw,
  PlayCircle, Clock, Eye, Crown, Zap, Activity
} from "lucide-react";
import { safeAccentForDark } from "@/lib/personaContrast";
import SendPowerPointsModal from "@/components/SendPowerPointsModal";

// ─── Types ────────────────────────────────────────────────────────────────────
interface EnrichedPost {
  id: number;
  authorId: string;
  postType: string;
  content: string;
  title?: string;
  isPinned: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  visibility: string;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  displayName?: string;
  avatarUrl?: string;
  username?: string;
  media?: Array<{ id: number; mediaType: string; mediaUrl: string; thumbnailUrl?: string }>;
  reactions?: Array<{ id: number; userId: string; reactionType: string }>;
  comment_count_real?: string;
  persona_name?: string | null;
  persona_creed?: string | null;
  persona_accent_color?: string | null;
  persona_archetype_key?: string | null;
}

interface EnrichedComment {
  id: number;
  postId: number;
  authorId: string;
  parent_id?: number | null;
  parentId?: number | null;
  content: string;
  likeCount: number;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  username?: string | null;
  avatarUrl?: string;
  profileImageUrl?: string;
}

function renderMentions(text: string) {
  const parts = text.split(/(@[A-Za-z0-9_]+)/g);
  return parts.map((p, i) =>
    p.startsWith("@") ? (
      <span key={i} className="font-semibold" style={{ color: "#E2741B" }}>{p}</span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

interface LiveEvent {
  id: number;
  host_id: string;
  title: string;
  description?: string;
  stream_url?: string;
  scheduled_at?: string;
  started_at?: string;
  is_live: boolean;
  cover_image_url?: string;
  viewer_count: number;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
}

interface Member {
  id: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  displayName?: string;
  avatarUrl?: string;
  username?: string;
  currentStreak?: number;
  createdAt: string;
  persona_name?: string | null;
  persona_creed?: string | null;
  persona_accent_color?: string | null;
  persona_archetype_key?: string | null;
}

// ─── Reaction config ───────────────────────────────────────────────────────────
const REACTIONS = [
  { type: "like", icon: ThumbsUp, label: "Like", color: "#4A90E2" },
  { type: "love", icon: Heart, label: "Love", color: "#E2556A" },
  { type: "celebrate", icon: PartyPopper, label: "Celebrate", color: "#E2741B" },
  { type: "support", icon: Flame, label: "Fire", color: "#FF6B35" },
  { type: "insightful", icon: Lightbulb, label: "Insight", color: "#A8D8A8" },
] as const;

const POST_TYPES = [
  { type: "update", label: "Update", icon: Activity },
  { type: "milestone", label: "Milestone", icon: Milestone },
  { type: "question", label: "Question", icon: HelpCircle },
  { type: "tip", label: "Tip", icon: Lightbulb },
  { type: "celebration", label: "Win", icon: Trophy },
] as const;

// ─── Utility helpers ──────────────────────────────────────────────────────────
function getDisplayName(post: any) {
  const name = post.persona_name || post.displayName || (post as any).display_name;
  const first = post.firstName || (post as any).first_name;
  const last = post.lastName || (post as any).last_name;
  return name || (first && last ? `${first} ${last}` : first || post.username || "Member");
}

function getAvatar(post: any) {
  return post.avatarUrl || (post as any).avatar_url || post.profileImageUrl || (post as any).profile_image_url || "";
}

function timeAgo(dateStr: string | undefined) {
  if (!dateStr) return "";
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function postTypeBadge(type: string) {
  const map: Record<string, { label: string; color: string }> = {
    update: { label: "Update", color: "#4A90E2" },
    milestone: { label: "Milestone", color: "#E2741B" },
    question: { label: "Question", color: "#A8D8A8" },
    tip: { label: "Tip", color: "#9B59B6" },
    celebration: { label: "Win", color: "#E2556A" },
    pod_activity: { label: "Pod", color: "#FF6B35" },
  };
  return map[type] || { label: type, color: "#888" };
}

// ─── Profile Edit Modal ────────────────────────────────────────────────────────
function ProfileEditModal({ trigger }: { trigger: React.ReactNode }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ displayName: "", username: "", bio: "" });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: settings } = useQuery<any>({ queryKey: ["/api/user/settings"] });

  const handleOpen = (o: boolean) => {
    if (o && settings) {
      setForm({
        displayName: settings.displayName || "",
        username: settings.username || "",
        bio: settings.bio || "",
      });
      setAvatarPreview(settings.avatarUrl || "");
    }
    setOpen(o);
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        setAvatarPreview(data.url);
        toast({ title: "Avatar uploaded!" });
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest("PUT", "/api/user/settings", {
        ...form,
        avatarUrl: avatarPreview || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/user/settings"] });
      qc.invalidateQueries({ queryKey: ["/api/activity/with-authors"] });
      toast({ title: "Profile updated!" });
      setOpen(false);
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#E2741B]">Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="w-20 h-20 border-2 border-[#E2741B]">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="bg-[#2a2a2a] text-[#E2741B] text-2xl">
                  {form.displayName?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[#E2741B] text-black"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="Change avatar photo"
                data-testid="button-change-avatar"
              >
                <Camera className="w-3 h-3" />
              </Button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
            {uploading && <p className="text-sm text-gray-400">Uploading...</p>}
          </div>

          <div className="space-y-1">
            <Label className="text-gray-400 text-sm">Display Name</Label>
            <Input
              className="bg-[#111] border-[#333] text-white"
              placeholder="Your screen name"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              data-testid="input-display-name"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-gray-400 text-sm">Username <span className="text-xs opacity-50">(@handle)</span></Label>
            <Input
              className="bg-[#111] border-[#333] text-white"
              placeholder="your_handle"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
              data-testid="input-username"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-gray-400 text-sm">Bio</Label>
            <Textarea
              className="bg-[#111] border-[#333] text-white resize-none"
              placeholder="Share your story..."
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              data-testid="textarea-bio"
            />
          </div>

          <Button
            className="w-full bg-[#E2741B] text-black font-bold"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid="button-save-profile"
          >
            {saveMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Go Live Modal (admin only) ────────────────────────────────────────────────
function GoLiveModal({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", streamUrl: "", scheduledAt: "" });
  const [isStartingNow, setIsStartingNow] = useState(true);

  const createMutation = useMutation({
    mutationFn: async () => {
      const body = {
        ...form,
        scheduledAt: isStartingNow ? null : form.scheduledAt || null,
      };
      const res = await apiRequest("POST", "/api/live/events", body);
      if (isStartingNow) {
        await apiRequest("POST", `/api/live/events/${(res as any).id}/start`, { streamUrl: form.streamUrl });
      }
      return res;
    },
    onSuccess: () => {
      toast({ title: isStartingNow ? "You're LIVE!" : "Event scheduled!" });
      onSuccess();
      setOpen(false);
      setForm({ title: "", description: "", streamUrl: "", scheduledAt: "" });
    },
    onError: () => toast({ title: "Failed to go live", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 text-white font-bold gap-2" data-testid="button-go-live">
          <Radio className="w-4 h-4" />
          Go Live
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-400 flex items-center gap-2">
            <Radio className="w-5 h-5 animate-pulse" /> Go Live
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              className={isStartingNow ? "bg-red-600 text-white" : "bg-[#2a2a2a] text-gray-300"}
              onClick={() => setIsStartingNow(true)}
            >
              Start Now
            </Button>
            <Button
              size="sm"
              className={!isStartingNow ? "bg-[#E2741B] text-black" : "bg-[#2a2a2a] text-gray-300"}
              onClick={() => setIsStartingNow(false)}
            >
              Schedule
            </Button>
          </div>

          <div className="space-y-1">
            <Label className="text-gray-400 text-sm">Event Title</Label>
            <Input className="bg-[#111] border-[#333] text-white" placeholder="e.g. Weekly Q&A with Nick" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} data-testid="input-live-title" />
          </div>

          <div className="space-y-1">
            <Label className="text-gray-400 text-sm">Stream URL <span className="text-xs opacity-50">(YouTube Live, Zoom, etc.)</span></Label>
            <Input className="bg-[#111] border-[#333] text-white" placeholder="https://youtube.com/live/..." value={form.streamUrl} onChange={(e) => setForm((f) => ({ ...f, streamUrl: e.target.value }))} data-testid="input-stream-url" />
          </div>

          {!isStartingNow && (
            <div className="space-y-1">
              <Label className="text-gray-400 text-sm">Scheduled Date & Time</Label>
              <Input type="datetime-local" className="bg-[#111] border-[#333] text-white" value={form.scheduledAt} onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-gray-400 text-sm">Description <span className="text-xs opacity-50">(optional)</span></Label>
            <Textarea className="bg-[#111] border-[#333] text-white resize-none" placeholder="What will you cover?" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>

          <Button className={`w-full font-bold ${isStartingNow ? "bg-red-600 text-white" : "bg-[#E2741B] text-black"}`} onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.title} data-testid="button-start-live">
            {createMutation.isPending ? "Starting..." : isStartingNow ? "Go LIVE Now" : "Schedule Event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Post Composer ─────────────────────────────────────────────────────────────
function PostComposer({ user, settings }: { user: any; settings: any }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<string>("update");
  // Private by default; send the chosen audience explicitly to the API.
  const [visibility, setVisibility] = useState<"private" | "members" | "pod" | "public">("private");
  const [media, setMedia] = useState<Array<{ url: string; mediaType: string; name: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [failedFiles, setFailedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [postError, setPostError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    setUploadError("");
    const failed: File[] = [];
    let uploaded = 0;

    for (const file of files) {
      try {
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          throw new Error("Choose an image or video file.");
        }
        if (file.size > 500 * 1024 * 1024) {
          throw new Error("Files must be smaller than 500MB.");
        }
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload/media", { method: "POST", body: fd });
        let data: any = {};
        try { data = await res.json(); } catch { /* use the status message below */ }
        if (!res.ok || !data.url || !data.mediaType) {
          throw new Error(data.message || "The upload did not finish.");
        }
        setMedia((m) => [...m, { url: data.url, mediaType: data.mediaType, name: file.name }]);
        uploaded++;
      } catch {
        failed.push(file);
      }
    }
    setFailedFiles(failed);
    setUploading(false);
    if (failed.length > 0) {
      const message = `${failed.length} upload${failed.length === 1 ? "" : "s"} failed. Retry before posting.`;
      setUploadError(message);
      toast({
        title: uploaded > 0 ? "Some uploads failed" : "Upload failed",
        description: message,
        variant: "destructive",
      });
    } else {
      toast({ title: `${uploaded} file${uploaded === 1 ? "" : "s"} ready to post` });
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    await uploadFiles(files);
  };

  const postMutation = useMutation({
    onMutate: () => setPostError(""),
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/activity", {
        postType,
        content: content.trim(),
        visibility,
        media: media.map(({ url, mediaType }) => ({ mediaUrl: url, mediaType })),
      });
      return response.json();
    },
    onSuccess: (post: any) => {
      qc.invalidateQueries({ queryKey: ["/api/community/posts"] });
      setContent("");
      setMedia([]);
      setFailedFiles([]);
      setUploadError("");
      setPostError("");
      setPostType("update");
      setVisibility("private");
      setExpanded(false);
      toast({
        title: post?.crisis ? "Posted — please reach out for support" : "Posted to the community!",
        description: post?.crisis
          ? "If you may be in immediate danger, call 911. You can also call or text 988 in the U.S."
          : undefined,
      });
    },
    onError: (error: any) => {
      const message = error?.message || "We couldn't publish that post. Try again.";
      setPostError(message);
      toast({ title: "Failed to post", description: message, variant: "destructive" });
    },
  });

  const { data: personaData } = useQuery<{ persona: { name: string; creed: string; accentColor: string } | null }>({
    queryKey: ['/api/persona/me'],
  });
  const persona = personaData?.persona ?? null;
  const avatarSrc = settings?.avatarUrl || user?.profileImageUrl || "";
  const displayName = persona?.name || settings?.displayName || user?.firstName || "Member";

  return (
    <Card className="bg-[#1a1a1a] border-[#333]">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="w-10 h-10 border border-[#333] flex-shrink-0">
            <AvatarImage src={avatarSrc} />
            <AvatarFallback className="bg-[#2a2a2a] text-[#E2741B]">
              {displayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            {persona && (
              <p className="text-xs italic" style={{ color: safeAccentForDark(persona.accentColor) }} data-testid="text-composer-creed">
                "{persona.creed}"
              </p>
            )}
            {!expanded ? (
              <button
                className="w-full text-left text-gray-500 bg-[#111] rounded-md px-4 py-2.5 text-sm border border-[#333] hover:border-[#555] transition-colors"
                onClick={() => setExpanded(true)}
                data-testid="button-open-composer"
              >
                Share your progress, {displayName}...
              </button>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {POST_TYPES.map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      onClick={() => setPostType(type)}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        postType === type
                          ? "border-[#E2741B] text-[#E2741B] bg-[#E2741B]/10"
                          : "border-[#333] text-gray-400 hover:border-[#555]"
                      }`}
                      data-testid={`button-post-type-${type}`}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  ))}
                </div>

                <Textarea
                  className="bg-[#111] border-[#333] text-white resize-none min-h-[100px] focus:border-[#E2741B]"
                  placeholder={
                    postType === "milestone" ? "What milestone did you hit today?"
                    : postType === "question" ? "Ask the community..."
                    : postType === "tip" ? "Share a recovery tip..."
                    : postType === "celebration" ? "Celebrate your win!"
                    : "Share your progress with the community..."
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  data-testid="textarea-post-content"
                />

                 <div className="rounded-md border border-[#E2741B]/40 bg-[#E2741B]/10 px-3 py-2 text-xs text-gray-300" role="note">
                   <strong className="text-[#E2741B]">Privacy and safety:</strong> Community posts may contain sensitive health information. Choose who can see this post below. Community replies are peer support, not medical advice.
                 </div>
                 <label className="flex items-center gap-2 text-sm text-gray-300">
                   <span className="text-xs uppercase tracking-wide text-gray-500">Audience</span>
                   <select
                     value={visibility}
                     onChange={(e) => setVisibility(e.target.value as typeof visibility)}
                     className="rounded-md border border-[#333] bg-[#111] px-2 py-1.5 text-sm text-white"
                     aria-label="Choose who can see this post"
                     data-testid="select-post-visibility"
                   >
                     <option value="private">Only me (private)</option>
                     <option value="members">Community members</option>
                     <option value="pod">My pod</option>
                     <option value="public">Anyone (public)</option>
                   </select>
                 </label>

                {media.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {media.map((m, i) => (
                      <div key={i} className="relative">
                        {m.mediaType === "video" ? (
                          <video src={m.url} title="Uploaded video preview" className="w-24 h-24 rounded object-cover" />
                        ) : (
                          <img src={m.url} alt="Uploaded image preview" className="w-24 h-24 rounded object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => setMedia((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5"
                          aria-label={`Remove ${m.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 gap-1.5"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      data-testid="button-attach-media"
                    >
                      <Image className="w-4 h-4" />
                      Photo
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 gap-1.5"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      data-testid="button-attach-video"
                    >
                      <Video className="w-4 h-4" />
                      Video
                    </Button>
                    {uploading && <span className="text-xs text-gray-400 self-center" role="status">Uploading media…</span>}
                    {!uploading && uploadError && (
                      <div className="flex items-center gap-2 text-xs text-red-300" role="alert" data-testid="text-upload-error">
                        <span>{uploadError}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 border-red-400/50 text-red-200"
                          onClick={() => uploadFiles(failedFiles)}
                          disabled={failedFiles.length === 0}
                          data-testid="button-retry-upload"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" /> Retry
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="text-gray-400" onClick={() => { setExpanded(false); setContent(""); setMedia([]); setFailedFiles([]); setUploadError(""); setPostError(""); setVisibility("private"); }}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#E2741B] text-black font-bold gap-1.5"
                      onClick={() => postMutation.mutate()}
                      disabled={postMutation.isPending || uploading || failedFiles.length > 0 || (!content.trim() && !media.length)}
                      data-testid="button-submit-post"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {postMutation.isPending ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </div>
                {postError && (
                  <div className="flex items-center justify-between gap-3 rounded-md border border-red-500/40 bg-red-950/20 px-3 py-2 text-xs text-red-200" role="alert" data-testid="text-post-error">
                    <span>{postError}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 shrink-0 border-red-400/50 text-red-200"
                      onClick={() => postMutation.mutate()}
                      disabled={postMutation.isPending}
                      data-testid="button-retry-post"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" /> Retry post
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleMediaUpload}
        />
      </CardContent>
    </Card>
  );
}

// ─── Comment Thread ─────────────────────────────────────────────────────────────
function CommentThread({ postId, currentUser, settings }: { postId: number; currentUser: any; settings: any }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [replyParentId, setReplyParentId] = useState<number | null>(null);
  const [replyToHandle, setReplyToHandle] = useState<string>("");

  const { data: comments = [], isLoading } = useQuery<EnrichedComment[]>({
    queryKey: [`/api/community/comments/${postId}`],
  });

  const commentMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/activity/${postId}/comment`, {
        content: commentText,
        parentId: replyParentId ?? undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`/api/community/comments/${postId}`] });
      qc.invalidateQueries({ queryKey: ["/api/community/posts"] });
      setCommentText("");
      setReplyParentId(null);
      setReplyToHandle("");
      toast({ title: replyParentId ? "Reply posted!" : "Comment posted!" });
    },
    onError: () => toast({ title: "Failed to post comment", variant: "destructive" }),
  });

  const avatarSrc = settings?.avatarUrl || currentUser?.profileImageUrl || "";
  const displayName = settings?.displayName || currentUser?.firstName || "Member";

  // Build tree (one level of nesting; deeper replies still attach to first-level parent)
  const topLevel = comments.filter((c) => !(c.parent_id ?? c.parentId));
  const childrenOf = (id: number) =>
    comments.filter((c) => (c.parent_id ?? c.parentId) === id);

  const startReply = (c: EnrichedComment) => {
    const handle = c.username
      ? `@${c.username}`
      : c.displayName
        ? `@${c.displayName.replace(/\s+/g, "")}`
        : `@${c.firstName || "member"}`;
    // Always attach to the top-level parent so the thread stays single-depth and visible.
    const topLevelParent = (c.parent_id ?? c.parentId) || c.id;
    setReplyParentId(topLevelParent);
    setReplyToHandle(handle);
    setCommentText((prev) => (prev.startsWith(handle) ? prev : `${handle} `));
  };

  const renderOne = (c: EnrichedComment, isReply: boolean) => (
    <div key={c.id} className={`flex gap-2.5 ${isReply ? "ml-9" : ""}`}>
      <Avatar className="w-7 h-7 border border-[#333] flex-shrink-0">
        <AvatarImage src={c.avatarUrl || c.profileImageUrl || ""} />
        <AvatarFallback className="bg-[#2a2a2a] text-[#E2741B] text-xs">
          {(c.displayName || c.firstName || "M")[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-[#111] rounded-md px-3 py-2">
          <p className="text-xs font-semibold text-[#E2741B] mb-0.5">
            {c.displayName || `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Member"}
            {c.username && (
              <span className="ml-1 font-normal text-gray-500">@{c.username}</span>
            )}
          </p>
          <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">
            {renderMentions(c.content)}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-0.5 pl-1">
          <p className="text-xs text-gray-500">{timeAgo((c as any).createdAt || (c as any).created_at)}</p>
          <button
            type="button"
            onClick={() => startReply(c)}
            className="text-xs font-semibold text-gray-400 hover:text-[#E2741B]"
            data-testid={`button-reply-${c.id}`}
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="border-t border-[#2a2a2a] pt-3 mt-2 space-y-3">
      {!currentUser && (
        <a
          href={`/recovery/login?next=${encodeURIComponent("/recovery/community")}`}
          className="block rounded-md border border-[#E2741B]/30 bg-[#E2741B]/10 px-3 py-2 text-xs text-[#F3B27A]"
        >
          Sign in to join this conversation.
        </a>
      )}
      {isLoading ? (
        <p className="text-xs text-gray-500 pl-2">Loading comments...</p>
      ) : topLevel.length === 0 ? (
        <p className="text-xs text-gray-500 pl-2">Be the first to comment.</p>
      ) : (
        topLevel.map((c) => (
          <div key={c.id} className="space-y-2">
            {renderOne(c, false)}
            {childrenOf(c.id).map((child) => renderOne(child, true))}
          </div>
        ))
      )}

      {replyParentId && (
        <div className="flex items-center gap-2 ml-9 text-xs text-gray-400">
          Replying to <span className="font-semibold text-[#E2741B]">{replyToHandle}</span>
          <button
            type="button"
            className="underline hover:text-white"
            onClick={() => {
              setReplyParentId(null);
              setReplyToHandle("");
              if (commentText.startsWith(replyToHandle)) {
                setCommentText(commentText.slice(replyToHandle.length).trimStart());
              }
            }}
            data-testid={`button-cancel-reply-${postId}`}
          >
            cancel
          </button>
        </div>
      )}

      {currentUser && <div className="flex gap-2 pt-1">
        <Avatar className="w-7 h-7 border border-[#333] flex-shrink-0">
          <AvatarImage src={avatarSrc} />
          <AvatarFallback className="bg-[#2a2a2a] text-[#E2741B] text-xs">
            {displayName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Input
            className="bg-[#111] border-[#333] text-white text-sm"
            placeholder={replyParentId ? "Write a reply..." : "Write a comment... use @name to mention"}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && commentText.trim()) { e.preventDefault(); commentMutation.mutate(); } }}
            data-testid={`input-comment-${postId}`}
          />
          <Button
            size="icon"
            className="bg-[#E2741B] text-black flex-shrink-0"
            onClick={() => commentMutation.mutate()}
            disabled={commentMutation.isPending || !commentText.trim()}
            aria-label="Send comment"
            data-testid={`button-send-comment-${postId}`}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>}
    </div>
  );
}

// ─── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, currentUser, settings }: { post: EnrichedPost; currentUser: any; settings: any }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Harassment or bullying");

  const userId = currentUser?.claims?.sub || currentUser?.id || "";
  const myReaction = post.reactions?.find((r) => r.userId === userId)?.reactionType;
  const reactionCounts = REACTIONS.map((r) => ({
    ...r,
    count: post.reactions?.filter((rx) => rx.reactionType === r.type).length || 0,
  }));
  const totalReactions = post.reactions?.length || 0;
  const commentCount = Number(post.comment_count_real || post.commentCount || 0);

  const reactMutation = useMutation({
    mutationFn: (reactionType: string) =>
      apiRequest("POST", `/api/activity/${post.id}/react`, { reactionType }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/community/posts"] }),
    onError: () => toast({ title: "Failed to react", variant: "destructive" }),
  });
  const reportMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/community/report", {
      targetType: "activity", targetId: String(post.id), reason: reportReason,
    }),
    onSuccess: () => {
      setReportOpen(false);
      toast({ title: "Report sent", description: "Our moderation team will review this." });
    },
    onError: () => toast({ title: "Couldn't send report", variant: "destructive" }),
  });
  const blockMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/community/block", { userId: post.authorId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/community/posts"] });
      toast({ title: "Member blocked", description: "Their posts are now hidden from you." });
    },
    onError: () => toast({ title: "Couldn't block member", variant: "destructive" }),
  });

  const typeBadge = postTypeBadge(post.postType);

  return (
    <Card className={`bg-[#1a1a1a] border-[#333] transition-all ${post.isPinned ? "border-[#E2741B]/40" : ""}`} data-testid={`card-post-${post.id}`}>
      <CardContent className="p-4 space-y-3">
        {post.isPinned && (
          <div className="flex items-center gap-1.5 text-xs text-[#E2741B]">
            <Pin className="w-3 h-3" />
            Pinned Post
          </div>
        )}

        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10 border border-[#333] flex-shrink-0">
            <AvatarImage src={getAvatar(post)} />
            <AvatarFallback className="bg-[#2a2a2a] text-[#E2741B]">
              {getDisplayName(post)[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-semibold text-sm"
                style={{ color: post.persona_name ? safeAccentForDark(post.persona_accent_color) : "#FFFFFF" }}
                data-testid={`text-post-author-${post.id}`}
              >
                {getDisplayName(post)}
              </span>
              {post.username && (
                <span className="text-xs text-gray-500">@{post.username}</span>
              )}
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${typeBadge.color}20`, color: typeBadge.color }}
              >
                {typeBadge.label}
              </span>
            </div>
            {post.persona_creed && (
              <p
                className="text-xs italic mt-0.5 truncate"
                style={{ color: safeAccentForDark(post.persona_accent_color), opacity: 0.85 }}
                data-testid={`text-post-creed-${post.id}`}
                title={post.persona_creed}
              >
                "{post.persona_creed}"
              </p>
            )}
            <p className="text-xs text-gray-500 mt-0.5">{timeAgo((post as any).createdAt || (post as any).created_at)}</p>
          </div>
        </div>

        {post.title && (
          <p className="text-base font-semibold text-white">{post.title}</p>
        )}
        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {post.media && post.media.length > 0 && (
          <div className={`grid gap-2 ${post.media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {post.media.map((m) => (
              <div key={m.id} className="rounded-md overflow-hidden">
                {m.mediaType === "video" ? (
                  <video
                    src={m.mediaUrl}
                    controls
                    className="w-full max-h-72 object-cover bg-black"
                    data-testid={`video-post-${m.id}`}
                  />
                ) : (
                  <img
                    src={m.mediaUrl}
                    alt="Post media"
                    className="w-full max-h-72 object-cover"
                    data-testid={`img-post-${m.id}`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          {totalReactions > 0 && (
            <span className="flex items-center gap-1">
              {reactionCounts.filter((r) => r.count > 0).slice(0, 3).map((r) => (
                <r.icon key={r.type} className="w-3 h-3" style={{ color: r.color }} />
              ))}
              {totalReactions}
            </span>
          )}
          {commentCount > 0 && (
            <button className="ml-auto hover:text-gray-300" onClick={() => setShowComments((s) => !s)}>
              {commentCount} comment{commentCount !== 1 ? "s" : ""}
            </button>
          )}
        </div>

        <Separator className="bg-[#2a2a2a]" />

        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {REACTIONS.map((r) => {
              const count = reactionCounts.find((rc) => rc.type === r.type)?.count || 0;
              const isMe = myReaction === r.type;
              return (
                <button
                  key={r.type}
                  onClick={() => {
                    if (!currentUser) {
                      window.location.href = `/recovery/login?next=${encodeURIComponent("/recovery/community")}`;
                      return;
                    }
                    reactMutation.mutate(r.type);
                  }}
                  disabled={reactMutation.isPending}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                    isMe
                      ? "border-current text-white"
                      : "border-[#333] text-gray-400 hover:border-[#555]"
                  }`}
                  style={isMe ? { color: r.color, borderColor: `${r.color}60`, backgroundColor: `${r.color}15` } : {}}
                  data-testid={`button-react-${r.type}-${post.id}`}
                >
                  <r.icon className="w-3 h-3" />
                  {count > 0 && <span>{count}</span>}
                </button>
              );
            })}
          </div>

          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-400 gap-1 text-xs"
              onClick={() => setShowComments((s) => !s)}
              data-testid={`button-toggle-comments-${post.id}`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {commentCount > 0 ? commentCount : "Comment"}
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-3 text-xs">
          {currentUser && currentUser?.id !== post.authorId && (
            <button
              className="text-gray-500 hover:text-gray-300"
              onClick={() => blockMutation.mutate()}
              disabled={blockMutation.isPending}
            >
              {blockMutation.isPending ? "Blocking…" : "Block member"}
            </button>
          )}
          {currentUser ? (
            <button className="text-gray-500 hover:text-gray-300" onClick={() => setReportOpen(true)}>
              Report
            </button>
          ) : (
            <a href={`/recovery/login?next=${encodeURIComponent("/recovery/community")}`} className="text-[#E2741B]">
              Sign in to interact
            </a>
          )}
        </div>

        {showComments && (
          <CommentThread postId={post.id} currentUser={currentUser} settings={settings} />
        )}
        <Dialog open={reportOpen} onOpenChange={setReportOpen}>
          <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
            <DialogHeader><DialogTitle>Report this post</DialogTitle></DialogHeader>
            <p className="text-sm text-gray-400">Tell us what needs attention. This platform is not a clinical service.</p>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full rounded-md bg-[#222] border border-[#444] p-2 text-sm"
            >
              <option>Harassment or bullying</option>
              <option>Unsafe medical claim</option>
              <option>Privacy concern</option>
              <option>Spam or scam</option>
              <option>Something else</option>
            </select>
            <Button onClick={() => reportMutation.mutate()} disabled={reportMutation.isPending} className="bg-[#E2741B] text-black">
              {reportMutation.isPending ? "Sending…" : "Send report"}
            </Button>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ─── Feed Tab ─────────────────────────────────────────────────────────────────
function FeedTab({ user, settings }: { user: any; settings: any }) {
  const [filterType, setFilterType] = useState("all");

  const { data: posts = [], isLoading } = useQuery<EnrichedPost[]>({
    queryKey: ["/api/community/posts"],
  });

  const filtered = filterType === "all" ? posts : posts.filter((p) => p.postType === filterType);

  return (
    <div className="space-y-3">
      {/* Mobile-only horizontal filter scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {[{ type: "all", label: "All Posts", icon: Activity }, ...POST_TYPES].map(({ type: t, label, icon: Icon }) => (
          <button
            key={t || "all"}
            onClick={() => setFilterType(t || "all")}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border flex-shrink-0 transition-colors ${
              filterType === (t || "all")
                ? "text-black bg-[#E2741B] border-[#E2741B]"
                : "text-gray-400 border-[#333] bg-[#1a1a1a]"
            }`}
            data-testid={`button-mobile-filter-${t || "all"}`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="hidden lg:block space-y-3">
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardContent className="p-3 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Filter</p>
            {[{ type: "all", label: "All Posts", icon: Activity }, ...POST_TYPES].map(({ type: t, label, icon: Icon }) => (
              <button
                key={t || "all"}
                onClick={() => setFilterType(t || "all")}
                className={`w-full flex items-center gap-2 text-sm px-2.5 py-1.5 rounded transition-colors text-left ${
                  filterType === (t || "all") ? "text-[#E2741B] bg-[#E2741B]/10" : "text-gray-400 hover:text-gray-200"
                }`}
                data-testid={`button-filter-${t || "all"}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </CardContent>
        </Card>

        <ProfileEditModal
          trigger={
            <Button variant="outline" className="w-full border-[#333] text-gray-400 text-sm gap-2" data-testid="button-edit-profile-sidebar">
              <Camera className="w-4 h-4" />
              Edit Profile
            </Button>
          }
        />
      </div>

      <div className="lg:col-span-3 space-y-4">
        <div className="rounded-lg border border-[#E2741B]/40 bg-[#E2741B]/10 px-4 py-3 text-xs text-gray-300" role="note" data-testid="community-privacy-warning">
          <strong className="text-[#E2741B]">Before you post:</strong> Community posts may contain sensitive health information. Posts are private by default; choose an audience deliberately. Community replies are peer support, not medical advice.
        </div>
        {user ? <PostComposer user={user} settings={settings} /> : (
          <Card className="bg-[#1a1a1a] border-[#E2741B]/30">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-white font-semibold">Have a question or a small win?</p>
                <p className="text-xs text-gray-400 mt-1">Sign in to share an update, question, or recovery story.</p>
              </div>
              <Button asChild className="bg-[#E2741B] text-black shrink-0">
                <a href={`/recovery/login?next=${encodeURIComponent("/recovery/community")}`}>Sign in to post</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-[#1a1a1a] border-[#333] animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2a2a2a]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#2a2a2a] rounded w-1/3" />
                      <div className="h-4 bg-[#2a2a2a] rounded w-3/4" />
                      <div className="h-4 bg-[#2a2a2a] rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardContent className="p-10 text-center">
              <Activity className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No posts yet.</p>
              <p className="text-gray-500 text-sm mt-1">Be the first to share your progress!</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((post) => (
            <PostCard key={post.id} post={post} currentUser={user} settings={settings} />
          ))
        )}
      </div>
    </div>
    </div>
  );
}

// ─── Members Tab ───────────────────────────────────────────────────────────────
function MembersTab() {
  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["/api/community/members"],
  });
  const { user: me } = useAuth();
  const [giftTarget, setGiftTarget] = useState<Member | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">{members.length} members in the community</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="bg-[#1a1a1a] border-[#333] animate-pulse">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-[#2a2a2a]" />
                <div className="h-3 bg-[#2a2a2a] rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {members.map((m, idx) => {
            const memberName = m.persona_name || m.displayName || `${m.firstName || ""} ${m.lastName || ""}`.trim() || "Member";
            const isMe = me?.id === m.id;
            return (
              <Card key={m.id} className="bg-[#1a1a1a] border-[#333] flex flex-col" data-testid={`card-member-${m.id}`}>
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center flex-1">
                  {idx < 3 && (
                    <Crown className="w-4 h-4 text-[#E2741B] self-start" />
                  )}
                  <Avatar className="w-14 h-14 border-2 border-[#333]">
                    <AvatarImage src={m.avatarUrl || m.profileImageUrl || ""} />
                    <AvatarFallback className="bg-[#2a2a2a] text-[#E2741B] text-lg">
                      {memberName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p
                      className="text-sm font-semibold leading-tight"
                      style={{ color: m.persona_name ? safeAccentForDark(m.persona_accent_color) : "#FFFFFF" }}
                    >
                      {memberName}
                    </p>
                    {m.persona_creed && (
                      <p
                        className="text-[10px] italic leading-snug mt-0.5 line-clamp-2"
                        style={{ color: safeAccentForDark(m.persona_accent_color), opacity: 0.8 }}
                        title={m.persona_creed}
                      >
                        "{m.persona_creed}"
                      </p>
                    )}
                    {m.username && <p className="text-xs text-gray-500 mt-0.5">@{m.username}</p>}
                    {m.currentStreak != null && m.currentStreak > 0 && (
                      <div className="flex items-center gap-1 justify-center mt-1">
                        <Flame className="w-3 h-3 text-orange-400" />
                        <span className="text-xs text-orange-400">{m.currentStreak}-day streak</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                {!isMe && me && (
                  <div className="px-3 pb-3 space-y-2">
                    <Button
                      size="sm"
                      onClick={() => setGiftTarget(m)}
                      className="w-full bg-[#E2741B]/15 hover:bg-[#E2741B]/25 text-[#E2741B] border border-[#E2741B]/30"
                      data-testid={`button-gift-${m.id}`}
                    >
                      <Zap className="w-3.5 h-3.5 mr-1" /> Send Power
                    </Button>
                    <DailyGiftButton
                      receiverId={m.id}
                      receiverName={memberName}
                      className="w-full"
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {giftTarget && (
        <SendPowerPointsModal
          open={!!giftTarget}
          onOpenChange={(v) => { if (!v) setGiftTarget(null); }}
          receiverId={giftTarget.id}
          receiverName={giftTarget.persona_name || giftTarget.displayName || `${giftTarget.firstName || ""} ${giftTarget.lastName || ""}`.trim() || "Member"}
          receiverAvatarUrl={giftTarget.avatarUrl || giftTarget.profileImageUrl}
        />
      )}
    </div>
  );
}

// ─── Live Tab ─────────────────────────────────────────────────────────────────
function LiveTab({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const { data: events = [], isLoading } = useQuery<LiveEvent[]>({
    queryKey: ["/api/live/events"],
  });

  const endMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/live/events/${id}/end`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/live/events"] }),
  });

  const liveNow = events.filter((e) => e.is_live);
  const upcoming = events.filter((e) => !e.is_live && e.scheduled_at && new Date(e.scheduled_at) > new Date());
  const past = events.filter((e) => !e.is_live && (!e.scheduled_at || new Date(e.scheduled_at) <= new Date()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Live Events</h3>
          <p className="text-sm text-gray-400">Join Nick for public coaching and Q&A broadcasts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="border-[#333] text-gray-300 gap-2" data-testid="link-live-video-sessions">
            <Link href="/recovery/video">
              <Video className="w-4 h-4" /> Live video sessions
            </Link>
          </Button>
          {isAdmin && (
            <GoLiveModal onSuccess={() => qc.invalidateQueries({ queryKey: ["/api/live/events"] })} />
          )}
        </div>
      </div>

      {liveNow.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <h4 className="font-semibold text-red-400">LIVE NOW</h4>
          </div>
          {liveNow.map((event) => (
            <Card key={event.id} className="bg-[#1a1a1a] border-red-600/40" data-testid={`card-live-${event.id}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-600 text-white text-xs">LIVE</Badge>
                      <h5 className="font-semibold text-white">{event.title}</h5>
                    </div>
                    {event.description && <p className="text-sm text-gray-400 mt-1">{event.description}</p>}
                  </div>
                  {isAdmin && (
                    <Button size="sm" variant="outline" className="border-red-600 text-red-400 text-xs" onClick={() => endMutation.mutate(event.id)}>
                      End Stream
                    </Button>
                  )}
                </div>

                {event.stream_url && (
                  <div className="rounded-md overflow-hidden bg-black aspect-video">
                    {event.stream_url.includes("youtube.com") || event.stream_url.includes("youtu.be") ? (
                      <iframe
                        src={event.stream_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={event.title}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
                        <PlayCircle className="w-14 h-14 text-red-500" />
                        <a href={event.stream_url} target="_blank" rel="noopener noreferrer">
                          <Button className="bg-red-600 text-white gap-2">
                            <PlayCircle className="w-4 h-4" />
                            Join Live Stream
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-[#E2741B] flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Upcoming
          </h4>
          {upcoming.map((event) => (
            <Card key={event.id} className="bg-[#1a1a1a] border-[#333]" data-testid={`card-upcoming-${event.id}`}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{event.title}</p>
                  {event.scheduled_at && (
                    <p className="text-sm text-[#E2741B] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(event.scheduled_at).toLocaleString()}
                    </p>
                  )}
                  {event.description && <p className="text-sm text-gray-400 mt-1">{event.description}</p>}
                </div>
                <Badge className="bg-[#E2741B]/20 text-[#E2741B] border-[#E2741B]/40">Upcoming</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {liveNow.length === 0 && upcoming.length === 0 && !isLoading && (
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardContent className="p-10 text-center space-y-3">
            <Radio className="w-10 h-10 text-gray-500 mx-auto" />
            <p className="text-gray-400">No live events right now.</p>
            <p className="text-gray-500 text-sm">Check back soon for live coaching sessions with Nick!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Community Page ───────────────────────────────────────────────────────
export default function RecoveryCommunity() {
  const { user, isAuthenticated } = useAuth();
  const { data: settings } = useQuery<any>({
    queryKey: ["/api/user/settings"],
    enabled: isAuthenticated,
  });

  const isAdmin = (user as any)?.claims?.email === "nick@kremers.com" ||
    (user as any)?.claims?.sub === (import.meta.env.VITE_ADMIN_USER_ID || "");

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoverySEO
        title="Survivor Community — Stroke Recovery Academy"
        description="Connect with stroke survivors on the same journey. Share your wins, ask questions, track your progress, and get support from people who truly understand recovery."
        canonical="/recovery/community"
        keywords={["stroke survivor community", "stroke recovery support group", "stroke accountability", "stroke recovery peers"]}
        pageType="website"
      />
      <RecoveryHeader />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Community</h1>
            <p className="text-sm text-gray-400 mt-0.5">One place to share a small win, ask a question, or encourage another survivor.</p>
          </div>
          <div className="flex gap-2">
            {isAuthenticated && (
              <ProfileEditModal
                trigger={
                  <Button variant="outline" className="border-[#333] text-gray-300 gap-2" data-testid="button-edit-profile-header">
                    <Camera className="w-4 h-4" />
                    Edit Profile
                  </Button>
                }
              />
            )}
          </div>
        </div>

        <Tabs defaultValue="feed">
          <div className="overflow-x-auto">
          <TabsList className="bg-[#1a1a1a] border border-[#333] w-full sm:w-auto">
            <TabsTrigger value="feed" className="data-[state=active]:bg-[#E2741B] data-[state=active]:text-black text-gray-400" data-testid="tab-feed">
              <Activity className="w-4 h-4 mr-1.5" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-[#E2741B] data-[state=active]:text-black text-gray-400" data-testid="tab-members">
              <Users className="w-4 h-4 mr-1.5" />
              Members
            </TabsTrigger>
            <TabsTrigger value="live" className="data-[state=active]:bg-[#E2741B] data-[state=active]:text-black text-gray-400" data-testid="tab-live-events">
              <Radio className="w-4 h-4 mr-1.5" />
              Live Events
            </TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="feed" className="mt-4">
            <FeedTab user={user} settings={settings} />
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <MembersTab />
          </TabsContent>

          <TabsContent value="live" className="mt-4">
            <LiveTab isAdmin={isAdmin} />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
