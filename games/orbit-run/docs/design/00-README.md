# The Third Ring — design set

Written 13 November 2026. This folder is the complete forward design for the solar-expedition game provisionally titled **The Third Ring** (repository name: Orbit Run). It replaces the vague "proposed story direction" in the root README with a specification that a developer, or an AI model acting as one, can build from without inventing anything important.

## What this set is, and is not

- It **is** the design of the finished game: story, systems, every destination, presentation, controls, architecture, data, production order.
- It **is not** a record of what exists. The documents one level up (`docs/*.md`) remain the record of the current browser prototype. Nothing here is marked implemented.
- Numbers given here are **start values**. Each tunable has a stated range. A start value is to be implemented exactly; it may be changed only by a recorded playtest finding (see `10-PRODUCTION-ROADMAP.md`, "Changing a number").
- No design removes the need for playtesting. Where a claim depends on how it feels in the hand (docking difficulty, cruise length, rover grip), the document says so and names the test that settles it.

## Reading order

| # | File | Answers |
| --- | --- | --- |
| 01 | `01-VISION-AND-PILLARS.md` | What is this game for? What must the player feel? What is forbidden? |
| 02 | `02-STORY-BIBLE.md` | Setting, people, the whole plot beat by beat, the ending, what varies. |
| 03 | `03-CORE-SYSTEMS.md` | State machine, time, scale, flight, cruise, fuel, depots, orbit, lander, docking, ground vehicles. |
| 04 | `04-IMMERSION-SYSTEMS.md` | The cabin, mail and light delay, postcards, Look Home, threads and windows, keepsakes, waysides, depot tending. |
| 05 | `05-CHAPTERS-ACT-1.md` | Mars prologue, Europa, Ceres, Mercury — full location and activity specs. |
| 06 | `06-CHAPTERS-ACT-2-TO-4.md` | Venus, Earth, Titan, Miranda, Triton, the long way home, homecoming, post-game. |
| 07 | `07-ART-AUDIO-DIRECTION.md` | Look, light, colour per world, camera, HUD, sound, music, voice. |
| 08 | `08-UX-CONTROLS-ACCESSIBILITY.md` | Input actions, menus, onboarding, assists, settings, accessibility, localization. |
| 09 | `09-TECHNICAL-ARCHITECTURE.md` | Project structure, coordinator, data and save schemas, events, budgets, tests. |
| 10 | `10-PRODUCTION-ROADMAP.md` | Milestones and gates, demo scope, cut order, risks, playtest protocol. |
| 11 | `11-CONTENT-REGISTRY.md` | Canonical IDs: people, sites, cargo, flags, mail, postcards, threads, keepsakes. |
| 12 | `12-AI-BUILD-PROTOCOL.md` | How to brief an AI model on a work package; invariants; definition of done. |

## Precedence

When two statements conflict, the higher line wins:

1. A decision the project owner states after 13 November 2026.
2. `01-VISION-AND-PILLARS.md` (pillars and anti-goals).
3. `11-CONTENT-REGISTRY.md` for any ID, name or spelling.
4. The numbered design file that owns the topic (the table above).
5. The older documents in `docs/`, for anything this set does not address.
6. The behaviour of the browser prototype.

An implementer who finds a conflict or a gap does **not** resolve it silently. They stop, write it under "Open questions" in the work-package report, propose one answer, and wait or proceed with the proposal clearly flagged (see `12-AI-BUILD-PROTOCOL.md`).

## Decisions carried forward unchanged

These were settled in the earlier documents and are treated as fixed here:

- Mars is first. Hearth Crater's layout, sixteen stops, twelve residents and the controller repair job are kept.
- The main ship stays in orbit; a smaller lander carries the player down.
- Descent and launch are non-interactive authored sequences. **Docking is done by the player's hands.**
- Planets do not damage the ship on contact; arrival is a deliberate, safe capture.
- No death, no game over, no survival chores, no settlement-extinction alarms. Rescue always exists.
- Real mean Sun-distance ratios on a linear map; 269 moving depots in thirteen bands.
- Electron is not the release path. Free browser trial → native Steam demo → complete game. Godot is the recommended engine experiment; the engine decision gate stays where the roadmap put it. This set is written in engine-neutral terms, with a Godot mapping in file 09.
- Windows first.

