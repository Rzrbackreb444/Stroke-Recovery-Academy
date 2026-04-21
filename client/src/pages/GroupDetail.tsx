import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft, Users, Shield, Heart, HeartPulse, Sparkles,
  Mic, Square, Send, AlertTriangle, LogIn, LogOut as LogOutIcon, Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  survivor: { label: "Survivors", icon: Shield, color: "text-[#C9941A]" },
  caregiver: { label: "Caregivers", icon: Heart, color: "text-rose-500" },
  condition: { label: "Condition-specific", icon: HeartPulse, color: "text-blue-400" },
  general: { label: "General", icon: Sparkles, color: "text-emerald-400" },
};

interface GroupDetailData {
  id: number; slug: string; name: string; description: string;
  type: string; conditionTag: string | null; memberCount: number;
  ownerId: string; isPrivate: boolean; isMember: boolean;
  members: Array<{ userId: string; role: string; firstName: string | null; avatarUrl: string | null }>;
}

interface GroupPost {
  id: number; groupId: number; authorId: string;
  content: string; audioUrl: string | null; crisisFlag: boolean;
  createdAt: string; authorName: string | null; authorAvatar: string | null;
}

export default function GroupDetail() {
  const [, params] = useRoute("/groups/:slug");
  const slug = params?.slug || "";
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { data: group, isLoading } = useQuery<GroupDetailData>({
    queryKey: ["/api/groups", slug],
  });

  const { data: posts = [] } = useQuery<GroupPost[]>({
    queryKey: ["/api/groups", group?.id, "posts"],
    enabled: !!group?.id,
  });

  const joinMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/groups/${group!.id}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", slug] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Joined", description: `Welcome to ${group?.name}.` });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/groups/${group!.id}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", slug] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Left group" });
    },
    onError: (e: any) => toast({ title: "Can't leave", description: e?.message, variant: "destructive" }),
  });

  const postMutation = useMutation({
    mutationFn: async (body: { content: string }) => {
      const res = await apiRequest("POST", `/api/groups/${group!.id}/posts`, body);
      return res.json();
    },
    onSuccess: (data: any) => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "posts"] });
      if (data?.crisis || data?.crisisFlag) {
        toast({
          title: "We hear you.",
          description: "If you're in crisis, call or text 988 (US) — help is available right now.",
          variant: "destructive",
        });
      }
    },
  });

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("audio", blob, "voice.webm");
        const r = await fetch(`/api/groups/${group!.id}/posts/voice`, {
          method: "POST", body: fd, credentials: "include",
        });
        if (!r.ok) {
          const msg = await r.text().catch(() => "");
          toast({ title: "Voice post failed", description: msg || undefined, variant: "destructive" });
          return;
        }
        const data = await r.json().catch(() => ({} as any));
        queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "posts"] });
        if (data?.crisis || data?.crisisFlag) {
          toast({
            title: "We hear you.",
            description: "If you're in crisis, call or text 988 (US) — help is available right now.",
            variant: "destructive",
          });
        }
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white p-6">
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
          <div className="h-32 bg-[#1a1a1a] rounded-lg" />
          <div className="h-24 bg-[#1a1a1a] rounded-lg" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <p className="text-gray-400 mb-4">Group not found.</p>
          <Link href="/groups">
            <Button variant="outline" className="border-[#333]" data-testid="link-back-groups">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Groups
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const meta = TYPE_META[group.type] || TYPE_META.general;
  const Icon = meta.icon;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Link href="/groups">
          <Button variant="ghost" className="text-gray-400" data-testid="link-back-groups">
            <ArrowLeft className="w-4 h-4 mr-2" /> All Groups
          </Button>
        </Link>

        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-md bg-[#C9941A]/10 flex items-center justify-center shrink-0">
                  <Icon className={`w-7 h-7 ${meta.color}`} />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white" data-testid="text-group-name">
                    {group.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <Badge className="bg-[#C9941A]/15 text-[#C9941A] border-0">{meta.label}</Badge>
                    {group.conditionTag && (
                      <Badge className="bg-blue-500/15 text-blue-300 border-0">{group.conditionTag}</Badge>
                    )}
                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Users className="w-3.5 h-3.5" />
                      <span data-testid="text-member-count">{group.memberCount}</span> members
                    </span>
                  </div>
                </div>
              </div>
              {user && (
                group.isMember ? (
                  group.ownerId === user.id ? (
                    <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-0 gap-1">
                      <Crown className="w-3 h-3" /> Owner
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      className="border-[#333] text-gray-300"
                      onClick={() => leaveMutation.mutate()}
                      disabled={leaveMutation.isPending}
                      data-testid="button-leave-group"
                    >
                      <LogOutIcon className="w-4 h-4 mr-2" /> Leave
                    </Button>
                  )
                ) : (
                  <Button
                    className="bg-[#C9941A] text-black hover:bg-[#C9941A]/90"
                    onClick={() => joinMutation.mutate()}
                    disabled={joinMutation.isPending}
                    data-testid="button-join-group"
                  >
                    <LogIn className="w-4 h-4 mr-2" /> Join
                  </Button>
                )
              )}
            </div>
            <p className="text-sm text-gray-300 mt-3 whitespace-pre-wrap">{group.description}</p>
          </CardHeader>
        </Card>

        {/* Composer */}
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardContent className="pt-6 space-y-3">
            {!user ? (
              <p className="text-sm text-gray-400 text-center py-4">
                <Link href="/recovery/login" className="text-[#C9941A] hover:underline">Sign in</Link>
                {" "}to join the conversation.
              </p>
            ) : !group.isMember ? (
              <p className="text-sm text-gray-400 text-center py-4">Join this group to post.</p>
            ) : (
              <>
                <Textarea
                  placeholder="Share a win, ask a question, request support..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="bg-[#0D0D0D] border-[#333] text-white resize-none min-h-[80px]"
                  data-testid="input-post-content"
                />
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {!recording ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#333] text-gray-300"
                        onClick={startRecording}
                        data-testid="button-voice-start"
                      >
                        <Mic className="w-4 h-4 mr-1.5" /> Voice
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-500/60 text-rose-300"
                        onClick={stopRecording}
                        data-testid="button-voice-stop"
                      >
                        <Square className="w-4 h-4 mr-1.5" /> Stop & send
                      </Button>
                    )}
                    {recording && (
                      <span className="text-xs text-rose-300 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Recording…
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#C9941A] text-black hover:bg-[#C9941A]/90"
                    disabled={!content.trim() || postMutation.isPending}
                    onClick={() => postMutation.mutate({ content: content.trim() })}
                    data-testid="button-post"
                  >
                    <Send className="w-4 h-4 mr-1.5" /> Post
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Feed */}
        <div className="space-y-3">
          {posts.length === 0 ? (
            <Card className="bg-[#1a1a1a] border-[#333]">
              <CardContent className="py-10 text-center text-gray-400 text-sm">
                No posts yet — be the first to share.
              </CardContent>
            </Card>
          ) : (
            posts.map((p) => (
              <Card
                key={p.id}
                className={`bg-[#1a1a1a] border-[#333] ${p.crisisFlag ? "border-rose-500/50" : ""}`}
                data-testid={`card-post-${p.id}`}
              >
                <CardContent className="pt-5 space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={p.authorAvatar || undefined} />
                      <AvatarFallback className="bg-[#C9941A]/20 text-[#C9941A] text-xs">
                        {(p.authorName || "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{p.authorName || "Survivor"}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(p.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {p.crisisFlag && (
                    <div className="flex items-start gap-2 p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        This message may indicate a crisis. If you or someone you love is in danger,
                        call or text <strong>988</strong> (US) right now. You are not alone.
                      </span>
                    </div>
                  )}
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">{p.content}</p>
                  {p.audioUrl && (
                    <audio controls src={p.audioUrl} className="w-full mt-2" data-testid={`audio-post-${p.id}`} />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Separator className="bg-[#222]" />

        {/* Members */}
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400 font-semibold uppercase tracking-wider">
              Members ({group.memberCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {group.members.map((m) => (
                <div key={m.userId} className="flex items-center gap-2" data-testid={`member-${m.userId}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={m.avatarUrl || undefined} />
                    <AvatarFallback className="bg-[#C9941A]/20 text-[#C9941A] text-xs">
                      {(m.firstName || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-300">
                    {m.firstName || "Survivor"}
                    {m.role === "owner" && <Crown className="w-3 h-3 ml-1 inline text-[#C9941A]" />}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
