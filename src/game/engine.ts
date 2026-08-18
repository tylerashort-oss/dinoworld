import { AREAS, type AreaDef, type EnemyType } from "./areas";
import { getAreas } from "./worlds";
import { RUN_SHEETS, SPRITES, getCharacter, getPet, getWeapon, petSpriteKey } from "./content";
import { defaultKeybinds, type ActionId, type Keybinds } from "./keybinds";
import { playSfx } from "./audio";

export interface HudState {
  hp: number;
  maxHp: number;
  shield: number;
  bones: number;
  areaName: string;
  areaSubtitle: string;
  bossName: string | null;
  bossHp: number;
  bossMaxHp: number;
  enemiesLeft: number;
  exitOpen: boolean;
  petReady: number;
  attackReady: number;
  petName: string | null;
  weaponName: string;
  hasDash: boolean;
  dashReady: number;
}

export type GameEvent =
  | { type: "death" }
  | { type: "bossDefeated"; id: EnemyType }
  | { type: "chestOpened" }
  | { type: "caveFound"; cardId: string; areaId: string }
  | { type: "areaExit"; areaIndex: number }
  | { type: "bonesChanged"; bones: number }
  | { type: "pauseRequested" }
  | { type: "banner"; text: string };

interface EngineOpts {
  canvas: HTMLCanvasElement;
  characterId: string;
  weaponId: string;
  petId: string | null;
  world: number;
  areaIndex: number;
  bones: number;
  openedChest: boolean;
  foundCaves: Record<string, boolean>;
  keybinds?: Keybinds;
  /** Enemy health / count scaling for the world (1 = Volcanic Lands, 2 = Ice World...). */
  difficulty?: number;
  /** Bone Forge upgrades. */
  damageMul?: number;
  petMul?: number;
  bonusMaxHp?: number;
  /** Pink Explorer perks. */
  petHits?: number;
  magnet?: number;
  shield?: number;
  /** Pink Explorer's dash. */
  dash?: boolean;
  onHud: (h: HudState) => void;
  onEvent: (e: GameEvent) => void;
}

interface Vec {
  x: number;
  y: number;
}

/** Shared, decoded-once image cache so re-entering a level never re-decodes sprites. */
const IMAGE_CACHE: Record<string, HTMLImageElement> = {};

function loadImage(src: string): HTMLImageElement {
  const cached = IMAGE_CACHE[src];
  if (cached) return cached;
  const img = new Image();
  img.onerror = () => {
    console.warn("[dinoquest] sprite failed to load:", src);
  };
  img.src = src;
  IMAGE_CACHE[src] = img;
  return img;
}

/** Drop expired items in place instead of allocating a new array every frame. */
function compact<T>(arr: T[], keep: (v: T) => boolean) {
  let n = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i] as T;
    if (keep(v)) arr[n++] = v;
  }
  arr.length = n;
}

/** Hard ceilings so a burst of cosmetics can never tank the frame rate on an iPad. */
const MAX_PARTICLES = 260;
const MAX_NUMBERS = 40;
const MAX_PROJECTILES = 90;

function pushCapped<T>(arr: T[], item: T, max: number) {
  if (arr.length >= max) arr.shift();
  arr.push(item);
}

interface Enemy {
  type: EnemyType;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  radius: number;
  size: number;
  speed: number;
  contactDamage: number;
  boss: boolean;
  name: string;
  sprite: HTMLImageElement | null;
  runSheet: HTMLImageElement | null;
  runFrames: number;
  runPhase: number;
  flying: boolean;
  shootTimer: number;
  hitFlash: number;
  contactCd: number;
  facing: number;
  enraged: boolean;
  dashTimer: number;
  bones: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  dmg: number;
  life: number;
  fromPlayer: boolean;
  theme: Theme;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface DamageNumber {
  x: number;
  y: number;
  value: number;
  life: number;
  crit: boolean;
}

interface Pickup {
  x: number;
  y: number;
  taken: boolean;
  bob: number;
}

interface Eruption {
  x: number;
  y: number;
  r: number;
  warn: number;
  burst: number;
  done: boolean;
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

export type Theme = "fire" | "ice" | "poison" | "desert" | "electric" | "shadow";

/** Broad behaviour category so AI never depends on a hard-coded type list. */
type EnemyKind = "flyer" | "hatchling" | "mini" | "raptor" | "titan";

const ENEMY_STATS: Record<
  EnemyType,
  {
    hp: number;
    speed: number;
    radius: number;
    size: number;
    contact: number;
    boss: boolean;
    name: string;
    sprite: keyof typeof SPRITES;
    bones: number;
    flying?: boolean;
    kind: EnemyKind;
  }
> = {
  pterodactyl: {
    hp: 50,
    speed: 95,
    radius: 34,
    size: 110,
    contact: 8,
    boss: false,
    name: "Pterodactyl",
    sprite: "pterodactyl",
    bones: 4,
    flying: true,
    kind: "flyer",
  },
  fireling: {
    hp: 65,
    speed: 125,
    radius: 28,
    size: 92,
    contact: 10,
    boss: false,
    name: "Fire Hatchling",
    sprite: "mini_fire_raptor",
    bones: 5,
    kind: "hatchling",
  },
  mini_fire_raptor: {
    hp: 320,
    speed: 160,
    radius: 44,
    size: 165,
    contact: 14,
    boss: true,
    name: "MINI FIRE RAPTOR",
    sprite: "mini_fire_raptor",
    bones: 25,
    kind: "mini",
  },
  fire_utahraptor: {
    hp: 620,
    speed: 185,
    radius: 55,
    size: 215,
    contact: 18,
    boss: true,
    name: "FIRE UTAHRAPTOR",
    sprite: "fire_utahraptor",
    bones: 40,
    kind: "raptor",
  },
  firesauras: {
    hp: 1500,
    speed: 115,
    radius: 95,
    size: 380,
    contact: 22,
    boss: true,
    name: "FIRESAURAS",
    sprite: "firesauras",
    bones: 100,
    kind: "titan",
  },
  frost_pterodactyl: {
    hp: 70,
    speed: 105,
    radius: 34,
    size: 110,
    contact: 10,
    boss: false,
    name: "Frost Pterodactyl",
    sprite: "frost_pterodactyl",
    bones: 6,
    flying: true,
    kind: "flyer",
  },
  snowling: {
    hp: 90,
    speed: 135,
    radius: 28,
    size: 92,
    contact: 12,
    boss: false,
    name: "Snow Hatchling",
    sprite: "mini_frost_raptor",
    bones: 7,
    kind: "hatchling",
  },
  mini_frost_raptor: {
    hp: 460,
    speed: 170,
    radius: 44,
    size: 165,
    contact: 16,
    boss: true,
    name: "MINI FROST RAPTOR",
    sprite: "mini_frost_raptor",
    bones: 35,
    kind: "mini",
  },
  frozen_utahraptor: {
    hp: 820,
    speed: 195,
    radius: 55,
    size: 215,
    contact: 20,
    boss: true,
    name: "FROZEN UTAHRAPTOR",
    sprite: "frozen_utahraptor",
    bones: 55,
    kind: "raptor",
  },
  glacierus: {
    hp: 2100,
    speed: 125,
    radius: 95,
    size: 380,
    contact: 26,
    boss: true,
    name: "GLACIERUS",
    sprite: "glacierus",
    bones: 140,
    kind: "titan",
  },
  vine_pterodactyl: {
    hp: 95,
    speed: 112,
    radius: 34,
    size: 110,
    contact: 12,
    boss: false,
    name: "Vine Pterodactyl",
    sprite: "vine_pterodactyl",
    bones: 8,
    flying: true,
    kind: "flyer",
  },
  sporeling: {
    hp: 120,
    speed: 142,
    radius: 28,
    size: 92,
    contact: 14,
    boss: false,
    name: "Spore Hatchling",
    sprite: "mini_toxic_raptor",
    bones: 9,
    kind: "hatchling",
  },
  mini_toxic_raptor: {
    hp: 620,
    speed: 178,
    radius: 44,
    size: 165,
    contact: 18,
    boss: true,
    name: "MINI TOXIC RAPTOR",
    sprite: "mini_toxic_raptor",
    bones: 45,
    kind: "mini",
  },
  toxic_utahraptor: {
    hp: 1100,
    speed: 200,
    radius: 55,
    size: 215,
    contact: 22,
    boss: true,
    name: "TOXIC UTAHRAPTOR",
    sprite: "toxic_utahraptor",
    bones: 70,
    kind: "raptor",
  },
  venomus: {
    hp: 2900,
    speed: 132,
    radius: 95,
    size: 380,
    contact: 30,
    boss: true,
    name: "VENOMUS",
    sprite: "venomus",
    bones: 180,
    kind: "titan",
  },
  sand_pterodactyl: { hp: 130, speed: 118, radius: 34, size: 110, contact: 14, boss: false, name: "Sand Pterodactyl", sprite: "sand_pterodactyl", bones: 10, flying: true, kind: "flyer" },
  sandling: { hp: 160, speed: 148, radius: 28, size: 92, contact: 16, boss: false, name: "Sand Hatchling", sprite: "mini_sand_raptor", bones: 11, kind: "hatchling" },
  mini_sand_raptor: { hp: 800, speed: 184, radius: 44, size: 165, contact: 20, boss: true, name: "MINI SAND RAPTOR", sprite: "mini_sand_raptor", bones: 55, kind: "mini" },
  sand_utahraptor: { hp: 1400, speed: 206, radius: 55, size: 215, contact: 24, boss: true, name: "SAND UTAHRAPTOR", sprite: "sand_utahraptor", bones: 85, kind: "raptor" },
  dunecrusher: { hp: 3700, speed: 138, radius: 95, size: 380, contact: 33, boss: true, name: "DUNECRUSHER", sprite: "dunecrusher", bones: 220, kind: "titan" },
  storm_pterodactyl: { hp: 175, speed: 126, radius: 34, size: 110, contact: 16, boss: false, name: "Storm Pterodactyl", sprite: "storm_pterodactyl", bones: 12, flying: true, kind: "flyer" },
  sparkling: { hp: 210, speed: 156, radius: 28, size: 92, contact: 18, boss: false, name: "Spark Hatchling", sprite: "mini_storm_raptor", bones: 13, kind: "hatchling" },
  mini_storm_raptor: { hp: 1020, speed: 192, radius: 44, size: 165, contact: 22, boss: true, name: "MINI STORM RAPTOR", sprite: "mini_storm_raptor", bones: 65, kind: "mini" },
  storm_utahraptor: { hp: 1750, speed: 214, radius: 55, size: 215, contact: 26, boss: true, name: "STORM UTAHRAPTOR", sprite: "storm_utahraptor", bones: 100, kind: "raptor" },
  voltasaurus: { hp: 4600, speed: 145, radius: 95, size: 380, contact: 36, boss: true, name: "VOLTASAURUS", sprite: "voltasaurus", bones: 260, kind: "titan" },
  shadow_pterodactyl: { hp: 230, speed: 134, radius: 34, size: 110, contact: 18, boss: false, name: "Shadow Pterodactyl", sprite: "shadow_pterodactyl", bones: 14, flying: true, kind: "flyer" },
  shadowling: { hp: 275, speed: 164, radius: 28, size: 92, contact: 20, boss: false, name: "Shadow Hatchling", sprite: "mini_shadow_raptor", bones: 15, kind: "hatchling" },
  mini_shadow_raptor: { hp: 1300, speed: 200, radius: 44, size: 165, contact: 24, boss: true, name: "MINI SHADOW RAPTOR", sprite: "mini_shadow_raptor", bones: 75, kind: "mini" },
  shadow_utahraptor: { hp: 2200, speed: 222, radius: 55, size: 215, contact: 28, boss: true, name: "SHADOW UTAHRAPTOR", sprite: "shadow_utahraptor", bones: 120, kind: "raptor" },
  eclipsaurus: { hp: 5800, speed: 152, radius: 95, size: 380, contact: 40, boss: true, name: "ECLIPSAURUS", sprite: "eclipsaurus", bones: 320, kind: "titan" },
};

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private running = false;
  private paused = false;
  private time = 0;

