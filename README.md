# Dino Quest Saga

I want you to build a REAL, PLAYABLE, iPad-first browser video game.

This is a father/son project that I am building with my 7.5-year-old son, Henry. The goal of this first version is not to create a marketing website or a mockup. The goal is to create an actual playable game that Henry can open on an iPad in Safari and play with touch controls.

IMPORTANT:

DO NOT build a static website that merely looks like a game.

DO NOT build a clickable prototype.

DO NOT make the combat simulated or decorative.

DO NOT require a keyboard to play.

DO NOT make the attack button merely trigger an animation.

DO NOT leave core game mechanics as placeholders.

Build the actual playable MVP.

==================================================

GAME NAME

==================================================

DINO QUEST

World 1:

VOLCANIC LANDS

The overall game is a fantasy/action dungeon-crawler with exploration, combat, collectible characters, weapons, pets, cards, bosses, crafting, and progressively unlocked worlds.

The game is inspired by the GENERAL GAMEPLAY CHARACTERISTICS of family-friendly dungeon crawler games such as Minecraft Dungeons:

- top-down / isometric-style action

- exploration

- combat

- enemies

- loot

- collectible characters

- weapons

- pets/companions

- bosses

- multiple worlds

- progressively stronger equipment

- secrets and treasure

- simple controls

- satisfying progression

IMPORTANT:

Do not copy Minecraft's copyrighted assets, characters, textures, UI, logos, names, or exact visual design.

This must be its own original game called Dino Quest.

==================================================

PRIMARY GOAL OF THIS MVP

==================================================

The player must be able to:

1. Choose a human character.

2. Enter World 1: Volcanic Lands.

3. Move around using an iPad touchscreen joystick.

4. Attack enemies using a clearly functioning touchscreen attack button.

5. Actually damage enemies.

6. See enemies lose health.

7. See the player's attacks visibly connect.

8. Dodge enemy attacks.

9. Take damage when hit.

10. Collect dinosaur bones.

11. Fight dinosaur enemies.

12. Fight Mini Fire Raptor.

13. Defeat Mini Fire Raptor.

14. Receive Mini Fire Raptor as a collectible pet.

15. Continue through the world.

16. Fight Fire Utahraptor.

17. Defeat Fire Utahraptor.

18. Receive Fire Utahraptor as a collectible pet.

19. Enter a treasure room.

20. Receive multiple collectible cards.

21. Enter the volcano.

22. Fight the final boss Firesauras.

23. Defeat Firesauras.

24. Receive a Mythic Firesauras card.

25. Receive the Legendary Fire Claw.

26. Unlock World 2: Ice World.

This entire gameplay loop must work.

==================================================

PLATFORM REQUIREMENT — VERY IMPORTANT

==================================================

PRIMARY DEVICE:

Apple iPad using Safari.

The game must be designed MOBILE-FIRST and TOUCH-FIRST.

Henry must NOT need a keyboard.

All essential gameplay must be possible using touchscreen controls.

The game should work in landscape orientation.

When opened on an iPad in portrait orientation, show a friendly message:

"Please turn your iPad sideways to play Dino Quest."

Then allow the game to run normally in landscape orientation.

DESKTOP SUPPORT:

Desktop keyboard controls may also exist for testing, but they are secondary.

Keyboard controls:

WASD / Arrow Keys = movement

Space = jump

J or left mouse button = attack

K = pet attack

However, the game must be fully playable without a keyboard.

==================================================

TECHNICAL ARCHITECTURE

==================================================

Use a real browser game engine rather than trying to fake game behavior with ordinary webpage elements.

Preferred architecture:

- React for the application shell/UI

- Phaser 3 for the actual game engine/gameplay

- HTML5 Canvas/WebGL rendering

- Responsive design

- Touch/pointer input

- Local browser storage for MVP progression

If Phaser 3 creates unnecessary complexity in the Lovable environment, use a clean custom Canvas game engine instead.

DO NOT sacrifice reliable gameplay just to use a particular framework.

The game should be structured so that we can expand it later.

Keep game systems modular:

- Player

- Characters

- Enemies

- Weapons

- Pets

- Cards

- Inventory

- Currency

