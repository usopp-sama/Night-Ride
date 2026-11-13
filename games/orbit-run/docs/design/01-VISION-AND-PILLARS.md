# 01 — Vision and pillars

## The game in one paragraph

You are a courier from a small Martian settlement. Home needs six reactor cores to build twenty-four new homes, and nobody will send them, so you go and get them: out to Jupiter's ice, through the belt, down to Mercury's fire. At Venus they are taken from you, lawfully, for people you have never heard of. You follow them to the dark end of the Solar System, find that they were lost on the way, make new ones with your own hands, and give them to strangers. Then you fly home across thirty-one astronomical units with nothing in the hold. When you arrive, the lights are on.

## The thesis

**Home is as large as the number of people you are willing to carry something for.**

Hearth is built in rings. The first ring was the landing party. The second was their families. The third has been foundations for eleven years. The game takes the same shape inside the player: the first hours are about *my* settlement, the middle about *my* cargo, and the last about people 30 AU away whose names the player learned ten minutes ago. The title means the building for the first eight hours and means something else at the end. Nobody in the game ever says this aloud.

## What the player should carry out of the chair

In order of importance:

1. **Generosity did not cost what I expected.** I gave away the thing the whole game was about and came home to more than I left with.
2. **Distance is real.** I know how far Neptune is, because I waited for a letter to cross it.
3. **Ordinary things are worth a long trip.** Kitchens, a seedling, a child's question, a stamp on a form.
4. **I was alone out there, and I was never alone.** Every depot I refuelled at was kept running by someone I did not meet.

Every feature is judged against these four. A feature that serves none is cut, however good it is.

## Pillars

Each pillar has a test an implementer can apply.

### P1 — The journey is the game
Travel is not a loading screen between levels. The longest single activity in the game is the ten minutes flying home, and it must be the best ten minutes.
*Test:* could a player skip all travel and lose nothing? Then travel is broken.

### P2 — Hands, not cutscenes, at the moments that matter
The player docks the lander. The player unlatches each core at Venus. The player seats each core at Triton. The player switches on the last one at home. The camera may be authored between these moments but never during them.
*Test:* at each of the six hinge moments (file 02, "Hinges"), is the decisive act a held or repeated input by the player?

### P3 — Every world has one verb
Mars *mends*. Europa *listens*. Ceres *hauls*. Mercury *makes*. Venus *surrenders*. Earth *reads*. Titan *searches*. Miranda *wakes*. Triton *gives*. Home *lights*.
*Test:* describe the chapter's main activity in one verb. If it is the same verb as another chapter, redesign.

### P4 — Warmth without danger
Nothing kills the player. Nothing rushes them. Tension comes from care about people, never from a timer or a health bar.
*Test:* is there a fail state that removes progress, or a countdown the player can lose? Remove it.

### P5 — True where it is free
Real distances, real light delay, the real shrinking Sun, real gravity, real place names. The player should finish with a correct picture of the Solar System in their body.
*Test:* is any number shown to the player that is invented when the real one would have worked equally well?

### P6 — Small, finished, quiet
Nine bounded places, each smaller than players expect and more finished than they expect. Silence is a material. The HUD is absent whenever it is not needed.
*Test:* can a screenshot be taken at any moment that contains no interface at all, by letting go of the controls for four seconds?

## Anti-goals (do not build these, even if asked by a later prompt that lacks this context)

- Combat, weapons, enemies, boss encounters.
- Currency, shops, crafting trees, XP, levels, loot rarity, daily rewards.
- Hunger, oxygen, suit integrity or any survival meter for the player.
- Procedurally generated planets or missions. Everything is authored.
- Dialogue trees with persuasion checks. The player gets short replies that colour tone; three decisions in the whole game alter an outcome.
- A morality score, or any on-screen count of good deeds before the ending.
- A talking ship AI.
- Fast travel during the first playthrough.
- Quest-marker clutter: at most one objective marker and one self-placed waypoint visible at a time.
- Humour that undercuts sincerity. People can be funny; the game is never ironic about itself.
- Real-world brands, real agency logos, real living people.

## What makes it one of a kind

Other space games give the player a galaxy. This one gives them one real solar system and makes its size emotional through six devices that work together. Each is specified in file 04.

