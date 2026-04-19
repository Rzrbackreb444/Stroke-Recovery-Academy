import { useEffect } from "react";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO, { createRecoveryCourseSchema, NICK_KREMERS_SCHEMA, SASQUATCH_METHOD_SCHEMA, STROKE_CONDITION_SCHEMA } from "@/components/RecoverySEO";
import Footer from "@/components/Footer";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { 
  BookOpen, 
  GraduationCap, 
  Target, 
  Zap, 
  Users, 
  Award,
  Clock,
  Play,
  ArrowRight,
  Brain,
  Dumbbell,
  Footprints,
  Heart,
  Hand,
  Layers,
  Hammer,
  Quote,
  ChevronRight,
  Flame
} from "lucide-react";
import mirrorTherapyImage from "@assets/generated_images/mirror_therapy_exercise.png";
import baseballBatImage from "@assets/generated_images/baseball_bat_therapy_equipment.png";
import dropFootImage from "@assets/generated_images/drop_foot_recovery_protocol.png";

const books = [
  {
    id: 1,
    title: "The Stroked Out Sasquatch",
    subtitle: "A Stroke Recovery Guide Through the Eyes of a Survivor",
    author: "Nick Kremers",
    description: "Nick's raw, chapter-by-chapter autobiography — from a lifelong athlete benching 400 lbs to lying paralyzed in an ICU with 50 staples in his skull. This is the unfiltered story: the hallucinations, the pureed food, learning to walk again with Michael, TikTok going viral, and building StrokeRecoveryAcademy.com from Fort Smith, Arkansas.",
    topics: ["December 3, 2018 — The Day It Happened", "ICU, Hallucinations & 50 Staples", "Michael: The Therapist Who Changed Everything", "TikTok Army & Building the Movement"],
    gradient: "from-orange-600 via-orange-500 to-amber-500",
    chapters: 38,
    duration: "8+ hours",
    status: "available" as "available" | "coming-soon" | "new",
    progress: 0,
    courseId: 1,
  },
  {
    id: 2,
    title: "The Ultimate Stroke Recovery Revolution",
    subtitle: "From 0% to 90%+ and Still Rising",
    author: "Nick Kremers",
    description: "The battle-tested blueprint for defying every 'never.' 33 chapters and 9 appendices covering neuroplasticity, the 66-Day Tracker, Baseball Bat Therapy, Mirror Therapy, Drop Foot Destruction, the S.A.S.C.H. Formula (Seize→Absorb→Swing→Combine→Hammer), and the complete Sasquatch Doctrine. This is the methodology behind the movement.",
    topics: ["The S.A.S.C.H. Formula", "Neuroplasticity Revolution", "Baseball Bat & Mirror Therapy", "The 66-Day Transformation"],
    gradient: "from-primary via-orange-500 to-red-600",
    chapters: 33,
    duration: "14+ hours",
    status: "available" as "available" | "coming-soon" | "new",
    progress: 0,
    courseId: 2,
  },
];

const featuredModules = [
  {
    id: 1,
    title: "Mirror Therapy Fundamentals",
    description: "Rewire your brain's motor pathways using mirror box techniques proven to accelerate recovery.",
    image: mirrorTherapyImage,
    duration: "45 min",
    difficulty: "Beginner",
    category: "Neuroplasticity",
  },
  {
    id: 2,
    title: "Baseball Bat Therapy Protocol",
    description: "Build grip strength and arm coordination with Nick's signature bat therapy exercises.",
    image: baseballBatImage,
    duration: "30 min",
    difficulty: "Intermediate",
    category: "Upper Body",
  },
  {
    id: 3,
    title: "Drop Foot Recovery System",
    description: "Targeted exercises and techniques to overcome drop foot and restore natural walking patterns.",
    image: dropFootImage,
    duration: "60 min",
    difficulty: "All Levels",
    category: "Mobility",
  },
];

