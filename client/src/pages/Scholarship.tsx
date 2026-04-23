import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Heart, GraduationCap, Sparkles, Users, Loader2, Gift, ArrowRight,
  CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import RecoveryHeader from "@/components/RecoveryHeader";

interface FundStatus {
  fund: { balancePoints: number; totalFunded: number; totalGranted: number; totalDonors: number };
  recentGrants: Array<{
    id: number; granted_at: string; points_granted: number;
    course_id: number; course_title: string; course_slug: string; first_name: string | null;
  }>;
}
interface MyEligibility {
  eligible: boolean;
  daysLeft: number;
  nextEligibleAt: string;
  grants: Array<{ id: number; courseId: number; pointsGranted: number; grantedAt: string; reason: string | null }>;
  pendingRequest: { id: number; story: string | null; createdAt: string } | null;
}

export default function Scholarship() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [story, setStory] = useState("");
  const [contribAmount, setContribAmount] = useState(100);
  const [contribAnon, setContribAnon] = useState(false);
  const [contribMsg, setContribMsg] = useState("");

  const status = useQuery<FundStatus>({ queryKey: ["/api/scholarship/status"] });
  const me = useQuery<MyEligibility>({
    queryKey: ["/api/scholarship/me"],
    enabled: isAuthenticated,
  });

  const requestM = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/scholarship/request", { story: story.trim() || undefined });
      return r.json();
    },
    onSuccess: (data: any) => {
      if (data.status === "granted") {
        toast({
          title: "Scholarship granted",
          description: `You've been gifted "${data.course.title}". Open it from the dashboard.`,
        });
      } else {
        toast({
          title: "Request queued",
          description: data.reason ?? "We'll notify you when funds are available.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/scholarship/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scholarship/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/course-unlocks"] });
      setStory("");
    },
    onError: async (err: any) => {
      const msg = err?.message?.includes("{") ? JSON.parse(err.message.split(":").slice(1).join(":")) : null;
      toast({
        title: "Couldn't process request",
        description: msg?.error || err?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const contribM = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/scholarship/contribute", {
        points: contribAmount,
        message: contribMsg.trim() || undefined,
        isAnonymous: contribAnon,
      });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Thank you", description: "Your Power Points are now in the scholarship fund." });
      queryClient.invalidateQueries({ queryKey: ["/api/scholarship/status"] });
      setContribMsg("");
    },
    onError: (err: any) => {
      toast({ title: "Contribution failed", description: err?.message || "Try again", variant: "destructive" });
    },
  });

  const fund = status.data?.fund;
  const fundProgress = fund ? Math.min(100, Math.round((fund.balancePoints / 5000) * 100)) : 0;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoveryHeader />
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <GraduationCap className="w-8 h-8 text-[#C9941A]" />
            <h1 className="text-3xl font-bold">Survivor Scholarship</h1>
          </div>
          <p className="text-gray-400 max-w-2xl">
            Recovery shouldn't depend on a wallet. Donors fund the pool — survivors who can't afford
            a course request a scholarship and get one of our top-rated courses, instructor paid in full.
          </p>
        </header>

        {/* Fund snapshot */}
        <Card className="bg-[#1a1a1a] border-[#333] mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#C9941A]" /> Fund Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status.isLoading || !fund ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            ) : (
              <div className="grid sm:grid-cols-4 gap-4 text-center">
                <Stat label="Pool balance" value={fund.balancePoints.toLocaleString()} suffix="pts"
                      testId="stat-balance" />
                <Stat label="Lifetime funded" value={fund.totalFunded.toLocaleString()} suffix="pts"
                      testId="stat-funded" />
                <Stat label="Lifetime granted" value={fund.totalGranted.toLocaleString()} suffix="pts"
                      testId="stat-granted" />
                <Stat label="Donors" value={fund.totalDonors.toLocaleString()} testId="stat-donors" />
              </div>
            )}
            {fund && (
              <div className="mt-5">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Toward next 5,000 pt scholarship pool</span>
                  <span>{fundProgress}%</span>
                </div>
                <Progress value={fundProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Request a scholarship */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C9941A]" /> Request a Scholarship
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isAuthenticated && !authLoading && (
                <div className="text-sm text-gray-400">
                  <Link href="/auth" className="text-[#C9941A] underline">Sign in</Link> to request.
                </div>
              )}
              {isAuthenticated && me.data?.pendingRequest && (
                <div className="rounded-md bg-[#0D0D0D] border border-[#333] p-3 flex items-start gap-2 text-sm">
                  <Clock className="w-4 h-4 text-[#C9941A] mt-0.5" />
                  <div>
                    <div className="font-medium">Your request is in review</div>
                    <div className="text-gray-500 text-xs">
                      Submitted {new Date(me.data.pendingRequest.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
              {isAuthenticated && me.data && !me.data.eligible && (
                <div className="rounded-md bg-[#0D0D0D] border border-[#333] p-3 flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-[#C9941A] mt-0.5" />
                  <div>
                    <div className="font-medium">Cooldown active</div>
                    <div className="text-gray-500 text-xs">
                      You can request another scholarship in {me.data.daysLeft} day{me.data.daysLeft === 1 ? "" : "s"}.
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Your story (optional)</label>
                <Textarea
                  data-testid="input-scholarship-story"
                  value={story}
                  onChange={e => setStory(e.target.value)}
                  placeholder="Tell us about your recovery and what you'd want to learn..."
                  className="bg-[#0D0D0D] border-[#333] text-white min-h-[120px]"
                  maxLength={2000}
                />
                <div className="text-xs text-gray-600 mt-1 text-right">{story.length} / 2000</div>
              </div>

              <Button
                data-testid="button-request-scholarship"
                onClick={() => requestM.mutate()}
                disabled={!isAuthenticated || requestM.isPending || !!me.data?.pendingRequest || (me.data && !me.data.eligible)}
                className="w-full bg-[#C9941A] hover:bg-[#b08217] text-black font-semibold"
              >
                {requestM.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Gift className="w-4 h-4 mr-2" />}
                Request Scholarship
              </Button>

              {me.data?.grants && me.data.grants.length > 0 && (
                <div className="pt-3 border-t border-[#333]">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Your past scholarships</div>
                  <ul className="space-y-1.5">
                    {me.data.grants.slice(0, 5).map(g => (
                      <li key={g.id} className="text-sm flex items-center gap-2" data-testid={`my-grant-${g.id}`}>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C9941A]" />
                        <span>{g.pointsGranted.toLocaleString()} pts · {new Date(g.grantedAt).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contribute */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#C9941A]" /> Fund a Survivor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-400">
                Donate Power Points from your wallet. 100% of your donation goes to the pool.
              </p>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Amount (Power Points)</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[100, 500, 1000, 5000].map(v => (
                    <Button
                      key={v}
                      data-testid={`button-quick-${v}`}
                      type="button"
                      variant="outline"
                      onClick={() => setContribAmount(v)}
                      className={contribAmount === v
                        ? "border-[#C9941A] text-[#C9941A]"
                        : "border-[#333] text-gray-400"}
                    >
                      {v}
                    </Button>
                  ))}
                </div>
                <Input
                  data-testid="input-contrib-amount"
                  type="number"
                  min={25}
                  max={50000}
                  value={contribAmount}
                  onChange={e => setContribAmount(parseInt(e.target.value) || 0)}
                  className="bg-[#0D0D0D] border-[#333] text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Message (optional)</label>
                <Textarea
                  data-testid="input-contrib-message"
                  value={contribMsg}
                  onChange={e => setContribMsg(e.target.value)}
                  placeholder="Words of encouragement for the recipient..."
                  className="bg-[#0D0D0D] border-[#333] text-white min-h-[80px]"
                  maxLength={500}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-[#333] bg-[#0D0D0D] p-3">
                <div className="text-sm">
                  <div className="font-medium text-white">Donate anonymously</div>
                  <div className="text-xs text-gray-500">Hide your name from public stats</div>
                </div>
                <Switch
                  data-testid="switch-anonymous"
                  checked={contribAnon}
                  onCheckedChange={setContribAnon}
                />
              </div>
              <Button
                data-testid="button-contribute"
                onClick={() => contribM.mutate()}
                disabled={!isAuthenticated || contribM.isPending || contribAmount < 25}
                className="w-full bg-[#C9941A] hover:bg-[#b08217] text-black font-semibold"
              >
                {contribM.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Gift className="w-4 h-4 mr-2" />}
                Donate {contribAmount.toLocaleString()} pts
              </Button>
              {!isAuthenticated && (
                <div className="text-xs text-gray-500 text-center">
                  <Link href="/auth" className="text-[#C9941A] underline">Sign in</Link> to donate.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent grants */}
        <Card className="bg-[#1a1a1a] border-[#333] mt-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#C9941A]" /> Recent Scholarships Awarded
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!status.data?.recentGrants?.length ? (
              <div className="text-sm text-gray-500 text-center py-6">
                No scholarships awarded yet — be the first donor.
              </div>
            ) : (
              <ul className="divide-y divide-[#333]">
                {status.data.recentGrants.map(g => (
                  <li key={g.id} className="py-3 flex items-center justify-between" data-testid={`grant-row-${g.id}`}>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-[#C9941A] text-black">{g.points_granted.toLocaleString()} pts</Badge>
                      <div>
                        <div className="text-sm text-white font-medium">{g.course_title}</div>
                        <div className="text-xs text-gray-500">
                          Awarded to {g.first_name || "a survivor"} · {new Date(g.granted_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Link href={`/recovery/courses/${g.course_slug}`}>
                      <Button size="sm" variant="ghost" className="text-[#C9941A]">
                        View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, suffix, testId }: { label: string; value: string; suffix?: string; testId: string }) {
  return (
    <div className="rounded-md bg-[#0D0D0D] border border-[#333] p-4" data-testid={testId}>
      <div className="text-2xl font-bold text-[#C9941A]">{value}<span className="text-sm text-gray-500 ml-1">{suffix}</span></div>
      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}
