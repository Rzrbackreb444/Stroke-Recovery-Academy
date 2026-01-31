import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SEO from "@/components/SEO";
import SasquatchChatWidget from "@/components/recovery/SasquatchChatWidget";
import { 
  Clipboard, CheckCircle2, Clock, Target, Zap, Brain, 
  Hand, Footprints, MessageCircle, Heart, Shield, Trophy
} from "lucide-react";

const protocols = [
  {
    id: "upper-extremity",
    title: "Upper Extremity Recovery Protocol",
    description: "Comprehensive arm and hand rehabilitation program",
    icon: Hand,
    duration: "12 weeks",
    difficulty: "Progressive",
    phases: [
      {
        name: "Phase 1: Awakening (Weeks 1-4)",
        exercises: [
          "Mental imagery and visualization - 10 min daily",
          "Passive range of motion exercises",
          "Mirror therapy - 15 min sessions",
          "Weight bearing through affected arm",
        ],
        goals: ["Increase sensory awareness", "Reduce spasticity", "Establish routine"],
      },
      {
        name: "Phase 2: Activation (Weeks 5-8)",
        exercises: [
          "Active-assisted movements",
          "Grip strengthening exercises",
          "Fine motor activities (picking up objects)",
          "Constraint-induced movement therapy",
        ],
        goals: ["Improve voluntary movement", "Build strength", "Increase function"],
      },
      {
        name: "Phase 3: Integration (Weeks 9-12)",
        exercises: [
          "Bilateral coordination tasks",
          "Functional activities of daily living",
          "Task-specific training",
          "Progressive resistance exercises",
        ],
        goals: ["Integrate into daily life", "Achieve independence", "Maintain gains"],
      },
    ],
  },
  {
    id: "gait-balance",
    title: "Gait & Balance Recovery Protocol",
    description: "Walking, balance, and lower extremity program",
    icon: Footprints,
    duration: "16 weeks",
    difficulty: "Progressive",
    phases: [
      {
        name: "Phase 1: Foundation (Weeks 1-4)",
        exercises: [
          "Seated balance exercises",
          "Weight shifting - side to side",
          "Leg strengthening from seated position",
          "Standing with support",
        ],
        goals: ["Core stability", "Weight bearing tolerance", "Safe standing"],
      },
      {
        name: "Phase 2: Mobility (Weeks 5-10)",
        exercises: [
          "Supported walking (parallel bars/walker)",
          "Step-ups and curb practice",
          "Balance board exercises",
          "Single leg stance progression",
        ],
        goals: ["Independent standing", "Walking with device", "Improved balance"],
      },
      {
        name: "Phase 3: Independence (Weeks 11-16)",
        exercises: [
          "Walking without assistive device",
          "Outdoor terrain navigation",
          "Stair climbing",
          "Community mobility training",
        ],
        goals: ["Community ambulation", "Fall prevention", "Confidence"],
      },
    ],
  },
  {
    id: "cognitive",
    title: "Cognitive Recovery Protocol",
    description: "Memory, attention, and executive function training",
    icon: Brain,
    duration: "Ongoing",
    difficulty: "Adaptive",
    phases: [
      {
        name: "Attention & Focus",
        exercises: [
          "Sustained attention tasks - 15-30 min sessions",
          "Selective attention exercises (filtering distractions)",
          "Divided attention practice (multitasking)",
          "Mindfulness meditation",
        ],
        goals: ["Improve concentration", "Reduce brain fog", "Process information faster"],
      },
      {
        name: "Memory Enhancement",
        exercises: [
          "Visual memory games",
          "Word recall exercises",
          "Story retelling practice",
          "Memory strategies (chunking, association)",
        ],
        goals: ["Short-term recall", "Working memory capacity", "Learning new information"],
      },
      {
        name: "Executive Function",
        exercises: [
          "Problem-solving puzzles",
          "Planning and organizing tasks",
          "Decision-making scenarios",
          "Cognitive flexibility exercises",
        ],
        goals: ["Improved planning", "Better organization", "Flexible thinking"],
      },
    ],
  },
  {
    id: "speech",
    title: "Speech & Language Recovery Protocol",
    description: "Aphasia, dysarthria, and communication program",
    icon: MessageCircle,
    duration: "12+ weeks",
    difficulty: "Individualized",
    phases: [
      {
        name: "Foundation Skills",
        exercises: [
          "Oral motor exercises",
          "Breathing and voice control",
          "Single word practice",
          "Picture naming tasks",
        ],
        goals: ["Clear articulation", "Voice strength", "Word finding"],
      },
      {
        name: "Sentence Building",
        exercises: [
          "Phrase completion",
          "Sentence formulation",
          "Reading aloud practice",
          "Conversation scripts",
        ],
        goals: ["Longer utterances", "Grammar improvement", "Fluency"],
      },
      {
        name: "Functional Communication",
        exercises: [
          "Real-world conversation practice",
          "Phone call training",
          "Social communication skills",
          "Alternative communication strategies",
        ],
        goals: ["Daily communication", "Social participation", "Confidence"],
      },
    ],
  },
];

