export interface PersonaArchetype {
  key: string;
  name: string;
  tagline: string;
  description: string;
  traits: string[];
  creedSeeds: string[];
  voicePreset: string;
  accentColor: string;
  iconKey: string;
}

export const PERSONA_ARCHETYPES: PersonaArchetype[] = [
  {
    key: "sasquatch",
    name: "Sasquatch",
    tagline: "Quiet, relentless, built for the long haul.",
    description:
      "The one who keeps showing up in the woods nobody else will walk through. Doesn't talk much. Doesn't quit. Builds the path one log at a time.",
    traits: ["Relentless", "Quiet strength", "Long-game", "Builder"],
    creedSeeds: [
      "Sasquatch doesn't ask if today is the day. Sasquatch chops wood.",
      "The forest doesn't notice Sasquatch leave. The forest notices when he returns stronger.",
      "Reps over noise. Always.",
    ],
    voicePreset: "raspy-southern",
    accentColor: "#C9941A",
    iconKey: "Mountain",
  },
  {
    key: "phoenix",
    name: "Phoenix",
    tagline: "Burns the old self. Builds the new one.",
    description:
      "The one who refuses to mourn what was. Every collapse is fuel. Every ash heap is the beginning of a better rebuild.",
    traits: ["Reborn", "Transformative", "Fire-tested", "Unafraid of loss"],
    creedSeeds: [
      "Phoenix doesn't grieve the old version. Phoenix builds the next one.",
      "Ashes are not an ending. Ashes are a starting line.",
      "Burn it. Build it. Burn it again if you have to.",
    ],
    voicePreset: "warm-female",
    accentColor: "#E25822",
    iconKey: "Flame",
  },
  {
    key: "wolf",
    name: "Wolf",
    tagline: "Pack-loyal, pain-trained, dangerous on instinct.",
    description:
      "The one who survives by reading the terrain and moving with the pack. Fierce, focused, protective. Trains in the cold so the warm doesn't soften.",
    traits: ["Loyal", "Instinctive", "Disciplined", "Pack-minded"],
    creedSeeds: [
      "Wolf doesn't argue with the snow. Wolf moves through it.",
      "The pack only runs as fast as the slowest. Wolf gets faster.",
      "Hunt the rep. Don't wait for it.",
    ],
    voicePreset: "low-male",
    accentColor: "#6B7280",
    iconKey: "Shield",
  },
  {
    key: "bear",
    name: "Bear",
    tagline: "Slow when you watch. Devastating when you don't.",
    description:
      "The one who looks gentle until you push too far. Massive patience. Massive force. Hibernates the doubt; wakes up the work.",
    traits: ["Patient", "Powerful", "Calm under pressure", "Protective"],
    creedSeeds: [
      "Bear doesn't rush. Bear arrives.",
      "The river doesn't fight Bear. The river just goes around.",
      "Quiet today. Standing tomorrow. Climbing next week.",
    ],
    voicePreset: "deep-male",
    accentColor: "#8B5E34",
    iconKey: "Anchor",
  },
  {
    key: "anvil",
    name: "Anvil",
    tagline: "Doesn't move. Shapes everything that hits it.",
    description:
      "The one who turns every blow into the shape of the next version. Pain is the hammer. The anvil is what makes the blade.",
    traits: ["Immovable", "Forge-tested", "Shapes outcomes", "Steady"],
    creedSeeds: [
      "Anvil doesn't flinch. Anvil shapes.",
      "Every hit makes the steel cleaner.",
      "The hammer thinks it's winning. The anvil knows better.",
    ],
    voicePreset: "iron-male",
    accentColor: "#4B5563",
    iconKey: "Hammer",
  },
  {
    key: "lighthouse",
    name: "Lighthouse",
    tagline: "Stands so the others can find shore.",
    description:
      "The one whose recovery is also a signal. Doesn't recover quietly — recovers visibly so the next survivor knows where the rocks are.",
    traits: ["Visible", "Guiding", "Steadfast", "Mission-driven"],
    creedSeeds: [
      "Lighthouse doesn't move. Lighthouse shines.",
      "The storm doesn't put the light out. The light is the answer to the storm.",
      "Recover loud. Somebody is watching from the water.",
    ],
    voicePreset: "warm-male",
    accentColor: "#F4C430",
    iconKey: "Lightbulb",
  },
];

export function getArchetype(key: string): PersonaArchetype | undefined {
  return PERSONA_ARCHETYPES.find((a) => a.key === key);
}
