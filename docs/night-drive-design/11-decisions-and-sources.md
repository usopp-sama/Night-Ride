# 11 — Decisions, open gates, and source register

## Decisions in this package

| Topic | Decision | Rationale |
| --- | --- | --- |
| Story | Preserve the Night Line / Elias and the second car plot | This is the currently agreed emotional arc |
| Story start | Only after arrival in Hest | Protects Marren's calm sandbox |
| Countries | Marren across sea, ferry to Hest; Hest–Soren land route | Makes the first departure felt and keeps geography coherent |
| Ferry placement | Consistent drivable distance band, seed-varied direction | Satisfies player expectation more reliably than straight-line distance |
| World generation | Deterministic logical manifest, constraints first, decorations later | Randomness cannot break roads, supplies, or story |
| Settlements | Geographic archetypes and weighted services with coverage guarantees | Variation remains useful and plausible |
| Vehicle | Physics stack with one authoritative torque/RPM path | Audio, UI, and chassis must agree |
| Engine Simulator | Prototype as engine response/audio adapter; pin code and compare fallback | Upstream describes a demonstration focused on audio/response |
| Building | Portable camps broadly; larger sites on valid parcels | Freedom without corrupting roads/story anchors |
| Soren lock | Clear story commitment with saving and local exploration | Tension without an arbitrary or exhausting hard lock |
| Release | Windows single-player first, Steam after packaged-build gates | Matches the stated platform and keeps systems testable offline |

## Decisions still requiring a prototype

1. **Game engine:** Unreal C++ is the current candidate because of the user's C++/physics direction. The earlier roadmap proposed Unity URP. Compare by actually packaging the same driving slice on the target Windows PC; choose one after measured handling, lighting, streaming, and iteration cost. If Unreal is selected, there is no user-authored game `main.cpp` because the engine owns process entry; the standalone worldgen tool does have one.
2. **Vehicle foundation:** evaluate Chaos Vehicles, a customized wheel model, and Engine Simulator engine/audio integration as separate layers. Do not confuse engine combustion simulation with whole-car suspension/contact simulation.
3. **Runtime generation:** test generated road/terrain chunk creation and collision activation under real Windows frame budgets. If runtime generation stutters, generate/cache chunks at New Game or use more prebuilt tiles.
4. **World scale:** the 12–18 km Marren spawn-to-ferry route is an initial travel target. Set country sizes and settlement counts after testing the perceived length and content density of drives.
5. **Time of day:** “Night Drive” needs a strong night identity. Whether the game uses full day/night simulation or primarily evening/night scenes is an art and performance decision for the first slice.
6. **Story presentation:** voice acting, text, radio, and in-car scenes need a costed prototype. Preserve story clarity with text/subtitles if full voice becomes too expensive.
7. **Accessibility and assists:** decide exact presets after observing novice and enthusiast tests, while keeping all story routes completable on beginner settings.

## Key research notes

- [Engine Simulator repository](https://github.com/ange-yaghi/engine-sim): upstream calls it a real-time combustion simulation for audio/response and warns against using it as an engineering tool; README describes the source as demo code. The README currently says the project has moved for newer releases, so pin and review the exact upstream revision before integration.
- [Engine Simulator MIT license](https://github.com/ange-yaghi/engine-sim/blob/master/LICENSE): permits use/modification/distribution with notice preservation. Review bundled dependencies and shipped assets separately.
- [Unreal Chaos Vehicles](https://dev.epicgames.com/documentation/unreal-engine/chaos-vehicles) and [vehicle setup](https://dev.epicgames.com/documentation/unreal-engine/how-to-set-up-vehicles-in-unreal-engine): official starting points for a vehicle prototype. These do not establish the final feel or performance.
- [Unreal World Partition](https://dev.epicgames.com/documentation/unreal-engine/world-partition-in-unreal-engine) and [PCG generation modes](https://dev.epicgames.com/documentation/unreal-engine/using-pcg-generation-modes-in-unreal-engine): useful streaming/authoring tools, but the unique per-save logical manifest and its validation remain our responsibility.
- [Steam Cloud](https://partner.steamgames.com/doc/features/cloud), [SteamPipe upload](https://partner.steamgames.com/doc/sdk/uploading), and [Coming Soon page](https://partner.steamgames.com/doc/store/coming_soon): official Steam release references. Recheck at implementation/release time because platform rules and tools change.
- [Earlier Night Drive architecture review](../Night-Drive-Review-and-Roadmap.md) and [story handoff](../Night-Drive-Story-Handoff.md): local context used to build this package. Where they conflict with newer user decisions, this package follows the newer decisions.

## Change control

Pin versions of engine, generator, Engine Simulator source (if used), content packs, and save schema. Record a short architecture decision record when a prototype resolves an open gate. Before changing any rule that alters old seeds, define how existing saves migrate. Review story changes against four invariants: Marren remains peaceful, Hest can be left, Soren commitment is explicit, and the final act is played through cars and roads.
