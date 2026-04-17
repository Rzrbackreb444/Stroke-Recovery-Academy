import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO, { NICK_KREMERS_SCHEMA, SASQUATCH_METHOD_SCHEMA } from "@/components/RecoverySEO";
import { 
  Heart, Star, Award, Users, BookOpen, Video, 
  Mic, Target, Flame, Mountain, Quote, ArrowRight
} from "lucide-react";
import nickPortrait from "@assets/IMG_1750_1776397947955.jpeg";
import nickCasual from "@assets/IMG_4824_1776397947955.jpeg";

const milestones = [
  { year: "2019", title: "Stroke Event", description: "Suffered a life-changing stroke that affected mobility and speech." },
  { year: "2020", title: "Never Zero Born", description: "Developed the 1-rep principle: doing something every single day, no matter how small." },
  { year: "2021", title: "C.O.M.P.A.S.S. Created", description: "Formalized the 7-pillar recovery system after seeing what worked." },
  { year: "2022", title: "Community Launch", description: "Started sharing the Sasquatch Doctrine with other survivors." },
  { year: "2023", title: "Academy Founded", description: "Launched the Stroke Recovery Academy to reach more people." },
  { year: "2024", title: "Sasquatch Rises", description: "Continuing to grow, help others, and prove that recovery never stops." },
];

const doctrinePoints = [
  { icon: Flame, title: "Never Zero", description: "1 rep saves your streak. Do something every day." },
  { icon: Target, title: "C.O.M.P.A.S.S.", description: "7 pillars that guide your recovery journey." },
  { icon: Star, title: "Flicker Log", description: "Track micro-moments of progress - every twitch matters." },
  { icon: BookOpen, title: "Draft Your Legend", description: "Write your recovery story. Own your narrative." },
  { icon: Heart, title: "Medical Log", description: "Stay on top of meds, appointments, and vitals." },
];