const sasquatchFormula = [
  {
    step: 1,
    code: "SEIZE",
    title: "Seize Your Reality",
    description: "Seize exactly where you are — no denial, no wishing it was better. Your flickers, your limitations, your starting point. That's your raw material. You can't build on fantasy.",
    icon: Target,
  },
  {
    step: 2,
    code: "ABSORB",
    title: "Absorb Everything",
    description: "Be a sponge. Take in every useful piece of knowledge — therapists, other survivors, science, videos, and your own body's feedback. No judgment. All fuel.",
    icon: Brain,
  },
  {
    step: 3,
    code: "SWING",
    title: "Swing Boldly",
    description: "Experiment. Test things. Try mirror therapy, weight bearing, new angles, different reps. Take action and see what actually moves the needle. Swing even when it feels useless.",
    icon: Zap,
  },
  {
    step: 4,
    code: "COMBINE",
    title: "Combine What Works",
    description: "Mix the best pieces together. Mirror therapy + weight bearing + mindset work. Create your personal recovery recipe. Don't follow one method — build your custom system.",
    icon: Layers,
  },
  {
    step: 5,
    code: "HAMMER",
    title: "Hammer It Daily",
    description: "Apply it relentlessly. No zero days. Rep after rep, day after day. Hammer when you're tired. Hammer when progress is invisible. Consistency is the hammer that builds empires.",
    icon: Hammer,
  },
];

const benefits = [
  {
    icon: Brain,
    title: "Neuroplasticity-Based",
    description: "Science-backed protocols that leverage your brain's ability to rewire and heal itself.",
  },
  {
    icon: Target,
    title: "Proven Results",
    description: "Developed from Nick's journey from 0% to 90% recovery - methods that actually work.",
  },
  {
    icon: Dumbbell,
    title: "Practical Exercises",
    description: "Step-by-step video demonstrations and exercises you can do at home with minimal equipment.",
  },
  {
    icon: Users,
    title: "Community Support",
    description: "Join 50,000+ stroke warriors sharing their journey and supporting each other.",
  },
  {
    icon: Clock,
    title: "Learn at Your Pace",
    description: "Self-paced courses designed for stroke survivors with built-in rest periods and modifications.",
  },
  {
    icon: Award,
    title: "Track Your Progress",
    description: "Built-in progress tracking to celebrate victories and maintain motivation throughout recovery.",
  },
];

