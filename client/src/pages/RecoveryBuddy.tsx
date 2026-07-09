import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users, HeartHandshake, MessageCircle, X, Search, Loader2, CheckCircle2, Sparkles,
  Check, UserPlus, Inbox, Clock,
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
interface Candidate {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  routineLevel: number;
  stageLabel: string;
  interests: string[];
  bio: string | null;
  score: number;
  reasons: string[];
  requested: boolean;
  requestedYou: boolean;
}
interface Person { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null }
interface BuddyRequestView {
  id: number;
  direction: "incoming" | "outgoing";
  note: string | null;
  reasons: string[];
  createdAt: string;
  person: Person | null;
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

function fullName(p: { firstName: string | null; lastName: string | null } | null) {
  if (!p) return "Survivor";
  return `${p.firstName || "Survivor"} ${p.lastName?.[0] || ""}`.trim();
}
function initials(p: { firstName: string | null; lastName: string | null } | null) {
  return ((p?.firstName?.[0] || "") + (p?.lastName?.[0] || "")) || "?";
}

export default function RecoveryBuddy() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [optedIn, setOptedIn] = useState(false);
  const [level, setLevel] = useState(2);
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");
  const [bio, setBio] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searched, setSearched] = useState(false);

  const { data: profile } = useQuery<BuddyProfile | null>({
    queryKey: ["/api/buddy/profile"],
    enabled: !!user,
  });
  const { data: me } = useQuery<MePair | null>({
    queryKey: ["/api/buddy/me"],
    enabled: !!user,
  });
  const { data: requests } = useQuery<{ incoming: BuddyRequestView[]; outgoing: BuddyRequestView[] }>({
    queryKey: ["/api/buddy/requests"],
    enabled: !!user && !me?.pair,
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
      setSearched(true);
      setCandidates(data.candidates || []);
    },
    onError: (e: any) => toast({ title: "Couldn't find buddies", description: e.message, variant: "destructive" }),
  });

  const request = useMutation({
    mutationFn: async (c: Candidate) => {
      const res = await apiRequest("POST", "/api/buddy/request", {
        recipientId: c.userId, score: c.score, reasons: c.reasons,
      });
      return res.json();
    },
    onSuccess: (_data, c) => {
      toast({ title: "Request sent", description: `We let ${fullName(c)} know. They accept to pair up.` });
      setCandidates((prev) => prev.map((x) => x.userId === c.userId ? { ...x, requested: true } : x));
      queryClient.invalidateQueries({ queryKey: ["/api/buddy/requests"] });
    },
    onError: (e: any) => toast({ title: "Couldn't send request", description: e.message, variant: "destructive" }),
  });

  const accept = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/buddy/request/${id}/accept`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "You're paired", description: "Say hi and set your first check-in." });
      setCandidates([]);
      queryClient.invalidateQueries({ queryKey: ["/api/buddy/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/buddy/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/buddy/profile"] });
    },
    onError: (e: any) => toast({ title: "Couldn't accept", description: e.message, variant: "destructive" }),
  });

  const decline = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/buddy/request/${id}/decline`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buddy/requests"] });
    },
    onError: (e: any) => toast({ title: "Couldn't update", description: e.message, variant: "destructive" }),
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

  const incoming = requests?.incoming ?? [];
  const outgoing = requests?.outgoing ?? [];

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoveryHeader />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <header>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <HeartHandshake className="w-7 h-7 text-[#E2741B]" /> Accountability Buddy
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Get matched with a survivor by your deficits, recovery stage, and goals. You both opt in — pairing only happens when you both say yes.
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
                    {initials(me.partner)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-xs text-[#E2741B] uppercase tracking-wide">Your buddy</div>
                  <div className="text-xl font-semibold text-white" data-testid="text-buddy-name">
                    {fullName(me.partner)}
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
                <Link href="/recovery/messages">
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
          <>
            {/* Incoming requests — accept to pair */}
            {incoming.length > 0 && (
              <Card className="bg-[#1a1a1a] border-[#E2741B]/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-[#E2741B]" /> Buddy requests for you
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {incoming.map((r) => (
                    <div key={r.id} className="flex items-start gap-3 p-3 rounded-md bg-[#0D0D0D] border border-[#333]"
                      data-testid={`request-incoming-${r.id}`}>
                      <Avatar className="w-11 h-11">
                        <AvatarImage src={r.person?.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-zinc-700 text-[#E2741B]">{initials(r.person)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white">{fullName(r.person)}</div>
                        {r.reasons.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {r.reasons.map((reason, i) => (
                              <Badge key={i} className="bg-[#E2741B]/15 text-[#E2741B] border-0 text-[11px]">{reason}</Badge>
                            ))}
                          </div>
                        )}
                        {r.note && <p className="text-sm text-gray-400 mt-1">{r.note}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" onClick={() => accept.mutate(r.id)} disabled={accept.isPending}
                          className="bg-[#E2741B] text-black hover:bg-[#E2741B]/90" data-testid={`button-accept-${r.id}`}>
                          <Check className="w-4 h-4 mr-1" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => decline.mutate(r.id)} disabled={decline.isPending}
                          className="border-[#333] text-gray-300 hover:bg-[#1a1a1a]" data-testid={`button-decline-${r.id}`}>
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Find + candidate list */}
            <Card className="bg-[#1a1a1a] border-[#333]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="text-lg font-semibold">Find your buddy</h2>
                    <p className="text-sm text-gray-400">
                      {profile?.optedIn
                        ? "We rank survivors by how well your recovery matches. Send a request — they accept to pair."
                        : "Opt in below and save your profile to see matches."}
                    </p>
                  </div>
                  <Button onClick={() => find.mutate()} disabled={!profile?.optedIn || find.isPending}
                    className="bg-[#E2741B] text-black hover:bg-[#E2741B]/90"
                    data-testid="button-find-buddy">
                    {find.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                    Find matches
                  </Button>
                </div>

                <div aria-live="polite">
                  {find.isPending ? (
                    <div className="text-center py-8 text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </div>
                  ) : candidates.length > 0 ? (
                    <ul className="space-y-3">
                      {candidates.map((c) => (
                        <li key={c.userId}
                          className="flex items-start gap-3 p-3 rounded-md bg-[#0D0D0D] border border-[#333]"
                          data-testid={`candidate-${c.userId}`}>
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={c.profileImageUrl || undefined} />
                            <AvatarFallback className="bg-zinc-700 text-[#E2741B]">{initials(c)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-white">{fullName(c)}</span>
                              {c.stageLabel && (
                                <Badge className="bg-zinc-700/60 text-gray-200 border-0 text-[11px]">{c.stageLabel}</Badge>
                              )}
                            </div>
                            {c.reasons.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {c.reasons.map((reason, i) => (
                                  <Badge key={i} className="bg-[#E2741B]/15 text-[#E2741B] border-0 text-[11px]">{reason}</Badge>
                                ))}
                              </div>
                            )}
                            {c.bio && <p className="text-sm text-gray-400 mt-1.5 line-clamp-2">{c.bio}</p>}
                          </div>
                          <div className="shrink-0">
                            {c.requestedYou ? (
                              <Badge className="bg-[#E2741B]/15 text-[#E2741B] border-0 text-xs">Asked you — see above</Badge>
                            ) : c.requested ? (
                              <Badge className="bg-zinc-700/60 text-gray-200 border-0 text-xs gap-1">
                                <Clock className="w-3 h-3" /> Requested
                              </Badge>
                            ) : (
                              <Button size="sm" onClick={() => request.mutate(c)} disabled={request.isPending}
                                className="bg-[#E2741B] text-black hover:bg-[#E2741B]/90"
                                data-testid={`button-request-${c.userId}`}>
                                <UserPlus className="w-4 h-4 mr-1" /> Request
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : searched ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No matches right now. As more survivors opt in, check back — we'll rank the best fits.
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <Users className="w-8 h-8 text-[#E2741B]/60 mx-auto mb-2" />
                      Tap Find matches to see survivors who fit your recovery.
                    </div>
                  )}
                </div>

                {outgoing.length > 0 && (
                  <div className="pt-2 border-t border-[#333]">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Requests you sent</div>
                    <div className="space-y-2">
                      {outgoing.map((r) => (
                        <div key={r.id} className="flex items-center gap-3" data-testid={`request-outgoing-${r.id}`}>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={r.person?.profileImageUrl || undefined} />
                            <AvatarFallback className="bg-zinc-700 text-[#E2741B] text-xs">{initials(r.person)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-300 flex-1">{fullName(r.person)}</span>
                          <Badge className="bg-zinc-700/60 text-gray-200 border-0 text-[11px] gap-1">
                            <Clock className="w-3 h-3" /> Pending
                          </Badge>
                          <Button size="sm" variant="ghost" onClick={() => decline.mutate(r.id)} disabled={decline.isPending}
                            className="text-gray-400 hover:text-white" data-testid={`button-cancel-${r.id}`}>
                            Cancel
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
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
                <label htmlFor="switch-opt-in" className="text-sm font-medium">Opt in to matching</label>
                <div className="text-xs text-gray-400">Only opted-in survivors are visible to the matcher.</div>
              </div>
              <Switch id="switch-opt-in" checked={optedIn} onCheckedChange={setOptedIn} data-testid="switch-opt-in" />
            </div>

            {/* Routine level */}
            <div>
              <span className="text-xs text-gray-400">Where are you in your recovery?</span>
              <div className="flex gap-2 mt-2 flex-wrap">
                {LEVELS.map((l) => (
                  <Button key={l.v} type="button" variant={level === l.v ? "default" : "outline"}
                    onClick={() => setLevel(l.v)}
                    aria-pressed={level === l.v}
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
              <span className="text-xs text-gray-400">Interests (pick a few — we match by overlap)</span>
              <div className="flex flex-wrap gap-2 mt-2" role="group" aria-label="Suggested interests">
                {SUGGESTED.map((t) => {
                  const on = interests.includes(t);
                  return (
                    <Badge key={t} role="button" tabIndex={0} aria-pressed={on}
                      onClick={() => toggleInterest(t)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleInterest(t); } }}
                      className={`cursor-pointer text-xs ${on
                        ? "bg-[#E2741B] text-black border-0"
                        : "bg-zinc-800 text-gray-300 border-0 hover:bg-zinc-700"}`}
                      data-testid={`badge-interest-${t}`}>
                      {t}
                    </Badge>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-3">
                <Input value={interestInput} onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomInterest(); } }}
                  placeholder="Add your own…" className="bg-[#0D0D0D] border-[#333]"
                  aria-label="Add a custom interest"
                  data-testid="input-custom-interest" />
                <Button type="button" onClick={addCustomInterest} variant="outline"
                  className="border-[#333] text-gray-300 hover:bg-[#0D0D0D]">Add</Button>
              </div>
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {interests.map((t) => (
                    <Badge key={t} role="button" tabIndex={0} aria-label={`Remove ${t}`}
                      className="bg-[#E2741B]/15 text-[#E2741B] border-0 text-xs gap-1 cursor-pointer"
                      onClick={() => toggleInterest(t)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleInterest(t); } }}>
                      {t} <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="input-bio" className="text-xs text-gray-400">A short note for your buddy</label>
              <Textarea id="input-bio" value={bio} onChange={(e) => setBio(e.target.value)}
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
