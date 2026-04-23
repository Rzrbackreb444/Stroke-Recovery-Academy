import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Heart, UserPlus, Mail, Loader2, Copy, X, CheckCircle2, ShieldCheck,
  Users, Clock, Hourglass,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RecoveryHeader from "@/components/RecoveryHeader";

interface LinkRow {
  id: number;
  caregiver_id: string;
  survivor_id: string | null;
  status: "invited" | "active" | "revoked" | "expired";
  relationship: string | null;
  invite_email: string | null;
  invite_token: string | null;
  invited_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  invite_expires_at: string | null;
  caregiver_first?: string | null;
  caregiver_last?: string | null;
  caregiver_email?: string | null;
  caregiver_avatar?: string | null;
  survivor_first?: string | null;
  survivor_last?: string | null;
  survivor_email?: string | null;
  survivor_avatar?: string | null;
}
interface LinksResp { asCaregiver: LinkRow[]; asSurvivor: LinkRow[]; }

const RELATIONSHIPS = ["spouse", "parent", "child", "sibling", "friend", "professional", "other"];

export default function CaregiverSettings() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("spouse");

  const links = useQuery<LinksResp>({
    queryKey: ["/api/caregivers/links"],
    enabled: isAuthenticated,
  });

  const inviteM = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/caregivers/invite", { email, relationship });
      return r.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: data.alreadyExisted ? "Invite already sent" : "Invite sent",
        description: data.acceptUrl
          ? "Share the accept link with your survivor — they need to sign in and click it."
          : "They'll see the request next time they sign in.",
      });
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/caregivers/links"] });
    },
    onError: (err: any) => {
      toast({ title: "Invite failed", description: err?.message || "Try again", variant: "destructive" });
    },
  });

  const revokeM = useMutation({
    mutationFn: async (id: number) => {
      const r = await apiRequest("POST", `/api/caregivers/${id}/revoke`, {});
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Link revoked" });
      queryClient.invalidateQueries({ queryKey: ["/api/caregivers/links"] });
    },
  });

  const acceptM = useMutation({
    mutationFn: async (token: string) => {
      const r = await apiRequest("POST", `/api/caregivers/accept/${token}`, {});
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Linked", description: "Courses your caregiver unlocks now seat you too." });
      queryClient.invalidateQueries({ queryKey: ["/api/caregivers/links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/course-unlocks"] });
    },
    onError: (err: any) => {
      toast({ title: "Couldn't accept", description: err?.message || "Invalid token", variant: "destructive" });
    },
  });

  const copyAcceptUrl = (token: string) => {
    const url = `${window.location.origin}/settings/caregivers/accept/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: url });
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoveryHeader />
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Heart className="w-8 h-8 text-[#C9941A]" />
            <h1 className="text-3xl font-bold">Caregiver Seats</h1>
          </div>
          <p className="text-gray-400 max-w-2xl">
            Link a caregiver to a survivor. Every course the caregiver unlocks is automatically seated
            on the survivor's account — same lessons, same captions, same progress tracking. One purchase, two seats.
          </p>
        </header>

        {/* Invite */}
        <Card className="bg-[#1a1a1a] border-[#333] mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#C9941A]" /> Invite a Survivor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-[1fr_180px_auto] gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Their email</label>
                <Input
                  data-testid="input-survivor-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="survivor@example.com"
                  className="bg-[#0D0D0D] border-[#333] text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Relationship</label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger
                    data-testid="select-relationship"
                    className="bg-[#0D0D0D] border-[#333] text-white"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                    {RELATIONSHIPS.map(r => (
                      <SelectItem key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  data-testid="button-send-invite"
                  onClick={() => inviteM.mutate()}
                  disabled={!email || inviteM.isPending}
                  className="bg-[#C9941A] hover:bg-[#b08217] text-black font-semibold"
                >
                  {inviteM.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  Send
                </Button>
              </div>
            </div>
            <div className="text-xs text-gray-500 flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C9941A] mt-0.5" />
              <span>
                The survivor must sign in and accept. Invite expires in 14 days. Either side can revoke at any time.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Survivors I sponsor */}
        <Card className="bg-[#1a1a1a] border-[#333] mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#C9941A]" /> Survivors I Sponsor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {links.isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            ) : !links.data?.asCaregiver?.length ? (
              <div className="text-sm text-gray-500 text-center py-6">
                No links yet. Invite a survivor above.
              </div>
            ) : (
              <ul className="divide-y divide-[#333]">
                {links.data.asCaregiver.map(l => (
                  <li key={l.id} className="py-3 flex items-center justify-between gap-4" data-testid={`care-row-${l.id}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={l.survivor_avatar || undefined} />
                        <AvatarFallback className="bg-[#0D0D0D] text-[#C9941A]">
                          {(l.survivor_first || l.invite_email || "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {l.survivor_first || l.invite_email || "Pending"} {l.survivor_last || ""}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <StatusBadge status={l.status} />
                          {l.relationship && <span>· {l.relationship}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {l.status === "invited" && l.invite_token && (
                        <Button
                          data-testid={`button-copy-link-${l.id}`}
                          size="sm"
                          variant="outline"
                          onClick={() => copyAcceptUrl(l.invite_token!)}
                          className="border-[#333] text-gray-300"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copy link
                        </Button>
                      )}
                      {l.status !== "revoked" && l.status !== "expired" && (
                        <Button
                          data-testid={`button-revoke-${l.id}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => revokeM.mutate(l.id)}
                          disabled={revokeM.isPending}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Caregivers sponsoring me */}
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#C9941A]" /> Caregivers Sponsoring Me
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!links.data?.asSurvivor?.length ? (
              <div className="text-sm text-gray-500 text-center py-6">
                No caregivers linked. If someone invited you by email, paste their link in the URL bar
                or ask them to copy it again.
              </div>
            ) : (
              <ul className="divide-y divide-[#333]">
                {links.data.asSurvivor.map(l => (
                  <li key={l.id} className="py-3 flex items-center justify-between gap-4" data-testid={`sponsor-row-${l.id}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={l.caregiver_avatar || undefined} />
                        <AvatarFallback className="bg-[#0D0D0D] text-[#C9941A]">
                          {(l.caregiver_first || "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {l.caregiver_first || l.caregiver_email || "Caregiver"} {l.caregiver_last || ""}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <StatusBadge status={l.status} />
                          {l.relationship && <span>· {l.relationship}</span>}
                        </div>
                      </div>
                    </div>
                    {l.status === "invited" && l.invite_token && (
                      <Button
                        data-testid={`button-accept-${l.id}`}
                        size="sm"
                        onClick={() => acceptM.mutate(l.invite_token!)}
                        disabled={acceptM.isPending}
                        className="bg-[#C9941A] hover:bg-[#b08217] text-black font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Accept
                      </Button>
                    )}
                    {l.status === "active" && (
                      <Button
                        data-testid={`button-leave-${l.id}`}
                        size="sm"
                        variant="ghost"
                        onClick={() => revokeM.mutate(l.id)}
                        disabled={revokeM.isPending}
                        className="text-red-400 hover:text-red-300"
                      >
                        Leave
                      </Button>
                    )}
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: any }> = {
    invited: { label: "Invited", cls: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", Icon: Hourglass },
    active: { label: "Active", cls: "bg-green-500/20 text-green-300 border-green-500/30", Icon: CheckCircle2 },
    revoked: { label: "Revoked", cls: "bg-gray-500/20 text-gray-400 border-gray-500/30", Icon: X },
    expired: { label: "Expired", cls: "bg-gray-500/20 text-gray-400 border-gray-500/30", Icon: Clock },
  };
  const m = map[status] ?? map.expired;
  const I = m.Icon;
  return (
    <Badge variant="outline" className={`${m.cls} text-[10px] gap-1`}>
      <I className="w-3 h-3" /> {m.label}
    </Badge>
  );
}
