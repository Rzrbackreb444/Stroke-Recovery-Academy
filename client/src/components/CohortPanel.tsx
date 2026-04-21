import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Users, Calendar, Mic, Square, Send, AlertTriangle, LogIn, LogOut as LogOutIcon, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Cohort {
  id: number; courseId: number; name: string;
  startDate: string; endDate: string;
  isActive: boolean; memberCount: number; isMember?: boolean;
}

interface CohortPost {
  id: number; cohortId: number; authorId: string;
  content: string; audioUrl: string | null; crisisFlag: boolean;
  createdAt: string; authorName: string | null; authorAvatar: string | null;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function CohortPanel({ courseId }: { courseId: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { data: cohorts = [], isLoading } = useQuery<Cohort[]>({
    queryKey: ["/api/courses", courseId, "cohorts"],
    enabled: !!courseId,
  });

  const activeCohortId = selectedId ?? cohorts[0]?.id ?? null;
  const activeCohort = cohorts.find((c) => c.id === activeCohortId) || null;

  const { data: posts = [] } = useQuery<CohortPost[]>({
    queryKey: ["/api/cohorts", activeCohortId, "posts"],
    enabled: !!activeCohortId,
  });

  const joinMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/cohorts/${activeCohortId}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "cohorts"] });
      toast({ title: "Joined cohort", description: `You'll start ${fmtDate(activeCohort!.startDate)}.` });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/cohorts/${activeCohortId}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "cohorts"] });
    },
  });

  const postMutation = useMutation({
    mutationFn: async (body: { content: string }) => {
      const res = await apiRequest("POST", `/api/cohorts/${activeCohortId}/posts`, body);
      return res.json();
    },
    onSuccess: (data: any) => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/cohorts", activeCohortId, "posts"] });
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
        const r = await fetch(`/api/cohorts/${activeCohortId}/posts/voice`, {
          method: "POST", body: fd, credentials: "include",
        });
        if (!r.ok) {
          const msg = await r.text().catch(() => "");
          toast({ title: "Voice post failed", description: msg || undefined, variant: "destructive" });
          return;
        }
        const data = await r.json().catch(() => ({} as any));
        queryClient.invalidateQueries({ queryKey: ["/api/cohorts", activeCohortId, "posts"] });
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
    return <div className="text-gray-400 text-sm py-6 text-center">Loading cohorts…</div>;
  }

  if (!activeCohort) {
    return (
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardContent className="py-8 text-center text-gray-400 text-sm">
          No cohorts available yet — check back soon.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cohort selector */}
      <div className="flex flex-wrap gap-2">
        {cohorts.map((c) => (
          <Button
            key={c.id}
            size="sm"
            variant={c.id === activeCohortId ? "default" : "outline"}
            className={c.id === activeCohortId
              ? "bg-[#C9941A] text-black hover:bg-[#C9941A]/90"
              : "border-[#333] text-gray-300"
            }
            onClick={() => setSelectedId(c.id)}
            data-testid={`button-cohort-${c.id}`}
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            {fmtDate(c.startDate)}
            {c.isMember && <CheckCircle2 className="w-3.5 h-3.5 ml-1.5 text-emerald-400" />}
          </Button>
        ))}
      </div>

      {/* Cohort header */}
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardContent className="pt-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-semibold text-white" data-testid="text-cohort-name">{activeCohort.name}</h3>
              <p className="text-xs text-gray-400 mt-1">
                {fmtDate(activeCohort.startDate)} → {fmtDate(activeCohort.endDate)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-[#C9941A]/15 text-[#C9941A] border-0 gap-1">
                  <Users className="w-3 h-3" />
                  <span data-testid="text-cohort-member-count">{activeCohort.memberCount}</span> members
                </Badge>
                {activeCohort.isActive && (
                  <Badge className="bg-emerald-500/15 text-emerald-300 border-0">Active</Badge>
                )}
              </div>
            </div>
            {user && (
              activeCohort.isMember ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#333] text-gray-300"
                  onClick={() => leaveMutation.mutate()}
                  disabled={leaveMutation.isPending}
                  data-testid="button-leave-cohort"
                >
                  <LogOutIcon className="w-3.5 h-3.5 mr-1.5" /> Leave
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-[#C9941A] text-black hover:bg-[#C9941A]/90"
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                  data-testid="button-join-cohort"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1.5" /> Join cohort
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Composer */}
      {user && activeCohort.isMember && (
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardContent className="pt-5 space-y-3">
            <Textarea
              placeholder="Check in with your cohort — wins, struggles, questions…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-[#0D0D0D] border-[#333] text-white resize-none min-h-[70px]"
              data-testid="input-cohort-post"
            />
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {!recording ? (
                <Button size="sm" variant="outline" className="border-[#333] text-gray-300"
                  onClick={startRecording} data-testid="button-cohort-voice-start">
                  <Mic className="w-4 h-4 mr-1.5" /> Voice
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="border-rose-500/60 text-rose-300"
                  onClick={stopRecording} data-testid="button-cohort-voice-stop">
                  <Square className="w-4 h-4 mr-1.5" /> Stop & send
                </Button>
              )}
              <Button size="sm" className="bg-[#C9941A] text-black hover:bg-[#C9941A]/90"
                disabled={!content.trim() || postMutation.isPending}
                onClick={() => postMutation.mutate({ content: content.trim() })}
                data-testid="button-cohort-post">
                <Send className="w-4 h-4 mr-1.5" /> Post
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feed */}
      <div className="space-y-2">
        {posts.length === 0 ? (
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardContent className="py-8 text-center text-gray-400 text-sm">
              No check-ins yet — be the first.
            </CardContent>
          </Card>
        ) : (
          posts.map((p) => (
            <Card key={p.id}
              className={`bg-[#1a1a1a] border-[#333] ${p.crisisFlag ? "border-rose-500/50" : ""}`}
              data-testid={`card-cohort-post-${p.id}`}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={p.authorAvatar || undefined} />
                    <AvatarFallback className="bg-[#C9941A]/20 text-[#C9941A] text-xs">
                      {(p.authorName || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-xs">
                    <span className="text-white font-medium">{p.authorName || "Survivor"}</span>
                    <span className="text-gray-500 ml-2">{new Date(p.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                {p.crisisFlag && (
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>If you're in crisis, call or text <strong>988</strong> (US) right now.</span>
                  </div>
                )}
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{p.content}</p>
                {p.audioUrl && <audio controls src={p.audioUrl} className="w-full mt-1" />}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
