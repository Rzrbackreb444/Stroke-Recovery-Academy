import { CheckCircle2 } from "lucide-react";

const milestones = [
  {
    year: "Day 1",
    title: "December 3, 2018",
    description: "Massive hemorrhagic stroke. 50 staples. 0% left side function. Hoyer lift dependency.",
    percentage: 0,
  },
  {
    year: "Year 1",
    title: "The Foundation",
    description: "Learned basic transfers. Started mirror therapy. Discovered baseball bat method. Built mental resilience.",
    percentage: 15,
  },
  {
    year: "Year 2",
    title: "Breaking Through",
    description: "First independent steps. Hand opening protocols. Plateau-busting environmental variation techniques.",
    percentage: 35,
  },
  {
    year: "Year 3",
    title: "Accelerating",
    description: "Walking without AFO. Typing with both hands. Baseball bat mastery. Business launch preparation.",
    percentage: 55,
  },
  {
    year: "Year 4–6",
    title: "The Revolution",
    description: "Memory processing doubled. Advanced protocols refined. 50,000+ survivors helped. Business thriving.",
    percentage: 90,
  },
];

export default function ProgressTimeline() {
  return (
    <section className="py-20 bg-[#080808]" id="journey">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-[#C9941A] text-sm font-semibold uppercase tracking-widest mb-4">
            The Impossible Journey
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4" data-testid="text-timeline-title">
            From 0% to 90% Recovery
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto" data-testid="text-timeline-subtitle">
            Every breakthrough moment documented. Proof that recovery never stops with the right approach.
          </p>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-[#222] md:-translate-x-1/2" />

          <div className="space-y-10">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`relative flex gap-8 ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                data-testid={`milestone-${index}`}
              >
                {/* Spacer for alternating layout */}
                <div className="flex-1 hidden md:block" />

                {/* Center node */}
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#C9941A] flex items-center justify-center z-10 flex-shrink-0">
                  <span className="text-xs font-black text-black leading-none">
                    {milestone.percentage}%
                  </span>
                </div>

                {/* Card */}
                <div className="flex-1 ml-16 md:ml-0 bg-[#111] border border-[#1e1e1e] rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#C9941A] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[#C9941A] text-xs font-semibold uppercase tracking-widest">
                        {milestone.year}
                      </span>
                      <h3 className="text-xl font-bold text-white mt-1 mb-2">{milestone.title}</h3>
                      <p className="text-gray-400 leading-relaxed text-sm">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
