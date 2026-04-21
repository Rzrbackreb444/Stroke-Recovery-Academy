import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Zap, Heart, Mail, Crown } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { VerifiedTherapistBadge } from "@/components/VerifiedTherapistBadge";

interface Gift {
  id: number;
  senderId: string | null;
  packageKey: string;
  points: number;
  message: string | null;
  isAnonymous: boolean;
  status: string;
  createdAt: string;
  readAt: string | null;
  senderFirstName?: string | null;
  senderLastName?: string | null;
  senderProfileImageUrl?: string | null;
  senderIsTherapist?: boolean | null;
  senderTherapistTitle?: string | null;
}

interface Supporter {
  senderId: string;
  totalPoints: number;
  giftCount: number;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  isTherapist?: boolean | null;
}

export default function PowerPointsInbox() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: received } = useQuery<{ gifts: Gift[] }>({
    queryKey: ["/api/power-points/received"],
  });
  const { data: totals } = useQuery<{ totalPoints: number; giftCount: number }>({
    queryKey: ["/api/power-points/totals", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await fetch(`/api/power-points/totals/${user!.id}`)).json(),
  });
  const { data: top } = useQuery<{ supporters: Supporter[] }>({
    queryKey: ["/api/power-points/top-supporters", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await fetch(`/api/power-points/top-supporters/${user!.id}`)).json(),
  });

  const marked = useRef<Set<number>>(new Set());
  const markRead = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/power-points/${id}/read`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/power-points/unread-count"] });
    },
  });

  // Auto-mark every visible gift as read — once per id, no refetch loop
  useEffect(() => {
    received?.gifts?.forEach((g) => {
      if (!g.readAt && !marked.current.has(g.id)) {
        marked.current.add(g.id);
        markRead.mutate(g.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [received?.gifts]);

  const gifts = received?.gifts || [];
  const supporters = top?.supporters || [];

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-[#C9941A]" />
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Your Power Points</h1>
          </div>
          <p className="text-gray-400 mt-2">Every point is fuel sent by someone who believes in your recovery.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Received" value={(totals?.totalPoints ?? 0).toLocaleString()} sub="Power Points" icon={<Zap className="w-5 h-5" />} />
          <StatCard label="Gifts Received" value={String(totals?.giftCount ?? 0)} sub="Acts of support" icon={<Heart className="w-5 h-5" />} />
          <StatCard label="Top Supporters" value={String(supporters.length)} sub="People in your corner" icon={<Crown className="w-5 h-5" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-xl font-semibold mb-2">Recent Encouragement</h2>
            {gifts.length === 0 ? (
              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="p-8 text-center">
                  <Mail className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No Power Points yet. When family or therapists send some, they'll show up here.</p>
                  <Button asChild className="mt-4 bg-[#C9941A] hover:bg-[#B8851A] text-black font-bold">
                    <Link href="/recovery/community">Find your community</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              gifts.map((g) => {
                const senderName = g.isAnonymous
                  ? "Anonymous supporter"
                  : `${g.senderFirstName || ""} ${g.senderLastName || ""}`.trim() || "A supporter";
                return (
                  <Card key={g.id} className="bg-[#1a1a1a] border-[#333]" data-testid={`gift-${g.id}`}>
                    <CardContent className="p-4 flex gap-3">
                      <Avatar className="w-12 h-12 border border-[#333]">
                        {!g.isAnonymous && <AvatarImage src={g.senderProfileImageUrl || ""} />}
                        <AvatarFallback className="bg-[#2a2a2a] text-[#C9941A]">{senderName[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">{senderName}</span>
                          {g.senderIsTherapist && !g.isAnonymous && (
                            <VerifiedTherapistBadge title={g.senderTherapistTitle || undefined} />
                          )}
                          <span className="ml-auto text-[#C9941A] font-bold">+{g.points.toLocaleString()} pts</span>
                        </div>
                        {g.message && <p className="mt-1 text-gray-300 italic">"{g.message}"</p>}
                        <p className="text-xs text-gray-500 mt-1">{new Date(g.createdAt).toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <aside>
            <h2 className="text-xl font-semibold mb-2">Top Supporters</h2>
            {supporters.length === 0 ? (
              <Card className="bg-[#1a1a1a] border-[#333]"><CardContent className="p-4 text-sm text-gray-400">No supporters yet.</CardContent></Card>
            ) : (
              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="p-4 space-y-3">
                  {supporters.map((s, i) => (
                    <div key={s.senderId} className="flex items-center gap-3" data-testid={`supporter-${s.senderId}`}>
                      <span className="w-5 text-center font-bold text-[#C9941A]">{i + 1}</span>
                      <Avatar className="w-8 h-8 border border-[#333]">
                        <AvatarImage src={s.profileImageUrl || ""} />
                        <AvatarFallback className="bg-[#2a2a2a] text-[#C9941A] text-xs">
                          {(s.firstName || "S")[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate flex items-center gap-1">
                          {`${s.firstName || ""} ${s.lastName || ""}`.trim() || "Supporter"}
                          {s.isTherapist && <VerifiedTherapistBadge size="sm" title={null} />}
                        </div>
                        <div className="text-xs text-gray-500">{s.totalPoints.toLocaleString()} pts · {s.giftCount} gifts</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </aside>
        </div>

        <p className="text-[11px] text-gray-600 mt-12 text-center">
          Power Points are fuel — they unlock therapist exercises, AI tools, and platform features. They are not redeemable for cash.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: React.ReactNode }) {
  return (
    <Card className="bg-[#1a1a1a] border-[#333]">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm text-gray-400 flex items-center gap-2 font-normal">
          <span className="text-[#C9941A]">{icon}</span> {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#C9941A]">{value}</div>
        <div className="text-xs text-gray-500">{sub}</div>
      </CardContent>
    </Card>
  );
}
