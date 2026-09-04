/**
 * Explicit animation system.
 *
 * Sprite sheets are never "guessed at" — every clip is declared with an
 * AnimationDef (source, frameCount, frameWidth/Height, frameDuration, loop)
 * and validated against the real image dimensions once it decodes. A sheet
 * that cannot hold the declared frames is marked invalid, reported, and
 * skipped at draw time so the game never renders sliced garbage.
 */

import { RUN_SHEETS, SPRITES } from "./content";

/** Ground creatures: idle → run → attack → hit → death. */
export type GroundAnimState = "idle" | "run" | "attack" | "hit" | "death";
/** Flying creatures: fly → attack → hit → death (no ground run cycle). */
export type FlyingAnimState = "fly" | "attack" | "hit" | "death";
export type AnimState = GroundAnimState | FlyingAnimState;

export interface AnimationDef {
  /** Image URL of the sheet (or a single-frame still). */
  source: string;
  frameCount: number;
  /** Optional explicit cell size. Derived from the image when omitted. */
  frameWidth?: number;
  frameHeight?: number;
  /** Seconds per frame. */
  frameDuration: number;
  loop: boolean;
}

export interface AnimationClip extends AnimationDef {
  image: HTMLImageElement;
  /** Resolved cell size, filled in once the image decodes. */
  frameWidth: number;
  frameHeight: number;
  /** True only after the asset passed validation. */
  valid: boolean;
  validated: boolean;
  error: string | null;
  /** Cell size as declared by the def (undefined = derive from the image). */
  declaredWidth: number | undefined;
  declaredHeight: number | undefined;
}

export type AnimationSet = Partial<Record<AnimState, AnimationClip>>;

const IMAGES: Record<string, HTMLImageElement> = {};
const CLIPS: Record<string, AnimationClip> = {};
const REPORTED = new Set<string>();

function report(clip: AnimationClip, message: string) {
  clip.valid = false;
  clip.error = message;
  const key = `${clip.source}|${message}`;
  if (REPORTED.has(key)) return;
  REPORTED.add(key);
  console.warn(`[dino-quest][animation] ${message} — ${clip.source}`);
}

function validate(clip: AnimationClip) {
  if (clip.validated) return;
  const img = clip.image;
  if (!img.complete || img.naturalWidth === 0) return;
  clip.validated = true;
  clip.valid = true;
  clip.error = null;

  if (!Number.isInteger(clip.frameCount) || clip.frameCount < 1) {
    report(clip, `invalid frameCount (${clip.frameCount})`);
    return;
  }
  const cellW = clip.declaredWidth ?? img.naturalWidth / clip.frameCount;
  const cellH = clip.declaredHeight ?? img.naturalHeight;

  if (clip.frameCount * cellW > img.naturalWidth + 1) {
    report(
      clip,
      `sheet is ${img.naturalWidth}x${img.naturalHeight} but ${clip.frameCount} frames of ${Math.round(cellW)}px need ${Math.round(clip.frameCount * cellW)}px`,
    );
    return;
  }
  if (cellH > img.naturalHeight + 1) {
    report(clip, `frameHeight ${cellH} exceeds sheet height ${img.naturalHeight}`);
    return;
  }
  if (Math.abs(img.naturalWidth / clip.frameCount - Math.round(img.naturalWidth / clip.frameCount)) > 0.51 && clip.declaredWidth == null) {
    report(clip, `width ${img.naturalWidth} does not divide evenly into ${clip.frameCount} frames`);
    return;
  }
  clip.frameWidth = cellW;
  clip.frameHeight = cellH;
}

/** Build (or reuse) a validated clip for a definition. */
export function loadClip(def: AnimationDef): AnimationClip {
  const key = `${def.source}|${def.frameCount}|${def.frameWidth ?? ""}x${def.frameHeight ?? ""}`;
  const existing = CLIPS[key];
  if (existing) {
    validate(existing);
    return existing;
  }
  let img = IMAGES[def.source];
  if (!img) {
    img = new Image();
    img.src = def.source;
    IMAGES[def.source] = img;
  }
  const clip: AnimationClip = {
    ...def,
    image: img,
    frameWidth: def.frameWidth ?? 0,
    frameHeight: def.frameHeight ?? 0,
    valid: false,
    validated: false,
    error: null,
    declaredWidth: def.frameWidth,
    declaredHeight: def.frameHeight,
  };
  img.onerror = () => report(clip, "image failed to load");
  if (img.complete) validate(clip);
  else img.addEventListener("load", () => validate(clip), { once: true });
  CLIPS[key] = clip;
  return clip;
}

/** Ready = decoded AND passed validation. */
export function clipReady(clip: AnimationClip | undefined | null): clip is AnimationClip {
  if (!clip) return false;
  validate(clip);
  return clip.valid && clip.image.complete && clip.image.naturalWidth > 0;
}