- Levels

- Bosses

- World progression

- Crafting

- Save state

- UI

- Touch controls

==================================================

NO BACKEND REQUIRED FOR MVP

==================================================

Do NOT add authentication.

Do NOT require users to create accounts.

Do NOT add a database unless it is absolutely necessary.

For this MVP, use localStorage or another browser-local persistence mechanism to save:

- selected character

- unlocked characters

- bones

- weapons

- pets

- cards

- world progress

- unlocked World 2

This is a family testing prototype.

The priority is:

FAST + PLAYABLE + RELIABLE.

We can add accounts/cloud saves later.

==================================================

GAME CAMERA

==================================================

Use a top-down / slightly angled dungeon-crawler camera.

The player should remain reasonably near the center of the screen while the environment moves around the player.

The world should feel larger than the screen.

Do NOT make the entire level fit on one screen.

Use a camera that follows the player.

==================================================

CHARACTERS

==================================================

There are initially two playable human characters.

They should look like actual young human adventurers.

Do NOT use emoji as the final character graphics.

Do NOT use placeholder circles.

Do NOT use crude stick figures.

Generate or create original game assets that are visually consistent.

The characters should have a realistic-looking, polished adventure-game appearance while remaining appropriate for children.

------------------------------------------

CHARACTER 1 — ROCKET BOY

------------------------------------------

Age: 8

Boy.

Brown hair.

Brown eyes.

Athletic shorts.

Athletic shirt with a rocket graphic on it.

Green tennis shoes.

He wears a hat that is ON FIRE.

The flames do not hurt him.

His flaming hat is an important visual identity.

Gameplay trait:

FAST CHARACTER.

Give him approximately a 10–15% movement-speed advantage.

He is the default character.

------------------------------------------

CHARACTER 2 — PINK EXPLORER

------------------------------------------

Age: 5

Girl.

Blond hair.

Blue eyes.

Pink T-shirt.

Pink shorts.

Purple tennis shoes.

Gameplay trait:

TREASURE CHARACTER.

Give her a modest advantage when finding loot/cards.

Do not make her dramatically stronger than Rocket Boy.

Both characters must be viable.

==================================================

WORLD 1 — VOLCANIC LANDS

==================================================

World 1 is a volcanic dinosaur world.

The entire world should visually communicate:

- volcanoes

- lava

- black volcanic rock

- red/orange glowing lava

- smoke

- ash

- dinosaur bones

- caves

- treasure

- fire

- dangerous terrain

The final boss lives INSIDE the volcano.

==================================================

LEVEL STRUCTURE

==================================================

World 1 should contain several connected gameplay areas.

Suggested progression:

AREA 1:

Lava Fields

AREA 2:

Volcanic Caverns

AREA 3:

Dinosaur Bone Fields

AREA 4:

Mini-Boss Arena

AREA 5:

Treasure Room

AREA 6:

Volcano Interior

AREA 7:

Firesauras Boss Arena

The player should feel like they are progressing through a real world rather than simply fighting enemies on a static screen.

==================================================

ENVIRONMENTAL GAMEPLAY

==================================================

Lava is dangerous.

Implement:

1. Lava pools damage the player.

2. Some paths are blocked by lava.

3. Lava eruptions periodically occur.

4. The player can jump over small lava gaps.

5. Certain weapons can interact with fire.

6. Hidden caves contain rare cards.

7. Dinosaur bones are scattered throughout the world.

8. The final boss lives inside the volcano.

IMPORTANT:

Environmental hazards must be REAL gameplay mechanics.

Do not simply draw lava and call it dangerous.

If the player walks into a lava pool, the player should lose health.

If an eruption occurs, there should be a visible warning and then a damaging event.

Small lava gaps should be jumpable.

==================================================

PLAYER MOVEMENT

==================================================

Movement must feel responsive.

On iPad:

Left virtual joystick.

The joystick should support:

- touch

- drag

- diagonal movement

- smooth movement

- immediate release/reset

The joystick must not interfere with the rest of the screen.

Movement should work at different iPad screen sizes.

==================================================

COMBAT — THIS IS EXTREMELY IMPORTANT

==================================================

Combat must ACTUALLY WORK.

