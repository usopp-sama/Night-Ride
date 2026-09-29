# 08 — Software architecture: first process to end credits

## Engine choice and `main.cpp`

The user's “from `main.cpp` to credits” request means the entire runtime path should be specified. For a shipping game, the current *candidate* is Unreal Engine with C++ gameplay, selected for a Windows vehicle/large-world spike. Unreal owns the executable entry point; a game project normally supplies a module startup and game instance rather than a handwritten game `main.cpp`. The standalone **world generator and validation CLI** can have a real `main.cpp`. This distinction avoids designing an unnecessary custom rendering engine merely to own an entry file.

The engine remains provisional until the first Windows spike. Unreal's [Chaos Vehicles](https://dev.epicgames.com/documentation/unreal-engine/chaos-vehicles) provides a vehicle starting point, and [World Partition](https://dev.epicgames.com/documentation/unreal-engine/world-partition-in-unreal-engine) streams authored grid cells. Neither automatically solves per-save generated roads or a custom engine model. Our logical generator and generated-content streamer must remain game-owned. If the spike fails on target hardware or runtime world creation, keep the same module contracts and re-evaluate Unity/custom C++ without rewriting design policy.

## Proposed project tree

```text
NightDrive/
  Docs/                         # this design package, ADRs, content guides
  Game/                         # Unreal project, C++ modules, packaged assets
    Source/NightDriveCore/       # types, IDs, data contracts, fixed-step interfaces
    Source/NightDriveWorld/      # manifest loading, road graph, chunk streamer
    Source/NightDriveVehicle/    # input, drivetrain, physics adapter, condition
    Source/NightDriveStory/      # quest graph, binding, chapter state
    Source/NightDriveSave/       # serialization, migrations, backups
    Source/NightDriveAudio/      # read-only vehicle/world parameter bridge
    Source/NightDrivePlatform/   # Steam and local-platform adapter
    Content/                     # art, templates, audio, UI, authored scenes
  Tools/WorldGen/                # C++ executable with main.cpp
  Tools/SeedInspector/           # map/graph/debugging tool
  Data/                          # versioned vehicle, settlement, world rules
  Tests/                         # generator, save, physics, integration tests
  ThirdParty/                    # pinned dependencies and license records
  Build/                         # local scripts; no secrets in source control
```

Exact Unreal module names can change; boundaries should not collapse into one giant game class.

## First executable path

The game process flows:

`OS launch → engine bootstrap → NightDrive module startup → settings → menu → New/Continue → manifest load/generation → initial chunks/collision ready → player/car spawn → fixed vehicle ticks + rendering/audio/story → saves/transitions → finale → credits → post-story world → quit`.

The worldgen CLI's `main.cpp` does three jobs only: parse seed/config or validation arguments, call `GenerateWorld(...)`, write/read a versioned manifest and diagnostics, and exit with an error code if constraints fail. The same generator library is called from the game at New Game. Avoid separate logic paths that produce different worlds from the same seed.

## Runtime systems and ownership

| System | Owns | Reads from | Never does |
| --- | --- | --- | --- |
| Game session | session state, new/continue/quit | save, world, story | vehicle physics calculations |
| World manifest | immutable generated layout and IDs | generation rules | player progress |
| World streamer | active visual/collision chunks | manifest, player route prediction | story decisions |
| Road graph | routes, distances, access tags | manifest, story overlays | render mesh as truth |
| Vehicle simulation | chassis/engine/drivetrain/condition | input, surfaces, parts | UI/audio rendering |
| Audio bridge | parameter snapshots and mixing requests | vehicle/world snapshots | alter vehicle state |
| Settlement/economy | stock, services, local jobs | manifest, story, elapsed game time | spawn thousands of real trucks |
| Construction | placed structures and inventory | land parcels, world rules | modify mandatory graph silently |
| Story director | chapter flags, quest steps, scene roles | stable world IDs, player actions | rely on loaded actor pointers as truth |
| Save service | durable snapshot and migrations | all serializable state | write during audio callback |
| Platform adapter | achievements, cloud hooks, overlay | story events, save paths | block offline play if Steam absent |

Stable IDs and plain data cross boundaries. Rendering actors are disposable projections of saved state. Story, roads, and services must remain valid when scenery chunks are unloaded.

## World streaming

Use `requested → prepared → collision-ready → visual-ready → active → retained → evicted`. Prepare the likely forward route and junction branches early, keep a ring around the player for U-turns, and never evict supporting road collision while a car is on it. Apply a frame-time budget to actor/mesh activation; background generation alone can still cause a main-thread hitch.

The ready distance must be measured: `speed × high-percentile preparation latency + braking distance + margin`. At a hypothetical 100 km/h, two seconds of latency already consumes roughly 56 metres before braking/margin. Generated collision and road visuals must agree on seams. A ferry landing is a loading barrier where destination collision is ready before the car is released.

Because Unreal's World Partition is documented around streamable level cells, do not assume it can generate a unique player seed by itself. Use authored tiles/templates and a separate runtime chunk layer for resolved road/terrain content; test both memory and cooker/package behavior in the spike. [World Partition documentation](https://dev.epicgames.com/documentation/unreal-engine/world-partition-in-unreal-engine)

## Saves and migrations

Each save consists of a versioned manifest reference/copy, player state, vehicles, structures, discovered roads, settlement state, story state, economy clock, and last safe spawn. Separate graphics settings from the journey. Write a temporary file, verify it, replace the live slot using a platform-supported safe operation, and keep a prior good copy. Test interruption at every stage.

Store generator version, schema version, build/content version, and migration history separately. A seed alone is insufficient once algorithms or assets change. Physics replays can be tolerance-based; do not promise bit-identical simulation across CPUs and engine versions.

## Time and simulation frequencies

- Fixed vehicle step: initial target 60 Hz; measure and tune.
- Slower wear/temperature/economy updates: suitable lower cadences with accumulated time, not frame count.
- Traffic near player: full local behavior; distant traffic: graph-level records, sparse updates.
- Audio callback: independent, nonblocking, consuming smooth snapshots.
- UI/render: interpolate latest stable physical states.

All systems use an explicit world clock with pause and save semantics. Ferries advance time by a defined travel duration. Story deadlines begin only at specific player commitments; free roam does not secretly consume a finale timer.

## Platform and release path

Build a packaged Windows executable and run it on test hardware from the first milestone. Steam services sit behind an optional adapter: local saves and menu work without Steam. Later add achievements, Cloud configuration for journey saves, crash reporting with consent, and SteamPipe builds. Steam's [Cloud documentation](https://partner.steamgames.com/doc/features/cloud) and [SteamPipe upload guide](https://partner.steamgames.com/doc/sdk/uploading) are the release references. Actual account setup, store page, and release are future production tasks.

Credits playback is a presentation state; story resolution is saved before credits begin. Skipping credits cannot skip the state transition. A crash during credits resumes in `StoryResolved` with an option to view credits or continue.
