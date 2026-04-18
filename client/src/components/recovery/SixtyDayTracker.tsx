import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Flame, Trophy, CheckCircle, Calendar } from "lucide-react";

interface Phase {
  name: string;
  subtitle: string;
  days: [number, number];
  icon: typeof Target;
  color: string;
}

const PHASES: Phase[] = [
  {
    name: "SURVIVAL PHASE",
    subtitle: "Building the foundation",
    days: [1, 22],
    icon: Target,
    color: "#C9941A",
  },
  {
    name: "BREAKTHROUGH PHASE",
    subtitle: "Momentum building",
    days: [23, 44],
    icon: Flame,
    color: "#FF6B35",
  },
  {
    name: "OPTIMIZATION PHASE",
    subtitle: "Mastery mode",
    days: [45, 66],
    icon: Trophy,
    color: "#22C55E",
  },
];

const MOTIVATIONAL_MESSAGES: Record<string, string[]> = {
  "SURVIVAL PHASE": [
    "Every step counts. You're building something powerful.",
    "The foundation you lay today determines the building you'll live in tomorrow.",
    "Survival mode engaged. Keep showing up.",
    "You're not just surviving — you're becoming.",
  ],
  "BREAKTHROUGH PHASE": [
    "The momentum is building. Feel that power!",
    "You've proven you can show up. Now it's time to level up.",
    "Breakthrough territory — old limits no longer apply.",
    "This is where warriors are forged. Keep pushing!",
  ],
  "OPTIMIZATION PHASE": [
    "Mastery mode activated. You're becoming unstoppable.",
    "66 days of transformation. This is who you are now.",
    "The habits are locked in. You've rewritten your story.",
    "You didn't just change a habit — you changed your life.",
  ],
};

function getPhase(day: number): Phase {
  for (const phase of PHASES) {
    if (day >= phase.days[0] && day <= phase.days[1]) {
      return phase;
    }
  }
  return PHASES[0];
}

function getStreak(completedDays: number[]): number {
  if (completedDays.length === 0) return 0;
  
  const sorted = [...completedDays].sort((a, b) => b - a);
  let streak = 1;
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] - 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

function getMotivationalMessage(phaseName: string): string {
  const messages = MOTIVATIONAL_MESSAGES[phaseName] || MOTIVATIONAL_MESSAGES["SURVIVAL PHASE"];
  return messages[Math.floor(Math.random() * messages.length)];
}

