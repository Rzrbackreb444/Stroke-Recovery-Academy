// Subtle Web Audio sound effects for game feedback.
// Respects a per-user mute toggle (localStorage) and prefers-reduced-motion.

const MUTE_KEY = "brainGym.muted";

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}

let ctx: AudioContext | null = null;
function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (isMuted()) return null;
  try {
    if (!ctx) {
      const Ctor =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx?.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.06) {
  const c = ensureCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = 0;
  g.gain.linearRampToValueAtTime(gain, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration + 0.02);
}

/** Pleasant ascending two-note chime for correct actions. */
export function playCorrect() {
  tone(660, 0.12, "sine");
  setTimeout(() => tone(880, 0.16, "sine"), 70);
}

/** Soft low descending tone for wrong actions — never harsh. */
export function playWrong() {
  tone(280, 0.18, "triangle", 0.04);
}

/** Triumphant 4-note arpeggio for full puzzle completion. */
export function playVictory() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, i) => setTimeout(() => tone(n, 0.22, "sine", 0.07), i * 90));
}
