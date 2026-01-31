import { db } from "./db";
import { 
  recoveryPrograms, 
  programModules, 
  programLessons,
  recoveryHabits,
  recoveryMilestones,
  therapeuticExercises,
  speechExercises,
  cognitiveExercises
} from "@shared/schema";
import { eq } from "drizzle-orm";

const programs = [
  {
    name: "Recovery University - Explorer",
    slug: "recovery-university-explorer",
    description: "For survivors just beginning their recovery journey. Focus on foundational movements, mindset, and building consistency.",
    tier: "explorer",
    difficulty: "beginner",
    estimatedWeeks: 12,
    moduleCount: 6,
    isActive: true,
  },
  {
    name: "Recovery University - Warrior",
    slug: "recovery-university-warrior",
    description: "For survivors ready to push boundaries. Advanced techniques, plateaus breakers, and intensive protocols.",
    tier: "warrior",
    difficulty: "intermediate",
    estimatedWeeks: 16,
    moduleCount: 6,
    isActive: true,
  },
  {
    name: "Recovery University - Champion",
    slug: "recovery-university-champion",
    description: "The ultimate recovery curriculum. Master-level techniques, leadership training, and helping others.",
    tier: "champion",
    difficulty: "advanced",
    estimatedWeeks: 24,
    moduleCount: 6,
    isActive: true,
  }
];

const explorerModules = [
  { title: "Enrollment Day", description: "Understanding your journey and building the foundation of hope", order: 1 },
  { title: "Brain Science Basics", description: "Your brain's incredible healing power and neuroplasticity", order: 2 },
  { title: "First Steps", description: "Small victories build big comebacks - foundational movements", order: 3 },
  { title: "Think-Twitch-Move", description: "The core progression from thought to movement", order: 4 },
  { title: "Mental Mastery", description: "Building unbreakable mental strength", order: 5 },
  { title: "Building Community", description: "Your support network and accountability", order: 6 },
];

const warriorModules = [
  { title: "The Plateau Wars", description: "When progress stops - breakthrough strategies", order: 1 },
  { title: "Drop Foot Mastery", description: "Conquering drop foot and reclaiming your stride", order: 2 },
  { title: "Arm & Hand Recovery", description: "The long road back - intensive protocols", order: 3 },
  { title: "Mirror Therapy Advanced", description: "Thinking movement into existence", order: 4 },
  { title: "Baseball Bat Method", description: "Nick's revolutionary training technique", order: 5 },
  { title: "66-Day Transformation", description: "Building lasting habits that stick", order: 6 },
];

const championModules = [
  { title: "Advanced Techniques", description: "Bioness, robotics, and cutting-edge recovery", order: 1 },
  { title: "Nutrition & Sleep", description: "Fueling brain recovery for maximum results", order: 2 },
  { title: "From Student to Teacher", description: "Teaching others and leaving your legacy", order: 3 },
  { title: "Creating Content", description: "Sharing your story to help others", order: 4 },
  { title: "Building StrokeLyfe", description: "Creating your empire of hope", order: 5 },
  { title: "Your Impossible Life", description: "Living proof that anything is possible", order: 6 },
];

const explorerLessons = [
  { title: "Welcome to Recovery University", lessonType: "video", estimatedMinutes: 15, content: "An introduction to your recovery journey with Nick. Learn what makes this program different and how to get the most out of your time here.", order: 1 },
  { title: "Your Recovery Roadmap", lessonType: "reading", estimatedMinutes: 10, content: "Understanding the phases of stroke recovery and setting realistic expectations for your journey ahead.", order: 2 },
  { title: "Setting Your First Goals", lessonType: "exercise", estimatedMinutes: 20, content: "A guided exercise to identify your top 3 recovery priorities and create actionable first steps.", order: 3 },
  { title: "The Survivor's Mindset", lessonType: "reflection", estimatedMinutes: 15, content: "Journaling prompts to explore your current mindset and begin shifting from victim to survivor to thriver.", order: 4 },
  { title: "Module 1 Assessment", lessonType: "quiz", estimatedMinutes: 10, content: "Test your understanding of the enrollment materials and your readiness to begin.", order: 5 },
];

