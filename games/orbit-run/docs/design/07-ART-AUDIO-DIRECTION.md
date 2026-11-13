# 07 — Art and audio direction

How the game looks and sounds, in enough detail to keep nine worlds and several contributors (human or AI) consistent.

## 1. Visual style

**Name for prompts and briefs: "plain forms, true light".**

- **Forms:** clean, slightly simplified, built from readable volumes. Chamfered edges. No greebling for its own sake: every pipe goes somewhere. Flat or softly graded surfaces; texture comes from shape, wear decals and light, not photographic maps.
- **Light:** physically motivated and carrying the mood. One Sun, at its true size and strength for the place. Practical lamps are warm (2,700–3,000 K) and small. Darkness is allowed to be dark.
- **People:** always suited or behind glass. Low-detail figures with strong silhouettes and one identifying colour each (file 11). Faces are never modelled. Emotion is posture, a raised hand, a lamp.
- **Scale cues:** a human figure, a door or a vehicle is in frame at every landmark so that size reads.
- **Not:** photorealism, lens dirt, chromatic aberration, film grain (except Europa's radiation grain, which is diegetic), heavy bloom, motion blur on the camera, holographic interfaces, neon.

Reference by description only: mid-century industrial design, lighthouse and harbour architecture, Antarctic stations, hand-painted NASA concept art of the 1970s for colour. Do not reproduce any specific artwork or any other game's look.

## 2. Colour by world

Each world has five colours: ground, shadow, sky, built, and one **accent** that appears only on things made by people. Hex values are targets in display space under that world's light.

| World | Ground | Shadow | Sky | Built | Accent | Mood word |
| --- | --- | --- | --- | --- | --- | --- |
| Mars (day) | `#B5694A` | `#5A3226` | `#D9A777` | `#E6E1D6` | `#FFB45A` warm window | Hearth |
| Mars (dusk) | `#6E4038` | `#2A1C22` | `#5B7FA8` → `#1B2030` | `#8C8A88` | `#FFC46B` | Hearth |
| Europa | `#DCE8EE` | `#3E5566` | `#000000` | `#C9CED2` | `#FF5A4A` mast lamp | Wonder |
| Ceres | `#4A4A4C` | `#0E0E10` | `#000000` | `#8C8F8A` | `#F2E44B` hazard yellow | Fellowship |
| Mercury rim | `#C8B89C` | `#000000` | `#000000` | `#D8D8D4` | `#FFFFFF` mirror glare | Pride |
| Mercury floor | `#0B0B0D` | `#000000` | `#000000` | `#3A3430` | `#FF8A2A` furnace | Pride |
| Venus | `#E9D9A6` cloud | `#B79B5E` | `#F3ECD2` | `#F4F1E8` | `#2E4A7A` Patrol blue | Loss |
| Earth orbit | — | `#0A0F1A` | `#000000` | `#D5D8DC` | `#3C7BD6` Earth itself | Smallness |
| Titan | `#5A3E22` | `#2B1D10` | `#B4702A` | `#6E6A60` | `#8FE6D2` beacon green | Unease |
| Miranda | `#8E9498` | `#050608` | `#000000` | `#6C6F72` | `#9FE8E0` Uranus-light, then `#BFD9FF` arc | Solitude |
| Triton | `#E8D6D8` | `#1A1620` | `#000000` | `#7A7680` | `#FFB45A` warm window (the same as Hearth's) | Tenderness |
| Cabin | — | `#17130F` | — | `#6B5B4B` wood-tone panels, `#C9C2B4` | `#FFB45A` | Refuge |

**Rule:** Hearth's window colour `#FFB45A` appears in exactly three places: Hearth, the *Kestrel*'s cabin, and Vigil after the cores are seated. Nowhere else may use it.

## 3. Light and exposure

### 3.1 Sun
For a body at distance *d* AU:

- Apparent diameter = 0.533° ÷ *d*.
- True relative illuminance *E* = 1 ÷ *d*².
- **Displayed** key-light strength *B* = *E*^0.25. This is the eye adapting: three-quarters of the difference is absorbed, one quarter is kept so the player still feels it.

| Place | *d* (AU) | Sun diameter | *E* | *B* |
| --- | ---: | ---: | ---: | ---: |
| Mercury | 0.387 | 1.38° | 6.68 | 1.61 |
| Venus (above cloud) | 0.723 | 0.74° | 1.91 | 1.18 |
| Earth | 1.000 | 0.53° | 1.00 | 1.00 |
| Mars | 1.524 | 0.35° | 0.43 | 0.81 |
| Ceres | 2.77 | 0.19° | 0.13 | 0.60 |
| Jupiter / Europa | 5.20 | 0.10° | 0.037 | 0.44 |
| Saturn / Titan (above haze) | 9.58 | 0.056° | 0.011 | 0.32 |
| Uranus / Miranda | 19.2 | 0.028° | 0.0027 | 0.23 |
| Neptune / Triton | 30.05 | 0.018° | 0.0011 | 0.18 |

In flight, *B* is computed continuously from the ship's distance. Below 0.05° the Sun is drawn as a point with a fixed 3 px core and a small glow whose intensity follows *E*.

### 3.2 Shadows and fill
- Airless worlds: shadows receive only ground bounce (5% of key) and body-shine. No ambient term.
- Body-shine: on Europa, Jupiter contributes a warm fill of 0.06 from the east; on Miranda, Uranus contributes a blue-green fill of 0.05 from overhead; on Triton, Neptune contributes 0.02. These are what make the shadow sides readable; do not replace them with a generic ambient light.
- Mars: sky fill 0.25, warm by day, blue at sunset (the Martian sunset is blue around the Sun; this is real and should be shown).
- Venus: no hard shadows; a soft top light and a bright bounce from the cloud floor.
- Titan: no key light at all. A dome of dim orange; lamps and beacons do the work.

### 3.3 Exposure
Auto-exposure is slow (2 s to adapt) and limited to ±1.5 stops around the per-world base. It must not brighten Miranda or Triton into daylight. Practical lamps are authored at fixed absolute brightness, so that the same lamp that is invisible at Mercury is the brightest thing in the scene at Triton.

### 3.4 The cabin window patch
The sunlit patch on the cabin wall has luminance proportional to *B* and colour 5,800 K. Target: clearly dominant at Mars; equal to the cabin lamp near Jupiter; barely visible at Saturn; absent beyond Uranus.

## 4. Skies

Every sky is computed from the solar frame at the current fiction time, then given authored atmosphere where one exists.

| Site | Parent in the sky | Angular size | Where | Other |
| --- | --- | ---: | --- | --- |
| Mars | — | — | — | Phobos crosses west to east twice a night, small and fast. Earth is visible as a blue-white evening star when geometry allows. |
| Europa | Jupiter | 12.2° | Fixed on the eastern horizon, lower limb cut by the ice | Phases over 85 real minutes. Io is sometimes a dot beside it. |
| Ceres | — | — | — | Stars do not twinkle. The horizon is 1.3 km away for a seated eye, and visibly curved. |
| Mercury | — | — | — | The Sun on the rim. Stars visible when facing away. |
| Venus | — | — | — | Cream haze above; the Sun a soft disc. |
| Earth orbit | Earth | 17.4° | Below and beside | The Moon, 0.5° from here, drifts through once. City lights on the night side. |
| Titan | (hidden) | — | — | Haze. A bright smudge for the Sun. |
| Miranda | Uranus | 22° | Near the zenith, 70° up | Rings edge-on as a thin line. Other moons as points. |
| Triton | Neptune | 7.9° | Northern sky, 30° up | Geyser plumes on the horizon. |

Stars: a real catalogue to magnitude 6.5 with true positions and colours, so constellations are recognisable and the same from every world (they are: nothing in the Solar System is far enough to change them). The Milky Way as a subtle band.

## 5. Camera

- **Never** move the camera during a hinge action (file 02 §5), a photo, or Look Home beyond the specified ease.
- Authored sequences: no cuts shorter than 3 s; no more than four shots; the Sun stays on the same side of frame across a cut.
- Vehicle cameras: positional lag, no rotational lag. Collision with terrain pulls the camera in; it never clips through.
- Field of view: 60° exterior default, 50° docking, 62° cabin, user-adjustable ±10°.
- Shake: only from physical events (driver firing, pour, latch, engine ignition), amplitude ≤ 0.4°, duration ≤ 0.6 s, and off when Reduce Motion is on.
- A **stillness rule**: if the player gives no input for 20 s on a surface or in orbit, the camera begins a very slow authored drift toward the best view of the site's landmark, and stops the instant input returns.

## 6. Interface

### 6.1 Principles
- Diegetic where it is cheap (lamp boards, dials, the hold monitor, handles), otherwise small, flat and at the screen edges.
- One accent colour for interactive prompts: `#F2EDE4` off-white on a 60% black capsule. No blue glows.
- Every state's HUD fits in the four corners; the centre is empty except for docking.
- Idle fade (file 03 §5.3) applies everywhere.

### 6.2 Type
| Use | Face | Notes |
| --- | --- | --- |
| Reading (letters, journal, captions) | Atkinson Hyperlegible | 18 pt minimum at 1080p; scalable to 200% |
| Numerals, HUD, stamps | IBM Plex Mono | Tabular figures |
| Pip's hand | Patrick Hand | Questions, her letters, the wall |
| Mara's hand | Caveat | Signature and margin notes only; her letters' bodies are in the reading face |
| Registry documents | Special Elite | Typewritten forms |

All are open-licence families at the time of writing; confirm each licence when the fonts are bundled, and record it in the asset ledger (file 09 §8).

### 6.3 HUD by state
| State | Top left | Top right | Bottom left | Bottom right | Centre |
| --- | --- | --- | --- | --- | --- |
| `solar_flight` | Destination, distance in AU | Day; range in AU with thin fuel bar | Speed; throttle | Prompt | — |
| `cruise` | Destination, AU remaining, real minutes remaining | Day (running) | "Course held" | Prompt | — |
| `orbit_ready` | Body name | Day | — | Radial menu when summoned | — |
| `docking` | Range; closing speed | Assist level | Lateral offset dot | Angle error | Reticle and corridor |
| `surface` | Intention (one line) | Local time | Speed | Prompt | — |
| `cabin` | — | — | — | Focus label | — |

### 6.4 Captions
All radio is captioned by default: speaker name in their colour, then the line, on a 70% black plate, bottom centre, maximum two lines of 42 characters. Sound captions for meaningful non-speech ("[ping, left]", "[latch closes]") are a setting, default off.

## 7. Sound

### 7.1 The governing rule
**Sound travels only through what is really there.**

| Place | What the player hears |
| --- | --- |
| Vacuum (space, Europa, Ceres, Mercury, Miranda, Triton exterior) | Only what is conducted through the vehicle and suit: own drive, wheels through the chassis, own breath-quiet cabin air, relays, radio. A mass driver firing 50 m away is a thump in the seat and nothing in the air. |
| Mars | Thin, high-cut air: wind as a faint hiss, distant machines much quieter than they look. |
| Venus port | Full, warm, Earth-like air: wind in rigging, the envelope creaking, footsteps on grating. The first "normal" sound world of the game, and it is where the loss happens. |
| Titan | Dense air: everything slow and low, sounds carry far and arrive late; rain as soft heavy ticks. |
| Interiors by radio | Room tone of the speaker's room under their signature. |

### 7.2 Signature sounds (must be designed, not sourced generically)
| Sound | Description |
| --- | --- |
| The latch | A geared handle turning under load, 2.5 s, ending in a seated clunk. The same recording at Venus and Triton; at Triton the tail rings a fraction longer. |
| The stamp | One deep, dry thud with a paper edge. |
| Twelve hooks | The docking latch: twelve clicks in a ripple, 1.1 s. |
| *Linnet*'s knock | A soft double tap with a wooden quality, every 4 s. |
| The pour | A low roar with a rising pitch as the mould fills. |
| Relay click + lamp hum | Each window in the ring. |
| The Quiet | The cruise bed: a very low drive tone, cabin air, and at long intervals a tick of thermal contraction. |

### 7.3 Mix
Dialogue signature −14 LUFS; effects up to −10 LUFS peaks; music never above −18 LUFS under dialogue. Dynamic range is wide by default; a "night" preset compresses it.

## 8. Music

### 8.1 Ensemble
Small and acoustic: felt piano, a string quartet, one clarinet, a pump organ (harmonium), and hand-struck metal (the foundry). No synthesiser pads, no choir, no percussion kit.

### 8.2 Themes
| Theme | Instrument | Shape | Used |
| --- | --- | --- | --- |
| **Home** | Felt piano | Five notes rising then falling by a step; in a major key with a flattened seventh | Prologue (whole), fragments in Mara's letters, absent from Venus to Triton, returns on the way home at 0.50, full at homecoming |
| **Out** | Clarinet over harmonium | A slow walking line | First cruise; Act I travel |
| **Ice** | High strings, harmonics | Static, bright | Europa |
| **Work** | Struck metal with pizzicato | A pattern in five | Ceres hauling, Mercury mirrors |
| **Paper** | Solo viola | The Home theme's notes in a different order | Earth; a phrase at Triton during the testimony |
| **Far** | Harmonium alone, very low | Two chords | Titan, cruise beyond Saturn |
| **Give** | Quartet | The Home theme, harmonised for the first time | Enters only after the sixth core at Triton, played once |

### 8.3 Where there is no music
The Venus requisition from the shadow to the end of the chapter. All of Miranda until lift-off. The Triton seating until the sixth core. The docking after Triton. The first half of the way home. Every depot restart. Silence is scored: it is a decision, and nobody fills it.

### 8.4 Behaviour
Music is arranged in layers that enter and leave on bar lines in response to state (approach, at a landmark, driving, stopped for more than 30 s → thins to one instrument). It never loops audibly: each cue has at least four minutes of material and then rests for at least two.

### 8.5 The cabin radio
- **Off.**
- **Ship:** the Quiet's bed plus, rarely, a fragment of distant traffic chatter from the nearest lit depot (beacon notes read aloud in their signatures).
- **Tapes:** one tape is added at the end of each chapter, labelled in the giver's hand ("for the long bits — K."). Each is one piece from the score in a rougher, room-recorded arrangement. Nine tapes.

## 9. Voice

No recorded speech in 1.0 (decision D14). Each speaking character has a **tonal signature**: a short phrase of 2–5 pitched, breathy tones on one instrument, played under each caption at the pace of the line (one tone group per clause). It carries who is speaking and how (pitch range, tempo, attack), not words.

| Character | Instrument | Character of the phrase |
| --- | --- | --- |
| Mara | Low clarinet | Short, level, ends on a falling step |
| Pip | Toy piano | Quick, uneven, ends rising |
| Jun | Cello pizzicato | Steady pairs |
| Dr Aas | Bowed glass | Long single tones |
| Kofi | Kalimba | Three quick, one late |
| Imani | Alto voice-like harmonium reed | Even, open intervals |
| Arman | Bassoon | Grumbling, with a late high note |
| Yusuf | Struck bronze | Two notes, far apart |
| Priya | Flute | Precise, stepwise |
| Varga | Muted trumpet | Three level notes; one, lower, when off duty |
| Tomás | Viola | Slow, ornamented |
| Rosa | Fog-horn-like low brass | One long tone and a short |
| Nwosu | Baritone horn | Warm, tired |
| Emeric (logs) | Harmonium, one reed | Slower in each log |
| Annika | Solo violin, no vibrato | Careful |
| Davit | Double bass harmonics | Soft |
| Mika | Toy piano, an octave above Pip | Pip's phrase, upside down |

Rules: signatures never overlap; they duck under effects during hinge actions; the Courier has none. If recorded voice is ever added, it replaces signatures per character and never mixes with them.

## 10. Controller feedback

Light and specific. Low-frequency motor for mass (driver firing, pour, drop tanks letting go); high-frequency for contact (latch seat, stamp, docking capture: twelve ticks). Nothing during cruise. An intensity setting from 0 to 100%.

## 11. Effects list (complete; do not add others without review)

Drive plume (length by speed) · RCS puffs on *Wren* · dust: Mars (billowing, settles in 4 s), Ceres/Miranda/Triton (ballistic arcs at real gravity, no billow) · Europa slush and steam at the winch · radiation grain (Europa loud windows only) · heliostat light spots · molten stream and mould glow · Venus cloud motion · Titan haze, rain, sonar ring · frost sublimating (Miranda pipes, dark depots) · arc flash · window relay-on ramp · hand lamps (instanced, 212) · depot beacon sweep · perihelion light sweep in the cabin.