export default function AboutNick() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoverySEO
        title="About Nick Kremers — Stroke Survivor, Author & Founder of Stroke Recovery Academy"
        description="Nick Kremers suffered a devastating hemorrhagic stroke on December 3, 2018, and went from 0% to 90%+ functional recovery using the Sasquatch Method. Author of The Stroked Out Sasquatch and The Ultimate Stroke Recovery Revolution, founder of Stroke Recovery Academy, and 24/7 recovery coach to thousands of survivors worldwide."
        canonical="/recovery/about-nick"
        pageType="article"
        author="Nick Kremers"
        publishedTime="2023-01-01T00:00:00Z"
        modifiedTime={new Date().toISOString()}
        keywords={[
          "Nick Kremers stroke survivor", "Stroked Out Sasquatch", "Stroke Recovery Academy founder",
          "stroke recovery author", "Sasquatch Method stroke", "stroke recovery coach",
          "stroke 0 to 90 recovery", "stroke survivor success story", "Nick Kremers books",
          "stroke recovery methodology", "C.O.M.P.A.S.S. recovery system"
        ]}
        speakableSelectors={["h1", ".nick-bio", ".nick-story", ".sasquatch-quote"]}
        breadcrumbs={[{ name: "Recovery Hub", url: "/recovery" }, { name: "About Nick", url: "/recovery/about-nick" }]}
        additionalSchema={[
          { "@context": "https://schema.org", ...NICK_KREMERS_SCHEMA },
          { "@context": "https://schema.org", ...SASQUATCH_METHOD_SCHEMA }
        ]}
        faq={[
          { question: "Who is Nick Kremers?", answer: "Nick Kremers is a stroke survivor who suffered a massive hemorrhagic stroke on December 3, 2018, and went from 0% to 90%+ functional recovery through relentless rehabilitation. He is the founder of Stroke Recovery Academy, author of 'The Stroked Out Sasquatch' and 'The Ultimate Stroke Recovery Revolution,' and the creator of the Sasquatch Method — a battle-tested recovery system used by survivors worldwide." },
          { question: "How did Nick Kremers recover from his stroke?", answer: "Nick Kremers recovered from his stroke using what he calls the Sasquatch Method: a combination of neuroplasticity-based physical rehabilitation (mirror therapy, baseball bat therapy, drop foot protocols), an unbreakable 'Never Zero' daily consistency commitment, a warrior mindset that rejects the victim mentality, community support, and the C.O.M.P.A.S.S. seven-pillar system. Over 2+ years, he went from 0% to 90% functional ability." },
          { question: "What is the Sasquatch Method for stroke recovery?", answer: "The Sasquatch Method is Nick Kremers' battle-tested 66-day stroke recovery system. It has three phases: Survival (Days 1-22: basic function restoration), Breakthrough (Days 23-44: building momentum), and Optimization (Days 45-66: mastery and acceleration). The method combines neuroplasticity science, physical protocols, mindset mastery, and daily consistency. Its core principles are: Take, Learn, Experiment, Combine, Apply." },
          { question: "What books has Nick Kremers written about stroke recovery?", answer: "Nick Kremers has written two stroke recovery books: (1) 'The Stroked Out Sasquatch' — his raw, 38-chapter autobiography from catastrophic stroke to 90%+ recovery, covering the ICU, the therapists, TikTok, and building the movement; (2) 'The Ultimate Stroke Recovery Revolution: From 0% to 90%+ and Still Rising' — 33 chapters and 9 appendices covering the Kremers Recovery Formula, neuroplasticity, mirror therapy, baseball bat therapy, drop foot protocols, and the complete Sasquatch Doctrine." }
        ]}
      />
      <RecoveryHeader />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center mb-12">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Mountain className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Nick Kremers</h1>
          <p className="text-xl text-[#C9941A] mb-4">Stroke Survivor. Sasquatch. Legend in Progress.</p>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Creator of the Sasquatch Doctrine - a comprehensive recovery methodology 
            born from personal experience and dedicated to helping stroke survivors 
            reclaim their lives, one rep at a time.
          </p>
        </div>

        <Card className="bg-gradient-to-br from-orange-500/10 to-zinc-900 border-[#C9941A]/30 p-8 mb-8">
          <div className="flex items-start gap-4">
            <Quote className="h-8 w-8 text-[#C9941A] flex-shrink-0" />
            <div>
              <p className="text-xl italic text-gray-200 mb-4">
                "They told me what I couldn't do. I decided to prove them wrong, 
                one day at a time. That's what becoming a Sasquatch means - 
                becoming something they said was impossible."
              </p>
              <p className="text-[#C9941A] font-semibold">- Nick Kremers</p>
            </div>
          </div>
        </Card>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Heart className="h-6 w-6 text-[#C9941A]" />
            The Story
          </h2>
          <div className="space-y-4 text-gray-300">
            <p>
              In 2019, Nick's life changed in an instant. A stroke left him facing 
              challenges he never imagined - mobility limitations, speech difficulties, 
              and the daunting reality of a long recovery ahead.
            </p>
            <p>
              But Nick refused to give up. Through trial, error, and an unwavering 
              commitment to progress, he developed what would become the 
              <span className="text-[#C9941A] font-semibold"> Sasquatch Doctrine</span> - 
              a comprehensive methodology for stroke recovery that combines daily 
              consistency, holistic tracking, and community support.
            </p>
            <p>
              The name "Sasquatch" came from a simple truth: survivors are told they 
              can't do things, that their recovery is impossible, that they're imagining 
              progress. Just like Sasquatch - dismissed, doubted, but undeniably present.
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Target className="h-6 w-6 text-[#C9941A]" />
            The Sasquatch Doctrine
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctrinePoints.map((point, idx) => {
              const Icon = point.icon;
              return (
                <Card key={idx} className="bg-[#1a1a1a] border-[#333] p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#C9941A]/20">
                      <Icon className="h-5 w-5 text-[#C9941A]" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{point.title}</h3>
                      <p className="text-gray-400 text-sm">{point.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Award className="h-6 w-6 text-[#C9941A]" />
            The Journey
          </h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#1a1a1a]" />
            <div className="space-y-6">
              {milestones.map((milestone, idx) => (
                <div key={idx} className="flex gap-4 ml-4">
                  <div className="w-3 h-3 rounded-full bg-[#C9941A] mt-2 -ml-1.5 relative z-10" />
                  <div>
                    <Badge className="bg-[#C9941A]/20 text-[#C9941A] mb-1">{milestone.year}</Badge>
                    <h3 className="font-semibold">{milestone.title}</h3>
                    <p className="text-gray-400 text-sm">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Users className="h-6 w-6 text-[#C9941A]" />
            The Mission
          </h2>
          <Card className="bg-[#1a1a1a] border-[#333] p-6">
            <p className="text-gray-300 mb-4">
              The Stroke Recovery Academy exists for one reason: to help other stroke 
              survivors find their own path to recovery. Nick believes that:
            </p>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <Star className="h-5 w-5 text-[#C9941A] flex-shrink-0 mt-0.5" />
                <span>Every survivor can make progress, no matter how small it seems</span>
              </li>
              <li className="flex items-start gap-3">
                <Star className="h-5 w-5 text-[#C9941A] flex-shrink-0 mt-0.5" />
                <span>Community and support make the journey less lonely</span>
              </li>
              <li className="flex items-start gap-3">
                <Star className="h-5 w-5 text-[#C9941A] flex-shrink-0 mt-0.5" />
                <span>Tracking your progress helps you see the wins you might miss</span>
              </li>
              <li className="flex items-start gap-3">
                <Star className="h-5 w-5 text-[#C9941A] flex-shrink-0 mt-0.5" />
                <span>Your story matters and deserves to be told</span>
              </li>
            </ul>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-orange-500/20 to-zinc-900 border-[#C9941A]/50 p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Your Recovery Journey?</h2>
          <p className="text-gray-400 mb-6">
            Join thousands of survivors who are using the Sasquatch Doctrine to 
            reclaim their lives, one rep at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-[#C9941A] text-lg px-8" data-testid="button-start-free">
              Start Free
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button variant="outline" className="text-lg px-8">
              <Video className="h-5 w-5 mr-2" />
              Watch Nick's Story
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