const warriorLessons = [
  { title: "Understanding Plateaus", lessonType: "video", estimatedMinutes: 20, content: "Nick explains why plateaus happen and the science behind breakthrough moments in recovery.", order: 1 },
  { title: "The Plateau Busting Protocol", lessonType: "reading", estimatedMinutes: 15, content: "Learn the exact strategies Nick used to break through his own recovery plateaus.", order: 2 },
  { title: "Intensity Training Basics", lessonType: "exercise", estimatedMinutes: 25, content: "A guided workout designed to push past comfort zones safely and effectively.", order: 3 },
  { title: "Tracking Your Breakthroughs", lessonType: "reflection", estimatedMinutes: 10, content: "Document your plateau experiences and identify patterns that will help you push through.", order: 4 },
];

const championLessons = [
  { title: "The Future of Recovery", lessonType: "video", estimatedMinutes: 25, content: "Explore cutting-edge technologies and therapies that are revolutionizing stroke recovery.", order: 1 },
  { title: "Understanding Bioness & FES", lessonType: "reading", estimatedMinutes: 20, content: "A deep dive into functional electrical stimulation and how it can accelerate your recovery.", order: 2 },
  { title: "Robotics-Assisted Therapy", lessonType: "reading", estimatedMinutes: 15, content: "Learn about robotic therapy options and how to access them in your area.", order: 3 },
  { title: "Creating Your Advanced Protocol", lessonType: "exercise", estimatedMinutes: 30, content: "Design a personalized advanced recovery protocol incorporating multiple modalities.", order: 4 },
  { title: "Technology Assessment", lessonType: "quiz", estimatedMinutes: 15, content: "Test your understanding of advanced recovery technologies and their applications.", order: 5 },
];

const defaultHabits = [
  { name: "Morning Movement", description: "10+ minutes of any movement to start your day", category: "exercise", frequency: "daily", targetDays: 66, isDefault: true },
  { name: "Mirror Therapy Session", description: "15 minutes of mirror therapy for affected limbs", category: "therapy", frequency: "daily", targetDays: 66, isDefault: true },
  { name: "Mindful Breathing", description: "5 minutes of deep breathing and mental visualization", category: "mindfulness", frequency: "daily", targetDays: 66, isDefault: true },
  { name: "Gratitude Journal", description: "Write 3 things you're grateful for", category: "mindfulness", frequency: "daily", targetDays: 66, isDefault: true },
  { name: "Hand Exercises", description: "Open/close hand exercises to prevent contractures", category: "exercise", frequency: "daily", targetDays: 66, isDefault: true },
  { name: "Walking Practice", description: "Dedicated walking practice with proper form", category: "exercise", frequency: "daily", targetDays: 66, isDefault: true },
  { name: "Brain Training", description: "Cognitive exercises or puzzles", category: "therapy", frequency: "daily", targetDays: 66, isDefault: true },
  { name: "Hydration Check", description: "Drink 8+ glasses of water", category: "nutrition", frequency: "daily", targetDays: 66, isDefault: true },
];

const milestones = [
  { name: "First Twitch", description: "First voluntary muscle movement in affected limb", category: "physical", pointsAwarded: 100, order: 1 },
  { name: "Sitting Balance", description: "Able to sit unsupported for 30 seconds", category: "physical", pointsAwarded: 150, order: 2 },
  { name: "Standing Moment", description: "First time standing with assistance", category: "physical", pointsAwarded: 200, order: 3 },
  { name: "First Steps", description: "First unassisted steps", category: "physical", pointsAwarded: 500, order: 4 },
  { name: "Walking 100 Feet", description: "Walk 100 feet independently", category: "physical", pointsAwarded: 750, order: 5 },
  { name: "Grip Regained", description: "Able to grip and hold objects", category: "physical", pointsAwarded: 400, order: 6 },
  { name: "Drop Foot Conquered", description: "Walking without AFO brace", category: "physical", pointsAwarded: 1000, order: 7 },
  { name: "Hope Rekindled", description: "First moment of genuine hope for recovery", category: "emotional", pointsAwarded: 100, order: 1 },
  { name: "Plateau Breaker", description: "Pushed through a recovery plateau", category: "emotional", pointsAwarded: 300, order: 2 },
  { name: "Inspiration Shared", description: "Helped another survivor with advice or encouragement", category: "emotional", pointsAwarded: 250, order: 3 },
  { name: "7-Day Streak", description: "7 consecutive days of activity", category: "social", pointsAwarded: 100, order: 1 },
  { name: "30-Day Streak", description: "30 consecutive days of activity", category: "social", pointsAwarded: 500, order: 2 },
  { name: "66-Day Master", description: "Completed the 66-day habit challenge", category: "social", pointsAwarded: 1000, order: 3 },
  { name: "Words Returned", description: "Speaking full sentences clearly", category: "cognitive", pointsAwarded: 400, order: 1 },
  { name: "Memory Milestone", description: "Significant improvement in memory function", category: "cognitive", pointsAwarded: 300, order: 2 },
];

