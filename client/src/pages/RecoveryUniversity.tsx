import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import {
  BookOpen,
  Lock,
  Play,
  CheckCircle,
  Clock,
  Brain,
  Heart,
  Users,
  Zap,
  Shield,
  Target,
  Flame,
  GraduationCap,
  Trophy,
  Star,
  Crown,
  Sparkles,
  HeartPulse,
  TrendingUp,
  Rocket,
} from "lucide-react";
import RecoveryHeader from "@/components/RecoveryHeader";

// Nick Kremers' Three Recovery Phases from "The Ultimate Stroke Recovery Revolution"
const recoveryPhases = [
  {
    id: "survival",
    name: "SURVIVAL PHASE",
    days: "Days 1-22",
    focus: "Basic function restoration",
    mindset: "Just get through today",
    coreActivities: ["PT fundamentals", "Basic mobility", "Mental acceptance"],
    icon: HeartPulse,
    partNumbers: [1, 2], // Foundation & Mindset Mastery
  },
  {
    id: "breakthrough",
    name: "BREAKTHROUGH PHASE",
    days: "Days 23-44",
    focus: "Building momentum and consistency",
    mindset: "I'm making progress",
    coreActivities: ["Advanced exercises", "Skill-building", "Habit formation"],
    icon: TrendingUp,
    partNumbers: [3, 4], // Physical Reclamation & Cognitive Comeback
  },
  {
    id: "optimization",
    name: "OPTIMIZATION PHASE",
    days: "Days 45-66",
    focus: "Mastery and acceleration",
    mindset: "I am the comeback",
    coreActivities: ["Advanced protocols", "Combining techniques", "Pushing limits"],
    icon: Rocket,
    partNumbers: [5, 6, 7], // Life Integration, Prevention & Optimization, Legacy Building
  },
];

