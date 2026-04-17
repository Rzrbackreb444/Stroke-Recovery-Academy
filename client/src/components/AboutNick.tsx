import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import nickPhoto from "@assets/IMG_4824_1776397947955.jpeg";

const achievements = [
  "Survived a massive hemorrhagic stroke with 50 staples in his skull",
  "Went from 0% left-side function to 90% full recovery",
  "Created breakthrough methods not found in any medical textbook",
  "Built a thriving recovery business while still recovering",
  "Helped 50,000+ stroke survivors worldwide",
];

export default function AboutNick() {
  return (
    <section className="py-20 bg-[#080808]" id="about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-14 items-center">

          {/* Photo */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden">
              <img
                src={nickPhoto}
                alt="Nick Kremers — The Stroked Out Sasquatch, stroke survivor and recovery coach"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-[#C9941A] text-black rounded-xl p-4 max-w-[180px]">
              <p className="text-2xl font-black">6+ Years</p>
              <p className="text-sm font-medium">of proven recovery</p>
            </div>
          </div>

          {/* Copy */}
          <div>
            <p className="text-[#C9941A] text-sm font-semibold uppercase tracking-widest mb-4" data-testid="badge-about-category">
              From Wheelchair to Warrior
            </p>
            <h2
              className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight"
              data-testid="text-about-title"
            >
              Meet Nick<br />
              <span className="text-[#C9941A]">"The Stroked Out<br />Sasquatch"</span> Kremers
            </h2>

            <div className="space-y-4 text-base text-gray-400 leading-relaxed mb-8">
              <p data-testid="text-about-intro">
                December 3, 2018 — The day everything changed. Hoyer lift. 50 staples.
                Complete paralysis on his left side. Doctors making no promises.
              </p>
              <p data-testid="text-about-journey">
                Today, Nick types with both hands, runs his business with full force, and
                teaches breakthrough techniques that combine street-tested methods with
                cutting-edge neuroscience — none of which exist in standard medical textbooks.
              </p>
              <p className="text-white font-semibold text-lg" data-testid="text-about-mission">
                "I'm not a doctor. I'm something better — a stroke survivor who refused to quit."
              </p>
            </div>

            <div className="space-y-3 mb-10">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex gap-3 items-start" data-testid={`achievement-${index}`}>
                  <CheckCircle2 className="h-5 w-5 text-[#C9941A] flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300 text-sm">{achievement}</p>
                </div>
              ))}
            </div>

            <Link href="/recovery/about-nick">
              <Button className="bg-[#C9941A] text-black font-semibold px-8">
                Nick's Full Story
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