export interface SeedResult {
  programsCreated: number;
  modulesCreated: number;
  lessonsCreated: number;
  habitsCreated: number;
  milestonesCreated: number;
  exercisesCreated: number;
  speechExercisesCreated: number;
  cognitiveExercisesCreated: number;
  skipped: string[];
}

export async function seedRecoveryData(): Promise<SeedResult> {
  const result: SeedResult = {
    programsCreated: 0,
    modulesCreated: 0,
    lessonsCreated: 0,
    habitsCreated: 0,
    milestonesCreated: 0,
    exercisesCreated: 0,
    speechExercisesCreated: 0,
    cognitiveExercisesCreated: 0,
    skipped: [],
  };

  const existingPrograms = await db.select().from(recoveryPrograms);
  if (existingPrograms.length > 0) {
    result.skipped.push("programs (already exist)");
  } else {
    for (const program of programs) {
      const [createdProgram] = await db.insert(recoveryPrograms).values(program).returning();
      result.programsCreated++;

      let modules: typeof explorerModules;
      let lessons: typeof explorerLessons;

      if (program.tier === "explorer") {
        modules = explorerModules;
        lessons = explorerLessons;
      } else if (program.tier === "warrior") {
        modules = warriorModules;
        lessons = warriorLessons;
      } else {
        modules = championModules;
        lessons = championLessons;
      }

      for (const module of modules) {
        const [createdModule] = await db.insert(programModules).values({
          programId: createdProgram.id,
          title: module.title,
          description: module.description,
          order: module.order,
          lessonCount: module.order === 1 ? lessons.length : 0,
          estimatedMinutes: module.order === 1 ? lessons.reduce((acc, l) => acc + (l.estimatedMinutes || 0), 0) : 45,
        }).returning();
        result.modulesCreated++;

        if (module.order === 1) {
          for (const lesson of lessons) {
            await db.insert(programLessons).values({
              moduleId: createdModule.id,
              title: lesson.title,
              content: lesson.content,
              order: lesson.order,
              lessonType: lesson.lessonType,
              estimatedMinutes: lesson.estimatedMinutes,
            });
            result.lessonsCreated++;
          }
        }
      }
    }
  }

  const existingHabits = await db.select().from(recoveryHabits).where(eq(recoveryHabits.isDefault, true));
  if (existingHabits.length > 0) {
    result.skipped.push("habits (already exist)");
  } else {
    for (const habit of defaultHabits) {
      await db.insert(recoveryHabits).values(habit);
      result.habitsCreated++;
    }
  }

  const existingMilestones = await db.select().from(recoveryMilestones);
  if (existingMilestones.length > 0) {
    result.skipped.push("milestones (already exist)");
  } else {
    for (const milestone of milestones) {
      await db.insert(recoveryMilestones).values(milestone);
      result.milestonesCreated++;
    }
  }

  // Seed therapeutic exercises
  const existingTherapeutic = await db.select().from(therapeuticExercises);
  if (existingTherapeutic.length > 0) {
    result.skipped.push("therapeutic exercises (already exist)");
  } else {
    for (const exercise of therapeuticExerciseData) {
      await db.insert(therapeuticExercises).values(exercise);
    }
    result.exercisesCreated = therapeuticExerciseData.length;
  }

  // Seed speech exercises
  const existingSpeech = await db.select().from(speechExercises);
  if (existingSpeech.length > 0) {
    result.skipped.push("speech exercises (already exist)");
  } else {
    for (const exercise of speechExerciseData) {
      await db.insert(speechExercises).values(exercise);
    }
    result.speechExercisesCreated = speechExerciseData.length;
  }

  // Seed cognitive exercises
  const existingCognitive = await db.select().from(cognitiveExercises);
  if (existingCognitive.length > 0) {
    result.skipped.push("cognitive exercises (already exist)");
  } else {
    for (const exercise of cognitiveExerciseData) {
      await db.insert(cognitiveExercises).values(exercise);
    }
    result.cognitiveExercisesCreated = cognitiveExerciseData.length;
  }

  return result;
}

