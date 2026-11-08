# Shared browser and desktop prototype

**Historical playtest baseline:** as of 8 November 2026, the user has ruled out Electron for the desktop release. These instructions preserve the already-built experiment; they are not the production/Steam plan. See [native desktop development](NATIVE-DESKTOP-PLAN.md).

Updated 7 November 2026. Electron is the current **desktop feasibility baseline**, not a commitment that it will be the final Steam runtime. There is no duplicate game implementation to synchronize: the desktop app packages the same `dist` directory that the web server serves.

## What is shared

Both versions contain the expanded solar-system scale, eight moving planets, route planning, 269 fuel depots, the enlarged Mars settlement, rover physics, the controller activity, local navigation, residents, discovery stamps and scene fades. Changes to these files go to both platforms on the next reload/rebuild.

The desktop layer adds a standalone window, fullscreen menu, offline asset loading and native field-log files. It serves bundled assets from `orbit://game` with a custom local protocol; it does not start Python, open a network port, fetch the hosted website or require the internet while playing. The renderer has no Node integration, runs isolated/sandboxed, and sees only a small preload save API. New windows, page navigation and permission requests are denied. The page uses a local content-security policy. Google Fonts requests were removed; typography uses the existing system fallbacks, avoiding an offline dependency.

This preserves today's rendering and gameplay. It does not automatically add a new physics engine, controller support, Steamworks, a native editor or advanced terrain streaming. Full flight/expedition saves are still pending; current persisted progress is the Mars field log.

## Run or package

Install a current Node.js version compatible with the pinned toolchain (Node 24 is used by the Windows workflow; this Mac used Node 26). From `games/orbit-run`:

```sh
npm ci
npm test
npm run desktop
```

The first Electron launch may download its official runtime if it is not already installed. That is a development setup step. Once packaged, the player does not need Node, npm, Python or that download.

```sh
npm run desktop:package
```

This packages the host platform and architecture. The current Mac produces `releases/Orbit Run-darwin-arm64/Orbit Run.app`. Open that app directly. It is an unsigned development prototype, not a notarized Mac release.

On the Windows development PC:

```sh
npm ci
npm test
npm run desktop
npm run desktop:package:win
```

The result is the complete `releases/Orbit Run-win32-x64` folder. Run `Orbit Run.exe` **with the other files alongside it**. This is a portable folder, not an installer or a Steam release. Do not distribute only the executable. Run the Windows packaging command on Windows for the initial supported workflow; cross-packaging from macOS is not our verification target.

The repository includes `.github/workflows/orbit-desktop.yml`, a manually triggered Windows build with tests and an unsigned downloadable artifact. It is configured but has not been run during this Mac milestone. Manual workflows generally need to be present on the repository's default branch before their dispatch button is available; until this feature branch is merged, use the local Windows commands above. Nothing is published to Steam or GitHub Releases by the workflow.

## Saves and portability

`dist/platform.js` chooses native IPC on desktop and browser local storage on the web. The JSON field-log format stays version 1 with additive optional discovery metadata. The game validates stage, coordinates, collision bounds and destination IDs when loading, so older field logs remain usable even after map expansion.

The native save slot is `orbit-run.mars.v1.json`, under Electron's per-user application-data directory, in a `saves` folder:

- macOS: `~/Library/Application Support/Orbit Run/saves/`.
- Windows: `%APPDATA%/Orbit Run/saves/`.

Autosaves are queued and ordered. A write validates JSON and size, preserves the previous syntactically valid record as `.bak`, writes a temporary file, flushes it and renames it over the primary record. A malformed or unreadable primary record falls back to the backup. The gameplay decoder independently checks whether the recovered record is usable. This is a practical prototype recovery mechanism, not a guarantee against every filesystem or power-loss failure.

Departure waits for its save. Closing the desktop window asks the renderer to save, then drains pending native writes before quitting. If saving stalls, the app offers to keep playing or quit using the last successful autosave. No arbitrary file path or generic IPC method is exposed to the page. Save tests exercise ordering, corrupt-primary recovery, invalid payload rejection and continued operation after a rejected write.

Browser and desktop use independent storage locations. This milestone does not silently import, overwrite or synchronize an existing browser save. An explicit export/import interface and eventual Steam Cloud policy remain follow-up work. Do not put saves inside the packaged app folder.

## Files and ownership

| File | Responsibility |
| --- | --- |
| `dist/*` | Shared game, assets, UI and pure simulation policy |
| `dist/platform.js` | Browser/native persistence boundary and pending-write drain |
| `dist/transitions.js` | Interim fade bridge and input/simulation hold flag |
| `desktop/main.cjs` | App/window lifecycle, bundled-asset protocol, trusted IPC, fullscreen/quit menu |
| `desktop/preload.cjs` | Narrow renderer bridge |
| `desktop/save-store.cjs` | Ordered native file writes and backup reads |
| `scripts/package-desktop.mjs` | Repeatable portable app packaging |
| `package-lock.json` | Pinned dependency resolution |
| `.github/workflows/orbit-desktop.yml` | On-demand Windows test/package artifact |

No credentials, signing certificates or Steam keys are required for this prototype. Build artifacts and dependencies are ignored by Git. Keep the package recipe, tests and lockfile in source control.

## Verification record and remaining Windows gate

**Completed on this Mac:** 23 pure simulation/save tests; browser Mars rendering, distant-destination plotting, departure fade, and field-log discovery restoration; Mac ARM64 packaging and launch of the packaged app from bundled local assets; native primary and backup files observed; and a packaged gameplay round trip. The native playthrough covered acceleration, steering and braking, controller pickup and visible cargo, Mara’s captioned conversation, quitting/reopening with cargo/stage/position/waypoint/discovery restored, local atlas access, cargo-preserving recovery, solar delivery and the power change to 78%, third-ring inspection/completion, departure to orbit, approach back to Mars and re-entry with the completed job and four discovery stamps intact.

These are manual Mac packaged-app results, not Windows verification. Every new district route, target-hardware performance, controller support, long suspend/resume and complete expedition persistence still need their separate checks. The optional `desktop:smoke` self-check was not used as evidence for this native playthrough.

Run these on the Windows PC before claiming Windows support:

- [ ] Clean install of dependencies from the lockfile and all tests pass.
- [ ] Launch the packaged folder with no Node, Python or development server involved.
- [ ] Launch offline; both scenes, maps, text and synthesized audio work.
- [ ] Drive to the workshop, collect the controller, restore solar power, inspect the third ring.
- [ ] Visit each new district by road; check geometry, slopes, turning room and the selected destination.
- [ ] Park near a resident and use T/the talk button; all conversation text remains readable.
- [ ] Save, close, reopen; stage, cargo, rover, waypoint and discovery stamps restore.
- [ ] Damage a disposable test save and verify the documented backup behavior.
- [ ] Test window close, Alt+F4, fullscreen, alt-tab, sleep/resume and focus loss while driving/loading.
- [ ] Enter/leave Mars repeatedly; check stale inputs, route/fuel behavior and memory growth.
- [ ] Test the system map, cruise, asteroid refuelling, rescue and the existing non-Mars prototype landings.
- [ ] Measure loading, frame times and memory at original campus, homes, freight, remote power and survey view.
- [ ] Record GPU, CPU, RAM, Windows version, display resolution/scaling and the exact commit.

Controller, remapping, graphics settings, complete expedition saves, production signing/installers, automatic updates, transport cinematics, docking and Steam integration remain separate milestones. See the [long-term roadmap](DESKTOP-AND-STEAM-ROADMAP.md) and [scene bridge plan](SCENE-BRIDGES.md).