/** Source rectangle for one frame of a clip. */
export function frameRect(clip: AnimationClip, index: number) {
  const i = ((index % clip.frameCount) + clip.frameCount) % clip.frameCount;
  const w = clip.frameWidth || clip.image.naturalWidth / clip.frameCount;
  const h = clip.frameHeight || clip.image.naturalHeight;
  return { sx: i * w, sy: 0, sw: w, sh: h };
}

/** Runtime playback head over an AnimationSet. */
export class Animator {
  state: AnimState;
  time = 0;
  finished = false;
  private set: AnimationSet;
  private base: AnimState;

  constructor(set: AnimationSet, base: AnimState) {
    this.set = set;
    this.base = base;
    this.state = base;
    this.time = Math.random() * 0.3;
  }

  get clip(): AnimationClip | undefined {
    return this.set[this.state] ?? this.set[this.base];
  }

  /** Switch state. Non-looping states restart so they always play out. */
  setState(state: AnimState, restart = false) {
    if (!this.set[state]) return;
    if (this.state === state && !restart) return;
    this.state = state;
    this.time = 0;
    this.finished = false;
  }

  /** Back to the resting state (idle / fly). */
  toBase() {
    this.setState(this.base);
  }

  update(dt: number, rate = 1) {
    const clip = this.clip;
    if (!clip) return;
    this.time += dt * rate;
    const total = clip.frameDuration * clip.frameCount;
    if (!clip.loop && this.time >= total) {
      this.time = total;
      this.finished = true;
    }
  }

  /** Advance by a number of frames — used for distance-driven run cycles. */
  advanceFrames(frames: number) {
    const clip = this.clip;
    if (!clip) return;
    this.time += frames * clip.frameDuration;
  }

  get frameIndex(): number {
    const clip = this.clip;
    if (!clip) return 0;
    const i = Math.floor(this.time / clip.frameDuration);
    if (!clip.loop) return Math.min(clip.frameCount - 1, Math.max(0, i));
    return ((i % clip.frameCount) + clip.frameCount) % clip.frameCount;
  }

  /** 0..1 progress through the current cycle (for bobs and dust timing). */
  get phase(): number {
    const clip = this.clip;
    if (!clip) return 0;
    const total = clip.frameDuration * clip.frameCount;
    return total > 0 ? (this.time % total) / total : 0;
  }

  /** 0..1 progress of a one-shot clip (for death fades). */
  get progress(): number {
    const clip = this.clip;
    if (!clip) return 1;
    const total = clip.frameDuration * clip.frameCount;
    return total > 0 ? Math.min(1, this.time / total) : 1;
  }
}

const HAS_RUN = (key: string) => !!RUN_SHEETS[key];

/**
 * Build the animation set for a sprite key.
 *
 * The project ships one still image plus one 4-frame movement sheet per
 * creature, so attack/hit/death reuse those sources with their own timing and
 * loop rules; the renderer adds the state-specific lunge, flash and fade.
 */
export function buildAnimationSet(spriteKey: string, flying: boolean): AnimationSet {
  const still = SPRITES[spriteKey as keyof typeof SPRITES];
  const sheet = RUN_SHEETS[spriteKey];
  const set: AnimationSet = {};
  if (still) {
    const idle: AnimationDef = { source: still, frameCount: 1, frameDuration: 0.4, loop: true };
    if (!flying) set.idle = loadClip(idle);
    set.hit = loadClip({ ...idle, frameDuration: 0.14, loop: false });
    set.death = loadClip({ ...idle, frameDuration: 0.5, loop: false });
  }
  if (sheet && HAS_RUN(spriteKey)) {
    const move: AnimationDef = {
      source: sheet.src,
      frameCount: sheet.frames,
      frameDuration: flying ? 0.1 : 0.09,
      loop: true,
    };
    if (flying) set.fly = loadClip(move);
    else set.run = loadClip(move);
    set.attack = loadClip({ ...move, frameDuration: 0.07, loop: false });
    if (!still) {
      set.hit = loadClip({ ...move, frameCount: 1, frameDuration: 0.14, loop: false });
      set.death = loadClip({ ...move, frameCount: 1, frameDuration: 0.5, loop: false });
    }
  }
  if (!set.idle && !set.fly && set.run) set.idle = set.run;
  return set;
}

/** Dev-time sweep: load and validate every declared creature animation. */
export function validateAllAnimations() {
  const keys = new Set<string>([...Object.keys(SPRITES), ...Object.keys(RUN_SHEETS)]);
  for (const key of keys) {
    const flying = key.includes("pterodactyl");
    const set = buildAnimationSet(key, flying);
    const required: AnimState[] = flying ? ["fly", "attack", "hit", "death"] : ["idle", "run", "attack", "hit", "death"];
    for (const state of required) {
      if (!set[state]) console.warn(`[dino-quest][animation] "${key}" is missing the "${state}" state`);
    }
  }
}