const curriculumParts = [
  {
    partNumber: 1,
    title: "Foundation",
    subtitle: "Understanding Your New Reality",
    description: "Essential knowledge every stroke survivor needs to begin their journey",
    icon: BookOpen,
    requiredTier: "explorer",
    chapters: [
      { number: 1, title: "The Day Everything Changed", description: "Understanding what happened and why you're still here", estimatedMinutes: 25 },
      { number: 2, title: "Neuroplasticity 101", description: "Your brain's incredible ability to rewire and rebuild", estimatedMinutes: 30 },
      { number: 3, title: "The Recovery Timeline", description: "What to expect in days, weeks, months, and years", estimatedMinutes: 20 },
      { number: 4, title: "Building Your Recovery Team", description: "Doctors, therapists, caregivers, and your role", estimatedMinutes: 25 },
    ],
  },
  {
    partNumber: 2,
    title: "Mindset Mastery",
    subtitle: "The Mental Game of Recovery",
    description: "Developing the warrior mindset that drove Nick from 0% to 90%",
    icon: Brain,
    requiredTier: "warrior",
    chapters: [
      { number: 5, title: "Destroying the Victim Mentality", description: "From why me to watch me", estimatedMinutes: 35 },
      { number: 6, title: "The Power of Relentless Optimism", description: "Training your brain for success", estimatedMinutes: 25 },
      { number: 7, title: "Embracing the Suck", description: "Finding strength in struggle", estimatedMinutes: 30 },
      { number: 8, title: "Setting Impossible Goals", description: "Why thinking small is your enemy", estimatedMinutes: 25 },
      { number: 9, title: "Daily Mental Warfare", description: "Winning the battle in your mind every day", estimatedMinutes: 30 },
    ],
  },
  {
    partNumber: 3,
    title: "Physical Reclamation",
    subtitle: "Rebuilding Your Body",
    description: "Comprehensive physical rehabilitation strategies and exercises",
    icon: Zap,
    requiredTier: "warrior",
    chapters: [
      { number: 10, title: "Upper Extremity Awakening", description: "Arm, hand, and fine motor recovery", estimatedMinutes: 45 },
      { number: 11, title: "Lower Body Liberation", description: "Leg strength, balance, and walking", estimatedMinutes: 40 },
      { number: 12, title: "Core Power Restoration", description: "Rebuilding your foundation", estimatedMinutes: 35 },
      { number: 13, title: "Spasticity Management", description: "Taming the muscle beast", estimatedMinutes: 30 },
      { number: 14, title: "Pain as a Teacher", description: "Understanding and managing post-stroke pain", estimatedMinutes: 25 },
    ],
  },
  {
    partNumber: 4,
    title: "Cognitive Comeback",
    subtitle: "Sharpening the Mind",
    description: "Memory, focus, speech, and cognitive rehabilitation",
    icon: Target,
    requiredTier: "champion",
    chapters: [
      { number: 15, title: "Memory Reconstruction", description: "Techniques to rebuild and strengthen memory", estimatedMinutes: 35 },
      { number: 16, title: "Attention and Focus Training", description: "Cutting through the brain fog", estimatedMinutes: 30 },
      { number: 17, title: "Speech and Language Recovery", description: "Finding your voice again", estimatedMinutes: 40 },
      { number: 18, title: "Executive Function Restoration", description: "Planning, organizing, and decision making", estimatedMinutes: 30 },
      { number: 19, title: "Emotional Regulation", description: "Managing the rollercoaster", estimatedMinutes: 25 },
    ],
  },
  {
    partNumber: 5,
    title: "Life Integration",
    subtitle: "Thriving in the Real World",
    description: "Practical strategies for work, relationships, and daily life",
    icon: Heart,
    requiredTier: "champion",
    chapters: [
      { number: 20, title: "Returning to Work", description: "Navigating career after stroke", estimatedMinutes: 35 },
      { number: 21, title: "Relationship Reconstruction", description: "Rebuilding connections with loved ones", estimatedMinutes: 30 },
      { number: 22, title: "Adaptive Independence", description: "Tools and techniques for daily living", estimatedMinutes: 35 },
      { number: 23, title: "Financial Navigation", description: "Managing money and disability resources", estimatedMinutes: 25 },
      { number: 24, title: "Driving Again", description: "Safely returning behind the wheel", estimatedMinutes: 20 },
    ],
  },
  {
    partNumber: 6,
    title: "Prevention & Optimization",
    subtitle: "Never Again",
    description: "Preventing recurrence and optimizing long-term health",
    icon: Shield,
    requiredTier: "champion",
    chapters: [
      { number: 25, title: "Understanding Your Risk", description: "Stroke prevention fundamentals", estimatedMinutes: 30 },
      { number: 26, title: "Nutrition for Brain Health", description: "Eating for recovery and prevention", estimatedMinutes: 35 },
      { number: 27, title: "Medication Management", description: "Your pharmaceutical toolkit", estimatedMinutes: 25 },
      { number: 28, title: "Sleep Optimization", description: "The healing power of rest", estimatedMinutes: 25 },
      { number: 29, title: "Stress Mastery", description: "Controlling cortisol for recovery", estimatedMinutes: 30 },
    ],
  },
  {
    partNumber: 7,
    title: "Legacy Building",
    subtitle: "From Survivor to Thriver",
    description: "Becoming an inspiration and helping others on their journey",
    icon: Crown,
    requiredTier: "platinum",
    chapters: [
      { number: 30, title: "Finding Your Purpose", description: "Why you survived and what to do with it", estimatedMinutes: 35 },
      { number: 31, title: "Becoming an Advocate", description: "Using your story to help others", estimatedMinutes: 30 },
      { number: 32, title: "Paying It Forward", description: "Building community and mentoring", estimatedMinutes: 25 },
      { number: 33, title: "The Sasquatch Manifesto", description: "Your declaration of extraordinary recovery", estimatedMinutes: 20 },
    ],
  },
];

const tierConfig: Record<string, { name: string; icon: typeof Star; color: string }> = {
  explorer: { name: "Explorer", icon: Star, color: "text-blue-400" },
  warrior: { name: "Warrior", icon: Shield, color: "text-green-400" },
  champion: { name: "Champion", icon: Crown, color: "text-amber-400" },
  platinum: { name: "Platinum", icon: Sparkles, color: "text-amber-400" },
};

