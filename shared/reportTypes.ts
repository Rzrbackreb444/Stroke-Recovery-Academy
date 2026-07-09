// Shared Recovery Report shapes — imported by both the server computation
// service and the client report/share pages so the contract stays in sync.

export interface DeficitPoint {
  date: string; // ISO date (YYYY-MM-DD)
  physical: number | null;
  cognitive: number | null;
  speech: number | null;
  emotional: number | null;
  memory: number | null;
}

export interface ConsistencyPoint {
  date: string;
  reps: number;
  checkedIn: boolean;
}

export interface VolumePoint {
  weekStart: string; // ISO date of week's Monday
  reps: number;
  sessions: number;
}

export interface MoodPoint {
  date: string;
  mood: number | null;
  energy: number | null;
}

export interface FlickerPoint {
  date: string;
  bodyPart: string | null;
  intensity: number;
  isBreakthrough: boolean;
  moment?: string; // owner-only; stripped in public projection
}

export interface VitalsPoint {
  date: string;
  systolic: number | null;
  diastolic: number | null;
  heartRate: number | null;
}

export interface MilestonePoint {
  date: string;
  name: string;
  category: string;
}

export interface ReportSummary {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  totalReps: number;
  exerciseSessions: number;
  flickerCount: number;
  breakthroughCount: number;
  milestoneCount: number;
  assessmentCount: number;
}

export interface RecoveryReport {
  generatedAt: string;
  hasData: boolean;
  tenure: {
    memberSince: string | null;
    daysTracked: number;
  };
  summary: ReportSummary;
  deficitTrend: DeficitPoint[];
  consistency: ConsistencyPoint[];
  exerciseVolume: VolumePoint[];
  moodEnergy: MoodPoint[];
  flickers: FlickerPoint[];
  vitals: VitalsPoint[];
  milestones: MilestonePoint[];
}

export interface PublicRecoveryReport extends Omit<RecoveryReport, "flickers"> {
  flickers: Omit<FlickerPoint, "moment">[];
}
