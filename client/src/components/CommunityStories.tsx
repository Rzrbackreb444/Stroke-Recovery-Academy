import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Nick's baseball bat therapy changed everything for me. When my therapists said I'd never regain arm function, his methods proved them wrong. I'm back to playing guitar after 2 years.",
    name: "Sarah M.",
    detail: "2 Years Post-Stroke · 75% Recovery",
    initials: "SM",
  },
  {
    quote:
      "The mirror therapy protocol is genius. 20 minutes a day for 6 months and I went from no hand movement to typing emails. The medical system gave up on me, but Nick's methods didn't.",
    name: "James C.",
    detail: "3 Years Post-Stroke · 65% Recovery",
    initials: "JC",
  },
  {
    quote:
      "I was stuck at 30% recovery for 18 months. Nick's plateau-busting techniques and environmental variation broke through. Now I'm at 80% and still improving. The impossible became inevitable.",
    name: "Maria R.",
    detail: "4 Years Post-Stroke · 80% Recovery",
    initials: "MR",
  },
];

export default function CommunityStories() {
  return (
    <section className="py-20 bg-[#0D0D0D]" id="community">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-[#E2741B] text-sm font-semibold uppercase tracking-widest mb-4" data-testid="badge-community-category">
            Success Stories
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4" data-testid="text-community-title">
            The Recovery Revolution
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto" data-testid="text-community-subtitle">
            50,000+ stroke survivors refusing to accept limitations.
            Your recovery matters. Your story matters.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-7 flex flex-col"
              data-testid={`testimonial-card-${index}`}
            >
              <Quote className="h-8 w-8 text-[#E2741B]/40 mb-4 flex-shrink-0" />
              <p className="text-gray-300 text-base leading-relaxed flex-1 mb-6">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3 border-t border-[#1e1e1e] pt-5">
                <div className="w-10 h-10 rounded-full bg-[#E2741B] flex items-center justify-center flex-shrink-0">
                  <span className="text-black text-xs font-black">{testimonial.initials}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{testimonial.name}</p>
                  <p className="text-gray-500 text-xs">{testimonial.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
