import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Target } from "lucide-react";
import { Link } from "wouter";
import { yearsSinceStroke } from "@shared/strokeAnniversary";
import baseballBatImage from "@assets/generated_images/baseball_bat_therapy_equipment.png";
import mirrorTherapyImage from "@assets/generated_images/mirror_therapy_exercise.png";
import dropFootImage from "@assets/generated_images/drop_foot_recovery_protocol.png";

const exercises = [
  {
    title: "Baseball Bat Therapy",
    description:
      "Nick's signature technique that outperformed $15,000 clinical equipment. A $5 Walmart bat and relentless repetition — the secret weapon for arm and balance recovery.",
    difficulty: "Intermediate" as const,
    bodyArea: ["Arm", "Balance", "Proprioception"],
    duration: "15–20 min",
    imageUrl: baseballBatImage,
    href: "/recovery/exercises",
  },
  {
    title: "Mirror Therapy",
    description:
      "20-minute intensive sessions vs. the standard 5-minute clinical protocol. Visual-motor cortex retraining that tricks your brain into rebuilding lost neural pathways.",
    difficulty: "Beginner" as const,
    bodyArea: ["Hand", "Arm", "Neuroplasticity"],
    duration: "20 min",
    imageUrl: mirrorTherapyImage,
    href: "/recovery/exercises",
  },
  {
    title: "Drop Foot Protocol",
    description:
      "From AFO dependence to independent walking — foam wedges, calf stretches, progressive weight-bearing. The complete system Nick used to eliminate drop foot.",
    difficulty: "Advanced" as const,
    bodyArea: ["Leg", "Ankle", "Gait"],
    duration: "30 min",
    imageUrl: dropFootImage,
    href: "/recovery/exercises",
  },
];

const difficultyColor: Record<string, string> = {
  Beginner: "bg-green-500/10 text-green-400 border-green-500/20",
  Intermediate: "bg-[#E2741B]/10 text-[#E2741B] border-[#E2741B]/20",
  Advanced: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function FeaturedExercises() {
  return (
    <section className="py-20 bg-[#0D0D0D]" id="exercises">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-[#E2741B] text-sm font-semibold uppercase tracking-widest mb-4" data-testid="badge-exercises-category">
            Breakthrough Techniques
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4" data-testid="text-exercises-title">
            The Recovery Arsenal
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto" data-testid="text-exercises-subtitle">
            Battle-tested methods that took Nick from 0% to 90% function.
            Every technique refined over {yearsSinceStroke()} years of real recovery.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {exercises.map((exercise) => (
            <div
              key={exercise.title}
              className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden flex flex-col"
              data-testid={`card-exercise-${exercise.title.toLowerCase().replace(/\s/g, '-')}`}
            >
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={exercise.imageUrl}
                  alt={exercise.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={`text-xs border ${difficultyColor[exercise.difficulty]}`}>
                    {exercise.difficulty}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {exercise.duration}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{exercise.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed flex-1">{exercise.description}</p>
                <div className="flex flex-wrap gap-2 mt-4 mb-5">
                  {exercise.bodyArea.map((area) => (
                    <span key={area} className="flex items-center gap-1 text-xs text-gray-500">
                      <Target className="h-3 w-3" /> {area}
                    </span>
                  ))}
                </div>
                <Link href={exercise.href}>
                  <Button className="w-full bg-[#E2741B]/10 text-[#E2741B] border border-[#E2741B]/30 hover:bg-[#E2741B] hover:text-black transition-all">
                    View Exercise
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/recovery/exercises">
            <Button variant="outline" className="border-[#333] text-white px-8">
              View All 34 Exercises
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