  private area!: AreaDef;
  private areaIndex: number;
  private worldId: number;
  private areas: AreaDef[];
  private opts: EngineOpts;
  private keybinds: Keybinds;

  private images: Record<string, HTMLImageElement | undefined> = {};

  // player
  private px = 0;
  private py = 0;
  private pz = 0;
  private pvz = 0;
  private hp = 100;
  private maxHp = 100;
  private facing = 1;
  private aimX = 1;
  private aimY = 0;
  private invuln = 0;
  private attackCd = 0;
  private attackAnim = 0;
  private attackHeld = false;
  private petCd = 0;
  private dead = false;
  private speedMul = 1;
  private lootBonus = 0;
  private runPhase = 0;
  private runSpeed = 0;
  private runFrames = 1;
  private difficulty = 1;
  private damageMul = 1;
  private petMul = 1;
  private petHits = 1;
  private magnet = 46;
  private shieldMax = 0;
  private shield = 0;
  private dashEnabled = false;
  private dashCd = 0;
  private dashTime = 0;
  private dashX = 1;
  private dashY = 0;
  private dashCooldown = 2.2;

  private weaponId: string;
  private petId: string | null;

  // pet
  private petX = 0;
  private petY = 0;
  private petPhase = 0;
  private petFacing = 1;
  private petAutoCd = 2;

  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private numbers: DamageNumber[] = [];
  private pickups: Pickup[] = [];
  private eruptions: Eruption[] = [];
  private waveIndex = 0;
  private waveDelay = 0;
  private exitOpen = false;
  private chestOpen = false;
  private caveFound = false;
  private eruptTimer = 5;
  private bones = 0;
  private bannerText = "";
  private bannerTime = 0;
  private hudTimer = 0;
  private scale = 1;
  private camX = 0;
  private camY = 0;
  private input: Vec = { x: 0, y: 0 };
  private keys: Record<string, boolean> = {};
  private groundPattern: CanvasPattern | null = null;

