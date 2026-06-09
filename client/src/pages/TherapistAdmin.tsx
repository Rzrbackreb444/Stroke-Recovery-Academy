import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, X, ExternalLink } from "lucide-react";

interface Application {
  app: {
    id: number;
    userId: string;
    fullName: string;
    title: string;
    licenseNumber: string;
    licenseState: string;
    yearsExperience: number | null;
    specialties: string[] | null;
    bio: string | null;
    portfolioUrl: string | null;
    documentUrl: string | null;
    status: string;
    createdAt: string;
  };
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
}

export default function TherapistAdmin() {
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-page-title">
            <ShieldCheck className="w-7 h-7 text-[#E2741B]" /> Therapist Verifications
          </h1>
          <p className="text-gray-400 mt-1">Manually review credentials before granting Verified Therapist status.</p>
        </header>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="bg-[#1a1a1a] border border-[#333]">
            <TabsTrigger value="pending" data-testid="tab-pending">Pending</TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">Rejected</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4 space-y-3">
            <ApplicationsList status={tab} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ApplicationsList({ status }: { status: string }) {
  const { data, isLoading } = useQuery<{ applications: Application[] }>({
    queryKey: ["/api/admin/therapist-applications", status],
    queryFn: async () => (await fetch(`/api/admin/therapist-applications?status=${status}`)).json(),
  });

  if (isLoading) return <div className="text-gray-500">Loading…</div>;
  const apps = data?.applications || [];
  if (!apps.length) return <Card className="bg-[#1a1a1a] border-[#333]"><CardContent className="p-6 text-gray-400">No {status} applications.</CardContent></Card>;
  return <>{apps.map((a) => <ApplicationCard key={a.app.id} item={a} />)}</>;
}

function ApplicationCard({ item }: { item: Application }) {
  const a = item.app;
  const [notes, setNotes] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();
  const refresh = () => qc.invalidateQueries({ queryKey: ["/api/admin/therapist-applications"] });

  const approve = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/therapist-applications/${a.id}/approve`, { notes }),
    onSuccess: () => { toast({ title: "Approved" }); refresh(); },
  });
  const reject = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/therapist-applications/${a.id}/reject`, { notes }),
    onSuccess: () => { toast({ title: "Rejected" }); refresh(); },
  });

  return (
    <Card className="bg-[#1a1a1a] border-[#333]" data-testid={`app-${a.id}`}>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
        <Avatar className="w-10 h-10 border border-[#333]">
          <AvatarImage src={item.profileImageUrl || ""} />
          <AvatarFallback className="bg-[#2a2a2a] text-[#E2741B]">{(item.firstName || a.fullName)[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-base">{a.fullName} <span className="text-[#E2741B] text-sm">· {a.title}</span></CardTitle>
          <p className="text-xs text-gray-500">{item.email} · submitted {new Date(a.createdAt).toLocaleDateString()}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3 text-gray-300">
          <div><span className="text-gray-500">License:</span> {a.licenseNumber} ({a.licenseState})</div>
          <div><span className="text-gray-500">Experience:</span> {a.yearsExperience ?? "—"} yrs</div>
          {a.specialties && a.specialties.length > 0 && (
            <div className="col-span-2"><span className="text-gray-500">Specialties:</span> {a.specialties.join(", ")}</div>
          )}
          {a.bio && <div className="col-span-2 text-gray-400 italic">"{a.bio}"</div>}
        </div>
        <div className="flex gap-3 text-xs text-[#E2741B]">
          {a.portfolioUrl && <a className="inline-flex items-center gap-1 hover:underline" target="_blank" rel="noreferrer" href={a.portfolioUrl}><ExternalLink className="w-3 h-3" /> Portfolio</a>}
          {a.documentUrl && <a className="inline-flex items-center gap-1 hover:underline" target="_blank" rel="noreferrer" href={a.documentUrl}><ExternalLink className="w-3 h-3" /> Document</a>}
        </div>
        {a.status === "pending" && (
          <>
            <Textarea placeholder="Reviewer notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-[#0D0D0D] border-[#333] resize-none" rows={2} data-testid={`input-notes-${a.id}`} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" disabled={reject.isPending} onClick={() => reject.mutate()} className="border-[#333]" data-testid={`button-reject-${a.id}`}>
                <X className="w-4 h-4 mr-1" /> Reject
              </Button>
              <Button disabled={approve.isPending} onClick={() => approve.mutate()} className="bg-[#E2741B] hover:bg-[#B8851A] text-black font-bold" data-testid={`button-approve-${a.id}`}>
                <ShieldCheck className="w-4 h-4 mr-1" /> Approve
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
