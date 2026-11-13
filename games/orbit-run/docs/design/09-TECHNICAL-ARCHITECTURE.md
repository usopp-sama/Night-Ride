# 09 — Technical architecture

Engine-neutral structure for the native game, with a Godot 4 mapping in §10. The engine decision gate in the existing roadmap (NATIVE-01, DESKTOP-10) still stands; nothing here depends on a feature only one engine has.

## 1. Principles

1. **Data describes; code interprets.** Bodies, sites, vehicles, stages, mail, threads, postcards and text are data files. No story fact is written in code.
2. **One owner per fact.** Expedition state lives in one object. Scenes read it and send requests; they never keep their own copy of progress.
3. **Rules are pure.** Flight, routing, docking evaluation, ground stepping, mail delivery and stage advancement are functions of (state, input, dt) with no engine calls, so they are testable headless.
4. **Stable endpoints.** Every authored sequence and transition has a named end state. Skip, watch, reload and failure all arrive at that same state through the same function.
5. **Idempotence.** Any grant (cargo, keepsake, thread completion, upgrade, stage advance) is keyed and applied at most once.
6. **Offline and local.** No network calls of any kind in the shipped game except optional platform services behind an adapter that works when absent.

## 2. Project layout

```
game/
  core/                 pure rules, no engine types
    time.*              fiction clock, rates
    solar.*             bodies, positions, light-time, routing
    flight.*            ship model, cruise, fuel
    docking.*           lander model, capture evaluation
    ground.*            ground vehicle step
    skiff.*  rail.*
    mail.*              scheduling, delivery
    stages.*            chapter stage machine
    threads.*           thread and window resolution
    photo.*             subject rule evaluation (given projected bounds)
    save.*              schema, validate, migrate
  data/
    bodies.json  depots.json  waysides.json
    vehicles.json
    sites/<site_id>.json
    chapters/<chapter_id>.json
    people.json  threads.json  postcards.json  keepsakes.json  households.json
    mail/<mail_id>.json  (or one mail.json)
    text/en/*.json       all strings by key
    sequences/<id>.json  authored camera/vehicle tracks
  services/             engine-facing singletons
    coordinator  expedition_state  input_actions  save_store
    audio_director  settings  platform  events
  scenes/
    solar/  orbit/  cabin/
    sites/<site_id>/
    ui/
  assets/               models, textures, audio, fonts (+ ledger)
  tests/                headless rule tests and data validation
tools/                  data validator, trajectory solver, text extractor
```

`core/` must not import anything from `services/` or `scenes/`.

## 3. The coordinator

The only component that changes the expedition state's `phase`, loads or frees scenes, assigns the active vehicle, camera, input context and HUD.

### 3.1 Transition contract
```
request(transition_id, kind, params) -> accepted | rejected(reason)
```
- Rejected if a transition is in progress or `kind` is not allowed from the current phase (file 03 §1).
- On accept: (1) clear held inputs; (2) set input context to `cinematic` or `loading`; (3) begin loading the target scene in the background; (4) play the bridging sequence, which may hold on a looping shot until the load completes; (5) call `apply_endpoint(kind, params)` — the single function that sets phase, vehicle, pose, cargo ownership and local time; (6) write a checkpoint; (7) free the previous scene; (8) set the new input context and HUD; (9) emit `transition_finished`.
- Failure at step 3: play the bridging sequence's abort branch, restore the previous phase, emit `transition_failed`.
- `Skip` jumps from step 4 to step 5 once loading is complete, never before.

### 3.2 Scene lifecycle
Every scene implements `enter(context)`, `update(dt_real, dt_fic)`, `pause()`, `resume()`, `exit()`. A scene that is not the active one receives no updates and no input. `exit()` releases everything it created; a leak test (§9) enforces it.

### 3.3 Main loop
Fixed 60 Hz simulation with an accumulator capped at two steps per frame; render interpolates. The real-time delta passed to the accumulator is clamped to 1/30 s and reset to zero on resume, focus gain and scene change.

## 4. Data schemas

All IDs are lower snake case with a type prefix (file 11 §1). All files carry `"schema": <int>`. A validator (`tools/validate`) checks references, ranges and required fields; it runs in CI and before every build.

### 4.1 Body
```json
{ "id": "body_europa", "name_key": "body.europa", "parent": "body_jupiter",
  "orbit_radius_su": 22000, "period_days": 3.55, "lon0_deg": 0, "retrograde": false,
  "visible_radius_su": 300, "real_distance_au_from": "parent",
  "sites": ["site_europa_halden"], "viewpoint": false,
  "sky": { "parent_angular_deg": 12.2, "parent_az_deg": 90, "parent_el_deg": 3 } }
```

