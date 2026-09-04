/**
 * Declarative boss behaviour.
 *
 * Every world boss gets a plan: how it positions itself, which signature moves
 * it owns, how long it telegraphs each move, and what changes when it enrages.
 * The engine only knows how to *execute* these move kinds — it never hard-codes
 * a boss name, so all six bosses go through exactly the same code path.
 */

export type BossMoveKind =
  /** Fan of projectiles aimed at the player. */
  | "spread"
  /** Several quick shots in a row with a slight wobble. */
  | "volley"
  /** Ring of projectiles in every direction. */
  | "burst"
  /** Heavy ground slam that shakes the arena at the player's feet. */
  | "slam"
  /** Single huge, fast projectile. */
  | "bolt"
  /** Vanish and reappear beside the player. */
  | "teleport"
  /** Sprint straight at the player. */
  | "charge";

export interface BossMove {
  kind: BossMoveKind;
  /** Seconds between uses (scaled down when enraged). */
  cooldown: number;
  /** Wind-up in seconds before the move fires. Bigger = easier to read. */
  telegraph: number;
  /** Damage per hit. */
  damage: number;
  /** Projectile speed, where it applies. */
  speed?: number;
  /** Projectile count for spread / volley / burst. */
  count?: number;
  /** Fan width in radians for spread. */
  spread?: number;
  /** Blast radius for slam. */
  radius?: number;
  /** Only usable once the boss drops below half health. */
  enrageOnly?: boolean;
  /** Only usable when the player is at least this far away. */
  minRange?: number;
  /** Only usable when the player is within this range. */
  maxRange?: number;
  /** Short on-screen warning so the wind-up is unmistakable. */
  shout?: string;
}

export interface BossPlan {
  /** melee = close the gap, ranged = hold a line, kite = back away when crowded. */
  approach: "melee" | "ranged" | "kite";
  /** Distance the boss tries to hold. */
  preferredRange: number;
  /** Sideways drift so the fight never becomes a straight line. */
  strafe: number;
  moves: BossMove[];
  /** Cooldown multiplier once below half health. */
  enrageRate: number;
}

export const BOSS_PLANS: Record<string, BossPlan> = {
  // ---- World 1: charges in, spits fire, stomps
  firesauras: {
    approach: "melee",
    preferredRange: 150,
    strafe: 0.2,
    enrageRate: 0.6,
    moves: [
      { kind: "spread", cooldown: 3, telegraph: 0.5, damage: 12, speed: 300, count: 3, spread: 0.3 },
      {
        kind: "slam",
        cooldown: 7,
        telegraph: 1.1,
        damage: 26,
        radius: 165,
        shout: "STOMP!",
      },
      { kind: "charge", cooldown: 9, telegraph: 0.8, damage: 22, minRange: 220, shout: "CHARGE!" },
      { kind: "burst", cooldown: 8, telegraph: 0.9, damage: 14, speed: 250, count: 10, enrageOnly: true },
    ],
  },
  // ---- World 2: hangs back behind walls of ice
  glacierus: {
    approach: "ranged",
    preferredRange: 260,
    strafe: 0.35,
    enrageRate: 0.6,
    moves: [
      { kind: "volley", cooldown: 3.2, telegraph: 0.5, damage: 13, speed: 320, count: 4 },
      { kind: "burst", cooldown: 7, telegraph: 1, damage: 15, speed: 260, count: 12, shout: "ICE BURST!" },
      { kind: "slam", cooldown: 9, telegraph: 1.2, damage: 28, radius: 170, shout: "GLACIER SLAM!" },
      { kind: "bolt", cooldown: 6, telegraph: 0.8, damage: 30, speed: 520, enrageOnly: true, shout: "ICE SPEAR!" },
    ],
  },
  // ---- World 3: creeps in and floods the floor with venom
  venomus: {
    approach: "melee",
    preferredRange: 180,
    strafe: 0.3,
    enrageRate: 0.55,
    moves: [
      { kind: "spread", cooldown: 2.8, telegraph: 0.5, damage: 15, speed: 300, count: 5, spread: 0.5 },
      { kind: "slam", cooldown: 7.5, telegraph: 1.1, damage: 30, radius: 180, shout: "VENOM SLAM!" },
      { kind: "burst", cooldown: 8, telegraph: 1, damage: 16, speed: 250, count: 12, shout: "SPORE BURST!" },
      { kind: "charge", cooldown: 10, telegraph: 0.8, damage: 26, minRange: 240, enrageOnly: true, shout: "CHARGE!" },
    ],
  },
  // ---- World 4: walks the player down, then flattens the ground
  dunecrusher: {
    approach: "melee",
    preferredRange: 165,
    strafe: 0.25,
    enrageRate: 0.55,
    moves: [
      {
        kind: "spread",
        cooldown: 2.6,
        telegraph: 0.55,
        damage: 17,
        speed: 320,
        count: 5,
        spread: 0.45,
        shout: "SAND BLAST!",
      },
      { kind: "volley", cooldown: 4.5, telegraph: 0.5, damage: 15, speed: 340, count: 4, minRange: 200 },
      {
        kind: "slam",
        cooldown: 6.5,
        telegraph: 1.2,
        damage: 34,
        radius: 200,
        shout: "GROUND POUND!",
      },
      { kind: "charge", cooldown: 9, telegraph: 0.85, damage: 28, minRange: 240, shout: "CHARGE!" },
      { kind: "burst", cooldown: 7, telegraph: 0.9, damage: 18, speed: 270, count: 14, enrageOnly: true, shout: "SANDSTORM!" },
    ],
  },
  // ---- World 5: refuses to get close, all lightning
  voltasaurus: {
    approach: "kite",
    preferredRange: 300,
    strafe: 0.45,
    enrageRate: 0.5,
    moves: [
      { kind: "bolt", cooldown: 2.6, telegraph: 0.45, damage: 20, speed: 560 },
      {
        kind: "volley",
        cooldown: 4.5,
        telegraph: 0.55,
        damage: 16,
        speed: 380,
        count: 6,
        shout: "CHAIN LIGHTNING!",
      },
      {
        kind: "slam",
        cooldown: 7,
        telegraph: 1.25,
        damage: 36,
        radius: 190,
        shout: "THUNDERSTRIKE!",
      },
      { kind: "burst", cooldown: 8, telegraph: 0.9, damage: 19, speed: 300, count: 14, shout: "STORM RING!" },
      { kind: "bolt", cooldown: 3.2, telegraph: 0.35, damage: 26, speed: 640, enrageOnly: true },
    ],
  },
  // ---- World 6: blinks around the arena and hits from the dark
  eclipsaurus: {
    approach: "ranged",
    preferredRange: 240,
    strafe: 0.5,
    enrageRate: 0.5,
    moves: [
      { kind: "spread", cooldown: 2.4, telegraph: 0.45, damage: 22, speed: 340, count: 5, spread: 0.4 },
      { kind: "burst", cooldown: 6, telegraph: 0.9, damage: 24, speed: 300, count: 16, shout: "SHADOW BURST!" },
      { kind: "teleport", cooldown: 6.5, telegraph: 0.6, damage: 0, shout: "VANISHING!" },
      { kind: "slam", cooldown: 8, telegraph: 1.2, damage: 40, radius: 200, shout: "ECLIPSE SLAM!" },
      {
        kind: "volley",
        cooldown: 3.4,
        telegraph: 0.4,
        damage: 24,
        speed: 420,
        count: 6,
        enrageOnly: true,
        shout: "NIGHTFALL!",
      },
    ],
  },
};

export function bossPlan(type: string): BossPlan | null {
  return BOSS_PLANS[type] ?? null;
}
