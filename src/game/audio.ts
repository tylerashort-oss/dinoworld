type SfxName =
  | "attack"
  | "hit"
  | "enemyDown"
  | "bone"
  | "card"
  | "boss"
  | "bossDown"
  | "eruption"
  | "hurt"
  | "jump";

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

export function initAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (Ctor) ctx = new Ctor();
  }
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function tone(freq: number, dur: number, type: OscillatorType, vol = 0.16, slideTo?: number) {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function playSfx(name: SfxName) {
  if (!enabled) return;
  initAudio();
  switch (name) {
    case "attack":
      tone(420, 0.11, "square", 0.09, 180);
      break;
    case "hit":
      tone(180, 0.09, "sawtooth", 0.12, 90);
      break;
    case "enemyDown":
      tone(300, 0.28, "triangle", 0.14, 70);
      break;
    case "bone":
      tone(880, 0.09, "triangle", 0.1, 1320);
      break;
    case "card":
      tone(660, 0.16, "sine", 0.14, 1200);
      break;
    case "boss":
      tone(90, 0.7, "sawtooth", 0.16, 55);
      break;
    case "bossDown":
      tone(220, 0.9, "sawtooth", 0.18, 60);
      break;
    case "eruption":
      tone(70, 0.5, "sawtooth", 0.15, 180);
      break;
    case "hurt":
      tone(240, 0.2, "square", 0.13, 110);
      break;
    case "jump":
      tone(520, 0.13, "sine", 0.09, 900);
      break;
  }
}
