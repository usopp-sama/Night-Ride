# 10 — Production roadmap

Order of work, what proves each step, what ships in the trial and the demo, what to cut first, what could go wrong, and how to test with people. No dates: each milestone ends when its gate passes.

Existing backlog IDs (`CORE-`, `ORBIT-`, `CINE-`, `DOCK-`, `DATA-`, `SAVE-`, `NATIVE-`, `STEAM-`…) refer to `docs/DEVELOPMENT-CHECKLIST.md`, which stays the task ledger. This file sets the order and the gates.

## 1. Milestones

### M0 — Lock the design (now)
- Owner reads files 01 and 02 and confirms or overturns decisions D1–D15 (file 00).
- **Gate:** each decision marked accepted or replaced, in file 00.

### M1 — Rules in the open (engine-free)
Build `core/` as pure, tested code in the language of the candidate engine: time, solar positions, light-time, routing, fuel, cruise logic, docking evaluation, ground step, stages, grants, mail delivery, threads, save schema. Port the prototype's fixtures.
- Closes: CORE-03, CORE-05, CORE-06, CORE-12, CORE-13, SAVE-01, SAVE-08, NATIVE-02.
- **Gate:** tests `T-TIME`, `T-TRAJ`, `T-SOLAR`, `T-LIGHT`, `T-ROUTE-01/02`, `T-FUEL`, `T-CRUISE`, `T-DOCK-01/02`, `T-GROUND`, `T-GRANT`, `T-MAIL`, `T-THREAD`, `T-SAVE-01` pass headless. The data validator runs.

### M2 — The engine slice (the engine decision)
In the candidate engine: Hearth's original campus only (six stops), Nomad, the three-stage repair job, launch (rough), **docking (complete)**, latch, orbit-ready, depart, 60 seconds of solar flight, one depot, save and reload at every stable point. Greybox art.
- Closes: NATIVE-01, CORE-01, CORE-07–10, DOCK-01–12, DOCK-15–18, ORBIT-07/08/10, DESKTOP-09 (first measurement).
- **Gate:** (a) ten people dock, at least nine succeed within five minutes with the tutorial lines only; (b) budgets in file 09 §7 measured on a real Windows machine and the table updated; (c) written engine decision. **Nothing in M3 onward starts before this gate.**

### M3 — The loop, finished
Capture, descent and launch sequences for Mars with real timing; the floating-origin solar frame at 60,000 su/AU; cruise with course hold; the live map; depots lit and dark with the panel; the Commons tow; the cabin with window, mail slate, hold monitor and chart table; mail with light delay; Look Home; photo mode; the journal. Input actions and prompts for keyboard and controller.
- Closes: CORE-02/04/11/14/15, ORBIT-01–06, 09, 11–16, CINE-01–16, DATA-01–11, SAVE-02–07, 09–12, DESKTOP-02–05.
- **Gate:** a tester plays Mars → orbit → cruise to Jupiter → depot stop → Europa orbit (no site yet) → back, watching and skipping sequences, quitting and reloading at each phase. `T-SAVE-02`, `T-LEAK-01` pass.

### M4 — Vertical slice: prologue + Europa, to finish quality
Full Hearth with the ring laid out, apron, schoolroom, all prologue stages, Pip and the first postcard, the seedling, threads 1–4 offered. Europa complete. Final art, sound, music and signatures **for these two only**. Settings and accessibility complete.
- Closes: MARS-05, 09, 14, 16, 19, 20, 24, 32–36, 44, 45; ROVER-03, 07–09, 13, 15; EUROPA-01–05; WEB-07, 13; DESKTOP-12, 13.
- **Gate:** external playtest (§6), eight people, 2–2.5 hours each. Targets: all finish; median docking after the third ≤ 150 s; at least half use Look Home unprompted at Europa; nobody is stuck on listening for more than five minutes; at least six of eight ask what happens next.

**This slice is the native demo** (§3).

### M5 — Act I complete
Ceres, Mercury; drive tier II; auxiliary tank; waysides on the first three legs; tapes.
- Closes: CERES-01–05, MERCURY-01–05.
- **Gate:** playtest of Mars → Mercury (about four hours, may be two sittings). The pour is completed first time by all; hauling is not called a grind by more than one in five.

