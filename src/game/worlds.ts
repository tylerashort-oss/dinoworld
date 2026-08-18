import { AREAS, type AreaDef } from "./areas";
import { ICE_AREAS } from "./areas-ice";

export interface WorldDef {
  id: number;
  name: string;
  emoji: string;
  blurb: string;
  areas: AreaDef[];
  finalBoss: string;
}

export const WORLDS: WorldDef[] = [
  {
    id: 1,
    name: "VOLCANIC LANDS",
    emoji: "🌋",
    blurb: "Lava fields, hidden caves and the volcano king Firesauras.",
    areas: AREAS,
    finalBoss: "firesauras",
  },
  {
    id: 2,
    name: "ICE WORLD",
    emoji: "❄️",
    blurb: "Frozen tundra, glacier caves and the ice titan Glacierus.",
    areas: ICE_AREAS,
    finalBoss: "glacierus",
  },
];

export const getWorld = (id: number): WorldDef => WORLDS.find((w) => w.id === id) ?? (WORLDS[0] as WorldDef);
export const getAreas = (worldId: number): AreaDef[] => getWorld(worldId).areas;
