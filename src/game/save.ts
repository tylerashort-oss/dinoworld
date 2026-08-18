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
  /** Bone Forge upgrade levels. */
  upgrades: Record<string, number>;
  /** Spare lives bought with bones. */
  extraLives: number;
  sound: boolean;
  keybinds: Keybinds;
  joystickSize: number;
  flags: Record<string, boolean>;
}

const KEY = "dinoquest.save.v1";

export function defaultSave(): SaveData {
  return {
    version: 3,
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
    progress: { "1": 0, "2": 0, "3": 0 },
    checkpoints: { "1": 0, "2": 0, "3": 0 },
    world1Complete: false,
    world2Unlocked: false,
    world2Complete: false,
    world3Unlocked: false,
    world3Complete: false,
    upgrades: { maxHp: 0, damage: 0, petPower: 0 },
    extraLives: 0,
    sound: true,
    keybinds: defaultKeybinds(),
    joystickSize: 210,
    flags: {},
  };
}

export function loadSave(): SaveData {
  if (typeof window === "undefined") return defaultSave();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const merged = { ...defaultSave(), ...parsed } as SaveData;
    merged.keybinds = normalizeKeybinds(parsed.keybinds);
    merged.progress = { "1": 0, "2": 0, "3": 0, ...(parsed.progress ?? {}) };
    merged.checkpoints = { "1": 0, "2": 0, "3": 0, ...(parsed.checkpoints ?? {}) };
    merged.upgrades = { maxHp: 0, damage: 0, petPower: 0, ...(parsed.upgrades ?? {}) };
    merged.extraLives = parsed.extraLives ?? 0;
    if (!merged.world) merged.world = 1;
    if (!merged.joystickSize) merged.joystickSize = 210;
    return merged;
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