// Therapeutic Exercises - Upper Extremity, Balance & Gait
const therapeuticExerciseData = [
  {
    name: "Finger Extension Sequence",
    slug: "finger-extension-sequence",
    description: "Progressive finger extension exercise to restore fine motor control and reduce contractures",
    category: "upper_extremity",
    subcategory: "finger_dexterity",
    difficulty: "beginner",
    targetArea: ["fingers", "hand"],
    instructions: "Start with your hand resting flat. Slowly extend each finger one at a time, holding for 3 seconds. Return to neutral and repeat. Focus on controlled, deliberate movement.",
    gameType: "tap_sequence",
    gameConfig: { duration: 60, targets: 8, speed: "slow" },
    benefits: ["Improves finger independence", "Reduces spasticity", "Increases range of motion"],
    contraindications: ["Severe pain", "Recent surgery"],
    estimatedTime: 5,
    pointsValue: 50,
    isActive: true,
  },
  {
    name: "Grip Strength Builder",
    slug: "grip-strength-builder",
    description: "Progressive grip exercises using resistance to rebuild hand strength for daily activities",
    category: "upper_extremity",
    subcategory: "grip_strength",
    difficulty: "beginner",
    targetArea: ["hand", "forearm"],
    instructions: "Squeeze a soft ball or putty, hold for 5 seconds, then slowly release. Complete 10 repetitions. Rest 30 seconds between sets.",
    gameType: "hold_and_release",
    gameConfig: { holdDuration: 5, reps: 10, sets: 3 },
    benefits: ["Increases grip strength", "Improves hand endurance", "Supports daily living tasks"],
    contraindications: ["Acute inflammation", "Severe spasticity"],
    estimatedTime: 8,
    pointsValue: 60,
    isActive: true,
  },
  {
    name: "Shoulder Range of Motion",
    slug: "shoulder-rom",
    description: "Gentle shoulder exercises to maintain and improve range of motion in the affected arm",
    category: "upper_extremity",
    subcategory: "shoulder_rom",
    difficulty: "beginner",
    targetArea: ["shoulder"],
    instructions: "Sitting or standing with support, slowly raise your affected arm forward as high as comfortable. Hold 3 seconds, lower slowly. Repeat 10 times.",
    gameType: "range_tracking",
    gameConfig: { targetAngle: 90, reps: 10, restPeriod: 5 },
    benefits: ["Prevents frozen shoulder", "Maintains mobility", "Reduces pain"],
    contraindications: ["Shoulder subluxation", "Recent injury"],
    estimatedTime: 10,
    pointsValue: 70,
    isActive: true,
  },
  {
    name: "Wrist Circles",
    slug: "wrist-circles",
    description: "Circular wrist movements to improve flexibility and reduce stiffness",
    category: "upper_extremity",
    subcategory: "wrist_mobility",
    difficulty: "beginner",
    targetArea: ["wrist"],
    instructions: "Support your forearm on a table. Make slow circles with your wrist - 10 clockwise, then 10 counter-clockwise. Keep movements controlled and pain-free.",
    gameType: "circular_motion",
    gameConfig: { reps: 10, directions: 2, speed: "slow" },
    benefits: ["Improves wrist flexibility", "Reduces stiffness", "Enhances blood flow"],
    contraindications: ["Wrist fracture", "Severe carpal tunnel"],
    estimatedTime: 5,
    pointsValue: 40,
    isActive: true,
  },
  {
    name: "Elbow Flexion & Extension",
    slug: "elbow-flex-extend",
    description: "Controlled elbow bending and straightening to maintain arm function",
    category: "upper_extremity",
    subcategory: "elbow_rom",
    difficulty: "beginner",
    targetArea: ["elbow", "biceps", "triceps"],
    instructions: "With arm supported, slowly bend your elbow bringing your hand toward your shoulder. Hold 3 seconds, then slowly straighten. Repeat 12 times.",
    gameType: "range_tracking",
    gameConfig: { reps: 12, holdDuration: 3, targetAngle: 145 },
    benefits: ["Maintains elbow mobility", "Strengthens arm muscles", "Prevents contractures"],
    contraindications: ["Elbow joint injury", "Severe spasticity"],
    estimatedTime: 8,
    pointsValue: 55,
    isActive: true,
  },
  {
    name: "Weight Bearing Through Arm",
    slug: "weight-bearing-arm",
    description: "Supported weight bearing to activate dormant arm muscles and improve proprioception",
    category: "upper_extremity",
    subcategory: "weight_bearing",
    difficulty: "intermediate",
    targetArea: ["arm", "shoulder", "wrist"],
    instructions: "Place your affected hand flat on a table. Lean gently into your arm, putting weight through it. Hold 10 seconds, release. Repeat 8 times.",
    gameType: "pressure_hold",
    gameConfig: { holdDuration: 10, reps: 8, intensity: "moderate" },
    benefits: ["Activates muscle tone", "Improves joint awareness", "Prepares for functional use"],
    contraindications: ["Shoulder subluxation", "Wrist pain"],
    estimatedTime: 10,
    pointsValue: 80,
    isActive: true,
  },
  {
    name: "Seated Balance Challenge",
    slug: "seated-balance",
    description: "Core stability exercises while seated to build foundational balance",
    category: "balance_gait",
    subcategory: "core_stability",
    difficulty: "beginner",
    targetArea: ["core", "trunk"],
    instructions: "Sit on edge of sturdy chair without back support. Slowly reach forward with both hands, maintaining balance. Return to center. Repeat in all directions.",
    gameType: "balance_tracking",
    gameConfig: { directions: 4, holdDuration: 5, sets: 3 },
    benefits: ["Improves trunk control", "Builds core strength", "Foundation for standing"],
    contraindications: ["Severe trunk weakness", "Risk of falling"],
    estimatedTime: 10,
    pointsValue: 75,
    isActive: true,
  },
  {
    name: "Standing Weight Shifts",
    slug: "standing-weight-shifts",
    description: "Side-to-side and front-to-back weight shifts while standing with support",
    category: "balance_gait",
    subcategory: "weight_shifting",
    difficulty: "intermediate",
    targetArea: ["legs", "core", "ankles"],
    instructions: "Stand with support (counter or bars). Slowly shift weight to affected leg, hold 5 seconds. Return to center, shift to other side. Repeat 10 times each direction.",
    gameType: "weight_distribution",
    gameConfig: { holdDuration: 5, reps: 10, directions: 4 },
    benefits: ["Prepares for walking", "Improves leg strength", "Builds confidence"],
    contraindications: ["Severe balance issues without support", "Recent fall"],
    estimatedTime: 12,
    pointsValue: 90,
    isActive: true,
  },
  {
    name: "Heel Raises",
    slug: "heel-raises",
    description: "Calf strengthening exercise to improve push-off during walking",
    category: "balance_gait",
    subcategory: "ankle_strength",
    difficulty: "intermediate",
    targetArea: ["calves", "ankles"],
    instructions: "Stand with hand support. Rise up on your toes, hold 3 seconds, lower slowly. Complete 15 repetitions. Focus on controlled movement.",
    gameType: "repetition_counter",
    gameConfig: { reps: 15, holdDuration: 3, sets: 2 },
    benefits: ["Strengthens calves", "Improves push-off", "Enhances balance"],
    contraindications: ["Ankle pain", "Severe drop foot"],
    estimatedTime: 8,
    pointsValue: 65,
    isActive: true,
  },
  {
    name: "Step-Ups",
    slug: "step-ups",
    description: "Stepping onto a low step to build leg strength and stair-climbing ability",
    category: "balance_gait",
    subcategory: "leg_strength",
    difficulty: "advanced",
    targetArea: ["quadriceps", "glutes", "hip flexors"],
    instructions: "Using a low step (4-6 inches) and handrail, step up with affected leg first. Bring other foot up. Step down with unaffected leg first. Repeat 10 times.",
    gameType: "step_counter",
    gameConfig: { reps: 10, stepHeight: 6, sets: 2 },
    benefits: ["Builds stair climbing ability", "Strengthens legs", "Improves confidence"],
    contraindications: ["Severe balance deficit", "Knee pain"],
    estimatedTime: 15,
    pointsValue: 100,
    isActive: true,
  },
  {
    name: "Mirror Therapy Session",
    slug: "mirror-therapy",
    description: "Use visual feedback to trick the brain into moving the affected limb",
    category: "upper_extremity",
    subcategory: "neuroplasticity",
    difficulty: "intermediate",
    targetArea: ["hand", "arm"],
    instructions: "Place mirror between arms. Watch reflection of good hand while attempting same movement with affected hand. Do finger spreads, grips, and reaches for 15 minutes.",
    gameType: "mirror_tracking",
    gameConfig: { duration: 900, movements: ["spread", "grip", "reach"] },
    benefits: ["Activates motor pathways", "Reduces phantom sensations", "Speeds recovery"],
    contraindications: ["Visual impairment", "Severe cognitive issues"],
    estimatedTime: 15,
    pointsValue: 120,
    isActive: true,
  },
  {
    name: "Target Reaching",
    slug: "target-reaching",
    description: "Reach for targets at different positions to improve arm control and coordination",
    category: "upper_extremity",
    subcategory: "coordination",
    difficulty: "intermediate",
    targetArea: ["arm", "shoulder", "hand"],
    instructions: "Place objects at different heights and distances. Reach to touch each one with your affected hand. Focus on smooth, controlled movements. Complete 3 circuits.",
    gameType: "target_hit",
    gameConfig: { targets: 6, circuits: 3, accuracy: 80 },
    benefits: ["Improves reaching accuracy", "Builds coordination", "Functional for daily tasks"],
    contraindications: ["Severe shoulder pain", "Extreme fatigue"],
    estimatedTime: 12,
    pointsValue: 85,
    isActive: true,
  },
];

