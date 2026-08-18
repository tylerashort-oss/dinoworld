import rocketBoyImg from "@/assets/rocket-boy.png";
import pinkExplorerImg from "@/assets/pink-explorer.png";
import rocketBoyRunImg from "@/assets/rocket-boy-run.png";
import pinkExplorerRunImg from "@/assets/pink-explorer-run.png";
import pterodactylImg from "@/assets/pterodactyl.png";
import miniRaptorImg from "@/assets/mini-fire-raptor.png";
import utahraptorImg from "@/assets/fire-utahraptor.png";
import firesaurasImg from "@/assets/firesauras.png";
import pterodactylRunImg from "@/assets/pterodactyl-run.png";
import miniRaptorRunImg from "@/assets/mini-fire-raptor-run.png";
import utahraptorRunImg from "@/assets/fire-utahraptor-run.png";
import firesaurasRunImg from "@/assets/firesauras-run.png";
import frostPterodactylImg from "@/assets/frost-pterodactyl.png";
import miniFrostRaptorImg from "@/assets/mini-frost-raptor.png";
import frozenUtahraptorImg from "@/assets/frozen-utahraptor.png";
import glacierusImg from "@/assets/glacierus.png";
import frostPterodactylRunImg from "@/assets/frost-pterodactyl-run.png";
import miniFrostRaptorRunImg from "@/assets/mini-frost-raptor-run.png";
import frozenUtahraptorRunImg from "@/assets/frozen-utahraptor-run.png";
import glacierusRunImg from "@/assets/glacierus-run.png";

export const SPRITES = {
  rocket_boy: rocketBoyImg,
  pink_explorer: pinkExplorerImg,
  pterodactyl: pterodactylImg,
  mini_fire_raptor: miniRaptorImg,
  fire_utahraptor: utahraptorImg,
  firesauras: firesaurasImg,
  frost_pterodactyl: frostPterodactylImg,
  mini_frost_raptor: miniFrostRaptorImg,
  frozen_utahraptor: frozenUtahraptorImg,
  glacierus: glacierusImg,
} as const;

export const RUN_SHEETS: Record<string, { src: string; frames: number }> = {
  rocket_boy: { src: rocketBoyRunImg, frames: 4 },
  pink_explorer: { src: pinkExplorerRunImg, frames: 4 },
  pterodactyl: { src: pterodactylRunImg, frames: 4 },
  mini_fire_raptor: { src: miniRaptorRunImg, frames: 4 },
  fire_utahraptor: { src: utahraptorRunImg, frames: 4 },
  firesauras: { src: firesaurasRunImg, frames: 4 },
  frost_pterodactyl: { src: frostPterodactylRunImg, frames: 4 },
  mini_frost_raptor: { src: miniFrostRaptorRunImg, frames: 4 },
  frozen_utahraptor: { src: frozenUtahraptorRunImg, frames: 4 },
  glacierus: { src: glacierusRunImg, frames: 4 },
};

export type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC";
export type CardType = "CHARACTER" | "WEAPON" | "PET";

export interface CardDef {
  id: string;
  name: string;
  type: CardType;
  rarity: Rarity;
  art: string;
  description: string;
}

export interface CharacterDef {
  id: "rocket_boy" | "pink_explorer";
  name: string;
  art: string;
  speed: number;
  lootBonus: number;
  trait: string;
  blurb: string;
}

export interface WeaponDef {
  id: string;
  name: string;
  damage: number;
  range: number;
  arc: number;
  cooldown: number;
  color: string;
  rarity: Rarity;
  description: string;
}

export interface PetDef {
  id: string;
  name: string;
  art: string;
  damage: number;
  cooldown: number;
  description: string;
}

export const CHARACTERS: Record<string, CharacterDef> = {
  rocket_boy: {
    id: "rocket_boy",
    name: "Rocket Boy",
    art: rocketBoyImg,
    speed: 1.13,
    lootBonus: 0,
    trait: "FAST — moves 13% quicker",
    blurb: "Age 8. His hat is on fire and he doesn't mind one bit.",
  },
  pink_explorer: {
    id: "pink_explorer",
    name: "Pink Explorer",
    art: pinkExplorerImg,
    speed: 1,
    lootBonus: 0.5,
    trait: "TREASURE — finds 50% more bones & extra cards",
    blurb: "Age 5. She can spot a hidden cave from a mile away.",
  },
};

