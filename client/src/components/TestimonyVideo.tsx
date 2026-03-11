import { Play } from "lucide-react";
import { useState } from "react";
import testimonyVideo from "@assets/Nick Testimony_1763787525256.mp4";
import videoPoster from "@assets/Nick king_1763787525256.png";

export default function TestimonyVideo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="py-20 bg-[#0D0D0D]" id="testimony">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-[#C9941A] text-sm font-semibold uppercase tracking-widest mb-4">
            Nick's Story
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4" data-testid="text-testimony-title">
            From Paralyzed to Powerful
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto" data-testid="text-testimony-subtitle">
            Watch Nick's raw, unfiltered testimony of survival, struggle, and ultimate
            triumph over a massive hemorrhagic stroke.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden bg-[#111] border border-[#222]">
            <div className="relative aspect-video">
              {!isPlaying && (
                <button
                  className="absolute inset-0 flex items-center justify-center group w-full z-10"
                  onClick={() => setIsPlaying(true)}
                  data-testid="button-play-video"
                  aria-label="Play testimony video"
                >
                  <img
                    src={videoPoster}
                    alt="Nick Kremers testimony"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-[#C9941A] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-[#C9941A]/30">
                      <Play className="w-9 h-9 text-black ml-1" />
                    </div>
                    <p className="text-white text-lg font-semibold">
                      Watch Nick's Testimony
                    </p>
                  </div>
                </button>
              )}
              <video
                controls
                className="w-full h-full object-contain"
                src={testimonyVideo}
                poster={videoPoster}
                data-testid="testimony-video"
                onPlay={() => setIsPlaying(true)}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-[#111] border border-[#222] rounded-xl p-6 text-center" data-testid="stat-card-staples">
              <div className="text-4xl font-black text-[#C9941A] mb-2" data-testid="stat-value-staples">50</div>
              <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide" data-testid="stat-label-staples">
                Staples in skull
              </div>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-xl p-6 text-center" data-testid="stat-card-recovery">
              <div className="text-4xl font-black text-[#C9941A] mb-2" data-testid="stat-value-recovery">0→90%</div>
              <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide" data-testid="stat-label-recovery">
                Recovery achieved
              </div>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-xl p-6 text-center" data-testid="stat-card-years">
              <div className="text-4xl font-black text-[#C9941A] mb-2" data-testid="stat-value-years">7+</div>
              <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide" data-testid="stat-label-years">
                Years conquering
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