export default function RecoveryUniversity() {
  const { user } = useAuth();
  const userTier = "explorer";
  const [activePhase, setActivePhase] = useState<string>("all");

  const tierOrder = ["explorer", "warrior", "champion", "platinum"];
  const userTierIndex = tierOrder.indexOf(userTier);

  const canAccess = (requiredTier: string) => {
    const requiredIndex = tierOrder.indexOf(requiredTier);
    return userTierIndex >= requiredIndex;
  };

  const getTotalChapters = () => curriculumParts.reduce((sum, part) => sum + part.chapters.length, 0);
  const getTotalMinutes = () => curriculumParts.reduce((sum, part) => 
    sum + part.chapters.reduce((chSum, ch) => chSum + ch.estimatedMinutes, 0), 0);

  const completedChapters = 3;
  const progressPercentage = Math.round((completedChapters / getTotalChapters()) * 100);

  // Filter curriculum parts by active phase
  const getFilteredParts = () => {
    if (activePhase === "all") return curriculumParts;
    const phase = recoveryPhases.find(p => p.id === activePhase);
    if (!phase) return curriculumParts;
    return curriculumParts.filter(part => phase.partNumbers.includes(part.partNumber));
  };

  // Calculate phase-specific progress
  const getPhaseProgress = (phaseId: string) => {
    const phase = recoveryPhases.find(p => p.id === phaseId);
    if (!phase) return 0;
    const phaseParts = curriculumParts.filter(part => phase.partNumbers.includes(part.partNumber));
    const phaseChapters = phaseParts.reduce((sum, part) => sum + part.chapters.length, 0);
    const phaseCompletedChapters = phaseParts.reduce((sum, part) => 
      sum + part.chapters.filter(ch => ch.number <= completedChapters).length, 0);
    return phaseChapters > 0 ? Math.round((phaseCompletedChapters / phaseChapters) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Recovery University | Stroke Recovery Academy"
        description="Comprehensive educational curriculum for stroke recovery with 7 parts and 33 chapters covering mindset, physical recovery, cognitive rehabilitation, and life integration strategies."
        canonical="/recovery/university"
        keywords="stroke recovery education, recovery curriculum, rehabilitation training, stroke recovery courses"
        author="Stroke Recovery Academy"
        type="course"
        expertise={["Medical rehabilitation science", "Neuroplasticity education", "Comprehensive recovery training"]}
        experience="Supporting stroke survivors since 2024"
        trustSignals={["Evidence-based curriculum", "Medical expert-reviewed chapters", "Trusted by healthcare professionals"]}
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Recovery University", url: "/recovery/university" }]}
      />
      <RecoveryHeader />
      <section className="py-16 px-4 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <Badge className="mb-4" data-testid="badge-recovery-university">
                <GraduationCap className="w-3 h-3 mr-1" />
                Recovery University
              </Badge>
              <h1 className="text-4xl md:text-5xl font-black mb-4" data-testid="heading-university">
                The Ultimate Stroke Recovery <span className="text-primary">Bible</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-6" data-testid="text-university-subtitle">
                7 Parts. 33 Chapters. From 0% to 90% - Your complete guide to extraordinary recovery.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2" data-testid="stat-chapters">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>{getTotalChapters()} Chapters</span>
                </div>
                <div className="flex items-center gap-2" data-testid="stat-duration">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{Math.round(getTotalMinutes() / 60)} Hours</span>
                </div>
                <div className="flex items-center gap-2" data-testid="stat-author">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span>By Nick Kremers</span>
                </div>
              </div>
            </div>
            
            {user && (
              <Card className="w-full md:w-80" data-testid="card-progress">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Your Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Chapters Completed</span>
                        <span className="font-bold" data-testid="text-progress-count">{completedChapters}/{getTotalChapters()}</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" data-testid="progress-bar" />
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      {(() => {
                        const config = tierConfig[userTier];
                        if (!config) return null;
                        const TierIcon = config.icon;
                        return (
                          <>
                            <TierIcon className={`w-5 h-5 ${config.color}`} />
                            <span className="text-sm">{config.name} Tier</span>
                          </>
                        );
                      })()}
                      <Link href="/pricing" className="ml-auto">
                        <Button variant="ghost" size="sm" data-testid="button-upgrade">
                          Upgrade
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Phase Navigation Section */}
      <section className="py-8 px-4 border-b border-border" style={{ backgroundColor: '#FAF8F3' }} data-testid="section-phase-navigation">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2" data-testid="heading-phases">
              Nick Kremers' <span style={{ color: '#C9941A' }}>66-Day Recovery Revolution</span>
            </h2>
            <p className="text-muted-foreground">
              Follow the battle-tested three-phase system from "The Ultimate Stroke Recovery Revolution"
            </p>
          </div>
          
          {/* Phase Tabs */}
          <div className="flex flex-wrap gap-3 mb-6" data-testid="phase-tabs">
            <Button
              variant={activePhase === "all" ? "default" : "outline"}
              onClick={() => setActivePhase("all")}
              className={activePhase === "all" ? "" : "border-2"}
              style={activePhase === "all" ? { backgroundColor: '#C9941A', borderColor: '#C9941A' } : { borderColor: '#C9941A', color: '#C9941A' }}
              data-testid="tab-all-phases"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              All Phases
            </Button>
            {recoveryPhases.map((phase) => {
              const PhaseIcon = phase.icon;
              const isActive = activePhase === phase.id;
              return (
                <Button
                  key={phase.id}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setActivePhase(phase.id)}
                  className={isActive ? "" : "border-2"}
                  style={isActive ? { backgroundColor: '#C9941A', borderColor: '#C9941A' } : { borderColor: '#C9941A', color: '#C9941A' }}
                  data-testid={`tab-phase-${phase.id}`}
                >
                  <PhaseIcon className="w-4 h-4 mr-2" />
                  {phase.name}
                </Button>
              );
            })}
          </div>

          {/* Phase Cards with Progress */}
          <div className="grid md:grid-cols-3 gap-4" data-testid="phase-cards">
            {recoveryPhases.map((phase, index) => {
              const PhaseIcon = phase.icon;
              const phaseProgress = getPhaseProgress(phase.id);
              const isActive = activePhase === phase.id;
              return (
                <Card 
                  key={phase.id}
                  className={`cursor-pointer transition-all ${isActive ? 'ring-2' : 'hover-elevate'}`}
                  style={isActive ? { ringColor: '#C9941A', borderColor: '#C9941A' } : {}}
                  onClick={() => setActivePhase(phase.id)}
                  data-testid={`card-phase-${phase.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(201, 148, 26, 0.15)' }}
                      >
                        <PhaseIcon className="w-5 h-5" style={{ color: '#C9941A' }} />
                      </div>
                      <div>
                        <Badge 
                          variant="outline" 
                          className="mb-1"
                          style={{ borderColor: '#C9941A', color: '#C9941A' }}
                          data-testid={`badge-phase-days-${phase.id}`}
                        >
                          {phase.days}
                        </Badge>
                        <CardTitle className="text-base" data-testid={`text-phase-name-${phase.id}`}>{phase.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2" data-testid={`text-phase-focus-${phase.id}`}>
                      <strong>Focus:</strong> {phase.focus}
                    </p>
                    <p className="text-sm italic mb-3" style={{ color: '#C9941A' }} data-testid={`text-phase-mindset-${phase.id}`}>
                      "{phase.mindset}"
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Phase Progress</span>
                        <span className="font-semibold" data-testid={`text-phase-progress-${phase.id}`}>{phaseProgress}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(201, 148, 26, 0.2)' }}>
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ width: `${phaseProgress}%`, backgroundColor: '#C9941A' }}
                          data-testid={`progress-phase-${phase.id}`}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {phase.coreActivities.map((activity, i) => (
                        <Badge 
                          key={i} 
                          variant="secondary" 
                          className="text-xs"
                          data-testid={`badge-activity-${phase.id}-${i}`}
                        >
                          {activity}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Curriculum Section */}
      <section className="py-12 px-4" data-testid="section-curriculum">
        <div className="max-w-6xl mx-auto">
          {activePhase !== "all" && (
            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(201, 148, 26, 0.1)', borderLeft: '4px solid #C9941A' }} data-testid="active-phase-indicator">
              <div className="flex items-center gap-2">
                {(() => {
                  const phase = recoveryPhases.find(p => p.id === activePhase);
                  if (!phase) return null;
                  const PhaseIcon = phase.icon;
                  return (
                    <>
                      <PhaseIcon className="w-5 h-5" style={{ color: '#C9941A' }} />
                      <span className="font-semibold" style={{ color: '#C9941A' }}>{phase.name}</span>
                      <span className="text-muted-foreground">| {phase.days}</span>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
          <Accordion type="multiple" className="space-y-4" data-testid="accordion-curriculum">
            {getFilteredParts().map((part) => {
              const PartIcon = part.icon;
              const hasAccess = canAccess(part.requiredTier);
              const TierInfo = tierConfig[part.requiredTier];
              
              return (
                <AccordionItem 
                  key={part.partNumber} 
                  value={`part-${part.partNumber}`}
                  className="border rounded-lg bg-card overflow-hidden"
                  data-testid={`part-${part.partNumber}`}
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover-elevate">
                    <div className="flex items-start gap-4 text-left flex-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${hasAccess ? 'bg-primary/10' : 'bg-muted'}`}>
                        {hasAccess ? (
                          <PartIcon className="w-6 h-6 text-primary" />
                        ) : (
                          <Lock className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm text-muted-foreground">Part {part.partNumber}</span>
                          <Badge variant="outline" className={TierInfo.color} data-testid={`badge-tier-${part.partNumber}`}>
                            <TierInfo.icon className="w-3 h-3 mr-1" />
                            {TierInfo.name}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold" data-testid={`text-part-title-${part.partNumber}`}>
                          {part.title}: {part.subtitle}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{part.description}</p>
                      </div>
                      <div className="text-right shrink-0 hidden md:block">
                        <span className="text-sm text-muted-foreground">{part.chapters.length} chapters</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-3 pt-2">
                      {part.chapters.map((chapter, index) => {
                        const isCompleted = chapter.number <= completedChapters;
                        const isCurrent = chapter.number === completedChapters + 1;
                        
                        return (
                          <div 
                            key={chapter.number}
                            className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                              hasAccess 
                                ? isCurrent 
                                  ? 'bg-primary/10 border border-primary/30' 
                                  : 'bg-muted/50 hover-elevate cursor-pointer'
                                : 'bg-muted/30 opacity-60'
                            }`}
                            data-testid={`chapter-${chapter.number}`}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                              isCompleted ? 'bg-green-500/20' : 
                              isCurrent ? 'bg-primary/20' : 'bg-muted'
                            }`}>
                              {!hasAccess ? (
                                <Lock className="w-4 h-4 text-muted-foreground" />
                              ) : isCompleted ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : isCurrent ? (
                                <Play className="w-4 h-4 text-primary" />
                              ) : (
                                <span className="text-sm font-medium text-muted-foreground">{chapter.number}</span>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate" data-testid={`text-chapter-title-${chapter.number}`}>
                                Chapter {chapter.number}: {chapter.title}
                              </h4>
                              <p className="text-sm text-muted-foreground truncate">{chapter.description}</p>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground" data-testid={`text-chapter-duration-${chapter.number}`}>
                                {chapter.estimatedMinutes} min
                              </span>
                            </div>
                            
                            {hasAccess && (
                              <Button
                                variant={isCurrent ? "default" : isCompleted ? "ghost" : "outline"}
                                size="sm"
                                data-testid={`button-chapter-${chapter.number}`}
                              >
                                {isCompleted ? "Review" : isCurrent ? "Continue" : "Start"}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {!hasAccess && (
                      <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-3">
                          <Lock className="w-5 h-5 text-primary" />
                          <div className="flex-1">
                            <p className="font-medium">Upgrade to {TierInfo.name} to unlock this section</p>
                            <p className="text-sm text-muted-foreground">Get full access to all {part.chapters.length} chapters</p>
                          </div>
                          <Link href="/pricing">
                            <Button size="sm" data-testid={`button-unlock-part-${part.partNumber}`}>
                              Unlock Now
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </section>

      <section className="py-16 px-4 bg-card/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4" data-testid="heading-cta">
            Ready to Start Your <span className="text-primary">Extraordinary</span> Recovery?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of stroke survivors who are rebuilding, rewiring, and rising.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <>
                <Link href="/api/login">
                  <Button size="lg" data-testid="button-get-started">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" size="lg" data-testid="button-view-plans">
                    View All Plans
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button size="lg" data-testid="button-continue-learning">
                  Continue Learning
                </Button>
                <Link href="/pricing">
                  <Button variant="outline" size="lg" data-testid="button-upgrade-plan">
                    Upgrade Your Plan
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
