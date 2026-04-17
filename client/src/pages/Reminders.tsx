import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Bell, BellOff, Pill, Calendar, Droplet, Activity, Flame,
  Plus, Trash2, CheckCircle, Clock, Shield, ChevronRight,
  AlertCircle, Zap, Target, Award, Send
} from "lucide-react";

const PROVIDER_TYPES = [
  "Neurologist", "Physical Therapist", "Occupational Therapist",
  "Speech Therapist", "Primary Care", "Cardiologist",
  "Physiatrist", "Psychologist", "Dietitian", "Other"
];

const FREQUENCIES = [
  { value: "once_daily", label: "Once daily" },
  { value: "twice_daily", label: "Twice daily" },
  { value: "three_daily", label: "Three times daily" },
  { value: "four_daily", label: "Four times daily" },
  { value: "every_other_day", label: "Every other day" },
  { value: "weekly", label: "Weekly" },
  { value: "as_needed", label: "As needed" },
];

function AccountabilityBanner({ push }: { push: ReturnType<typeof usePushNotifications> }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || push.isSubscribed || !push.isSupported) return null;

  return (
    <div className="rounded-lg border border-[#C9941A]/40 bg-[#C9941A]/10 p-5 mb-6 flex flex-wrap gap-4 items-start justify-between">
      <div className="flex gap-3 items-start">
        <Zap className="h-5 w-5 text-[#C9941A] flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-white text-sm mb-1">Turn on Accountability Push Alerts</p>
          <p className="text-gray-400 text-xs leading-relaxed">
            The Sasquatch Coach will check on you. Missed check-ins, medication times, 
            appointments, streak milestones — all delivered with Nick's accountability voice. 
            <span className="text-[#C9941A] font-semibold"> Warrior plan only.</span>
          </p>
          {push.error && <p className="text-red-400 text-xs mt-1">{push.error}</p>}
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="text-gray-500 text-xs"
          onClick={() => setDismissed(true)}
          data-testid="button-dismiss-push-banner"
        >
          Not now
        </Button>
        <Button
          size="sm"
          className="bg-[#C9941A] text-black font-bold"
          onClick={push.subscribe}
          disabled={push.isLoading}
          data-testid="button-enable-push"
        >
          {push.isLoading ? "Enabling..." : "Enable Alerts"}
        </Button>
      </div>
    </div>
  );
}

