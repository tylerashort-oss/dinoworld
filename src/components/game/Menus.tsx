import { useEffect, useState } from "react";
import {
  CARDS,
  CARD_PACK_COST,
  CHARACTERS,
  EXTRA_LIFE_COST,
  UPGRADES,
  WEAPONS,
  getCharacter,
  getCard,
  ownedPets,
  upgradeCost,
  type CardType,
} from "@/game/content";
import { WORLDS } from "@/game/worlds";
import { ACTIONS, keyLabel, rebind, defaultKeybinds, type ActionId } from "@/game/keybinds";
import type { SaveData } from "@/game/save";
import { GameCard } from "./GameCard";
import { Tutorial } from "./Tutorial";

const panel =
  "rounded-2xl border-2 border-border/70 bg-card/80 p-4 shadow-[0_0_30px_rgba(255,110,30,.12)] backdrop-blur";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="volcanic-bg h-full w-full overflow-auto">
      <div className="mx-auto min-h-full w-full max-w-5xl p-4">{children}</div>
    </div>
  );
}

export function MainMenu({
  hasExisting,
  onNew,
  onContinue,
}: {
  hasExisting: boolean;
  onNew: () => void;
  onContinue: () => void;
}) {
  const [showTutorial, setShowTutorial] = useState(false);
  return (
    <Shell>
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
      <div className="flex min-h-[calc(100vh-2rem)] flex-col items-center justify-center gap-6 text-center">
        <div>
          <h1 className="title-glow text-5xl font-black tracking-[0.12em] text-primary md:text-7xl">
            DINO QUEST
          </h1>
          <p className="mt-2 text-lg font-bold tracking-[0.35em] text-amber-200 md:text-2xl">
            🌋 VOLCANIC LANDS
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {hasExisting && (
            <button
              onClick={onContinue}
              className="rounded-2xl bg-primary px-14 py-4 text-2xl font-black text-primary-foreground active:scale-95"
            >
              CONTINUE
            </button>
          )}
          <button
            onClick={onNew}
            className="rounded-2xl border-2 border-primary/60 bg-black/50 px-14 py-4 text-2xl font-black text-foreground active:scale-95"
          >
            NEW GAME
          </button>
          <button
            onClick={() => setShowTutorial(true)}
            className="rounded-2xl border-2 border-border bg-black/40 px-14 py-3 text-lg font-black text-foreground active:scale-95"
          >
            ❓ HOW TO PLAY
          </button>
        </div>
        <p className="max-w-md text-xs text-muted-foreground">
          Best on iPad in landscape. Joystick to move, ⚔ to attack, ⬆ to jump, 🦖 for your pet.
        </p>
      </div>
    </Shell>
  );
}

export function CharacterSelect({
  onPick,
  onBack,
}: {
  onPick: (id: "rocket_boy" | "pink_explorer") => void;
  onBack: () => void;
}) {
  return (
    <Shell>
      <button onClick={onBack} className="mb-3 text-sm font-bold text-muted-foreground">
        ← Back
      </button>
      <h2 className="text-center text-3xl font-black text-primary">CHOOSE YOUR HERO</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {Object.values(CHARACTERS).map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c.id)}
            className={`${panel} text-left active:scale-[.98]`}
          >
            <div className="flex items-center gap-4">
              <img src={c.art} alt={c.name} className="h-40 w-32 object-contain" />
              <div>
                <div className="text-2xl font-black text-foreground">{c.name}</div>
                <div className="mt-1 text-xs font-bold tracking-wider text-primary">{c.trait}</div>
                <p className="mt-2 text-xs text-muted-foreground">{c.blurb}</p>
                <div className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-black text-primary-foreground">
                  PLAY AS {c.name.toUpperCase()}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </Shell>
  );
}

