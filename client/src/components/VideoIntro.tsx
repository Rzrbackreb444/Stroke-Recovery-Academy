import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, ExternalLink, Brain, Activity, Clock, Award } from "lucide-react";

const methodologyPoints = [
  { icon: Brain, title: "Neuroplasticity", desc: "Evidence-based brain rewiring" },
  { icon: Activity, title: "Progressive Overload", desc: "Systematic intensity scaling" },
  { icon: Clock, title: "Repetition Dosing", desc: "Optimal practice frequency" },
  { icon: Award, title: "Task-Specific", desc: "Functional movement training" },
];

export default function VideoIntro() {
  return (
    <section className="py-20 bg-gradient-to-b from-[#0D0D0D] to-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 mb-4">
              Clinical Methodology
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Science-Backed Recovery Framework
            </h2>
            <p className="text-gray-400 text-lg mb-6">
              Our protocols are built on the latest neuroscience research, combining 
              constraint-induced movement therapy, motor learning principles, and 
              AI-enhanced feedback loops.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {methodologyPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <div key={point.title} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#C9941A]/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-[#C9941A]" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{point.title}</p>
                      <p className="text-xs text-gray-500">{point.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button 
              className="bg-[#C9941A] text-black font-semibold"
              onClick={() => document.getElementById('academy')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Our Protocols
            </Button>
          </div>

          <div>
            <Card className="bg-[#1a1a1a] border-[#333] overflow-hidden shadow-2xl shadow-black/50">
              <div className="relative aspect-video w-full bg-gradient-to-br from-[#C9941A]/10 to-[#0D0D0D]">
                <iframe
                  src="https://sora.chatgpt.com/p/s_697e051ba6308191a6bf2587f97d766f?psh=HXVzZXItTW1WY3BQd0hPS205aFpneldpMEdoempZ.5kP0dGYeVJHu"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Stroke Recovery Academy Introduction"
                  data-testid="video-intro-iframe"
                />
              </div>
              <div className="p-4 border-t border-[#333] flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Platform Overview</p>
                  <p className="text-xs text-gray-500">4 min introduction</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-[#C9941A]"
                  onClick={() => window.open("https://sora.chatgpt.com/p/s_697e051ba6308191a6bf2587f97d766f?psh=HXVzZXItTW1WY3BQd0hPS205aFpneldpMEdoempZ.5kP0dGYeVJHu", "_blank")}
                  data-testid="button-watch-video"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Full Screen
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
