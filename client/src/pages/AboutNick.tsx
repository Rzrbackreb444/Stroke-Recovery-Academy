import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO, { NICK_KREMERS_SCHEMA, SASQUATCH_METHOD_SCHEMA } from "@/components/RecoverySEO";
import { 
  Heart, Star, Award, Users, BookOpen, Video, 
  Mic, Target, Flame, Mountain, Quote, ArrowRight
} from "lucide-react";
import nickPortrait from "@assets/nick-portrait-opt.webp";
import nickCasual from "@assets/nick-portrait-opt.webp";

const milestones = [
  { year: "Dec 2018", title: "The Day Everything Changed", description: "December 3, 2018 — a massive hemorrhagic stroke. Left side paralyzed, speech gone, 50 pounds lost in the ICU on tube feedings. Told he might never walk normally again." },
  { year: "Apr 2019", title: "Nicholas Jr. — The Spark", description: "April 24, 2019: Nicholas Jr. took his first breath. Nick watched from the wheelchair. He promised to play catch with both arms. Every rep since has had his son's name on it." },
  { year: "2020", title: "S.A.S.C.H. Formula Born", description: "Formalized the 5-step daily operating system — Seize, Absorb, Swing, Combine, Hammer — after years of testing every recovery technique available." },
  { year: "2021", title: "C.O.M.P.A.S.S. Created", description: "Built the 7-pillar navigation system: Control, Own, Mutate, Patience, Anger, Small Wins, Stack. A framework for getting unstuck when recovery stalls." },
  { year: "2022", title: "TikTok & Community Launch", description: "Took the Sasquatch Doctrine to TikTok. An overwhelming response — 14.5K warriors followed. The mission became undeniable: help every survivor who would listen." },
  { year: "2023", title: "Academy Founded", description: "Launched StrokeRecoveryAcademy.com from Lavaca, Arkansas. The 33-chapter curriculum, the Sasquatch Coach, the 66-Day Challenge — all built to give survivors what he never had." },
  { year: "2026", title: "Sasquatch Keeps Rising", description: "90%+ function and still climbing. Building the platform, writing the books, running the community. As long as that meat in your chest is still thumpin', your life is still pumpin'." },
];

