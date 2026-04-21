// Curated Sasquatch voice — delivered after each daily check-in.
// No database needed; picked at random.
export const SASQUATCH_QUOTES: { text: string; tone: 'fire' | 'calm' | 'grit' | 'love' }[] = [
  { text: "The forest doesn't apologize for growing. Neither should you.", tone: 'calm' },
  { text: "You showed up. That's the whole game. Now show up tomorrow.", tone: 'grit' },
  { text: "Scars are proof of survival. Wear them like armor, not apology.", tone: 'fire' },
  { text: "Slow is smooth. Smooth is strong. Strong is Sasquatch.", tone: 'calm' },
  { text: "Every rep you didn't want to do is the one that rebuilt you.", tone: 'grit' },
  { text: "The stroke didn't get you. You're still here. Act like it.", tone: 'fire' },
  { text: "Your brain is rewiring while you sleep. Trust the build.", tone: 'calm' },
  { text: "One good breath. One honest effort. That's the whole doctrine.", tone: 'love' },
  { text: "Comebacks are quiet. Keep chopping wood.", tone: 'grit' },
  { text: "Weak day? Log it. Move on. You don't owe anyone a performance.", tone: 'love' },
  { text: "The mountain doesn't care about your excuses. Neither does recovery.", tone: 'fire' },
  { text: "Progress hides in the days you almost quit. You didn't. Good.", tone: 'grit' },
  { text: "Someone who loves you needs you to keep going. Don't make them ask twice.", tone: 'love' },
  { text: "You survived the worst day of your life. Today is easier than that.", tone: 'calm' },
  { text: "The beast isn't bought. It's built — one honest minute at a time.", tone: 'fire' },
  { text: "Heal loud enough that someone else believes they can too.", tone: 'love' },
  { text: "Pain is information. Stop arguing with it. Start answering it.", tone: 'grit' },
  { text: "The version of you who gave up never existed. You only have one lineage.", tone: 'fire' },
  { text: "Recovery is a conversation with yourself. Speak kindly, but speak.", tone: 'calm' },
  { text: "You don't have to feel ready. You have to be willing. Different thing.", tone: 'grit' },
  { text: "Forge the creed. Live the creed. The creed forges you back.", tone: 'fire' },
  { text: "A day logged is a day claimed. Nobody takes your streak from you.", tone: 'grit' },
  { text: "The Sasquatch walks slow because he knows the forest is his.", tone: 'calm' },
  { text: "Tears count as reps. So does laughter. So does showing up.", tone: 'love' },
  { text: "You are not behind. You are exactly one day ahead of yesterday.", tone: 'calm' },
  { text: "Rest hard. Train hard. Love harder. That's the whole playbook.", tone: 'love' },
  { text: "The version of you six months from now is watching. Don't embarrass them.", tone: 'grit' },
  { text: "Your story isn't a warning. It's a blueprint. Build loud.", tone: 'fire' },
  { text: "Small step. Small step. Small step. That's how giants move.", tone: 'calm' },
  { text: "You are not your worst minute. You are every minute you kept choosing.", tone: 'love' },
  { text: "When the body quits, the persona carries. That's why we forged it.", tone: 'fire' },
  { text: "Survivor's honor: leave someone stronger than you found them today.", tone: 'love' },
];

export function pickSasquatchQuote(seed?: number) {
  const i = seed != null
    ? Math.abs(Math.floor(seed)) % SASQUATCH_QUOTES.length
    : Math.floor(Math.random() * SASQUATCH_QUOTES.length);
  return SASQUATCH_QUOTES[i];
}
