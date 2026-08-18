# Dino Quest: Four-Agent Review Results and Fix Plan

Four review passes ran against the code: functional QA, code review, regression, and performance. Nothing was changed. Below is what they found and what I propose to fix, in priority order.

## Critical

**1. Treasure chest can be farmed forever in Ice World and Poison Jungle**
The engine only remembers "chest already opened" for World 1's treasure room, because the check is hard-coded to that one area's id (`engine.ts:530`). World 2's `ice_treasure_room` and World 3's `vine_vault` never re-lock, so replaying that level grants the bones, cards and weapon upgrade again every single time. Fix: lock the chest whenever the area is flagged as a chest area, not by name.

**2. Replaying an old level rewinds your progress marker**
Picking an earlier cleared level writes into the same field that means "where you are now" (`routes/index.tsx:99-108`). After a replay, the World Map label and the big PLAY button send you back to the replayed level instead of your furthest one. Fix: keep "current level being played" separate from "furthest level reached", and have PLAY always resume at the frontier.

**3. Hidden caves re-announce themselves every replay**
`foundCaves` is hard-coded empty (`GameScreen.tsx:288`), so a cave you already looted still shows as "?" and re-fires the discovery reward. Fix: persist found caves in the save and pass them into the engine.

**4. Pink Explorer's dash is missing**
The planned double-tap dash exists nowhere in the code. Her other perks (bone bonus, discount, shield, magnet, double pet hits) are all present. Fix: implement the dash, since it is the mobility perk that made her viable against bosses.

## High

**5. World completion leaves progress data stale**
Beating a boss jumps straight to the world map, skipping the exit bookkeeping, so `progress` for that world stops short of the final area. Harmless today, a landmine later. Fix: advance progress/checkpoints on boss defeat.

**6. Corrupt or hand-edited save data can crash the game**
`loadSave()` blind-merges whatever JSON is in localStorage with no validation, and the `version: 3` field is never actually read. Fix: validate each field on load with a schema and fall back to defaults per field; make the version field do real work.

**7. Bones are tracked in two places at once**
The engine and the React save both hold a bone count and push values at each other on every event, which can stomp each other when two events land in one frame (`GameScreen.tsx:118, 165, 185`). Fix: make the engine the single source of truth during a run and sync on area exit/pause.

## Medium

**8. iPad frame hitches from garbage collection**
Particles, projectiles, damage numbers and eruptions are rebuilt with `.filter()` every frame even when empty (`engine.ts:1245, 1301, 1331, 1336`), and none of them have a hard cap. During boss fights and chest bursts this is the most likely cause of stutter on an iPad. Fix: compact arrays in place and cap cosmetic particle counts.

**9. Every sprite reloads on every level entry**
`preload()` creates fresh `Image` objects for all sprites and run sheets each time the game screen mounts (`engine.ts:441-454`), with no shared cache — so map -> game -> map re-decodes dozens of PNGs and pauses at level start. Fix: module-level image cache. Also add an `onerror` fallback so a failed sprite is visible instead of silently blank.

**10. HUD re-renders the whole game screen 10x a second**
Each HUD tick re-renders every button and overlay and re-scans the enemy list plus content tables. Fix: split the HUD into a memoized child and cache weapon/pet lookups.

**11. Joystick drops input on fast swipes**
`onPointerLeave` zeroes movement when the finger exits the widget's box mid-drag (`Joystick.tsx:65-67`). Fix: keep tracking a captured pointer and clamp instead of releasing.

## Low / hygiene

**12. Debug engine handle exposed in production** — `window.__dinoEngine` (`GameScreen.tsx:301`) should be dev-only.
**13. MCP tool inputs unvalidated** — `get_area` coerces raw strings into array indexes; add zod bounds and uniform error handling across all four tools.
**14. Sound effects allocate new audio nodes per hit** — rate-limit repeated `hit`/`hurt` sounds.

## Not bugs (confirmed working, listed so they aren't "fixed")

Hold-to-attack with auto-aim, run animations for heroes/enemies/pets, keybinds settings and joystick sizing, checkpoints and full heal on level clear, Ice/Poison worlds and their themed projectiles, Bone Forge and extra lives, level replay, pet selection, boiling lava and themed rocks — all present. Ice World's 2x HP is done via a per-world multiplier rather than doubled base stats; functionally the same. Animation loop cleanup, event listener removal and AudioContext handling are all correct.

## Suggested order of work

1. Critical items 1-4 (economy exploit, progress rewind, caves, dash)
2. High items 5-7 (save integrity and bone ownership)
3. Medium items 8-11 (iPad performance and joystick feel)
4. Hygiene 12-14

I can do all of it in one pass, or start with just the critical group so Henry gets the game-breaking fixes first.
