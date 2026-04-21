import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  fullName: z.string().min(2, "Full legal name required"),
  title: z.string().min(2, "Credential, e.g. PT, DPT"),
  licenseNumber: z.string().min(2),
  licenseState: z.string().min(2),
  yearsExperience: z.coerce.number().int().nonnegative().optional(),
  specialtiesInput: z.string().optional(),
  bio: z.string().max(2000).optional(),
  portfolioUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  documentUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
type FormValues = z.infer<typeof formSchema>;

export default function TherapistApply() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: existing } = useQuery<{ application: any | null }>({
    queryKey: ["/api/therapists/my-application"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", title: "", licenseNumber: "", licenseState: "", specialtiesInput: "", bio: "", portfolioUrl: "", documentUrl: "" },
  });

  const submit = useMutation({
    mutationFn: async (v: FormValues) => {
      const payload = {
        fullName: v.fullName,
        title: v.title,
        licenseNumber: v.licenseNumber,
        licenseState: v.licenseState,
        yearsExperience: v.yearsExperience,
        specialties: (v.specialtiesInput || "").split(",").map((s) => s.trim()).filter(Boolean),
        bio: v.bio || undefined,
        portfolioUrl: v.portfolioUrl || undefined,
        documentUrl: v.documentUrl || undefined,
      };
      const res = await apiRequest("POST", "/api/therapists/apply", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Application submitted", description: "We'll review your credentials within a few business days." });
      qc.invalidateQueries({ queryKey: ["/api/therapists/my-application"] });
      form.reset();
    },
    onError: (e: any) => {
      toast({ title: "Couldn't submit", description: e?.message || "Try again.", variant: "destructive" });
    },
  });

  const app = existing?.application;
  const showForm = !app || app.status === "rejected";

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <header className="mb-6 flex items-start gap-3">
          <ShieldCheck className="w-8 h-8 text-[#C9941A] mt-1" />
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Become a Verified Therapist</h1>
            <p className="text-gray-400 mt-1">Film exercises, motivation, and techniques. Survivors unlock your courses with Power Points — you keep 85% of every unlock.</p>
          </div>
        </header>

        {app && (
          <Card className="bg-[#1a1a1a] border-[#333] mb-6" data-testid="status-card">
            <CardHeader><CardTitle className="text-lg">Application status: <span className={app.status === "approved" ? "text-green-400" : app.status === "rejected" ? "text-red-400" : "text-[#C9941A]"}>{app.status}</span></CardTitle></CardHeader>
            <CardContent className="text-sm text-gray-400">
              Submitted {new Date(app.createdAt).toLocaleDateString()}
              {app.reviewerNotes && <p className="mt-2">Reviewer notes: <span className="text-gray-300">{app.reviewerNotes}</span></p>}
            </CardContent>
          </Card>
        )}

        {showForm && (
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => submit.mutate(v))} className="space-y-4" data-testid="form-therapist-apply">
                  <FormField name="fullName" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Full legal name</FormLabel><FormControl><Input className="bg-[#0D0D0D] border-[#333]" placeholder="Dr. Jane Smith" {...field} data-testid="input-full-name" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField name="title" control={form.control} render={({ field }) => (
                      <FormItem><FormLabel>Credential / Title</FormLabel><FormControl><Input className="bg-[#0D0D0D] border-[#333]" placeholder="PT, DPT" {...field} data-testid="input-title" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="yearsExperience" control={form.control} render={({ field }) => (
                      <FormItem><FormLabel>Years of experience</FormLabel><FormControl><Input className="bg-[#0D0D0D] border-[#333]" type="number" {...field} data-testid="input-years" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField name="licenseNumber" control={form.control} render={({ field }) => (
                      <FormItem><FormLabel>License number</FormLabel><FormControl><Input className="bg-[#0D0D0D] border-[#333]" {...field} data-testid="input-license-number" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="licenseState" control={form.control} render={({ field }) => (
                      <FormItem><FormLabel>State / Country</FormLabel><FormControl><Input className="bg-[#0D0D0D] border-[#333]" placeholder="OH" {...field} data-testid="input-license-state" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField name="specialtiesInput" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Specialties (comma-separated)</FormLabel><FormControl><Input className="bg-[#0D0D0D] border-[#333]" placeholder="Neuro rehab, gait training, aphasia" {...field} data-testid="input-specialties" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name="bio" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Short bio</FormLabel><FormControl><Textarea className="bg-[#0D0D0D] border-[#333] resize-none" rows={4} {...field} data-testid="input-bio" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name="portfolioUrl" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Portfolio / website (optional)</FormLabel><FormControl><Input className="bg-[#0D0D0D] border-[#333]" placeholder="https://" {...field} data-testid="input-portfolio" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name="documentUrl" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>License/cert document URL (optional)</FormLabel><FormControl><Input className="bg-[#0D0D0D] border-[#333]" placeholder="https://drive.google.com/…" {...field} data-testid="input-document" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" disabled={submit.isPending} className="w-full bg-[#C9941A] hover:bg-[#B8851A] text-black font-bold" data-testid="button-submit">
                    {submit.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : "Submit Application"}
                  </Button>
                  <p className="text-[11px] text-gray-500">All applications are reviewed manually. Misrepresenting credentials results in permanent removal.</p>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