### M6 — Act II
Venus and Earth, including both hinge scenes and the desk.
- Closes: VENUS-01–05, EARTH-01–05.
- **Gate:** playtest of Mercury's end → plotting Titan. Interview targets from files 06 and 01: Varga read as doing her job; plotting Titan described as the player's decision by nine in ten.

### M7 — Act III
Titan, Miranda, Triton; drive tier III; the outer depots; drop tanks.
- Closes: TITAN-01–05, MIRANDA-01–05, TRITON-01–05.
- **Gate:** playtest of Earth's end → leaving Triton. The Triton hand-over is described as the player's own act by seven in ten; nobody looks for a way to keep the cores for more than a minute.

### M8 — Home
The way home, homecoming, Pip's wall, Home 24, credits, post-game states.
- Closes: HOMECOMING-01–05.
- **Gate:** three full playthroughs by new players, start to credits, unassisted. `T-FLOW-01` passes. Success measures in file 01 collected.

### M9 — Release candidate
Localization pipeline proven, platform integration, store materials, performance pass on minimum hardware, clean-machine installs, update and save-compatibility test.
- Closes: DESKTOP-14–16, STEAM-01–12, QA-01–15.
- **Gate:** the existing desktop quality gate and Steam checklist, in full.

### Parallel track — the web trial
The browser build is frozen at: prologue through first docking and the first minute of flight, ending on a card that links to the wishlist page. Work on it only to fix bugs or, if measured to be good enough after M4, to replace it with an engine export of the same content (NATIVE-07).

## 2. Dependency sketch

```
M0 → M1 → M2 ──(engine decided)──→ M3 → M4 (demo) → M5 → M6 → M7 → M8 → M9
                                     └─ store page and wishlist can open after M4
```

Chapters are built strictly in story order. Each one reuses the previous ones' systems, and later hinge scenes depend on earlier ones existing to echo.

## 3. What each public build contains

| Build | Content | Ends |
| --- | --- | --- |
| **Web trial** (free, browser) | Prologue to first docking; one minute of flight | "The rest of the Solar System is on Steam." |
| **Native demo** | Prologue complete, cruise to Jupiter with `ws_milestone`, one depot, Europa complete, launch and docking | As the *Kestrel* is plotted for Ceres: Mara's second letter, then a card. Saves carry into the full game. |
| **Full game** | Everything | Credits; post-game |

The demo and the full game are the same project with a content flag. The demo never contains data for later chapters.

## 4. Priority and cut order

Every feature has a priority. If the project must shrink, cut from the bottom, whole features at a time. **Never cut a P0. Never thin a hinge.**

| P | Feature |
| --- | --- |
| P0 | Nine sites' critical paths; docking; cruise with course hold; cabin window, mail slate, hold monitor; mail with light delay; Look Home; six hinges; the three choices; threads and windows; saves; settings and accessibility in file 08 §6 |
| P0 | Mara's nine letters; Pip's nine questions and nine letters on the wall |
| P1 | Postcards' reply variants by extras; keepsake inspection; seedling stages; depot tending on lit depots and beacon notes; tapes; the journal's Sky tab |
| P1 | Authored capture and descent per body (fallback: one shared capture and a 12 s descent everywhere) |
| P2 | Waysides (cut in this order: hut, comet, canister, lighthouse, chorus, chariklo, milestone last) |
| P2 | Giant-planet viewpoints; post-game changed states beyond Vigil and Miranda; Sleep through the Quiet |
| P3 | Picture-in-picture docking view; one-hand presets; idle camera drift; pseudo-locale beyond the single test |

If a **chapter** must go, the only one the story survives without is **Ceres' hauling being shortened to three trips**. No chapter can be removed: each supplies a verb and a link in the chain at the end.

## 5. Risks

