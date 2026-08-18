# Dino Quest: pets, difficulty, bone economy and level select

## 1. Pets get running legs
Pets reuse the existing enemy run sheets (mini fire raptor, fire utahraptor, mini frost raptor, frozen utahraptor). The pet gets the same distance-driven `runPhase` the heroes and dinos use, so it animates while following and while lunging, plus a small dust/frost puff on foot-plant.

## 2. Harder Ice World, and scaling difficulty going forward
- All ice enemy HP doubled (Frost Pterodactyl 70 to 140, Snowling 90 to 180, Mini Frost Raptor 460 to 920, Frozen Utahraptor 820 to 1640, Glacierus 2100 to 4200).
- Every ice level gets extra dinosaurs in each wave (roughly +2 to +3 per wave), with a denser final wave.
- A per-world difficulty multiplier is added to the engine (World 1 = 1x, World 2 = 2x, World 3 = 3x) so each future world automatically raises enemy health and enemy count. Bone rewards scale with it too, so harder worlds pay better.

## 3. Ice dinosaurs shoot ice, not fire
Projectiles and their trails become theme-aware: pale blue frost shards with icy sparkle particles and a frost-burst impact in Ice World, flame bolts in Volcanic Lands. Boss breath attacks match.

## 4. A real reason to collect bones: the Bone Forge in Dino Camp
Dino Camp gets a spend screen where bones buy permanent upgrades:
- Max Health +25 (repeatable, rising cost)
- Attack Damage +10% (repeatable, rising cost)
- Pet Power +20% and faster pet cooldown (repeatable)
- Extra Life: revive once per level instead of dropping to the checkpoint
- Card packs: gamble bones for a random card you are missing
Upgrades are saved and applied by the engine at level start, so bones always have somewhere to go.

## 5. Blizzard Pass gauntlet
Blizzard Pass becomes a mini-boss gauntlet: Mini Fire Raptor, Fire Utahraptor, Mini Frost Raptor and Frozen Utahraptor appear in sequence, one per wave, with adds between them. It stays a checkpoint level and pays a large bone bonus.

## 6. Why play Pink Explorer
Pink Explorer becomes the "rich and tough" hero rather than the slow one:
- Bones: +50% (kept) and bone pickups have a bigger magnet radius.
- Bone Forge upgrades cost her 25% less.
- She starts each level with a shield that absorbs one big hit and recharges between areas.
- Her pet strikes hit twice.
- Speed gap narrowed (she gets a short dash on double-tap of the joystick direction) so bosses are beatable.
Rocket Boy stays the speed/dodge hero, so it becomes a genuine choice.

## 7. Level replay after beating a world
Once a world is complete, the World Map shows a level list for that world. Any unlocked level can be replayed for bones and practice; boss and chest rewards already earned are not duplicated, but bones are.

## 8. Choose your pet in the card collection
The Card Collection gets a Pets section listing every unlocked pet with its damage and cooldown, and an EQUIP button. The equipped pet is highlighted and saved, and the in-game PET button uses it immediately.

## 9. Pets hit much harder
Pet damage roughly doubled (Mini Fire Raptor 16 to 34, Fire Utahraptor 30 to 60, Mini Frost Raptor 22 to 46, Frozen Utahraptor 38 to 78), cooldowns shortened, and pets also auto-attack a nearby enemy on their own timer so they contribute even when the button is not pressed. Pet strikes now show a damage number and knockback.

## Technical notes
- `src/game/content.ts`: pet run sheets, rebalanced pet stats, forge upgrade definitions.
- `src/game/engine.ts`: world difficulty multiplier, pet animation and auto-attack, theme-aware projectiles, applied save upgrades (max HP, damage, pet power, shield, magnet).
- `src/game/areas-ice.ts`: denser waves, Blizzard Pass gauntlet.
- `src/game/save.ts`: v3 fields for upgrades, extra lives, completed-level list (migrated from existing saves).
- `src/components/game/Menus.tsx`: Bone Forge, pet equip UI, level-select on the World Map.
