import { defaultKeybinds, normalizeKeybinds, type Keybinds } from "./keybinds";

export interface SaveData {
  version: number;
  started: boolean;
  character: "rocket_boy" | "pink_explorer";
  bones: number;
  weapons: string[];
  equippedWeapon: string;
  pets: string[];
  equippedPet: string | null;
  cards: string[];
  /** Current world (1 = Volcanic Lands, 2 = Ice World). */
  world: number;
  /** Area index inside the current world. */
  areaIndex: number;
  /** Furthest area reached per world. */
  progress: Record<string, number>;
  /** Respawn checkpoint area index per world. */
  checkpoints: Record<string, number>;
  world1Complete: boolean;
  world2Unlocked: boolean;
  world2Complete: boolean;
  world3Unlocked: boolean;
  world3Complete: boolean;
  world4Unlocked: boolean;
  world4Complete: boolean;
  world5Unlocked: boolean;
  world5Complete: boolean;
  world6Unlocked: boolean;
  world6Complete: boolean;
  /** Bone Forge upgrade levels. */
  upgrades: Record<string, number>;
  /** Spare lives bought with bones. */
  extraLives: number;
  /** Hidden caves already looted, keyed by area id. */
  foundCaves: Record<string, boolean>;
  sound: boolean;
  keybinds: Keybinds;
  joystickSize: number;
  flags: Record<string, boolean>;
}

const KEY = "dinoquest.save.v1";
const VERSION = 4;

export function defaultSave(): SaveData {
  return {
    version: VERSION,
    started: false,
    character: "rocket_boy",
    bones: 0,
    weapons: ["bone_sword"],
    equippedWeapon: "bone_sword",
    pets: [],
    equippedPet: null,
    cards: ["card_rocket_boy", "card_pink_explorer", "card_bone_sword"],
    world: 1,
    areaIndex: 0,
    progress: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 },
    checkpoints: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 },
    world1Complete: false,
    world2Unlocked: false,
    world2Complete: false,
    world3Unlocked: false,
    world3Complete: false,
    world4Unlocked: false,
    world4Complete: false,
    world5Unlocked: false,
    world5Complete: false,
    world6Unlocked: false,
    world6Complete: false,
    upgrades: { maxHp: 0, damage: 0, petPower: 0 },
    extraLives: 0,
    foundCaves: {},
    sound: true,
    keybinds: defaultKeybinds(),
    joystickSize: 210,
    flags: {},
  };
}

// ---------- validation helpers: a corrupt save must never crash the game ----------

const num = (v: unknown, fallback: number, min = -Infinity, max = Infinity) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(Math.max(v, min), max) : fallback;

const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);

const strList = (v: unknown, fallback: string[]) =>
  Array.isArray(v) ? Array.from(new Set(v.filter((s): s is string => typeof s === "string"))) : fallback;

function numMap(v: unknown, base: Record<string, number>): Record<string, number> {
  const out = { ...base };
  if (v && typeof v === "object" && !Array.isArray(v)) {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val === "number" && Number.isFinite(val)) out[k] = val;
    }
  }
  return out;
}

function boolMap(v: unknown): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (v && typeof v === "object" && !Array.isArray(v)) {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val === "boolean") out[k] = val;
    }
  }
  return out;
}

/** Field-by-field validation: anything unexpected falls back to its default. */
function migrate(raw: unknown): SaveData {
  const d = defaultSave();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return d;
  const p = raw as Record<string, unknown>;
  const weapons = strList(p["weapons"], d.weapons);
  if (!weapons.includes("bone_sword")) weapons.unshift("bone_sword");
  const equippedWeapon =
    typeof p["equippedWeapon"] === "string" && weapons.includes(p["equippedWeapon"] as string)
      ? (p["equippedWeapon"] as string)
      : "bone_sword";
  const pets = strList(p["pets"], d.pets);
  const equippedPet =
    typeof p["equippedPet"] === "string" && (p["equippedPet"] as string).length > 0
      ? (p["equippedPet"] as string)
      : null;
  return {
    version: VERSION,
    started: bool(p["started"], d.started),
    character: p["character"] === "pink_explorer" ? "pink_explorer" : "rocket_boy",
    bones: Math.round(num(p["bones"], 0, 0, 9_999_999)),
    weapons,
    equippedWeapon,
    pets,
    equippedPet,
    cards: Array.from(new Set([...d.cards, ...strList(p["cards"], [])])),
    world: Math.round(num(p["world"], 1, 1, 6)),
    areaIndex: Math.round(num(p["areaIndex"], 0, 0, 50)),
    progress: numMap(p["progress"], d.progress),
    checkpoints: numMap(p["checkpoints"], d.checkpoints),
    world1Complete: bool(p["world1Complete"], false),
    world2Unlocked: bool(p["world2Unlocked"], false),
    world2Complete: bool(p["world2Complete"], false),
    world3Unlocked: bool(p["world3Unlocked"], false),
    world3Complete: bool(p["world3Complete"], false),
    world4Unlocked: bool(p["world4Unlocked"], false),
    world4Complete: bool(p["world4Complete"], false),
    world5Unlocked: bool(p["world5Unlocked"], false),
    world5Complete: bool(p["world5Complete"], false),
    world6Unlocked: bool(p["world6Unlocked"], false),
    world6Complete: bool(p["world6Complete"], false),
    upgrades: numMap(p["upgrades"], d.upgrades),
    extraLives: Math.round(num(p["extraLives"], 0, 0, 99)),
    foundCaves: boolMap(p["foundCaves"]),
    sound: bool(p["sound"], true),
    keybinds: normalizeKeybinds(p["keybinds"] as never),
    joystickSize: Math.round(num(p["joystickSize"], 210, 120, 340)),
    flags: boolMap(p["flags"]),
  };
}

export function loadSave(): SaveData {
  if (typeof window === "undefined") return defaultSave();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    return migrate(JSON.parse(raw));
  } catch {
    return defaultSave();
  }
}

export function persistSave(save: SaveData) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* storage unavailable — game still runs */
  }
}

export function hasSave(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!window.localStorage.getItem(KEY);
  } catch {
    return false;
  }
}

export function clearSave() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
