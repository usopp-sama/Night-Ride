# Review of the new Third Ring design set

Reviewed 13 November 2026, against commit `b26933f`. All thirteen files in `docs/design/00–12` were read, alongside the current game and earlier plans. This is a separate review: it does not change the accepted creative decisions, canonical design files, implementation or milestone status.

## Assessment

The set gives the game a strong identity: an authored journey about carrying things for people, with distance expressed through mail, light, maintenance and a familiar cabin. The Venus/Triton reuse of the same physical gesture and the empty-hold homecoming are particularly coherent. Distinct chapter verbs give the planets different purposes. Free fuel, recoverable mistakes, no combat and limited vehicle-controller families support that direction.

The architecture has useful foundations: plain-data progression, explicit transition ownership, idempotent grants, local coordinate frames, portable assets, save recovery and measured engine gates. Separating the forward design from what is actually implemented is also correct.

However, this is not yet a contradiction-free implementation specification. Several exact requirements cannot currently hold together. Keep the story and identity; correct the contracts before implementing the affected modules.

## Checks actually performed

- Read all thirteen numbered documents, including the registry and build protocol.
- Ran the current game's test suite: **23 passed, 0 failed**. These are existing browser/native-save tests; none proves the future native game meets this design.
- Independently evaluated the proposed circular orbits, reference departure/arrival epochs, late-trajectory samples and straight homeward path using the design's own constants.
- Checked hop reachability, clock-rate arithmetic, input assignments, event names and several content dependencies.
- Inspected the existing Mars roads/layout against proposed additions.
- Checked the geostationary-orbit interpretation against NASA's orbit reference.

No Godot build, new cinematic, listening activity, docking controller or future chapter was executed: they do not exist yet.

## P1 — Correct before implementing the affected system

### R01. Miranda's required hop cannot clear its terraces

References: `design/03-CORE-SYSTEMS.md` §13.1, `design/06-CHAPTERS-ACT-2-TO-4.md` Miranda layout.

The Hopper launches upward at 3 m/s and uses effective gravity 0.6 m/s². The maximum rise is `v²/(2g) = 7.5 m`. The chapter requires hopping up 9 m terrace steps. Under the ordinary single-hop interpretation, with no explicit mid-air boost or alternative route defined, that ascent is unreachable. If repeated mid-air boosts are intended, their rules and limits must be stated.

**Recommendation:** lower the mandatory steps, add a defined traversable route, or raise the launch speed to at least about 3.29 m/s plus a clearance margin. Choose one correction and add a fixture that reaches the actual terrace, rather than testing jump height alone.

### R02. Petrel cannot provide the specified homeward flyby on the reference line

References: file 03 §4 and §8.1; file 04 §8.4/8.6; file 06 chapter 9.

For the straight Neptune Day 152 → Mars Day 215 leg, using the stated longitude/period rules and orbiting depots:

| Check | Computed result | Requirement |
| --- | ---: | ---: |
| Home-leg length | 31.559 AU | about 31.6 AU |
| Cruise duration at tier III | 631.19 s | 631 s |
| Closest solar approach | 0.18249 AU, at fraction 0.95206 | about 0.18 AU near the final few percent |
| Closest approach to Albatross | 0.02022 AU / 1,213 su | within 3,000 su |
| Closest approach to Petrel | **3.13891 AU / 188,335 su** | **within 3,000 su** |

Petrel does work near the straight outbound Uranus→Neptune line: about 0.00361 AU away, roughly 5.47 AU along that leg. Tern is also near its specified outbound route. This isolates the conflict to Petrel's required return appearance; most of the trajectory design is numerically coherent.

**Recommendation:** jointly solve outbound and return routing, or change which depot supplies the return beat. Rotating Petrel to fix only the return risks breaking the outbound stop. If the return gains a bend, recompute distance, fuel, elapsed fiction time and every fraction-based story beat. The calculation assumes orbiting depots, consistent with the preserved moving network; explicitly define what “fixed positions” means for the three authored depots.

Reference-leg values broadly match the displayed one-decimal precision. Some stated late bounds differ by a few hundredths of an AU, so write the intended rounding tolerance into `T-TRAJ-01` rather than silently choosing one in code.

### R03. Clock advancement needs an explicit waiting and overload policy

References: file 03 §2; file 05 Mercury cooling; file 06 waiting for Harrier; file 09 §3.3.

Three different requirements need reconciliation:

- All authored sequences run at 60×, but Mercury advances five fiction days in 15 real seconds and the Harrier wait advances two days in 15 seconds.
- A 60 Hz accumulator given `min(real_delta, 1/30)` with at most two steps per render frame loses elapsed time at sustained rates below 30 fps. At 20 fps, a nominal 60× clock advances only 40 fiction seconds per real second. Cruise durations and displayed real-time estimates then depend on performance.
- The document calls the interval clamp a startup-jitter fix without profiling. It can prevent catch-up jumps; it does not establish that scene construction, shader work or uploads have been fixed.

