import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { 
  Heart, 
  Target, 
  Users, 
  Zap, 
  Award, 
  BookOpen, 
  Brain, 
  Sparkles,
  Mail,
  ArrowRight,
  CheckCircle2,
  Star,
  Trophy
} from "lucide-react";
import academyLogo from "@assets/academy_logo.png";
import kremersxLogo from "@assets/Kremersx_1766356681995.png";

export default function AboutUs() {
  const values = [
    {
      icon: Heart,
      title: "Compassion First",
      description: "Every feature is built with empathy, understanding the daily challenges of stroke recovery."
    },
    {
      icon: Target,
      title: "Survivor-Led",
      description: "Our ideas begin with personal recovery experience and are shared in plain language."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "We believe in the power of shared experiences and mutual support among survivors."
    },
    {
      icon: Zap,
      title: "Sustainable Progress",
      description: "Small wins matter, and rest is part of a recovery journey."
    }
  ];

  const timeline = [
    {
      year: "2019",
      title: "The Stroke",
      description: "Nick suffered a massive stroke that doctors said would leave him permanently disabled. Against all odds, he refused to accept that fate."
    },
    {
      year: "2020",
      title: "The Fight Begins",
      description: "Beginning with 0% mobility, Nick developed personal routines that became the foundation for his survivor-led work."
    },
    {
      year: "2022",
      title: "Nick's Personal Recovery",
      description: "Nick reports reaching 90% recovery; his outcome is personal and not a promise for others."
    },
    {
      year: "2024",
      title: "Stroke Recovery Academy",
      description: "Nick founded Stroke Recovery Academy to share his battle-tested methods with survivors worldwide."
    },
    {
      year: "2025",
      title: "KremersX Launch",
      description: "The full Recovery Operating System launches under parent company KremersX, reaching 50,000+ warriors."
    }
  ];

  const stats = [
    { value: "90%", label: "Nick's Recovery Rate" },
    { value: "50K+", label: "Community Members" },
    { value: "18", label: "Recovery Modules" },
    { value: "66", label: "Day Habit System" }
  ];

  return (
    <div className="min-h-screen">
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4 border-primary text-[#E2741B]" data-testid="badge-founder">
                <Star className="w-3 h-3 mr-1" />
                Founder's Story
              </Badge>
              <h1 className="text-4xl md:text-5xl font-black mb-6" data-testid="heading-main">
                Meet Nick <span className="text-[#E2741B]">"The Stroked Out Sasquatch"</span> Kremers
              </h1>
              <p className="text-xl text-gray-400 mb-6 leading-relaxed" data-testid="text-intro">
                When doctors said I'd never walk again, I kept working at my recovery —
                and began sharing what I learned with other survivors.
              </p>
              <p className="text-gray-400 mb-8 leading-relaxed">
                My personal journey went from 0% to 90% recovery. Now I'm sharing the
                routines, exercises, and mindset shifts that helped me, without promising the
                same outcome for anyone else.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard">
                  <Button size="lg" data-testid="button-start-journey">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/stories">
                  <Button variant="outline" size="lg" data-testid="button-read-stories">
                    Read Recovery Stories
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <Card className="overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <img 
                    src={academyLogo}
                    alt="The Stroked Out Sasquatch"
                    className="w-64 h-64 object-contain"
                    data-testid="img-nick-avatar"
                  />
                </div>
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold">Nick Kremers</h3>
                  <p className="text-gray-400">Stroke Survivor & Recovery Coach</p>
                  <div className="flex justify-center gap-2 mt-4">
                    <Badge>Stroke Survivor</Badge>
                    <Badge>Author</Badge>
                    <Badge>Coach</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center" data-testid={`stat-${index}`}>
                <div className="text-4xl md:text-5xl font-black text-[#E2741B] mb-2" data-testid={`stat-value-${index}`}>
                  {stat.value}
                </div>
                <div className="text-gray-400" data-testid={`stat-label-${index}`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Trophy className="w-3 h-3 mr-1" />
              The Journey
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black mb-4" data-testid="heading-timeline">
              Nick's <span className="text-[#E2741B]">0% to 90%</span> Story
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              A timeline of one survivor's experience and the platform it inspired.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border" />
            
            <div className="space-y-12">
              {timeline.map((item, index) => (
                <div 
                  key={index} 
                  className={`relative flex flex-col md:flex-row gap-8 ${
                    index % 2 === 0 ? 'md:flex-row-reverse' : ''
                  }`}
                  data-testid={`timeline-item-${index}`}
                >
                  <div className="flex-1 md:text-right">
                    {index % 2 === 0 && (
                      <Card className="inline-block text-left">
                        <CardHeader className="pb-2">
                          <Badge variant="outline" className="w-fit mb-2">{item.year}</Badge>
                          <CardTitle>{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-400">{item.description}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                  
                  <div className="flex-1 pl-12 md:pl-0">
                    {index % 2 !== 0 && (
                      <Card className="inline-block">
                        <CardHeader className="pb-2">
                          <Badge variant="outline" className="w-fit mb-2">{item.year}</Badge>
                          <CardTitle>{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-400">{item.description}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Our Mission
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black mb-4" data-testid="heading-mission">
              REBUILD. REWIRE. <span className="text-[#E2741B]">RISE.</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Stroke Recovery Academy exists for one purpose: to prove that your stroke is not your ending - 
              it's your beginning. We share lived experience, practical routines, and peer support
              while encouraging survivors to work with their own care teams.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center" data-testid={`value-card-${index}`}>
                <CardContent className="pt-8 pb-6">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-7 h-7 text-[#E2741B]" />
                  </div>
                  <h3 className="font-bold mb-2">{value.title}</h3>
                  <p className="text-sm text-gray-400">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <BookOpen className="w-3 h-3 mr-1" />
              The Platform
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black mb-4" data-testid="heading-platform">
              Your Complete <span className="text-[#E2741B]">Recovery Operating System</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "Recovery University", desc: "18 modules of battle-tested recovery protocols across three tiers." },
              { icon: Target, title: "66-Day Habit Tracker", desc: "Build lasting recovery habits with visual progress tracking." },
              { icon: Users, title: "Accountability Pods", desc: "Small group support with fellow warriors on the same journey." },
              { icon: Award, title: "Achievement System", desc: "Celebrate milestones with badges and shareable recovery cards." },
              { icon: Sparkles, title: "AI Sasquatch Coach", desc: "24/7 motivation and guidance from your AI recovery partner." },
              { icon: BookOpen, title: "Stroke Lyfe Publishing", desc: "Write and publish your own recovery story with AI assistance." }
            ].map((feature, index) => (
              <Card key={index} data-testid={`feature-card-${index}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-[#E2741B]" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-400">{feature.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Powered By</Badge>
            <h2 className="text-3xl md:text-4xl font-black mb-4" data-testid="heading-kremersx">
              About <span className="text-[#E2741B]">KremersX</span>
            </h2>
          </div>

          <Card className="max-w-3xl mx-auto">
            <CardContent className="py-8 text-center">
              <img 
                src={kremersxLogo}
                alt="KremersX"
                className="h-32 mx-auto mb-6 object-contain rounded-lg"
                data-testid="img-kremersx-logo"
              />
              <p className="text-lg text-gray-400 mb-6 leading-relaxed">
                KremersX is the parent company behind Stroke Recovery Academy, dedicated to 
                building transformative health and wellness platforms. Founded by Nick Kremers, 
                our mission is to leverage technology and lived experience to help people 
                overcome life's greatest challenges.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge variant="outline">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Stroke Recovery Academy
                </Badge>
                <Badge variant="outline">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Stroke Lyfe Publishing
                </Badge>
                <Badge variant="outline">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Recovery University
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6" data-testid="heading-cta">
            Ready to Start <span className="text-[#E2741B]">Your Recovery?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join 50,000+ stroke warriors who are proving the impossible every single day.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link href="/dashboard">
              <Button size="lg" data-testid="button-join-now">
                Join The Academy
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" data-testid="button-contact">
                <Mail className="mr-2 h-4 w-4" />
                Contact Us
              </Button>
            </Link>
          </div>
          <p className="text-gray-400">
            Questions? Email us at{" "}
            <a 
              href="mailto:info@strokerecoveryacademy.com" 
              className="text-[#E2741B] hover:underline"
              data-testid="link-email"
            >
              info@strokerecoveryacademy.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}