This was a major problem in an earlier prototype.

The player must have a real attack system.

When the player presses ATTACK:

1. The player performs an attack animation.

2. A weapon hitbox is created.

3. The hitbox checks for enemy collision.

4. If an enemy is within the attack area, the enemy loses health.

5. The enemy's health bar visibly decreases.

6. A hit effect appears.

7. The enemy reacts to the hit.

8. Damage numbers may appear.

9. The attack has a cooldown so the player cannot attack infinitely fast.

The attack must NOT simply play an animation.

The attack must NOT depend on keyboard input.

The attack must work from the iPad touchscreen.

The attack button must be large and easy for a child to press.

Use a clear button labeled:

⚔ ATTACK

The attack should work even when the player is moving.

==================================================

COMBAT TEST REQUIREMENT

==================================================

Before considering the MVP complete, explicitly test this:

Spawn a Pterodactyl approximately 100–200 pixels away from the player.

Press the touchscreen ATTACK button.

The attack must visibly travel or extend toward the enemy OR produce a clearly defined melee hitbox.

The enemy must lose HP.

The enemy health bar must decrease.

The enemy must eventually die if attacked enough times.

If this does not work, DO NOT consider the MVP complete.

==================================================

PLAYER HEALTH

==================================================

Player starts with 100 HP.

Display a health bar prominently.

When the player is hit:

- health decreases

- player briefly flashes or otherwise indicates damage

- player has a short invulnerability window to prevent instant repeated damage

If health reaches zero:

Show:

"YOU WERE DEFEATED"

Then allow:

"TRY AGAIN"

The player should restart the current level.

==================================================

ENEMY TYPE #1 — PTERODACTYL

==================================================

Enemy:

Flying Pterodactyl.

It shoots fireballs.

Visual:

Original dinosaur design.

Do not use a generic bird icon or emoji.

The Pterodactyl should:

- fly around

- maintain some distance from player

- shoot fireballs

- have a visible health bar

- take damage from player attacks

- die when health reaches zero

- drop dinosaur bones

Fireballs must be real projectiles.

The player must be able to dodge them.

Fireballs must have collision detection.

If a fireball hits the player, the player takes damage.

==================================================

MINI-BOSS #1

==================================================

NAME:

MINI FIRE RAPTOR

This is a smaller but dangerous fire-based raptor.

It should be visibly different from ordinary dinosaur enemies.

It should have:

- more HP

- more damage

- faster movement

- attack behavior

- a boss-style health bar

- fire effects

When the player defeats Mini Fire Raptor:

THE DINOSAUR BECOMES A PET.

This is a fundamental game mechanic.

Show a reward sequence:

"MINI FIRE RAPTOR DEFEATED!"

Then:

"PET UNLOCKED!"

Then add:

Mini Fire Raptor

to the player's PET inventory.

Also add a Mini Fire Raptor card to the player's card collection.

The player can then equip/use the Mini Fire Raptor as a pet.

==================================================

PET SYSTEM

==================================================

Pets follow the player.

The first pet is:

Mini Fire Raptor.

The pet should visually follow the player.

The pet should have a simple attack ability.

Create a PET button on the right side:

🦖 PET

When pressed:

- equipped pet attacks the nearest enemy

- pet has its own cooldown

- attack visibly hits the enemy

- enemy loses HP

The pet system must be real.

Do not merely display "pet unlocked."

==================================================

MINI-BOSS #2

==================================================

NAME:

FIRE UTAHRAPTOR

This is a stronger dinosaur.

It should have:

- substantially more HP than Mini Fire Raptor

- faster movement

- stronger attacks

- fire effects

- a boss health bar

When defeated:

Fire Utahraptor becomes a collectible pet.

Add it to the player's pet inventory.

Add a Fire Utahraptor card.

Allow the player to equip Fire Utahraptor as their pet.

==================================================

TREASURE ROOM

==================================================

After defeating Fire Utahraptor, the player reaches a treasure room.

This should feel like a REWARD.

Do not immediately transition away.

Create a visually exciting treasure room containing:

- treasure chest(s)

- gold

- dinosaur bones

- glowing cards

- rare items

- fire effects

