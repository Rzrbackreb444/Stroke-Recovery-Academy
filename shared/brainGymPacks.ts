export interface PackEntry {
  word: string;
  clue: string;
  definition: string;
}

export interface BrainGymPack {
  id: string;
  name: string;
  tagline: string;
  description: string;
  accent: string;
  entries: PackEntry[];
}

export const BRAIN_GYM_PACKS: BrainGymPack[] = [
  {
    id: "sasquatch",
    name: "Sasquatch Vocabulary",
    tagline: "The doctrine, the systems, the language of the comeback.",
    description:
      "The core terms from Nick's three-system stack — S.A.S.C.H., S.O.S., C.O.M.P.A.S.S. — and the mindset language behind the 66-day movement.",
    accent: "#C9941A",
    entries: [
      { word: "SEIZE", clue: "Step 1 of S.A.S.C.H. — accept exactly where you are.", definition: "To take hold of your current reality without denial." },
      { word: "ABSORB", clue: "Step 2 of S.A.S.C.H. — be a sponge.", definition: "To soak up knowledge from therapists, science, and your own body's feedback." },
      { word: "SWING", clue: "Step 3 of S.A.S.C.H. — bold action.", definition: "To experiment, test, and take action on what might move the needle." },
      { word: "COMBINE", clue: "Step 4 of S.A.S.C.H. — your custom recipe.", definition: "To mix what works into your personal recovery system." },
      { word: "HAMMER", clue: "Step 5 of S.A.S.C.H. — daily reps.", definition: "To pound away with consistency until it becomes who you are." },
      { word: "SURVIVE", clue: "S of S.O.S. — you're still here.", definition: "To make it through today; the first win." },
      { word: "ORGANIZE", clue: "O of S.O.S. — pick one thing.", definition: "To stack one small action and build structure from it." },
      { word: "STRIVE", clue: "Final S of S.O.S. — never zero.", definition: "To push for one rep, even on the worst day." },
      { word: "COMPASS", clue: "The 7-pillar long-game navigation system.", definition: "Control, Own, Mutate, Patience, Anger, Small Wins, Stack." },
      { word: "FLICKER", clue: "The first sign of returning function.", definition: "A tiny twitch or movement that proves the wire is still there." },
      { word: "PLATEAU", clue: "What every survivor must learn to bust.", definition: "A stretch of stalled progress that is broken by changing the stimulus." },
      { word: "STREAK", clue: "What 1 rep a day protects.", definition: "An unbroken chain of daily action — the engine of long-term recovery." },
      { word: "SQUATCH", clue: "Nick's alter ego and the mascot of the movement.", definition: "The relentless, mythic version of yourself you're becoming." },
      { word: "WARRIOR", clue: "What survivors are called inside the platform.", definition: "Someone who chooses to fight every day, regardless of the odds." },
    ],
  },
  {
    id: "anatomy",
    name: "Recovery Anatomy",
    tagline: "Know the machine you're rebuilding.",
    description:
      "Brain regions, body systems, and clinical terms every survivor and caregiver should know.",
    accent: "#7BA7C9",
    entries: [
      { word: "CEREBELLUM", clue: "Brain region governing balance and coordination.", definition: "The 'little brain' at the back of the skull responsible for fine motor control." },
      { word: "CORTEX", clue: "The brain's outer layer.", definition: "The wrinkled outer surface of the brain where higher thinking happens." },
      { word: "HEMIPLEGIA", clue: "Paralysis on one side of the body.", definition: "Loss of motor function on one side, common after a unilateral stroke." },
      { word: "APHASIA", clue: "Impairment of language ability.", definition: "Difficulty producing or understanding speech, often after a left-brain stroke." },
      { word: "DYSPHAGIA", clue: "Difficulty swallowing.", definition: "A common post-stroke complication that requires careful diet management." },
      { word: "NEURON", clue: "A single brain cell.", definition: "The electrical unit of the nervous system; billions of them wire your function." },
      { word: "SYNAPSE", clue: "The gap between two neurons.", definition: "The junction where one neuron passes a signal to another." },
      { word: "MYELIN", clue: "The insulation around nerve fibers.", definition: "A fatty sheath that lets electrical signals travel fast and clean." },
      { word: "ISCHEMIC", clue: "Stroke type caused by a blockage.", definition: "A stroke caused by reduced blood flow, usually from a clot." },
      { word: "HEMORRHAGIC", clue: "Stroke type caused by a bleed.", definition: "A stroke caused by a ruptured blood vessel — Nick's type." },
      { word: "THALAMUS", clue: "The brain's central relay station.", definition: "A deep brain structure that routes sensory and motor signals." },
      { word: "BRAINSTEM", clue: "Connects the brain to the spinal cord.", definition: "Controls breathing, heart rate, and basic survival functions." },
      { word: "PROPRIOCEPTION", clue: "Your body's sense of where it is in space.", definition: "The unconscious awareness of limb position; often disrupted post-stroke." },
      { word: "SPASTICITY", clue: "Involuntary muscle tightness.", definition: "Stiffness from disrupted brain-to-muscle signaling after stroke." },
    ],
  },
  {
    id: "arsenal",
    name: "Therapy Arsenal",
    tagline: "The tools and tactics that rebuild function.",
    description:
      "Evidence-based and battle-tested techniques from the Sasquatch Method playbook.",
    accent: "#A8C97B",
    entries: [
      { word: "MIRROR", clue: "Therapy that tricks the brain using reflection.", definition: "Mirror therapy uses the unaffected limb's reflection to drive cortical remapping." },
      { word: "REPETITION", clue: "The mother of neuroplasticity.", definition: "High-rep practice that carves new neural pathways." },
      { word: "WEIGHTBEARING", clue: "Loading the affected side to wake it up.", definition: "Pushing through the affected limb to restore strength and proprioception." },
      { word: "CIMT", clue: "Constraint-induced movement therapy acronym.", definition: "Restraining the strong limb to force use of the weak one." },
      { word: "STRETCHING", clue: "Daily defense against spasticity.", definition: "Regular elongation of muscles to maintain range of motion." },
      { word: "BALANCE", clue: "What you rebuild before you walk.", definition: "The integrated control of body position against gravity." },
      { word: "GAIT", clue: "Pattern of walking.", definition: "The mechanics of how the body moves on foot." },
      { word: "RANGE", clue: "Of motion — measured in degrees.", definition: "How far a joint can move actively or passively." },
      { word: "FLEXION", clue: "Bending a joint.", definition: "Movement that decreases the angle of a joint." },
      { word: "EXTENSION", clue: "Straightening a joint.", definition: "Movement that increases the angle of a joint." },
      { word: "GRIP", clue: "First test of hand recovery.", definition: "The ability to close the hand around an object." },
      { word: "POSTURE", clue: "Foundation of every movement.", definition: "The alignment of the body that allows efficient motion." },
      { word: "STAMINA", clue: "What you build one rep at a time.", definition: "Endurance for sustained physical or cognitive effort." },
      { word: "FOOTDROP", clue: "Inability to lift the front of the foot.", definition: "Common post-stroke gait issue addressed with bracing and targeted reps." },
    ],
  },
  {
    id: "mindset",
    name: "Mindset Fuel",
    tagline: "The inner game that decides the outer result.",
    description:
      "Words and ideas that shape how you show up — even when the body won't.",
    accent: "#C97BA7",
    entries: [
      { word: "GRIT", clue: "Sustained passion for a long-term goal.", definition: "The blend of perseverance and passion that outlasts motivation." },
      { word: "HOPE", clue: "Not a feeling — a discipline.", definition: "The trained belief that effort will compound into a better future." },
      { word: "FAITH", clue: "Action before evidence.", definition: "Moving forward when proof hasn't arrived yet." },
      { word: "DISCIPLINE", clue: "What carries you when motivation quits.", definition: "Doing the work whether or not you feel like it." },
      { word: "PATIENCE", clue: "P of C.O.M.P.A.S.S.", definition: "The capacity to keep showing up across long timelines." },
      { word: "COURAGE", clue: "Action in the presence of fear.", definition: "Doing what scares you because the goal matters more than the fear." },
      { word: "RESILIENCE", clue: "Bouncing forward, not just back.", definition: "The ability to convert setbacks into a stronger version of yourself." },
      { word: "GRATITUDE", clue: "Daily fuel for the long road.", definition: "The practice of noticing what's working, however small." },
      { word: "PURPOSE", clue: "The why that survives the worst day.", definition: "The deep reason that makes the work non-negotiable." },
      { word: "FOCUS", clue: "What multiplies effort into result.", definition: "The narrowing of attention onto the next right action." },
      { word: "PROGRESS", clue: "Better than perfection.", definition: "Any forward motion — measured against yesterday, not anyone else." },
      { word: "MOMENTUM", clue: "The compound interest of action.", definition: "The accelerating pull of consistent reps." },
      { word: "BELIEF", clue: "The first rep of every comeback.", definition: "The internal certainty that change is possible for you." },
      { word: "VICTORY", clue: "Sometimes it's just one rep.", definition: "Any moment where you chose action over surrender." },
    ],
  },
];

export function getPack(id: string): BrainGymPack | undefined {
  return BRAIN_GYM_PACKS.find((p) => p.id === id);
}

export function getDailyPack(date: Date = new Date()): BrainGymPack {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return BRAIN_GYM_PACKS[dayOfYear % BRAIN_GYM_PACKS.length];
}
