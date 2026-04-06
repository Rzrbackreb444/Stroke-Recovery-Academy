import { Play } from "lucide-react";
import { useState } from "react";

const VIDEO_SRC = "/videos/nick-testimony.mp4";
const POSTER_SRC = "/videos/nick-poster.png";

export default function TestimonyVideo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="py-20 bg-[#0D0D0D]" id="testimony">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-[#C9941A] text-sm font-semibold uppercase tracking-widest mb-4">
            Nick's Story
          </p>
          <h2
            className="text-4xl sm:text-5xl font-black text-white mb-4"
            data-testid="text-testimony-title"
          >
            From Paralyzed to Powerful
          </h2>
          <p
            className="text-xl text-gray-400 max-w-2xl mx-auto"
            data-testid="text-testimony-subtitle"
          >
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
                  aria-label="Play Nick's testimony video"
                >
                  <img
                    src={POSTER_SRC}
                    alt="Nick Kremers — click to play testimony"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50" />
                  <div className="relative flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-[#C9941A] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-[#C9941A]/30">
                      <Play className="w-9 h-9 text-black ml-1" />
                    </div>
                    <p className="text-white text-lg font-semibold drop-shadow">
                      Watch Nick's Story
                    </p>
                  </div>
                </button>
              )}
              <video
                controls
                className="w-full h-full object-contain"
                src={VIDEO_SRC}
                poster={POSTER_SRC}
                data-testid="testimony-video"
                onPlay={() => setIsPlaying(true)}
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div
              className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-5 text-center"
              data-testid="stat-card-staples"
            >
              <p className="text-3xl font-black text-[#C9941A] mb-1" data-testid="stat-value-staples">
                50
              </p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Staples in skull
              </p>
            </div>
            <div
              className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-5 text-center"
              data-testid="stat-card-recovery"
            >
              <p className="text-3xl font-black text-[#C9941A] mb-1" data-testid="stat-value-recovery">
                0→90%
              </p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Recovery achieved
              </p>
            </div>
            <div
              className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-5 text-center"
              data-testid="stat-card-years"
            >
              <p className="text-3xl font-black text-[#C9941A] mb-1" data-testid="stat-value-years">
                7+
              </p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Years conquering
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
