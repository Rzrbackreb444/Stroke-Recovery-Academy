import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap, Dumbbell, Brain } from "lucide-react";
import { Link } from "wouter";

const offerings = [
  {
    icon: GraduationCap,
    title: "Recovery Academy",
    description:
      "A 33-chapter structured curriculum covering neuroplasticity, mirror therapy, baseball bat therapy, drop foot protocols, cognitive rehab, and every aspect of full-body stroke recovery.",
    cta: "Explore Courses",
    href: "/recovery/academy",
  },
  {
    icon: Dumbbell,
    title: "Daily Exercises",
    description:
      "34 therapeutic exercises built from Nick's exact recovery methods. Categorized by difficulty and body area. Track your reps, log your progress, and rebuild function systematically.",
    cta: "View Exercises",
    href: "/recovery/exercises",
  },
  {
    icon: Brain,
    title: "Sasquatch Coach",
    description:
      "Your AI recovery accountability companion — shaped by Nick's lived experience and available for reflection whenever you need a manageable next step. It is not clinical care.",
    cta: "Meet Your Coach",
    href: "/recovery/sasquatch-coach",
  },
];

export default function WhatYouGet() {
  return (
    <section className="py-24 bg-[#0D0D0D]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-[#E2741B] text-sm font-semibold uppercase tracking-widest mb-4">
            What You Get
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Everything You Need to Recover
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {offerings.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="border border-[#1e1e1e] rounded-2xl p-8 flex flex-col bg-[#0a0a0a]"
                data-testid={`offering-card-${item.title.toLowerCase().replace(/\s/g, "-")}`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#E2741B]/10 flex items-center justify-center mb-6">
                  <Icon className="h-6 w-6 text-[#E2741B]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-8">
                  {item.description}
                </p>
                <Link href={item.href}>
                  <Button
                    variant="outline"
                    className="w-full border-[#2a2a2a] text-gray-300 hover:border-[#E2741B] hover:text-[#E2741B] transition-colors"
                    data-testid={`button-offering-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {item.cta}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
