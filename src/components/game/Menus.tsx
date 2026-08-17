import { useState } from "react";
import { CARDS, CHARACTERS, PETS, WEAPONS, getCharacter, getCard, type CardType } from "@/game/content";
import { AREAS } from "@/game/areas";
import type { SaveData } from "@/game/save";
import { GameCard } from "./GameCard";

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
  return (
    <Shell>
      <div className="flex min-h-[calc(100vh-2rem)] flex-col items-center justify-center gap-6 text-center">
        <div>
          <h1 className="title-glow text-5xl font-black tracking-[0.12em] text-primary md:text-7xl">DINO QUEST</h1>
          <p className="mt-2 text-lg font-bold tracking-[0.35em] text-amber-200 md:text-2xl">
            🌋 VOLCANIC LANDS
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {hasExisting && (
            <button onClick={onContinue} className="rounded-2xl bg-primary px-14 py-4 text-2xl font-black text-primary-foreground active:scale-95">
              CONTINUE
            </button>
          )}
          <button
            onClick={onNew}
            className="rounded-2xl border-2 border-primary/60 bg-black/50 px-14 py-4 text-2xl font-black text-foreground active:scale-95"
          >
            NEW GAME
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
          <button key={c.id} onClick={() => onPick(c.id)} className={`${panel} text-left active:scale-[.98]`}>
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
  onPlay,
  onCamp,
  onCollection,
  onMenu,
}: {
  save: SaveData;
  onPlay: () => void;
  onCamp: () => void;
  onCollection: () => void;
  onMenu: () => void;
}) {
  const area = AREAS[save.areaIndex];
  return (
    <Shell>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-primary">WORLD MAP</h2>
        <div className="flex gap-2">
          <button onClick={onCamp} className="rounded-xl border-2 border-border bg-card px-4 py-2 text-sm font-bold">
            🏕️ CAMP
          </button>
          <button onClick={onCollection} className="rounded-xl border-2 border-border bg-card px-4 py-2 text-sm font-bold">
            🃏 CARDS
          </button>
          <button onClick={onMenu} className="rounded-xl border-2 border-border bg-card px-4 py-2 text-sm font-bold">
            ☰
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className={panel}>
          <div className="text-xs font-black tracking-widest text-amber-300">WORLD 1</div>
          <div className="text-2xl font-black text-foreground">🌋 VOLCANIC LANDS</div>
          <div className="mt-1 text-xs font-bold text-primary">
            {save.world1Complete ? "COMPLETED" : "IN PROGRESS"} · {area?.name ?? ""}
          </div>
          <ol className="mt-3 space-y-1 text-xs">
            {AREAS.map((a, i) => (
              <li
                key={a.id}
                className={i === save.areaIndex ? "font-black text-primary" : i < save.areaIndex ? "text-emerald-400" : "text-muted-foreground"}
              >
                {i < save.areaIndex ? "✔" : i === save.areaIndex ? "▶" : "•"} {a.name}
              </li>
            ))}
          </ol>
          <button onClick={onPlay} className="mt-4 w-full rounded-xl bg-primary py-4 text-xl font-black text-primary-foreground active:scale-95">
            ▶ PLAY
          </button>
        </div>

        <div className={`${panel} ${save.world2Unlocked ? "" : "opacity-60"}`}>
          <div className="text-xs font-black tracking-widest text-sky-300">WORLD 2</div>
          <div className="text-2xl font-black text-foreground">❄️ ICE WORLD</div>
          <div className="mt-1 text-xs font-bold text-sky-300">
            {save.world2Unlocked ? "UNLOCKED — COMING SOON" : "LOCKED — defeat Firesauras to unlock"}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Frozen dinosaurs, ice caves and the Ice Claw await. Playable content arrives in the next update.
          </p>
        </div>
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
            CRAFTING: 🦴 Bones + 🔥 Volcano Fire → Fire Claw. 🦴 Bones + ❄️ Ice → Ice Claw (World 2).
          </div>
        </div>

        <div className={panel}>
          <div className="text-xs font-black tracking-widest text-amber-300">PETS</div>
          {save.pets.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">No pets yet — defeat Mini Fire Raptor to get one!</p>
          )}
          <div className="mt-2 space-y-2">
            {save.pets.map((id) => {
              const p = PETS[id];
              if (!p) return null;
              return (
                <button
                  key={id}
                  onClick={() => setSave((s) => ({ ...s, equippedPet: s.equippedPet === id ? null : id }))}
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
          <button onClick={onCollection} className="mt-3 w-full rounded-xl bg-primary py-3 font-black text-primary-foreground">
            🃏 CARD COLLECTION ({save.cards.length})
          </button>
        </div>
      </div>
    </Shell>
  );
}

export function Collection({ save, onBack }: { save: SaveData; onBack: () => void }) {
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