  constructor(opts: EngineOpts) {
    this.opts = opts;
    this.canvas = opts.canvas;
    const c = this.canvas.getContext("2d");
    if (!c) throw new Error("Canvas 2D unavailable");
    this.ctx = c;
    this.worldId = opts.world;
    this.areas = getAreas(this.worldId);
    this.keybinds = opts.keybinds ?? defaultKeybinds();
    this.areaIndex = opts.areaIndex;
    this.weaponId = opts.weaponId;
    this.petId = opts.petId;
    this.bones = opts.bones;
    const ch = getCharacter(opts.characterId);
    this.speedMul = ch.speed;
    this.lootBonus = ch.lootBonus;
    this.difficulty = opts.difficulty ?? 1;
    this.damageMul = opts.damageMul ?? 1;
    this.petMul = opts.petMul ?? 1;
    this.petHits = opts.petHits ?? 1;
    this.magnet = opts.magnet ?? 46;
    this.shieldMax = opts.shield ?? 0;
    this.dashEnabled = !!opts.dash;
    this.maxHp = 100 + (opts.bonusMaxHp ?? 0);
    this.hp = this.maxHp;
    this.preload(opts.characterId);
    this.loadArea(this.areaIndex);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  private preload(characterId: string) {
    (Object.keys(SPRITES) as (keyof typeof SPRITES)[]).forEach((k) => {
      this.images[k] = loadImage(SPRITES[k]);
    });
    Object.entries(RUN_SHEETS).forEach(([k, sheet]) => {
      this.images[`${k}__run`] = loadImage(sheet.src);
    });
    this.setRunSheet(characterId);
    this.images["player"] = this.images[characterId] ?? this.images["rocket_boy"];
  }

  private setRunSheet(characterId: string) {
    const sheet = RUN_SHEETS[characterId] ?? RUN_SHEETS["rocket_boy"];
    this.images["playerRun"] = this.images[`${characterId}__run`] ?? this.images["rocket_boy__run"];
    this.runFrames = sheet?.frames ?? 4;
  }

  setCharacterSprite(characterId: string) {
    this.images["player"] = this.images[characterId] ?? this.images["rocket_boy"];
    this.setRunSheet(characterId);
    const ch = getCharacter(characterId);
    this.speedMul = ch.speed;
    this.lootBonus = ch.lootBonus;
  }

  setWeapon(id: string) {
    this.weaponId = id;
  }

  setPet(id: string | null) {
    this.petId = id;
  }

  setPaused(p: boolean) {
    this.paused = p;
    if (!p) this.last = performance.now();
  }

  setKeybinds(kb: Keybinds) {
    this.keybinds = kb;
  }

  /** Switch the engine to another world and load its first area. */
  loadWorld(worldId: number, areaIndex = 0) {
    this.worldId = worldId;
    this.areas = getAreas(worldId);
    this.loadArea(areaIndex);
  }

  getWorldId() {
    return this.worldId;
  }

  setInput(v: Vec) {
    this.input = v;
  }

  loadArea(index: number) {
    this.areaIndex = clamp(index, 0, this.areas.length - 1);
    const area = this.areas[this.areaIndex] as AreaDef;
    this.area = area;
    this.px = area.spawn.x;
    this.py = area.spawn.y;
    this.pz = 0;
    this.pvz = 0;
    this.petX = this.px - 50;
    this.petY = this.py + 30;
    this.petPhase = 0;
    this.petAutoCd = 2;
    this.hp = this.maxHp;
    this.shield = this.shieldMax;
    this.dead = false;
    this.invuln = 1;
    this.attackCd = 0;
    this.petCd = 0;
    this.dashCd = 0;
    this.dashTime = 0;
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.numbers = [];
    this.eruptions = [];
    this.waveIndex = 0;
    this.waveDelay = 0.8;
    this.exitOpen = area.waves.length === 0 && !area.chest;
    this.chestOpen = false;
    this.caveFound = !!this.opts.foundCaves[area.id];
    if (area.chest && this.opts.openedChest) {
      this.chestOpen = true;
      this.exitOpen = true;
    }
    this.eruptTimer = area.eruptions ? area.eruptions * 0.6 : 0;
    this.pickups = area.bones.map((b) => ({
      x: b.x,
      y: b.y,
      taken: false,
      bob: Math.random() * 6,
    }));
    this.groundPattern = null;
    this.banner(`${area.name}`);
  }

  restartArea() {
    this.loadArea(this.areaIndex);
  }

  nextArea() {
    this.loadArea(this.areaIndex + 1);
  }

  getAreaIndex() {
    return this.areaIndex;
  }

  /** Current visual/elemental theme of the area. */
  private get theme(): Theme {
    return (this.area?.theme as Theme | undefined) ?? "fire";
  }

  /** True when the current area uses the frozen theme. */
  private get isIce() {
    return this.theme === "ice";
  }

  /**
   * Pick a value per theme. Desert / electric / shadow are optional and fall
   * back to the fire / ice / poison value when not supplied.
   */
  private tc<T>(fire: T, ice: T, poison: T, desert?: T, electric?: T, shadow?: T): T {
    switch (this.theme) {
      case "ice":
        return ice;
      case "poison":
        return poison;
      case "desert":
        return desert ?? fire;
      case "electric":
        return electric ?? ice;
      case "shadow":
        return shadow ?? poison;
      default:
        return fire;
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }

  private actionsFor(code: string): ActionId[] {
    const out: ActionId[] = [];
    for (const id of Object.keys(this.keybinds) as ActionId[]) {
      if ((this.keybinds[id] ?? []).includes(code)) out.push(id);
    }
    return out;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const acts = this.actionsFor(e.code);
    if (acts.length === 0) return;
    e.preventDefault();
    for (const a of acts) {
      this.keys[a] = true;
      if (a === "attack") this.setAttackHeld(true);
      if (a === "pet") this.petAttack();
      if (a === "jump") this.jump();
      if (a === "dash") this.dash();
      if (a === "pause") this.opts.onEvent({ type: "pauseRequested" });
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const acts = this.actionsFor(e.code);
    for (const a of acts) {
      this.keys[a] = false;
      if (a === "attack") this.setAttackHeld(false);
    }
  };

  banner(text: string) {
    this.bannerText = text;
    this.bannerTime = 2.2;
  }

  // ---------------- actions ----------------
  setAttackHeld(held: boolean) {
    this.attackHeld = held;
    if (held) this.attack();
  }

  attack() {
    if (this.dead || this.paused || this.attackCd > 0) return;
    const w = getWeapon(this.weaponId);
    this.attackCd = w.cooldown;
    this.attackAnim = 0.22;
    const wDamage = Math.round(w.damage * this.damageMul);
    playSfx("attack");
    // Kid-friendly auto-aim: if an enemy is in reach, swing at the closest one.
    const assist = this.nearestEnemy(this.px, this.py);
    if (assist) {
      this.aimX = assist.x - this.px;
      this.aimY = assist.y - this.py;
      const m = Math.hypot(this.aimX, this.aimY) || 1;
      this.aimX /= m;
      this.aimY /= m;
      this.facing = this.aimX >= 0 ? 1 : -1;
    }
    const ang = Math.atan2(this.aimY, this.aimX);
    // swing arc particles
    for (let i = 0; i < 10; i++) {
      const a = ang + (Math.random() - 0.5) * w.arc;
      const d = w.range * (0.4 + Math.random() * 0.6);
      this.particles.push({
        x: this.px + Math.cos(a) * d,
        y: this.py + Math.sin(a) * d * 0.8,
        vx: Math.cos(a) * 40,
        vy: Math.sin(a) * 40,
        life: 0.25,
        maxLife: 0.25,
        color: w.color,
        size: 5 + Math.random() * 5,
      });
    }
    let hitAny = false;
    for (const e of this.enemies) {
      const d = dist(this.px, this.py, e.x, e.y);
      if (d > w.range + e.radius) continue;
      const a = Math.atan2(e.y - this.py, e.x - this.px);
      let diff = Math.abs(((a - ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      diff = Math.abs(diff);
      if (diff > w.arc) continue;
      this.damageEnemy(e, wDamage + Math.floor(Math.random() * 4));
      hitAny = true;
    }
    // chest can be "hit" open too
    if (this.area.chest && !this.chestOpen) {
      if (dist(this.px, this.py, this.area.chest.x, this.area.chest.y) < w.range + 40)
        this.openChest();
    }
    if (hitAny) playSfx("hit");

    // ranged shot: always fire a glowing bolt so every tap has visible feedback
    this.projectiles.push({
      x: this.px + Math.cos(ang) * 30,
      y: this.py - 18 + Math.sin(ang) * 30,
      vx: Math.cos(ang) * 720,
      vy: Math.sin(ang) * 720,
      r: 12,
      dmg: Math.max(4, Math.round(wDamage * 0.6)),
      life: 1.4,
      fromPlayer: true,
      theme: this.theme,
    });
  }

  jump() {
    if (this.dead || this.paused) return;
    if (this.pz > 0) return;
    this.pvz = 420;
    playSfx("jump");
  }

  /** Pink Explorer's escape move: a short burst of speed with i-frames. */
  dash() {
    if (!this.dashEnabled || this.dead || this.paused) return;
    if (this.dashCd > 0 || this.dashTime > 0) return;
    const mag = Math.hypot(this.aimX, this.aimY);
    this.dashX = mag > 0.05 ? this.aimX / mag : this.facing;
    this.dashY = mag > 0.05 ? this.aimY / mag : 0;
    this.dashTime = 0.18;
    this.dashCd = this.dashCooldown;
    this.invuln = Math.max(this.invuln, 0.34);
    playSfx("jump");
    for (let i = 0; i < 8; i++)
      pushCapped(
        this.particles,
        {
          x: this.px - this.dashX * 14,
          y: this.py + 10 - this.dashY * 14,
          vx: -this.dashX * (80 + Math.random() * 90),
          vy: -this.dashY * (80 + Math.random() * 90) - 20,
          life: 0.3,
          maxLife: 0.3,
          color: "rgba(255,170,220,.75)",
          size: 6 + Math.random() * 5,
        },
        MAX_PARTICLES,
      );
  }

  canDash() {
    return this.dashEnabled;
  }

  petAttack() {
    if (this.dead || this.paused || !this.petId || this.petCd > 0) return;
    this.petStrike();
  }

  /** Stand back up on the spot after spending an extra life. */
  revive() {
    this.dead = false;
    this.hp = this.maxHp;
    this.shield = this.shieldMax;
    this.invuln = 2.5;
    this.banner("EXTRA LIFE USED!");
  }

  /** The pet lunges at the nearest enemy and claws it. */
  private petStrike() {
    if (this.dead || !this.petId) return;
    const pet = getPet(this.petId);
    if (!pet) return;
    const target = this.nearestEnemy(this.petX, this.petY);
    if (!target) return;
    this.petCd = pet.cooldown;
    this.petAutoCd = pet.cooldown * 1.9;
    // pet lunges: instant strike + flame trail
    const steps = 14;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      this.particles.push({
        x: this.petX + (target.x - this.petX) * t,
        y: this.petY + (target.y - this.petY) * t,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
        life: 0.4,
        maxLife: 0.4,
        color: this.tc("#ff8a2b", "#8fe4ff", "#8bf05a"),
        size: 8,
      });
    }
    this.petX = target.x - 40;
    this.petY = target.y + 20;
    const hit = Math.round(pet.damage * this.petMul);
    for (let i = 0; i < this.petHits; i++) {
      if (target.hp <= 0) break;
      this.damageEnemy(target, hit + Math.floor(Math.random() * 6));
    }
    playSfx("hit");
  }

  private nearestEnemy(x: number, y: number): Enemy | null {
    let best: Enemy | null = null;
    let bd = 900;
    for (const e of this.enemies) {
      const d = dist(x, y, e.x, e.y);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  private damageEnemy(e: Enemy, dmg: number) {
    e.hp -= dmg;
    e.hitFlash = 0.18;
    const kb = e.boss ? 6 : 22;
    const a = Math.atan2(e.y - this.py, e.x - this.px);
    e.x += Math.cos(a) * kb;
    e.y += Math.sin(a) * kb;
    this.numbers.push({ x: e.x, y: e.y - e.size * 0.35, value: dmg, life: 0.9, crit: dmg > 25 });
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: e.x,
        y: e.y,
        vx: (Math.random() - 0.5) * 220,
        vy: (Math.random() - 0.5) * 220,
        life: 0.35,
        maxLife: 0.35,
        color: this.tc(
          i % 2 ? "#ffd166" : "#ff5b2e",
          i % 2 ? "#d8f4ff" : "#57bdf5",
          i % 2 ? "#dcff9a" : "#4fbe3c",
        ),
        size: 5 + Math.random() * 4,
      });
    }
    if (e.hp <= 0) this.killEnemy(e);
  }

  private killEnemy(e: Enemy) {
    this.enemies = this.enemies.filter((x) => x !== e);
    for (let i = 0; i < 22; i++) {
      this.particles.push({
        x: e.x,
        y: e.y,
        vx: (Math.random() - 0.5) * 320,
        vy: (Math.random() - 0.5) * 320,
        life: 0.7,
        maxLife: 0.7,
        color: this.tc(
          i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#ff9e2c" : "#ff3d2e",
          i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#7fd7ff" : "#2f8ed6",
          i % 3 === 0 ? "#f4ffdf" : i % 3 === 1 ? "#a6f05a" : "#2f8f3a",
        ),
        size: 6 + Math.random() * 6,
      });
    }
    const drop = Math.round(e.bones * (1 + this.lootBonus));
    for (let i = 0; i < Math.min(8, Math.max(2, Math.round(drop / 3))); i++) {
      this.pickups.push({
        x: e.x + (Math.random() - 0.5) * 90,
        y: e.y + (Math.random() - 0.5) * 90,
        taken: false,
        bob: Math.random() * 6,
      });
    }
    if (e.boss) {
      playSfx("bossDown");
      this.opts.onEvent({ type: "bossDefeated", id: e.type });
    } else {
      playSfx("enemyDown");
    }
  }

  private openChest() {
    if (this.chestOpen) return;
    this.chestOpen = true;
    this.exitOpen = true;
    playSfx("card");
    const c = this.area.chest!;
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: c.x,
        y: c.y,
        vx: (Math.random() - 0.5) * 300,
        vy: -Math.random() * 320,
        life: 1,
        maxLife: 1,
        color: i % 2 ? "#ffd166" : "#fff3c4",
        size: 6 + Math.random() * 6,
      });
    }
    this.opts.onEvent({ type: "chestOpened" });
  }

  private addBones(n: number) {
    this.bones += n;
    this.opts.onEvent({ type: "bonesChanged", bones: this.bones });
  }

  /** Award reward bones through the engine so it stays the single source of truth. */
  addBonusBones(n: number) {
    this.addBones(n);
  }

  getDebug() {
    return {
      x: Math.round(this.px),
      y: Math.round(this.py),
      hp: Math.round(this.hp),
      area: this.areaIndex,
      exitOpen: this.exitOpen,
      exit: this.area.exit,
      chest: this.area.chest ?? null,
      chestOpen: this.chestOpen,
      cave: this.area.cave ?? null,
      dead: this.dead,
      enemies: this.enemies.map((e) => ({
        type: e.type,
        hp: Math.round(e.hp),
        x: Math.round(e.x),
        y: Math.round(e.y),
      })),
    };
  }

  /** Test helper: applies damage to every enemy (used by automated playtests). */
  debugHitAll(dmg: number) {
    for (const e of [...this.enemies]) this.damageEnemy(e, dmg);
  }

  debugTeleport(x: number, y: number) {
    this.px = x;
    this.py = y;
  }

  setBones(n: number) {
    this.bones = n;
  }

  // ---------------- update ----------------
  private loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!this.paused) {
      this.time += dt;
      this.update(dt);
    }
    this.render();
    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.1;
      this.emitHud();
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private emitHud() {
    const boss = this.enemies.find((e) => e.boss) ?? null;
    const w = getWeapon(this.weaponId);
    this.opts.onHud({
      hp: Math.max(0, Math.round(this.hp)),
      maxHp: this.maxHp,
      shield: this.shield,
      bones: this.bones,
      areaName: this.area.name,
      areaSubtitle: this.area.subtitle,
      bossName: boss ? boss.name : null,
      bossHp: boss ? Math.max(0, boss.hp) : 0,
      bossMaxHp: boss ? boss.maxHp : 1,
      enemiesLeft: this.enemies.length,
      exitOpen: this.exitOpen,
      petReady: this.petId ? clamp(1 - this.petCd / (getPet(this.petId)?.cooldown ?? 1), 0, 1) : 0,
      attackReady: clamp(1 - this.attackCd / w.cooldown, 0, 1),
      petName: getPet(this.petId)?.name ?? null,
      weaponName: w.name,
      hasDash: this.dashEnabled,
      dashReady: this.dashEnabled ? clamp(1 - this.dashCd / this.dashCooldown, 0, 1) : 0,
    });
  }

