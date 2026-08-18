import { memo, useCallback, useEffect, useRef, useState } from "react";
import { GameEngine, type GameEvent, type HudState } from "@/game/engine";
import { getAreas, getWorld } from "@/game/worlds";
import { CARDS, getCard, getWeapon, type CardDef } from "@/game/content";
import { initAudio, playSfx, setSoundEnabled } from "@/game/audio";
import { persistSave, type SaveData } from "@/game/save";
import { Joystick } from "./Joystick";
import { GameCard } from "./GameCard";

interface RewardOverlay {
  title: string;
  subtitle?: string;
  cards: CardDef[];
  bones?: number;
  finalVictory?: boolean;
}

/** Per-world chest loot, chest flag and final-boss reward. */
const WORLD_LOOT: Record<
  number,
  {
    chestFlag: string;
    chestCards: string[];
    pinkBonus: string;
    axe: string;
    claw: string;
    clawCard: string;
    bossCard: string;
    bossBones: number;
    clawLabel: string;
  }
> = {
  1: {
    chestFlag: "chestOpened",
    chestCards: ["card_fire_bone_axe", "card_baby_raptor", "card_mini_fire_raptor"],
    pinkBonus: "card_fire_utahraptor",
    axe: "fire_bone_axe",
    claw: "fire_claw",
    clawCard: "card_fire_claw",
    bossCard: "card_firesauras",
    bossBones: 300,
    clawLabel: "FIRE CLAW",
  },
  2: {
    chestFlag: "iceChestOpened",
    chestCards: ["card_frost_bone_axe", "card_baby_frost_raptor", "card_mini_frost_raptor"],
    pinkBonus: "card_frozen_utahraptor",
    axe: "frost_bone_axe",
    claw: "ice_claw",
    clawCard: "card_ice_claw",
    bossCard: "card_glacierus",
    bossBones: 450,
    clawLabel: "ICE CLAW",
  },
  3: {
    chestFlag: "jungleChestOpened",
    chestCards: ["card_venom_bone_axe", "card_baby_toxic_raptor", "card_mini_toxic_raptor"],
    pinkBonus: "card_toxic_utahraptor",
    axe: "venom_bone_axe",
    claw: "vine_claw",
    clawCard: "card_vine_claw",
    bossCard: "card_venomus",
    bossBones: 600,
    clawLabel: "VINE CLAW",
  },
  4: {
    chestFlag: "desertChestOpened",
    chestCards: ["card_sand_bone_axe", "card_baby_sand_raptor", "card_mini_sand_raptor"],
    pinkBonus: "card_sand_utahraptor",
    axe: "sand_bone_axe",
    claw: "sand_claw",
    clawCard: "card_sand_claw",
    bossCard: "card_dunecrusher",
    bossBones: 750,
    clawLabel: "SAND CLAW",
  },
  5: {
    chestFlag: "electricChestOpened",
    chestCards: ["card_storm_bone_axe", "card_baby_storm_raptor", "card_mini_storm_raptor"],
    pinkBonus: "card_storm_utahraptor",
    axe: "storm_bone_axe",
    claw: "storm_claw",
    clawCard: "card_storm_claw",
    bossCard: "card_voltasaurus",
    bossBones: 900,
    clawLabel: "STORM CLAW",
  },
  6: {
    chestFlag: "shadowChestOpened",
    chestCards: ["card_shadow_bone_axe", "card_baby_shadow_raptor", "card_mini_shadow_raptor"],
    pinkBonus: "card_shadow_utahraptor",
    axe: "shadow_bone_axe",
    claw: "shadow_claw",
    clawCard: "card_shadow_claw",
    bossCard: "card_eclipsaurus",
    bossBones: 1200,
    clawLabel: "SHADOW CLAW",
  },
};

/** Weapons a world's chest axe should auto-upgrade over. */
const WEAKER_WEAPONS = [
  "bone_sword",
  "fire_bone_axe",
  "frost_bone_axe",
  "venom_bone_axe",
  "sand_bone_axe",
  "storm_bone_axe",
];