export function WorldMap({
  save,
  setSave,
  onPlay,
  onCamp,
  onCollection,
  onSettings,
  onMenu,
}: {
  save: SaveData;
  setSave: (fn: (s: SaveData) => SaveData) => void;
  onPlay: (worldId: number, areaIndex?: number) => void;
  onCamp: () => void;
  onCollection: () => void;
  onSettings: () => void;
  onMenu: () => void;
}) {
  const currentWorld = save.world ?? 1;
  return (
    <Shell>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-primary">WORLD MAP</h2>
        <div className="flex gap-2">
          <button
            onClick={onCamp}
            className="rounded-xl border-2 border-border bg-card px-4 py-2 text-sm font-bold"
          >
            🏕️ CAMP
          </button>
          <button
            onClick={onCollection}
            className="rounded-xl border-2 border-border bg-card px-4 py-2 text-sm font-bold"
          >
            🃏 CARDS
          </button>
          <button
            onClick={onSettings}
            className="rounded-xl border-2 border-border bg-card px-4 py-2 text-sm font-bold"
          >
            ⚙️ SETTINGS
          </button>
          <button
            onClick={onMenu}
            className="rounded-xl border-2 border-border bg-card px-4 py-2 text-sm font-bold"
          >
            ☰
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {WORLDS.map((w) => {
          const key = String(w.id);
          const unlocked = !w.unlockFlag || !!save[w.unlockFlag];
          // "at" is the frontier level, never the level currently being replayed.
          const at = save.progress?.[key] ?? 0;
          const complete = !!save[w.completeFlag];
          return (
            <div key={w.id} className={`${panel} ${unlocked ? "" : "opacity-60"}`}>
              <div className="text-xs font-black tracking-widest text-amber-300">WORLD {w.id}</div>
              <div className="text-2xl font-black text-foreground">
                {w.emoji} {w.name}
              </div>
              <div className="mt-1 text-xs font-bold text-primary">
                {!unlocked
                  ? w.unlockHint
                  : complete
                    ? "COMPLETED"
                    : `IN PROGRESS · ${w.areas[at]?.name ?? w.areas[0]?.name}`}
              </div>
              <ol className="mt-3 space-y-1 text-xs">
                {w.areas.map((a, i) => (
                  <li key={a.id}>
                    <button
                      disabled={!unlocked || !(complete || i <= (save.progress?.[key] ?? 0))}
                      onClick={() => onPlay(w.id, i)}
                      className={`w-full rounded-lg px-2 py-1 text-left disabled:opacity-60 ${
                        unlocked && i === at
                          ? "bg-primary/20 font-black text-primary"
                          : unlocked && i < at
                            ? "text-emerald-400 hover:bg-white/5"
                            : "text-muted-foreground"
                      }`}
                    >
                      {unlocked && i < at ? "✔" : unlocked && i === at ? "▶" : "•"} {a.name}
                      {a.checkpoint ? " ⛳" : ""}
                      {(complete || i < at) && unlocked ? " · REPLAY" : ""}
                    </button>
                  </li>
                ))}
              </ol>
              {complete && (
                <p className="mt-2 text-[10px] font-bold text-emerald-300">
                  World complete — tap any level above to replay it.
                </p>
              )}
              <button
                disabled={!unlocked}
                onClick={() => onPlay(w.id)}
                className="mt-4 w-full rounded-xl bg-primary py-4 text-xl font-black text-primary-foreground active:scale-95 disabled:opacity-40"
              >
                {unlocked ? "▶ PLAY" : "🔒 LOCKED"}
              </button>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

export function DinoCamp({
  save,
  setSave,
  onBack,
  onCollection,
}: {
  save: SaveData;
  setSave: (fn: (s: SaveData) => SaveData) => void;
  onBack: () => void;
  onCollection: () => void;
}) {
  const ch = getCharacter(save.character);
  return (
    <Shell>
      <button onClick={onBack} className="mb-3 text-sm font-bold text-muted-foreground">
        ← Back
      </button>
      <h2 className="text-3xl font-black text-primary">🏕️ DINO CAMP</h2>
      <p className="text-xs text-muted-foreground">Your home base between adventures.</p>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className={panel}>
          <div className="text-xs font-black tracking-widest text-amber-300">HERO</div>
          <img src={ch.art} alt={ch.name} className="mx-auto h-40 object-contain" />
          <div className="text-center text-xl font-black">{ch.name}</div>
          <div className="text-center text-[11px] font-bold text-primary">{ch.trait}</div>
          <div className="mt-3 flex justify-center gap-2">
            {Object.values(CHARACTERS).map((c) => (
              <button
                key={c.id}
                onClick={() => setSave((s) => ({ ...s, character: c.id }))}
                className={`rounded-lg px-3 py-2 text-xs font-bold ${c.id === save.character ? "bg-primary text-primary-foreground" : "border border-border bg-card"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="mt-3 text-center text-lg font-black text-amber-200">🦴 {save.bones}</div>
        </div>

        <div className={panel}>
          <div className="text-xs font-black tracking-widest text-amber-300">WEAPONS</div>
          <div className="mt-2 space-y-2">
            {Object.values(WEAPONS).map((w) => {
              const owned = save.weapons.includes(w.id);
              return (
                <button
                  key={w.id}
                  disabled={!owned}
                  onClick={() => setSave((s) => ({ ...s, equippedWeapon: w.id }))}
                  className={`w-full rounded-xl border-2 p-2 text-left text-xs disabled:opacity-40 ${save.equippedWeapon === w.id ? "border-primary bg-primary/20" : "border-border bg-black/30"}`}
                >
                  <div className="font-black text-foreground">{w.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {owned ? `DMG ${w.damage} · Range ${w.range}` : "Locked"}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 rounded-xl border border-dashed border-border p-2 text-[10px] text-muted-foreground">
            CRAFTING: 🦴 Bones + 🔥 Volcano Fire → Fire Claw. 🦴 Bones + ❄️ Ice → Ice Claw (World
            2).
          </div>
        </div>

        <div className={panel}>
          <div className="text-xs font-black tracking-widest text-amber-300">PETS</div>
          {ownedPets(save.pets, save.cards).length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              No pets yet — defeat Mini Fire Raptor to get one!
            </p>
          )}
          <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
            {ownedPets(save.pets, save.cards).map((p) => {
              const id = p.id;
              return (
                <button
                  key={id}
                  onClick={() =>
                    setSave((s) => ({ ...s, equippedPet: s.equippedPet === id ? null : id }))
                  }
                  className={`flex w-full items-center gap-2 rounded-xl border-2 p-2 text-left ${save.equippedPet === id ? "border-primary bg-primary/20" : "border-border bg-black/30"}`}
                >
                  <img src={p.art} alt={p.name} className="h-12 w-12 object-contain" />
                  <div>
                    <div className="text-xs font-black">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      DMG {p.damage} · {save.equippedPet === id ? "EQUIPPED" : "tap to equip"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={onCollection}
            className="mt-3 w-full rounded-xl bg-primary py-3 font-black text-primary-foreground"
          >
            🃏 CARD COLLECTION ({save.cards.length})
          </button>
        </div>
      </div>

      <BoneForge save={save} setSave={setSave} />
    </Shell>
  );
}

function BoneForge({
  save,
  setSave,
}: {
  save: SaveData;
  setSave: (fn: (s: SaveData) => SaveData) => void;
}) {
  const pink = save.character === "pink_explorer";
  const discount = pink ? 0.25 : 0;
  const levels = save.upgrades ?? {};

  const buy = (id: string, cost: number) =>
    setSave((s) => {
      if (s.bones < cost) return s;
      return {
        ...s,
        bones: s.bones - cost,
        upgrades: { ...s.upgrades, [id]: (s.upgrades?.[id] ?? 0) + 1 },
      };
    });

  const buyLife = () =>
    setSave((s) =>
      s.bones < Math.round(EXTRA_LIFE_COST * (1 - discount))
        ? s
        : {
            ...s,
            bones: s.bones - Math.round(EXTRA_LIFE_COST * (1 - discount)),
            extraLives: (s.extraLives ?? 0) + 1,
          },
    );

  const packCost = Math.round(CARD_PACK_COST * (1 - discount));
  const buyPack = () =>
    setSave((s) => {
      if (s.bones < packCost) return s;
      const missing = Object.values(CARDS).filter((c) => !s.cards.includes(c.id));
      if (missing.length === 0) return s;
      const pick = missing[Math.floor(Math.random() * missing.length)]!;
      return { ...s, bones: s.bones - packCost, cards: [...s.cards, pick.id] };
    });

  return (
    <div className={`${panel} mt-4`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black tracking-widest text-amber-300">🔥 BONE FORGE</div>
          <p className="text-xs text-muted-foreground">
            Spend your bones on permanent upgrades. They work in every world, forever.
          </p>
        </div>
        <div className="text-2xl font-black text-amber-200">🦴 {save.bones}</div>
      </div>
      {pink && (
        <p className="mt-2 rounded-lg bg-pink-500/15 px-3 py-2 text-[11px] font-bold text-pink-200">
          Pink Explorer perk: +50% bones, 25% cheaper forge prices, a shield each level, double pet
          strikes and a bigger bone magnet.
        </p>
      )}
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {UPGRADES.map((u) => {
          const lvl = levels[u.id] ?? 0;
          const maxed = lvl >= u.max;
          const cost = upgradeCost(u, lvl, discount);
          return (
            <div key={u.id} className="rounded-xl border-2 border-border bg-black/30 p-3">
              <div className="text-sm font-black text-foreground">
                {u.emoji} {u.name}
              </div>
              <div className="text-[11px] text-muted-foreground">{u.description}</div>
              <div className="mt-1 text-[11px] font-bold text-primary">
                LEVEL {lvl} / {u.max}
              </div>
              <button
                disabled={maxed || save.bones < cost}
                onClick={() => buy(u.id, cost)}
                className="mt-2 w-full rounded-lg bg-primary py-2 text-sm font-black text-primary-foreground disabled:opacity-40"
              >
                {maxed ? "MAXED OUT" : `UPGRADE · 🦴 ${cost}`}
              </button>
            </div>
          );
        })}
        <div className="rounded-xl border-2 border-border bg-black/30 p-3">
          <div className="text-sm font-black text-foreground">💖 Extra Life</div>
          <div className="text-[11px] text-muted-foreground">
            Get back up right where you fell instead of returning to the checkpoint.
          </div>
          <div className="mt-1 text-[11px] font-bold text-primary">
            IN STOCK: {save.extraLives ?? 0}
          </div>
          <button
            disabled={save.bones < Math.round(EXTRA_LIFE_COST * (1 - discount))}
            onClick={buyLife}
            className="mt-2 w-full rounded-lg bg-emerald-500 py-2 text-sm font-black text-black disabled:opacity-40"
          >
            BUY · 🦴 {Math.round(EXTRA_LIFE_COST * (1 - discount))}
          </button>
        </div>
        <div className="rounded-xl border-2 border-border bg-black/30 p-3">
          <div className="text-sm font-black text-foreground">🃏 Card Pack</div>
          <div className="text-[11px] text-muted-foreground">
            Trade bones for a card you have not collected yet.
          </div>
          <button
            disabled={save.bones < packCost}
            onClick={buyPack}
            className="mt-2 w-full rounded-lg bg-sky-500 py-2 text-sm font-black text-black disabled:opacity-40"
          >
            OPEN PACK · 🦴 {packCost}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Collection({
  save,
  setSave,
  onBack,
}: {
  save: SaveData;
  setSave: (fn: (s: SaveData) => SaveData) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<CardType>("CHARACTER");
  const owned = save.cards.map(getCard).filter(Boolean);
  const all = Object.values(CARDS).filter((c) => c.type === tab);
  return (
    <Shell>
      <button onClick={onBack} className="mb-3 text-sm font-bold text-muted-foreground">
        ← Back
      </button>
      <h2 className="text-3xl font-black text-primary">🃏 CARD COLLECTION</h2>
      <div className="mt-3 flex gap-2">
        {(["CHARACTER", "WEAPON", "PET"] as CardType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-xs font-black ${tab === t ? "bg-primary text-primary-foreground" : "border-2 border-border bg-card"}`}
          >
            {t}S
          </button>
        ))}
      </div>
      {tab === "PET" && (
        <div className={`${panel} mt-4`}>
          <div className="text-xs font-black tracking-widest text-amber-300">
            🦖 CHOOSE YOUR PET
          </div>
          {ownedPets(save.pets, save.cards).length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              No pets yet — beat a mini boss to make it join you.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {ownedPets(save.pets, save.cards).map((p) => {
                const id = p.id;
                return (
                  <button
                    key={id}
                    onClick={() =>
                      setSave((s) => ({ ...s, equippedPet: s.equippedPet === id ? null : id }))
                    }
                    className={`flex items-center gap-2 rounded-xl border-2 p-2 text-left ${save.equippedPet === id ? "border-primary bg-primary/20" : "border-border bg-black/30"}`}
                  >
                    <img src={p.art} alt={p.name} className="h-12 w-12 object-contain" />
                    <div>
                      <div className="text-xs font-black">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        DMG {p.damage} · {save.equippedPet === id ? "EQUIPPED" : "tap to equip"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-3 pb-8">
        {all.map((c) =>
          owned.some((o) => o?.id === c.id) ? (
            <GameCard key={c.id} card={c} />
          ) : (
            <div
              key={c.id}
              className="flex h-[214px] w-[150px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-black/40 text-muted-foreground"
            >
              <div className="text-3xl">?</div>
              <div className="mt-2 text-[10px] font-bold tracking-widest">NOT FOUND YET</div>
            </div>
          ),
        )}
      </div>
    </Shell>
  );
}
export function SettingsScreen({
  save,
  setSave,
  onBack,
}: {
  save: SaveData;
  setSave: (fn: (s: SaveData) => SaveData) => void;
  onBack: () => void;
}) {
  const [listening, setListening] = useState<ActionId | null>(null);

  useEffect(() => {
    if (!listening) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.code === "Escape" && listening !== "pause") {
        setListening(null);
        return;
      }
      setSave((s) => ({ ...s, keybinds: rebind(s.keybinds, listening, e.code) }));
      setListening(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [listening, setSave]);

  const joy = save.joystickSize ?? 210;

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-primary">SETTINGS & CONTROLS</h2>
        <button
          onClick={onBack}
          className="rounded-xl border-2 border-border bg-card px-4 py-2 text-sm font-bold"
        >
          ← BACK
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className={panel}>
          <div className="text-xs font-black tracking-widest text-amber-300">
            ⌨️ KEYBOARD (LAPTOP)
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Click a key box, then press the key you want to use for that action.
          </p>
          <div className="mt-3 space-y-2">
            {ACTIONS.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-black/30 px-3 py-2"
              >
                <div>
                  <div className="text-sm font-black text-foreground">{a.label}</div>
                  {a.hint && <div className="text-[10px] text-muted-foreground">{a.hint}</div>}
                </div>
                <button
                  onClick={() => setListening(a.id)}
                  className={`min-w-[130px] rounded-lg border-2 px-3 py-2 text-xs font-black ${
                    listening === a.id
                      ? "animate-pulse border-primary bg-primary/25 text-primary"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  {listening === a.id
                    ? "PRESS A KEY…"
                    : save.keybinds[a.id].map(keyLabel).join(" / ")}
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setSave((s) => ({ ...s, keybinds: defaultKeybinds() }))}
            className="mt-3 w-full rounded-xl border-2 border-border bg-card py-2 text-sm font-bold"
          >
            RESET TO DEFAULTS (SPACE = attack, RETURN = pet)
          </button>
        </div>

        <div className={panel}>
          <div className="text-xs font-black tracking-widest text-sky-300">📱 IPAD & SOUND</div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm font-black text-foreground">
              <span>Joystick size</span>
              <span className="text-primary">{joy}px</span>
            </div>
            <input
              type="range"
              min={150}
              max={300}
              step={10}
              value={joy}
              onChange={(e) => setSave((s) => ({ ...s, joystickSize: Number(e.target.value) }))}
              className="mt-2 w-full accent-orange-500"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              The whole bottom-left corner is a touch zone — the joystick appears wherever your
              thumb lands.
            </p>
            <div className="mt-4 flex justify-center">
              <div
                className="rounded-full border-4 border-primary/40 bg-black/40"
                style={{ width: joy * 0.7, height: joy * 0.7 }}
              />
            </div>
          </div>
          <button
            onClick={() => setSave((s) => ({ ...s, sound: !s.sound }))}
            className="mt-5 w-full rounded-xl border-2 border-border bg-card py-3 font-bold"
          >
            SOUND: {save.sound ? "ON" : "OFF"}
          </button>
        </div>
      </div>
    </Shell>
  );
}
