# 09 — Build order, milestones, acceptance gates, and release

## Planning assumptions

The full scope is three seeded countries, convincing vehicle physics and sound, build-anywhere sites, a reactive road network, ferry travel, and a complete story. This is materially larger than the earlier one-region concept. A small experienced team should plan in **milestones rather than promising a calendar date**. An 18–36 month range for a focused 3–5 person production is a rough planning hypothesis, not a budget commitment; solo development may take substantially longer. Re-estimate after the first two gates.

Every milestone ends with a playable packaged Windows build, a measured risk report, and a decision about scope.

## Phase 0 — Preproduction contracts (2–4 weeks hypothesis)

Write and version the core data schemas, source/asset licensing register, country topology rules, beginner car spec, target PC matrix, controller/input map, and story anchor list. Pick one engine candidate for the spike and pin its version. Define a ten-minute “night drive” benchmark route before world generation starts.

Exit: the team can explain who owns world truth, vehicle truth, and save truth; a lead can list cuttable features without undermining the central fantasy.

## Phase 1 — Authored handling and atmosphere slice (6–10 weeks hypothesis)

Build one car, one hand-made 3–5 km road loop, one junction, one viewpoint, one service stop, cabin camera, radio/music placeholder, rain/clear variation, and basic repair/recovery. Compare Engine Simulator integration against a cheaper engine model. Build and profile a Windows executable.

Exit: new testers enjoy an unprompted ten-minute drive; basic novice repair works; vehicle control is stable at road seams; audio has no persistent artifacts; the target test machine runs the scene at agreed settings. If this fails, fix the drive before building a generator.

## Phase 2 — Logical seeded world prototype (8–12 weeks hypothesis)

Implement `WorldGen` as a testable library and CLI; produce a coarse three-country map, sea cut, Marren spawn, ferry port at target route distance, Hest and Soren topology, road graph, settlements, service coverage, story anchor sites, and validation report. Render this first in a seed inspector; drive a simplified version only after graph tests pass.

Exit: thousands of seeds pass invariants, chosen seeds look different yet coherent, and failure cases generate useful diagnostics. No seed may omit a required story route or essential service.

## Phase 3 — Seeded vertical slice (10–16 weeks hypothesis)

Integrate terrain/road chunks, collision streaming, one Marren district, ferry crossing, one Hest arrival town, a few settlement roles, save/reload, player camp, and a short chapter-1 story scene. Preserve the good authored driving feel from Phase 1.

Exit: a player can create a seed, drive from spawn to ferry, cross to Hest, return home, save and reload anywhere safe, and find their car/camp/road discoveries intact. Cold-load and U-turn streaming have no severe hitch or missing collision.

## Phase 4 — Systems alpha (several months; re-estimate)

Expand road grammar and content kits, add vehicle parts/fitment, economy and stock, multiple settlement profiles, traffic, weather/audio variation, construction tiers, on-foot local interactions, accessibility options, and regional story binding. The world should support hours of Marren free play before plot entry.

Exit: novice and enthusiast playtests both find satisfying depth; seeded sites feel place-specific; neither fuel nor repair shortages soft-lock progression; three consecutive 60-minute saves resume correctly.

## Phase 5 — Three-country story alpha (several months; re-estimate)

Author named characters, Hest missions, Soren commitment, yard, two-car finale, homecoming, credits, and post-story world. Use temporary voice/audio first; lock story pacing before expensive final production. Test minimal and maximal optional preparation.

Exit: start-to-credits playthrough works on multiple seeds with no quest soft-lock; the final drive is compelling as play, not only as a cinematic; post-credits exploration works.

## Phase 6 — Content, art, optimization, and beta

Replace placeholders with finished road/settlement kits, car interiors, sounds, radio content, UI, character moments, and localization-ready text. Profile cold and warm loads, integrated/midrange/high-end PCs, long drives, traffic, weather, and final sequence. Fix p99 frame spikes and audio underruns, not just average FPS. Run large seed corpus and save-migration regression after every generator/content change.

Exit: the agreed Windows hardware matrix meets measured frame, memory, crash, load, and control targets; external players can finish the game and continue free play without developer help.

## Phase 7 — Steam release preparation

Create the Steamworks app and store materials, complete required store/build checklists, publish a Coming Soon page when the scope and visual identity are credible, upload private test builds, configure saves/achievements, test clean installs and updates, submit for review, then release only after the build and store gates pass. Steam's current [Coming Soon](https://partner.steamgames.com/doc/store/coming_soon) and [upload](https://partner.steamgames.com/doc/sdk/uploading) docs govern the exact process and timing; verify them again at launch.

Exit: a fresh Windows machine can install, start, complete an early drive, save, update, and resume. Credits and required third-party notices are present. Store media depicts the shipping game honestly.

## Risk register and cut order

| Risk | Early proof | If it fails |
| --- | --- | --- |
| Driving is dull | Phase 1 player tests | Rework control/audio/road rhythm before more map |
| Engine Simulator too costly | Phase 1 A/B profiling | Keep offline reference or simple torque/audio runtime |
| Runtime seeded world stutters | Phase 3 Windows benchmarks | Generate/bake chunks at New Game, shrink world, reduce detail |
| Procedural roads feel generic | Phase 2–3 seed reviews | Increase authored road grammar and curate mandatory routes |
| Three-country content too large | Alpha content budget | Keep identities, reduce land area and town count |
| Finale needs fragile convoy AI | Scripted prototype | Use a few staged cars and off-screen ally state |
| Building anywhere breaks routes | Construction validator | Restrict permanent builds to generated parcels; keep portable camps broad |
| Story eclipses calm play | Marren free-play tests | Delay/silence story triggers until deliberate crossing |

The first features to cut are extra vehicle classes, elaborate pedestrians, large city interiors, fully simulated supply trucks, deformable terrain, and many unique story branches. Preserve the driving feel, Marren freedom, ferry threshold, three-country logic, and strong playable finale.

## Test matrix

Automated: world seeds/constraints, route reachability, service coverage, part fitment, save round trips and migration, chapter state transitions, ferry recovery, build placement, and credits transition.

Manual: ten-minute mood test, novice car onboarding, enthusiast tuning depth, route readability at night, keyboard/controller feel, repeated long drives, player-made camps, ferry atmosphere, full story, after-story roaming.

Performance: CPU/GPU frame time percentiles, collision/mesh activation spikes, streaming readiness distance, memory growth over 60 minutes, audio underruns, cold shader/cache behavior. Record exact hardware, build ID, seed, route, and settings. Initial targets are in the prior [architecture review](../Night-Drive-Review-and-Roadmap.md); adopt final minimum specs only after measurement.