### 4.2 Site
```json
{ "id": "site_europa_halden", "body": "body_europa", "chapter": "ch1_europa",
  "lat": 9.0, "lon_w": 273.0, "limit_radius_m": 1500,
  "gravity_real": 1.31, "vehicle": "veh_skate",
  "apron": { "x": 0, "z": 0, "heading": 0 },
  "stops": [ { "id": "eu_station", "x": -140, "z": -90, "name_key": "site.eu.station" } ],
  "people": [ { "id": "sunniva", "x": -128, "z": -84, "loop": "small" } ],
  "obstacles": [ { "x": -140, "z": -90, "hx": 30, "hz": 18 } ],
  "terrain": "eu_halden_height", "palette": "europa",
  "sequences": { "descent": "seq_eu_descent", "launch": "seq_eu_launch" } }
```

### 4.3 Chapter stages
```json
{ "id": "ch1_europa", "stages": [
  { "n": 0, "intention_key": "ch1.i0",
    "advance": { "type": "talk", "person": "sunniva" } },
  { "n": 2, "intention_key": "ch1.i2",
    "advance": { "type": "condition", "expr": "eu.bearings_crossing >= 1" },
    "grants": [] },
  { "n": 7, "intention_key": "ch1.i7",
    "advance": { "type": "talk", "person": "sunniva" },
    "grants": [ { "keepsake": "ks_europa" }, { "flag": "has_assay" },
                { "offer_thread": "th_sunniva_core" }, { "offer_thread": "th_kofi_recording" } ] } ] }
```
Advance types: `interact` (stop ID), `talk` (person ID), `condition` (expression over chapter variables), `sequence_end`, `choice` (choice ID). Nothing else.

### 4.4 Vehicle, thread, postcard, mail
Vehicle parameters are the table in file 03 §13. Thread and postcard records as in file 04. Mail as in file 04 §2.8.

### 4.5 Text
`text/en/*.json` maps key → string. Variables use `{name}`. A missing key renders as `⟦key⟧` in development builds and fails validation in release builds.

## 5. Save data

### 5.1 Files
Per slot, in the platform's per-user save directory:

```
slot1/expedition.json       current
slot1/expedition.bak1..3    rolling backups (previous three checkpoints at least 5 minutes apart)
slot1/photos/<n>.jpg        512×288 thumbnails
settings.json               shared, separate from slots
```

Write procedure: serialise → validate → write `expedition.tmp` → flush → rename over `expedition.json`. Before the rename, if the last backup is older than five minutes, rotate backups. Load procedure: try current, then backups in order; the first that parses and validates is used, and the player is told once if a backup was needed.

### 5.2 Schema (version 2)
```json
{
  "schema": 2,
  "created_utc": "…", "play_seconds": 0,
  "t_fic": 0.0,
  "phase": "surface",
  "body": "body_mars", "site": "site_mars_hearth",
  "ship": { "x": 0.0, "y": 0.0, "z": 0.0, "vx": 0.0, "vy": 0.0, "vz": 0.0,
            "heading": [0,0,0,1], "fuel": 100.0, "tank": "standard",
            "drive_tier": 1, "drop_tanks": false,
            "route": { "dest": null, "stops": [] },
            "rescue_anchor": "depot_mars_anchorage" },
  "lander": { "state": "surface" },
  "cargo": [ { "id": "cargo_core", "count": 0, "proofed": false, "owner": "hearth" } ],
  "carried": ["item_bea_note"],
  "chapters": {
    "ch0_mars": { "stage": 3, "vars": { "visited": ["workshop","solar"] },
                  "vehicle": { "x": -121, "z": 118, "heading": -0.42 } }
  },
  "choices": { "choice_complaint": null, "choice_letters": null, "choice_testimony": null },
  "threads": { "th_mara_driver": "offered" },
  "keepsakes": ["ks_mars"], "keepsake_given_to_tomas": null,
  "postcards": { "pc_mars": { "sent": true, "photo": 3, "extras": ["vehicle_nomad"] } },
  "mail": { "delivered": ["mail_mara_01"], "read": [], "in_flight": [ { "id": "mail_pip_q2", "sent_at": 123456.0, "origin": [0,0,0] } ],
            "replies": { "mail_mara_01": "r_ok" } },
  "depots": { "lit": ["depot_tern"], "tended": [], "notes": { "depot_tern": [3, 5] } },
  "waysides": { "found": [], "milestone_marked": false },
  "seedling": { "last_watered_day": 0, "cutting_taken": false },
  "upgrades": ["tank_aux"],
  "grants_applied": ["ch0_mars:7:ks_mars"],
  "counters": { "look_home_uses": 0, "dockings": 1, "rejections": 0 },
  "transition": null,
  "postgame": { "credits_seen": false, "trips": 0, "windows_lit_extra": [] }
}
```

