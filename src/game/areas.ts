export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type EnemyType =
  | "pterodactyl"
  | "fireling"
  | "mini_fire_raptor"
  | "fire_utahraptor"
  | "firesauras"
  | "frost_pterodactyl"
  | "snowling"
  | "mini_frost_raptor"
  | "frozen_utahraptor"
  | "glacierus"
  | "vine_pterodactyl"
  | "sporeling"
  | "mini_toxic_raptor"
  | "toxic_utahraptor"
  | "venomus"
  | "sand_pterodactyl"
  | "sandling"
  | "mini_sand_raptor"
  | "sand_utahraptor"
  | "dunecrusher"
  | "storm_pterodactyl"
  | "sparkling"
  | "mini_storm_raptor"
  | "storm_utahraptor"
  | "voltasaurus"
  | "shadow_pterodactyl"
  | "shadowling"
  | "mini_shadow_raptor"
  | "shadow_utahraptor"
  | "eclipsaurus";

export interface SpawnDef {
  type: EnemyType;
  x: number;
  y: number;
}

export interface AreaDef {
  id: string;
  name: string;
  subtitle: string;
  w: number;
  h: number;
  spawn: { x: number; y: number };
  lava: Rect[];
  rocks: Rect[];
  bones: { x: number; y: number }[];
  waves: SpawnDef[][];
  exit: { x: number; y: number };
  chest?: { x: number; y: number };
  cave?: { x: number; y: number; cardId: string };
  eruptions: number; // seconds between eruptions, 0 = none
  cave_dark?: boolean;
  /** Visual theme for ground, hazard pools and rocks. */
  theme?: "fire" | "ice" | "poison" | "desert" | "electric" | "shadow";
  /** Clearing this area stores a respawn checkpoint. */
  checkpoint?: boolean;
}

const bonesLine = (n: number, x: number, y: number, dx: number, dy: number) =>
  Array.from({ length: n }, (_, i) => ({ x: x + dx * i, y: y + dy * i }));

