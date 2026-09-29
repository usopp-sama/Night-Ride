# 12 — Ordered implementation backlog: bootstrap to credits

This is an execution checklist, not a guarantee that one programmer can complete each step in a day. Each item names its output and a proof that it works. Keep tasks small enough to review in a pull request. Start with the chosen Windows engine version pinned in source control and CI.

## A. Repository and first executable

1. Create source repository, large-asset policy, branch/review rules, `.gitignore`, license register, build scripts, and `/Docs` index. CI must build a clean checkout. Output: empty packaged Windows game that opens and quits cleanly.
2. Create the Unreal C++ project/module. Add `NightDriveGameInstance` with `Boot → MainMenu → Loading → Playing → Credits` top-level states. Add a log category and crash/build ID display. Test: a packaged build reaches a placeholder menu without the editor.
3. Create `Tools/WorldGen/main.cpp` and a shared `WorldGenCore` C++ library. Parse `--seed`, `--generator-version`, `--output`, and `--validate`; return nonzero on invalid input/world. Test: same inputs produce byte-identical canonical manifest hashes on the supported Windows toolchain.
4. Add CI jobs for game compile, worldgen unit tests, packaged smoke launch, and a seed corpus. Save artifacts and logs by build ID. Keep credentials out of the repository.

## B. Car and first road

5. Define `VehicleDefinition`, `PartDefinition`, `VehicleInstance`, `VehicleInput`, and `VehicleSnapshot` types with explicit units. Add validation for impossible masses, duplicate sockets, and invalid torque curves.
6. Build a greybox road with start, straight, bends, junction, hill, gravel stretch, and a parked viewpoint. Add the initial car chassis and camera. Test with keyboard and controller in a packaged build.
7. Implement fixed-step vehicle update and read-only snapshots. Separate input, drivetrain, wheel contact, chassis, wear, presentation, and audio adapters. Test start/stop/reverse/brake/steer on the greybox route.
8. Run the Engine Simulator integration spike from [03](03-vehicle-physics-and-engine-sim.md). Pin upstream revision and notices; compare a game-owned torque/audio fallback. Record CPU, audio latency, and handling observations. Make one documented choice.
9. Add cabin sound, road/tire sound, radio placeholder, headlights, rain, and one repairable fault. Test the ten-minute peaceful drive with people unfamiliar with the project.

## C. World generation library

10. Implement named seeded PRNG streams and stable feature IDs. Add cross-run determinism tests. Do not generate any mesh yet.
11. Implement country topology and coast masks. Assert Marren's land separation from Hest/Soren, and Hest–Soren land connection. Produce a flat debug map for every seed.
12. Implement spawn and ferry candidate solve with road-distance band, angular variation, bounded repair/fallback, and diagnostics. Fuzz thousands of seeds and inspect the angle histogram.
13. Implement settlement candidates and a road graph connecting the spawn, Marren port, Hest port, required hubs, Hest/Soren crossing, yard, and final route. Add graph reachability and road-geometry tests.
14. Implement terrain macrofields and road-conforming terrain. Add collision-ready road/bridge/tunnel templates. Build a headless road-envelope validator using the beginner car's width, clearance, and turn radius.
15. Implement service coverage solver, optional specialty rolls, story site binding, and POI/decorative placement. Validate at least one route to fuel, repair, rest, and guaranteed story supplies at each required phase.
16. Freeze a versioned manifest with stable IDs and hash. Create `SeedInspector` overlays for coast, roads, grades, services, ferry distance, and story anchors. Curate a regression seed set that includes previous failures.

## D. Runtime world and persistence

17. Build runtime chunk preparation from the manifest. Stream collision before decoration; hold adjacent collision for reversing and U-turns. Add telemetry for requested/prepared/activated times and missing-road errors.
18. Drive from Marren spawn to ferry on several seeds. Confirm that road geometry and collision agree, signs point to real graph destinations, and frame spikes are inside the agreed budget.
19. Implement settlement template instantiation from service slots. Add one town, one village, one stop, and ferry ports with valid parking and interactions. Ensure unloaded settlements retain logical stock/story state.
20. Add save header/body, checksum, prior-good backup, and explicit schema migrations. Test save/reload before/after a road discovery, part install, camp placement, and ferry transition.
21. Implement ferry deck transition: boarding save, destination preload, sky/time advance, arrival placement, and failure recovery. Test first-time full crossing and skippable repeat crossing.
22. Implement local on-foot interactions, portable camp, field bench, storage, and build parcel validation. Test players can stop and resume far from the initial spawn without a fixed garage.

## E. Open-world play systems

23. Add part compatibility, inventory, accessible and advanced diagnostic views, repair, auto-service, tow/recovery, and vehicle customization. Test novice completion of a breakdown and expert predictability of tuning changes.
24. Add small jobs and regional economy records: delivery, repair, salvage, and mapping. Prices and stocks can vary, but baseline fuel and recovery remain covered by generation rules.
25. Add near-traffic behavior and distant graph-level traffic records, then weather, radio programs, discovery journal, map, signs, and scenic POIs. Test long drives and U-turns for traffic popping and streaming churn.
26. Add controller rebinding, subtitles, camera comfort, assist presets, graphics/audio settings, and pause. Run accessibility and first-time-player sessions before declaring the free-play loop complete.

## F. Story production

27. Author story beats as versioned data with prerequisites, role requirements, idempotent completion actions, and recovery. Implement the chapter state machine in [06](06-countries-sea-ferry.md).
28. Bind the first Hest night stop and recurring named characters to generated sites. Test arrival by radio clue, by other clues, and by ferry wandering. No plot deadline runs in Marren.
29. Implement Hest missions around specific people and cars, Elias's trail, and the transport agreement. Add the return ferry check at every Hest milestone. Test a player can take a long scenic detour without losing the quest.
30. Implement Soren commitment scene, warning, save, border registration, yard access, Elias encounter, second car state, and preparation phase. Test reload and soft-lock recovery after each beat.
31. Prototype the Last Night Run in greybox. Use staged route closures, a small number of visible companion vehicles, and off-screen ally progress. Test minimal and maximal optional preparation; remove tasks that require fragile follower AI.
32. Replace finale placeholders with final art, sound, radio, dialogue, route signage, checkpoint pacing, and camera moments. Check that the decisive action is driving and car care.
33. Implement homecoming, state save before credits, credits playback/skip/replay, and `PostStoryFree` transition. Test quitting or crashing during credits, then loading; no world or story state may be lost.

## G. Shipping path

34. Profile cold and warm packaged builds on defined Windows hardware. Fix frame-time spikes, audio underruns, memory growth, long-world load, and bad seed generation before increasing content density.
35. Run seed fuzzing and full-story regression on a representative seed corpus. Include migration tests for saves created by older supported generator/content versions.
36. Run external playtests for peaceful free play, novice repairs, route clarity, Hest story motivation, Soren commitment, finale tension, and post-story freedom. Revise pacing where players naturally disengage.
37. Prepare store assets, Steam configuration, private branches/builds, save cloud policy, achievements, credits/notices, and clean-install/update tests. Release only after the final Windows build and store review pass.

## Dependency and cut rule

Do not start tasks 10–16 at full art scale before task 9 proves that driving itself is enjoyable. Do not expand to all three countries before tasks 17–22 prove seeded travel, ferry crossing, and save persistence. Do not record final voice performances before task 31 proves the playable climax. If the schedule slips, reduce world area, town count, rare parts, and secondary missions; preserve the first car, Marren's freedom, ferry threshold, country progression, and final two-car return.