When the player opens the treasure chest:

Reveal MULTIPLE cards.

For example:

1. Fire Bone Axe

2. Baby Raptor

3. Fire Raptor

4. Bonus Bones

Cards should animate or flip/reveal.

The player should understand:

"I found multiple collectible cards!"

==================================================

CARD SYSTEM

==================================================

There are THREE fundamental card categories:

1. CHARACTER CARDS

2. WEAPON CARDS

3. PET CARDS

Cards have rarity:

COMMON

RARE

EPIC

LEGENDARY

MYTHIC

Use distinct visual treatment for each rarity.

Do not make cards merely text entries.

Create actual collectible-card UI.

Each card should display:

- name

- type

- rarity

- artwork

- description

Cards should be stored in the player's collection.

Create a CARD COLLECTION screen accessible from the game UI.

The player should be able to view:

- Characters

- Weapons

- Pets

==================================================

BONES

==================================================

Dinosaur bones are the initial currency.

Bones are found:

- on the ground

- after defeating dinosaurs

- in treasure rooms

- from bosses

Display bone count.

Example:

🦴 125

Bones are used to craft weapons.

==================================================

CRAFTING

==================================================

Initial crafting resource:

Dinosaur Bones.

For World 1:

Bones + Fire

can eventually be used to craft:

FIRE CLAW

For World 2:

Bones + Ice

can eventually be used to craft:

ICE CLAW

Do not make Fire and Ice currencies complicated in the first MVP.

The important thing is that the game architecture supports:

bones + elemental resource = elemental weapon.

==================================================

FIRE CLAW

==================================================

Create a legendary weapon:

LEGENDARY FIRE CLAW

It should be visually impressive.

It should be stronger than the starting Bone Sword.

The player receives the Legendary Fire Claw after defeating Firesauras.

For this MVP, it can automatically unlock after the boss.

Later we will add more sophisticated crafting.

==================================================

WEAPON SYSTEM

==================================================

Start with:

BONE SWORD

Then unlock:

FIRE BONE AXE

Then:

LEGENDARY FIRE CLAW

Weapons should actually affect combat.

Do not merely change the name in the inventory.

The Fire Claw should have:

- stronger attack

- larger hitbox

- fire effect

- higher damage

==================================================

FINAL BOSS

==================================================

NAME:

FIRESAURAS

Firesauras is the ultimate boss of World 1.

He is a HUGE fire raptor.

He lives INSIDE THE VOLCANO.

He should be dramatically larger than normal dinosaurs.

He should feel like a final boss.

Visual characteristics:

- enormous fire raptor

- glowing eyes

- lava/fire effects

- large claws

- powerful movement

- intimidating but appropriate for children

Boss fight:

PHASE 1:

Firesauras:

- moves toward player

- launches fireballs

- performs melee attacks

- has a large health bar

PHASE 2:

When below 50% HP:

Firesauras becomes ENRAGED.

Increase:

- movement speed

- attack frequency

- projectile count

- visual fire effects

The boss fight must be winnable.

The player must be able to defeat Firesauras through actual combat.

==================================================

FIRESAURAS DEFEAT

==================================================

When Firesauras dies:

Create a dramatic victory sequence.

Show:

"FIRESAURAS DEFEATED!"

Then reward:

MYTHIC FIRESAURAS CARD

and:

LEGENDARY FIRE CLAW

and:

BONUS BONES

Then display:

"WORLD 1 COMPLETE!"

Then:

"🧊 WORLD 2 UNLOCKED!"

World 2 does NOT need to be playable yet.

It should be visibly unlocked in the world-selection screen.

==================================================

WORLD MAP

==================================================

Create a simple World Map screen.

WORLD 1:

🌋 VOLCANIC LANDS

Status:

COMPLETED / IN PROGRESS

WORLD 2:

❄️ ICE WORLD

Before Firesauras:

LOCKED

After Firesauras:

UNLOCKED

Show:

"COMING SOON"

for the playable content of World 2.

==================================================

DINO CAMP

==================================================

Create the beginning of a Dino Camp system.

The player should be able to access:

🏕️ DINO CAMP

For MVP, Dino Camp should include:

- player character

- equipped pet