// Speech Exercises
const speechExerciseData = [
  {
    name: "Word Repetition - Basic",
    category: "aphasia",
    difficulty: "beginner",
    promptType: "word",
    promptContent: "cat, dog, home, eat, walk, book, water, sleep",
    expectedResponse: "Single word repetition with clear pronunciation",
    phonemes: ["k", "d", "h", "t"],
    hints: ["Listen carefully", "Start slowly", "Say each sound"],
    order: 1,
    isActive: true,
  },
  {
    name: "Functional Phrases",
    category: "aphasia",
    difficulty: "beginner",
    promptType: "phrase",
    promptContent: "Thank you, Please help, I need water, Excuse me, How are you, Good morning",
    expectedResponse: "Complete phrase with natural rhythm",
    phonemes: ["th", "pl", "w", "h", "g"],
    hints: ["Practice useful phrases", "Take your time", "Focus on meaning"],
    order: 2,
    isActive: true,
  },
  {
    name: "Picture Naming",
    category: "aphasia",
    difficulty: "beginner",
    promptType: "naming",
    promptContent: "Name common objects shown in pictures: cup, phone, chair, table, door, window",
    expectedResponse: "Correct object identification and naming",
    phonemes: ["k", "f", "ch", "t", "d", "w"],
    hints: ["Look at the picture", "What do you use it for?", "Sound out the first letter"],
    order: 3,
    isActive: true,
  },
  {
    name: "Sentence Building",
    category: "aphasia",
    difficulty: "intermediate",
    promptType: "sentence",
    promptContent: "I want to go to the store. The weather is nice today. Can you help me with this?",
    expectedResponse: "Complete sentences with correct grammar",
    phonemes: ["w", "g", "th", "s", "n"],
    hints: ["Start with subject", "Add the action", "Complete the thought"],
    order: 4,
    isActive: true,
  },
  {
    name: "Oral Motor Exercises",
    category: "apraxia",
    difficulty: "beginner",
    promptType: "repetition",
    promptContent: "Lip puckering, tongue lateralization, cheek puffs, smile-pucker alternation",
    expectedResponse: "Controlled oral movements",
    phonemes: [],
    hints: ["Watch in mirror", "Move slowly", "Feel the movement"],
    order: 5,
    isActive: true,
  },
  {
    name: "Syllable Repetition",
    category: "apraxia",
    difficulty: "beginner",
    promptType: "repetition",
    promptContent: "pa-pa-pa, ta-ta-ta, ka-ka-ka, la-la-la, ma-ma-ma",
    expectedResponse: "Consistent syllable production",
    phonemes: ["p", "t", "k", "l", "m"],
    hints: ["Same sound each time", "Keep rhythm steady", "Start slow then faster"],
    order: 6,
    isActive: true,
  },
  {
    name: "Multi-Syllable Words",
    category: "apraxia",
    difficulty: "intermediate",
    promptType: "word",
    promptContent: "butterfly, telephone, refrigerator, automobile, hippopotamus",
    expectedResponse: "Accurate multi-syllable word production",
    phonemes: ["b", "t", "f", "r", "h"],
    hints: ["Break into syllables", "Say each part clearly", "Connect smoothly"],
    order: 7,
    isActive: true,
  },
  {
    name: "Breath Support Training",
    category: "voice",
    difficulty: "beginner",
    promptType: "reading",
    promptContent: "Sustain 'ahhh' for as long as comfortable. Count from 1-20 in one breath. Read short sentences in one breath.",
    expectedResponse: "Sustained phonation with good breath support",
    phonemes: [],
    hints: ["Breathe from diaphragm", "Relax shoulders", "Steady volume"],
    order: 8,
    isActive: true,
  },
  {
    name: "Conversation Practice",
    category: "fluency",
    difficulty: "advanced",
    promptType: "sentence",
    promptContent: "Tell me about your morning routine. Describe your favorite meal. Talk about a happy memory.",
    expectedResponse: "Functional conversational speech",
    phonemes: [],
    hints: ["Take your time", "Use short sentences", "It's okay to pause"],
    order: 9,
    isActive: true,
  },
  {
    name: "Reading Aloud",
    category: "aphasia",
    difficulty: "intermediate",
    promptType: "reading",
    promptContent: "Read simple paragraphs aloud. Focus on clear pronunciation and natural pacing.",
    expectedResponse: "Accurate oral reading with comprehension",
    phonemes: [],
    hints: ["Point to each word", "Read slowly", "Understand meaning"],
    order: 10,
    isActive: true,
  },
];

