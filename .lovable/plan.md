# Real running animation for the heroes

Right now each hero is a single frozen image that slides across the ground. This adds a proper run cycle so Rocket Boy and Pink Explorer actually pump their legs and arms while moving.

## What Henry will see

- Legs and arms cycle through a 4-step run whenever the hero moves, faster when moving fast.
- Standing still returns to a calm idle pose with a gentle breathing bob.
- Small dust puffs kick up from the feet while running, so the ground feels solid.
- Jumping holds a single airborne pose instead of running mid-air.

## Art

Generate one 4-frame run cycle sheet per hero, using the existing character art as the reference so the look stays identical:

- `src/assets/rocket-boy-run.png` — 4 frames side by side (contact, passing, stride, opposite passing), transparent background, same style and proportions as the current sprite.
- `src/assets/pink-explorer-run.png` — same treatment.

Each sheet is a single horizontal strip with evenly spaced frames so the engine can slice by index. The existing single images stay as the idle/portrait art, so menus, cards and character select are unchanged.

## Technical notes

- `src/game/content.ts`: add a `runSheet` field (image + frame count) to each `CharacterDef` and import the new art.
- `src/game/engine.ts`:
  - Load the run sheets alongside the other images in the constructor.
  - Track a `runPhase` accumulator advanced by the player's actual per-frame movement distance, so animation speed matches real speed (Rocket Boy's speed bonus reads as visibly faster legs).
  - Extend `drawSprite` with an optional source-rectangle argument so it can draw one frame out of a strip; existing callers keep working unchanged.
  - In `drawPlayer`: pick the run frame when moving on the ground, the static idle image when stopped, and a fixed stride frame while airborne (`pz > 0`).
  - Add a subtle idle bob and light dust particles at the feet on the frames where a foot plants.
- No changes to combat, controls, save data, or menus.