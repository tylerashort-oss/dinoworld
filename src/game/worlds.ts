import { AREAS, type AreaDef } from "./areas";
import { ICE_AREAS } from "./areas-ice";
import { POISON_AREAS } from "./areas-poison";
import { DESERT_AREAS } from "./areas-desert";
import { ELECTRIC_AREAS } from "./areas-electric";
import { SHADOW_AREAS } from "./areas-shadow";

export interface WorldDef {
  id: number;
  name: string;
  emoji: string;
  blurb: string;
  areas: AreaDef[];
  finalBoss: string;
  /** Save flag that unlocks this world (world 1 is always open). */
  unlockFlag?: keyof import("./save").SaveData;
  /** Save flag set once the world's boss is beaten. */
  completeFlag: keyof import("./save").SaveData;
  /** Shown on the world map while the world is locked. */
  unlockHint: string;
}

export const WORLDS: WorldDef[] = [
  {
    id: 1,
    name: "VOLCANIC LANDS",
    emoji: "🌋",
    blurb: "Lava fields, hidden caves and the volcano king Firesauras.",
    areas: AREAS,
    finalBoss: "firesauras",
    completeFlag: "world1Complete",
    unlockHint: "",
  },
  {
    id: 2,
    name: "ICE WORLD",
    emoji: "❄️",
    blurb: "Frozen tundra, glacier caves and the ice titan Glacierus.",
    areas: ICE_AREAS,
    finalBoss: "glacierus",
    unlockFlag: "world2Unlocked",
    completeFlag: "world2Complete",
    unlockHint: "LOCKED — defeat Firesauras to unlock",
  },
  {
    id: 3,
    name: "POISON JUNGLE",
    emoji: "🌴",
    blurb: "Toxic sludge, spore hollows and the jungle titan Venomus.",
    areas: POISON_AREAS,
    finalBoss: "venomus",
    unlockFlag: "world3Unlocked",
    completeFlag: "world3Complete",
    unlockHint: "LOCKED — defeat Glacierus to unlock",
  },
  {
    id: 4,
    name: "SCORCHED DESERT",
    emoji: "🏜️",
    blurb: "Quicksand pits, buried tombs and the sandstone giant Dunecrusher.",
    areas: DESERT_AREAS,
    finalBoss: "dunecrusher",
    unlockFlag: "world4Unlocked",
    completeFlag: "world4Complete",
    unlockHint: "LOCKED — defeat Venomus to unlock",
  },
  {
    id: 5,
    name: "THUNDER PEAKS",
    emoji: "⚡",
    blurb: "Plasma pools, tesla caves and the storm titan Voltasaurus.",
    areas: ELECTRIC_AREAS,
    finalBoss: "voltasaurus",
    unlockFlag: "world5Unlocked",
    completeFlag: "world5Complete",
    unlockHint: "LOCKED — defeat Dunecrusher to unlock",
  },
  {
    id: 6,
    name: "MOON SHADOW",
    emoji: "🌑",
    blurb: "Craters, living void and the final moon titan Eclipsaurus.",
    areas: SHADOW_AREAS,
    finalBoss: "eclipsaurus",
    unlockFlag: "world6Unlocked",
    completeFlag: "world6Complete",
    unlockHint: "LOCKED — defeat Voltasaurus to unlock",
  },
];

export const getWorld = (id: number): WorldDef =>
  WORLDS.find((w) => w.id === id) ?? (WORLDS[0] as WorldDef);
export const getAreas = (worldId: number): AreaDef[] => getWorld(worldId).areas;