  private spawnWave() {
    const wave = this.area.waves[this.waveIndex];
    if (!wave) return;
    for (const s of wave) {
      const st = ENEMY_STATS[s.type]!;
      const runSheet = RUN_SHEETS[st.sprite];
      const hp = Math.round(st.hp * this.difficulty);
      this.enemies.push({
        type: s.type,
        x: s.x,
        y: s.y,
        z: st.flying ? 70 : 0,
        vx: 0,
        vy: 0,
        hp,
        maxHp: hp,
        radius: st.radius,
        size: st.size,
        speed: st.speed,
        contactDamage: st.contact,
        boss: st.boss,
        name: st.name,
        sprite: this.images[st.sprite] ?? null,
        runSheet: this.images[`${st.sprite}__run`] ?? null,
        runFrames: runSheet?.frames ?? 4,
        runPhase: Math.random(),
        flying: !!st.flying,
        shootTimer: 1 + Math.random() * 2,
        hitFlash: 0,
        contactCd: 0,
        facing: -1,
        enraged: false,
        dashTimer: 2,
        bones: Math.round(st.bones * this.difficulty),
      });
      if (st.boss) {
        playSfx("boss");
        this.banner(st.name + " APPEARS!");
      }
    }
    this.waveIndex++;
  }

  private update(dt: number) {
    if (this.dead) {
      this.updateParticles(dt);
      return;
    }
    const area = this.area;

    // ---- waves
    if (this.enemies.length === 0 && this.waveIndex < area.waves.length) {
      this.waveDelay -= dt;
      if (this.waveDelay <= 0) {
        this.spawnWave();
        this.waveDelay = 1.6;
      }
    }
    if (this.enemies.length === 0 && this.waveIndex >= area.waves.length && !this.exitOpen) {
      if (!area.chest || this.chestOpen) {
        this.exitOpen = true;
        this.banner("PATH OPEN — HEAD TO THE GLOWING GATE");
      }
    }

    // ---- input vector
    let ix = this.input.x;
    let iy = this.input.y;
    if (this.keys["left"]) ix -= 1;
    if (this.keys["right"]) ix += 1;
    if (this.keys["up"]) iy -= 1;
    if (this.keys["down"]) iy += 1;
    const mag = Math.hypot(ix, iy);
    if (mag > 1) {
      ix /= mag;
      iy /= mag;
    }

    // ---- player movement
    const inLava = this.pz < 26 && this.pointInLava(this.px, this.py);
    this.dashCd = Math.max(0, this.dashCd - dt);
    if (this.dashTime > 0) {
      this.dashTime = Math.max(0, this.dashTime - dt);
      ix = this.dashX;
      iy = this.dashY;
    }
    const base = 250 * this.speedMul * (inLava ? 0.6 : 1) * (this.dashTime > 0 ? 3.2 : 1);
    const nx = this.px + ix * base * dt;
    const ny = this.py + iy * base * dt;
    const prevX = this.px;
    const prevY = this.py;
    this.px = clamp(nx, 30, area.w - 30);
    this.py = clamp(ny, 30, area.h - 30);
    if (this.pz <= 0) this.resolveRocks();
    this.px = clamp(this.px, 30, area.w - 30);
    this.py = clamp(this.py, 30, area.h - 30);

    // ---- run cycle driven by actual distance moved
    const moved = Math.hypot(this.px - prevX, this.py - prevY);
    this.runSpeed = dt > 0 ? moved / dt : 0;
    if (this.pz <= 0 && moved > 0.4) {
      const prevPhase = this.runPhase;
      this.runPhase += moved / 55;
      // dust puff each time a foot plants (whole-frame boundary)
      if (Math.floor(prevPhase * this.runFrames) !== Math.floor(this.runPhase * this.runFrames)) {
        this.particles.push({
          x: this.px - this.facing * 12 + (Math.random() - 0.5) * 10,
          y: this.py + 12,
          vx: -this.facing * (30 + Math.random() * 40),
          vy: -30 - Math.random() * 30,
          life: 0.35,
          maxLife: 0.35,
          color: this.tc("rgba(255,200,150,.55)", "rgba(225,245,255,.65)", "rgba(190,235,140,.55)"),
          size: 5 + Math.random() * 4,
        });
      }
    }

    if (mag > 0.05) {
      this.aimX = ix;
      this.aimY = iy;
      if (Math.abs(ix) > 0.1) this.facing = ix > 0 ? 1 : -1;
    }

    // jump physics
    if (this.pz > 0 || this.pvz > 0) {
      this.pvz -= 1100 * dt;
      this.pz += this.pvz * dt;
      if (this.pz <= 0) {
        this.pz = 0;
        this.pvz = 0;
      }
    }

    // lava damage
    if (inLava) {
      this.hurtPlayer(16 * dt, true);
      if (Math.random() < 0.4)
        this.particles.push({
          x: this.px + (Math.random() - 0.5) * 30,
          y: this.py + 10,
          vx: 0,
          vy: -60,
          life: 0.4,
          maxLife: 0.4,
          color: this.tc("#ff7b28", "#9fdcff", "#8ee23f"),
          size: 7,
        });
    }

    this.attackCd = Math.max(0, this.attackCd - dt);
    if (this.attackHeld && this.attackCd <= 0) this.attack();
    this.attackAnim = Math.max(0, this.attackAnim - dt);
    this.petCd = Math.max(0, this.petCd - dt);
    this.invuln = Math.max(0, this.invuln - dt);

    // ---- pet follow
    if (this.petId) {
      const tx = this.px - this.facing * 62;
      const ty = this.py + 34;
      const ppx = this.petX;
      const ppy = this.petY;
      this.petX += (tx - this.petX) * Math.min(1, dt * 4);
      this.petY += (ty - this.petY) * Math.min(1, dt * 4);
      const pmoved = Math.hypot(this.petX - ppx, this.petY - ppy);
      if (pmoved > 0.15) {
        const prev = this.petPhase;
        this.petPhase += pmoved / 34;
        if (Math.abs(this.petX - ppx) > 0.2) this.petFacing = this.petX > ppx ? 1 : -1;
        if (Math.floor(prev * 4) !== Math.floor(this.petPhase * 4)) {
          this.particles.push({
            x: this.petX - this.petFacing * 10,
            y: this.petY + 8,
            vx: -this.petFacing * (20 + Math.random() * 25),
            vy: -18 - Math.random() * 20,
            life: 0.28,
            maxLife: 0.28,
            color: this.tc("rgba(255,200,150,.5)", "rgba(220,240,255,.6)", "rgba(190,235,140,.5)"),
            size: 4 + Math.random() * 3,
          });
        }
      }
      // pets fight on their own too, so they always help
      this.petAutoCd -= dt;
      if (this.petAutoCd <= 0 && this.petCd <= 0) this.petStrike();
    }

    // ---- enemies
    for (const e of this.enemies) {
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.contactCd = Math.max(0, e.contactCd - dt);
      const eprevX = e.x;
      const eprevY = e.y;
      const d = dist(e.x, e.y, this.px, this.py);
      const ang = Math.atan2(this.py - e.y, this.px - e.x);
      e.facing = this.px > e.x ? 1 : -1;

      if (
        e.boss &&
        (e.type === "firesauras" || e.type === "glacierus" || e.type === "venomus") &&
        !e.enraged &&
        e.hp < e.maxHp * 0.5
      ) {
        e.enraged = true;
        e.speed = e.speed * 1.5;
        this.banner(`${e.name} IS ENRAGED!`);
        playSfx("boss");
      }

      if (e.flying) {
        const want = 240;
        const dir = d > want + 40 ? 1 : d < want - 40 ? -1 : 0;
        e.x += Math.cos(ang) * e.speed * dir * dt;
        e.y += Math.sin(ang) * e.speed * dir * dt + Math.sin(this.time * 2 + e.x) * 12 * dt;
        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
          e.shootTimer = 2.2;
          this.shoot(e.x, e.y, ang, 260, 9);
        }
      } else if (e.type === "firesauras" || e.type === "glacierus" || e.type === "venomus") {
        const spd = e.speed * (d > 170 ? 1 : 0);
        e.x += Math.cos(ang) * spd * dt;
        e.y += Math.sin(ang) * spd * dt;
        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
          e.shootTimer = e.enraged ? 1.7 : 2.8;
          const n = e.enraged ? 5 : 3;
          for (let i = 0; i < n; i++) {
            const spread = (i - (n - 1) / 2) * 0.28;
            this.shoot(e.x, e.y, ang + spread, 300, 12);
          }
          playSfx("eruption");
        }
      } else {
        // chasers: fireling, mini raptor, utahraptor
        let spd = e.speed;
        if (e.type === "fire_utahraptor" || e.type === "frozen_utahraptor") {
          e.dashTimer -= dt;
          if (e.dashTimer <= 0) {
            spd = e.speed * 2.4;
            if (e.dashTimer < -0.55) e.dashTimer = 2.6;
          }
        }
        if (d > e.radius + 18) {
          e.x += Math.cos(ang) * spd * dt;
          e.y += Math.sin(ang) * spd * dt;
        }
        if (
          e.type === "mini_fire_raptor" ||
          e.type === "mini_frost_raptor" ||
          e.type === "mini_toxic_raptor"
        ) {
          e.shootTimer -= dt;
          if (e.shootTimer <= 0) {
            e.shootTimer = 3.6;
            for (let i = -1; i <= 1; i++) this.shoot(e.x, e.y, ang + i * 0.25, 280, 10);
          }
        }
      }