export function GameScreen({
  save,
  setSave,
  onQuit,
}: {
  save: SaveData;
  setSave: (fn: (s: SaveData) => SaveData) => void;
  onQuit: (target: "map" | "camp" | "settings") => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  const [hud, setHud] = useState<HudState | null>(null);
  const [reward, setReward] = useState<RewardOverlay | null>(null);
  const [dead, setDead] = useState(false);
  const [paused, setPaused] = useState(false);
  const [victory, setVictory] = useState<null | { world: number }>(null);
  const transitioning = useRef(false);

  const worldId = save.world ?? 1;
  const worldKey = String(worldId);
  const areas = getAreas(worldId);
  const world = getWorld(worldId);

  const update = useCallback(
    (patch: (s: SaveData) => SaveData) => {
      setSave((s) => {
        const next = patch(s);
        persistSave(next);
        return next;
      });
    },
    [setSave],
  );

  const handleEvent = useRef<(e: GameEvent) => void>(() => {});
  handleEvent.current = (ev: GameEvent) => {
    const eng = engineRef.current;
    if (!eng) return;
    const s0 = saveRef.current;
    const world = s0.world ?? 1;
    const loot = WORLD_LOOT[world] ?? WORLD_LOOT[1]!;
    switch (ev.type) {
      case "bonesChanged":
        update((s) => ({ ...s, bones: ev.bones }));
        break;
      case "death":
        setDead(true);
        break;
      case "pauseRequested":
        setPaused((p) => !p);
        break;
      case "caveFound": {
        const card = getCard(ev.cardId);
        const areaId = ev.areaId;
        if (card) {
          update((s) => ({
            ...s,
            cards: Array.from(new Set([...s.cards, card.id])),
            foundCaves: { ...(s.foundCaves ?? {}), [areaId]: true },
          }));
          setReward({
            title: "HIDDEN CAVE DISCOVERED!",
            subtitle: "A rare card was hiding in here.",
            cards: [card],
          });
        }
        break;
      }
      case "chestOpened": {
        const ids = [...loot.chestCards];
        if (s0.character === "pink_explorer") ids.push(loot.pinkBonus);
        const cards = ids.map(getCard).filter(Boolean) as CardDef[];
        const bonus = (s0.character === "pink_explorer" ? 120 : 80) * Math.max(1, world - 1);
        const newWeapon = loot.axe;
        const upgradeFrom = WEAKER_WEAPONS.slice(0, WEAKER_WEAPONS.indexOf(newWeapon));
        update((s) => ({
          ...s,
          cards: Array.from(new Set([...s.cards, ...ids])),
          weapons: Array.from(new Set([...s.weapons, newWeapon])),
          equippedWeapon: upgradeFrom.includes(s.equippedWeapon) ? newWeapon : s.equippedWeapon,
          flags: {
            ...s.flags,
            [loot.chestFlag]: true,
          },
        }));
        eng.addBonusBones(bonus);
        if (upgradeFrom.includes(s0.equippedWeapon)) eng.setWeapon(newWeapon);
        playSfx("card");
        setReward({
          title: "TREASURE CHEST OPENED!",
          subtitle: `You found ${cards.length} cards and ${bonus} bones!`,
          cards,
          bones: bonus,
        });
        break;
      }
      case "bossDefeated": {
        const petBosses: Record<string, { card: string; bones: number; label: string }> = {
          mini_fire_raptor: { card: "card_mini_fire_raptor", bones: 40, label: "MINI FIRE RAPTOR" },
          fire_utahraptor: { card: "card_fire_utahraptor", bones: 70, label: "FIRE UTAHRAPTOR" },
          mini_frost_raptor: {
            card: "card_mini_frost_raptor",
            bones: 60,
            label: "MINI FROST RAPTOR",
          },
          frozen_utahraptor: {
            card: "card_frozen_utahraptor",
            bones: 95,
            label: "FROZEN UTAHRAPTOR",
          },
          mini_toxic_raptor: {
            card: "card_mini_toxic_raptor",
            bones: 85,
            label: "MINI TOXIC RAPTOR",
          },
          toxic_utahraptor: {
            card: "card_toxic_utahraptor",
            bones: 130,
            label: "TOXIC UTAHRAPTOR",
          },
          mini_sand_raptor: {
            card: "card_mini_sand_raptor",
            bones: 160,
            label: "MINI SAND RAPTOR",
          },
          sand_utahraptor: {
            card: "card_sand_utahraptor",
            bones: 210,
            label: "SAND UTAHRAPTOR",
          },
          mini_storm_raptor: {
            card: "card_mini_storm_raptor",
            bones: 240,
            label: "MINI STORM RAPTOR",
          },
          storm_utahraptor: {
            card: "card_storm_utahraptor",
            bones: 300,
            label: "STORM UTAHRAPTOR",
          },
          mini_shadow_raptor: {
            card: "card_mini_shadow_raptor",
            bones: 330,
            label: "MINI SHADOW RAPTOR",
          },
          shadow_utahraptor: {
            card: "card_shadow_utahraptor",
            bones: 400,
            label: "SHADOW UTAHRAPTOR",
          },
        };
        const pet = petBosses[ev.id];
        if (pet) {
          const petId = ev.id;
          update((s) => ({
            ...s,
            pets: Array.from(new Set([...s.pets, petId])),
            equippedPet: petId,
            cards: Array.from(new Set([...s.cards, pet.card])),
          }));
          eng.setPet(petId);
          eng.addBonusBones(pet.bones);
          const card = getCard(pet.card);
          setReward({
            title: `${pet.label} DEFEATED!`,
            subtitle: "🦖 PET UNLOCKED! Press the PET button to make it attack.",
            cards: card ? [card] : [],
            bones: pet.bones,
          });
        } else if (ev.id === getWorld(world).finalBoss) {
          const ids = [loot.bossCard, loot.clawCard];
          const lastIdx = getAreas(world).length - 1;
          const petId = ev.id;
          update((s) => ({
            ...s,
            cards: Array.from(new Set([...s.cards, ...ids])),
            pets: Array.from(new Set([...s.pets, petId])),
            weapons: Array.from(new Set([...s.weapons, loot.claw])),
            equippedWeapon: loot.claw,
            progress: {
              ...s.progress,
              [String(world)]: Math.max(s.progress?.[String(world)] ?? 0, lastIdx),
            },
            checkpoints: {
              ...s.checkpoints,
              [String(world)]: Math.max(s.checkpoints?.[String(world)] ?? 0, lastIdx),
            },
            ...(getWorld(world).completeFlag ? { [getWorld(world).completeFlag]: true } : {}),
            ...(getWorld(world + 1)?.id === world + 1 && getWorld(world + 1).unlockFlag
              ? { [getWorld(world + 1).unlockFlag as string]: true }
              : {}),
          }));
          eng.setWeapon(loot.claw);
          eng.addBonusBones(loot.bossBones);
          setReward({
            title: `${getWorld(world).finalBoss.toUpperCase()} DEFEATED!`,
            subtitle: `MYTHIC card + LEGENDARY ${loot.clawLabel} + ${loot.bossBones} bones!`,
            cards: ids.map(getCard).filter(Boolean) as CardDef[],
            bones: loot.bossBones,
            finalVictory: true,
          });
        }
        break;
      }
      case "areaExit": {
        if (transitioning.current) return;
        transitioning.current = true;
        const list = getAreas(s0.world ?? 1);
        const cleared = list[ev.areaIndex];
        const next = ev.areaIndex + 1;
        const key = String(s0.world ?? 1);
        if (next >= list.length) {
          onQuit("map");
          return;
        }
        update((s) => ({
          ...s,
          areaIndex: next,
          progress: { ...s.progress, [key]: Math.max(s.progress?.[key] ?? 0, next) },
          checkpoints: cleared?.checkpoint
            ? { ...s.checkpoints, [key]: Math.max(s.checkpoints?.[key] ?? 0, next) }
            : s.checkpoints,
        }));
        if (cleared?.checkpoint) eng.banner("CHECKPOINT SAVED!");
        eng.loadArea(next);
        window.setTimeout(() => (transitioning.current = false), 600);
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSoundEnabled(saveRef.current.sound);
    const s = saveRef.current;
    const pink = s.character === "pink_explorer";
    const up = s.upgrades ?? {};
    const engine = new GameEngine({
      canvas,
      characterId: s.character,
      weaponId: s.equippedWeapon,
      petId: s.equippedPet,
      world: s.world ?? 1,
      areaIndex: s.areaIndex,
      bones: s.bones,
      openedChest:
        !!s.flags[
          (s.world ?? 1) === 3
            ? "jungleChestOpened"
            : (s.world ?? 1) === 2
              ? "iceChestOpened"
              : "chestOpened"
        ],
      foundCaves: s.foundCaves ?? {},
      keybinds: s.keybinds,
      difficulty: s.world ?? 1,
      bonusMaxHp: (up["maxHp"] ?? 0) * 25,
      damageMul: 1 + (up["damage"] ?? 0) * 0.1,
      petMul: 1 + (up["petPower"] ?? 0) * 0.2,
      petHits: pink ? 2 : 1,
      magnet: pink ? 110 : 46,
      shield: pink ? 1 : 0,
      dash: pink,
      onHud: setHud,
      onEvent: (e) => handleEvent.current(e),
    });
    engineRef.current = engine;
    if (import.meta.env.DEV)
      (window as unknown as { __dinoEngine?: GameEngine }).__dinoEngine = engine;
    engine.start();
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setKeybinds(save.keybinds);
  }, [save.keybinds]);

  const blocked = !!reward || dead || paused || !!victory;
  useEffect(() => {
    engineRef.current?.setPaused(blocked);
  }, [blocked]);

  const closeReward = () => {
    const wasFinal = reward?.finalVictory;
    setReward(null);
    if (wasFinal) setVictory({ world: worldId });
  };

  const respawnAtCheckpoint = () => {
    const cp = save.checkpoints?.[worldKey] ?? 0;
    setDead(false);
    update((s) => ({ ...s, areaIndex: cp }));
    engineRef.current?.loadArea(cp);
  };

  const reviveHere = () => {
    setDead(false);
    update((s) => ({ ...s, extraLives: Math.max(0, (s.extraLives ?? 0) - 1) }));
    engineRef.current?.revive();
  };

  const weapon = getWeapon(save.equippedWeapon);
  const checkpointArea = areas[save.checkpoints?.[worldKey] ?? 0];

  const onStick = useCallback((v: { x: number; y: number }) => {
    engineRef.current?.setInput(v);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black select-none">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />

      {/* ---------- HUD ---------- */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <div className="pointer-events-none space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">❤️</span>
            <div className="h-5 w-44 overflow-hidden rounded-full border-2 border-black/60 bg-black/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-600 to-orange-400 transition-[width] duration-200"
                style={{ width: `${hud ? (hud.hp / hud.maxHp) * 100 : 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-foreground">{hud?.hp ?? 100}</span>
            {hud && hud.shield > 0 && <span className="text-lg">🛡️</span>}
          </div>
          <div className="flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-sm font-extrabold text-foreground">
            🦴 {save.bones}
          </div>
          <div className="rounded-full bg-black/45 px-3 py-0.5 text-[10px] font-bold tracking-widest text-primary">
            {world.emoji} {hud?.areaName} · {hud?.areaSubtitle}
          </div>
        </div>

        <div className="pointer-events-auto flex gap-2">
          <button
            onClick={() => setPaused(true)}
            className="rounded-xl border-2 border-primary/60 bg-black/60 px-3 py-2 text-sm font-bold text-foreground"
          >
            ☰ MENU
          </button>
        </div>
      </div>

      {/* boss bar */}
      {hud?.bossName && (
        <div className="pointer-events-none absolute left-1/2 top-3 w-[min(560px,60vw)] -translate-x-1/2 text-center">
          <div className="text-xs font-black tracking-[0.2em] text-destructive drop-shadow">
            {hud.bossName}
          </div>
          <div className="mt-1 h-4 overflow-hidden rounded-full border-2 border-black/70 bg-black/70">
            <div
              className="h-full bg-gradient-to-r from-red-700 via-red-500 to-orange-400"
              style={{ width: `${(hud.bossHp / hud.bossMaxHp) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ---------- CONTROLS ---------- */}
      <div className="absolute bottom-2 left-2">
        <Joystick size={save.joystickSize ?? 210} onChange={onStick} />
      </div>

      <div className="absolute bottom-4 right-4 flex items-end gap-3">
        <div className="flex flex-col gap-3">
          {hud?.hasDash && (
            <ActionButton
              label="💨 DASH"
              ready={hud?.dashReady ?? 1}
              className="h-[76px] w-[76px] border-pink-400/70 bg-pink-500/25 text-xs"
              onPress={() => engineRef.current?.dash()}
            />
          )}
          <ActionButton
            label="⬆ JUMP"
            className="h-[76px] w-[76px] border-sky-400/70 bg-sky-500/25 text-sm"
            onPress={() => engineRef.current?.jump()}
          />
          <ActionButton
            label={save.equippedPet ? "🦖 PET" : "🦖"}
            disabled={!save.equippedPet}
            ready={hud?.petReady ?? 0}
            className="h-[76px] w-[76px] border-emerald-400/70 bg-emerald-500/25 text-sm"
            onPress={() => engineRef.current?.petAttack()}
          />
        </div>
        <ActionButton
          label="⚔ ATTACK"
          ready={hud?.attackReady ?? 1}
          className="h-[124px] w-[124px] border-orange-400 bg-orange-500/30 text-base"
          onPress={() => {
            initAudio();
            engineRef.current?.setAttackHeld(true);
          }}
          onRelease={() => engineRef.current?.setAttackHeld(false)}
        />
      </div>

      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-[10px] font-bold text-muted-foreground">
        {weapon.name} · {hud?.petName ? `Pet: ${hud.petName}` : "No pet yet"}
        {hud && !hud.bossName ? ` · Enemies left: ${hud.enemiesLeft}` : ""}
      </div>

      {/* ---------- OVERLAYS ---------- */}
      {reward && (
        <Overlay>
          <h2 className="text-center text-2xl font-black tracking-wide text-primary drop-shadow md:text-3xl">
            {reward.title}
          </h2>
          {reward.subtitle && (
            <p className="mt-1 text-center text-sm font-bold text-foreground">{reward.subtitle}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {reward.cards.map((c, i) => (
              <GameCard key={c.id} card={c} delay={i * 220} reveal />
            ))}
            {reward.bones ? (
              <div className="flex h-[214px] w-[150px] flex-col items-center justify-center rounded-xl border-2 border-amber-300/70 bg-amber-900/30 text-center">
                <div className="text-4xl">🦴</div>
                <div className="mt-2 text-xl font-black text-amber-200">+{reward.bones}</div>
                <div className="text-[10px] font-bold tracking-widest text-amber-300/80">
                  BONUS BONES
                </div>
              </div>
            ) : null}
          </div>
          <button
            onClick={closeReward}
            className="mt-6 rounded-xl bg-primary px-8 py-3 text-lg font-black text-primary-foreground"
          >
            CONTINUE
          </button>
        </Overlay>
      )}

      {dead && !reward && (
        <Overlay>
          <h2 className="text-3xl font-black text-destructive md:text-5xl">YOU WERE DEFEATED</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your bones and cards are safe. You restart from your last checkpoint with full health.
          </p>
          <p className="mt-1 text-xs font-bold tracking-widest text-primary">
            CHECKPOINT: {checkpointArea?.name ?? areas[0]?.name}
          </p>
          <div className="mt-6 flex gap-3">
            {(save.extraLives ?? 0) > 0 && (
              <button
                onClick={reviveHere}
                className="rounded-xl bg-emerald-500 px-6 py-3 text-lg font-black text-black"
              >
                💖 USE EXTRA LIFE ({save.extraLives})
              </button>
            )}
            <button
              onClick={respawnAtCheckpoint}
              className="rounded-xl bg-primary px-8 py-3 text-lg font-black text-primary-foreground"
            >
              CONTINUE FROM CHECKPOINT
            </button>
            <button
              onClick={() => onQuit("map")}
              className="rounded-xl border-2 border-border bg-card px-6 py-3 text-lg font-bold text-foreground"
            >
              WORLD MAP
            </button>
          </div>
        </Overlay>
      )}

      {victory && (
        <Overlay>
          {victory.world === 1 ? (
            <>
              <h2 className="text-3xl font-black text-primary md:text-5xl">WORLD 1 COMPLETE!</h2>
              <p className="mt-3 text-xl font-black text-sky-300">🧊 ICE WORLD UNLOCKED!</p>
              <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
                Ice World is now playable on your world map. You kept the Legendary Fire Claw, the
                Mythic Firesauras card and all of your pets.
              </p>
            </>
          ) : victory.world === 2 ? (
            <>
              <h2 className="text-3xl font-black text-sky-300 md:text-5xl">WORLD 2 COMPLETE!</h2>
              <p className="mt-3 text-xl font-black text-emerald-300">🌴 POISON JUNGLE UNLOCKED!</p>
              <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
                You beat Glacierus and claimed the Legendary Ice Claw. World 3, the Poison Jungle,
                is now playable on your world map.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-black text-emerald-300 md:text-5xl">
                WORLD 3 COMPLETE!
              </h2>
              <p className="mt-3 text-xl font-black text-lime-300">🌴 VENOMUS IS YOUR PET!</p>
              <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
                You cleared the Poison Jungle, claimed the Legendary Vine Claw and can now replay
                any jungle level for bones.
              </p>
            </>
          )}
          <button
            onClick={() => onQuit("map")}
            className="mt-6 rounded-xl bg-primary px-8 py-3 text-lg font-black text-primary-foreground"
          >
            GO TO WORLD MAP
          </button>
        </Overlay>
      )}

      {paused && (
        <Overlay>
          <h2 className="text-3xl font-black text-foreground">PAUSED</h2>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => setPaused(false)}
              className="rounded-xl bg-primary px-10 py-3 text-lg font-black text-primary-foreground"
            >
              RESUME
            </button>
            <button
              onClick={() => {
                const s = !saveRef.current.sound;
                setSoundEnabled(s);
                update((v) => ({ ...v, sound: s }));
              }}
              className="rounded-xl border-2 border-border bg-card px-10 py-3 font-bold text-foreground"
            >
              SOUND: {save.sound ? "ON" : "OFF"}
            </button>
            <button
              onClick={() => onQuit("settings")}
              className="rounded-xl border-2 border-border bg-card px-10 py-3 font-bold text-foreground"
            >
              ⚙️ SETTINGS & CONTROLS
            </button>
            <button
              onClick={() => onQuit("camp")}
              className="rounded-xl border-2 border-border bg-card px-10 py-3 font-bold text-foreground"
            >
              🏕️ DINO CAMP
            </button>
            <button
              onClick={() => onQuit("map")}
              className="rounded-xl border-2 border-border bg-card px-10 py-3 font-bold text-foreground"
            >
              🗺️ WORLD MAP
            </button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-auto bg-black/80 p-4 backdrop-blur-sm">
      {children}
    </div>
  );
}

const ActionButton = memo(function ActionButton({
  label,
  onPress,
  onRelease,
  className = "",
  disabled,
  ready = 1,
}: {
  label: string;
  onPress: () => void;
  onRelease?: () => void;
  className?: string;
  disabled?: boolean;
  ready?: number;
}) {
  return (
    <button
      disabled={disabled}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLButtonElement).setPointerCapture?.(e.pointerId);
        initAudio();
        if (!disabled) onPress();
      }}
      onPointerUp={() => onRelease?.()}
      onPointerCancel={() => onRelease?.()}
      onPointerLeave={() => onRelease?.()}
      className={`relative touch-none rounded-full border-4 font-black text-foreground backdrop-blur-sm transition-transform active:scale-95 disabled:opacity-35 ${className}`}
      style={{ boxShadow: "0 4px 18px rgba(0,0,0,.5)" }}
    >
      <span className="relative z-10">{label}</span>
      <span
        className="pointer-events-none absolute inset-1 rounded-full bg-white/10"
        style={{ opacity: 1 - ready }}
      />
    </button>
  );
});

export { CARDS };
