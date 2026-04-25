export type ShopCategoryId =
  | "mobility"
  | "hand"
  | "footdrop"
  | "speech"
  | "caregiver"
  | "bedside";

export interface ShopCategory {
  id: ShopCategoryId;
  name: string;
  blurb: string;
  bonfireSignal?: string;
}

export interface ShopProduct {
  id: string;
  category: ShopCategoryId;
  name: string;
  brand?: string;
  asin: string;
  priceClass: "$" | "$$" | "$$$";
  whyNick: string;
  notMedicalNote?: string;
}

export const SHOP_CATEGORIES: ShopCategory[] = [
  {
    id: "mobility",
    name: "Mobility & Balance",
    blurb: "Canes, walkers, gait belts, and transfer aids the survivors I trust actually use.",
    bonfireSignal: "Standing or walking felt unsafe today",
  },
  {
    id: "hand",
    name: "Hand & Grip",
    blurb: "Putty, grippers, finger stretchers — the boring tools that rebuild fine motor control.",
    bonfireSignal: "Affected hand felt weak this week",
  },
  {
    id: "footdrop",
    name: "Foot Drop & AFO",
    blurb: "Ankle-foot orthoses and foot-up bands to clear the toe so you stop tripping.",
    bonfireSignal: "Toe is catching on the floor",
  },
  {
    id: "speech",
    name: "Speech & Cognition",
    blurb: "Aphasia workbooks, memory games, and labeling tools for daily brain reps.",
    bonfireSignal: "Brain feels foggy or word-finding is hard",
  },
  {
    id: "caregiver",
    name: "Caregiver Essentials",
    blurb: "Transfer sheets, commodes, underpads — the unglamorous gear caregivers ask for first.",
    bonfireSignal: "You need a caregiver assist right now",
  },
  {
    id: "bedside",
    name: "Recovery Bedside",
    blurb: "Wedge pillows, voice assistants, pill boxes, reading lights — the recovery nightstand kit.",
    bonfireSignal: "Recovery sleep is broken",
  },
];

