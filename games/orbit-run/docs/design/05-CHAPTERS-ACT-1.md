# 05 — Chapters: prologue and Act I

Mars, Europa, Ceres, Mercury. File 06 continues with Venus onward.

## How to read a chapter spec

Every chapter uses the same headings. An implementer builds **only** what is listed.

- **Site frame:** metres; +x east, −z north (the prototype's convention); origin at the site datum. Positions are beacon positions; buildings are offset from them as the prototype does.
- **Stage:** an integer saved per chapter. Only the listed interaction advances it. Every advance is idempotent and writes a checkpoint.
- **Interaction:** unless stated, requires the vehicle within 13 m of the beacon at under 1.6 m/s, then `Interact`.
- **Talk:** within 19 m of a person, `Talk`. Captioned radio.
- ★ marks the one line in the chapter allowed to be beautiful.
- **Budget** is the content ceiling. Exceeding it needs the owner's approval.

Shared across all sites: one landing apron with the *Wren*, one lent vehicle waiting beside it, a site atlas (`Map`), `Recover`, the idle HUD fade, photo mode, Look Home.

---

## Prologue — Mars: "A little more daylight"

| | |
| --- | --- |
| Verb | **Mend** |
| Site | Hearth Crater (fictional), Mars. 4.4 km playable disc, as built. |
| Sky | Butterscotch day, blue sunset. Sun 0.35° across. Sol length 24 h 37 min = 24.6 real minutes. Starts 06:00 local. |
| Vehicle | Nomad (Ground) |
| Length | 60–75 min |
| Budget | Existing geometry + ring layout + apron + 5 new props + 46 new lines |

### Changes to the built settlement
1. **Launch apron.** New beacon `apron` at (−300, 420), 500 m from the nearest home, on a new road spur [(−200, 220) → (−260, 330) → (−300, 420)]. The *Wren* lands and launches here. The old `lander` berth at (−130, 110) becomes the **rover stand** (where Nomad waits) and loses its depart action.
2. **The Third Ring, laid out.** A closed ring road of radius 110 m centred (−15, −300). Twenty-four home plots at radius 130 m, 15° apart, Home 1 due north and numbering clockwise. The gate is at the north point (−15, −170); the existing `expansion` beacon at (−65, −140) becomes the **ring gate** beacon and is linked to the gate by a 55 m road. The prototype's three construction frames and stock piles are re-laid onto plots 1–3. In the prologue every plot shows foundations and an unlit frame; plots 1–7 have wall panels.
3. **Schoolroom.** One module on the residential quarter's east side at (−420, −140) with an exterior noticeboard: Pip's wall at the end.
4. **Signs.** Road signs with icon and word at every junction (closes MARS-16).

### Critical path
| Stage | Where | Player does | Result |
| ---: | --- | --- | --- |
| 0 | Rover stand | Wakes in Nomad at 06:00. Mara on radio. | Intention: collect the controller. |
| 1 | `workshop` | Interact | Controller on the cargo bed (existing). |
| 2 | `solar` | Interact | East bank online, 42% → 78% (existing). |
| 3 | `expansion` (ring gate) | Interact | Jun opens the gate. |
| 4 | Ring road | Drive one full lap (passes four hidden gates in order) | Jun talks through the homes as they pass: who is waiting for which. Eight lines, triggered by position. |
| 5 | `residential` | Talk to Nia, then Pip | Pip gives QUESTIONS. Postcard 1 becomes active. Photo mode taught. |
| 6 | `gardens` | Talk to Tao | Seedling tray. Thread 2 offered. |
| 7 | `workshop` | Talk to Mara | Thread 1 offered. Wheel-nut keepsake. "Go on, then." |
| 8 | `apron` | Interact, confirm | Launch. |
| 9 | Orbit | First docking (H1), tutorial | Latch. Mara's instruction. Chapter complete. |

Optional before stage 8: Bea at `freight` (thread 3), Eli at `relay` (thread 4), the overlook (postcard 1's easiest spot), all other residents.

### Jun's lap (stage 4), position-triggered
Home 1: "The Reyes boys. Three to a bunk since the youngest could climb." Home 5: "Empty on purpose. Somebody always turns up." Home 7: "Mine, if I ever stop building other people's." Home 9: "Coming from Earth. They've had their bags packed since before you could drive." Home 17: "Nia hasn't said. Nia has a list." Home 21: "Windows face the dawn. Cost me an argument." Home 24: "Nobody's asked for this one." Back at the gate: ★ "Eleven years I've been pouring floors for people to stand on. I'd like to hear one of them drop a plate."

### The first docking (stage 9)
Tutorial in five beats, each waiting for the player: (1) look at the port — `Align`; (2) stop drifting — `Brake`; (3) close to 60 m — forward translation, then brake; (4) centre in the rings — lateral translation; (5) final ten metres under 0.3 m/s. Mara speaks one line per beat and is silent between. On the first rejection: "It's a door, not a nail. Again." On latch: "There. Now you can leave." Then: *"Bring back six. Bring back yourself. In the other order."*

### Acceptance
- A new player reaches stage 8 without opening the atlas more than twice.
- The lap cannot be skipped by cutting across; gates must be passed in order, but stopping and looking is never penalised.
- The existing Mars save (`orbit-run.mars.v1`, stages 0–3, visited list) migrates into the chapter record.

---

## Chapter 1 — Europa: "What the ice keeps"

| | |
| --- | --- |
| Verb | **Listen** |
| Site | Halden Station (fictional), ice plain beside Conamara Chaos (real), Europa, 9° N 273° W |
| Sky | Black. Sun 0.10° across, light 1/27 of Earth's, hard shadows. **Jupiter sits on the eastern horizon, 12° wide, and never moves** (Europa keeps one face to it). It goes through its phases every 3.55 days = 85 real minutes. |
| Ground | White-blue ice, red-brown stained bands, low ridges. Real gravity 1.31 m/s². |
| Vehicle | Skate: tracked crawler with a hydrophone mast and a stern winch (Ground, grip 0.45: it slides) |
| Playable | Disc of radius 1,500 m |
| People | Dr Sunniva Aas, Kofi Mensah, four unnamed staff seen through lit windows |
| Length | 55–65 min |
| Budget | 1 station (5 modules), 1 mast, 1 drill shed, 3 berms, 1 ridge with one pass, *Linnet*, 70 lines |

### Layout
| ID | Name | x | z | What is there |
| --- | --- | ---: | ---: | --- |
| `eu_apron` | Landing apron | 0 | 0 | *Wren*, Skate |
| `eu_station` | Halden Station | −140 | −90 | Five half-buried modules, one lit lab window, Dr Aas outside at the core rack |
| `eu_shed` | Drill shed | −60 | −210 | Kofi; winch drum; sled |
| `eu_mast` | Comms mast | 120 | −160 | 30 m lattice, red lamp: the landmark visible everywhere |
| `eu_berm_1` | Berm A | 300 | −420 | Ice wall, radiation-quiet parking |
| `eu_berm_2` | Berm B | 520 | −760 | Same |
| `eu_berm_3` | Berm C | 180 | −1,050 | Same |
| `eu_stitch` | The Stitch | from (−200, −600) to (900, −900) | | Pressure ridge 25 m high; one pass at (430, −720) |
| `eu_linnet` | *Linnet* | 610 | −1,180 | Under 9 m of ice in a refrozen crack; nothing visible on the surface |

### The radiation rhythm
Jupiter's radiation belt sweeps Europa. In this game it harms nobody; it **deafens the hydrophone**. A cycle of 90 s quiet and 45 s loud (real time) runs for the whole visit. In a loud window: a rising hiss, a faint grain across the image, and the hydrophone returns only noise. Parked within 20 m of a berm's lee side the hydrophone works in any window, at 60% range. The cycle's phase is shown by a small dial on the Skate's dashboard and by Jupiter-side lamps on the mast (white quiet, amber loud).

### Listening
1. Stop. Hold `Interact` 1.0 s: the mast lowers its hydrophone through a drilled hole (4 s).
2. *Linnet* pings once every 4 s. The ping is played in stereo, panned by its bearing relative to the Skate's nose, with level falling 6 dB per doubling of distance and a low-pass filter beyond 600 m. Audible range 1,400 m.
3. Rotate the Skate (it pivots on its tracks while listening) until the ping is centred. `Interact` again marks a **bearing**: a line on the atlas with a ±8° fan.
4. A second bearing from a point at least 250 m away makes a crossing; a third narrows it to a 40 m circle.

**Accessibility (default on):** an arc on the dashboard brightens toward the ping's bearing; the ping also flashes the dashboard. With this on, the task is fully playable without sound.

### Critical path
| Stage | Player does | Result |
| ---: | --- | --- |
| 0 | Land. Drive to the station. Talk to Dr Aas. | The trade: *Linnet* for the assay. |
| 1 | Drill shed. Talk to Kofi. | Hydrophone taught at the shed's test hole, where a practice pinger sits 80 m away. |
| 2 | Take at least two bearings that cross within the disc | The atlas shows the search circle. Dr Aas: "Beyond the Stitch. Of course it is." |
| 3 | Cross the pass. Take a bearing within 150 m of *Linnet* | Circle shrinks to 15 m. |
| 4 | Park in the circle. Hold `Interact` 3 s | The drill runs (12 s). The winch line goes down. |
| 5 | **Winch:** hold `Throttle` to reel. A tension needle must stay in a wide band; reeling too fast raises it, easing lowers it. 40 s of reeling in total. Out of band simply pauses the reel. | *Linnet* surfaces through steaming slush: 2 m, yellow, scored. It is on the sled. |
| 6 | Tow the sled back to the shed (the Skate slides more with it) | Kofi takes it. |
| 7 | Station. Talk to Dr Aas. | The assay: one deposit, the Occator vein. Meltwater vial. Thread 5 and thread 6 offered. |
| 8 | Apron | Launch, dock. |

### Lines that must exist
- Dr Aas, stage 0: "I don't sell data. I lend it to people who've been cold with me."
- Kofi, stage 1: "It's not a beep. Listen properly. It's more like someone knocking and being polite about it."
- ★ Dr Aas, stage 7, looking at Jupiter: "Forty years and it has never once set. You'd think I'd stop looking."
- Kofi on the recording: "No hurry. She's not going anywhere and neither, apparently, am I."

### Postcard, threads, keepsake, mail
Postcard 2 (Jupiter and the horizon). Thread 2 completes if a cutting is given to Kofi (he puts it under the lab's grow lamp, visible through the window on any later visit). Threads 5 and 6 offered. On departure Mara's second letter arrives after the true delay.

### Acceptance
- With accessibility cues off and sound on, 80% of testers find *Linnet* in under 20 minutes.
- With sound off and cues on, the same.
- A loud window never removes progress: bearings persist, the winch pauses.
- Jupiter's terminator moves visibly over a 15-minute stay.

---

## Chapter 2 — Ceres: "The weight of it"

| | |
| --- | --- |
| Verb | **Haul** |
| Site | Occator Cooperative (fictional), floor of Occator crater (real), Ceres. The bright salt deposits of Cerealia Facula (real) glare white 3 km to the north and are the landmark. |
| Sky | Black. Sun 0.19° across, light 1/8 of Earth's. Horizon close and curved: Ceres is small, and the player should see that it is. |
| Ground | Dark grey regolith, salt-white streaks. Real gravity 0.28 m/s². Dust thrown by wheels falls slowly, in arcs, with no billow. |
| Vehicle | Mule: six-wheel hauler, three canister cradles (Ground; airborne behaviour on) |
| Playable | A corridor: the pit, the haul road, the yard and the driver. About 1,400 × 600 m. |
| People | Imani Quispe, Arman Bekov, Wen; eleven other members heard on the open channel |
| Length | 50–60 min |
| Budget | 1 yard, 3 sheds, 1 pit, 1 mass driver (1.2 km rail), 12 canisters, 80 lines |

Note for map and routing: the existing **Ceres Anchorage** depot keeps its ID `ceres` and stays a depot. The landing site is a separate destination `site_ceres_occator`, a child of the body Ceres (new body entry, file 03 §3.3).

### Layout
| ID | Name | x | z | Notes |
| --- | --- | ---: | ---: | --- |
| `ce_apron` | Apron | 0 | 0 | |
| `ce_yard` | Cooperative yard | 120 | −60 | Hall with an outside speaker horn; Imani |
| `ce_assay` | Assay shed | 200 | −20 | Wen |
| `ce_driver` | Driver loading cradle | 380 | −160 | Foot of the mass driver; Arman. Rail runs 1.2 km north-east up a 12° ramp. |
| `ce_crest` | The Crest | 640 | −420 | Rise on the haul road. Above 6 m/s the Mule leaves the ground here for 2–4 s. |
| `ce_long` | The Long Down | 760–1,050 | −500 to −640 | 300 m at 8% downhill into the pit |
| `ce_pit` | Vein face | 1,120 | −680 | Loading gantry; twelve canisters on a rack |

Road distance pit → driver: 960 m.

### The vote (stage 1)
Imani keys the horn: the request is read to all thirteen members on the open channel. Votes come in as voices, one line each, over about 40 seconds while the player waits. Twelve for. One against: Arman. "Somebody should. On principle. I'll still load it." The Courier gets the ore **if** they help move it, because the driver's loader is down.

### Hauling
- At the pit gantry, `Interact` loads one canister per press (2 s each), up to three.
- Loaded, the Mule accelerates at 60% and brakes at 50%. On the Long Down, uphill and loaded, it crawls; on the way back empty it flies.
- At the driver cradle, `Interact` unloads one per press.
- A canister cannot be lost. If the Mule is recovered, the load comes with it.

| Trip | Load | What changes |
| ---: | ---: | --- |
| 1 | 1 | Arman rides the channel, teaching: brake early, the Crest, "let it land". |
| 2 | 3 | First full load. The player discovers the braking distance. |
| 3 | 3 | Wen opens the **cut**: a shorter track over a second, higher crest (airborne 5–6 s). Optional. |
| 4 | 3 | Members who voted come out to the roadside one by one (suited figures, a raised hand). |
| 5 | 2 | Sun reaches the facula; the whole crater floor brightens. No dialogue. |

### Critical path
| Stage | Player does | Result |
| ---: | --- | --- |
| 0 | Land; drive to the yard; talk to Imani; show the assay | — |
| 1 | Wait through the vote | Agreement |
| 2–6 | Five trips, 12 canisters | Counter on the cradle's own lamp board (12 lamps), not on the HUD |
| 7 | At the cradle, talk to Arman, then hold `Interact` 2 s at the firing lever | The driver fires twelve times at 3 s intervals. Each canister is a spark going up the rail and a point of light climbing to orbit. The ground thumps in the image and the controller; there is no air to carry sound, so the only sound is through the Mule's frame. |
| 8 | Talk to Imani | Ore chip. Auxiliary bladder fitted to the *Kestrel* by the Cooperative's tender (authored 20 s, seen from the surface as a light meeting a light). |
| 9 | Apron | Launch, dock. The hold monitor shows six cradles of ore. |

### Lines that must exist
- Imani, stage 0: "It isn't mine to give you. Let me ask who isn't in the room."
- Arman, returning the driver: "Tell her the ratchet's still good. Tell her I oiled it. Don't tell her I used it."
- Wen: "It's fine. It's probably fine. Would he look at it, do you think? Not if it's a bother."
- ★ Imani, stage 8: "We knew it was there for years. We couldn't afford to want it. Then somebody drove up and wanted it out loud."

### Postcard, threads, keepsake
Postcard 3. Thread 1's item (the torque driver) is given by Arman at stage 7 if thread 1 was offered; otherwise he offers it anyway ("You're from Hearth? Then you know Mara."). Thread 7 offered by Wen.

### Acceptance
- Trip 2's first descent of the Long Down surprises at least half of testers (they overshoot the turn at the bottom) and none are stuck by it.
- Total hauling time 11–15 minutes; no tester describes it as a grind (file 10 asks directly).
- Dust arcs use 0.28 m/s²; vehicle handling uses 0.8.

---

## Chapter 3 — Mercury: "Lantern"

| | |
| --- | --- |
| Verb | **Make** |
| Site | Lantern Foundry (fictional), in the permanently shadowed floor of Prokofiev crater (real), 85.8° N, Mercury |
| Sky | Black. The Sun never rises above the rim: it crawls along it, 1.4° wide (2.6 times its width from Earth), 6.7 times as bright. The crater floor is in darkness that has lasted longer than life on Earth. Real water ice lies in it. |
| Ground | Rim: bright, grey-tan, razor shadows. Floor: black, with the foundry as an island of amber work lights and the white-hot eye of the furnace receiver. |
| Vehicle | Rim tram, then the foundry lift (Rail) |
| Playable | Rim track 2.4 km arc with nine stations; lift; pour hall |
| People | Yusuf Demir, Kaito Mori; six founders on the floor |
| Length | 55–65 min |
| Budget | 9 heliostats (one model), 2 relay mirrors, 1 tram, 1 receiver tower, 1 pour hall, 6 moulds, 75 lines |

### The idea
The furnace is lit by sunlight. Nine mirrors on the sunlit rim throw it down into the dark onto a receiver tower. Each mirror's reflection is a real, visible patch of light on the crater floor, a kilometre below, that moves as the player turns the mirror. Bringing nine suns onto one point, one after another, is the chapter.

### Heliostat aiming
At a station, `Interact` takes the mirror's handwheels. `Steer` slews azimuth, `Throttle` axis slews elevation, at up to 6°/s with a precision modifier. The spot on the floor moves accordingly. Target: the receiver's aperture, which tolerates 1.2° of error. When the spot is on the aperture for 1.5 s the mirror **locks** (clamp sound, green lamp) and tracks by itself.

| Mirrors | Twist |
| --- | --- |
| 1–3 | Direct. The first is taught by Kaito. |
| 4–6 | No line of sight: the spot must be laid on a **relay mirror** on a spur below, which is already aimed at the receiver. The player sees the second bounce land. |
| 7–9 | Two receiver apertures, east and west. A balance gauge on the tram shows which side is hotter. Each of these mirrors must go to the cooler side. |

A temperature column on the receiver tower itself (a physical row of nine lamps, readable from the rim) climbs one lamp per locked mirror. Between stations the tram ride is 20–30 s with the crater turning below; Kaito talks on three of the rides and is silent on the others.

The visor is always filtered. Looking directly at the Sun shows a clean white disc with the limb sharp. It never blooms to white-out. (Pillar P5: the player should see how big it is.)

### The pour (H2)
The lift goes down into the dark (40 s, the rim's glare shrinking to a line overhead). The pour hall: six moulds on a turntable, the tap-hole above them.

For each of six cores:
1. Hold `Interact` 2.0 s: the gate opens; metal runs.
2. For 8 s keep the stream centred with `Steer`: the ladle swings slowly; a centring mark on the mould must stay within a ±15% band. Outside the band the fill slows; it cannot spill or fail.
3. Release closes the gate. The turntable indexes.

Yusuf says one thing after the first, nothing for the next four, and one thing after the sixth.

Cooling takes five fiction days. The game shows them: a 15 s time-lapse from the rim, the Sun sliding along it, the day counter turning, the receiver dimming. Then the six cores stand on the apron rack, grey, each stamped **YD**.

### Critical path
| Stage | Player does | Result |
| ---: | --- | --- |
| 0 | Land on the rim apron. Twelve canisters are winched down from orbit behind the lander. Talk to Yusuf by radio. | The offer: he casts, the Courier keeps the mirrors. |
| 1–9 | Lock mirrors 1–9 | Receiver at pour heat |
| 10 | Ride the lift | — |
| 11 | Pour six | — |
| 12 | (time-lapse) | Six cores on the rack |
| 13 | Talk to Yusuf, Kaito | Sprue keepsake; threads 8 and 9 offered; thread 7 completes if Wen's sample is shown ("It's good. Tell her it's good. Tell her she's eight parts in a thousand low on iridium and that I was worse at her age."). Drive tier II. |
| 14 | Apron | Launch with six cores on the rack; dock. Hold monitor: six cores. |

### Lines that must exist
- Kaito: "It's the only job I know where you do it by looking away."
- Yusuf, after the first core: "Slower. It isn't going anywhere you don't send it."
- ★ Yusuf, after the sixth: "I have made three hundred and twelve of these. I have never once seen one switched on."
- Mara's fourth letter, on docking: full text in file 11. It ends: "Six. I counted the picture twice. Come home."

### Acceptance
- The spot of light on the crater floor is a real projected light or decal driven by the mirror's angles, not a UI marker.
- Mirrors 4–6: 90% of testers understand the relay without a text prompt.
- The pour cannot fail, and yet testers hold their breath (observed: fewer than 20% speak during it).
- Leaving Mercury, the player holds exactly six unproofed cores and the journal's single intention reads "Have the cores proofed at Cythera Port, Venus."