Thread values: `unknown` → `offered` → `carrying` → `complete`. `transition`, when not null, names an in-progress transition and its endpoint; loading applies that endpoint.

### 5.3 Rules
- Only plain values and IDs. No engine object references, no file paths, no localised text.
- Unknown fields are preserved on load and written back, so a newer build's save survives a round trip through an older one where possible.
- `grants_applied` keys are `<chapter>:<stage>:<grant>`.
- Migration: one function per version step (`1→2`, …), each covered by a fixture.
- **From the browser prototype:** `orbit-run.mars.v1` (stage 0–3, rover pose, visited) imports as `ch0_mars` with the same stage and `vars.visited`. Offered once, explicitly, from the title screen in the web-to-native path if that is ever built; never automatic.

## 6. Events

A single publish/subscribe bus. Events are facts, past tense, with plain payloads. Systems react to events; they do not call each other.

| Event | Payload | Typical listeners |
| --- | --- | --- |
| `phase_changed` | from, to | HUD, audio director, mail (hold/release) |
| `stage_advanced` | chapter, stage | Journal, mail triggers, audio |
| `chapter_completed` | chapter | Mail, tapes, keepsake placement |
| `cargo_changed` | cargo snapshot | Hold monitor, journal |
| `thread_changed` | thread, status | Journal, mail |
| `choice_made` | choice, value | Mail variants |
| `mail_delivered` / `mail_read` / `reply_sent` | mail id | Notification, journal |
| `postcard_sent` | postcard, extras | Mail |
| `depot_docked` / `depot_lit` / `depot_tended` | depot | Map, journal, save |
| `cruise_started` / `cruise_ended` | leg | Audio, cabin lighting |
| `docking_rejected` / `docking_captured` | reason / — | Tutorial, counters |
| `look_home_held` | seconds, body | Eli thread, counters |
| `wayside_found` | wayside | Journal, map |
| `transition_finished` / `transition_failed` | id | Coordinator clients |

## 7. Budgets

These are **targets to design against, not measured results.** The first native slice must measure them on real Windows hardware and either confirm or revise them in this table (file 10, milestone M2).

Reference machine for targets: a four-core desktop CPU from about 2018, 16 GB RAM, a mid-range GPU of that period with 6 GB memory, 1080p.

| Item | Target |
| --- | --- |
| Frame rate | 60 fps at Medium on the reference machine; 99th-percentile frame time ≤ 25 ms |
| Low preset | 40 fps at 800p on handheld-class hardware |
| Draw calls per frame | ≤ 1,500 on a surface site; ≤ 600 in space |
| Triangles in view | ≤ 1.5 million |
| Site scene memory | ≤ 1.5 GB resident; ≤ 2.5 GB video memory at High |
| Cold start to title | ≤ 12 s |
| Site load (hidden by descent) | ≤ 15 s; the descent holds if longer |
| Save write | ≤ 50 ms off the main thread; file ≤ 300 KB plus thumbnails |
| Install size | ≤ 6 GB |
| Per-site unique texture budget | ≤ 400 MB compressed |
| Dialogue signatures | generated from note data, not long recordings: ≤ 30 MB total |

Techniques assumed: instancing for repeated structures (solar arrays, ring homes, hand lamps, rocks); one static batch per district and material; distance culling of people beyond 500 m; one shadow-casting light per scene plus unshadowed practicals; sites loaded singly.

## 8. Assets

- Source formats: models glTF 2.0 (metres, +Y up, −Z forward), textures PNG/EXR sources compressed at import, audio 48 kHz WAV sources compressed at import.
- Naming: `<site|shared>_<thing>_<variant>`; LODs `_lod0…2`; collision `_col`.
- **Ledger:** `assets/LEDGER.csv` with one row per source file: path, author or generator, tool, licence, date, notes. A build fails if an asset has no ledger row. This matters for store disclosure of any generated content and for font and sample licences.
- No asset may be taken from another game or from an agency's or studio's copyrighted imagery. Real planetary textures must come from public-domain mission data, recorded in the ledger with the source.

## 9. Tests