export const WEAPONS: Record<string, WeaponDef> = {
  bone_sword: {
    id: "bone_sword",
    name: "Bone Sword",
    damage: 12,
    range: 92,
    arc: 1.1,
    cooldown: 0.42,
    color: "#f4e7c8",
    rarity: "COMMON",
    description: "A sturdy blade carved from an ancient dino rib.",
  },
  fire_bone_axe: {
    id: "fire_bone_axe",
    name: "Fire Bone Axe",
    damage: 20,
    range: 108,
    arc: 1.35,
    cooldown: 0.46,
    color: "#ff9d3c",
    rarity: "EPIC",
    description: "Bone and burning stone. Heavy swings, big sparks.",
  },
  fire_claw: {
    id: "fire_claw",
    name: "Legendary Fire Claw",
    damage: 34,
    range: 130,
    arc: 1.7,
    cooldown: 0.34,
    color: "#ff5722",
    rarity: "LEGENDARY",
    description: "Forged from bones + volcano fire. Wide, fast, blazing.",
  },
  frost_bone_axe: {
    id: "frost_bone_axe",
    name: "Frost Bone Axe",
    damage: 28,
    range: 118,
    arc: 1.4,
    cooldown: 0.42,
    color: "#8fd8ff",
    rarity: "EPIC",
    description: "Bone and blue glacier stone. Chilling heavy swings.",
  },
  ice_claw: {
    id: "ice_claw",
    name: "Legendary Ice Claw",
    damage: 44,
    range: 138,
    arc: 1.8,
    cooldown: 0.32,
    color: "#5ec8ff",
    rarity: "LEGENDARY",
    description: "Bones + eternal ice. The prize of the Ice World.",
  },
};

export const PETS: Record<string, PetDef> = {
  mini_fire_raptor: {
    id: "mini_fire_raptor",
    name: "Mini Fire Raptor",
    art: miniRaptorImg,
    damage: 34,
    cooldown: 1.5,
    description: "Lunges at the nearest enemy in a streak of flame.",
  },
  fire_utahraptor: {
    id: "fire_utahraptor",
    name: "Fire Utahraptor",
    art: utahraptorImg,
    damage: 60,
    cooldown: 1.8,
    description: "A huge ally raptor that shreds anything nearby.",
  },
  mini_frost_raptor: {
    id: "mini_frost_raptor",
    name: "Mini Frost Raptor",
    art: miniFrostRaptorImg,
    damage: 46,
    cooldown: 1.4,
    description: "Darts at enemies in a spray of snow.",
  },
  frozen_utahraptor: {
    id: "frozen_utahraptor",
    name: "Frozen Utahraptor",
    art: frozenUtahraptorImg,
    damage: 78,
    cooldown: 1.7,
    description: "Icy claws that freeze anything they touch.",
  },
};

/** ---------- BONE FORGE ---------- */
export type UpgradeId = "maxHp" | "damage" | "petPower";

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  emoji: string;
  description: string;
  baseCost: number;
  max: number;
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: "maxHp",
    name: "Tough Hide",
    emoji: "❤️",
    description: "+25 max health, every level.",
    baseCost: 60,
    max: 8,
  },
  {
    id: "damage",
    name: "Sharper Bones",
    emoji: "⚔️",
    description: "+10% weapon damage, every level.",
    baseCost: 80,
    max: 10,
  },
  {
    id: "petPower",
    name: "Pet Training",
    emoji: "🦖",
    description: "+20% pet damage, every level.",
    baseCost: 70,
    max: 8,
  },
];

export const EXTRA_LIFE_COST = 150;
export const CARD_PACK_COST = 200;

/** Cost of the next level of an upgrade. Pink Explorer gets a 25% discount. */
export const upgradeCost = (def: UpgradeDef, level: number, discount = 0) =>
  Math.max(10, Math.round(def.baseCost * Math.pow(1.55, level) * (1 - discount)));

