import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users, HeartHandshake, MessageCircle, X, Search, Loader2, CheckCircle2, Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RecoveryHeader from "@/components/RecoveryHeader";

interface BuddyProfile {
  userId: string;
  optedIn: boolean;
  routineLevel: number;
  interests: string[];
  bio: string | null;
  status: string;
  pairedAt: string | null;
}
interface MePair {
  pair: { id: number; pairedAt: string };
  partner: { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null };
  partnerProfile: BuddyProfile | null;
}

const LEVELS = [
  { v: 0, label: "Survival" },
  { v: 1, label: "Stabilizing" },
  { v: 2, label: "Rebuilding" },
  { v: 3, label: "Rising" },
  { v: 4, label: "Full Power" },
];

const SUGGESTED = [
  "speech", "mobility", "fitness", "nutrition", "meditation", "faith",
  "writing", "music", "art", "caregiving", "humor", "outdoors",
];

export default function RecoveryBuddy() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [optedIn, setOptedIn] = useState(false);
  const [level, setLevel] = useState(2);
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");
  const [bio, setBio] = useState("");

  const { data: profile, isLoading: profileLoading } = useQuery<BuddyProfile | null>({
    queryKey: ["/api/buddy/profile"],
    enabled: !!user,
  });
  const { data: me } = useQuery<MePair | null>({
    queryKey: ["/api/buddy/me"],
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setOptedIn(profile.optedIn);
      setLevel(profile.routineLevel);
      setInterests(profile.interests || []);
      setBio(profile.bio || "");
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/buddy/profile", {
        optedIn, routineLevel: level, interests, bio: bio.trim() || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/buddy/profile"] });
    },
    onError: (e: any) => toast({ title: "Couldn't save", description: e.message, variant: "destructive" }),
  });

  const find = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/buddy/find", {});
      return res.json();
    },
    onSuccess: (data) => {
      if (data.matched) {
        toast({ title: "Buddy matched", description: "Reach out and say hi." });
      } else {
        toast({ title: "No matches yet", description: "We'll keep looking. Try again later." });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/buddy/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/buddy/profile"] });
    },
    onError: (e: any) => toast({ title: "Couldn't find buddy", description: e.message, variant: "destructive" }),
  });

  const end = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/buddy/end", {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Pair ended" });
      queryClient.invalidateQueries({ queryKey: ["/api/buddy/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/buddy/profile"] });
    },
  });

  function toggleInterest(t: string) {
    setInterests((prev) => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t].slice(0, 12));
  }
  function addCustomInterest() {
    const t = interestInput.trim().toLowerCase();
    if (t && !interests.includes(t)) setInterests([...interests, t].slice(0, 12));
    setInterestInput("");
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoveryHeader />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <header>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <HeartHandshake className="w-7 h-7 text-[#E2741B]" /> Accountability Buddy
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Get paired with one survivor at the same stage. Check in, push each other forward.
          </p>
        </header>

        {/* Active pair card */}
        {me?.pair && me.partner ? (
          <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0D0D0D] border-[#E2741B]/40">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={me.partner.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-zinc-700 text-[#E2741B] text-lg">
                    {(me.partner.firstName?.[0] || "") + (me.partner.lastName?.[0] || "") || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-xs text-[#E2741B] uppercase tracking-wide">Your buddy</div>
                  <div className="text-xl font-semibold text-white" data-testid="text-buddy-name">
                    {me.partner.firstName || "Survivor"} {me.partner.lastName?.[0] || ""}
                  </div>
                  {me.partnerProfile?.bio && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{me.partnerProfile.bio}</p>
                  )}
                </div>
              </div>
              {me.partnerProfile?.interests && me.partnerProfile.interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {me.partnerProfile.interests.map((t) => (
                    <Badge key={t} className="bg-[#E2741B]/15 text-[#E2741B] border-0 text-xs">{t}</Badge>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Link href="/messages">
                  <Button className="bg-[#E2741B] text-black hover:bg-[#E2741B]/90" data-testid="button-message-buddy">
                    <MessageCircle className="w-4 h-4 mr-2" /> Send a check-in
                  </Button>
                </Link>
                <Button onClick={() => end.mutate()} disabled={end.isPending}
                  variant="outline" className="border-[#333] text-gray-300 hover:bg-[#1a1a1a]"
                  data-testid="button-end-buddy">
                  <X className="w-4 h-4 mr-2" /> End pairing
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardContent className="p-6 text-center space-y-3">
              <Users className="w-10 h-10 text-[#E2741B] mx-auto" />
              <h2 className="text-lg font-semibold">No buddy yet</h2>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                {optedIn
                  ? "Save your profile, then tap Find a buddy to get matched."
                  : "Opt in below and we'll match you with a survivor at the same stage."}
              </p>
              <Button onClick={() => find.mutate()} disabled={!profile?.optedIn || find.isPending}
                className="bg-[#E2741B] text-black hover:bg-[#E2741B]/90"
                data-testid="button-find-buddy">
                {find.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Find a buddy
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Opt-in profile */}
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E2741B]" /> Your matching profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Opt in */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-md bg-[#0D0D0D] border border-[#333]">
              <div>
                <div className="text-sm font-medium">Opt in to matching</div>
                <div className="text-xs text-gray-400">Only opted-in survivors are visible to the matcher.</div>
              </div>
              <Switch checked={optedIn} onCheckedChange={setOptedIn} data-testid="switch-opt-in" />
            </div>

            {/* Routine level */}
            <div>
              <label className="text-xs text-gray-400">Where are you in your recovery?</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {LEVELS.map((l) => (
                  <Button key={l.v} type="button" variant={level === l.v ? "default" : "outline"}
                    onClick={() => setLevel(l.v)}
                    className={level === l.v
                      ? "bg-[#E2741B] text-black hover:bg-[#E2741B]/90 border-[#E2741B]"
                      : "border-[#333] text-gray-300 hover:bg-[#0D0D0D]"}
                    data-testid={`button-level-${l.v}`}>
                    {l.v}. {l.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="text-xs text-gray-400">Interests (pick a few — we match by overlap)</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SUGGESTED.map((t) => (
                  <Badge key={t} onClick={() => toggleInterest(t)}
                    className={`cursor-pointer text-xs ${interests.includes(t)
                      ? "bg-[#E2741B] text-black border-0"
                      : "bg-zinc-800 text-gray-300 border-0 hover:bg-zinc-700"}`}
                    data-testid={`badge-interest-${t}`}>
                    {t}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Input value={interestInput} onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomInterest(); } }}
                  placeholder="Add your own…" className="bg-[#0D0D0D] border-[#333]"
                  data-testid="input-custom-interest" />
                <Button type="button" onClick={addCustomInterest} variant="outline"
                  className="border-[#333] text-gray-300 hover:bg-[#0D0D0D]">Add</Button>
              </div>
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {interests.map((t) => (
                    <Badge key={t} className="bg-[#E2741B]/15 text-[#E2741B] border-0 text-xs gap-1 cursor-pointer"
                      onClick={() => toggleInterest(t)}>
                      {t} <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="text-xs text-gray-400">A short note for your buddy</label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)}
                placeholder="What you're working on, what kind of support helps."
                className="bg-[#0D0D0D] border-[#333] resize-none mt-1" rows={3}
                data-testid="input-bio" />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => save.mutate()} disabled={save.isPending}
                className="bg-[#E2741B] text-black hover:bg-[#E2741B]/90"
                data-testid="button-save-profile">
                {save.isPending ? "Saving…" : (
                  <span className="inline-flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> Save profile</span>
                )}
              </Button>
              {profile?.status && (
                <Badge className="bg-zinc-700/60 text-gray-200 border-0 text-xs">
                  Status: {profile.status}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-md border border-[#333] bg-[#1a1a1a] px-4 py-3 text-xs text-gray-400">
          Buddies are peer support — not a substitute for medical care. In a crisis, call or text 988.
        </div>
      </main>
    </div>
  );
}
