import { AREAS, type AreaDef, type EnemyType, type Rect } from "./areas";
import { PETS, SPRITES, WEAPONS, getCharacter, getPet, getWeapon } from "./content";
import { playSfx } from "./audio";

export interface HudState {
  hp: number;
  maxHp: number;
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
}

export type GameEvent =
  | { type: "death" }
  | { type: "bossDefeated"; id: EnemyType }
  | { type: "chestOpened" }
  | { type: "caveFound"; cardId: string }
  | { type: "areaExit"; areaIndex: number }
  | { type: "bonesChanged"; bones: number }
  | { type: "banner"; text: string };

interface EngineOpts {
  canvas: HTMLCanvasElement;
  characterId: string;
  weaponId: string;
  petId: string | null;
  areaIndex: number;
  bones: number;
  openedChest: boolean;
  foundCaves: Record<string, boolean>;
  onHud: (h: HudState) => void;
  onEvent: (e: GameEvent) => void;
}

interface Vec {
  x: number;
  y: number;
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
  }
> = {
  pterodactyl: { hp: 50, speed: 95, radius: 34, size: 110, contact: 8, boss: false, name: "Pterodactyl", sprite: "pterodactyl", bones: 4, flying: true },
  fireling: { hp: 65, speed: 125, radius: 28, size: 92, contact: 10, boss: false, name: "Fire Hatchling", sprite: "mini_fire_raptor", bones: 5 },
  mini_fire_raptor: { hp: 320, speed: 160, radius: 44, size: 165, contact: 14, boss: true, name: "MINI FIRE RAPTOR", sprite: "mini_fire_raptor", bones: 25 },
  fire_utahraptor: { hp: 620, speed: 185, radius: 55, size: 215, contact: 18, boss: true, name: "FIRE UTAHRAPTOR", sprite: "fire_utahraptor", bones: 40 },
  firesauras: { hp: 1500, speed: 115, radius: 95, size: 380, contact: 22, boss: true, name: "FIRESAURAS", sprite: "firesauras", bones: 100 },
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
  private opts: EngineOpts;

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
  private petCd = 0;
  private dead = false;
  private speedMul = 1;
  private lootBonus = 0;

  private weaponId: string;
  private petId: string | null;

  // pet
  private petX = 0;
  private petY = 0;

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
    this.areaIndex = opts.areaIndex;
    this.weaponId = opts.weaponId;
    this.petId = opts.petId;
    this.bones = opts.bones;
    const ch = getCharacter(opts.characterId);
    this.speedMul = ch.speed;
    this.lootBonus = ch.lootBonus;
    this.preload(opts.characterId);
    this.loadArea(this.areaIndex);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  private preload(characterId: string) {
    (Object.keys(SPRITES) as (keyof typeof SPRITES)[]).forEach((k) => {
      const img = new Image();
      img.src = SPRITES[k];
      this.images[k] = img;
    });
    this.images["player"] = this.images[characterId] ?? this.images["rocket_boy"];
  }

  setCharacterSprite(characterId: string) {
    this.images["player"] = this.images[characterId] ?? this.images["rocket_boy"];
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

  setInput(v: Vec) {
    this.input = v;
  }

  loadArea(index: number) {
    this.areaIndex = clamp(index, 0, AREAS.length - 1);
    const area = AREAS[this.areaIndex] as AreaDef;
    this.area = area;
    this.px = area.spawn.x;
    this.py = area.spawn.y;
    this.pz = 0;
    this.pvz = 0;
    this.petX = this.px - 50;
    this.petY = this.py + 30;
    this.hp = this.maxHp;
    this.dead = false;
    this.invuln = 1;
    this.attackCd = 0;
    this.petCd = 0;
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
    if (area.id === "treasure_room" && this.opts.openedChest) {
      this.chestOpen = true;
      this.exitOpen = true;
    }
    this.eruptTimer = area.eruptions ? area.eruptions * 0.6 : 0;
    this.pickups = area.bones.map((b) => ({ x: b.x, y: b.y, taken: false, bob: Math.random() * 6 }));
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

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = true;
    const k = e.key.toLowerCase();
    if (k === " ") {
      e.preventDefault();
      this.jump();
    }
    if (k === "j") this.attack();
    if (k === "k") this.petAttack();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
  };

  banner(text: string) {
    this.bannerText = text;
    this.bannerTime = 2.2;
  }

  // ---------------- actions ----------------
  attack() {
    if (this.dead || this.paused || this.attackCd > 0) return;
    const w = getWeapon(this.weaponId);
    this.attackCd = w.cooldown;
    this.attackAnim = 0.22;
    playSfx("attack");
    // Kid-friendly auto-aim: if an enemy is in reach, swing at the closest one.
    const assist = this.nearestEnemy(this.px, this.py);
    if (assist && dist(this.px, this.py, assist.x, assist.y) < w.range + assist.radius + 40) {
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
      this.damageEnemy(e, w.damage + Math.floor(Math.random() * 4));
      hitAny = true;
    }
    // chest can be "hit" open too
    if (this.area.chest && !this.chestOpen) {
      if (dist(this.px, this.py, this.area.chest.x, this.area.chest.y) < w.range + 40) this.openChest();
    }
    if (hitAny) playSfx("hit");
  }

  jump() {
    if (this.dead || this.paused) return;
    if (this.pz > 0) return;
    this.pvz = 420;
    playSfx("jump");
  }

  petAttack() {
    if (this.dead || this.paused || !this.petId || this.petCd > 0) return;
    const pet = getPet(this.petId);
    if (!pet) return;
    const target = this.nearestEnemy(this.petX, this.petY);
    if (!target) return;
    this.petCd = pet.cooldown;
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
        color: "#ff8a2b",
        size: 8,
      });
    }
    this.petX = target.x - 40;
    this.petY = target.y + 20;
    this.damageEnemy(target, pet.damage + Math.floor(Math.random() * 6));
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
        color: i % 2 ? "#ffd166" : "#ff5b2e",
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
        color: i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#ff9e2c" : "#ff3d2e",
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

  getDebug() {
    return {
      x: Math.round(this.px),
      y: Math.round(this.py),
      hp: Math.round(this.hp),
      area: this.areaIndex,
      exitOpen: this.exitOpen,
      exit: this.area.exit,
      dead: this.dead,
      enemies: this.enemies.map((e) => ({ type: e.type, hp: Math.round(e.hp), x: Math.round(e.x), y: Math.round(e.y) })),
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
    });
  }

  private spawnWave() {
    const wave = this.area.waves[this.waveIndex];
    if (!wave) return;
    for (const s of wave) {
      const st = ENEMY_STATS[s.type]!;
      this.enemies.push({
        type: s.type,
        x: s.x,
        y: s.y,
        z: st.flying ? 70 : 0,
        vx: 0,
        vy: 0,
        hp: st.hp,
        maxHp: st.hp,
        radius: st.radius,
        size: st.size,
        speed: st.speed,
        contactDamage: st.contact,
        boss: st.boss,
        name: st.name,
        sprite: this.images[st.sprite] ?? null,
        shootTimer: 1 + Math.random() * 2,
        hitFlash: 0,
        contactCd: 0,
        facing: -1,
        enraged: false,
        dashTimer: 2,
        bones: st.bones,
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
    if (this.keys["a"] || this.keys["arrowleft"]) ix -= 1;
    if (this.keys["d"] || this.keys["arrowright"]) ix += 1;
    if (this.keys["w"] || this.keys["arrowup"]) iy -= 1;
    if (this.keys["s"] || this.keys["arrowdown"]) iy += 1;
    const mag = Math.hypot(ix, iy);
    if (mag > 1) {
      ix /= mag;
      iy /= mag;
    }

    // ---- player movement
    const inLava = this.pz < 26 && this.pointInLava(this.px, this.py);
    const base = 250 * this.speedMul * (inLava ? 0.6 : 1);
    const nx = this.px + ix * base * dt;
    const ny = this.py + iy * base * dt;
    this.px = clamp(nx, 30, area.w - 30);
    this.py = clamp(ny, 30, area.h - 30);
    if (this.pz <= 0) this.resolveRocks();
    this.px = clamp(this.px, 30, area.w - 30);
    this.py = clamp(this.py, 30, area.h - 30);

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
          color: "#ff7b28",
          size: 7,
        });
    }

    this.attackCd = Math.max(0, this.attackCd - dt);
    this.attackAnim = Math.max(0, this.attackAnim - dt);
    this.petCd = Math.max(0, this.petCd - dt);
    this.invuln = Math.max(0, this.invuln - dt);

    // ---- pet follow
    if (this.petId) {
      const tx = this.px - this.facing * 62;
      const ty = this.py + 34;
      this.petX += (tx - this.petX) * Math.min(1, dt * 4);
      this.petY += (ty - this.petY) * Math.min(1, dt * 4);
    }

    // ---- enemies
    for (const e of this.enemies) {
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.contactCd = Math.max(0, e.contactCd - dt);
      const d = dist(e.x, e.y, this.px, this.py);
      const ang = Math.atan2(this.py - e.y, this.px - e.x);
      e.facing = this.px > e.x ? 1 : -1;

      if (e.type === "firesauras" && !e.enraged && e.hp < e.maxHp * 0.5) {
        e.enraged = true;
        e.speed = 175;
        this.banner("FIRESAURAS IS ENRAGED!");
        playSfx("boss");
      }

      if (e.type === "pterodactyl") {
        const want = 240;
        const dir = d > want + 40 ? 1 : d < want - 40 ? -1 : 0;
        e.x += Math.cos(ang) * e.speed * dir * dt;
        e.y += Math.sin(ang) * e.speed * dir * dt + Math.sin(this.time * 2 + e.x) * 12 * dt;
        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
          e.shootTimer = 2.2;
          this.shoot(e.x, e.y, ang, 260, 9);
        }
      } else if (e.type === "firesauras") {
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
        if (e.type === "fire_utahraptor") {
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
        if (e.type === "mini_fire_raptor") {
          e.shootTimer -= dt;
          if (e.shootTimer <= 0) {
            e.shootTimer = 3.6;
            for (let i = -1; i <= 1; i++) this.shoot(e.x, e.y, ang + i * 0.25, 280, 10);
          }
        }
      }

      e.x = clamp(e.x, 40, area.w - 40);
      e.y = clamp(e.y, 40, area.h - 40);

      // contact damage
      if (d < e.radius + 22 && e.contactCd <= 0 && (e.type !== "pterodactyl" ? true : this.pz < 40)) {
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
          color: "#ff9d2e",
          size: p.r * 1.2,
        });
      if (!p.fromPlayer && this.pz < 34 && dist(p.x, p.y, this.px, this.py) < p.r + 20) {
        p.life = 0;
        this.hurtPlayer(p.dmg);
      }
    }
    this.projectiles = this.projectiles.filter(
      (p) => p.life > 0 && p.x > -50 && p.y > -50 && p.x < area.w + 50 && p.y < area.h + 50,
    );

    // ---- pickups
    for (const b of this.pickups) {
      if (b.taken) continue;
      b.bob += dt * 4;
      if (dist(b.x, b.y, this.px, this.py) < 46) {
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
    this.eruptions = this.eruptions.filter((e) => !e.done);

    // ---- cave discovery
    if (area.cave && !this.caveFound && dist(this.px, this.py, area.cave.x, area.cave.y) < 70) {
      this.caveFound = true;
      playSfx("card");
      this.opts.onEvent({ type: "caveFound", cardId: area.cave.cardId });
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
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const n of this.numbers) {
      n.y -= 45 * dt;
      n.life -= dt;
    }
    this.numbers = this.numbers.filter((n) => n.life > 0);
  }

  private shoot(x: number, y: number, ang: number, speed: number, dmg: number) {
    this.projectiles.push({
      x,
      y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      r: 13,
      dmg,
      life: 4,
      fromPlayer: false,
    });
  }

  private hurtPlayer(dmg: number, continuous = false) {
    if (this.dead) return;
    if (!continuous && this.invuln > 0) return;
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
    c.fillStyle = this.area.cave_dark ? "#1b1013" : "#241a18";
    c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 220; i++) {
      const v = Math.random();
      c.fillStyle =
        v > 0.94 ? "rgba(255,120,40,0.22)" : v > 0.6 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.25)";
      c.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 4, 1 + Math.random() * 4);
    }
    return this.ctx.createPattern(t, "repeat");
  }

  private render() {
    const ctx = this.ctx;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = this.canvas.clientWidth;
    const chh = this.canvas.clientHeight;
    if (this.canvas.width !== Math.floor(cw * dpr) || this.canvas.height !== Math.floor(chh * dpr)) {
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
    g.addColorStop(0, "rgba(255,90,20,0.10)");
    g.addColorStop(1, "rgba(0,0,0,0.45)");
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

  private drawLava(ctx: CanvasRenderingContext2D) {
    for (const r of this.area.lava) {
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 2 + r.x * 0.01);
      ctx.save();
      ctx.shadowColor = "rgba(255,90,10,0.9)";
      ctx.shadowBlur = 30 + pulse * 20;
      const lg = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      lg.addColorStop(0, "#ff6a00");
      lg.addColorStop(0.5, `rgba(255,${170 + pulse * 50},40,1)`);
      lg.addColorStop(1, "#e03b00");
      ctx.fillStyle = lg;
      ctx.beginPath();
      const rad = 26;
      ctx.roundRect(r.x, r.y, r.w, r.h, rad);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "rgba(40,20,15,.9)";
      ctx.lineWidth = 6;
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
        ctx.ellipse(er.x, er.y, er.r * (0.6 + t * 0.4), er.r * 0.6 * (0.6 + t * 0.4), 0, 0, Math.PI * 2);
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
    for (const r of this.area.rocks) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.45)";
      ctx.beginPath();
      ctx.ellipse(r.x + r.w / 2, r.y + r.h * 0.95, r.w * 0.6, r.h * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      const g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      g.addColorStop(0, "#4a4046");
      g.addColorStop(1, "#191418");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y + r.h);
      ctx.lineTo(r.x + r.w * 0.18, r.y + r.h * 0.2);
      ctx.lineTo(r.x + r.w * 0.55, r.y);
      ctx.lineTo(r.x + r.w, r.y + r.h * 0.35);
      ctx.lineTo(r.x + r.w * 0.85, r.y + r.h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,120,40,.25)";
      ctx.lineWidth = 3;
      ctx.stroke();
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
    const w = (img.naturalWidth / img.naturalHeight) * size;
    ctx.save();
    ctx.translate(x, y - z);
    ctx.scale(facing >= 0 ? 1 : -1, 1);
    ctx.drawImage(img, -w / 2, -h * 0.86, w, h);
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
      this.drawSprite(ctx, e.sprite, e.x, e.y, e.z, e.size, e.facing, e.hitFlash);
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
      ctx.roundRect(bx, by, (w * clamp(e.hp / e.maxHp, 0, 1)), 8, 4);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawPet(ctx: CanvasRenderingContext2D) {
    if (!this.petId) return;
    const pet = getPet(this.petId);
    if (!pet) return;
    const img = this.images[this.petId] ?? null;
    this.drawSprite(ctx, img, this.petX, this.petY, 0, 78, this.facing);
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const flick = this.invuln > 0 && Math.floor(this.time * 20) % 2 === 0;
    ctx.save();
    if (flick) ctx.globalAlpha = 0.45;
    this.drawSprite(ctx, this.images["player"] ?? null, this.px, this.py, this.pz, 118, this.facing);
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
      g.addColorStop(0, "#fff6c9");
      g.addColorStop(0.4, "#ffa42b");
      g.addColorStop(1, "rgba(255,60,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2.2, 0, Math.PI * 2);
      ctx.fill();
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