## Decisions this set makes (the owner may overturn any of them)

Each is argued in the file named.

**Status: D1–D15 accepted by the owner on 13 November 2026** (milestone M0 gate, file 10). A later change to any of them is recorded here with its date.

| # | Decision | File |
| --- | --- | --- |
| D1 | The game's subject is the widening of who counts as home. "The third ring" is the habitat, and also the third circle of care: self, community, strangers. | 01 |
| D2 | The player is **the Courier**: Hearth-born, never seen outside a suit, never voiced. | 02 |
| D3 | The Venus seizure is lawful and done for a real emergency. There is no villain. | 02 |
| D4 | At Triton the player gives the replacement cores away by hand and flies home with an empty hold. Hearth's ring is built anyway, by the people the player helped. The ring is always built; how many windows are lit varies. | 02, 04 |
| D5 | No currency, no shop, no XP. Upgrades are gifts tied to story beats. Fuel is a commons. | 03 |
| D6 | One fiction clock drives everything. Cruise compresses time 8,640×; everywhere else 60×. Bodies move on real period ratios against that clock. | 03 |
| D7 | Native scale: 1 AU = 60,000 units, floating origin. Cruise starts at 1.5 AU per real minute and is upgraded twice. | 03 |
| D8 | Cruise holds course by itself. The player is free to go to the cabin. | 03, 04 |
| D9 | No free walking. The only interior is the Kestrel's cabin, used from a seat. | 04 |
| D10 | Mail is letters, not calls. Every message shows how long ago it was sent, from real light-travel time. | 04 |
| D11 | Postcards: a child at Hearth asks a question about each world and the player answers with a photograph. | 04 |
| D12 | Docking has three assist levels; the default keeps the player's hands on translation. | 03, 08 |
| D13 | Five vehicle controllers cover the whole game: Ship, Lander, Ground, Skiff, Rail. | 03 |
| D14 | Voice: no recorded dialogue in 1.0. Radio "voice" is a designed, per-character tonal signature under captions. | 07 |
| D15 | Target length: 10–12 hours for the story, 15–18 with every thread. | 01 |

## Glossary

| Term | Meaning |
| --- | --- |
| Hearth | The settlement at Hearth Crater, Mars. Home. |
| The Third Ring | Hearth's unbuilt third habitat ring: 24 homes. Also the game's theme. |
| Courier | The player character. |
| Kestrel | The player's interplanetary ship. |
| Wren | The Kestrel's lander. One craft for descent and ascent. |
| Nomad | The six-wheel rover lent by Hearth. |
| Core | A reactor core cartridge. Six make a set. The thing the expedition is for. |
| Compact | The Inner-Outer Settlements Compact: the loose treaty body that runs registries, patrols and the mutual-aid charter. |
| Patrol | The Compact Patrol. Its cutter *Harrier* is commanded by Captain Ines Varga. |
| Vigil | Vigil Station, Triton. 212 people. |
| Commons | The depot network. Fuel is free; everyone keeps it running. |
| Thread | One person the Courier can help across the journey. Sixteen exist. |
| Window | A lit home in the Third Ring at the end. One per completed thread, plus eight that are always lit. |
| Keepsake | A small object given at each world, kept on the cabin shelf. |
| Postcard | A photograph taken to answer one of Pip's questions. |
| Wayside | An optional encounter found during cruise. |
| The Quiet | Time spent in cruise. |
| Look Home | A held input that turns the view toward Mars and shows the light-time. |
| su | Solar unit. 1 AU = 60,000 su. Used only in the solar frame. |
| Fiction time | The in-world clock, in days, hours and minutes from Expedition Day 1. |

## Rules of canon

1. Names, spellings and IDs come from file 11 and nowhere else.
2. Real science is used where it is free: distances, light-time, the Sun's apparent size, gravity, real surface feature names. Where the game departs from reality, file 07 or the chapter says so in one line. Never present an invented thing as a real mission result.
3. Nobody in this game is evil. People are tired, far apart, under-resourced or following a rule. Write them that way.
4. Nothing the player does can make the game unwinnable or lock them out of the ending.
5. The game never tells the player what to feel. No narrator. No "you feel".