**Recommendation:** define an idempotent `advance_to`/scripted-wait operation used by watch, skip and reload, with explicit handling of mail, plants and body positions. Separately choose the simulation-overload policy and clock semantics. Keep the recorded startup investigation open until measured. Test the clock at 20/30/60/120 fps, after a stall, and across a skipped time-lapse.

### R04. Mail mixes message age, propagation time and notification timing

References: file 04 §2; file 06 Miranda; file 11 mail triggers; file 09 events.

- “Sent … ago” is message age, `now - sent_at`. File 04 instead requires it to equal current distance × 499 seconds. That is a propagation estimate, not the age of an older or unread message.
- Miranda's silence cannot follow from a 2 h 40 min fiction delay: at 60× that is **2 min 40 s real**, within its 60–75 minute visit. The arrival postcard request and optional-thread replies can arrive during it.
- The sample trigger uses `chapter_complete` with a chapter-stage payload, but the event contract defines `chapter_completed`, carrying a chapter. Implementing the example literally would not match the event.

**Recommendation:** distinguish sent time, signal arrival, notification eligibility and reading. Preserve physically delivered mail while suppressing its notification during a defined quiet chapter; do not claim light delay alone makes it silent. Normalize trigger names/payloads and test the nine-minute Triton exchange with cruise, pause, waiting and notification queues.

### R05. Some default inputs invoke two actions in the same context

Reference: file 08 §1 and §2.

| Context | Collision | Consequence |
| --- | --- | --- |
| Skiff, keyboard | F = Interact/ping and descend | A ping or held identification can also lower the vehicle. |
| Docking, controller | LS click = Precision and Look Home | Precision can also turn the camera away from the port. |
| Ship/controller | D-pad up = Cabin; double-tap = Cruise | The first tap can enter the cabin before the cruise gesture is recognized. |

**Recommendation:** assign unambiguous defaults or specify explicit contextual precedence/gesture recognition. Validate every action simultaneously allowed in a context, including remaps and hold-to-toggle. Do not leave the arbitration to whichever handler happens to run first.

### R06. The shared state machine does not yet cover every chapter's transport

References: file 03 §1, file 04 §1, file 06 Earth, file 09 §3/§5.

Earth's Registry explicitly receives the Kestrel directly, with no Wren descent or launch. But `depot_docked` can only leave to solar flight or cabin, while `surface` can only be entered from descent and left through launch. There is no defined direct-ship station visit/rail transition.

The cabin also replaces the authoritative phase while its parent cruise must keep simulating, whereas inactive scenes receive no updates. The save needs an explicit underlying travel state, not only a presentation phase called `cabin`.

**Recommendation:** distinguish expedition/vehicle simulation state from presentation/input overlays, and define direct station boarding/return. Test cruising entirely from the cabin and visiting the Registry without creating or deploying Wren. This is a contract clarification, not a request to add a new gameplay controller.

## P2 — Resolve for coherent content and production

### R07. Optional threads need branch-complete rules and text

References: file 02 choices; file 04 threads/seedling; file 11 mail.

- `th_varga` completes only for supportive testimony in the thread table. The story also permits post-game completion after silence; critical testimony has no defined completion path. That conflicts with the promise that threads cannot fail. Home 23 can then read as rewarding approval of Varga rather than resolving a relationship.
- The seedling cannot supply a cutting until Day 25, but the reference Europa visit ends Day 22. The intended first-pass Kofi delivery needs a deliberate timing/content change or a clearly intended later return.
- Mara's Europa letter assumes a Jupiter postcard was sent, and Kofi's later letter assumes he received the cutting. Both are optional.

**Recommendation:** define closure for every testimony branch, add variants for absent optional actions, and test a no-postcard/no-thread playthrough as well as each choice combination. Keep the ending guaranteed as designed; do not silently make optional activities mandatory to repair its script.

### R08. Separate physical astronomy from visually exaggerated navigation

References: file 03 §3; file 04 mail and Look Home; file 09 body schema.

Europa's 22,000 su moon radius is 0.3667 AU under the declared conversion. That is explicitly a visual exaggeration, but the mail rule reads solar-frame positions as physical distances. A shared exaggerated position can distort the supposedly real light-time and surface-sky directions.

At cruise time rate, that Europa orbit also traverses about **3,894 su per real second**, faster than the tier-I ship's 1,500 su/s. The existing parent-body trajectory checks do not establish that the moon-intercept and approach-glide behavior succeeds.

**Recommendation:** define physical positions/orientations separately from display/approach positions. Use physical geometry for light-time and astronomical skies, and a tested approach policy for moving moons. Add a first Europa arrival fixture before building its art. The schema's `real_distance_au_from: "parent"` does not yet specify enough data to do this.

### R09. The registry and samples are not yet a complete data contract

References: file 09 §4/§6, file 11, file 05 Mars and Ceres.