      e.x = clamp(e.x, 40, area.w - 40);
      e.y = clamp(e.y, 40, area.h - 40);

      // ---- leg / wing animation driven by real distance moved
      if (e.flying) {
        e.runPhase += dt * 2.4;
      } else {
        const emoved = Math.hypot(e.x - eprevX, e.y - eprevY);
        if (emoved > 0.2) {
          const prevPhase = e.runPhase;
          e.runPhase += emoved / (e.size * 0.55);
          if (Math.floor(prevPhase * e.runFrames) !== Math.floor(e.runPhase * e.runFrames)) {
            this.particles.push({
              x: e.x - e.facing * e.size * 0.14,
              y: e.y + e.size * 0.1,
              vx: -e.facing * (20 + Math.random() * 30),
              vy: -20 - Math.random() * 25,
              life: 0.32,
              maxLife: 0.32,
              color: this.tc(
                "rgba(255,200,150,.5)",
                "rgba(220,240,255,.65)",
                "rgba(190,235,140,.5)",
              ),
              size: 4 + Math.random() * 4,
            });
          }
        }
      }

      // contact damage
      if (d < e.radius + 22 && e.contactCd <= 0 && (!e.flying || this.pz < 40)) {
        e.contactCd = 0.9;
        this.hurtPlayer(e.contactDamage);
      }
    }

    // ---- projectiles
    for (const p of this.projectiles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (Math.random() < 0.6)
        this.particles.push({
          x: p.x,
          y: p.y,
          vx: 0,
          vy: 0,
          life: 0.25,
          maxLife: 0.25,
          color: p.theme === "ice" ? "#9fe6ff" : p.theme === "poison" ? "#a4ee54" : "#ff9d2e",
          size: p.r * 1.2,
        });
      if (!p.fromPlayer && this.pz < 34 && dist(p.x, p.y, this.px, this.py) < p.r + 20) {
        p.life = 0;
        this.hurtPlayer(p.dmg);
      }
      if (p.fromPlayer) {
        for (const e of this.enemies) {
          if (dist(p.x, p.y, e.x, e.y) < p.r + e.radius) {
            p.life = 0;
            this.damageEnemy(e, p.dmg);
            playSfx("hit");
            break;
          }
        }
      }
    }
    compact(
      this.projectiles,
      (p) => p.life > 0 && p.x > -50 && p.y > -50 && p.x < area.w + 50 && p.y < area.h + 50,
    );

    // ---- pickups
    for (const b of this.pickups) {
      if (b.taken) continue;
      b.bob += dt * 4;
      if (dist(b.x, b.y, this.px, this.py) < this.magnet) {
        b.taken = true;
        this.addBones(Math.round(1 + this.lootBonus));
        playSfx("bone");
      }
    }

    // ---- eruptions
    if (area.eruptions > 0) {
      this.eruptTimer -= dt;
      if (this.eruptTimer <= 0) {
        this.eruptTimer = area.eruptions;
        for (let i = 0; i < 3; i++) {
          this.eruptions.push({
            x: clamp(this.px + (Math.random() - 0.5) * 700, 80, area.w - 80),
            y: clamp(this.py + (Math.random() - 0.5) * 500, 80, area.h - 80),
            r: 90,
            warn: 1.4,
            burst: 0,
            done: false,
          });
        }
      }
    }
    for (const er of this.eruptions) {
      if (er.warn > 0) {
        er.warn -= dt;
        if (er.warn <= 0) {
          er.burst = 0.6;
          playSfx("eruption");
          for (let i = 0; i < 24; i++)
            this.particles.push({
              x: er.x + (Math.random() - 0.5) * er.r,
              y: er.y + (Math.random() - 0.5) * er.r * 0.6,
              vx: (Math.random() - 0.5) * 120,
              vy: -180 - Math.random() * 220,
              life: 0.8,
              maxLife: 0.8,
              color: i % 2 ? "#ff5b1e" : "#ffc857",
              size: 8 + Math.random() * 8,
            });
          if (this.pz < 40 && dist(er.x, er.y, this.px, this.py) < er.r) this.hurtPlayer(18);
        }
      } else {
        er.burst -= dt;
        if (er.burst <= 0) er.done = true;
      }
    }
    compact(this.eruptions, (e) => !e.done);

    // ---- cave discovery
    if (area.cave && !this.caveFound && dist(this.px, this.py, area.cave.x, area.cave.y) < 70) {
      this.caveFound = true;
      playSfx("card");
      this.opts.onEvent({ type: "caveFound", cardId: area.cave.cardId, areaId: area.id });
    }

    // ---- chest by touch
    if (area.chest && !this.chestOpen && dist(this.px, this.py, area.chest.x, area.chest.y) < 70) {
      this.openChest();
    }

    // ---- exit
    if (this.exitOpen && dist(this.px, this.py, area.exit.x, area.exit.y) < 60) {
      this.opts.onEvent({ type: "areaExit", areaIndex: this.areaIndex });
    }