export const CARDS: Record<string, CardDef> = {
  card_rocket_boy: {
    id: "card_rocket_boy",
    name: "Rocket Boy",
    type: "CHARACTER",
    rarity: "RARE",
    art: rocketBoyImg,
    description: "Fast young adventurer with a flaming hat.",
  },
  card_pink_explorer: {
    id: "card_pink_explorer",
    name: "Pink Explorer",
    type: "CHARACTER",
    rarity: "RARE",
    art: pinkExplorerImg,
    description: "Treasure hunter. Finds what others walk past.",
  },
  card_bone_sword: {
    id: "card_bone_sword",
    name: "Bone Sword",
    type: "WEAPON",
    rarity: "COMMON",
    art: "",
    description: "Starter weapon of every Dino Quest hero.",
  },
  card_fire_bone_axe: {
    id: "card_fire_bone_axe",
    name: "Fire Bone Axe",
    type: "WEAPON",
    rarity: "EPIC",
    art: "",
    description: "Wide burning swings. Found in the treasure room.",
  },
  card_fire_claw: {
    id: "card_fire_claw",
    name: "Legendary Fire Claw",
    type: "WEAPON",
    rarity: "LEGENDARY",
    art: "",
    description: "Bones + volcano fire. The pride of World 1.",
  },
  card_mini_fire_raptor: {
    id: "card_mini_fire_raptor",
    name: "Mini Fire Raptor",
    type: "PET",
    rarity: "RARE",
    art: miniRaptorImg,
    description: "Small, quick, extremely enthusiastic about fire.",
  },
  card_fire_utahraptor: {
    id: "card_fire_utahraptor",
    name: "Fire Utahraptor",
    type: "PET",
    rarity: "EPIC",
    art: utahraptorImg,
    description: "Molten-cracked hunter of the Volcanic Lands.",
  },
  card_baby_raptor: {
    id: "card_baby_raptor",
    name: "Baby Raptor",
    type: "PET",
    rarity: "COMMON",
    art: miniRaptorImg,
    description: "Just hatched. Already grumpy.",
  },
  card_ember_pterodactyl: {
    id: "card_ember_pterodactyl",
    name: "Ember Pterodactyl",
    type: "PET",
    rarity: "RARE",
    art: pterodactylImg,
    description: "Hidden-cave treasure. Wings of glowing lava.",
  },
  card_firesauras: {
    id: "card_firesauras",
    name: "Firesauras",
    type: "PET",
    rarity: "MYTHIC",
    art: firesaurasImg,
    description: "The volcano king himself. Ultimate World 1 prize.",
  },
  card_frost_bone_axe: {
    id: "card_frost_bone_axe",
    name: "Frost Bone Axe",
    type: "WEAPON",
    rarity: "EPIC",
    art: "",
    description: "Found deep in the Frozen Treasure Vault.",
  },
  card_ice_claw: {
    id: "card_ice_claw",
    name: "Legendary Ice Claw",
    type: "WEAPON",
    rarity: "LEGENDARY",
    art: "",
    description: "Bones + eternal ice. The pride of World 2.",
  },
  card_frost_pterodactyl: {
    id: "card_frost_pterodactyl",
    name: "Frost Pterodactyl",
    type: "PET",
    rarity: "RARE",
    art: frostPterodactylImg,
    description: "Hidden glacier-cave treasure. Wings of pure frost.",
  },
  card_baby_frost_raptor: {
    id: "card_baby_frost_raptor",
    name: "Baby Frost Raptor",
    type: "PET",
    rarity: "COMMON",
    art: miniFrostRaptorImg,
    description: "Hatched in a snowdrift. Very cold, very cross.",
  },
  card_mini_frost_raptor: {
    id: "card_mini_frost_raptor",
    name: "Mini Frost Raptor",
    type: "PET",
    rarity: "RARE",
    art: miniFrostRaptorImg,
    description: "Small, fast and freezing to the touch.",
  },
  card_frozen_utahraptor: {
    id: "card_frozen_utahraptor",
    name: "Frozen Utahraptor",
    type: "PET",
    rarity: "EPIC",
    art: frozenUtahraptorImg,
    description: "Ice-crested hunter of the glacier caves.",
  },
  card_glacierus: {
    id: "card_glacierus",
    name: "Glacierus",
    type: "PET",
    rarity: "MYTHIC",
    art: glacierusImg,
    description: "The ice titan. Ultimate World 2 prize.",
  },
};

export const RARITY_STYLE: Record<Rarity, { border: string; glow: string; text: string; bg: string }> = {
  COMMON: { border: "#9ca8b4", glow: "rgba(156,168,180,.45)", text: "#cfd8e0", bg: "linear-gradient(160deg,#2b3138,#171a1f)" },
  RARE: { border: "#43b0ff", glow: "rgba(67,176,255,.5)", text: "#9bd6ff", bg: "linear-gradient(160deg,#12314a,#0d1620)" },
  EPIC: { border: "#b45cff", glow: "rgba(180,92,255,.55)", text: "#dcaeff", bg: "linear-gradient(160deg,#31174d,#150d20)" },
  LEGENDARY: { border: "#ffab26", glow: "rgba(255,171,38,.6)", text: "#ffd48a", bg: "linear-gradient(160deg,#4a2a06,#1d1206)" },
  MYTHIC: { border: "#ff3d5e", glow: "rgba(255,61,94,.65)", text: "#ffb1bf", bg: "linear-gradient(160deg,#54101f,#210610)" },
};
export const getWeapon = (id: string): WeaponDef => WEAPONS[id] ?? (WEAPONS["bone_sword"] as WeaponDef);
export const getCharacter = (id: string): CharacterDef =>
  CHARACTERS[id] ?? (CHARACTERS["rocket_boy"] as CharacterDef);
export const getPet = (id: string | null | undefined): PetDef | null => (id ? PETS[id] ?? null : null);
export const getCard = (id: string): CardDef | null => CARDS[id] ?? null;