const doctrinePoints = [
  { icon: Flame, title: "Never Zero", description: "1 rep per day minimum. Non-negotiable. The streak is what builds the brain. Even teeth brushing counts." },
  { icon: Target, title: "S.A.S.C.H. Daily System", description: "Seize · Absorb · Swing · Combine · Hammer — the 5-step daily operating system Nick used from ICU to 90%+." },
  { icon: Mountain, title: "C.O.M.P.A.S.S. Navigation", description: "Control · Own · Mutate · Patience · Anger · Small Wins · Stack — the advanced 7-pillar builder's compass for when recovery stalls." },
  { icon: Star, title: "Flicker Log", description: "Track every micro-moment — a toe twitch, one more second of balance, buttoning a shirt. Every flicker is data. Every flicker is proof." },
  { icon: BookOpen, title: "Draft Your Legend", description: "Write your recovery story in your own words. Nick's chapters alongside yours. Your story matters — and someone out there needs to hear it." },
  { icon: Heart, title: "S.O.S. Panic Button", description: "Survive · Organize · Strive — the beginner reset for the darkest days. Use S.O.S. to survive; upgrade to S.A.S.C.H. when momentum builds." },
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
          { question: "How did Nick Kremers recover from his stroke?", answer: "Nick Kremers recovered using his three integrated recovery systems: the S.A.S.C.H. Formula (Seize, Absorb, Swing, Combine, Hammer) as his daily operating system; the S.O.S. daily reset (Survive, Organize, Strive); and the C.O.M.P.A.S.S. seven-pillar navigation system (Control, Own, Mutate, Patience, Anger, Small Wins, Stack). Combined with neuroplasticity-based protocols — mirror therapy, baseball bat therapy, drop foot progressions — and the 'Never Zero' consistency commitment, he went from 0% to 90%+ functional ability." },
          { question: "What is the Sasquatch Method for stroke recovery?", answer: "The Sasquatch Method is Nick Kremers' battle-tested 66-day stroke recovery system built on three core acronym systems. Daily formula: S.A.S.C.H. — Seize, Absorb, Swing, Combine, Hammer. Quick daily reset: S.O.S. — Survive, Organize, Strive. Advanced navigation: C.O.M.P.A.S.S. — Control, Own, Mutate, Patience, Anger, Small Wins, Stack. The three phases are Survival (Days 1-22), Breakthrough (Days 23-44), and Optimization (Days 45-66)." },
          { question: "What books has Nick Kremers written about stroke recovery?", answer: "Nick Kremers has written two stroke recovery books: (1) 'The Stroked Out Sasquatch' — his raw, 38-chapter autobiography from catastrophic stroke to 90%+ recovery, covering the ICU, the therapists, TikTok, and building the movement; (2) 'The Ultimate Stroke Recovery Revolution: From 0% to 90%+ and Still Rising' — 33 chapters and 9 appendices covering the S.A.S.C.H. Formula (Seize, Absorb, Swing, Combine, Hammer), the S.O.S. daily reset, the C.O.M.P.A.S.S. navigation system, neuroplasticity, mirror therapy, baseball bat therapy, drop foot protocols, and the complete Sasquatch Doctrine." }
        ]}
      />
      <RecoveryHeader />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center mb-12">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-[#E2741B]/40">
            <img src={nickPortrait} alt="Nick Kremers" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Nick Kremers</h1>
          <p className="text-xl text-[#E2741B] mb-4">Stroke Survivor. Sasquatch. Legend in Progress.</p>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Creator of the Sasquatch Doctrine - a comprehensive recovery methodology 
            born from personal experience and dedicated to helping stroke survivors 
            reclaim their lives, one rep at a time.
          </p>
        </div>

        <Card className="bg-gradient-to-br from-orange-500/10 to-zinc-900 border-[#E2741B]/30 p-8 mb-8">
          <div className="flex items-start gap-4">
            <Quote className="h-8 w-8 text-[#E2741B] flex-shrink-0" />
            <div>
              <p className="text-xl italic text-gray-200 mb-4">
                "Recovery isn't healing — it's construction. You build with what you still have.
                As long as that meat in your chest is still thumpin', your life is still pumpin'.
                You are not done."
              </p>
              <p className="text-[#E2741B] font-semibold">— Nick Kremers, Lavaca, Arkansas</p>
            </div>
          </div>
        </Card>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Heart className="h-6 w-6 text-[#E2741B]" />
            The Story
          </h2>
          <div className="space-y-4 text-gray-300 nick-bio">
            <p>
              December 3, 2018. Nick Kremers — former athlete, benching over 400 pounds, 
              built like a brick wall — suffered a massive hemorrhagic stroke. Left side 
              paralyzed. Speech gone. 50 pounds lost in the ICU on tube feedings.
              The doctors told him he'd probably never walk normally again.
            </p>
            <p>
              He had two choices: accept the limitations and fade, or use every word of 
              that prognosis as fuel. He chose fuel. What followed was seven years of 
              relentless, daily, sometimes humiliating, always honest work — developing 
              what would become the{" "}
              <span className="text-[#E2741B] font-semibold">Sasquatch Doctrine</span>:
              a recovery methodology built not in a lab, but in a body that was supposed 
              to stop.
            </p>
            <p>
              The name came from a simple truth. Survivors are told they can't do things.
              That their recovery is impossible. That they're imagining progress. 
              Just like Sasquatch — dismissed, doubted, but undeniably, stubbornly present.
              Today Nick is 90%+ functional, still rising, and coaching thousands of 
              warriors from Lavaca, Arkansas.
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Target className="h-6 w-6 text-[#E2741B]" />
            The Sasquatch Doctrine
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctrinePoints.map((point, idx) => {
              const Icon = point.icon;
              return (
                <Card key={idx} className="bg-[#1a1a1a] border-[#333] p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#E2741B]/20">
                      <Icon className="h-5 w-5 text-[#E2741B]" />
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
            <Award className="h-6 w-6 text-[#E2741B]" />
            The Journey
          </h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#1a1a1a]" />
            <div className="space-y-6">
              {milestones.map((milestone, idx) => (
                <div key={idx} className="flex gap-4 ml-4">
                  <div className="w-3 h-3 rounded-full bg-[#E2741B] mt-2 -ml-1.5 relative z-10" />
                  <div>
                    <Badge className="bg-[#E2741B]/20 text-[#E2741B] mb-1">{milestone.year}</Badge>
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
            <Users className="h-6 w-6 text-[#E2741B]" />
            The Mission
          </h2>
          <Card className="bg-[#1a1a1a] border-[#333] p-6">
            <p className="text-gray-300 mb-4">
              The Stroke Recovery Academy exists for one reason: to help other stroke 
              survivors find their own path to recovery. Nick believes that:
            </p>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <Star className="h-5 w-5 text-[#E2741B] flex-shrink-0 mt-0.5" />
                <span>Every survivor can make progress, no matter how small it seems</span>
              </li>
              <li className="flex items-start gap-3">
                <Star className="h-5 w-5 text-[#E2741B] flex-shrink-0 mt-0.5" />
                <span>Community and support make the journey less lonely</span>
              </li>
              <li className="flex items-start gap-3">
                <Star className="h-5 w-5 text-[#E2741B] flex-shrink-0 mt-0.5" />
                <span>Tracking your progress helps you see the wins you might miss</span>
              </li>
              <li className="flex items-start gap-3">
                <Star className="h-5 w-5 text-[#E2741B] flex-shrink-0 mt-0.5" />
                <span>Your story matters and deserves to be told</span>
              </li>
            </ul>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-orange-500/20 to-zinc-900 border-[#E2741B]/50 p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Your Recovery Journey?</h2>
          <p className="text-gray-400 mb-6">
            Join thousands of survivors who are using the Sasquatch Doctrine to 
            reclaim their lives, one rep at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-[#E2741B] text-lg px-8" data-testid="button-start-free">
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