export const SHOP_PRODUCTS: ShopProduct[] = [
  // ─── Mobility & Balance ───────────────────────────────────────────────
  {
    id: "mob-quad-cane",
    category: "mobility",
    name: "Hugo Adjustable Folding Quad Cane",
    brand: "Hugo Mobility",
    asin: "B0058XAMQO",
    priceClass: "$",
    whyNick: "Four-point base. The first cane I owned that didn't tip when I leaned hard on it during a balance check.",
  },
  {
    id: "mob-vive-walker",
    category: "mobility",
    name: "Vive Folding Walker with Wheels",
    brand: "Vive Health",
    asin: "B07Q3MZHQ7",
    priceClass: "$$",
    whyNick: "Two-wheel front + glides in back. Easier to push if your dominant arm is the affected side.",
  },
  {
    id: "mob-gait-belt",
    category: "mobility",
    name: "Vive Gait Belt with Handles",
    brand: "Vive Health",
    asin: "B01N7WKSSP",
    priceClass: "$",
    whyNick: "Loops give a caregiver a real handle. Nobody should grab your pants to lift you.",
  },
  {
    id: "mob-transfer-disc",
    category: "mobility",
    name: "Stander EZ-Pivot Transfer Disc",
    brand: "Stander",
    asin: "B0083T76EM",
    priceClass: "$$",
    whyNick: "Wheelchair-to-toilet transfers without twisting the knee. My PT swore by these.",
  },
  {
    id: "mob-bed-cane",
    category: "mobility",
    name: "Stander BedCane",
    brand: "Stander",
    asin: "B003UKTPZS",
    priceClass: "$$",
    whyNick: "Slips between the mattress and box spring. Gives you a strong handle to sit up with one arm.",
  },
  {
    id: "mob-rollator",
    category: "mobility",
    name: "Drive Medical Nitro Aluminum Rollator",
    brand: "Drive Medical",
    asin: "B00HF4LU0I",
    priceClass: "$$$",
    whyNick: "Built-in seat for when fatigue hits mid-walk. The hand brakes are easy to grip with weak fingers.",
  },

  // ─── Hand & Grip ──────────────────────────────────────────────────────
  {
    id: "hand-putty",
    category: "hand",
    name: "Vive Hand Therapy Putty (4-Pack)",
    brand: "Vive Health",
    asin: "B071FFFNM5",
    priceClass: "$",
    whyNick: "Four resistances. Start with extra-soft and don't let your ego push you to firm before your tendons are ready.",
  },
  {
    id: "hand-theraband",
    category: "hand",
    name: "TheraBand Hand Exerciser",
    brand: "TheraBand",
    asin: "B001P5TIIK",
    priceClass: "$",
    whyNick: "The yellow one is plenty. I used red way too early and pissed off my flexor tendons for a month.",
  },
  {
    id: "hand-finger-stretcher",
    category: "hand",
    name: "Vive Finger Stretcher Bands",
    brand: "Vive Health",
    asin: "B071R7HFJK",
    priceClass: "$",
    whyNick: "For *opening* the hand, not closing. Most stroke survivors over-train the grip and forget the extensors.",
  },
  {
    id: "hand-squegg",
    category: "hand",
    name: "Squegg Smart Squeeze Trainer",
    brand: "Squegg",
    asin: "B08QD4JQ8C",
    priceClass: "$$",
    whyNick: "Bluetooth tracking turns squeezes into a video game. Helped me hit my daily count without getting bored.",
  },
  {
    id: "hand-grip-strengthener",
    category: "hand",
    name: "IFAST Adjustable Hand Grip Strengthener",
    brand: "IFAST",
    asin: "B07VJTW3MV",
    priceClass: "$",
    whyNick: "Adjustable from 22-88 lbs. One device replaces three.",
  },
  {
    id: "hand-saebo-glove",
    category: "hand",
    name: "Saebo Stretch Hand Splint",
    brand: "Saebo",
    asin: "B07GVVLDDN",
    priceClass: "$$$",
    whyNick: "Worth the money if you have spasticity that curls the hand at night. My OT recommended this brand specifically.",
  },

  // ─── Foot Drop & AFO ──────────────────────────────────────────────────
  {
    id: "afo-vive",
    category: "footdrop",
    name: "Vive Foot Drop Brace AFO",
    brand: "Vive Health",
    asin: "B074CGZRV3",
    priceClass: "$$",
    whyNick: "Entry-level AFO. Try this before you spend $300+ on a custom brace, especially if you're early in recovery.",
  },
  {
    id: "afo-ortonyx",
    category: "footdrop",
    name: "ORTONYX Adjustable Foot Drop Brace",
    brand: "ORTONYX",
    asin: "B07F7JVPR1",
    priceClass: "$",
    whyNick: "Wraps over your shoe. Good for rehab gym sessions when you're doing seated work.",
  },
  {
    id: "afo-turbomed",
    category: "footdrop",
    name: "TurboMed XTERN AFO",
    brand: "TurboMed",
    asin: "B07SDJVZL2",
    priceClass: "$$$",
    whyNick: "Mounts outside the shoe — your sock and skin stay free. Only buy after a clinician has fitted one to your gait.",
    notMedicalNote: "AFOs should be selected with a physical therapist or orthotist.",
  },
  {
    id: "afo-pushbrace",
    category: "footdrop",
    name: "Push AFO Brace",
    brand: "Push",
    asin: "B07R57QLDM",
    priceClass: "$$$",
    whyNick: "Lower-profile AFO that fits under most pants. Several survivors in my circle use this daily.",
  },
  {
    id: "afo-foot-up",
    category: "footdrop",
    name: "Össur Foot Up Drop Foot Orthosis",
    brand: "Össur",
    asin: "B00OV2L1ZQ",
    priceClass: "$$",
    whyNick: "Soft strap version — comfortable for indoor use when you don't need a hard plastic AFO.",
  },

  // ─── Speech & Cognition ───────────────────────────────────────────────
  {
    id: "speech-aphasia-workbook",
    category: "speech",
    name: "The Aphasia Workbook (Lingraphica)",
    asin: "1416400737",
    priceClass: "$$",
    whyNick: "Daily writing and naming reps. Pair with your SLP — don't try to grade yourself.",
  },
  {
    id: "speech-stroke-recovery-book",
    category: "speech",
    name: "Healing the Broken Brain",
    brand: "Mike Dow PhD",
    asin: "1401953905",
    priceClass: "$$",
    whyNick: "The best lay overview of why neuroplasticity actually works. I gift this to every new survivor I meet.",
  },
  {
    id: "speech-memory-game",
    category: "speech",
    name: "Wisdom Tree Memory Match Cards",
    asin: "B07ZPGT2QC",
    priceClass: "$",
    whyNick: "Old-school cardboard memory match. Five minutes a day, no screen, no battery.",
  },
  {
    id: "speech-magnetic-letters",
    category: "speech",
    name: "Magnetic Letters & Numbers (Foam)",
    asin: "B0765XQVPN",
    priceClass: "$",
    whyNick: "Spelling reps on the fridge. Low embarrassment, high frequency.",
  },
  {
    id: "speech-crossword",
    category: "speech",
    name: "Large Print Crossword Puzzles",
    asin: "1645172732",
    priceClass: "$",
    whyNick: "Vision and word retrieval at the same time. Big print so you don't strain after a brain injury.",
  },
  {
    id: "speech-brain-quest",
    category: "speech",
    name: "Brain Quest Workbook",
    asin: "0761149082",
    priceClass: "$",
    whyNick: "Designed for kids — not condescending, just simple repeatable cognitive reps.",
  },

  // ─── Caregiver Essentials ─────────────────────────────────────────────
  {
    id: "care-bedside-commode",
    category: "caregiver",
    name: "Drive Medical Bedside Commode",
    brand: "Drive Medical",
    asin: "B0007WL1LM",
    priceClass: "$$",
    whyNick: "Non-negotiable for the first 6 weeks home. Worth more than any rehab gadget.",
  },
  {
    id: "care-slide-sheet",
    category: "caregiver",
    name: "Vive Patient Slide Sheet",
    brand: "Vive Health",
    asin: "B01N0EA4HG",
    priceClass: "$$",
    whyNick: "Lets a caregiver reposition you in bed without ripping their back. Saves the family.",
  },
  {
    id: "care-underpads",
    category: "caregiver",
    name: "McKesson Disposable Underpads (Case)",
    brand: "McKesson",
    asin: "B07KRLN6XL",
    priceClass: "$$",
    whyNick: "Buy more than you think you need. Dignity is in not running out at 2am.",
  },
  {
    id: "care-toilet-frame",
    category: "caregiver",
    name: "Carex Toilet Safety Frame",
    brand: "Carex",
    asin: "B003U3R9QO",
    priceClass: "$",
    whyNick: "Bolts onto the existing toilet. Two arm rails so you can stand from either side.",
  },
  {
    id: "care-shower-chair",
    category: "caregiver",
    name: "Drive Medical Bath Bench with Back",
    brand: "Drive Medical",
    asin: "B003UE7ZMA",
    priceClass: "$$",
    whyNick: "Backrest matters. A backless shower chair is harder to lower into when one side is weak.",
  },
  {
    id: "care-grab-bar",
    category: "caregiver",
    name: "Moen 16-Inch Bath Grab Bar",
    brand: "Moen",
    asin: "B000W5Q6CG",
    priceClass: "$",
    whyNick: "Get one professionally installed near the toilet and one in the shower. This is the bar I have.",
    notMedicalNote: "Grab bars must be screwed into wall studs, not drywall anchors.",
  },

  // ─── Recovery Bedside ─────────────────────────────────────────────────
  {
    id: "bed-wedge-pillow",
    category: "bedside",
    name: "Vive Bed Wedge Pillow",
    brand: "Vive Health",
    asin: "B016MCC79C",
    priceClass: "$$",
    whyNick: "Sleeping at a slight incline cut my morning fatigue. Also helps with reflux post-stroke meds.",
  },
  {
    id: "bed-echo-dot",
    category: "bedside",
    name: "Echo Dot (5th Gen)",
    brand: "Amazon",
    asin: "B09B8V1LZ3",
    priceClass: "$$",
    whyNick: "Hands-free lights, timers, calls. Turn it into your dominant hand on weak-arm days.",
  },
  {
    id: "bed-pill-organizer",
    category: "bedside",
    name: "7-Day Pill Organizer (AM/PM)",
    asin: "B00JB75ZMC",
    priceClass: "$",
    whyNick: "Two slots per day. Big enough for blood thinners + statins + supplements without cramming.",
  },
  {
    id: "bed-overbed-table",
    category: "bedside",
    name: "Drive Medical Adjustable Overbed Table",
    brand: "Drive Medical",
    asin: "B003U3RG2A",
    priceClass: "$$",
    whyNick: "C-shape rolls over the bed. Mine doubles as a tray for therapy putty work.",
  },
  {
    id: "bed-reading-light",
    category: "bedside",
    name: "Glocusent LED Neck Reading Light",
    brand: "Glocusent",
    asin: "B07VK1VH5G",
    priceClass: "$",
    whyNick: "Hands-free reading light. Easier than holding a book light when one hand isn't reliable.",
  },
  {
    id: "bed-water-bottle",
    category: "bedside",
    name: "Hydro Flask 32oz Wide Mouth with Straw Lid",
    brand: "Hydro Flask",
    asin: "B07R8M3G36",
    priceClass: "$$",
    whyNick: "Straw lid means you don't tip a heavy bottle. Wide mouth fits ice cubes for swallow practice.",
  },
];
