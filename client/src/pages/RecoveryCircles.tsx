import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Calendar, Clock, Users, Video, Plus, ExternalLink,
  Stethoscope, ShieldCheck, Loader2, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RecoveryHeader from "@/components/RecoveryHeader";

interface CircleEvent {
  id: number;
  title: string;
  description: string | null;
  host_id: string;
  session_type: string;
  scheduled_at: string;
  duration: number | null;
  max_participants: number | null;
  meeting_url: string | null;
  room_id: string | null;
  status: string;
  host_first_name: string | null;
  host_last_name: string | null;
  host_avatar: string | null;
  host_is_therapist: boolean;
  rsvp_count: number;
}

function fmtWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}
function minutesUntil(iso: string) {
  return Math.floor((new Date(iso).getTime() - Date.now()) / 60000);
}

export default function RecoveryCircles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", date: "", time: "",
    durationMin: 60, maxParticipants: 50, meetingUrl: "",
  });

  const { data: events = [], isLoading } = useQuery<CircleEvent[]>({
    queryKey: ["/api/circles/upcoming"],
    queryFn: async () => (await fetch("/api/circles/upcoming")).json(),
  });

  const { data: canHostData } = useQuery<{ canHost: boolean }>({
    queryKey: ["/api/circles/can-host"],
    enabled: !!user,
  });
  const canHost = !!canHostData?.canHost;

  const create = useMutation({
    mutationFn: async () => {
      if (!form.title || !form.date || !form.time) throw new Error("Title, date and time are required");
      const scheduledAt = new Date(`${form.date}T${form.time}:00`).toISOString();
      const res = await apiRequest("POST", "/api/circles", {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        scheduledAt,
        durationMin: Number(form.durationMin),
        maxParticipants: Number(form.maxParticipants),
        meetingUrl: form.meetingUrl.trim() || undefined,
        sessionType: "group_class",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Circle scheduled", description: "Survivors can now RSVP." });
      queryClient.invalidateQueries({ queryKey: ["/api/circles/upcoming"] });
      setOpen(false);
      setForm({ title: "", description: "", date: "", time: "", durationMin: 60, maxParticipants: 50, meetingUrl: "" });
    },
    onError: (e: any) => toast({ title: "Could not create circle", description: e.message, variant: "destructive" }),
  });

  const rsvp = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/circles/${id}/rsvp`, {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: data.rsvped ? "You're in" : "RSVP removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/circles/upcoming"] });
    },
    onError: (e: any) => toast({ title: "Could not update RSVP", description: e.message, variant: "destructive" }),
  });

  const featured = events[0];
  const rest = events.slice(1);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoveryHeader />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Heading */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <Video className="w-7 h-7 text-[#C9941A]" /> Live Circles
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Weekly community calls with therapists and survivors. Free. Show up as you are.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            {canHost && (
              <DialogTrigger asChild>
                <Button className="bg-[#C9941A] text-black hover:bg-[#C9941A]/90" data-testid="button-host-circle">
                  <Plus className="w-4 h-4 mr-2" /> Host a circle
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white">Schedule a circle</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400">Title</label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Tuesday Night Survivors Circle"
                    className="bg-[#0D0D0D] border-[#333]" data-testid="input-title" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Description</label>
                  <Textarea value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="What this circle is about, who it's for, what to expect."
                    className="bg-[#0D0D0D] border-[#333] resize-none" rows={3}
                    data-testid="input-description" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400">Date</label>
                    <Input type="date" value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="bg-[#0D0D0D] border-[#333]" data-testid="input-date" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Time</label>
                    <Input type="time" value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      className="bg-[#0D0D0D] border-[#333]" data-testid="input-time" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400">Duration (min)</label>
                    <Input type="number" min={15} max={240} value={form.durationMin}
                      onChange={(e) => setForm({ ...form, durationMin: +e.target.value })}
                      className="bg-[#0D0D0D] border-[#333]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Max attendees</label>
                    <Input type="number" min={2} max={500} value={form.maxParticipants}
                      onChange={(e) => setForm({ ...form, maxParticipants: +e.target.value })}
                      className="bg-[#0D0D0D] border-[#333]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Meeting URL (Zoom, Meet, Daily, etc.)</label>
                  <Input value={form.meetingUrl}
                    onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                    placeholder="https://…"
                    className="bg-[#0D0D0D] border-[#333] font-mono text-sm" data-testid="input-meeting-url" />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Required unless the platform is configured to auto-create rooms.
                  </p>
                </div>
                <Button onClick={() => create.mutate()} disabled={create.isPending}
                  className="w-full bg-[#C9941A] text-black hover:bg-[#C9941A]/90"
                  data-testid="button-submit-circle">
                  {create.isPending ? "Scheduling…" : "Schedule circle"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Disclaimer */}
        <div className="rounded-md border border-[#333] bg-[#1a1a1a] px-4 py-3 text-xs text-gray-400">
          Live Circles are peer support — not a substitute for medical care. In a crisis, call or text 988.
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          </div>
        ) : events.length === 0 ? (
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardContent className="py-12 text-center space-y-3">
              <Calendar className="w-12 h-12 text-[#C9941A] mx-auto" />
              <h2 className="text-xl font-semibold">No circles scheduled</h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Verified therapists and admins can host the first circle. Survivors will see it here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {featured && <FeaturedCircle event={featured} onRsvp={() => rsvp.mutate(featured.id)} />}
            {rest.length > 0 && (
              <div>
                <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-3">More upcoming</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {rest.map((e) => (
                    <CircleCard key={e.id} event={e} onRsvp={() => rsvp.mutate(e.id)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function HostBlock({ event }: { event: CircleEvent }) {
  const initials = `${event.host_first_name?.[0] || ""}${event.host_last_name?.[0] || ""}`;
  return (
    <div className="flex items-center gap-2">
      <Avatar className="w-7 h-7">
        <AvatarImage src={event.host_avatar || undefined} />
        <AvatarFallback className="bg-zinc-700 text-[#C9941A] text-xs">{initials || "?"}</AvatarFallback>
      </Avatar>
      <span className="text-sm text-gray-300">
        {event.host_first_name || "Host"} {event.host_last_name?.[0] || ""}
      </span>
      {event.host_is_therapist && (
        <Badge className="gap-1 bg-[#C9941A]/15 text-[#C9941A] border-0 text-[10px]">
          <Stethoscope className="w-3 h-3" /> Therapist
        </Badge>
      )}
    </div>
  );
}

function JoinButton({ event }: { event: CircleEvent }) {
  const mins = minutesUntil(event.scheduled_at);
  const live = mins <= 0 && mins > -(event.duration ?? 60);
  const soon = mins > 0 && mins <= 15;
  if (!live && !soon) return null;
  return (
    <a href={event.meeting_url || "#"} target="_blank" rel="noopener noreferrer">
      <Button className="bg-emerald-600 text-white hover:bg-emerald-600/90"
        data-testid={`button-join-${event.id}`}>
        <Video className="w-4 h-4 mr-1" /> {live ? "Join live" : "Join in 15m"}
        <ExternalLink className="w-3 h-3 ml-1" />
      </Button>
    </a>
  );
}

function FeaturedCircle({ event, onRsvp }: { event: CircleEvent; onRsvp: () => void }) {
  const mins = minutesUntil(event.scheduled_at);
  const live = mins <= 0 && mins > -(event.duration ?? 60);
  return (
    <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0D0D0D] border-[#C9941A]/40">
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2 flex-1 min-w-[260px]">
            <div className="flex items-center gap-2">
              {live ? (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-0 gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live now
                </Badge>
              ) : (
                <Badge className="bg-[#C9941A]/15 text-[#C9941A] border-0">Next up</Badge>
              )}
              <span className="text-xs text-gray-400 inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> {fmtWhen(event.scheduled_at)}
                {event.duration ? ` · ${event.duration}m` : ""}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">{event.title}</h2>
            {event.description && (
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{event.description}</p>
            )}
            <HostBlock event={event} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="gap-1 bg-zinc-700/60 text-gray-200 border-0">
              <Users className="w-3 h-3" /> {event.rsvp_count}{event.max_participants ? ` / ${event.max_participants}` : ""}
            </Badge>
            <JoinButton event={event} />
            <Button onClick={onRsvp} variant="outline"
              className="border-[#C9941A]/40 text-[#C9941A] hover:bg-[#C9941A]/10"
              data-testid={`button-rsvp-${event.id}`}>
              <ShieldCheck className="w-4 h-4 mr-1" /> RSVP
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CircleCard({ event, onRsvp }: { event: CircleEvent; onRsvp: () => void }) {
  return (
    <Card className="bg-[#1a1a1a] border-[#333]">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-base">{event.title}</CardTitle>
        <div className="text-xs text-gray-400 inline-flex items-center gap-1">
          <Clock className="w-3 h-3" /> {fmtWhen(event.scheduled_at)}
          {event.duration ? ` · ${event.duration}m` : ""}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {event.description && (
          <p className="text-sm text-gray-300 line-clamp-2">{event.description}</p>
        )}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <HostBlock event={event} />
          <Badge className="gap-1 bg-zinc-700/60 text-gray-200 border-0">
            <Users className="w-3 h-3" /> {event.rsvp_count}{event.max_participants ? ` / ${event.max_participants}` : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <JoinButton event={event} />
          <Button onClick={onRsvp} size="sm" variant="outline"
            className="border-[#C9941A]/40 text-[#C9941A] hover:bg-[#C9941A]/10"
            data-testid={`button-rsvp-${event.id}`}>
            <ShieldCheck className="w-3 h-3 mr-1" /> RSVP
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
