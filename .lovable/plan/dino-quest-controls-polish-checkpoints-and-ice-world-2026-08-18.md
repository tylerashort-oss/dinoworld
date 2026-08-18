# Dino Quest: controls, polish, checkpoints and Ice World

## 1. Keyboard controls (laptop)
- Spacebar becomes ATTACK (hold to auto-swing), Return becomes PET ATTACK.
- Jump moves to a dedicated key (default: W / Up-arrow is movement, so jump defaults to `Shift`), and all defaults are visible and changeable in settings.
- Default binds: Move = WASD + arrows, Attack = Space, Pet = Enter, Jump = Shift, Pause = Escape.
- Page scroll is suppressed while playing so Space never scrolls the page.

## 2. Settings screen
- New "Settings" entry on the main menu and in the in-game pause overlay.
- Lists every action with its current key, a "Change" button that captures the next key pressed, conflict detection (rebinding a key steals it from the other action), and "Reset to defaults".
- Also holds the sound toggle and joystick size (Small / Medium / Large).
- Binds persist in the existing local save so they survive reloads.

## 3. Dinosaurs that actually run
- Generate 4-frame run/flap sheets for Pterodactyl, Fire Hatchling, Mini Fire Raptor, Fire Utahraptor and Firesauras, matching the hero sheet format.
- Enemies use the same distance-driven run-cycle logic as the heroes: legs cycle with real movement speed, wings flap for fliers, dust puffs on footfalls for ground dinos, idle breathing when stationary.

## 4. Bigger joystick
- Joystick base grows from 150px to ~210px with a larger knob, and gains a generous invisible touch area in the bottom-left corner so a thumb landing near it still grabs it.
- Touch anywhere in that corner zone starts a "floating" joystick centered where the finger landed — no more missing the pad.
- Size adjustable in Settings.

## 5. Rocks and lava art pass
- Rocks: replace the flat blocks with layered volcanic basalt — cool grey-blue stone, cracked facets, moss/ash speckle, rim light from the lava and a soft cast shadow.
- Lava: animated boiling surface — scrolling flow noise, rising bubbles that pop, glowing crust cracks that shift, ember sparks drifting up and a heat-haze glow along the edges.

## 6. Checkpoints and healing
- Checkpoints are recorded when a mini-boss area is cleared (Mini Fire Raptor, Fire Utahraptor, and the equivalent bosses in Ice World).
- On death, the player restarts at the last checkpoint area at full health instead of resuming wherever they left off; areas before the checkpoint stay completed.
- Clearing any area restores health to 100%.
- Death overlay shows which checkpoint you'll return to.

## 7. Ice World (World 2) — full 7 areas
- Frozen Approach, Glacier Caverns, Frozen Bone Fields, Ice Mini-Boss Arena, Frozen Treasure Vault, Glacier Depths, and the World 2 boss arena.
- New hazards: ice slicks that reduce traction, freezing geysers (the ice analogue of eruptions), breakable ice walls.
- New enemies with generated art: Frost Pterodactyl, Ice Hatchling, Mini Frost Raptor (pet), Frozen Utahraptor (pet), and the Ice World boss.
- New loot: ice-themed weapon, new cards at each rarity, bone rewards.
- Beating the Ice boss marks World 2 complete and reveals World 3 on the map.

## 8. World 3 placeholder
- Poison Jungle Forest appears on the world map as a locked "Coming soon" tile once Ice World is complete, so the path forward is visible. Full build in a later pass.

## Technical notes
- Keybinds live in a new `src/game/keybinds.ts` with defaults + save persistence; `engine.ts` key handling reads from the bound map instead of hardcoded letters.
- Enemy run sheets registered alongside the existing `RUN_SHEETS`, with a shared frame-clipping draw path already present in `drawSprite`.
- Lava/rock rendering stays procedural canvas drawing (no new images) so it animates per frame.
- Checkpoints add `checkpointArea` and `world2AreaIndex` style fields to the save with backward-compatible defaults.
- Ice World areas go in a new `src/game/areas-ice.ts`, with `areas.ts` exporting a world-indexed lookup so the engine can load either world.
