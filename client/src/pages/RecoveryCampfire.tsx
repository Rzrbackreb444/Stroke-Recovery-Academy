import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import { Flame, Send, ArrowLeft, Clock, Users, Lock } from "lucide-react";

type Room = {
  id: string;
  name: string;
  blurb: string;
  emoji: string;
  schedule: string;
  isOpen: boolean;
  nextOpenAt: string;
  recent24h: number;
  isPremiumOnly?: boolean;
};

type PremiumStatus = { active: boolean };

type Message = {
  id: number;
  roomId: string;
  userId: string;
  body: string;
  createdAt: string;
  firstName: string;
  avatarUrl: string | null;
};

function formatTimeUntil(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "now";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `in ${hrs}h`;
  return `in ${Math.round(hrs / 24)}d`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function RecoveryCampfire() {
  const { isAuthenticated } = useAuth();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const { data: roomsData, isLoading } = useQuery<{ rooms: Room[] }>({
    queryKey: ["/api/campfire/rooms"],
    refetchInterval: 60_000,
  });

  const { data: premiumStatus } = useQuery<PremiumStatus>({
    queryKey: ["/api/sasquatch-premium/status"],
    enabled: isAuthenticated,
  });
  const isPremium = !!premiumStatus?.active;

  const rooms = roomsData?.rooms ?? [];
  const activeRoom = rooms.find((r) => r.id === activeRoomId);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <RecoverySEO
        title="Campfire — Live Survivor Circles | Stroke Recovery Academy"
        description="Scheduled live group chat for stroke survivors. Morning circle, aphasia circle, caregiver circle, late-night room. Real people. Real time."
        canonical="/recovery/campfire"
      />
      <RecoveryHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!activeRoom ? (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Flame className="w-8 h-8" style={{ color: "#E2741B" }} />
                <h1 className="text-4xl md:text-5xl font-black" data-testid="text-campfire-title">
                  The Campfire
                </h1>
              </div>
              <p className="text-stone-400 text-lg max-w-2xl">
                Live circles, scheduled times. Pull up a log, warm your hands,
                tell the tribe how you're doing. No forum noise — just real
                survivors at the same fire.
              </p>
            </div>

            {isLoading ? (
              <div className="text-stone-500" data-testid="status-rooms-loading">
                Loading circles...
              </div>
            ) : (
              <>
              {!isPremium && rooms.some((r) => r.isPremiumOnly) && (
                <a
                  href="/recovery/premium"
                  className="block mb-4 rounded-md border border-amber-700/50 bg-gradient-to-r from-amber-900/30 to-stone-900 px-5 py-4 hover-elevate transition-colors"
                  data-testid="banner-campfire-upsell"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-amber-100">
                          Coach Circle + Live with Nick — Premium fires
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Smaller rooms, deeper conversations. $19/mo. Cancel anytime.
                        </p>
                      </div>
                    </div>
                    <span className="text-amber-300 font-bold whitespace-nowrap text-sm">Unlock →</span>
                  </div>
                </a>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                {rooms.map((room) => {
                  const locked = !!room.isPremiumOnly && !isPremium;
                  return (
                  <Card
                    key={room.id}
                    className="p-5 bg-stone-900 border-stone-800 hover-elevate cursor-pointer"
                    onClick={() => {
                      if (locked) {
                        window.location.href = "/recovery/premium";
                      } else {
                        setActiveRoomId(room.id);
                      }
                    }}
                    data-testid={`card-room-${room.id}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{room.emoji}</div>
                        <div>
                          <h3 className="text-lg font-bold text-stone-100">
                            {room.name}
                          </h3>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {room.schedule}
                          </p>
                        </div>
                      </div>
                      {locked ? (
                        <Badge
                          className="bg-amber-900/40 text-amber-300 border border-amber-700/40"
                          data-testid={`badge-locked-${room.id}`}
                        >
                          <Lock className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      ) : room.isOpen ? (
                        <Badge
                          className="bg-amber-600 text-white"
                          data-testid={`badge-open-${room.id}`}
                        >
                          <Flame className="w-3 h-3 mr-1" />
                          Open now
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-stone-400 border-stone-700">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeUntil(room.nextOpenAt)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-stone-400 mb-3">{room.blurb}</p>
                    <div className="flex items-center gap-1 text-xs text-stone-500">
                      <Users className="w-3 h-3" />
                      {room.recent24h} message{room.recent24h === 1 ? "" : "s"} in last 24h
                    </div>
                  </Card>
                  );
                })}
              </div>
              </>
            )}
          </>
        ) : (
          <RoomView
            room={activeRoom}
            isAuthenticated={isAuthenticated}
            onBack={() => setActiveRoomId(null)}
          />
        )}
      </main>
    </div>
  );
}

function RoomView({
  room,
  isAuthenticated,
  onBack,
}: {
  room: Room;
  isAuthenticated: boolean;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: msgData } = useQuery<{ messages: Message[] }>({
    queryKey: ["/api/campfire/rooms", room.id, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/campfire/rooms/${room.id}/messages`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
    refetchInterval: room.isOpen ? 5_000 : 30_000,
    enabled: isAuthenticated,
  });

  const messages = msgData?.messages ?? [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const postMutation = useMutation({
    mutationFn: async (body: string) => {
      return await apiRequest("POST", `/api/campfire/rooms/${room.id}/messages`, {
        body,
      });
    },
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({
        queryKey: ["/api/campfire/rooms", room.id, "messages"],
      });
    },
    onError: (err: any) => {
      // apiRequest throws Error("<status>: <body>") where body is JSON.
      // Pull out the human message so survivors don't see raw `403:{"error":"..."}`.
      let description = "Try again in a moment.";
      const raw = String(err?.message ?? "");
      const match = raw.match(/^\d+:\s*(.*)$/s);
      const tail = match ? match[1] : raw;
      try {
        const parsed = JSON.parse(tail);
        if (parsed && typeof parsed.error === "string") description = parsed.error;
      } catch {
        if (tail) description = tail;
      }
      toast({
        title: "Couldn't send",
        description,
        variant: "destructive",
      });
    },
  });

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed || postMutation.isPending) return;
    postMutation.mutate(trimmed);
  }

  return (
    <div data-testid={`view-room-${room.id}`}>
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 text-stone-400"
        data-testid="button-back-rooms"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        All circles
      </Button>

      <Card className="p-5 bg-stone-900 border-stone-800 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{room.emoji}</div>
            <div>
              <h2 className="text-2xl font-bold">{room.name}</h2>
              <p className="text-xs text-stone-500">{room.schedule}</p>
            </div>
          </div>
          {room.isOpen ? (
            <Badge className="bg-amber-600 text-white">
              <Flame className="w-3 h-3 mr-1" />
              Open now
            </Badge>
          ) : (
            <Badge variant="outline" className="text-stone-400 border-stone-700">
              Opens {formatTimeUntil(room.nextOpenAt)}
            </Badge>
          )}
        </div>
      </Card>

      {!isAuthenticated ? (
        <Card className="p-6 bg-stone-900 border-stone-800 text-center">
          <p className="text-stone-300 mb-4">
            Sign in to join the circle.
          </p>
          <Link href="/auth">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              Sign in
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className="bg-stone-900 border-stone-800 flex flex-col" style={{ height: "60vh" }}>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
            data-testid="container-messages"
          >
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-stone-500 text-sm">
                {room.isOpen
                  ? "Be the first to say hi."
                  : "Quiet at the fire. Come back when it opens."}
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="flex gap-3" data-testid={`message-${m.id}`}>
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt={m.firstName} />}
                    <AvatarFallback className="bg-amber-900 text-amber-100 text-xs">
                      {m.firstName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm text-stone-200">
                        {m.firstName}
                      </span>
                      <span className="text-xs text-stone-500">
                        {formatTime(m.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-stone-300 whitespace-pre-wrap break-words">
                      {m.body}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {room.isOpen ? (
            <div className="border-t border-stone-800 p-3 flex gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Say something to the circle..."
                rows={1}
                maxLength={1000}
                className="resize-none bg-stone-950 border-stone-800 min-h-10"
                data-testid="input-message"
              />
              <Button
                onClick={handleSend}
                disabled={!draft.trim() || postMutation.isPending}
                size="icon"
                className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0"
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="border-t border-stone-800 p-3 text-center text-sm text-stone-500">
              Circle is closed. Opens {formatTimeUntil(room.nextOpenAt)}.
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
