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
  areaIndex: number;
  world1Complete: boolean;
  world2Unlocked: boolean;
  sound: boolean;
  flags: Record<string, boolean>;
}

const KEY = "dinoquest.save.v1";

export function defaultSave(): SaveData {
  return {
    version: 1,
    started: false,
    character: "rocket_boy",
    bones: 0,
    weapons: ["bone_sword"],
    equippedWeapon: "bone_sword",
    pets: [],
    equippedPet: null,
    cards: ["card_rocket_boy", "card_pink_explorer", "card_bone_sword"],
    areaIndex: 0,
    world1Complete: false,
    world2Unlocked: false,
    sound: true,
    flags: {},
  };
}

export function loadSave(): SaveData {
  if (typeof window === "undefined") return defaultSave();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    return { ...defaultSave(), ...(JSON.parse(raw) as SaveData) };
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