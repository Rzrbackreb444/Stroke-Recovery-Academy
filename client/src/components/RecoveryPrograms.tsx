import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, Hand, Mic2, Heart, Activity, Target,
  ArrowRight, Clock, CheckCircle, Star, Users
} from "lucide-react";
import { Link } from "wouter";

const programs = [
  {
    id: "upper-extremity",
    icon: Hand,
    title: "Upper Extremity Protocol",
    subtitle: "Arm & Hand Recovery",
    description: "Evidence-based constraint-induced movement therapy (CIMT) combined with task-specific training to restore arm and hand function.",
    duration: "12-16 weeks",
    sessions: "5x/week",
    level: "All Levels",
    outcomes: ["Improved grip strength", "Fine motor control", "Daily living tasks"],
    featured: true,
    color: "blue",
  },
  {
    id: "gait-balance",
    icon: Activity,
    title: "Gait & Balance Protocol",
    subtitle: "Walking & Stability",
    description: "Progressive mobility training using body-weight supported treadmill therapy and balance exercises.",
    duration: "8-12 weeks",
    sessions: "4x/week",
    level: "Intermediate",
    outcomes: ["Walking endurance", "Balance confidence", "Fall prevention"],
    featured: true,
    color: "green",
  },
  {
    id: "cognitive",
    icon: Brain,
    title: "Cognitive Rehabilitation",
    subtitle: "Memory & Executive Function",
    description: "Structured cognitive exercises targeting attention, memory, problem-solving, and executive functions.",
    duration: "10-14 weeks",
    sessions: "3x/week",
    level: "All Levels",
    outcomes: ["Memory recall", "Attention span", "Decision making"],
    featured: false,
    color: "purple",
  },
  {
    id: "speech",
    icon: Mic2,
    title: "Speech & Language Protocol",
    subtitle: "Communication Recovery",
    description: "Intensive language therapy combining traditional speech exercises with AI-powered practice sessions.",
    duration: "12-20 weeks",
    sessions: "4x/week",
    level: "All Levels",
    outcomes: ["Word finding", "Speech clarity", "Comprehension"],
    featured: false,
    color: "orange",
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
  green: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
};

export default function RecoveryPrograms() {
  return (
    <section id="academy" className="py-20 bg-[#0D0D0D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="bg-[#E2741B]/10 text-[#E2741B] border-[#E2741B]/30 mb-4">
            Evidence-Based Protocols
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Structured Recovery Programs
          </h2>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Clinically-validated rehabilitation protocols designed by rehabilitation specialists, 
            delivered through our AI-enhanced platform for optimal outcomes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {programs.map((program) => {
            const Icon = program.icon;
            const colors = colorClasses[program.color];
            
            return (
              <Card 
                key={program.id}
                className="bg-[#1a1a1a] border-[#333] p-6 hover:border-[#E2741B]/30 transition-all duration-300 group"
                data-testid={`card-program-${program.id}`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-7 w-7 ${colors.text}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white">{program.title}</h3>
                      {program.featured && (
                        <Badge className="bg-[#E2741B]/20 text-[#E2741B] border-[#E2741B]/30 text-xs">
                          <Star className="h-3 w-3 mr-1" /> Popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{program.subtitle}</p>
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-4">{program.description}</p>

                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {program.duration}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Activity className="h-3 w-3" />
                    {program.sessions}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Target className="h-3 w-3" />
                    {program.level}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Expected Outcomes:</p>
                  <div className="flex flex-wrap gap-2">
                    {program.outcomes.map((outcome) => (
                      <Badge key={outcome} variant="outline" className="border-[#333] text-gray-400 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                        {outcome}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Link href={`/recovery/protocols#${program.id}`}>
                  <Button className="w-full bg-[#E2741B]/10 text-[#E2741B] border border-[#E2741B]/30 hover:bg-[#E2741B] hover:text-black transition-all">
                    View Protocol Details
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>

        <Card className="bg-gradient-to-r from-[#E2741B]/10 to-[#1a1a1a] border-[#E2741B]/30 p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="h-6 w-6 text-[#E2741B]" />
            <h3 className="text-2xl font-bold text-white">Personalized Protocol Matching</h3>
          </div>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Not sure which protocol is right for you? Our AI-powered assessment will analyze 
            your specific needs and recommend a personalized recovery plan.
          </p>
          <Link href="/recovery/dashboard">
            <Button className="bg-[#E2741B] text-black font-semibold px-8">
              Get Your Assessment
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </Card>
      </div>
    </section>
  );
}
