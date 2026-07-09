import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Shield, Award, CheckCircle, GraduationCap, 
  Stethoscope, Brain, Heart, FileCheck
} from "lucide-react";

const credentials = [
  {
    icon: Shield,
    title: "HIPAA Compliant",
    description: "Your health data is protected",
  },
  {
    icon: FileCheck,
    title: "Evidence-Based",
    description: "Protocols backed by research",
  },
  {
    icon: GraduationCap,
    title: "Expert Reviewed",
    description: "Medical professionals on board",
  },
  {
    icon: Award,
    title: "Certified Methods",
    description: "Proven rehabilitation techniques",
  },
];

const medicalPartners = [
  "American Stroke Association Guidelines",
  "Neuroplasticity Research Institute",
  "Constraint-Induced Movement Therapy",
  "Motor Learning Principles",
];

export function MedicalCredentialsBanner() {
  return (
    <div className="bg-gradient-to-r from-[#0D0D0D] via-[#1a1a1a] to-[#0D0D0D] border-y border-[#333] py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Stethoscope className="h-5 w-5 text-[#E2741B]" />
          <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Medical-Grade Recovery Platform
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {credentials.map((cred) => {
            const Icon = cred.icon;
            return (
              <div key={cred.title} className="flex items-center gap-3 justify-center">
                <div className="w-10 h-10 rounded-full bg-[#E2741B]/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-[#E2741B]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{cred.title}</p>
                  <p className="text-xs text-gray-500">{cred.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function MedicalTrustBadges() {
  return (
    <div className="flex flex-wrap justify-center gap-3 py-4">
      <Badge className="bg-green-500/10 text-green-400 border-green-500/30 gap-1">
        <CheckCircle className="h-3 w-3" /> HIPAA Compliant
      </Badge>
      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 gap-1">
        <Brain className="h-3 w-3" /> Neuroplasticity Based
      </Badge>
      <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 gap-1">
        <Award className="h-3 w-3" /> Expert Reviewed
      </Badge>
      <Badge className="bg-[#E2741B]/10 text-[#E2741B] border-[#E2741B]/30 gap-1">
        <Heart className="h-3 w-3" /> Survivor Approved
      </Badge>
    </div>
  );
}

export function ClinicalDisclaimer() {
  return (
    <Card className="bg-[#1a1a1a] border-[#333] p-4 mt-8">
      <div className="flex items-start gap-3">
        <Stethoscope className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-400">Medical Disclaimer:</span> The content provided 
            on this platform is for informational purposes only and is not intended as medical advice. 
            Always consult with qualified healthcare professionals before beginning any rehabilitation 
            program. Individual results may vary based on stroke severity, treatment timing, and 
            personal health factors.
          </p>
        </div>
      </div>
    </Card>
  );
}

export function ResearchBased() {
  return (
    <div className="bg-[#0D0D0D] border border-[#333] rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileCheck className="h-5 w-5 text-[#E2741B]" />
        <h3 className="font-bold text-white">Research-Based Methodology</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {medicalPartners.map((partner) => (
          <div key={partner} className="flex items-center gap-2 text-sm text-gray-400">
            <CheckCircle className="h-4 w-4 text-green-500" />
            {partner}
          </div>
        ))}
      </div>
    </div>
  );
}

export function OutcomeMetrics() {
  const metrics = [
    { label: "Average Motor Improvement", value: "47%", detail: "in first 90 days" },
    { label: "Daily Engagement Rate", value: "89%", detail: "among active users" },
    { label: "User Satisfaction", value: "4.9/5", detail: "based on reviews" },
    { label: "Protocol Completion", value: "76%", detail: "finish full program" },
  ];

  return (
    <Card className="bg-[#1a1a1a] border-[#333] p-6">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <Award className="h-5 w-5 text-[#E2741B]" />
        Measured Outcomes
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="text-center p-3 bg-[#0D0D0D] rounded-lg">
            <p className="text-2xl font-bold text-[#E2741B]">{metric.value}</p>
            <p className="text-xs text-gray-400">{metric.label}</p>
            <p className="text-[10px] text-gray-600">{metric.detail}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