// Cognitive Exercises
const cognitiveExerciseData = [
  {
    name: "Memory Card Match",
    category: "memory",
    subcategory: "visual_memory",
    difficulty: "beginner",
    gameType: "matching",
    instructions: "Flip cards to find matching pairs. Start with 4 pairs, progress to 8 pairs as you improve. Try to remember card positions.",
    gameConfig: { gridSize: 4, timeLimit: 120, pairs: 8 },
    estimatedMinutes: 5,
    isActive: true,
  },
  {
    name: "Number Sequence",
    category: "memory",
    subcategory: "working_memory",
    difficulty: "beginner",
    gameType: "sequence",
    instructions: "Remember and repeat increasingly longer number sequences. Start with 3 digits, add more as you succeed.",
    gameConfig: { startLength: 3, maxLength: 9, timeout: 10 },
    estimatedMinutes: 5,
    isActive: true,
  },
  {
    name: "Word Recall Challenge",
    category: "memory",
    subcategory: "verbal_memory",
    difficulty: "intermediate",
    gameType: "word_finding",
    instructions: "Study a list of words for 30 seconds. Then recall as many words as possible. Categories include: household items, foods, animals.",
    gameConfig: { wordCount: 10, studyTime: 30, categories: ["household", "food", "animals"] },
    estimatedMinutes: 8,
    isActive: true,
  },
  {
    name: "Attention Focus Trainer",
    category: "attention",
    subcategory: "sustained_attention",
    difficulty: "beginner",
    gameType: "reaction_time",
    instructions: "Click when you see a specific target appear among distractors. Maintain focus for the full session without missing targets.",
    gameConfig: { duration: 120, targetRate: 0.3, distractors: 4 },
    estimatedMinutes: 5,
    isActive: true,
  },
  {
    name: "Divided Attention Task",
    category: "attention",
    subcategory: "divided_attention",
    difficulty: "intermediate",
    gameType: "multi_tracking",
    instructions: "Track multiple moving objects simultaneously. Click when a target object changes color or direction.",
    gameConfig: { objects: 4, speed: "medium", duration: 90 },
    estimatedMinutes: 5,
    isActive: true,
  },
  {
    name: "Category Sorting",
    category: "problem_solving",
    subcategory: "categorization",
    difficulty: "beginner",
    gameType: "sorting",
    instructions: "Sort items into correct categories as quickly as possible. Categories change after each round to keep you thinking.",
    gameConfig: { items: 20, categories: 4, timeLimit: 120 },
    estimatedMinutes: 6,
    isActive: true,
  },
  {
    name: "Pattern Recognition",
    category: "problem_solving",
    subcategory: "visual_reasoning",
    difficulty: "intermediate",
    gameType: "pattern_completion",
    instructions: "Identify the pattern and select what comes next. Patterns include shapes, colors, numbers, and sequences.",
    gameConfig: { levels: 10, difficulty: "progressive", hints: 3 },
    estimatedMinutes: 10,
    isActive: true,
  },
  {
    name: "Simple Math Challenge",
    category: "processing_speed",
    subcategory: "arithmetic",
    difficulty: "beginner",
    gameType: "math",
    instructions: "Solve simple addition and subtraction problems as quickly as possible. Focus on accuracy first, then speed.",
    gameConfig: { operations: ["add", "subtract"], maxNumber: 20, timeLimit: 120 },
    estimatedMinutes: 5,
    isActive: true,
  },
  {
    name: "Word Association",
    category: "language",
    subcategory: "word_finding",
    difficulty: "intermediate",
    gameType: "word_finding",
    instructions: "Given a word, quickly name related words. For example: 'Kitchen' -> stove, sink, refrigerator, table...",
    gameConfig: { words: 8, timePerWord: 30, minAssociations: 3 },
    estimatedMinutes: 8,
    isActive: true,
  },
  {
    name: "Story Sequencing",
    category: "problem_solving",
    subcategory: "sequencing",
    difficulty: "intermediate",
    gameType: "sorting",
    instructions: "Put story events or daily activities in the correct order. This helps with planning and organization skills.",
    gameConfig: { stories: 5, stepsPerStory: 5, timeLimit: 180 },
    estimatedMinutes: 10,
    isActive: true,
  },
  {
    name: "Stroop Challenge",
    category: "attention",
    subcategory: "inhibition",
    difficulty: "advanced",
    gameType: "reaction_time",
    instructions: "Name the COLOR of the word, not the word itself. For example, if 'BLUE' is written in red ink, say 'red'.",
    gameConfig: { trials: 30, timeLimit: 90, colors: ["red", "blue", "green", "yellow"] },
    estimatedMinutes: 5,
    isActive: true,
  },
  {
    name: "Mental Rotation",
    category: "problem_solving",
    subcategory: "spatial_reasoning",
    difficulty: "advanced",
    gameType: "matching",
    instructions: "Mentally rotate shapes to determine if two images show the same object from different angles.",
    gameConfig: { trials: 15, rotations: [90, 180, 270], timePerTrial: 20 },
    estimatedMinutes: 10,
    isActive: true,
  },
];
