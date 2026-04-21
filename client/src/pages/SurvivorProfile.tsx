import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Zap, Flame, Heart, Share2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import SendPowerPointsModal from "@/components/SendPowerPointsModal";
import { VerifiedTherapistBadge } from "@/components/VerifiedTherapistBadge";
import DailyGiftButton from "@/components/DailyGiftButton";

interface SurvivorProfile {
  id: string;
  displayName: string;
  profileImageUrl: string | null;
  slug: string;
  acceptsPowerPoints: boolean;
  isVerifiedTherapist: boolean;
  therapistTitle: string | null;
  persona_name: string | null;
  persona_creed: string | null;
  persona_accent_color: string | null;
  currentStreak: number;
  totalPoints: number;
  giftCount: number;
}

export default function SurvivorProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [giftOpen, setGiftOpen] = useState(false);

  const { data, isLoading, error } = useQuery<{ profile: SurvivorProfile }>({
    queryKey: ["/api/survivors", slug],
    queryFn: async () => {
      const r = await fetch(`/api/survivors/${slug}`);
      if (!r.ok) throw new Error("Not found");
      return r.json();
    },
  });

  if (isLoading) {
    return <div className="min-h-screen bg-[#0D0D0D] text-gray-400 flex items-center justify-center">Loading…</div>;
  }
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
        <Card className="bg-[#1a1a1a] border-[#333] max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-bold mb-2">Profile not found</h1>
            <p className="text-gray-400 mb-4">This survivor's profile link may have changed.</p>
            <Button asChild variant="outline" className="border-[#333]">
              <Link href="/recovery/community"><ArrowLeft className="w-4 h-4 mr-2" /> Back to community</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const p = data.profile;
  const isSelf = user?.id === p.id;
  const displayName = p.persona_name || p.displayName;
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: `Send Power to ${displayName}`, url });
      else { await navigator.clipboard.writeText(url); toast({ title: "Link copied" }); }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Card className="bg-[#1a1a1a] border-[#333] overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-[#C9941A]/40 via-[#1a1a1a] to-[#0D0D0D]" />
          <CardContent className="p-6 -mt-12">
            <div className="flex items-end gap-4">
              <Avatar className="w-24 h-24 border-4 border-[#1a1a1a] bg-[#2a2a2a]">
                <AvatarImage src={p.profileImageUrl || ""} />
                <AvatarFallback className="bg-[#2a2a2a] text-[#C9941A] text-2xl">{displayName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1
                    className="text-2xl font-bold truncate"
                    style={{ color: p.persona_name && p.persona_accent_color ? p.persona_accent_color : "#FFFFFF" }}
                    data-testid="text-survivor-name"
                  >
                    {displayName}
                  </h1>
                  {p.isVerifiedTherapist && <VerifiedTherapistBadge title={p.therapistTitle || undefined} />}
                </div>
                {p.persona_creed && (
                  <p className="text-sm italic text-gray-400 mt-1 line-clamp-2">"{p.persona_creed}"</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <StatBlock icon={<Zap className="w-4 h-4" />} label="Power Received" value={p.totalPoints.toLocaleString()} />
              <StatBlock icon={<Heart className="w-4 h-4" />} label="Gifts" value={p.giftCount.toLocaleString()} />
              <StatBlock icon={<Flame className="w-4 h-4" />} label="Streak" value={`${p.currentStreak}d`} />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              {p.acceptsPowerPoints && !isSelf && (
                <Button
                  onClick={() => { if (!user) { window.location.href = "/api/login"; return; } setGiftOpen(true); }}
                  className="flex-1 bg-[#C9941A] hover:bg-[#B8851A] text-black font-bold"
                  data-testid="button-send-power"
                >
                  <Zap className="w-4 h-4 mr-2" /> Send Power Points
                </Button>
              )}
              {!p.acceptsPowerPoints && !isSelf && (
                <div className="flex-1 text-center text-sm text-gray-500 py-2 rounded-md border border-[#333]">
                  This survivor isn't accepting Power Points right now.
                </div>
              )}
              <Button variant="outline" className="border-[#333]" onClick={handleShare} data-testid="button-share">
                <Share2 className="w-4 h-4 mr-2" /> Share profile
              </Button>
            </div>

            {p.acceptsPowerPoints && !isSelf && user && (
              <div className="mt-3">
                <DailyGiftButton receiverId={p.id} receiverName={displayName} size="default" className="w-full" />
              </div>
            )}

            <p className="text-[11px] text-gray-500 mt-6 leading-snug text-center">
              Power Points fund this survivor's access to therapist courses, AI tools, and exercises. Points are not redeemable for cash.
            </p>
          </CardContent>
        </Card>
      </div>

      <SendPowerPointsModal
        open={giftOpen}
        onOpenChange={setGiftOpen}
        receiverId={p.id}
        receiverName={displayName}
        receiverAvatarUrl={p.profileImageUrl}
      />
    </div>
  );
}

function StatBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#333] bg-[#0D0D0D] p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-[#C9941A] mb-1">{icon}<span className="text-xs uppercase tracking-wide">{label}</span></div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}
