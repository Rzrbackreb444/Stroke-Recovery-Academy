import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RecoveryHeader from "@/components/RecoveryHeader";
import { 
  Pill, Calendar, Activity, Plus, Heart, Thermometer, 
  Clock, Stethoscope, AlertCircle, CheckCircle2
} from "lucide-react";

const providerTypes = [
  { value: "neurologist", label: "Neurologist" },
  { value: "pcp", label: "Primary Care" },
  { value: "pt", label: "Physical Therapy" },
  { value: "ot", label: "Occupational Therapy" },
  { value: "speech", label: "Speech Therapy" },
  { value: "cardiologist", label: "Cardiologist" },
  { value: "psychiatrist", label: "Psychiatrist" },
  { value: "other", label: "Other" },
];

const frequencies = [
  { value: "once_daily", label: "Once Daily" },
  { value: "twice_daily", label: "Twice Daily" },
  { value: "three_times_daily", label: "Three Times Daily" },
  { value: "as_needed", label: "As Needed" },
  { value: "weekly", label: "Weekly" },
  { value: "other", label: "Other" },
];

export default function MedicalLog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("medications");
  const [medDialogOpen, setMedDialogOpen] = useState(false);
  const [apptDialogOpen, setApptDialogOpen] = useState(false);
  const [vitalsDialogOpen, setVitalsDialogOpen] = useState(false);

  const [medForm, setMedForm] = useState({
    name: "",
    dosage: "",
    frequency: "",
    purpose: "",
    prescribedBy: "",
    notes: "",
  });

  const [apptForm, setApptForm] = useState({
    title: "",
    providerName: "",
    providerType: "",
    location: "",
    appointmentDate: "",
    duration: 60,
    notes: "",
    prepNotes: "",
  });

  const [vitalsForm, setVitalsForm] = useState({
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    heartRate: "",
    weight: "",
    bloodSugar: "",
    oxygenLevel: "",
    painLevel: 0,
    sleepHours: "",
    sleepQuality: 3,
    notes: "",
  });

  const { data: medicalData, isLoading } = useQuery<any>({
    queryKey: ["/api/recovery/medical-log"],
  });

  const addMedicationMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/recovery/medications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/medical-log"] });
      setMedDialogOpen(false);
      setMedForm({ name: "", dosage: "", frequency: "", purpose: "", prescribedBy: "", notes: "" });
      toast({ title: "Medication added!" });
    },
    onError: () => toast({ title: "Error", description: "Could not add medication", variant: "destructive" }),
  });

  const addAppointmentMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/recovery/appointments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/medical-log"] });
      setApptDialogOpen(false);
      setApptForm({ title: "", providerName: "", providerType: "", location: "", appointmentDate: "", duration: 60, notes: "", prepNotes: "" });
      toast({ title: "Appointment added!" });
    },
    onError: () => toast({ title: "Error", description: "Could not add appointment", variant: "destructive" }),
  });

  const logVitalsMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/recovery/vitals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/medical-log"] });
      setVitalsDialogOpen(false);
      setVitalsForm({ bloodPressureSystolic: "", bloodPressureDiastolic: "", heartRate: "", weight: "", bloodSugar: "", oxygenLevel: "", painLevel: 0, sleepHours: "", sleepQuality: 3, notes: "" });
      toast({ title: "Vitals logged!" });
    },
    onError: () => toast({ title: "Error", description: "Could not log vitals", variant: "destructive" }),
  });

  const medications = medicalData?.medications || [];
  const appointments = medicalData?.appointments || [];
  const vitals = medicalData?.vitals || [];

  return (
    <div className="min-h-screen bg-black text-white">
      <RecoveryHeader />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-orange-500" />
              Medical Log
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Track medications, appointments, and vitals all in one place
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-zinc-900 border-zinc-800 mb-6">
            <TabsTrigger value="medications" className="data-[state=active]:bg-orange-500">
              <Pill className="h-4 w-4 mr-2" />
              Medications
            </TabsTrigger>
            <TabsTrigger value="appointments" className="data-[state=active]:bg-orange-500">
              <Calendar className="h-4 w-4 mr-2" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="vitals" className="data-[state=active]:bg-orange-500">
              <Activity className="h-4 w-4 mr-2" />
              Vitals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="medications">
            <div className="flex justify-end mb-4">
              <Dialog open={medDialogOpen} onOpenChange={setMedDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600" data-testid="button-add-medication">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medication
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                  <DialogHeader>
                    <DialogTitle>Add Medication</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Medication Name *</Label>
                      <Input
                        placeholder="e.g., Aspirin, Lipitor..."
                        value={medForm.name}
                        onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Dosage *</Label>
                        <Input
                          placeholder="e.g., 100mg"
                          value={medForm.dosage}
                          onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
                          className="bg-zinc-800 border-zinc-700 mt-1"
                        />
                      </div>
                      <div>
                        <Label>Frequency *</Label>
                        <Select value={medForm.frequency} onValueChange={(v) => setMedForm({ ...medForm, frequency: v })}>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800">
                            {frequencies.map((f) => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Purpose</Label>
                      <Input
                        placeholder="What is this medication for?"
                        value={medForm.purpose}
                        onChange={(e) => setMedForm({ ...medForm, purpose: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 mt-1"
                      />
                    </div>
                    <div>
                      <Label>Prescribed By</Label>
                      <Input
                        placeholder="Doctor's name"
                        value={medForm.prescribedBy}
                        onChange={(e) => setMedForm({ ...medForm, prescribedBy: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 mt-1"
                      />
                    </div>
                    <Button 
                      onClick={() => addMedicationMutation.mutate(medForm)} 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      disabled={!medForm.name || !medForm.dosage || !medForm.frequency || addMedicationMutation.isPending}
                    >
                      {addMedicationMutation.isPending ? "Adding..." : "Add Medication"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {medications.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
                <Pill className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No medications tracked</h3>
                <p className="text-gray-400">Add your medications to keep track of your prescriptions.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {medications.map((med: any) => (
                  <Card key={med.id} className="bg-zinc-900 border-zinc-800 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-orange-500" />
                          <span className="font-semibold">{med.name}</span>
                          <Badge variant="outline" className="border-zinc-700">{med.dosage}</Badge>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">
                          {frequencies.find(f => f.value === med.frequency)?.label}
                          {med.purpose && ` • ${med.purpose}`}
                        </p>
                      </div>
                      {med.is_active ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="border-zinc-700">Inactive</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="appointments">
            <div className="flex justify-end mb-4">
              <Dialog open={apptDialogOpen} onOpenChange={setApptDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600" data-testid="button-add-appointment">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                  <DialogHeader>
                    <DialogTitle>Schedule Appointment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Appointment Title *</Label>
                      <Input
                        placeholder="e.g., PT Session, Neuro Follow-up"
                        value={apptForm.title}
                        onChange={(e) => setApptForm({ ...apptForm, title: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Provider Name *</Label>
                        <Input
                          placeholder="Dr. Smith"
                          value={apptForm.providerName}
                          onChange={(e) => setApptForm({ ...apptForm, providerName: e.target.value })}
                          className="bg-zinc-800 border-zinc-700 mt-1"
                        />
                      </div>
                      <div>
                        <Label>Provider Type *</Label>
                        <Select value={apptForm.providerType} onValueChange={(v) => setApptForm({ ...apptForm, providerType: v })}>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800">
                            {providerTypes.map((p) => (
                              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Date & Time *</Label>
                      <Input
                        type="datetime-local"
                        value={apptForm.appointmentDate}
                        onChange={(e) => setApptForm({ ...apptForm, appointmentDate: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 mt-1"
                      />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input
                        placeholder="Clinic address or 'Virtual'"
                        value={apptForm.location}
                        onChange={(e) => setApptForm({ ...apptForm, location: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 mt-1"
                      />
                    </div>
                    <div>
                      <Label>Prep Notes (Questions to ask, things to bring)</Label>
                      <Textarea
                        placeholder="What do you need to remember for this appointment?"
                        value={apptForm.prepNotes}
                        onChange={(e) => setApptForm({ ...apptForm, prepNotes: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 mt-1"
                        rows={2}
                      />
                    </div>
                    <Button 
                      onClick={() => addAppointmentMutation.mutate(apptForm)} 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      disabled={!apptForm.title || !apptForm.providerName || !apptForm.providerType || !apptForm.appointmentDate || addAppointmentMutation.isPending}
                    >
                      {addAppointmentMutation.isPending ? "Adding..." : "Add Appointment"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {appointments.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
                <Calendar className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No appointments scheduled</h3>
                <p className="text-gray-400">Add your upcoming appointments to stay organized.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt: any) => (
                  <Card key={appt.id} className="bg-zinc-900 border-zinc-800 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-orange-500" />
                          <span className="font-semibold">{appt.title}</span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">
                          {appt.provider_name} ({providerTypes.find(p => p.value === appt.provider_type)?.label})
                        </p>
                        {appt.location && <p className="text-gray-500 text-sm">{appt.location}</p>}
                      </div>
                      <div className="text-right">
                        <div className="text-orange-400 font-medium">
                          {new Date(appt.appointment_date).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500 text-sm">
                          {new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="vitals">
            <div className="flex justify-end mb-4">
              <Dialog open={vitalsDialogOpen} onOpenChange={setVitalsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600" data-testid="button-log-vitals">
                    <Plus className="h-4 w-4 mr-2" />
                    Log Vitals
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Log Today's Vitals</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Blood Pressure (Systolic)</Label>
                        <Input
                          type="number"
                          placeholder="120"
                          value={vitalsForm.bloodPressureSystolic}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressureSystolic: e.target.value })}
                          className="bg-zinc-800 border-zinc-700 mt-1"
                        />
                      </div>
                      <div>
                        <Label>Blood Pressure (Diastolic)</Label>
                        <Input
                          type="number"
                          placeholder="80"
                          value={vitalsForm.bloodPressureDiastolic}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressureDiastolic: e.target.value })}
                          className="bg-zinc-800 border-zinc-700 mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Heart Rate (BPM)</Label>
                        <Input
                          type="number"
                          placeholder="72"
                          value={vitalsForm.heartRate}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: e.target.value })}
                          className="bg-zinc-800 border-zinc-700 mt-1"
                        />
                      </div>
                      <div>
                        <Label>Weight (lbs)</Label>
                        <Input
                          placeholder="165"
                          value={vitalsForm.weight}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                          className="bg-zinc-800 border-zinc-700 mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Blood Sugar (mg/dL)</Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={vitalsForm.bloodSugar}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, bloodSugar: e.target.value })}
                          className="bg-zinc-800 border-zinc-700 mt-1"
                        />
                      </div>
                      <div>
                        <Label>Oxygen Level (%)</Label>
                        <Input
                          type="number"
                          placeholder="98"
                          value={vitalsForm.oxygenLevel}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, oxygenLevel: e.target.value })}
                          className="bg-zinc-800 border-zinc-700 mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Sleep Hours</Label>
                        <Input
                          placeholder="7.5"
                          value={vitalsForm.sleepHours}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, sleepHours: e.target.value })}
                          className="bg-zinc-800 border-zinc-700 mt-1"
                        />
                      </div>
                      <div>
                        <Label>Pain Level (0-10)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          placeholder="0"
                          value={vitalsForm.painLevel}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, painLevel: parseInt(e.target.value) || 0 })}
                          className="bg-zinc-800 border-zinc-700 mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        placeholder="Any observations about how you're feeling..."
                        value={vitalsForm.notes}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 mt-1"
                        rows={2}
                      />
                    </div>
                    <Button 
                      onClick={() => logVitalsMutation.mutate(vitalsForm)} 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      disabled={logVitalsMutation.isPending}
                    >
                      {logVitalsMutation.isPending ? "Saving..." : "Log Vitals"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {vitals.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
                <Activity className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No vitals logged</h3>
                <p className="text-gray-400">Track your daily vitals to monitor your health.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {vitals.map((v: any) => (
                  <Card key={v.id} className="bg-zinc-900 border-zinc-800 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400 text-sm">
                        {new Date(v.measured_at).toLocaleDateString()} at {new Date(v.measured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {v.blood_pressure_systolic && v.blood_pressure_diastolic && (
                        <div>
                          <div className="text-gray-400 text-xs">Blood Pressure</div>
                          <div className="text-lg font-semibold text-orange-400">
                            {v.blood_pressure_systolic}/{v.blood_pressure_diastolic}
                          </div>
                        </div>
                      )}
                      {v.heart_rate && (
                        <div>
                          <div className="text-gray-400 text-xs">Heart Rate</div>
                          <div className="text-lg font-semibold">{v.heart_rate} bpm</div>
                        </div>
                      )}
                      {v.weight && (
                        <div>
                          <div className="text-gray-400 text-xs">Weight</div>
                          <div className="text-lg font-semibold">{v.weight} lbs</div>
                        </div>
                      )}
                      {v.oxygen_level && (
                        <div>
                          <div className="text-gray-400 text-xs">O2 Level</div>
                          <div className="text-lg font-semibold">{v.oxygen_level}%</div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