export const AREAS: AreaDef[] = [
  {
    id: "lava_fields",
    name: "LAVA FIELDS",
    subtitle: "Area 1 of 7",
    w: 2200,
    h: 1500,
    spawn: { x: 220, y: 750 },
    lava: [
      { x: 620, y: 200, w: 260, h: 200 },
      { x: 900, y: 900, w: 420, h: 170 },
      { x: 1500, y: 320, w: 200, h: 480 },
    ],
    rocks: [
      { x: 500, y: 620, w: 120, h: 120 },
      { x: 1250, y: 480, w: 150, h: 110 },
      { x: 1750, y: 950, w: 180, h: 140 },
    ],
    bones: [
      ...bonesLine(4, 480, 900, 90, 40),
      ...bonesLine(3, 1150, 250, 80, 60),
      { x: 1900, y: 500 },
      { x: 1000, y: 1250 },
    ],
    waves: [
      [
        { type: "pterodactyl", x: 700, y: 700 },
        { type: "pterodactyl", x: 1150, y: 1000 },
        { type: "fireling", x: 1400, y: 700 },
      ],
      [
        { type: "pterodactyl", x: 1700, y: 500 },
        { type: "pterodactyl", x: 1800, y: 1100 },
        { type: "fireling", x: 1500, y: 1200 },
      ],
    ],
    exit: { x: 2060, y: 750 },
    eruptions: 9,
  },
  {
    id: "caverns",
    name: "VOLCANIC CAVERNS",
    subtitle: "Area 2 of 7",
    w: 2000,
    h: 1400,
    spawn: { x: 200, y: 700 },
    lava: [
      { x: 560, y: 0, w: 160, h: 520 },
      { x: 560, y: 700, w: 160, h: 700 },
      { x: 1200, y: 400, w: 500, h: 140 },
    ],
    rocks: [
      { x: 900, y: 200, w: 200, h: 160 },
      { x: 900, y: 1000, w: 260, h: 160 },
      { x: 1500, y: 800, w: 160, h: 260 },
    ],
    bones: [...bonesLine(5, 800, 620, 70, 30), { x: 1750, y: 250 }, { x: 1300, y: 1200 }],
    waves: [
      [
        { type: "fireling", x: 900, y: 700 },
        { type: "fireling", x: 1100, y: 900 },
        { type: "pterodactyl", x: 1300, y: 700 },
      ],
      [
        { type: "pterodactyl", x: 1600, y: 400 },
        { type: "fireling", x: 1700, y: 1000 },
        { type: "fireling", x: 1400, y: 1150 },
      ],
    ],
    cave: { x: 1850, y: 1250, cardId: "card_ember_pterodactyl" },
    exit: { x: 1880, y: 700 },
    eruptions: 11,
    cave_dark: true,
  },
  {
    id: "bone_fields",
    name: "DINOSAUR BONE FIELDS",
    subtitle: "Area 3 of 7",
    w: 2100,
    h: 1500,
    spawn: { x: 220, y: 760 },
    lava: [
      { x: 800, y: 250, w: 300, h: 150 },
      { x: 1300, y: 950, w: 380, h: 160 },
    ],
    rocks: [
      { x: 600, y: 900, w: 160, h: 130 },
      { x: 1500, y: 400, w: 200, h: 130 },
    ],
    bones: [
      ...bonesLine(6, 500, 500, 110, 60),
      ...bonesLine(6, 700, 1150, 120, -30),
      ...bonesLine(4, 1600, 700, 90, 70),
    ],
    waves: [
      [
        { type: "pterodactyl", x: 800, y: 800 },
        { type: "pterodactyl", x: 1200, y: 500 },
        { type: "fireling", x: 1000, y: 1100 },
        { type: "fireling", x: 1400, y: 700 },
      ],
      [
        { type: "pterodactyl", x: 1700, y: 1150 },
        { type: "fireling", x: 1800, y: 500 },
        { type: "fireling", x: 1600, y: 900 },
      ],
    ],
    exit: { x: 1980, y: 760 },
    eruptions: 8,
  },
  {
    id: "miniboss_arena",
    name: "MINI-BOSS ARENA",
    subtitle: "Area 4 of 7",
    w: 1700,
    h: 1300,
    spawn: { x: 220, y: 650 },
    lava: [
      { x: 700, y: 120, w: 320, h: 130 },
      { x: 700, y: 1050, w: 320, h: 130 },
    ],
    rocks: [
      { x: 420, y: 300, w: 120, h: 120 },
      { x: 1150, y: 880, w: 140, h: 120 },
    ],
    bones: [
      { x: 500, y: 900 },
      { x: 1200, y: 350 },
      { x: 850, y: 650 },
    ],
    waves: [
      [{ type: "mini_fire_raptor", x: 1250, y: 650 }],
      [{ type: "fire_utahraptor", x: 1300, y: 650 }],
    ],
    exit: { x: 1600, y: 650 },
    eruptions: 12,
    checkpoint: true,
  },
  {
    id: "treasure_room",
    name: "TREASURE ROOM",
    subtitle: "Area 5 of 7",
    w: 1400,
    h: 1000,
    spawn: { x: 180, y: 500 },
    lava: [
      { x: 640, y: 0, w: 90, h: 300 },
      { x: 640, y: 700, w: 90, h: 300 },
    ],
    rocks: [],
    bones: [
      ...bonesLine(5, 420, 380, 60, 50),
      ...bonesLine(5, 420, 620, 60, -50),
      { x: 1100, y: 300 },
      { x: 1100, y: 700 },
    ],
    waves: [],
    chest: { x: 1050, y: 500 },
    exit: { x: 1320, y: 500 },
    eruptions: 0,
  },
  {
    id: "volcano_interior",
    name: "VOLCANO INTERIOR",
    subtitle: "Area 6 of 7",
    w: 2000,
    h: 1400,
    spawn: { x: 200, y: 700 },
    lava: [
      { x: 500, y: 300, w: 220, h: 800 },
      { x: 1050, y: 0, w: 200, h: 560 },
      { x: 1050, y: 860, w: 200, h: 540 },
      { x: 1550, y: 500, w: 260, h: 200 },
    ],
    rocks: [
      { x: 820, y: 600, w: 130, h: 200 },
      { x: 1400, y: 200, w: 150, h: 150 },
    ],
    bones: [...bonesLine(4, 780, 300, 60, 60), { x: 1700, y: 1100 }, { x: 1350, y: 900 }],
    waves: [
      [
        { type: "fireling", x: 900, y: 700 },
        { type: "pterodactyl", x: 1300, y: 700 },
        { type: "pterodactyl", x: 1500, y: 1000 },
      ],
      [
        { type: "fireling", x: 1650, y: 400 },
        { type: "fireling", x: 1750, y: 900 },
        { type: "pterodactyl", x: 1600, y: 1200 },
      ],
    ],
    exit: { x: 1900, y: 700 },
    eruptions: 6,
    cave_dark: true,
  },
  {
    id: "firesauras_arena",
    name: "FIRESAURAS BOSS ARENA",
    subtitle: "Area 7 of 7",
    w: 1800,
    h: 1400,
    spawn: { x: 240, y: 700 },
    lava: [
      { x: 0, y: 0, w: 1800, h: 90 },
      { x: 0, y: 1310, w: 1800, h: 90 },
      { x: 780, y: 300, w: 220, h: 130 },
      { x: 780, y: 980, w: 220, h: 130 },
    ],
    rocks: [
      { x: 500, y: 640, w: 110, h: 110 },
      { x: 1250, y: 640, w: 110, h: 110 },
    ],
    bones: [
      { x: 400, y: 400 },
      { x: 400, y: 1000 },
      { x: 1400, y: 400 },
      { x: 1400, y: 1000 },
    ],
    waves: [[{ type: "firesauras", x: 1350, y: 700 }]],
    exit: { x: 900, y: 700 },
    eruptions: 7,
    cave_dark: true,
  },
];