Headless rule tests run on every change. IDs are stable so work packages can cite them.

| ID | Asserts |
| --- | --- |
| `T-TIME-01` | Fiction clock rates in each phase; pause is zero; a clamped step never exceeds 1/30 s |
| `T-TRAJ-01` | Reference trajectory legs within bounds (file 03 §4) |
| `T-SOLAR-01` | Body positions analytic and continuous across cruise; moons orbit parents; Triton retrograde |
| `T-LIGHT-01` | Light-time equals distance × 499 s/AU within 0.1% |
| `T-ROUTE-01` | Planner connectivity at five epochs; Sun exclusion respected; reserve honoured |
| `T-ROUTE-02` | Tern and Petrel on the outbound routes; home line passes Petrel and Albatross |
| `T-FUEL-01` | Range per tank; consumption per distance; tow at zero |
| `T-CRUISE-01` | Engage conditions; course hold reaches a moving target; swept obstacle avoidance; drop-out distances |
| `T-DOCK-01` | Capture only when all six conditions hold for 0.2 s; each single violation rejects with the right reason; tolerances scale in Guided |
| `T-DOCK-02` | Reset, wander limits, three-rejection offer fires once |
| `T-GROUND-01` | Prototype rover fixtures reproduce with grip 1.0; each vehicle's stop distance and top speed; airborne and landing |
| `T-STAGE-<chapter>` | Each chapter's stages advance only by their listed trigger, in order, once |
| `T-GRANT-01` | Every grant idempotent across repeat triggers and reloads |
| `T-MAIL-01` | Delivery after light-time; held during hinges; queue limit; variants by flag |
| `T-THREAD-01` | Each thread completable; none failable; window resolution for 0, 7 and 16 complete |
| `T-PHOTO-01` | Subject rule passes and fails on fixture projections |
| `T-SAVE-01` | Round trip; corrupt current falls back to backup; migration fixtures; unknown fields preserved |
| `T-SAVE-02` | Loading at every phase and mid-transition yields a stable state with consistent cargo |
| `T-DATA-01` | Validator: every reference resolves; every text key exists; every site's spawn and people positions are clear of obstacles; every stage reachable |
| `T-LEAK-01` | Ten enter/exit cycles of each site leave object, listener and memory counts within 2% of the first cycle |
| `T-FLOW-01` | Scripted full playthrough (inputs synthesised) from new game to credits with no stuck state |

## 10. Godot 4 mapping (if Godot is chosen)

| Concept | Godot |
| --- | --- |
| `services/*` | Autoload singletons |
| `core/*` | Plain GDScript classes (`RefCounted`), no `Node` use; run under the headless test runner |
| Solar frame precision | GDScript `float` is 64-bit; keep solar positions as separate `float` fields or `PackedFloat64Array`, **not** `Vector3` (32-bit in standard builds). Render with a floating origin: subtract the ship's position before assigning any `Node3D` transform. |
| Scenes | One `PackedScene` per site, loaded with threaded resource loading while the descent plays |
| Authored sequences | Data tracks interpreted by one sequence player, or `AnimationPlayer` resources referenced by ID; either way the endpoint is applied by the coordinator, not by the animation |
| Input | Input Map actions named exactly as file 08 §1; contexts implemented by enabling and disabling action sets |
| Ground vehicles | Kinematic bodies driven by `core/ground`; physics engine used only for loose props |
| Instancing | `MultiMeshInstance3D` for arrays, homes, lamps, rocks |
| Saves | `user://` directory; `FileAccess` with the tmp-and-rename procedure |
| Text | Own key lookup or the engine's translation server fed from `text/` |
| Web trial | Compatibility renderer export of the prologue only, if measured to be acceptable |

GDScript throughout; no native extensions unless a measured need appears.

## 11. The browser prototype's role

The existing `dist/` build stays as the public trial and as the behavioural reference for the rover (`stepRover`), routing (`planRoute`) and Mars save decoding. Their test fixtures are ported first (`T-GROUND-01`, `T-ROUTE-01`). No new chapter is implemented in the browser build beyond what the trial needs: the prologue through the first docking.

## 12. Diagnostics

- A developer overlay (never in release): phase, stage, `t_fic`, frame times, draw calls, memory, current intention, in-flight mail.
- Development entry points by command-line flag: `--site=<id> --stage=<n>`, `--dock`, `--cruise-leg=<n>`, `--homecoming --threads=<n>`, `--t-fic=<days>`.
- Playtest logging is local files only, opt-in, containing event names and timings and no personal data.
