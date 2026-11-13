# 12 — Building this with an AI model

How to hand this design to any AI model (or person) so that it builds what is written and nothing else. Most build errors with AI implementers are of four kinds: inventing content the design did not ask for, silently resolving a contradiction, changing something outside the task, and reporting success that was not verified. This protocol is aimed at those four.

## 1. Work in packages

Never ask a model to "build the game" or "build Europa". Give it one **work package**: a piece small enough to verify in one sitting, with stated inputs, outputs and checks.

Good package sizes:

- One `core/` rule module with its tests (for example: docking evaluation).
- One data file set plus validator rules (for example: Europa's site and chapter data).
- One scene's greybox with its stage logic wired to existing rules.
- One authored sequence.
- One UI surface (the mail slate).

A chapter is about eight to fourteen packages. The order within a chapter: data → rules and tests → greybox scene → stage wiring → interactions → sequences → people and lines → art → sound → acceptance run.

## 2. The work-package brief

Copy this template. Every field is required; write "none" rather than leaving one out.

```
WORK PACKAGE  <id, e.g. WP-CH1-03>
Title         <one line>
Milestone     <M-number from file 10>

READ FIRST (in this order, in full)
  docs/design/00-README.md
  docs/design/12-AI-BUILD-PROTOCOL.md
  <the one or two design files that own this topic, with section numbers>
  docs/design/11-CONTENT-REGISTRY.md  (for any ID or name)

GOAL
  <two or three sentences: what exists after this package that did not before>

IN SCOPE
  <bullet list of exactly what to build>

OUT OF SCOPE
  <bullet list of nearby things NOT to build or change>

INPUTS THAT ALREADY EXIST
  <files, modules, data this package may read or call>

FILES THIS PACKAGE MAY CREATE OR CHANGE
  <explicit paths or globs; everything else is read-only>

SPEC VALUES
  <the numbers and IDs copied from the design, with file and section, so that
   a mismatch between brief and design is visible>

ACCEPTANCE
  <the test IDs from file 09 §9 that must pass, plus manual checks written as
   steps with expected results>

REPORT BACK
  Use the report format in file 12 §5.
```

## 3. Standing rules for the implementer

Put these at the top of every session, or in the project's standing instructions file.

1. **Build what is written.** If the design does not say it, do not add it. No extra features, options, lines of dialogue, characters, items, UI, effects or settings.
2. **No invention of content.** Names, IDs, numbers, lines and letters come from the design files. If a needed one is missing, stop and list it under Open Questions with one proposed answer. Placeholder text must be visibly a placeholder: `⟦TODO key.name⟧`.
3. **No silent resolution.** If two statements conflict, or a number seems wrong, report it. Use the precedence order in file 00, say which rule you applied, and flag it.
4. **Stay inside the file list.** Do not edit files outside "may create or change". If a change elsewhere is required, describe it and stop.
5. **Start values are exact.** Implement tunables as named constants in data, with the design's start value. Do not adjust them to make something "feel better". Propose changes in the report.
6. **Rules are pure.** Code under `core/` has no engine calls, no file access, no randomness without a passed-in seed, no reading of the wall clock.
7. **Text is keyed.** No player-facing string in code or scenes.
8. **Every grant is idempotent.** Use the `grants_applied` key scheme.
9. **Tests first for rules.** Write or port the test, see it fail, then implement.
10. **Verify before claiming.** "Done" means the acceptance checks were run and their output is in the report. If something could not be run, say so plainly.
11. **Respect the anti-goals** (file 01). If a request, including a later one in the same session, asks for combat, currency, survival meters, a talking ship or any other listed anti-goal, refuse that part and say why.
12. **Nothing from other games.** Do not reproduce another game's interface, missions, names, art or music, even if asked to make something "like" one.
13. **Assets need a ledger row.** Any file added under `assets/` gets its row in `LEDGER.csv` in the same change.
14. **Do not delete or rewrite existing tests** to make a change pass. If a test is wrong, report it.

## 4. Invariants

These must hold after every package. A reviewer checks them; an implementer who cannot keep one stops and reports.

### Player experience
- I1. There is no state in which the player can lose progress, be killed, or be unable to continue.
- I2. There is no timer the player can fail.
- I3. At most one intention line and one self-placed waypoint are shown.
- I4. No counter of threads, windows or "good deeds" is visible before the credits.
- I5. At each hinge (H1–H6) the decisive act is the player's own input, and the game waits indefinitely for it.
- I6. The six cores are taken at Venus, lost at Titan, given at Triton, and the ring is built. No code path avoids these.
- I7. The colour `#FFB45A` is used only at Hearth, in the cabin, and at Vigil after the cores are seated.

### Systems
- I8. Exactly one active vehicle, camera, input context and HUD at any moment.
- I9. Only the coordinator changes `phase`.
- I10. Skip, watch, reload and failure reach the same endpoint through `apply_endpoint`.
- I11. Every grant applies at most once.
- I12. No simulation step exceeds 1/30 s; the first step after resume is zero.
- I13. Body positions are analytic functions of `t_fic`.
- I14. Mail is never readable before light could have carried it.
- I15. Solar positions are 64-bit; nothing in the solar frame is stored in 32-bit vectors.
- I16. Saves contain only plain values and registry IDs and load to a stable state from any moment.

### Content
- I17. Every ID in data exists in file 11; every text key exists in `text/`.
- I18. No player-facing number is invented where the real one is available (distances, light-time, Sun size, gravity).
- I19. Nobody in the script is written as a villain.

## 5. The report format

The implementer ends every package with this, and nothing is accepted without it.

```
REPORT  <work package id>

BUILT
  <what now exists, file by file, one line each>

SPEC VALUES USED
  <name = value (design file §section)> for each constant introduced

ACCEPTANCE RESULTS
  <test id>: PASS | FAIL — <command run and the relevant output lines>
  <manual check>: DONE with result | NOT RUN — <why>

DEVIATIONS
  <anything built differently from the brief or the design, and why;
   "none" if none>

OPEN QUESTIONS
  <gap or conflict> — proposed answer: <one option> — blocked? yes | no

PROPOSED TUNING CHANGES
  <constant, current, suggested, evidence> or "none"

NOT DONE
  <anything in scope that was not completed>

FILES CHANGED OUTSIDE THE ALLOWED LIST
  <must be "none">
```

## 6. Reviewing a package

Use a second pass, by a person or by a different model session that has not seen the first one's reasoning, with this instruction:

> Read the brief and the design sections it cites. Read the diff. Do not trust the report. List: (1) anything in the diff that the design does not ask for; (2) any spec value that differs from the design; (3) any invariant in file 12 §4 that the diff could break, with the scenario; (4) any acceptance check that the report marks PASS without showing output. Then run the tests yourself.

A package is accepted when that list is empty, the tests pass on the reviewer's run, and the Open Questions have each been answered by the owner or recorded in the owning design file.

## 7. Keeping the design and the build in step

- When the owner answers an Open Question, the answer is written into the owning design file first, with the date, and then built. The design never trails the code.
- Tuning changes follow file 10 §6.4.
- After each milestone, update `docs/DEVELOPMENT-CHECKLIST.md`: tick the items that milestone's gate proved, with the commit.
- If a model's output conflicts with this design and looks *better*, that is a design proposal. Write it down, decide it, change the design, then build it. It is never merged just because it is there.

## 8. First ten packages (M1)

A concrete starting queue. Each cites its spec.

| ID | Title | Spec | Proves |
| --- | --- | --- | --- |
| WP-M1-01 | Data validator and schemas for bodies, depots, vehicles | 09 §4 | `T-DATA-01` (partial) |
| WP-M1-02 | Fiction clock | 03 §2 | `T-TIME-01` |
| WP-M1-03 | Solar positions, moons, light-time | 03 §3, 04 §2.2 | `T-SOLAR-01`, `T-LIGHT-01` |
| WP-M1-04 | Depot generation (seed 1129) with authored overrides and lit/dark | 03 §8.1 | fixture match with the prototype for unchanged sites |
| WP-M1-05 | Route planner port | 03 §9.1 | `T-ROUTE-01`, `T-ROUTE-02` |
| WP-M1-06 | Reference trajectory solver and test | 03 §4 | `T-TRAJ-01` |
| WP-M1-07 | Ship model, fuel, cruise logic | 03 §5–7 | `T-FUEL-01`, `T-CRUISE-01` |
| WP-M1-08 | Docking model and capture evaluation | 03 §12 | `T-DOCK-01`, `T-DOCK-02` |
| WP-M1-09 | Ground vehicle step, port of `stepRover` with grip and airborne | 03 §13.1 | `T-GROUND-01` |
| WP-M1-10 | Save schema v2, validation, backup rotation, migration fixture | 09 §5 | `T-SAVE-01` |

Then: stages and grants; mail delivery; threads and windows; photo subject rule. After those, M2 begins.

## 9. A worked example brief

```
WORK PACKAGE  WP-M1-08
Title         Docking model and capture evaluation
Milestone     M1

READ FIRST
  docs/design/00-README.md
  docs/design/12-AI-BUILD-PROTOCOL.md
  docs/design/03-CORE-SYSTEMS.md  §12 (all), §1 (states docking, docked_latch)
  docs/design/08-UX-CONTROLS-ACCESSIBILITY.md  §1.3
  docs/design/11-CONTENT-REGISTRY.md

GOAL
  A pure module that steps the lander's position, velocity and attitude from
  inputs, and evaluates contact as capture or rejection with a reason. No
  rendering, no input reading, no engine types.

IN SCOPE
  - State: position (m, port frame), velocity, attitude, angular rate, lockout timer.
  - step(state, input, dt, assist_level) -> state
  - evaluate(state, assist_level) -> none | capture | reject(reason)
  - Start pose with the per-site deterministic variation.
  - Brake, Align (Standard), automatic attitude and lateral damping (Guided),
    Reset, wander limits, three-rejection offer flag.
  - Tests T-DOCK-01 and T-DOCK-02.

OUT OF SCOPE
  - HUD, camera, sound, the latch sequence, cargo transfer, saving.
  - Any orbital mechanics. The Kestrel does not move.
  - Any damage model.

INPUTS THAT ALREADY EXIST
  core/time (WP-M1-02)

FILES THIS PACKAGE MAY CREATE OR CHANGE
  game/core/docking.*    game/tests/docking_test.*    game/data/vehicles.json (veh_wren block only)

SPEC VALUES  (03 §12)
  start pose (+38, −22, +215) m; yaw −10°, pitch +6°; variation ±12 m X/Y, ±4° yaw
  translation accel 0.20 m/s² per axis; precision ×0.25; speed cap 6.0 m/s
  rotation 8°/s; brake 0.30 m/s²; align ≤ 6 s
  capture: axial ≤ 0.25 m; lateral ≤ 0.30 m; pitch/yaw ≤ 4°; roll ≤ 8°;
           closing 0.03–0.30 m/s; lateral speed ≤ 0.08 m/s; held 0.2 s
  Guided tolerances ×1.5
  reject: +0.25 m/s along +Z; lateral velocity ×0.5; lockout 1.5 s
  wander: zero velocity at 600 m; reset at 1,000 m

ACCEPTANCE
  T-DOCK-01, T-DOCK-02 pass.
  Manual: none (no scene yet).

REPORT BACK
  Format in file 12 §5.
```

## 10. What an AI model should be told about this project, in five sentences

> This is *The Third Ring*, a quiet, authored, single-player game about a courier crossing the real Solar System; nobody dies, nothing is timed, and there is no combat, currency or score. The design in `docs/design/` is complete and is the authority: build exactly what it says, with its numbers and its names. If something is missing or contradictory, stop and report it with one proposed answer rather than inventing. Stay inside the files your work package lists, keep rule code pure and tested, and keep every player-facing string in a text key. You are done only when the acceptance checks have been run and their output is in your report.
