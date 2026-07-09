import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, Plus, UserPlus } from "lucide-react";

const ACCENT = "#E2741B";

interface Org {
  id: number; name: string; slug: string; orgType: string; status: string;
  seatLimit: number; contactName: string | null; contactEmail: string | null;
}

const ORG_TYPES = ["rehab_center", "hospital", "clinic", "discharge_program", "research", "other"];

export default function AdminInstitutions() {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [staffFor, setStaffFor] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", orgType: "rehab_center", contactName: "", contactEmail: "", seatLimit: 25, ownerEmail: "" });
  const [staffForm, setStaffForm] = useState({ userId: "", role: "owner" });

  const { data: orgs, isLoading } = useQuery<Org[]>({ queryKey: ["/api/institutions/admin/orgs"] });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/institutions/admin/orgs", {
        name: form.name,
        orgType: form.orgType,
        contactName: form.contactName || undefined,
        contactEmail: form.contactEmail || undefined,
        seatLimit: Number(form.seatLimit),
        ownerEmail: form.ownerEmail || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/institutions/admin/orgs"] });
      toast({ title: "Organization created" });
      setShowCreate(false);
      setForm({ name: "", orgType: "rehab_center", contactName: "", contactEmail: "", seatLimit: 25, ownerEmail: "" });
    },
    onError: (e: any) => toast({ title: "Couldn't create", description: e?.message, variant: "destructive" }),
  });

  const staffMutation = useMutation({
    mutationFn: async (orgId: number) => {
      const res = await apiRequest("POST", `/api/institutions/admin/orgs/${orgId}/staff`, staffForm);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Staff added" });
      setStaffFor(null);
      setStaffForm({ userId: "", role: "owner" });
    },
    onError: (e: any) => toast({ title: "Couldn't add staff", description: e?.message, variant: "destructive" }),
  });

  const inputCls = "w-full rounded-md border border-[#E2C2A4]/60 px-3 py-2.5 text-[#1C1917] focus:outline-none focus:ring-2 text-sm";

  return (
    <div className="min-h-screen bg-[#FDFBF7] px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-[#1C1917]">Institutions</h1>
            <p className="text-[#5C534D]">Create organizations, set seat limits, attach staff.</p>
          </div>
          <Button className="text-white border" style={{ backgroundColor: ACCENT, borderColor: ACCENT }} onClick={() => setShowCreate((s) => !s)} data-testid="button-new-org">
            <Plus className="mr-2 h-4 w-4" /> New organization
          </Button>
        </div>

        {showCreate && (
          <div className="bg-white rounded-md border border-[#E2C2A4]/40 p-6 mb-8 space-y-4">
            <h2 className="font-semibold text-[#1C1917]">New organization</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Name</label>
                <input className={inputCls} style={{ ["--tw-ring-color" as any]: ACCENT }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-org-name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Type</label>
                <select className={inputCls} style={{ ["--tw-ring-color" as any]: ACCENT }} value={form.orgType} onChange={(e) => setForm({ ...form, orgType: e.target.value })} data-testid="select-org-type">
                  {ORG_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Seat limit</label>
                <input type="number" min={0} className={inputCls} style={{ ["--tw-ring-color" as any]: ACCENT }} value={form.seatLimit} onChange={(e) => setForm({ ...form, seatLimit: Number(e.target.value) })} data-testid="input-seat-limit" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Owner email (optional)</label>
                <input className={inputCls} style={{ ["--tw-ring-color" as any]: ACCENT }} value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} data-testid="input-owner-email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Contact name</label>
                <input className={inputCls} style={{ ["--tw-ring-color" as any]: ACCENT }} value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} data-testid="input-contact-name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Contact email</label>
                <input className={inputCls} style={{ ["--tw-ring-color" as any]: ACCENT }} value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} data-testid="input-contact-email" />
              </div>
            </div>
            <Button className="text-white border" style={{ backgroundColor: ACCENT, borderColor: ACCENT }} disabled={!form.name.trim() || createMutation.isPending} onClick={() => createMutation.mutate()} data-testid="button-create-org">
              {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : "Create"}
            </Button>
          </div>
        )}

        {isLoading && <div className="text-center text-[#78716C] py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" /> Loading…</div>}

        {!isLoading && (orgs?.length ?? 0) === 0 && (
          <div className="bg-white rounded-md border border-[#E2C2A4]/40 p-8 text-center text-[#5C534D]" data-testid="admin-orgs-empty">No organizations yet.</div>
        )}

        <div className="space-y-4">
          {orgs?.map((o) => (
            <div key={o.id} className="bg-white rounded-md border border-[#E2C2A4]/40 p-5" data-testid={`admin-org-${o.id}`}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: "rgba(226,116,27,0.12)" }}>
                    <Building2 className="w-5 h-5" style={{ color: ACCENT }} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1C1917]">{o.name}</p>
                    <p className="text-xs text-[#78716C] capitalize">{o.orgType?.replace(/_/g, " ")} · {o.status} · {o.seatLimit} seats</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setStaffFor(staffFor === o.id ? null : o.id)} data-testid={`button-add-staff-${o.id}`}>
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Add staff
                </Button>
              </div>
              {staffFor === o.id && (
                <div className="mt-4 pt-4 border-t border-[#E2C2A4]/30 flex items-end gap-3 flex-wrap">
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-medium text-[#1C1917] mb-1.5">User ID</label>
                    <input className={inputCls} style={{ ["--tw-ring-color" as any]: ACCENT }} value={staffForm.userId} onChange={(e) => setStaffForm({ ...staffForm, userId: e.target.value })} data-testid={`input-staff-userid-${o.id}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1C1917] mb-1.5">Role</label>
                    <select className={inputCls} style={{ ["--tw-ring-color" as any]: ACCENT }} value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })} data-testid={`select-staff-role-${o.id}`}>
                      <option value="owner">owner</option>
                      <option value="clinician">clinician</option>
                    </select>
                  </div>
                  <Button className="text-white border" style={{ backgroundColor: ACCENT, borderColor: ACCENT }} disabled={!staffForm.userId.trim() || staffMutation.isPending} onClick={() => staffMutation.mutate(o.id)} data-testid={`button-save-staff-${o.id}`}>
                    {staffMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