export default function SixtyDayTracker() {
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [motivationalMessage, setMotivationalMessage] = useState<string>("");
  const { data: personaData } = useQuery<{ persona: { name: string; creed: string; accentColor: string } | null }>({
    queryKey: ['/api/persona/me'],
  });
  const persona = personaData?.persona ?? null;

  const currentPhase = useMemo(() => getPhase(currentDay), [currentDay]);
  const streak = useMemo(() => getStreak(completedDays), [completedDays]);
  const progressPercentage = useMemo(() => Math.round((completedDays.length / 66) * 100), [completedDays]);
  const isTodayCompleted = completedDays.includes(currentDay);

  useEffect(() => {
    const savedData = localStorage.getItem("sixtyDayTracker");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setCurrentDay(parsed.currentDay || 1);
        setCompletedDays(parsed.completedDays || []);
        setLastCheckIn(parsed.lastCheckIn || null);
      } catch (e) {
        console.error("Failed to parse saved tracker data");
      }
    }
  }, []);

  useEffect(() => {
    setMotivationalMessage(getMotivationalMessage(currentPhase.name));
  }, [currentPhase.name]);

  useEffect(() => {
    localStorage.setItem("sixtyDayTracker", JSON.stringify({
      currentDay,
      completedDays,
      lastCheckIn,
    }));
  }, [currentDay, completedDays, lastCheckIn]);

  const handleCheckIn = () => {
    if (isTodayCompleted) return;

    const today = new Date().toISOString().split("T")[0];
    setCompletedDays((prev) => [...prev, currentDay]);
    setLastCheckIn(today);

    if (currentDay < 66) {
      setCurrentDay((prev) => prev + 1);
    }
  };

  const PhaseIcon = currentPhase.icon;
  const circumference = 2 * Math.PI * 45;
  const dayProgress = (currentDay / 66) * circumference;

  return (
    <Card 
      className="w-full overflow-visible"
      style={{ backgroundColor: "#FAF8F3" }}
      data-testid="sixty-day-tracker"
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" style={{ color: "#C9941A" }} />
            <h3 className="text-lg font-bold text-foreground" data-testid="tracker-title">
              66-Day Transformation
            </h3>
          </div>
          <Badge 
            variant="outline" 
            className="border-2"
            style={{ borderColor: currentPhase.color, color: currentPhase.color }}
            data-testid="phase-badge"
          >
            <PhaseIcon className="h-3 w-3 mr-1" />
            {currentPhase.name}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative flex-shrink-0" data-testid="day-progress-circle">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#E5E5E5"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke={currentPhase.color}
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - dayProgress}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span 
                className="text-3xl font-black" 
                style={{ color: currentPhase.color }}
                data-testid="current-day"
              >
                {currentDay}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                of 66
              </span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-3">
            <div>
              <p 
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: currentPhase.color }}
                data-testid="phase-name"
              >
                {currentPhase.name}
              </p>
              <p className="text-muted-foreground text-sm" data-testid="phase-subtitle">
                {currentPhase.subtitle}
              </p>
            </div>

            <p
              className="text-foreground italic text-sm border-l-2 pl-3"
              style={{ borderColor: persona?.accentColor || "#C9941A" }}
              data-testid="motivational-message"
            >
              {persona && streak > 0 ? (
                <>"{persona.name} keeps the streak. Day {streak}."</>
              ) : persona && streak === 0 && completedDays.length > 0 ? (
                <>"{persona.name} doesn't quit on a broken streak. Today is rep one again."</>
              ) : (
                <>"{motivationalMessage}"</>
              )}
            </p>
          </div>
        </div>

        <div 
          className="flex flex-wrap items-center justify-center gap-4 p-4 rounded-lg"
          style={{ backgroundColor: "rgba(201, 148, 26, 0.1)" }}
        >
          <div className="flex items-center gap-2" data-testid="streak-indicator">
            <Flame className="h-5 w-5" style={{ color: "#FF6B35" }} />
            <div>
              <span className="text-xl font-bold text-foreground">{streak}</span>
              <span className="text-sm text-muted-foreground ml-1">day streak</span>
            </div>
          </div>

          <div className="h-8 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-2" data-testid="completed-count">
            <CheckCircle className="h-5 w-5" style={{ color: "#22C55E" }} />
            <div>
              <span className="text-xl font-bold text-foreground">{completedDays.length}</span>
              <span className="text-sm text-muted-foreground ml-1">days completed</span>
            </div>
          </div>

          <div className="h-8 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-2" data-testid="trophy-indicator">
            <Trophy className="h-5 w-5" style={{ color: "#C9941A" }} />
            <div>
              <span className="text-xl font-bold text-foreground">{66 - completedDays.length}</span>
              <span className="text-sm text-muted-foreground ml-1">days remaining</span>
            </div>
          </div>
        </div>

        <div className="space-y-2" data-testid="progress-section">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-semibold" style={{ color: "#C9941A" }} data-testid="progress-percentage">
              {progressPercentage}%
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-3"
            data-testid="progress-bar"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleCheckIn}
            disabled={isTodayCompleted || currentDay > 66}
            className="flex-1 gap-2 font-semibold"
            style={{ 
              backgroundColor: isTodayCompleted ? "#E5E5E5" : "#C9941A",
              color: isTodayCompleted ? "#666" : "#FFF"
            }}
            data-testid="button-checkin"
          >
            {isTodayCompleted ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Day {currentDay} Complete
              </>
            ) : currentDay > 66 ? (
              <>
                <Trophy className="h-4 w-4" />
                Transformation Complete!
              </>
            ) : (
              <>
                <Target className="h-4 w-4" />
                Check In Day {currentDay}
              </>
            )}
          </Button>
        </div>

        {lastCheckIn && (
          <p className="text-xs text-center text-muted-foreground" data-testid="last-checkin">
            Last check-in: {new Date(lastCheckIn).toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
