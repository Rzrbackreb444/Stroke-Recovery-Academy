import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useRoute, Link } from "wouter";
import RecoveryHeader from "@/components/RecoveryHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SEO from "@/components/SEO";
import {
  Flame, ChevronLeft, Send, Heart, Award, Calendar, Zap,
  Lock, AlertCircle,
} from "lucide-react";
import { useState } from "react";

type SupporterData = {
  survivor: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  streak: { current: number; longest: number; totalActive: number };
  today: { reps: number; date: string };
  last7Days: { date: string; reps: number }[];
  mySentEncouragements: { id: number; type: string; message: string | null; loop_date: string; created_at: string }[];
};

const ENC_TYPES = [
  { type: "flame", label: "Flame", icon: Flame, color: "#E2741B" },
  { type: "cheer", label: "Cheer!", icon: Zap, color: "#fbbf24" },
  { type: "message", label: "Message", icon: Send, color: "#60a5fa" },
];

function DayDot({ reps, date }: { reps: number; date: string }) {
  const d = new Date(date + "T00:00:00");
  const label = d.toLocaleDateString("en-US", { weekday: "short" });
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
        style={{
          backgroundColor: reps === 0 ? "#1a1a1a" : reps <= 2 ? "#7c3a0a" : "#E2741B",
          color: reps === 0 ? "#555" : "#fff",
          border: reps > 0 ? "1px solid #E2741B40" : "1px solid #333",
        }}
        title={`${date}: ${reps} rep${reps !== 1 ? "s" : ""}`}
      >
        {reps > 0 ? reps : "—"}
      </div>
      <span className="text-[9px] text-gray-600">{label}</span>
    </div>
  );
}

