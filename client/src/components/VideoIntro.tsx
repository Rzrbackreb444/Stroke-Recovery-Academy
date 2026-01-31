import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink } from "lucide-react";

export default function VideoIntro() {
  return (
    <section className="py-16 bg-[#0D0D0D]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Welcome to <span className="text-[#C9941A]">Stroke Recovery Academy</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Watch how we're transforming stroke recovery with cutting-edge AI and proven methodologies
          </p>
        </div>

        <Card className="bg-[#1a1a1a] border-[#C9941A]/30 overflow-hidden shadow-2xl shadow-black/50">
          <div className="relative aspect-video w-full bg-gradient-to-br from-[#C9941A]/20 to-[#0D0D0D]">
            <iframe
              src="https://sora.chatgpt.com/p/s_697e051ba6308191a6bf2587f97d766f?psh=HXVzZXItTW1WY3BQd0hPS205aFpneldpMEdoempZ.5kP0dGYeVJHu"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Stroke Recovery Academy Introduction"
              data-testid="video-intro-iframe"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 rounded-full bg-[#C9941A]/80 flex items-center justify-center">
                <Play className="h-10 w-10 text-black ml-1" />
              </div>
            </div>
          </div>
          <div className="p-4 text-center border-t border-[#333]">
            <Button 
              variant="ghost" 
              className="text-[#C9941A]"
              onClick={() => window.open("https://sora.chatgpt.com/p/s_697e051ba6308191a6bf2587f97d766f?psh=HXVzZXItTW1WY3BQd0hPS205aFpneldpMEdoempZ.5kP0dGYeVJHu", "_blank")}
              data-testid="button-watch-video"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Watch Full Video
            </Button>
          </div>
        </Card>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="text-3xl font-bold text-[#C9941A]">90%</div>
            <div className="text-gray-400 text-sm">Recovery Rate</div>
          </div>
          <div className="p-4">
            <div className="text-3xl font-bold text-[#C9941A]">24/7</div>
            <div className="text-gray-400 text-sm">AI Coach Support</div>
          </div>
          <div className="p-4">
            <div className="text-3xl font-bold text-[#C9941A]">1000+</div>
            <div className="text-gray-400 text-sm">Survivors Helped</div>
          </div>
        </div>
      </div>
    </section>
  );
}