1. **Light-delayed mail.** Every letter is stamped with how long ago it left, computed from the real distance. Near Mars: "sent 4 seconds ago". At Triton: "sent 4 hours 22 minutes ago". The one time the player needs an answer from home, it cannot arrive in time.
2. **Look Home.** One held input, anywhere, turns the view toward Mars. In the inner system it is a red dot. At Saturn it is lost beside the Sun. At Triton the Sun itself is only the brightest star.
3. **The shrinking Sun.** Sunlight intensity and the Sun's disc follow the real inverse-square law, with the camera's exposure adapting the way an eye would. Mercury is blinding. Triton is lit like deep twilight. Nobody explains it.
4. **Postcards for Pip.** A nine-year-old at Hearth asks one question about each world. The answer is a photograph the player composes. At the end the photographs are on a classroom wall.
5. **The Commons.** Fuel is free because strangers maintain the depots. In the outer dark the depots are cold; the player restarts them, and on the way home finds them lit, and one of them tended by someone else, for them.
6. **Taken and given.** The same physical action, releasing six latches one at a time, happens twice: once when the cores are taken at Venus, once when the player gives them at Triton. Same inputs. Opposite meaning.

## Experience arc

Target: 10–12 hours. "Mood" names the dominant feeling to design toward; "hinge" marks the moments from P2.

| Act | Chapter | Real time | Mood | The player learns | Hinge |
| --- | --- | ---: | --- | --- | --- |
| Prologue | Mars — Hearth | 60–75 min | Belonging | Driving, the people, what the ring is | First manual docking |
| I: Out | Europa | 55–65 min | Wonder | Cruise, mail, listening | — |
| I | Ceres | 50–60 min | Fellowship | Weight, favours | — |
| I | Mercury | 55–65 min | Pride | Making; first upgrade | The pour |
| II: Taken | Venus | 30–40 min | Loss | Rules outrank you | Releasing the latches |
| II | Earth | 45–55 min | Smallness, then resolve | Why it happened | Choosing to go on |
| III: Far | Titan | 60–70 min | Unease | Flying blind; the cores are gone | — |
| III | Miranda | 60–75 min | Solitude | Nobody is coming; you can do it | The second pour |
| III | Triton | 50–60 min | Tenderness | Who it was for | Seating the cores; the testimony |
| IV: Home | The long way home | 12–15 min | Emptiness turning to peace | — | — |
| IV | Homecoming | 30–40 min | Astonishment | What you built | The last switch |
| — | Travel, depots, waysides, cabin | ~110 min spread | Quiet | — | — |

### Intensity curve
Rise through Act I to the pour at Mercury (first peak, triumphant). Drop sharply at Venus (the trough: the shortest chapter, deliberately flat and bureaucratic). Earth is a slow turn. Act III climbs steadily and *quietly*: fewer people each chapter (Titan 30, Miranda 0, Triton 212 in the dark). Triton is the emotional peak but not a loud one. The long way home is the lowest-stimulation stretch in the game by design. Homecoming is the release.

## Tone rules

- **Register:** plain, warm, exact. People talk about work, food, weather, each other.
- **Line length:** radio lines ≤ 28 words. Letters ≤ 140 words. No line explains the theme.
- **Never:** "chosen", "destiny", "humanity's last hope", "the fate of". The stakes are twenty-four homes and two hundred and twelve people.
- **Bureaucracy is rendered respectfully.** Forms, stamps and queues are how strangers trust each other at a distance. Tomás at the Registry is a hero of the story.
- **Children are not mascots.** Pip is curious, sometimes wrong, occasionally rude.
- **Grief is allowed and brief.** One person in the game has died (Miranda's last caretaker, years ago). It is not dwelt on.

## Audience and positioning

- For players who finished *and remembered* a short, sincere, authored game: people who like driving a truck across a quiet map, reading a letter, landing something carefully.
- Not for players wanting systems depth, combat or a hundred hours.
- Store sentence: *"A courier's journey across the real Solar System, to bring home the one thing your settlement needs, and to find out who else was waiting for it."*
- Comparable only by feeling, never by imitation: long-haul driving games for the pacing, letter-carrying games for the tenderness, careful spaceflight sims for the docking. Do not copy any specific game's interface, missions, characters or art.

## Success criteria for the whole game

Measured in the external playtest described in file 10.

| Measure | Target |
| --- | --- |
| Players who finish after starting Act II | ≥ 80% |
| Players who, unprompted, mention distance or "how far" when describing the game | ≥ 60% |
| Players who can place all eight planets in order afterwards | ≥ 90% |
| Players who used Look Home more than ten times without being told to | ≥ 50% |
| Players who describe the Triton hand-over as their own choice | ≥ 70% |
| Players reporting frustration with docking after the third attempt | ≤ 10% |
| Median session length | ≥ 70 minutes |