- unlocked pets

- card collection access

- weapons

- bones

- world progress

It does NOT need elaborate building mechanics yet.

However, make it feel like the player's home/base.

This is an important future system.

==================================================

USER INTERFACE

==================================================

The UI should feel like a polished children's action-adventure game.

During gameplay, show:

TOP LEFT:

❤️ Health

🦴 Bones

TOP RIGHT:

small inventory/status button

BOTTOM LEFT:

large virtual joystick

BOTTOM RIGHT:

large buttons:

⚔ ATTACK

⬆ JUMP

🦖 PET

Do not overcrowd the screen.

Buttons must be large enough for a 7-year-old to use on an iPad.

==================================================

JUMPING

==================================================

The player must have a real jump mechanic.

Jump should:

- have a short animation

- temporarily move the player upward / change collision state

- allow the player to cross small lava gaps

- potentially avoid certain attacks

Do not make Jump merely play an animation.

==================================================

LAVA ERUPTIONS

==================================================

Occasionally trigger a volcanic eruption.

Sequence:

1. Ground warning effect.

2. Short warning period.

3. Lava burst.

4. Damage players caught in the eruption.

The player should be able to move away or jump over appropriate hazards.

==================================================

HIDDEN CAVES

==================================================

Include at least one hidden cave.

The cave should be discoverable by exploring.

Inside:

Rare card(s).

This creates an exploration reward.

==================================================

PROGRESSION

==================================================

The player should feel progression throughout World 1.

Suggested progression:

STARTING:

Character:

Rocket Boy or Pink Explorer

Weapon:

Bone Sword

Pet:

None

Then:

Pterodactyls

↓

Bones

↓

Mini Fire Raptor

↓

Mini Fire Raptor Pet

↓

More exploration

↓

Fire Utahraptor

↓

Fire Utahraptor Pet

↓

Treasure Room

↓

Fire Bone Axe

↓

Volcano

↓

Firesauras

↓

Mythic Firesauras Card

↓

Legendary Fire Claw

↓

World 2 Ice World Unlocked

==================================================

SAVE SYSTEM

==================================================

Use localStorage.

Save automatically after:

- collecting bones

- unlocking cards

- unlocking pets

- changing weapons

- defeating bosses

- unlocking worlds

Create:

"NEW GAME"

and:

"CONTINUE"

options on the main menu.

For the MVP, the save data only needs to exist on that browser/device.

Do not require an account.

==================================================

AUDIO

==================================================

Add simple game sound effects if practical:

- attack

- hit

- enemy defeat

- bone collection

- card reveal

- boss encounter

- boss defeat

- lava eruption

Do not let audio prevent the game from functioning.

Provide a simple sound toggle.

If browser autoplay restrictions prevent automatic sound, initialize audio only after the player's first interaction.

==================================================

VISUAL STYLE

==================================================

Overall style:

POLISHED

ADVENTUROUS

FAMILY FRIENDLY

REALISTIC-LOOKING CHARACTERS

REALISTIC-LOOKING DINOSAURS

FANTASY ADVENTURE

The characters should look like actual human children rather than cartoons made from geometric shapes.

The dinosaurs should look like recognizable dinosaurs with fantasy fire elements.

The world should feel cinematic and exciting.

Do not use emoji as final art.

Do not use Minecraft assets.

Do not use Minecraft textures.

Do not use copyrighted game assets.

Create original visual assets.

==================================================

IMPORTANT GAME DESIGN PRINCIPLE

==================================================

This is a GAME, not a dashboard.

The player should spend most of their time:

MOVING

EXPLORING

FIGHTING

DODGING

COLLECTING

DISCOVERING

DEFEATING BOSSES

not clicking menus.

==================================================

MVP PERFORMANCE REQUIREMENTS

==================================================

The game must run smoothly in Safari on a modern iPad.

Optimize for touch.

Avoid unnecessary heavy effects that cause frame-rate problems.

Use efficient collision detection.

Do not create thousands of objects.

Keep the game responsive.

Target approximately 60 FPS where practical.

==================================================

RESPONSIVE DESIGN

==================================================

The game must work across common iPad screen sizes.

Do not hardcode controls to one resolution.

