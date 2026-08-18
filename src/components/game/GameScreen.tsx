import { useCallback, useEffect, useRef, useState } from "react";
import { AREAS } from "@/game/areas";
import { GameEngine, type GameEvent, type HudState } from "@/game/engine";
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

export function GameScreen({
  save,
  setSave,
  onQuit,
}: {
  save: SaveData;
  setSave: (fn: (s: SaveData) => SaveData) => void;
  onQuit: (target: "map" | "camp") => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  const [hud, setHud] = useState<HudState | null>(null);
  const [reward, setReward] = useState<RewardOverlay | null>(null);
  const [dead, setDead] = useState(false);
  const [paused, setPaused] = useState(false);
  const [victory, setVictory] = useState(false);
  const transitioning = useRef(false);

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
    switch (ev.type) {
      case "bonesChanged":
        update((s) => ({ ...s, bones: ev.bones }));
        break;
      case "death":
        setDead(true);
        break;
      case "caveFound": {
        const card = getCard(ev.cardId);
        if (card) {
          update((s) => ({ ...s, cards: Array.from(new Set([...s.cards, card.id])) }));
          setReward({ title: "HIDDEN CAVE DISCOVERED!", subtitle: "A rare card was hiding in here.", cards: [card] });
        }
        break;
      }
      case "chestOpened": {
        const ids = ["card_fire_bone_axe", "card_baby_raptor", "card_mini_fire_raptor"];
        if (saveRef.current.character === "pink_explorer") ids.push("card_fire_utahraptor");
        const cards = ids.map(getCard).filter(Boolean) as CardDef[];
        const bonus = saveRef.current.character === "pink_explorer" ? 120 : 80;
        update((s) => ({
          ...s,
          cards: Array.from(new Set([...s.cards, ...ids])),
          weapons: Array.from(new Set([...s.weapons, "fire_bone_axe"])),
          equippedWeapon: s.equippedWeapon === "bone_sword" ? "fire_bone_axe" : s.equippedWeapon,
          bones: s.bones + bonus,
          flags: { ...s.flags, chestOpened: true },
        }));
        eng.setBones(saveRef.current.bones + bonus);
        if (saveRef.current.equippedWeapon === "bone_sword") eng.setWeapon("fire_bone_axe");
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
        if (ev.id === "mini_fire_raptor" || ev.id === "fire_utahraptor") {
          const petId = ev.id;
          const cardId = petId === "mini_fire_raptor" ? "card_mini_fire_raptor" : "card_fire_utahraptor";
          const gained = petId === "mini_fire_raptor" ? 40 : 70;
          update((s) => ({
            ...s,
            pets: Array.from(new Set([...s.pets, petId])),
            equippedPet: petId,
            cards: Array.from(new Set([...s.cards, cardId])),
            bones: s.bones + gained,
          }));
          eng.setPet(petId);
          eng.setBones(saveRef.current.bones + gained);
          const card = getCard(cardId);
          setReward({
            title: `${petId === "mini_fire_raptor" ? "MINI FIRE RAPTOR" : "FIRE UTAHRAPTOR"} DEFEATED!`,
            subtitle: "🦖 PET UNLOCKED! Press the PET button to make it attack.",
            cards: card ? [card] : [],
            bones: gained,
          });
        } else if (ev.id === "firesauras") {
          const ids = ["card_firesauras", "card_fire_claw"];
          update((s) => ({
            ...s,
            cards: Array.from(new Set([...s.cards, ...ids])),
            weapons: Array.from(new Set([...s.weapons, "fire_claw"])),
            equippedWeapon: "fire_claw",
            bones: s.bones + 300,
            world1Complete: true,
            world2Unlocked: true,
          }));
          eng.setWeapon("fire_claw");
          eng.setBones(saveRef.current.bones + 300);
          setReward({
            title: "FIRESAURAS DEFEATED!",
            subtitle: "MYTHIC card + LEGENDARY FIRE CLAW + 300 bones!",
            cards: ids.map(getCard).filter(Boolean) as CardDef[],
            bones: 300,
            finalVictory: true,
          });
        }
        break;
      }
      case "areaExit": {
        if (transitioning.current) return;
        transitioning.current = true;
        const next = ev.areaIndex + 1;
        if (next >= AREAS.length) {
          onQuit("map");
          return;
        }
        update((s) => ({ ...s, areaIndex: next }));
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
    const engine = new GameEngine({
      canvas,
      characterId: saveRef.current.character,
      weaponId: saveRef.current.equippedWeapon,
      petId: saveRef.current.equippedPet,
      areaIndex: saveRef.current.areaIndex,
      bones: saveRef.current.bones,
      openedChest: !!saveRef.current.flags["chestOpened"],
      foundCaves: {},
      onHud: setHud,
      onEvent: (e) => handleEvent.current(e),
    });
    engineRef.current = engine;
    (window as unknown as { __dinoEngine?: GameEngine }).__dinoEngine = engine;
    engine.start();
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const blocked = !!reward || dead || paused || victory;
  useEffect(() => {
    engineRef.current?.setPaused(blocked);
  }, [blocked]);

  const closeReward = () => {
    const wasFinal = reward?.finalVictory;
    setReward(null);
    if (wasFinal) setVictory(true);
  };

  const weapon = getWeapon(save.equippedWeapon);

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
          </div>
          <div className="flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-sm font-extrabold text-foreground">
            🦴 {save.bones}
          </div>
          <div className="rounded-full bg-black/45 px-3 py-0.5 text-[10px] font-bold tracking-widest text-primary">
            {hud?.areaName} · {hud?.areaSubtitle}
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
          <div className="text-xs font-black tracking-[0.2em] text-destructive drop-shadow">{hud.bossName}</div>
          <div className="mt-1 h-4 overflow-hidden rounded-full border-2 border-black/70 bg-black/70">
            <div
              className="h-full bg-gradient-to-r from-red-700 via-red-500 to-orange-400"
              style={{ width: `${(hud.bossHp / hud.bossMaxHp) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ---------- CONTROLS ---------- */}
      <div className="absolute bottom-4 left-4">
        <Joystick onChange={(v) => engineRef.current?.setInput(v)} />
      </div>

      <div className="absolute bottom-4 right-4 flex items-end gap-3">
        <div className="flex flex-col gap-3">
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
                <div className="text-[10px] font-bold tracking-widest text-amber-300/80">BONUS BONES</div>
              </div>
            ) : null}
          </div>
          <button onClick={closeReward} className="mt-6 rounded-xl bg-primary px-8 py-3 text-lg font-black text-primary-foreground">
            CONTINUE
          </button>
        </Overlay>
      )}

      {dead && !reward && (
        <Overlay>
          <h2 className="text-3xl font-black text-destructive md:text-5xl">YOU WERE DEFEATED</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your bones and cards are safe. Try the area again!</p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setDead(false);
                engineRef.current?.restartArea();
              }}
              className="rounded-xl bg-primary px-8 py-3 text-lg font-black text-primary-foreground"
            >
              TRY AGAIN
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
          <h2 className="text-3xl font-black text-primary md:text-5xl">WORLD 1 COMPLETE!</h2>
          <p className="mt-3 text-xl font-black text-sky-300">🧊 WORLD 2 UNLOCKED!</p>
          <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
            Ice World is now visible on your world map. You kept the Legendary Fire Claw, the Mythic Firesauras
            card and all of your pets.
          </p>
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
            <button onClick={() => setPaused(false)} className="rounded-xl bg-primary px-10 py-3 text-lg font-black text-primary-foreground">
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
            <button onClick={() => onQuit("camp")} className="rounded-xl border-2 border-border bg-card px-10 py-3 font-bold text-foreground">
              🏕️ DINO CAMP
            </button>
            <button onClick={() => onQuit("map")} className="rounded-xl border-2 border-border bg-card px-10 py-3 font-bold text-foreground">
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

function ActionButton({
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
}

export { CARDS };