export default function RecoveryProtocols() {
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <SEO
        title="Recovery Protocols | Stroke Recovery Academy"
        description="Evidence-based stroke recovery protocols for upper extremity, gait, cognitive, and speech rehabilitation."
        canonical="/recovery/protocols"
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3 mb-3">
            <Clipboard className="h-10 w-10 text-[#C9941A]" />
            Recovery Protocols
          </h1>
          <p className="text-gray-400 text-lg">
            Evidence-based rehabilitation programs designed by Nick Kremers
          </p>
        </div>

        <Card className="bg-[#1a1a1a] border-[#C9941A]/30 p-6 mb-8">
          <div className="flex items-start gap-4">
            <Shield className="h-8 w-8 text-[#C9941A] flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold mb-2">Important Disclaimer</h3>
              <p className="text-gray-400 text-sm">
                These protocols are educational guidelines based on Nick's recovery experience. Always work with your healthcare team 
                to create a personalized rehabilitation plan. Your therapists know your specific needs and should guide your recovery.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {protocols.map((protocol) => {
            const Icon = protocol.icon;
            return (
              <Card 
                key={protocol.id} 
                className={`bg-[#1a1a1a] border-[#333] p-6 cursor-pointer transition-all hover:border-[#C9941A]/50 ${selectedProtocol === protocol.id ? 'ring-2 ring-[#C9941A]' : ''}`}
                onClick={() => setSelectedProtocol(selectedProtocol === protocol.id ? null : protocol.id)}
                data-testid={`card-protocol-${protocol.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#C9941A]/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-6 w-6 text-[#C9941A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1">{protocol.title}</h3>
                    <p className="text-gray-400 text-sm mb-3">{protocol.description}</p>
                    <div className="flex items-center gap-4">
                      <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30">
                        <Clock className="h-3 w-3 mr-1" />
                        {protocol.duration}
                      </Badge>
                      <Badge variant="outline" className="border-[#333] text-gray-400">
                        {protocol.difficulty}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {selectedProtocol && (
          <Card className="bg-[#1a1a1a] border-[#333] p-6">
            {protocols.filter(p => p.id === selectedProtocol).map((protocol) => (
              <div key={protocol.id}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <protocol.icon className="h-8 w-8 text-[#C9941A]" />
                  {protocol.title}
                </h2>

                <Accordion type="single" collapsible className="space-y-4">
                  {protocol.phases.map((phase, idx) => (
                    <AccordionItem key={idx} value={`phase-${idx}`} className="border border-[#333] rounded-lg bg-[#0D0D0D]">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#C9941A]/20 flex items-center justify-center text-[#C9941A] font-bold">
                            {idx + 1}
                          </div>
                          <span className="font-semibold">{phase.name}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="grid md:grid-cols-2 gap-6 mt-4">
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Zap className="h-4 w-4 text-[#C9941A]" />
                              Exercises
                            </h4>
                            <ul className="space-y-2">
                              {phase.exercises.map((exercise, i) => (
                                <li key={i} className="flex items-start gap-2 text-gray-300">
                                  <CheckCircle2 className="h-4 w-4 text-[#C9941A] mt-0.5 flex-shrink-0" />
                                  {exercise}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Target className="h-4 w-4 text-[#C9941A]" />
                              Goals
                            </h4>
                            <ul className="space-y-2">
                              {phase.goals.map((goal, i) => (
                                <li key={i} className="flex items-start gap-2 text-gray-300">
                                  <Trophy className="h-4 w-4 text-[#C9941A] mt-0.5 flex-shrink-0" />
                                  {goal}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <div className="mt-6 p-4 bg-[#0D0D0D] rounded-lg border border-[#333]">
                  <p className="text-gray-400 text-sm">
                    <strong className="text-white">Pro Tip:</strong> Log your progress daily using our tracking tools. 
                    Coach Nick is available 24/7 to answer questions and provide encouragement on your journey.
                  </p>
                </div>
              </div>
            ))}
          </Card>
        )}
      </main>

      <SasquatchChatWidget />
    </div>
  );
}