export default function SupporterView() {
  const [, params] = useRoute("/recovery/supporter/:survivorId");
  const survivorId = params?.survivorId ?? "";
  const { user } = useAuth();
  const { toast } = useToast();
  const [encType, setEncType] = useState("flame");
  const [encMessage, setEncMessage] = useState("");
  const [showMessageBox, setShowMessageBox] = useState(false);

  const { data, isLoading, error } = useQuery<SupporterData>({
    queryKey: ["/api/recovery/supporter", survivorId],
    queryFn: async () => {
      const r = await fetch(`/api/recovery/supporter/${survivorId}`, { credentials: "include" });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw Object.assign(new Error(err.message || "Error"), { status: r.status, data: err });
      }
      return r.json();
    },
    enabled: !!survivorId && !!user,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const r = await apiRequest("POST", "/api/recovery/encouragements", {
        toUserId: survivorId,
        loopDate: today,
        type: encType,
        message: encType === "message" ? encMessage.slice(0, 280) : undefined,
      });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Sent!", description: "Your encouragement is on its way." });
      setEncMessage("");
      setShowMessageBox(false);
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/supporter", survivorId] });
    },
    onError: (e: any) => {
      toast({ title: "Couldn't send", description: e?.message || "Try again", variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Sign in to view supporter data.</p>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayLogged = (data?.today?.reps ?? 0) > 0;
  const name = data?.survivor ? `${data.survivor.firstName || ""}${data.survivor.lastName ? " " + data.survivor.lastName : ""}`.trim() || "Survivor" : "...";

  const isSharingDisabled = (error as any)?.data?.sharingDisabled;
  const isNoLink = (error as any)?.status === 404;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoveryHeader />
      <SEO title="Supporter View | Stroke Recovery Academy" description="Support your survivor's daily recovery journey." />

      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/settings/caregivers">
            <Button variant="ghost" size="icon" className="text-gray-400" data-testid="button-back-caregivers">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Supporter View</h1>
            <p className="text-xs text-gray-500">Your survivor's recovery at a glance</p>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-xl bg-[#1a1a1a] animate-pulse" />)}
          </div>
        )}

        {!isLoading && isNoLink && (
          <Card className="bg-[#111] border-[#222] p-6 text-center">
            <AlertCircle className="h-8 w-8 text-gray-600 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">No active supporter link</p>
            <p className="text-xs text-gray-500 mb-4">Make sure the survivor has accepted your invite.</p>
            <Link href="/settings/caregivers">
              <Button size="sm" variant="outline" className="border-[#333] text-gray-300">Manage links</Button>
            </Link>
          </Card>
        )}

        {!isLoading && isSharingDisabled && (
          <Card className="bg-[#111] border-[#222] p-6 text-center">
            <Lock className="h-8 w-8 text-gray-600 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">Sharing not enabled</p>
            <p className="text-xs text-gray-500 mb-4">
              Ask your survivor to go to <strong className="text-gray-300">Settings › Goals &amp; Alerts</strong> and turn on
              <em className="text-[#E2741B]"> "Allow supporters to see my progress."</em>
            </p>
          </Card>
        )}

        {!isLoading && data && (
          <>
            {/* Survivor header */}
            <Card className="bg-[#111] border-[#222] p-5 mb-4 flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={data.survivor.avatarUrl || undefined} />
                <AvatarFallback className="bg-[#E2741B]/20 text-[#E2741B] text-xl font-bold">
                  {(data.survivor.firstName || "S")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-bold text-white">{name}</p>
                <p className="text-xs text-gray-500">Recovery in progress</p>
              </div>
              <div className="ml-auto text-right">
                <div className="flex items-center gap-1 justify-end">
                  <Flame className="h-5 w-5 text-[#E2741B]" />
                  <span className="text-2xl font-bold text-white">{data.streak.current}</span>
                </div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">day streak</p>
              </div>
            </Card>

            {/* Today's status */}
            <Card
              className={`border p-5 mb-4 ${
                todayLogged
                  ? "bg-[#0f1a0a] border-green-800/60"
                  : "bg-[#1a100a] border-[#E2741B]/30"
              }`}
              data-testid="card-today-status"
            >
              <div className="flex items-center gap-3">
                {todayLogged ? (
                  <>
                    <div className="h-10 w-10 rounded-full bg-green-900/60 flex items-center justify-center">
                      <span className="text-xl">✓</span>
                    </div>
                    <div>
                      <p className="font-semibold text-green-400">Reps logged today</p>
                      <p className="text-xs text-gray-500">{data.today.reps} rep{data.today.reps !== 1 ? "s" : ""} · {today}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-10 w-10 rounded-full bg-[#E2741B]/15 flex items-center justify-center">
                      <Flame className="h-5 w-5 text-[#E2741B]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#E2741B]">Not logged yet today</p>
                      <p className="text-xs text-gray-500">Send a nudge — one flame can light the day</p>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* 7-day calendar */}
            <Card className="bg-[#111] border-[#222] p-5 mb-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-3">This week</p>
              <div className="flex justify-between gap-1">
                {data.last7Days.map(d => <DayDot key={d.date} reps={d.reps} date={d.date} />)}
              </div>
              <div className="flex justify-between text-[10px] text-gray-600 mt-3">
                <span>Longest: <span className="text-gray-400">{data.streak.longest} days</span></span>
                <span>All-time active: <span className="text-gray-400">{data.streak.totalActive} days</span></span>
              </div>
            </Card>

            {/* Send encouragement */}
            <Card className="bg-[#111] border-[#222] p-5 mb-4">
              <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Heart className="h-4 w-4 text-[#E2741B]" />
                Send encouragement
              </p>
              <div className="flex gap-2 mb-3 flex-wrap">
                {ENC_TYPES.map(({ type, label, icon: Icon, color }) => (
                  <button
                    key={type}
                    data-testid={`button-enc-type-${type}`}
                    onClick={() => {
                      setEncType(type);
                      setShowMessageBox(type === "message");
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      encType === type
                        ? "border-transparent text-black"
                        : "border-[#333] text-gray-400 hover:text-white"
                    }`}
                    style={encType === type ? { backgroundColor: color } : {}}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {showMessageBox && (
                <textarea
                  data-testid="input-enc-message"
                  value={encMessage}
                  onChange={e => setEncMessage(e.target.value.slice(0, 280))}
                  placeholder="Write something heartfelt (280 chars)…"
                  rows={2}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg p-3 text-sm text-white placeholder-gray-600 resize-none mb-3 focus:outline-none focus:border-[#E2741B]/50"
                />
              )}

              <Button
                onClick={() => sendMutation.mutate()}
                disabled={sendMutation.isPending || (encType === "message" && !encMessage.trim())}
                className="w-full bg-[#E2741B] text-black font-bold gap-2"
                data-testid="button-send-encouragement"
              >
                {sendMutation.isPending ? "Sending…" : (
                  <>
                    <Flame className="h-4 w-4" />
                    Send {ENC_TYPES.find(t => t.type === encType)?.label}
                  </>
                )}
              </Button>
            </Card>

            {/* Recent sent */}
            {data.mySentEncouragements.length > 0 && (
              <Card className="bg-[#111] border-[#222] p-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-3">Recently sent</p>
                <div className="space-y-2">
                  {data.mySentEncouragements.slice(0, 5).map(e => (
                    <div key={e.id} className="flex items-start gap-2 text-xs">
                      <span className="text-[#E2741B] mt-0.5">
                        {e.type === "flame" ? "🔥" : e.type === "cheer" ? "⚡" : "💬"}
                      </span>
                      <div>
                        <span className="text-gray-300">{e.message || e.type}</span>
                        <span className="text-gray-600 ml-2">{e.loop_date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