File 11 is declared the sole registry for every ID, but many individual stop, sequence and mail/reply IDs are only examples, patterns or entries elsewhere. Mars's chapter uses `expansion` as the ring-gate stop while the registry introduces `ring_gate`; Ceres's chapter preserves depot ID `ceres`, while the registry renames it for native data. These need explicit aliases/migration rules or a consistently different scope for prototype versus native IDs.

**Recommendation:** create a machine-readable registry and reference validator first, or explicitly identify each owning data table and generate the registry from it. A conflict should fail validation, not require an implementer to guess. Keep placeholder content visibly unfinished, consistent with the protocol.

### R10. Validate new Mars layout against the existing roads

Reference: file 05 prologue layout; current `dist/mars-world.js` ROADS.

The proposed schoolroom at (−420, −140) lies on the current west-residential road segment from (−350, −140) to (−490, −140). If that is the building center, preserving the road as built places the new module across it. Also, in the stated −Z=north convention, a ring centered at z=−300 has its north side at smaller z; the named “north point” at z=−170 is south and uses the plot radius rather than the road radius.

**Recommendation:** produce a single validated layout snapshot with building footprints, ring plots, gates, road curves and accessible stops. Relocate or reroute deliberately. Keep the existing clear-road tests and extend them to the changed map.

### R11. Production scope is larger than “small, finished, quiet” implies

Reference: file 10 M1–M4 and P0/cut order.

Nine sites, five controllers, sixteen threads, custom photo validation, delayed mail, a cabin, several distinct puzzles and many cinematics are substantial production work even without combat or free walking. Most are P0 and no chapter can be removed, leaving very little true scope flexibility.

M1 asks for a broad rules library before the engine slice is seen. The immediate experiment should validate the risky feel: rover, docking, a short cruise/cabin interaction and save/reload. It need not wait for every future chapter system to be implemented.

**Recommendation:** split M1 into the minimal contracts/math needed by M2 and the remaining systems needed by M3/M4. Make a short representative slice excellent, then validate the proposed 10–12 hour target. Preserve the intended ending while keeping real reductions in activity/asset scope available.

### R12. The new roadmap changes the recently agreed work order

References: file 09 §11; file 10 §1–3; older `DESTINATION-FOUNDATIONS.md`.

The recent plan allowed small Europa/Ceres/Mercury foundations alongside Mars work. The new set prohibits new browser chapters and requires the native engine gate before M3 onward. This is a meaningful production choice, not merely more detail in the same queue.

The web trial is described as “frozen” through a first docking that the current browser build does not implement. Either budget that remaining web work or define the target as a later engine-exported trial; do not describe the future scope as shipped behavior.

**Recommendation:** record one current work order in the task ledger. Keep any pre-gate destination studies explicitly exploratory. State whether the next actual implementation is native foundation work or another browser location.

### R13. Preserve the player's interpretation and the owner's authority

References: file 01 success measures; file 06 Venus/Triton acceptance; file 12 standing rule 11; file 00 precedence.

A linear story can be satisfying, and manually giving the cores can be meaningful. However, requiring players to report an act with no alternative as “their choice” risks leading the evaluation. Ask whether they understood and endorsed the Courier's decision, and distinguish that from mechanical branching. Similarly, use silence/attention as observations, not as proof that every player felt the prescribed emotion.

The build protocol should stop accidental drift, but its instruction to refuse later owner requests conflicts with the precedence given to the owner's decisions. Flag a proposed design change and its consequences; do not treat an old document as authority over an explicit new owner decision.

Accessibility also needs consistent priority: one-handed play is a stated minimum commitment in file 08, but one-hand presets are P3 cuts in file 10. Decide what is genuinely committed before making store claims.

## Science note

The Registry's Earth size at geostationary distance is broadly right. Its repeated depiction of Earth's continents turning once per day past the station is not consistent with a geostationary observer: the station stays above the same longitude. Clouds and the day/night boundary can still change. See [NASA's planetary-orbit explanation](https://science.nasa.gov/learn/basics-of-space-flight/chapter5-1/).

The wider science claims were not exhaustively fact-checked in this review. Keep the proposed primary-source verification ledger, particularly for sky geometry, surface lighting, temperatures and real place names.

## Recommended next work

1. Keep the narrative, ending, chapter identities and core tone.
2. Resolve R01–R06 as explicit design corrections, with small numerical/data fixtures. Include R08 in the first Europa approach experiment.
3. Validate the registry and optional branches before generating large quantities of data or dialogue.
4. Agree the revised production order and build a tightly scoped native slice; do not interpret this review as approval to start a full port or rewrite.
5. Use the slice to test docking pleasure, cruise engagement and whether reading/maintaining a small cabin is enjoyable. Those are the game's major experiential bets.

**Verdict:** strong creative direction and a useful production framework; a focused consistency pass is needed before treating every number and state transition as executable truth.
