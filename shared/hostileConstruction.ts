export interface HostileTrack {
  slug: string;
  title: string;
  vibe: string;
  durationLabel: string;
  bookChapter?: number;
  bookChapterTitle?: string;
  syncAction?: string;
  story?: string;
  youtube?: string;
  spotify?: string;
  apple?: string;
  amazon?: string;
}

export const HOSTILE_CONSTRUCTION_ALBUM = {
  artist: "Stroked-Out Sasquatch",
  title: "Hostile Construction",
  tagline: "The official soundtrack of the recovery rebuild.",
  youtubePlaylist: "",
  spotifyAlbum: "",
  appleAlbum: "",
} as const;

export const HOSTILE_CONSTRUCTION_TRACKS: HostileTrack[] = [
  {
    slug: "fault-line",
    title: "Fault Line (ICU)",
    vibe: "The foundational collapse — the sound of the world splitting before the rebuild begins.",
    durationLabel: "1:22",
    bookChapter: 2,
    bookChapterTitle: "ICU Hell & The Two Paths",
    syncAction: "Listen when the walls are closing in. Let the static drown out the hospital monitors in your head.",
  },
  {
    slug: "white-coats",
    title: "White Coats",
    vibe: "High-tension, sterile defiance.",
    durationLabel: "3:52",
    bookChapter: 3,
    bookChapterTitle: "The Choice That Changes Everything",
    syncAction: "Play when someone hands you a statistic or a 'never.' Sonic rebellion against probability.",
  },
  {
    slug: "i-am-the-architect",
    title: "I Am The Architect",
    vibe: "Structured, powerful ownership.",
    durationLabel: "4:05",
    bookChapter: 5,
    bookChapterTitle: "The War for Your Identity",
    syncAction: "You are no longer a patient. Strap on the tool belt and take control of the blueprint.",
  },
  {
    slug: "wheelchair-warrior",
    title: "Wheelchair Warrior",
    vibe: "Heavy, rolling momentum.",
    durationLabel: "3:59",
    bookChapter: 8,
    bookChapterTitle: "Finding My Way: From Wheelchair to Walking",
    syncAction: "If you're stuck in the chair today, treat it like a tank, not a cage. Until you build the strength to stand up.",
  },
  {
    slug: "sixty-six-days",
    title: "Sixty-Six Days",
    vibe: "Relentless, unchanging discipline.",
    durationLabel: "4:27",
    bookChapter: 9,
    bookChapterTitle: "The 66-Day Transformation",
    syncAction: "Use this mid-tempo grind as the background beat for your daily reps. No skipping days.",
  },
  {
    slug: "hostile-construction",
    title: "Hostile Construction",
    vibe: "Heavy, violent rebuilding.",
    durationLabel: "4:20",
    bookChapter: 12,
    bookChapterTitle: "First Steps / Baseball Bat Therapy",
    syncAction: "The title track. Put this on for your heaviest, most frustrating reps. Let the beat drive the weak side.",
  },
  {
    slug: "phantom-limb",
    title: "Phantom Limb",
    vibe: "Ethereal, focused, percussive.",
    durationLabel: "5:14",
    bookChapter: 14,
    bookChapterTitle: "Mirror Therapy Magic",
    syncAction: "Headphones on during your 10–20 minutes of Mirror Therapy. Let the sound trick your brain into rewiring the disconnected circuits.",
  },
  {
    slug: "handicrap",
    title: "Handi-Crap",
    vibe: "Gritty, sarcastic, aggressive energy.",
    durationLabel: "3:57",
    bookChapter: 21,
    bookChapterTitle: "Turning Setbacks into Comebacks",
    syncAction: "Play when humiliation hits or depression tries to park you. Laugh at the absurdity, get mad, use the spite as fuel.",
  },
  {
    slug: "maximum-benefit",
    title: "Maximum Benefit (Interlude)",
    vibe: "Defiant, industrial pushback.",
    durationLabel: "4:20",
    bookChapter: 22,
    bookChapterTitle: "The Plateau Wars",
    syncAction: "When insurance cuts you off or progress stalls, the system says you've reached 'maximum benefit.' Prove you haven't even scratched the surface.",
  },
  {
    slug: "wheeled-out",
    title: "Wheeled Out (Discharge)",
    vibe: "Cinematic and transitional.",
    durationLabel: "3:57",
    bookChapter: 24,
    bookChapterTitle: "Home Again",
    syncAction: "The training wheels are off. Adapt your home into your new training ground. Turn the stairs into reps.",
  },
  {
    slug: "the-promise",
    title: "The Promise (For Nicholas)",
    vibe: "Deep, emotional, unyielding power.",
    durationLabel: "5:18",
    bookChapter: 25,
    bookChapterTitle: "Family & Caregivers / Fatherhood Fire",
    syncAction: "When you forget your 'Why,' listen to this. The promise to stand up, to play catch, to build a legacy.",
  },
  {
    slug: "the-vanguard",
    title: "The Vanguard",
    vibe: "Fast-paced, triumphant, expansive.",
    durationLabel: "Full track",
    bookChapter: 28,
    bookChapterTitle: "Building the StrokeLyfe Empire",
    syncAction: "The anthem for the front lines. You aren't just recovering — you're leading the tribe.",
  },
  {
    slug: "stroked-out-but-not-done",
    title: "Stroked-Out (But Not Done)",
    vibe: "The signature anthem. The project's namesake.",
    durationLabel: "Full track",
    syncAction: "The flag in the ground for every survivor who refuses to be past tense.",
  },
  {
    slug: "blacking-out",
    title: "Blacking Out",
    vibe: "Lo-Fi Recovery — origin story in the quiet between heartbeats.",
    durationLabel: "Full track",
    syncAction: "When you need to feel the moment everything went dark — and remember that you came back different.",
  },
  {
    slug: "squatchy",
    title: "Squatchy",
    vibe: "Big-footed, big-hearted, big-noise swagger.",
    durationLabel: "Full track",
    syncAction: "For the survivor done apologizing for taking up space in the world they fought back into.",
  },
  {
    slug: "stand-up",
    title: "Stand Up!",
    vibe: "Two words the rehab gym screams a thousand times.",
    durationLabel: "Full track",
    syncAction: "For the first time you scream them back at the world.",
  },
  {
    slug: "ding-now-fight",
    title: "Ding — Now Fight",
    vibe: "The bell rang the moment the stroke hit. Round one started without you.",
    durationLabel: "Full track",
    syncAction: "Get up. Every day a new round, every round another chance to rewire.",
  },
];

export function getTrackBySlug(slug: string): HostileTrack | undefined {
  return HOSTILE_CONSTRUCTION_TRACKS.find((t) => t.slug === slug);
}