Use responsive scaling.

The game should also be playable on desktop for development/testing.

==================================================

CRITICAL COMBAT ACCEPTANCE TESTS

==================================================

Before declaring the project complete, test ALL of the following:

TEST 1:

Can the player move with the iPad virtual joystick?

TEST 2:

Can the player press ATTACK on the touchscreen?

TEST 3:

Does pressing ATTACK actually damage a Pterodactyl?

TEST 4:

Does the Pterodactyl health bar decrease?

TEST 5:

Can the Pterodactyl actually die?

TEST 6:

Can the player be damaged by a fireball?

TEST 7:

Can the player dodge fireballs?

TEST 8:

Can the player defeat Mini Fire Raptor?

TEST 9:

Does Mini Fire Raptor become a pet?

TEST 10:

Does the pet actually attack enemies?

TEST 11:

Can the player defeat Fire Utahraptor?

TEST 12:

Does Fire Utahraptor become a pet?

TEST 13:

Does the treasure room reveal multiple cards?

TEST 14:

Can the player enter the volcano?

TEST 15:

Can the player damage Firesauras?

TEST 16:

Can Firesauras damage the player?

TEST 17:

Can the player actually defeat Firesauras?

TEST 18:

Does the Legendary Fire Claw unlock?

TEST 19:

Does the Mythic Firesauras card unlock?

TEST 20:

Does World 2 become unlocked?

TEST 21:

Does progress survive a browser refresh?

TEST 22:

Can the entire game be played without a keyboard?

If ANY of these fail, fix the issue before considering the MVP complete.

==================================================

IMPORTANT: DO NOT OVERBUILD

==================================================

This is an MVP.

Do NOT build:

- multiplayer

- online accounts

- matchmaking

- payments

- advertisements

- social features

- complex backend

- leaderboards

- procedural generation

- elaborate crafting trees

- complex inventory databases

- dozens of weapons

- dozens of characters

- World 2 gameplay

We are testing whether the core game is FUN.

Focus engineering effort on:

1. movement

2. combat

3. enemies

4. bosses

5. rewards

6. pets

7. cards

8. bones

9. progression

10. iPad usability

==================================================

IMPORTANT DEVELOPMENT PROCESS

==================================================

Do not ask me a series of clarification questions before building.

You have enough information to build the MVP.

Build the first working version.

After building it:

1. Run the application.

2. Test the game.

3. Find build errors.

4. Fix build errors.

5. Test touchscreen controls.

6. Test combat.

7. Test boss fights.

8. Test progression.

9. Test localStorage.

10. Test responsive layout.

11. Fix any problems you find.

Do not tell me something works unless you have actually verified the relevant functionality.

If you encounter a technical problem, solve it rather than replacing the feature with a fake UI.

==================================================

FIRST DELIVERABLE

==================================================

The first deliverable should be a fully playable:

DINO QUEST

WORLD 1: VOLCANIC LANDS

I should be able to click Preview and immediately play it.

I should be able to publish it to a web URL.

The final published URL must be usable from an iPad without installing an app.

==================================================

FINAL SUCCESS CONDITION

==================================================

Imagine I am sitting next to my 7.5-year-old son Henry.

I publish the game.

I send Henry a URL.

Henry opens Safari on his iPad.

He turns the iPad sideways.

He sees:

DINO QUEST

VOLCANIC LANDS

He chooses Rocket Boy.

He presses PLAY.

He can move with the joystick.

He sees a Pterodactyl.

He presses ATTACK.

THE PTERODACTYL ACTUALLY TAKES DAMAGE.

He dodges a fireball.

He defeats the Pterodactyl.

He collects bones.

He eventually fights Mini Fire Raptor.

He defeats it.

The game tells him he unlocked the Mini Fire Raptor as a pet.

He continues.

He defeats Fire Utahraptor.

He gets to the treasure room.

He gets multiple cards.

He enters the volcano.

He fights Firesauras.

He defeats Firesauras.

He gets the Legendary Fire Claw.

World 2 — Ice World — unlocks.

That is the MVP.

Build THAT.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dinoworld.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9a0168d4-9655-4573-b096-96e4a60d6cf1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
