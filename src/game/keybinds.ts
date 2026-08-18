export type ActionId =
  | "attack"
  | "pet"
  | "jump"
  | "dash"
  | "up"
  | "down"
  | "left"
  | "right"
  | "pause";

export type Keybinds = Record<ActionId, string[]>;

export interface ActionMeta {
  id: ActionId;
  label: string;
  hint: string;
}

export const ACTIONS: ActionMeta[] = [
  { id: "attack", label: "Attack", hint: "Hold to keep swinging" },
  { id: "pet", label: "Pet Attack", hint: "Send your pet at the nearest dino" },
  { id: "jump", label: "Jump", hint: "Hop over lava splashes" },
  { id: "dash", label: "Dash", hint: "Pink Explorer only — quick dodge roll" },
  { id: "up", label: "Move Up", hint: "" },
  { id: "down", label: "Move Down", hint: "" },
  { id: "left", label: "Move Left", hint: "" },
  { id: "right", label: "Move Right", hint: "" },
  { id: "pause", label: "Pause Menu", hint: "" },
];

export function defaultKeybinds(): Keybinds {
  return {
    attack: ["Space"],
    pet: ["Enter"],
    jump: ["ShiftLeft", "KeyX"],
    dash: ["KeyC"],
    up: ["KeyW", "ArrowUp"],
    down: ["KeyS", "ArrowDown"],
    left: ["KeyA", "ArrowLeft"],
    right: ["KeyD", "ArrowRight"],
    pause: ["Escape", "KeyP"],
  };
}

/** Human readable label for a KeyboardEvent.code */
export function keyLabel(code: string): string {
  if (code === "Space") return "SPACEBAR";
  if (code === "Enter") return "RETURN";
  if (code === "Escape") return "ESC";
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Arrow")) return code.slice(5).toUpperCase() + " ARROW";
  if (code === "ShiftLeft") return "LEFT SHIFT";
  if (code === "ShiftRight") return "RIGHT SHIFT";
  if (code === "ControlLeft" || code === "ControlRight") return "CTRL";
  if (code === "AltLeft" || code === "AltRight") return "ALT";
  return code.toUpperCase();
}

export function normalizeKeybinds(kb: Partial<Keybinds> | undefined): Keybinds {
  const base = defaultKeybinds();
  if (!kb) return base;
  for (const a of ACTIONS) {
    const v = kb[a.id];
    if (Array.isArray(v) && v.length > 0) base[a.id] = v.filter((k) => typeof k === "string");
  }
  return base;
}

/** Assign a key to an action, removing it from any other action first. */
export function rebind(kb: Keybinds, action: ActionId, code: string): Keybinds {
  const next: Keybinds = { ...kb };
  for (const a of ACTIONS) next[a.id] = (next[a.id] ?? []).filter((c) => c !== code);
  next[action] = [code];
  return next;
}