function BookCard({ book }: { book: typeof books[0] }) {
  const isComingSoon = book.status === "coming-soon";
  return (
    <article data-testid={`card-book-${book.id}`}>
      <Card className={`h-full flex flex-col overflow-visible ${isComingSoon ? "opacity-60" : "hover-elevate"}`}>
        <CardHeader className="pb-0">
          <div 
            className={`relative aspect-[3/4] rounded-lg bg-gradient-to-br ${book.gradient} flex items-center justify-center p-6 mb-4`}
            role="img"
            aria-label={`Book cover for ${book.title}`}
          >
            <div className="absolute inset-0 bg-[#0D0D0D]/20 rounded-lg" />
            <div className="relative text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-foreground/90" aria-hidden="true" />
              <h3 className="text-xl font-black text-foreground uppercase tracking-wide leading-tight">
                {book.title}
              </h3>
              {"subtitle" in book && book.subtitle && (
                <p className="text-xs text-foreground/70 mt-1 italic leading-snug">{book.subtitle}</p>
              )}
              <p className="text-sm text-foreground/80 mt-2">by {book.author}</p>
            </div>
            {isComingSoon && (
              <Badge className="absolute top-3 right-3 bg-gray-700 text-gray-300 border-none">
                Coming Soon
              </Badge>
            )}
            {book.status === "new" && (
              <Badge className="absolute top-3 right-3 bg-[#C9941A] text-black border-none">
                New
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 space-y-4">
          <div>
            <h4 className="font-semibold text-lg text-foreground mb-1" data-testid={`text-book-title-${book.id}`}>
              {book.title}
            </h4>
            {"subtitle" in book && book.subtitle && (
              <p className="text-xs text-[#C9941A] mb-2 italic">{book.subtitle}</p>
            )}
            <p className="text-sm text-gray-400" data-testid={`text-book-description-${book.id}`}>
              {book.description}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {book.topics.map((topic, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              {book.chapters} Chapters
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {book.duration}
            </span>
          </div>
          
          {!isComingSoon && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Course Progress</span>
                <span className="font-medium text-foreground">{book.progress}%</span>
              </div>
              <Progress value={book.progress} className="h-2" aria-label={`Progress: ${book.progress}%`} />
            </div>
          )}
        </CardContent>
        
        <CardFooter className="pt-0">
          <Button 
            className="w-full gap-2" 
            data-testid={`button-book-${book.id}`}
            disabled={isComingSoon}
            onClick={() => !isComingSoon && (window.location.href = `/recovery/university`)}
          >
            {isComingSoon ? (
              <>
                <Clock className="h-4 w-4" aria-hidden="true" />
                Coming Soon
              </>
            ) : (
              <>
                <Play className="h-4 w-4" aria-hidden="true" />
                Start Course
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </article>
  );
}

function ModuleCard({ module }: { module: typeof featuredModules[0] }) {
  return (
    <article data-testid={`card-module-${module.id}`}>
      <Card className="h-full hover-elevate overflow-hidden">
        <div className="relative aspect-video">
          <img 
            src={module.image} 
            alt={module.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <Badge className="mb-2">{module.category}</Badge>
            <h4 className="text-foreground font-semibold">{module.title}</h4>
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
              {module.duration}
            </Badge>
          </div>
        </div>
        <CardContent className="pt-4">
          <p className="text-sm text-gray-400 mb-3">{module.description}</p>
          <div className="flex items-center justify-between">
            <Badge variant="outline">{module.difficulty}</Badge>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1"
              data-testid={`button-module-preview-${module.id}`}
              onClick={() => (window.location.href = "/recovery/university")}
            >
              Preview
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}

export default function Academy() {
  useEffect(() => {
    document.title = "Stroke Recovery Academy - Learn from Nick Kremers | StrokeRecoveryAcademy.com";
    
    const updateOrCreateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    const updateOrCreateLink = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", rel);
        document.head.appendChild(link);
      }
      link.setAttribute("href", href);
    };

    updateOrCreateMeta(
      "description",
      "Master stroke recovery with Nick Kremers' comprehensive courses. Learn the Sasquatch Method, Mirror Therapy, Baseball Bat Therapy, and evidence-based protocols that took Nick from 0% to 90% recovery."
    );

    updateOrCreateLink("canonical", "https://strokerecoveryacademy.com/academy");

    updateOrCreateMeta(
      "og:title",
      "Stroke Recovery Academy - Master Recovery with Nick Kremers",
      true
    );
    updateOrCreateMeta(
      "og:description",
      "Comprehensive stroke recovery courses from The Stroked Out Sasquatch. Learn proven protocols, exercises, and mindset techniques from a survivor who achieved 90% recovery.",
      true
    );
    updateOrCreateMeta("og:type", "website", true);
    updateOrCreateMeta("og:url", "https://strokerecoveryacademy.com/academy", true);
    updateOrCreateMeta("og:site_name", "StrokeRecoveryAcademy.com", true);

    updateOrCreateMeta("twitter:card", "summary_large_image");
    updateOrCreateMeta(
      "twitter:title",
      "Stroke Recovery Academy - Learn from Nick Kremers"
    );
    updateOrCreateMeta(
      "twitter:description",
      "Master stroke recovery with comprehensive courses covering the Sasquatch Method, neuroplasticity exercises, and proven recovery protocols."
    );

    updateOrCreateMeta(
      "keywords",
      "stroke recovery courses, stroke rehabilitation, Nick Kremers, Sasquatch Method, mirror therapy, neuroplasticity, stroke survivor, recovery training, stroke education"
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <RecoverySEO
        title="Stroke Recovery Academy — Learn the Sasquatch Method from Nick Kremers"
        description="Master stroke recovery with Nick Kremers — the stroke survivor who went from 0% to 90%. Two comprehensive courses: The Stroked Out Sasquatch (personal journey) and The Ultimate Stroke Recovery Revolution (battle-tested protocols). Mirror therapy, baseball bat therapy, drop foot protocols, neuroplasticity training."
        canonical="/recovery/academy"
        pageType="course"
        keywords={[
          "Stroke Recovery Academy", "Nick Kremers stroke", "Sasquatch Method", "stroke recovery courses",
          "stroke rehabilitation training", "mirror therapy course", "baseball bat therapy stroke",
          "drop foot recovery", "neuroplasticity training", "stroke survivor courses",
          "Stroked Out Sasquatch book", "stroke recovery revolution", "stroke recovery blueprint",
          "stroke recovery mindset", "stroke warrior training"
        ]}
        speakableSelectors={["#academy-hero-title", "[data-testid='text-academy-title']", "[data-testid='text-academy-subtitle']"]}
        breadcrumbs={[{ name: "Recovery Hub", url: "/recovery" }, { name: "Academy", url: "/recovery/academy" }]}
        additionalSchema={[
          createRecoveryCourseSchema({
            name: "The Stroked Out Sasquatch",
            description: "Nick Kremers' raw 38-chapter autobiography — from catastrophic stroke to 90%+ recovery. The unfiltered story of ICU hallucinations, learning to walk, TikTok, and building Stroke Recovery Academy.",
            url: "/recovery/academy",
            numberOfLessons: 38,
            durationHours: 8,
            level: "All Levels",
            free: false,
          }),
          createRecoveryCourseSchema({
            name: "The Ultimate Stroke Recovery Revolution",
            description: "The battle-tested blueprint: 33 chapters covering the S.A.S.C.H. Formula (Seize, Absorb, Swing, Combine, Hammer), neuroplasticity, mirror therapy, baseball bat therapy, drop foot protocols, the 66-Day Transformation, and the complete Sasquatch Doctrine.",
            url: "/recovery/academy",
            numberOfLessons: 33,
            durationHours: 14,
            level: "All Levels",
            free: false,
          }),
          { "@context": "https://schema.org", ...NICK_KREMERS_SCHEMA },
          { "@context": "https://schema.org", ...STROKE_CONDITION_SCHEMA },
        ]}
        faq={[
          { question: "What is the Stroke Recovery Academy?", answer: "Stroke Recovery Academy is a comprehensive online platform created by Nick Kremers — a stroke survivor who went from 0% to 90% functional recovery. It offers two in-depth courses: 'The Stroked Out Sasquatch' (38-chapter autobiography and mindset journey) and 'The Ultimate Stroke Recovery Revolution' (33-chapter battle-tested protocol guide). The Academy also includes AI coaching via Sasquatch Coach, a community of survivors, and evidence-based exercise programs." },
          { question: "What is mirror therapy for stroke recovery?", answer: "Mirror therapy is a stroke rehabilitation technique where you place a mirror along your body's midline. You watch your unaffected arm/hand perform movements in the mirror, creating the visual illusion that your affected arm is moving normally. This visual feedback activates mirror neurons in the brain and stimulates neuroplasticity, helping to restore motor function in the affected limb. Research shows 20-30 minutes of mirror therapy daily significantly improves arm and hand function after stroke." },
          { question: "What is baseball bat therapy for stroke?", answer: "Baseball bat therapy, pioneered by Nick Kremers, uses the weight and grip of a baseball bat to provide progressive resistance training for stroke-affected arms and hands. The familiar shape promotes neural re-engagement and the weight challenges weakened muscles in a functional, task-specific way. Nick used this as part of his daily rehabilitation routine as he recovered from 0% to 90% function." },
          { question: "How do I get started with the Stroke Recovery Academy?", answer: "To get started, create a free account on Stroke Recovery Academy, explore the Recovery University 33-chapter curriculum (available to all members), access the exercise database with 34 therapeutic exercises, and connect with the Sasquatch Coach (AI powered by Nick's methodology). Upgrade to a paid tier for full course access, live coaching, and premium protocol content." }
        ]}
      />
      <RecoveryHeader />
      
      <main>
        <section 
          className="relative py-20 overflow-hidden"
          aria-labelledby="academy-hero-title"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 text-[#C9941A] border-primary">
                <GraduationCap className="h-3 w-3 mr-1" aria-hidden="true" />
                The Sasquatch Learning System
              </Badge>
              
              <h1 
                id="academy-hero-title"
                className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-6 uppercase tracking-tight"
                data-testid="text-academy-title"
              >
                Stroke Recovery{" "}
                <span className="text-[#C9941A]">Academy</span>
              </h1>
              
              <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                Master the art of recovery with comprehensive courses developed by Nick Kremers - 
                The Stroked Out Sasquatch. From 0% to 90% recovery, these are the exact methods 
                that changed everything.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <Button
                  size="lg"
                  className="gap-2"
                  data-testid="button-browse-courses"
                  onClick={() => (window.location.href = "/recovery/university")}
                >
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                  Browse Courses
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  data-testid="button-free-preview"
                  onClick={() => (window.location.href = "/recovery/university/lesson/1")}
                >
                  <Play className="h-5 w-5" aria-hidden="true" />
                  Free Preview
                </Button>
              </div>
              
              <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#C9941A]" aria-hidden="true" />
                  <span>50,000+ Warriors</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#C9941A]" aria-hidden="true" />
                  <span>2 Comprehensive Courses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#C9941A]" aria-hidden="true" />
                  <span>Proven 90% Recovery</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section 
          className="py-16 bg-[#FAF8F3] dark:bg-card/50"
          aria-labelledby="sasquatch-formula-title"
          data-testid="section-sasquatch-formula"
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 border-[#C9941A] text-[#C9941A]">
                <Zap className="h-3 w-3 mr-1" aria-hidden="true" />
                The 5-Step System
              </Badge>
              <h2 
                id="sasquatch-formula-title"
                className="text-3xl md:text-4xl font-black text-foreground mb-4 uppercase tracking-tight"
                data-testid="text-formula-title"
              >
                The <span className="text-[#C9941A]">S.A.S.C.H.</span> Formula
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Your daily recovery operating system. Five steps that replaced theory with action — forged through years of real recovery, not a textbook.
                <span className="block mt-2 text-[#C9941A] font-semibold italic">"S.A.S.C.H. it every day: Seize → Absorb → Swing → Combine → Hammer."</span>
              </p>
            </div>

            <div className="grid md:grid-cols-5 gap-4 max-w-6xl mx-auto mb-12">
              {sasquatchFormula.map((step, index) => (
                <Card 
                  key={step.step} 
                  className="relative hover-elevate overflow-visible border-2 hover:border-[#C9941A] transition-colors"
                  data-testid={`formula-step-${step.step}`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#C9941A] text-black font-black text-lg px-3">
                      {step.step}
                    </Badge>
                  </div>
                  <CardContent className="pt-8 pb-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#C9941A]/10 flex items-center justify-center">
                      <step.icon className="h-6 w-6 text-[#C9941A]" aria-hidden="true" />
                    </div>
                    <h3 className="font-black text-lg text-foreground mb-2 uppercase tracking-wide">
                      {step.code}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                  {index < sasquatchFormula.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                      <ChevronRight className="h-6 w-6 text-[#C9941A]" aria-hidden="true" />
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <Card className="max-w-3xl mx-auto bg-gradient-to-br from-[#C9941A]/10 to-transparent border-[#C9941A]/30">
              <CardContent className="py-8 px-6 text-center">
                <Quote className="h-8 w-8 mx-auto mb-4 text-[#C9941A]" aria-hidden="true" />
                <blockquote className="text-lg md:text-xl font-medium text-foreground mb-4 italic">
                  "Seize where you are. Absorb everything around you. Swing boldly and experiment. 
                  Combine what actually works. Then hammer it — every single day, no excuses, no zero days. 
                  That's S.A.S.C.H. That's how you defy every 'never.'"
                </blockquote>
                <cite className="text-[#C9941A] font-bold not-italic">
                  — Nicholas "Stroked-Out Sasquatch" Kremers
                </cite>
              </CardContent>
            </Card>

            {/* Free Cheat Sheet CTA */}
            <div className="max-w-3xl mx-auto mt-8 text-center" data-testid="cta-sasch-cheatsheet">
              <a href="/recovery/sasch" data-testid="link-sasch-landing">
                <Button
                  size="lg"
                  className="font-bold tracking-wide"
                  style={{ background: "#C9941A", color: "#000" }}
                >
                  Get the Free S.A.S.C.H. Cheat Sheet (PDF)
                </Button>
              </a>
              <p className="text-xs mt-3 text-muted-foreground">
                Free download · Print it · Tape it to the mirror · No credit card
              </p>
            </div>

            {/* The 66-Day Truth */}
            <div
              className="max-w-3xl mx-auto mt-10 rounded-lg p-6 md:p-8"
              style={{ background: "#1a1a1a", border: "1px solid #C9941A" }}
              data-testid="callout-66-day-truth-academy"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#C9941A]">
                  The 66-Day Truth
                </span>
              </div>
              <p className="text-sm md:text-base leading-relaxed mb-3 text-gray-300">
                66 days is the average time it takes to turn deliberate effort into a habit.{" "}
                <strong className="text-white">It is not a guarantee.</strong> Every stroke is
                different. Every brain is different. Every recovery is different.
              </p>
              <p className="text-sm md:text-base leading-relaxed text-gray-300">
                The S.A.S.C.H. Formula is the blueprint Nick built going from 0% to 90%+. It works
                when you work it. He's living proof it's possible —{" "}
                <span className="text-white font-semibold">the rest is up to you.</span>
              </p>
            </div>
          </div>
        </section>

        <section 
          className="py-20 bg-[#1a1a1a] dark:bg-[#0D0D0D] relative overflow-hidden"
          aria-labelledby="sasquatch-creed-title"
          data-testid="section-sasquatch-creed"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#C9941A]/10 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBoLTQweiIvPjxwYXRoIGQ9Ik00MCAyMGgtNDBNMjAgNDB2LTQwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIuMDMiLz48L2c+PC9zdmc+')] opacity-50" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-[#C9941A]/20 border-2 border-[#C9941A] flex items-center justify-center">
                  <Flame className="h-10 w-10 text-[#C9941A]" aria-hidden="true" />
                </div>
              </div>
              
              <Badge 
                variant="outline" 
                className="mb-4 border-[#C9941A] text-[#C9941A] bg-[#C9941A]/10"
                data-testid="badge-doctrine"
              >
                The Doctrine
              </Badge>
              
              <h2 
                id="sasquatch-creed-title"
                className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 uppercase tracking-tight"
                data-testid="text-creed-title"
              >
                The Sasquatch <span className="text-[#C9941A]">Creed</span>
              </h2>
              
              <p className="text-xl md:text-2xl font-bold text-[#C9941A] mb-12 tracking-widest uppercase">
                Rebuild. Rewire. Rise.
              </p>
              
              <div className="space-y-4 mb-12" data-testid="creed-content">
                <p className="text-2xl md:text-3xl lg:text-4xl font-black text-white uppercase tracking-wide">
                  I AM A STROKE WARRIOR.
                </p>
                <div className="space-y-2 text-lg md:text-xl text-zinc-300 font-medium leading-relaxed">
                  <p>I will not be defined by what happened to me.</p>
                  <p>I will be defined by how I respond.</p>
                </div>
                <div className="py-4 space-y-2 text-lg md:text-xl text-zinc-300 font-medium leading-relaxed">
                  <p>Every day I show up, <span className="text-[#C9941A] font-bold">I win.</span></p>
                  <p>Every rep I complete, <span className="text-[#C9941A] font-bold">I rewire.</span></p>
                  <p>Every obstacle I face, <span className="text-[#C9941A] font-bold">I overcome.</span></p>
                </div>
                <p className="text-lg md:text-xl text-zinc-300 font-medium italic">
                  The impossible is only impossible until I prove it's not.
                </p>
                <div className="pt-4 space-y-2">
                  <p className="text-xl md:text-2xl text-white font-bold">
                    I am relentless. I am unstoppable.
                  </p>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-black text-[#C9941A] uppercase tracking-wide">
                    I AM THE COMEBACK.
                  </p>
                </div>
              </div>
              
              <div className="border-t border-[#333] pt-8">
                <p className="text-sm text-zinc-500 mb-2">
                  From the mind and heart of
                </p>
                <p className="text-lg font-bold text-white" data-testid="text-author-attribution">
                  Nicholas "Stroked-Out Sasquatch" Kremers
                </p>
                <p className="text-sm text-[#C9941A] font-medium mt-1">
                  Stroke Lyfe Publishing
                </p>
              </div>
            </div>
          </div>
        </section>

        <section 
          className="py-16 bg-card/30"
          aria-labelledby="courses-title"
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 
                id="courses-title" 
                className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                data-testid="text-courses-section-title"
              >
                Recovery Courses by Nick Kremers
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Each course is packed with real-world experience, practical exercises, 
                and the mindset shifts you need to write your own comeback story.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        </section>

        <section 
          className="py-16"
          aria-labelledby="modules-title"
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
              <div>
                <h2 
                  id="modules-title"
                  className="text-3xl font-bold text-foreground mb-2"
                  data-testid="text-modules-section-title"
                >
                  Featured Recovery Modules
                </h2>
                <p className="text-gray-400">
                  Preview key techniques from our comprehensive courses
                </p>
              </div>
              <Button variant="outline" className="gap-2" data-testid="button-view-all-modules">
                View All Modules
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredModules.map((module) => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          </div>
        </section>

        <section 
          className="py-16 bg-card/30"
          aria-labelledby="benefits-title"
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                <Zap className="h-3 w-3 mr-1" aria-hidden="true" />
                Why Warriors Choose Us
              </Badge>
              <h2 
                id="benefits-title"
                className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                data-testid="text-benefits-section-title"
              >
                Why Choose Our Academy
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Built by a stroke survivor, for stroke survivors. Every lesson is battle-tested 
                and designed for real-world recovery success.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <Card key={index} className="hover-elevate">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                      <benefit.icon className="h-6 w-6 text-[#C9941A]" aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section 
          className="py-20"
          aria-labelledby="cta-title"
        >
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
              <CardContent className="py-12 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-[#C9941A]" aria-hidden="true" />
                </div>
                <h2 
                  id="cta-title"
                  className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                >
                  Ready to Start Your Recovery Journey?
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto mb-8">
                  Join thousands of stroke warriors who are proving the impossible, one rep at a time. 
                  Get notified when our courses launch and receive exclusive early-bird pricing.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" className="gap-2" data-testid="button-join-waitlist">
                    <Zap className="h-5 w-5" aria-hidden="true" />
                    Join the Waitlist
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2" data-testid="button-learn-more">
                    Learn More About Nick
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