| # | Risk | Likelihood | Effect | What to do |
| --- | --- | --- | --- | --- |
| R1 | Docking is a chore by the tenth time | Medium | High | Gate at M2 with ten people; tolerances and acceleration are tunable; Guided exists; variation in light and sky (file 03 §12.11). If the M4 median is above 150 s, raise translation acceleration before touching tolerances. |
| R2 | Cruise is boring | Medium | High | The cabin must be in by M3, not later. Measure at M4 whether players enter it unprompted. Levers, in order: more mail in the leg, wayside density, cruise speed. Never add hazards. |
| R3 | The ending feels unearned or sentimental | Medium | Very high | The wall of Pip's letters is the mechanism; it must be buildable from data by M5 so the link is tested early with a mock ending. Keep every line plain. Playtest the homecoming with people who have played at least Acts I–II. |
| R4 | The Venus scene reads as a cheat | Medium | High | Varga's writing; the receipt; Priya. The scene is short. Test at M6 before building Act III. |
| R5 | Scope: nine sites for a small team | High | High | Budgets in files 05–06 are ceilings. Five controllers only. Build order lets the game stop at any act boundary as a coherent demo, though not as the story. |
| R6 | Engine port costs more than expected | Medium | High | M1 is engine-free and reusable. M2 is small and decides. Do not build chapters in the browser. |
| R7 | Light-delay mail confuses instead of moves | Low | Medium | The "sent … ago" line is always present. Pip explains it in her own way at Europa. Test comprehension at M4. |
| R8 | Tonal signatures feel thin without voices | Medium | Medium | Test at M4 with and without. If rejected, the fallback is recorded voice for Mara and Pip only (≈ 60 lines), still captioned. Decide at M4; do not half-do it. |
| R9 | Performance on low hardware at dark sites with 212 lamps | Low | Medium | Instanced unshadowed lamps; measured at M7 on the handheld-class target. |
| R10 | Real-science claims wrong | Low | Medium | Every figure in the Sky tab and chapter headers is checked against a primary source before release; the checker's name and source go in a table in this folder. |
| R11 | Generated or third-party assets with unclear rights | Medium | High | The asset ledger (file 09 §8) is enforced by the build. Store disclosures are written from it. |

## 6. Playtest protocol

### 6.1 Who and how
- People who have not seen the game, played alone, in one room, with one silent observer. No help unless stuck for five minutes; every intervention is logged.
- Screen and inputs recorded; the local event log kept (file 09 §12).
- Sessions end at the milestone's end point or at the player's choice, whichever is first.

### 6.2 What the observer writes down, with times
Every time the player: opens the atlas or map; uses Look Home; enters the cabin; takes a photograph; is rejected in docking; uses Recover; sits with no input for more than 20 s (and what was on screen); speaks aloud; looks away from the screen.

### 6.3 Questions afterwards, in this order, without leading
1. "Tell me what the game is about."
2. "What do you remember most?"
3. "Was anything annoying?"
4. "Draw the Solar System and mark where you went." (A blank sheet.)
5. "What did you think of [person]?" for three named people.
6. Chapter-specific questions from the acceptance sections.
7. Only at the end of a full playthrough, and only after a pause: "Is there anything you'd say to someone before they played it?"

Never ask "did you feel…".

### 6.4 Changing a number
A start value in this design changes only when: (1) a playtest observation or measurement is written down; (2) the new value is inside the stated range, or the range is changed with a reason; (3) the change is recorded in a table at the end of the owning design file: date, value before and after, evidence, who decided. An AI implementer may **propose** a change in its report; it may not make one.

## 7. Definition of done for a chapter

A chapter is done when all of these are true:

1. Every stage advances only as specified, and `T-STAGE-<chapter>` passes.
2. It can be entered from a development flag and from real travel, and left by launch and docking.
3. Quit and reload at every stage, during every sequence, and mid-docking returns to a stable state with the right cargo.
4. Its postcard qualifies and sends; its threads offer and complete; its keepsake appears on the shelf.
5. Its letters deliver with correct delay and variants.
6. It has been completed muted, with a controller only, with hold-to-toggle on, and at 200% text.
7. It meets the frame and memory budgets on the reference machine.
8. Its acceptance bullets (file 05 or 06) have been tested with at least five people and the results recorded.
9. Ten enter/exit cycles pass `T-LEAK-01`.
10. All its text is in keys; all its assets are in the ledger.

## 8. Open questions for the owner

Listed so they are decided on purpose and early. Each has this design's assumption.

| # | Question | Assumed here |
| --- | --- | --- |
| Q1 | Final title: *The Third Ring*, with "Orbit Run" retired? | Yes |
| Q2 | Recorded voice at all? | No (D14), revisit at M4 |
| Q3 | Who composes and records the score? | Unassigned; the brief is file 07 §8 |
| Q4 | Team size and whether final art is made by hand, by tools, or mixed | Unassigned; budgets assume a very small team |
| Q5 | Price and length positioning | 10–12 hours, single purchase, no additional content planned |
| Q6 | macOS and Linux at launch? | Windows first; others only if measured |
| Q7 | Is the web trial replaced by an engine export? | Decide after M4 |