function PushStatusCard({ push }: { push: ReturnType<typeof usePushNotifications> }) {
  const { toast } = useToast();

  const handleTest = async () => {
    await push.sendTest();
    toast({ title: "Test sent!", description: "Check your browser notifications — Sasquatch is watching." });
  };

  if (!push.isSupported) {
    return (
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardContent className="p-5 flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 text-gray-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-300">Push not supported</p>
            <p className="text-xs text-gray-500">Use Chrome or Edge on desktop for push notifications.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!push.isSubscribed) {
    return (
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-3 items-center">
              <BellOff className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-semibold text-gray-300">Accountability alerts off</p>
                <p className="text-xs text-gray-500">You won't receive push reminders until you opt in.</p>
              </div>
            </div>
            <Button size="sm" className="bg-[#C9941A] text-black font-bold" onClick={push.subscribe} disabled={push.isLoading} data-testid="button-push-subscribe">
              {push.isLoading ? "Enabling..." : "Enable Now"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1a1a1a] border-green-500/30">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-3 items-center">
            <Bell className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-sm font-semibold text-green-400">Accountability alerts active</p>
              <p className="text-xs text-gray-400">Coach will check on you. Missed days will be called out.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-[#333] text-gray-400 text-xs" onClick={handleTest} data-testid="button-push-test">
              <Send className="h-3 w-3 mr-1" />Test
            </Button>
            <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 text-xs" onClick={push.unsubscribe} disabled={push.isLoading} data-testid="button-push-unsubscribe">
              Turn Off
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============== MEDICATIONS ================

function MedicationsTab() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", dosage: "", frequency: "once_daily", purpose: "", prescribedBy: "", notes: "", reminderTimes: ["08:00"],
  });

  const { data: meds = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/medications"],
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/medications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      setShowAdd(false);
      setForm({ name: "", dosage: "", frequency: "once_daily", purpose: "", prescribedBy: "", notes: "", reminderTimes: ["08:00"] });
      toast({ title: "Medication added", description: "Push reminders will fire at your set times." });
    },
    onError: () => toast({ title: "Error", description: "Failed to add medication", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/medications/${id}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/medications"] }),
  });

  const logMutation = useMutation({
    mutationFn: ({ id, skipped }: { id: number; skipped: boolean }) => apiRequest("POST", `/api/medications/${id}/log`, { skipped }),
    onSuccess: (_, { skipped }) => toast({ title: skipped ? "Skipped logged" : "Taken — logged!", description: skipped ? "Skip recorded." : "Great. Never miss your protocol." }),
  });

  const addReminderTime = () => setForm(f => ({ ...f, reminderTimes: [...f.reminderTimes, "12:00"] }));
  const updateTime = (i: number, val: string) => setForm(f => ({ ...f, reminderTimes: f.reminderTimes.map((t, idx) => idx === i ? val : t) }));
  const removeTime = (i: number) => setForm(f => ({ ...f, reminderTimes: f.reminderTimes.filter((_, idx) => idx !== i) }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-white text-lg">Medications</h3>
          <p className="text-xs text-gray-400">Push alerts fire at your set times. Don't skip your protocol.</p>
        </div>
        <Button size="sm" className="bg-[#C9941A] text-black font-bold gap-1" onClick={() => setShowAdd(true)} data-testid="button-add-medication">
          <Plus className="h-3.5 w-3.5" />Add
        </Button>
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-sm text-center py-6">Loading...</p>
      ) : meds.length === 0 ? (
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardContent className="p-8 text-center">
            <Pill className="h-8 w-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No medications tracked yet.</p>
            <p className="text-gray-500 text-xs mt-1">Add yours — push reminders fire at your times.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {meds.map((med: any) => (
            <Card key={med.id} className="bg-[#1a1a1a] border-[#333]" data-testid={`card-medication-${med.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <Pill className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{med.name}</p>
                      <p className="text-xs text-gray-400">{med.dosage} · {FREQUENCIES.find(f => f.value === med.frequency)?.label || med.frequency}</p>
                      {med.purpose && <p className="text-xs text-gray-500 mt-0.5">{med.purpose}</p>}
                      {med.prescribed_by && <p className="text-xs text-gray-600">Prescribed by: {med.prescribed_by}</p>}
                      {med.reminder_times?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {med.reminder_times.map((t: string) => (
                            <Badge key={t} className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30 text-xs">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" className="border-green-500/30 text-green-400 text-xs" onClick={() => logMutation.mutate({ id: med.id, skipped: false })} data-testid={`button-taken-${med.id}`}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />Taken
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(med.id)} data-testid={`button-delete-medication-${med.id}`}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#C9941A]">Add Medication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Medication name *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Aspirin" className="bg-[#111] border-[#333] text-white" data-testid="input-med-name" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Dosage *</label>
                <Input value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g., 81mg" className="bg-[#111] border-[#333] text-white" data-testid="input-med-dosage" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Frequency *</label>
              <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                <SelectTrigger className="bg-[#111] border-[#333] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#333]">
                  {FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value} className="text-white">{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Purpose (optional)</label>
              <Input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="e.g., Blood thinner, stroke prevention" className="bg-[#111] border-[#333] text-white" data-testid="input-med-purpose" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Prescribed by (optional)</label>
              <Input value={form.prescribedBy} onChange={e => setForm(f => ({ ...f, prescribedBy: e.target.value }))} placeholder="Dr. Smith" className="bg-[#111] border-[#333] text-white" data-testid="input-med-prescriber" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400">Reminder times (push alert sent at these times)</label>
                <Button size="sm" variant="ghost" className="text-[#C9941A] text-xs h-6" onClick={addReminderTime}>+ Add time</Button>
              </div>
              <div className="space-y-2">
                {form.reminderTimes.map((t, i) => (
                  <div key={i} className="flex gap-2">
                    <Input type="time" value={t} onChange={e => updateTime(i, e.target.value)} className="bg-[#111] border-[#333] text-white flex-1" data-testid={`input-med-time-${i}`} />
                    {form.reminderTimes.length > 1 && (
                      <Button size="icon" variant="ghost" onClick={() => removeTime(i)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Button className="w-full bg-[#C9941A] text-black font-black" onClick={() => addMutation.mutate(form)} disabled={addMutation.isPending || !form.name || !form.dosage} data-testid="button-submit-medication">
              {addMutation.isPending ? "Adding..." : "Add Medication"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============== APPOINTMENTS ================

function AppointmentsTab() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "", providerName: "", providerType: "Neurologist", location: "",
    appointmentDate: "", duration: "60", notes: "", prepNotes: "",
  });

  const { data: appointments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/appointments"],
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/appointments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setShowAdd(false);
      setForm({ title: "", providerName: "", providerType: "Neurologist", location: "", appointmentDate: "", duration: "60", notes: "", prepNotes: "" });
      toast({ title: "Appointment added", description: "You'll get push reminders 24h and 1h before." });
    },
    onError: () => toast({ title: "Error", description: "Failed to add appointment", variant: "destructive" }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PUT", `/api/appointments/${id}`, { status: "completed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({ title: "Appointment completed", description: "Great. Log any follow-up notes in your medical log." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/appointments/${id}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/appointments"] }),
  });

  const upcoming = appointments.filter((a: any) => new Date(a.appointment_date) >= new Date());
  const past = appointments.filter((a: any) => new Date(a.appointment_date) < new Date());

  function ApptCard({ appt }: { appt: any }) {
    const date = new Date(appt.appointment_date);
    const isToday = date.toDateString() === new Date().toDateString();
    const isTomorrow = date.toDateString() === new Date(Date.now() + 86400000).toDateString();
    const dayLabel = isToday ? "TODAY" : isTomorrow ? "TOMORROW" : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
      <Card className={`bg-[#1a1a1a] border-[#333] ${isToday ? 'border-[#C9941A]/50' : ''}`} data-testid={`card-appointment-${appt.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex gap-3 items-start">
              <div className="text-center w-12 flex-shrink-0">
                <div className={`text-xs font-black ${isToday ? 'text-[#C9941A]' : 'text-gray-400'}`}>{dayLabel}</div>
                <div className="text-lg font-black text-white">{date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
              </div>
              <div>
                <p className="font-bold text-white text-sm">{appt.title}</p>
                <p className="text-xs text-gray-400">{appt.provider_name} · {appt.provider_type}</p>
                {appt.location && <p className="text-xs text-gray-500 mt-0.5">{appt.location}</p>}
                {appt.prep_notes && (
                  <div className="mt-2 bg-[#111] rounded p-2">
                    <p className="text-xs text-gray-500 font-semibold mb-0.5">Prep notes:</p>
                    <p className="text-xs text-gray-400">{appt.prep_notes}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button size="sm" variant="outline" className="border-green-500/30 text-green-400 text-xs" onClick={() => completeMutation.mutate(appt.id)} data-testid={`button-complete-appt-${appt.id}`}>
                <CheckCircle className="h-3.5 w-3.5 mr-1" />Done
              </Button>
              <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(appt.id)} data-testid={`button-delete-appt-${appt.id}`}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-white text-lg">Appointments</h3>
          <p className="text-xs text-gray-400">Push alerts 24h and 1h before each appointment.</p>
        </div>
        <Button size="sm" className="bg-[#C9941A] text-black font-bold gap-1" onClick={() => setShowAdd(true)} data-testid="button-add-appointment">
          <Plus className="h-3.5 w-3.5" />Add
        </Button>
      </div>

      {isLoading ? <p className="text-gray-500 text-sm text-center py-6">Loading...</p> : (
        <>
          {upcoming.length === 0 && past.length === 0 ? (
            <Card className="bg-[#1a1a1a] border-[#333]">
              <CardContent className="p-8 text-center">
                <Calendar className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No appointments tracked yet.</p>
                <p className="text-gray-500 text-xs mt-1">Add your next PT, neuro, or cardio visit.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Upcoming</p>
                  {upcoming.map((a: any) => <ApptCard key={a.id} appt={a} />)}
                </div>
              )}
              {past.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mt-4">Past</p>
                  {past.slice(0, 5).map((a: any) => <ApptCard key={a.id} appt={a} />)}
                </div>
              )}
            </>
          )}
        </>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#C9941A]">Add Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Title *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Neurology Follow-Up" className="bg-[#111] border-[#333] text-white" data-testid="input-appt-title" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Provider name *</label>
                <Input value={form.providerName} onChange={e => setForm(f => ({ ...f, providerName: e.target.value }))} placeholder="Dr. Smith" className="bg-[#111] border-[#333] text-white" data-testid="input-appt-provider" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Provider type</label>
                <Select value={form.providerType} onValueChange={v => setForm(f => ({ ...f, providerType: v }))}>
                  <SelectTrigger className="bg-[#111] border-[#333] text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#333]">
                    {PROVIDER_TYPES.map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Date & time *</label>
              <Input type="datetime-local" value={form.appointmentDate} onChange={e => setForm(f => ({ ...f, appointmentDate: e.target.value }))} className="bg-[#111] border-[#333] text-white" data-testid="input-appt-date" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Location (optional)</label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Clinic address or telehealth" className="bg-[#111] border-[#333] text-white" data-testid="input-appt-location" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Prep notes (questions to ask, what to bring)</label>
              <Textarea value={form.prepNotes} onChange={e => setForm(f => ({ ...f, prepNotes: e.target.value }))} placeholder="Questions for the doctor, recent symptoms to report..." className="bg-[#111] border-[#333] text-white text-sm" rows={3} data-testid="input-appt-prep" />
            </div>
            <Button className="w-full bg-[#C9941A] text-black font-black" onClick={() => addMutation.mutate(form)} disabled={addMutation.isPending || !form.title || !form.providerName || !form.appointmentDate} data-testid="button-submit-appointment">
              {addMutation.isPending ? "Adding..." : "Add Appointment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============== WELLNESS REMINDERS ================

function WellnessTab() {
  const { toast } = useToast();

  const { data: standData } = useQuery<any>({ queryKey: ["/api/wellness/stand-goal"] });
  const { data: hydrationData } = useQuery<any>({ queryKey: ["/api/wellness/hydration-goal"] });
  const { data: exerciseData } = useQuery<any>({ queryKey: ["/api/wellness/exercise-goal"] });

  const logStand = useMutation({
    mutationFn: () => apiRequest("POST", "/api/wellness/stand-log", { duration: 0 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/wellness/stand-goal"] }); toast({ title: "Stand logged!" }); },
  });

  const logHydration = useMutation({
    mutationFn: () => apiRequest("POST", "/api/wellness/hydration-log", { amount: 8 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/wellness/hydration-goal"] }); toast({ title: "Water logged! Brain fuel." }); },
  });

  const logExercise = useMutation({
    mutationFn: () => apiRequest("POST", "/api/wellness/exercise-log", { type: "General", duration: 30, intensity: "moderate" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/wellness/exercise-goal"] }); toast({ title: "Exercise logged! That's a rep. Never Zero." }); },
  });

  const goals = [
    {
      label: "Hydration",
      icon: <Droplet className="h-5 w-5 text-blue-400" />,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      today: `${hydrationData?.todayAmount || 0} oz`,
      goal: `${(hydrationData?.goal?.dailyTarget || 8) * 8} oz goal`,
      note: "Your brain is 75% water. Non-negotiable.",
      onLog: () => logHydration.mutate(),
      isPending: logHydration.isPending,
      testId: "button-log-hydration",
    },
    {
      label: "Exercise",
      icon: <Activity className="h-5 w-5 text-[#C9941A]" />,
      color: "text-[#C9941A]",
      bgColor: "bg-[#C9941A]/10",
      today: `${exerciseData?.todayDuration || 0} min`,
      goal: `${exerciseData?.goal?.dailyMinutes || 30} min goal`,
      note: "One rep is better than zero. Always.",
      onLog: () => logExercise.mutate(),
      isPending: logExercise.isPending,
      testId: "button-log-exercise",
    },
    {
      label: "Standing",
      icon: <Target className="h-5 w-5 text-purple-400" />,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      today: `${standData?.todayCount || 0} stands`,
      goal: `${standData?.goal?.dailyStandTarget || 12} goal`,
      note: "Every stand is a signal to your nervous system.",
      onLog: () => logStand.mutate(),
      isPending: logStand.isPending,
      testId: "button-log-stand",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-black text-white text-lg">Wellness Tracking</h3>
        <p className="text-xs text-gray-400">Log your daily fundamentals. Push reminders keep you on track.</p>
      </div>
      <div className="grid gap-4">
        {goals.map((g) => (
          <Card key={g.label} className="bg-[#1a1a1a] border-[#333]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex gap-3 items-center">
                  <div className={`w-10 h-10 rounded-full ${g.bgColor} flex items-center justify-center flex-shrink-0`}>
                    {g.icon}
                  </div>
                  <div>
                    <p className={`font-black text-sm ${g.color}`}>{g.label}</p>
                    <p className="text-lg font-black text-white">{g.today} <span className="text-sm text-gray-400 font-normal">/ {g.goal}</span></p>
                    <p className="text-xs text-gray-500">{g.note}</p>
                  </div>
                </div>
                <Button size="sm" className="bg-[#C9941A] text-black font-bold" onClick={g.onLog} disabled={g.isPending} data-testid={g.testId}>
                  {g.isPending ? "Logging..." : `Log ${g.label}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============== MAIN PAGE ================

export default function Reminders() {
  const { user } = useAuth();
  const push = usePushNotifications();

  const { data: streakData } = useQuery<any>({
    queryKey: ["/api/recovery/dashboard"],
    retry: false,
  });

  const streak = streakData?.currentStreak || 0;
  const lastCheckin = streakData?.lastCheckin;
  const checkedInToday = streakData?.todayCheckin;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-[#C9941A]" />
            <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Warrior Accountability System</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-1">Accountability Center</h1>
          <p className="text-gray-400 text-sm">
            Push alerts. Medication reminders. Appointment tracking. The Coach watches so you don't slip.
          </p>
        </div>

        {/* Streak bar */}
        <Card className="bg-[#1a1a1a] border-[#333] mb-5">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Flame className="h-6 w-6 text-[#C9941A]" />
                <div>
                  <p className="text-2xl font-black text-[#C9941A]">{streak} <span className="text-sm text-gray-400 font-normal">day streak</span></p>
                  <p className="text-xs text-gray-500">
                    {checkedInToday
                      ? "Checked in today — streak protected."
                      : "Haven't checked in today. Streak at risk."}
                  </p>
                </div>
              </div>
              {!checkedInToday && (
                <Button size="sm" className="bg-[#C9941A] text-black font-bold ml-auto" onClick={() => window.location.href = '/recovery/dashboard?checkin=1'} data-testid="button-checkin-now">
                  Check In Now <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              )}
              {checkedInToday && (
                <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle className="h-3 w-3 mr-1" />Today done
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Push notification status */}
        <div className="mb-6">
          <AccountabilityBanner push={push} />
          <PushStatusCard push={push} />
        </div>

        {/* Main tabs */}
        <Tabs defaultValue="medications">
          <TabsList className="bg-[#1a1a1a] border border-[#333] mb-6 w-full grid grid-cols-3">
            <TabsTrigger value="medications" className="data-[state=active]:bg-[#C9941A] data-[state=active]:text-black font-semibold">
              <Pill className="h-3.5 w-3.5 mr-1.5" />Medications
            </TabsTrigger>
            <TabsTrigger value="appointments" className="data-[state=active]:bg-[#C9941A] data-[state=active]:text-black font-semibold">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />Appointments
            </TabsTrigger>
            <TabsTrigger value="wellness" className="data-[state=active]:bg-[#C9941A] data-[state=active]:text-black font-semibold">
              <Activity className="h-3.5 w-3.5 mr-1.5" />Wellness
            </TabsTrigger>
          </TabsList>

          <TabsContent value="medications">
            <MedicationsTab />
          </TabsContent>
          <TabsContent value="appointments">
            <AppointmentsTab />
          </TabsContent>
          <TabsContent value="wellness">
            <WellnessTab />
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <Card className="bg-[#111] border-[#222] mt-8">
          <CardContent className="p-4 flex gap-3 items-start">
            <AlertCircle className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong className="text-gray-500">Not medical advice.</strong> Medication and appointment tracking is for your personal organization only. 
              Always follow your healthcare provider's instructions. Never change medication schedules without consulting your doctor.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