    this.updateParticles(dt);
    this.bannerTime = Math.max(0, this.bannerTime - dt);
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      p.life -= dt;
    }
    compact(this.particles, (p) => p.life > 0);
    if (this.particles.length > MAX_PARTICLES)
      this.particles.splice(0, this.particles.length - MAX_PARTICLES);
    for (const n of this.numbers) {
      n.y -= 45 * dt;
      n.life -= dt;
    }
    compact(this.numbers, (n) => n.life > 0);
    if (this.numbers.length > MAX_NUMBERS)
      this.numbers.splice(0, this.numbers.length - MAX_NUMBERS);
    if (this.projectiles.length > MAX_PROJECTILES)
      this.projectiles.splice(0, this.projectiles.length - MAX_PROJECTILES);
  }

  private shoot(x: number, y: number, ang: number, speed: number, dmg: number) {
    this.projectiles.push({
      x,
      y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      r: 13,
      dmg: Math.round(dmg * (1 + (this.difficulty - 1) * 0.35)),
      life: 4,
      fromPlayer: false,
      theme: this.theme,
    });
  }

  private hurtPlayer(dmg: number, continuous = false) {
    if (this.dead) return;
    if (!continuous && this.invuln > 0) return;
    if (!continuous && this.shield > 0) {
      this.shield -= 1;
      this.invuln = 1.2;
      this.banner("SHIELD BLOCKED THE HIT!");
      playSfx("hurt");
      for (let i = 0; i < 18; i++)
        this.particles.push({
          x: this.px,
          y: this.py - 20,
          vx: (Math.random() - 0.5) * 320,
          vy: (Math.random() - 0.5) * 320,
          life: 0.5,
          maxLife: 0.5,
          color: i % 2 ? "#ffd1f0" : "#ff7ad1",
          size: 6,
        });
      return;
    }
    this.hp -= dmg;
    if (!continuous) {
      this.invuln = 0.85;
      playSfx("hurt");
      for (let i = 0; i < 10; i++)
        this.particles.push({
          x: this.px,
          y: this.py,
          vx: (Math.random() - 0.5) * 200,
          vy: (Math.random() - 0.5) * 200,
          life: 0.4,
          maxLife: 0.4,
          color: "#ff4d4d",
          size: 5,
        });
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.opts.onEvent({ type: "death" });
    }
  }

  private pointInLava(x: number, y: number) {
    return this.area.lava.some((r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h);
  }

  private resolveRocks() {
    for (const r of this.area.rocks) {
      const cx = clamp(this.px, r.x, r.x + r.w);
      const cy = clamp(this.py, r.y, r.y + r.h);
      const dx = this.px - cx;
      const dy = this.py - cy;
      const d = Math.hypot(dx, dy);
      if (d < 24) {
        if (d === 0) {
          this.px = r.x - 25;
          continue;
        }
        this.px = cx + (dx / d) * 24;
        this.py = cy + (dy / d) * 24;
      }
    }
  }

  // ---------------- render ----------------
  private makeGround(): CanvasPattern | null {
    const t = document.createElement("canvas");
    t.width = 128;
    t.height = 128;
    const c = t.getContext("2d");
    if (!c) return null;
    const dark = this.area.cave_dark;
    if (this.theme === "desert" || this.theme === "electric" || this.theme === "shadow") {
      const [bg, hi, mid, lo] = this.tc(
        ["", "", "", ""],
        ["", "", "", ""],
        ["", "", "", ""],
        dark
          ? ["#2a2013", "rgba(255,225,150,0.16)", "rgba(255,255,255,0.04)", "rgba(40,25,0,0.25)"]
          : ["#4a3a1d", "rgba(255,235,170,0.18)", "rgba(255,255,255,0.06)", "rgba(70,45,10,0.25)"],
        dark
          ? ["#131a2e", "rgba(150,200,255,0.20)", "rgba(255,255,255,0.05)", "rgba(0,10,40,0.28)"]
          : ["#1d2748", "rgba(170,215,255,0.22)", "rgba(255,255,255,0.06)", "rgba(4,10,45,0.26)"],
        dark
          ? ["#0b0a16", "rgba(180,160,255,0.16)", "rgba(255,255,255,0.04)", "rgba(0,0,0,0.32)"]
          : ["#14122a", "rgba(200,180,255,0.18)", "rgba(255,255,255,0.05)", "rgba(0,0,0,0.3)"],
      ) as string[];
      c.fillStyle = bg as string;
      c.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 240; i++) {
        const v = Math.random();
        c.fillStyle = (v > 0.9 ? hi : v > 0.55 ? mid : lo) as string;
        c.fillRect(
          Math.random() * 128,
          Math.random() * 128,
          1 + Math.random() * 4,
          1 + Math.random() * 4,
        );
      }
    } else if (this.theme === "poison") {
      c.fillStyle = this.area.cave_dark ? "#111f14" : "#1b3320";
      c.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 240; i++) {
        const v = Math.random();
        c.fillStyle =
          v > 0.9
            ? "rgba(150,240,110,0.20)"
            : v > 0.55
              ? "rgba(255,255,255,0.04)"
              : "rgba(0,25,10,0.28)";
        c.fillRect(
          Math.random() * 128,
          Math.random() * 128,
          1 + Math.random() * 4,
          1 + Math.random() * 4,
        );
      }
    } else if (this.isIce) {
      c.fillStyle = this.area.cave_dark ? "#152233" : "#20344a";
      c.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 240; i++) {
        const v = Math.random();
        c.fillStyle =
          v > 0.9
            ? "rgba(200,235,255,0.22)"
            : v > 0.55
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,20,40,0.25)";
        c.fillRect(
          Math.random() * 128,
          Math.random() * 128,
          1 + Math.random() * 4,
          1 + Math.random() * 4,
        );
      }
    } else {
      c.fillStyle = this.area.cave_dark ? "#1b1013" : "#241a18";
      c.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 220; i++) {
        const v = Math.random();
        c.fillStyle =
          v > 0.94
            ? "rgba(255,120,40,0.22)"
            : v > 0.6
              ? "rgba(255,255,255,0.035)"
              : "rgba(0,0,0,0.25)";
        c.fillRect(
          Math.random() * 128,
          Math.random() * 128,
          1 + Math.random() * 4,
          1 + Math.random() * 4,
        );
      }
    }
    return this.ctx.createPattern(t, "repeat");
  }

  private render() {
    const ctx = this.ctx;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = this.canvas.clientWidth;
    const chh = this.canvas.clientHeight;
    if (
      this.canvas.width !== Math.floor(cw * dpr) ||
      this.canvas.height !== Math.floor(chh * dpr)
    ) {
      this.canvas.width = Math.floor(cw * dpr);
      this.canvas.height = Math.floor(chh * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, chh);

    this.scale = clamp(Math.min(cw / 1150, chh / 720), 0.45, 1.4);
    const s = this.scale;
    const viewW = cw / s;
    const viewH = chh / s;
    this.camX = clamp(this.px - viewW / 2, 0, Math.max(0, this.area.w - viewW));
    this.camY = clamp(this.py - viewH / 2, 0, Math.max(0, this.area.h - viewH));
    if (this.area.w < viewW) this.camX = (this.area.w - viewW) / 2;
    if (this.area.h < viewH) this.camY = (this.area.h - viewH) / 2;

    ctx.save();
    ctx.scale(s, s);
    ctx.translate(-this.camX, -this.camY);

    if (!this.groundPattern) this.groundPattern = this.makeGround();
    ctx.fillStyle = this.groundPattern ?? "#241a18";
    ctx.fillRect(0, 0, this.area.w, this.area.h);

    // ambient glow
    const g = ctx.createRadialGradient(
      this.area.w * 0.7,
      this.area.h * 0.4,
      50,
      this.area.w * 0.7,
      this.area.h * 0.4,
      Math.max(this.area.w, this.area.h) * 0.7,
    );
    g.addColorStop(
      0,
      this.tc(
        "rgba(255,90,20,0.10)",
        "rgba(150,220,255,0.10)",
        "rgba(140,255,90,0.10)",
        "rgba(255,205,110,0.12)",
        "rgba(180,220,255,0.12)",
        "rgba(150,130,255,0.10)",
      ),
    );
    g.addColorStop(
      1,
      this.tc(
        "rgba(0,0,0,0.45)",
        "rgba(0,10,30,0.45)",
        "rgba(0,20,8,0.45)",
        "rgba(40,20,0,0.42)",
        "rgba(4,6,34,0.5)",
        "rgba(0,0,14,0.62)",
      ),
    );
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.area.w, this.area.h);

    this.drawLava(ctx);
    this.drawEruptions(ctx);
    this.drawCaveAndExit(ctx);
    this.drawPickups(ctx);
    this.drawRocks(ctx);
    this.drawChest(ctx);
    this.drawEnemies(ctx);
    this.drawPet(ctx);
    this.drawPlayer(ctx);
    this.drawProjectiles(ctx);
    this.drawParticles(ctx);
    this.drawNumbers(ctx);

    ctx.restore();

    if (this.bannerTime > 0) {
      const a = Math.min(1, this.bannerTime);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = `bold ${Math.round(clamp(cw / 26, 20, 44))}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(0,0,0,.85)";
      ctx.strokeText(this.bannerText, cw / 2, chh * 0.17);
      ctx.fillStyle = "#ffd166";
      ctx.fillText(this.bannerText, cw / 2, chh * 0.17);
      ctx.restore();
    }
  }

  /** Deterministic pseudo-random so pool/rock detail never flickers. */
  private static hash(a: number, b: number) {
    const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  private drawLava(ctx: CanvasRenderingContext2D) {
    const p3 = <T>(fire: T, iceV: T, poisonV: T, d?: T, e?: T, s?: T) =>
      this.tc(fire, iceV, poisonV, d, e, s);
    /** Base pool gradient stops per theme: [top, middle, bottom]. */
    const base = this.tc(
      ["#8c1c00", "#d63b00", "#6d1400"],
      ["#1d5c8f", "#2c86c4", "#123f66"],
      ["#1f5a1c", "#4f9c26", "#123f13"],
      ["#7a4a12", "#d99a2c", "#5a340c"],
      ["#1a2f7a", "#5f8bff", "#101a4d"],
      ["#2a1250", "#6b3fc4", "#150a2c"],
    );
    /** Hot vein gradient stops per theme. */
    const vein = this.tc(
      ["255,240,170", "255,140,20", "180,40,0"],
      ["190,240,255", "120,200,255", "20,70,120"],
      ["210,255,150", "120,220,60", "20,80,20"],
      ["255,238,180", "244,190,80", "150,90,10"],
      ["235,245,255", "120,180,255", "20,40,160"],
      ["225,205,255", "150,100,240", "50,20,110"],
    );
    for (const r of this.area.lava) {
      const t = this.time;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 26);
      ctx.clip();

      // molten base
      const lg = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      lg.addColorStop(0, base[0] as string);
      lg.addColorStop(0.5, base[1] as string);
      lg.addColorStop(1, base[2] as string);
      ctx.fillStyle = lg;
      ctx.fillRect(r.x, r.y, r.w, r.h);

      // flowing hot veins between crust plates
      const cols = Math.max(2, Math.round(r.w / 58));
      const rows = Math.max(2, Math.round(r.h / 58));
      for (let cx = 0; cx < cols; cx++) {
        for (let cy = 0; cy < rows; cy++) {
          const seed = GameEngine.hash(r.x + cx * 13, r.y + cy * 29);
          const px = r.x + ((cx + 0.5) / cols) * r.w;
          const py = r.y + ((cy + 0.5) / rows) * r.h;
          const drift = Math.sin(t * 0.6 + seed * 8) * 10;
          const rad = Math.min(r.w / cols, r.h / rows) * 0.72 * (0.75 + seed * 0.4);
          const heat = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.4 + seed * 12));
          const g = ctx.createRadialGradient(px + drift, py, 2, px + drift, py, rad);
          g.addColorStop(0, `rgba(${vein[0]},${0.75 * heat})`);
          g.addColorStop(0.45, `rgba(${vein[1]},${0.55 * heat})`);
          g.addColorStop(1, `rgba(${vein[2]},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(px + drift, py, rad, rad * 0.78, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // dark floating crust plates
      ctx.globalAlpha = p3(0.55, 0.45, 0.5, 0.5, 0.4, 0.5);
      for (let i = 0; i < Math.max(3, Math.round((r.w * r.h) / 26000)); i++) {
        const s1 = GameEngine.hash(r.x + i * 7, r.y + i * 3);
        const s2 = GameEngine.hash(r.y + i * 11, r.x + i * 5);
        const cxp = r.x + s1 * r.w + Math.sin(t * 0.35 + i) * 9;
        const cyp = r.y + s2 * r.h + Math.cos(t * 0.3 + i * 1.7) * 7;
        const w = 22 + s1 * 40;
        const h = 14 + s2 * 26;
        ctx.fillStyle = p3("#2a1710", "#cfe9f8", "#1c3a17", "#c9a568", "#20306e", "#1a1030");
        ctx.beginPath();
        ctx.ellipse(cxp, cyp, w, h, s1 * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // boiling bubbles — rise, swell and pop on a loop
      const bubbles = Math.max(4, Math.round((r.w * r.h) / 12000));
      for (let i = 0; i < bubbles; i++) {
        const s1 = GameEngine.hash(r.x * 0.5 + i * 17, r.y * 0.5 + i * 23);
        const s2 = GameEngine.hash(r.y * 0.7 + i * 31, r.x * 0.3 + i * 19);
        const period = 1.4 + s2 * 2.2;
        const phase = ((t + s1 * period) % period) / period;
        const bx = r.x + 12 + s1 * (r.w - 24);
        const by = r.y + 12 + ((s2 * (r.h - 24) - phase * 34 + r.h) % (r.h - 24));
        const swell = Math.sin(phase * Math.PI);
        const br = (5 + s1 * 9) * swell;
        if (br <= 0.4) continue;
        ctx.beginPath();
        ctx.fillStyle = p3(
          `rgba(255,226,140,${0.75 * swell})`,
          `rgba(225,248,255,${0.5 * swell})`,
          `rgba(214,255,150,${0.7 * swell})`,
          `rgba(255,236,180,${0.7 * swell})`,
          `rgba(210,235,255,${0.65 * swell})`,
          `rgba(220,200,255,${0.6 * swell})`,
        );
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.strokeStyle = p3(
          `rgba(255,120,20,${0.6 * swell})`,
          `rgba(255,255,255,${0.5 * swell})`,
          `rgba(140,240,70,${0.6 * swell})`,
          `rgba(240,180,60,${0.6 * swell})`,
          `rgba(120,190,255,${0.7 * swell})`,
          `rgba(160,110,255,${0.6 * swell})`,
        );
        ctx.lineWidth = 2;
        ctx.arc(bx, by, br * 1.25, 0, Math.PI * 2);
        ctx.stroke();
      }

      // steam wisps drifting off the surface
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = p3("#ffb987", "#dff3ff", "#cdf7a3", "#ffe0a8", "#cfe4ff", "#cbb4ff");
      for (let i = 0; i < 5; i++) {
        const s1 = GameEngine.hash(r.x + i * 41, r.y + i * 53);
        const sx = r.x + s1 * r.w + Math.sin(t * 0.8 + i * 2) * 18;
        const sy = r.y + r.h - ((t * 22 + s1 * 400) % (r.h + 40));
        ctx.beginPath();
        ctx.ellipse(sx, sy, 26 + s1 * 20, 12 + s1 * 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // glowing rim + cooled rock edge
      ctx.save();
      ctx.shadowColor = p3(
        "rgba(255,90,10,0.9)",
        "rgba(120,200,255,0.85)",
        "rgba(120,240,60,0.85)",
        "rgba(255,190,60,0.85)",
        "rgba(90,150,255,0.9)",
        "rgba(150,90,255,0.85)",
      );
      ctx.shadowBlur = 26 + 14 * (0.5 + 0.5 * Math.sin(t * 2 + r.x * 0.01));
      ctx.strokeStyle = p3(
        "rgba(255,150,40,.55)",
        "rgba(180,230,255,.55)",
        "rgba(160,245,90,.55)",
        "rgba(255,205,110,.55)",
        "rgba(140,190,255,.6)",
        "rgba(180,130,255,.55)",
      );
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4, 24);
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = p3(
        "rgba(38,22,16,.92)",
        "rgba(210,235,250,.85)",
        "rgba(20,44,20,.92)",
        "rgba(120,88,44,.9)",
        "rgba(30,44,110,.9)",
        "rgba(24,14,44,.92)",
      );
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 26);
      ctx.stroke();
    }
  }

  private drawEruptions(ctx: CanvasRenderingContext2D) {
    for (const er of this.eruptions) {
      if (er.warn > 0) {
        const t = 1 - er.warn / 1.4;
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.35 * Math.sin(this.time * 18);
        ctx.strokeStyle = "#ff3b1f";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(
          er.x,
          er.y,
          er.r * (0.6 + t * 0.4),
          er.r * 0.6 * (0.6 + t * 0.4),
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
        ctx.fillStyle = "rgba(255,60,20,.18)";
        ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
        ctx.globalAlpha = clamp(er.burst / 0.6, 0, 1);
        const g = ctx.createRadialGradient(er.x, er.y, 10, er.x, er.y, er.r);
        g.addColorStop(0, "#fff2b0");
        g.addColorStop(0.5, "#ff7a1a");
        g.addColorStop(1, "rgba(255,60,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(er.x, er.y, er.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  private drawRocks(ctx: CanvasRenderingContext2D) {
    // Basalt boulders; glacier stone in ice, mossy stone in the jungle
    const pal = this.tc(
      {
        top: "#8b93a1",
        mid: "#5f6774",
        low: "#3c424d",
        dark: "#22262e",
        speck: "rgba(210,220,235,.35)",
      },
      {
        top: "#c6d9e6",
        mid: "#8fa9bd",
        low: "#5c748a",
        dark: "#3a4d5f",
        speck: "rgba(255,255,255,.5)",
      },
      {
        top: "#8fa473",
        mid: "#5d7247",
        low: "#3a4a2c",
        dark: "#1f2a18",
        speck: "rgba(190,240,150,.45)",
      },
      {
        top: "#e0bd82",
        mid: "#b28a51",
        low: "#7c5c31",
        dark: "#4a361b",
        speck: "rgba(255,240,200,.45)",
      },
      {
        top: "#9aa6c9",
        mid: "#6a76a0",
        low: "#454e75",
        dark: "#252b47",
        speck: "rgba(180,225,255,.55)",
      },
      {
        top: "#6f6790",
        mid: "#4a4468",
        low: "#2e2a45",
        dark: "#171526",
        speck: "rgba(200,180,255,.45)",
      },
    );
    for (const r of this.area.rocks) {
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      ctx.save();

      // contact shadow
      ctx.fillStyle = "rgba(0,0,0,.42)";
      ctx.beginPath();
      ctx.ellipse(cx, r.y + r.h * 0.97, r.w * 0.58, r.h * 0.2, 0, 0, Math.PI * 2);
      ctx.filter = "blur(1px)";
      ctx.fill();
      ctx.filter = "none";

      // irregular boulder silhouette
      const pts: [number, number][] = [];
      const n = 11;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const wob = 0.78 + GameEngine.hash(r.x + i * 9.1, r.y + i * 4.3) * 0.34;
        pts.push([cx + Math.cos(a) * r.w * 0.5 * wob, cy + Math.sin(a) * r.h * 0.5 * wob]);
      }
      const path = new Path2D();
      path.moveTo(pts[0]![0], pts[0]![1]);
      for (let i = 1; i < pts.length; i++) path.lineTo(pts[i]![0], pts[i]![1]);
      path.closePath();

      const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w * 0.4, r.y + r.h);
      g.addColorStop(0, pal.top);
      g.addColorStop(0.45, pal.mid);
      g.addColorStop(1, pal.dark);
      ctx.fillStyle = g;
      ctx.fill(path);

      ctx.save();
      ctx.clip(path);
      // angular facets
      for (let i = 0; i < 5; i++) {
        const s1 = GameEngine.hash(r.x + i * 21, r.y + i * 13);
        const s2 = GameEngine.hash(r.y + i * 17, r.x + i * 7);
        ctx.fillStyle =
          i % 2 ? `rgba(255,255,255,${0.05 + s1 * 0.08})` : `rgba(0,0,0,${0.08 + s2 * 0.14})`;
        ctx.beginPath();
        ctx.moveTo(r.x + s1 * r.w, r.y + s2 * r.h);
        ctx.lineTo(r.x + (s2 + 0.3) * r.w, r.y + s1 * r.h * 0.6);
        ctx.lineTo(r.x + s1 * r.w * 1.2, r.y + r.h);
        ctx.closePath();
        ctx.fill();
      }
      // mineral speckle
      for (let i = 0; i < 60; i++) {
        const s1 = GameEngine.hash(r.x + i * 3.3, r.y + i * 5.9);
        const s2 = GameEngine.hash(r.y + i * 2.7, r.x + i * 8.1);
        ctx.fillStyle = s1 > 0.7 ? pal.speck : "rgba(0,0,0,.22)";
        ctx.fillRect(r.x + s1 * r.w, r.y + s2 * r.h, 1.5 + s1 * 2, 1.5 + s2 * 2);
      }
      // cracks
      ctx.strokeStyle = "rgba(0,0,0,.35)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const s1 = GameEngine.hash(r.x + i * 31, r.y + i * 19);
        ctx.beginPath();
        ctx.moveTo(r.x + s1 * r.w, r.y);
        ctx.lineTo(r.x + (s1 * 0.6 + 0.2) * r.w, cy);
        ctx.lineTo(r.x + (s1 * 0.9 + 0.05) * r.w, r.y + r.h);
        ctx.stroke();
      }
      // top-light highlight
      const hl = ctx.createLinearGradient(r.x, r.y, r.x, cy);
      hl.addColorStop(0, "rgba(255,255,255,.22)");
      hl.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hl;
      ctx.fillRect(r.x, r.y, r.w, r.h * 0.6);
      ctx.restore();

      // rim light from the world's light source
      ctx.strokeStyle = this.tc(
        "rgba(255,140,60,.35)",
        "rgba(190,235,255,.5)",
        "rgba(150,240,90,.45)",
        "rgba(255,215,130,.45)",
        "rgba(160,220,255,.55)",
        "rgba(190,170,255,.4)",
      );
      ctx.lineWidth = 2.5;
      ctx.stroke(path);
      ctx.restore();
    }
  }

  private drawCaveAndExit(ctx: CanvasRenderingContext2D) {
    const cave = this.area.cave;
    if (cave) {
      ctx.save();
      ctx.fillStyle = "#0b0709";
      ctx.beginPath();
      ctx.ellipse(cave.x, cave.y, 70, 52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this.caveFound ? "rgba(120,200,255,.5)" : "rgba(255,190,80,.75)";
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,220,140,.9)";
      ctx.font = "bold 20px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.fillText(this.caveFound ? "CAVE FOUND" : "?", cave.x, cave.y + 78);
      ctx.restore();
    }
    const ex = this.area.exit;
    ctx.save();
    const pulse = 0.6 + 0.4 * Math.sin(this.time * 3);
    ctx.globalAlpha = this.exitOpen ? 1 : 0.35;
    const g = ctx.createRadialGradient(ex.x, ex.y, 8, ex.x, ex.y, 90);
    g.addColorStop(0, this.exitOpen ? "#ffe9a8" : "#555");
    g.addColorStop(0.6, this.exitOpen ? `rgba(255,150,40,${pulse})` : "rgba(90,90,90,.4)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.exitOpen ? "#fff3cc" : "#8d8d8d";
    ctx.font = "bold 22px ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    ctx.fillText(this.exitOpen ? "GO →" : "LOCKED", ex.x, ex.y - 96);
    ctx.restore();
  }

  private drawPickups(ctx: CanvasRenderingContext2D) {
    for (const b of this.pickups) {
      if (b.taken) continue;
      const y = b.y + Math.sin(b.bob) * 4;
      ctx.save();
      ctx.translate(b.x, y);
      ctx.rotate(0.4);
      ctx.shadowColor = "rgba(255,240,200,.8)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#f4ead0";
      ctx.beginPath();
      ctx.roundRect(-14, -4, 28, 8, 4);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-16, -6, 6, 0, Math.PI * 2);
      ctx.arc(-16, 6, 6, 0, Math.PI * 2);
      ctx.arc(16, -6, 6, 0, Math.PI * 2);
      ctx.arc(16, 6, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawChest(ctx: CanvasRenderingContext2D) {
    const c = this.area.chest;
    if (!c) return;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.fillStyle = "rgba(0,0,0,.5)";
    ctx.beginPath();
    ctx.ellipse(0, 44, 60, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!this.chestOpen) {
      ctx.shadowColor = "rgba(255,200,80,.9)";
      ctx.shadowBlur = 24 + Math.sin(this.time * 4) * 10;
    }
    ctx.fillStyle = "#6b3d18";
    ctx.beginPath();
    ctx.roundRect(-56, -10, 112, 54, 8);
    ctx.fill();
    ctx.fillStyle = this.chestOpen ? "#3a2410" : "#8a4f20";
    ctx.beginPath();
    ctx.roundRect(-56, this.chestOpen ? -70 : -44, 112, 40, 10);
    ctx.fill();
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(-10, -14, 20, 26);
    if (this.chestOpen) {
      const gg = ctx.createRadialGradient(0, -10, 5, 0, -10, 90);
      gg.addColorStop(0, "rgba(255,240,180,.85)");
      gg.addColorStop(1, "rgba(255,200,80,0)");
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(0, -10, 90, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawSprite(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement | null,
    x: number,
    y: number,
    z: number,
    size: number,
    facing: number,
    flash = 0,
    frame?: { index: number; count: number },
  ) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.12, size * 0.26, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (!img || !img.complete || img.naturalWidth === 0) {
      ctx.save();
      ctx.fillStyle = "#c96";
      ctx.beginPath();
      ctx.arc(x, y - z, size * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    const h = size;
    const srcW = frame ? img.naturalWidth / frame.count : img.naturalWidth;
    const srcX = frame ? srcW * (frame.index % frame.count) : 0;
    const w = (srcW / img.naturalHeight) * size;
    ctx.save();
    ctx.translate(x, y - z);
    ctx.scale(facing >= 0 ? 1 : -1, 1);
    if (frame) ctx.drawImage(img, srcX, 0, srcW, img.naturalHeight, -w / 2, -h * 0.86, w, h);
    else ctx.drawImage(img, -w / 2, -h * 0.86, w, h);
    if (flash > 0) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.globalAlpha = Math.min(0.85, flash * 4);
      ctx.fillStyle = "#fff";
      ctx.fillRect(-w / 2, -h * 0.86, w, h);
    }
    ctx.restore();
  }

  private drawEnemies(ctx: CanvasRenderingContext2D) {
    const sorted = [...this.enemies].sort((a, b) => a.y - b.y);
    for (const e of sorted) {
      const sheetReady = !!e.runSheet && e.runSheet.complete && e.runSheet.naturalWidth > 0;
      const bob = Math.abs(Math.sin(e.runPhase * Math.PI * 2)) * (e.flying ? 6 : e.size * 0.03);
      if (sheetReady) {
        const index = Math.floor(e.runPhase * e.runFrames) % e.runFrames;
        this.drawSprite(ctx, e.runSheet, e.x, e.y, e.z + bob, e.size, e.facing, e.hitFlash, {
          index,
          count: e.runFrames,
        });
      } else {
        this.drawSprite(ctx, e.sprite, e.x, e.y, e.z + bob, e.size, e.facing, e.hitFlash);
      }
      // health bar
      const w = Math.max(60, e.size * 0.6);
      const bx = e.x - w / 2;
      const by = e.y - e.size * 0.92 - e.z - 14;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.6)";
      ctx.beginPath();
      ctx.roundRect(bx - 2, by - 2, w + 4, 12, 6);
      ctx.fill();
      ctx.fillStyle = e.boss ? "#ff3b30" : "#ff7a45";
      ctx.beginPath();
      ctx.roundRect(bx, by, w * clamp(e.hp / e.maxHp, 0, 1), 8, 4);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawPet(ctx: CanvasRenderingContext2D) {
    if (!this.petId) return;
    const pet = getPet(this.petId);
    if (!pet) return;
    const key = petSpriteKey(this.petId);
    const sheet = this.images[`${key}__run`] ?? null;
    const frames = RUN_SHEETS[key]?.frames ?? 4;
    const ready = !!sheet && sheet.complete && sheet.naturalWidth > 0;
    const bob = Math.abs(Math.sin(this.petPhase * Math.PI * 2)) * 4;
    if (ready) {
      const index = Math.floor(this.petPhase * frames) % frames;
      this.drawSprite(ctx, sheet, this.petX, this.petY, bob, 78, this.petFacing, 0, {
        index,
        count: frames,
      });
    } else {
      this.drawSprite(ctx, this.images[key] ?? null, this.petX, this.petY, bob, 78, this.petFacing);
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const flick = this.invuln > 0 && Math.floor(this.time * 20) % 2 === 0;
    const runSheet = this.images["playerRun"] ?? null;
    const sheetReady = !!runSheet && runSheet.complete && runSheet.naturalWidth > 0;
    const running = this.pz <= 0 && this.runSpeed > 30;
    const airborne = this.pz > 0;
    const bob = running
      ? Math.abs(Math.sin(this.runPhase * Math.PI * 2)) * 5
      : Math.sin(this.time * 2.4) * 2;
    ctx.save();
    if (flick) ctx.globalAlpha = 0.45;
    if (sheetReady && (running || airborne)) {
      const index = airborne ? 2 : Math.floor(this.runPhase * this.runFrames) % this.runFrames;
      this.drawSprite(ctx, runSheet, this.px, this.py, this.pz + bob, 118, this.facing, 0, {
        index,
        count: this.runFrames,
      });
    } else {
      this.drawSprite(
        ctx,
        this.images["player"] ?? null,
        this.px,
        this.py,
        this.pz + bob,
        118,
        this.facing,
      );
    }
    ctx.restore();

    if (this.attackAnim > 0) {
      const w = getWeapon(this.weaponId);
      const ang = Math.atan2(this.aimY, this.aimX);
      const t = 1 - this.attackAnim / 0.22;
      ctx.save();
      ctx.translate(this.px, this.py - this.pz - 20);
      ctx.rotate(ang - w.arc / 2 + w.arc * t);
      ctx.globalAlpha = 0.9 - t * 0.5;
      const g = ctx.createLinearGradient(0, 0, w.range, 0);
      g.addColorStop(0, "rgba(255,255,255,.1)");
      g.addColorStop(1, w.color);
      ctx.strokeStyle = g;
      ctx.lineWidth = 16;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, w.range * 0.75, -0.5, 0.5);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D) {
    for (const p of this.projectiles) {
      ctx.save();
      const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.r * 2.2);
      if (p.theme === "poison") {
        g.addColorStop(0, "#f2ffd8");
        g.addColorStop(0.4, "#7ee23c");
        g.addColorStop(1, "rgba(30,140,40,0)");
      } else if (p.theme === "ice") {
        g.addColorStop(0, "#f2fdff");
        g.addColorStop(0.4, "#63cbff");
        g.addColorStop(1, "rgba(20,120,220,0)");
      } else if (p.theme === "desert") {
        g.addColorStop(0, "#fff3cf");
        g.addColorStop(0.4, "#e2ab48");
        g.addColorStop(1, "rgba(150,100,20,0)");
      } else if (p.theme === "electric") {
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.4, "#7fd0ff");
        g.addColorStop(1, "rgba(40,80,255,0)");
      } else if (p.theme === "shadow") {
        g.addColorStop(0, "#efe4ff");
        g.addColorStop(0.4, "#9b5cff");
        g.addColorStop(1, "rgba(50,10,110,0)");
      } else {
        g.addColorStop(0, "#fff6c9");
        g.addColorStop(0.4, "#ffa42b");
        g.addColorStop(1, "rgba(255,60,0,0)");
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2.2, 0, Math.PI * 2);
      ctx.fill();
      if (p.theme === "ice") {
        // frost shard
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.fillStyle = "#dff6ff";
        ctx.beginPath();
        ctx.moveTo(p.r * 1.4, 0);
        ctx.lineTo(-p.r * 0.6, p.r * 0.55);
        ctx.lineTo(-p.r * 0.2, 0);
        ctx.lineTo(-p.r * 0.6, -p.r * 0.55);
        ctx.closePath();
        ctx.fill();
      } else if (p.theme === "poison") {
        // thorny vine dart
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.fillStyle = "#d8ffa8";
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r * 1.25, p.r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#3f8f2a";
        ctx.beginPath();
        ctx.moveTo(p.r * 1.5, 0);
        ctx.lineTo(0, p.r * 0.5);
        ctx.lineTo(0, -p.r * 0.5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawNumbers(ctx: CanvasRenderingContext2D) {
    for (const n of this.numbers) {
      ctx.save();
      ctx.globalAlpha = clamp(n.life / 0.9, 0, 1);
      ctx.font = `bold ${n.crit ? 30 : 24}px ui-sans-serif, system-ui`;
      ctx.textAlign = "center";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(0,0,0,.8)";
      ctx.strokeText(String(n.value), n.x, n.y);
      ctx.fillStyle = n.crit ? "#ffd166" : "#ffffff";
      ctx.fillText(String(n.value), n.x, n.y);
      ctx.restore();
    }
  }
}

export { AREAS };
