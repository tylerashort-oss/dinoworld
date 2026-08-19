import { useState } from "react";
import { ACTIONS, keyLabel, defaultKeybinds, type Keybinds } from "@/game/keybinds";

interface Step {
  icon: string;
  title: string;
  body: string;
  bullets?: string[];
}

const STEPS: Step[] = [
  {
    icon: "🕹️",
    title: "MOVE AROUND",
    body: "Put your thumb anywhere on the left half of the screen and drag. The joystick appears wherever you touch, so you never have to look down.",
    bullets: ["Drag further = run faster", "Lift your thumb to stop"],
  },
  {
    icon: "⚔️",
    title: "ATTACK",
    body: "Hold the ⚔ button on the right and your hero keeps swinging and firing bolts at the closest dinosaur — no tapping needed.",
    bullets: ["Damage numbers pop up on every hit", "Enemy health bars drain above their heads"],
  },
  {
    icon: "⬆️",
    title: "JUMP & DASH",
    body: "Tap ⬆ to hop over lava splashes and hazard pools. Pink Explorer can also dash for a quick dodge roll.",
  },
  {
    icon: "🦖",
    title: "YOUR PET",
    body: "Beat a mini-boss or boss and it joins you as a pet. Tap 🦖 to send it at an enemy — it also attacks on its own.",
    bullets: ["Pets have their own health bar", "If a pet goes DOWN it returns after 12 seconds"],
  },
  {
    icon: "🦴",
    title: "BONES & THE FORGE",
    body: "Dinos and crates drop bones. Spend them at Dino Camp's Bone Forge on max health, damage, pet power, extra lives and card packs.",
    bullets: ["Pink Explorer earns +50% bones and gets a shop discount", "Rocket Boy moves faster"],
  },
  {
    icon: "🚩",
    title: "LEVELS & CHECKPOINTS",
    body: "Each world has 7 levels: regular levels, a mini-boss gauntlet, a treasure vault and the world boss. Clearing a level refills your health.",
    bullets: ["Dying sends you back to your last mini-boss checkpoint", "Beat the boss to unlock the next world"],
  },
];

export function Tutorial({
  onClose,
  keybinds,
}: {
  onClose: () => void;
  keybinds?: Keybinds;
}) {
  const [i, setI] = useState(0);
  const [keys, setKeys] = useState(false);
  const step = STEPS[i]!;
  const kb = keybinds ?? defaultKeybinds();
  const last = i === STEPS.length - 1;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 p-4">
      <div className="w-full max-w-xl rounded-3xl border-2 border-primary/60 bg-card/95 p-6 text-center shadow-[0_0_50px_rgba(255,110,30,.25)]">
        {keys ? (
          <>
            <h2 className="text-2xl font-black text-primary">KEYBOARD CONTROLS</h2>
            <div className="mt-4 max-h-[45vh] space-y-1.5 overflow-auto text-left">
              {ACTIONS.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-black/40 px-3 py-2"
                >
                  <span className="text-sm font-bold text-foreground">{a.label}</span>
                  <span className="text-xs font-black tracking-wider text-primary">
                    {(kb[a.id] ?? []).map(keyLabel).join(" / ") || "—"}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setKeys(false)}
              className="mt-5 rounded-xl border-2 border-border bg-black/50 px-8 py-3 font-black text-foreground active:scale-95"
            >
              ← BACK
            </button>
          </>
        ) : (
          <>
            <div className="text-6xl">{step.icon}</div>
            <h2 className="mt-2 text-2xl font-black tracking-wide text-primary">{step.title}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">{step.body}</p>
            {step.bullets && (
              <ul className="mx-auto mt-3 max-w-md space-y-1 text-left text-xs text-amber-200">
                {step.bullets.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
            )}

            <div className="mt-5 flex items-center justify-center gap-1.5">
              {STEPS.map((s, n) => (
                <span
                  key={s.title}
                  className={`h-2 w-2 rounded-full ${n === i ? "bg-primary" : "bg-border"}`}
                />
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {i > 0 && (
                <button
                  onClick={() => setI(i - 1)}
                  className="rounded-xl border-2 border-border bg-black/50 px-6 py-3 font-black text-foreground active:scale-95"
                >
                  ← BACK
                </button>
              )}
              <button
                onClick={() => (last ? onClose() : setI(i + 1))}
                className="rounded-xl bg-primary px-10 py-3 text-lg font-black text-primary-foreground active:scale-95"
              >
                {last ? "LET'S PLAY!" : "NEXT →"}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-xs font-bold text-muted-foreground">
              <button onClick={() => setKeys(true)} className="underline">
                ⌨️ Keyboard controls
              </button>
              <button onClick={onClose} className="underline">
                Skip tutorial
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
