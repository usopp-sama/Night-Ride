# Planet exploration — implementation checklist

**Branch:** `codex/solar-expedition`  
**Current gameplay baseline:** `7b47c07` (larger solar system, fuel depots, cruise and route planning)  
**Current build milestone:** playable Mars settlement, rover and solar-service activity.
**Next transport milestone:** lander cinematics and player-controlled orbital docking.
**Status:** active implementation backlog. Checked Mars items are implemented in the [first playable surface build](MARS-SURFACE.md). Unchecked items remain future work.

This is the maintained task list for the solar expedition game. Its long-term target is an installable desktop game and eventual Steam release; the browser remains the current prototype and possible demo. See the [desktop and Steam roadmap](DESKTOP-AND-STEAM-ROADMAP.md). The original Night Drive car-game documents elsewhere in this repository describe a separate project.

## 1. Requirements from the latest design discussion

These requirements guide the work below:

- Replace the small pad on the orbital planet sphere with an explorable planet location.
- Build Mars first: Hearth Crater is a futuristic settlement visibly expanding into new habitat space, with drivable Martian rovers and large solar-panel fields.
- Use a main interplanetary ship and a smaller planet-exploration craft, referred to here as the **lander**. The lander/probe carries the player between orbit and the surface.
- Keep the main ship in orbit while the player explores the surface.
- Make the main ship much smaller in visual proportion to planets. Revisit travel duration as a separate tuning task: changing a mesh's size does not change its speed or travel time.
- Replace damaging impacts with planetary spheres with a safe approach/orbit interaction. Near a planet, the player chooses to land and an authored sequence captures the main ship into orbit.
- Surface descent and the rocket launch back to orbit are non-interactive, authored cinematic sequences.
- The launch sequence ends near the main ship. **The player manually docks the lander with the main ship.** The cinematic must not silently complete that docking.
- Load the destination's specific information and assets as the player approaches/visits it.
- Define useful activities on each planet/moon/station. Keep the browser prototype useful for playtests/demo distribution while planning the full product for desktop and eventual Steam release; full feature parity is not assumed.
- Planet stories follow this foundation. Existing story premises remain drafts until their chapter work begins.

### Canonical visit loop

```text
Interplanetary flight
  → approach a destination / select Land
  → cinematic orbital capture
  → main ship remains in orbit
  → lander deployment and cinematic descent
  → Mars settlement exploration / rover activities
  → return to the lander / choose Launch
  → cinematic rocket launch to a safe orbital staging position
  → PLAYER-CONTROLLED approach and docking with the main ship
  → docking confirmed / control returns to main ship
  → choose the next destination
```

The planned term “recorded animation” describes the non-interactive experience. Whether we deliver it as a video or a scripted real-time sequence is still an implementation decision; see section 8. The return docking interaction is playable either way.

## 2. Existing foundation to preserve

- [x] BASE-01 — Eight moving planets use real mean Sun-distance ratios at 3,000 units/AU.
- [x] BASE-02 — 269 orbiting fuel depots support docking, fuel transfer, repairs and rescue checkpoints.
- [x] BASE-03 — Cruise, boost, local manoeuvring and fuel-aware route suggestions work in the browser.
- [x] BASE-04 — Full-system, inner-system and local map views support zoom, pan and depot search.
- [x] BASE-05 — Simulation tests cover scale, route reachability, moving-body interception, fuel and collision/docking helpers.

The original planet-impact damage has been replaced by a safe stand-off, and Mars now enters a local surface scene. Other worlds retain their prototype landing platforms. Full orbital capture, descent/launch cinematics and manual mothership docking remain future work. Asteroid and refinery collision rules stay separate from the planetary approach rules.

## 3. Delivery order and completion gates

| Order | Milestone | Must be demonstrable before moving on |
| --- | --- | --- |
| 1 | Mars surface prototype | Load a local Mars scene, see the settlement and drive a rover around a continuous terrain route. |
| 2 | A settlement with purpose | Visit the habitat, solar field, workshop and expansion area; complete one short rover activity with a visible result. |
| 3 | Ship, orbit and lander | Choose Mars from space, capture orbit safely and descend into that same playable settlement. |
| 4 | Return to space | Launch cinematically, regain lander control, manually dock and resume the main ship. |
| 5 | Persistence and portability | Reload safely at each stable phase; separate platform services, bundle required assets and define input actions. |
| 6 | Desktop feasibility and stack decision | Test a representative packaged Windows slice, measure it and choose a runtime/engine before scaling up planet content. |
| 7 | Other destinations and chapters | Use the chosen content pipeline, give each location a distinct activity, then implement its story. |

Scene and vehicle foundations in section 4 support the Mars prototype. We can build and test the surface directly during development before the complete space-to-surface transition exists.

## 4. Scene, vehicle and state foundations

- [ ] CORE-01 — Separate solar-system flight, local orbital operations and surface exploration into scenes with explicit enter, update, pause and exit lifecycles.
- [x] CORE-02 — Reuse one renderer and one main animation loop; prevent hidden scenes from continuing duplicate simulation or input handling.
- [ ] CORE-03 — Keep solar coordinates, body-relative orbital coordinates and surface coordinates distinct. Define conversions and units for each.
- [x] CORE-04 — Maintain each planet's identity and current solar orbit while its local scene is active. Returning to space must not reset the system's orbital phases.
- [ ] CORE-05 — Define stable states: interplanetary flight, approach, orbit capture, orbit ready, descent, surface, launch, docking approach, docking captured and main-ship control.
- [ ] CORE-06 — Define which actions are allowed in every state, including map, pause, rescue, scene loading, cinematic skip and vehicle switching.
- [ ] CORE-07 — Add one transition coordinator so repeated clicks or key presses cannot trigger two landings, launches or scene loads.
- [ ] CORE-08 — Introduce explicit vehicle roles: main ship, lander/probe and surface rover, each with separate handling settings and control bindings.
- [ ] CORE-09 — Preserve fuel, hull, cargo, active destination, visit progress and rescue port when switching scenes or vehicles.
- [ ] CORE-10 — Define lander stowed, deployed, surface and docked states so the same craft cannot exist in two places simultaneously.
- [x] CORE-11 — Define how rover ownership, location, damage and reset behave across visits. Initially use settlement-provided rovers unless that decision changes.
- [ ] CORE-12 — Give stable data IDs to locations, landing sites, vehicles, docking ports, interactables and mission steps.
- [ ] CORE-13 — Keep world layout, vehicle tuning, cinematic definitions and mission data separate from rendering code.
- [ ] CORE-14 — Add development entry points for Mars surface and orbital docking so each can be tested without replaying a long trip.
- [ ] CORE-15 — Choose one simulation-time policy for surface visits and cinematic sequences, document it, and apply pause/background-tab behavior consistently.

**Completion gate:** scene/vehicle transitions preserve a single coherent expedition state and never create duplicate controls, vehicles or loops.

## 5. Mars — Hearth Crater settlement

### 5.1 Ground, scale and arrival

- [x] MARS-01 — Design a compact playable region with a settlement, solar farm, workshop route, expansion site and nearby terrain excursion.
- [x] MARS-02 — Establish consistent local human/rover/building dimensions so roads, doors, structures and the lander agree in scale.
- [x] MARS-03 — Build continuous driveable terrain with crater slopes, firm routes, rock outcrops and readable changes in elevation.
- [x] MARS-04 — Create a convincing horizon and distant terrain backdrop without building or rendering an entire planet surface.
- [ ] MARS-05 — Make the orbital sphere and local surface visually agree: Mars color, light direction, terrain palette and arrival-site location.
- [x] MARS-06 — Add ground collision and a dependable surface-height query for rovers, buildings, lander supports and reset points.
- [x] MARS-07 — Reserve a coherent lander arrival/launch site with enough room for the craft, exhaust effects and a safe rover access route.
- [x] MARS-08 — Place safe arrival and rover spawn positions that cannot intersect terrain, buildings, solar panels or the lander.
- [ ] MARS-09 — Use physical terrain, signs and distant landmarks to communicate the region's limits; add a recoverable fallback if a vehicle leaves the playable area.
- [x] MARS-10 — Add a recognizable visual landmark visible from the landing site, workshop and expansion area to help players orient themselves.

### 5.2 The inhabited settlement

- [x] MARS-11 — Lay out an inhabited core with pressurized habitat modules, connecting structures, external service paths and a central communications point.
- [x] MARS-12 — Add greenhouse structures or visible food-production equipment that makes the colony feel occupied.
- [x] MARS-13 — Add life-support infrastructure: external tanks, pipes, heat exchangers and maintenance access, with a consistent visual language.
- [ ] MARS-14 — Build a vehicle workshop with rover parking, repair/charging equipment, tools and a clear way to select a vehicle.
- [x] MARS-15 — Place cargo racks, supply containers and unloading points beside believable service routes.
- [ ] MARS-16 — Add navigation signs for Habitats, Solar Field, Workshop, Expansion and Lander, with readable icons as well as text.
- [x] MARS-17 — Give the settlement a small number of believable signs of life: lit windows, maintenance activity, radio traffic or worker silhouettes, within the art/performance budget.
- [x] MARS-18 — Provide an interaction point for Mara and the settlement briefing. A radio/console interaction is sufficient before animated people or interiors are added.
- [ ] MARS-19 — Add localized ambient sound for machinery, settlement equipment and rover operation, with independent music/effects controls.
- [ ] MARS-20 — Ensure scene presentation still works with audio muted and with lower graphics settings.

### 5.3 Large solar-panel field

- [x] MARS-21 — Build a large, visible solar farm as a defining settlement landmark, using repeated modules with shared geometry/materials.
- [x] MARS-22 — Space rows so the rover can use service lanes without driving through panel meshes.
- [x] MARS-23 — Add support frames, cabling/trenches, inverters and a connection to settlement power infrastructure.
- [ ] MARS-24 — Define active, dusty, isolated and repaired panel states that can be understood at a glance.
- [x] MARS-25 — Add a simple readable power-status display at the field service point.
- [x] MARS-26 — Choose one initial panel-related interaction, such as restoring a cable connection or delivering a replacement controller.
- [x] MARS-27 — Show the result of that interaction in the world: panel/status lights, equipment activity and settlement power feedback.
- [x] MARS-28 — Keep the panel field's collision layout simpler than its visible geometry and avoid expensive per-panel physics.

### 5.4 A settlement visibly expanding

- [x] MARS-29 — Block out the unfinished third habitat ring/expansion area beside the occupied settlement.
- [x] MARS-30 — Include foundation works, partially assembled modules, construction frames, equipment and delivery access.
- [x] MARS-31 — Give the unfinished area a clear visual connection to the occupied settlement and the power system it will depend on.
- [ ] MARS-32 — Define expansion states in data: planned, foundations, structural assembly, systems installation and occupied.
- [ ] MARS-33 — Identify which existing props change, disappear or become active at each expansion state.
- [ ] MARS-34 — Implement a repeatable development switch for these states so artists and testers can inspect them without completing the story.
- [ ] MARS-35 — Reserve explicit interaction/event hooks for rare-metal deliveries and reactor-core installation; do not mark them delivered merely by visiting Mars.
- [ ] MARS-36 — Plan the eventual return-home reveal so the player can drive into a visibly changed place after completing the expedition.

### 5.5 Things to do on Mars

- [x] MARS-37 — Build a settlement orientation route that teaches rover movement and points out the solar field, workshop, expansion area and lander.
- [x] MARS-38 — Implement one short local service job end to end, with an objective, a physical destination, an action and a visible result.
- [x] MARS-39 — Connect that job to the settlement's needs, for example delivering a solar controller or equipment to the construction site.
- [x] MARS-40 — Add a nearby terrain excursion that rewards exploration with a survey view, information or a useful location.
- [x] MARS-41 — Give interaction points distinct prompts; do not require players to guess which decorative props are usable.
- [x] MARS-42 — Allow a local job to be interrupted and resumed without duplicating its delivery/reward.
- [x] MARS-43 — Reserve an optional quiet activity, such as visiting an overlook or listening to settlement radio, that remains available after the main objective.
- [ ] MARS-44 — Add the briefing hook for the later Europa lead, keeping it distinct from the local rover introduction.
- [ ] MARS-45 — Define what remains available on repeat visits and after the story ending.

**Mars completion gate:** arrive in a believable settlement, drive between all major facilities, complete one meaningful local activity, see a visible consequence and return to the lander. Final planet story writing is a later milestone.

The first surface build completes the local solar-service loop. Multi-stage habitat construction and the final story homecoming remain future work.

## 6. Drivable Martian rovers

- [x] ROVER-01 — Build one readable futuristic utility rover with visible wheels, suspension, cockpit and a small cargo area.
- [x] ROVER-02 — Make the handling accessible: predictable steering, acceleration, braking and reverse, with forgiving low-speed control.
- [ ] ROVER-03 — Tune grip and suspension for uneven Martian terrain while preserving a calm exploration pace.
- [x] ROVER-04 — Keep wheel placement and suspension visuals in contact with slopes; prevent obvious hovering or ground clipping.
- [x] ROVER-05 — Add simple terrain and static-structure collision with a stable chassis shape.
- [x] ROVER-06 — Handle steep slopes, drops, overturned vehicles and getting stuck; provide a recoverable reset to a nearby safe point.
- [ ] ROVER-07 — Add a chase camera with orbit/look controls, obstacle handling and a reset-view action.
- [ ] ROVER-08 — Provide a clear rover selection/boarding flow from the arrival or workshop area, and a reliable way to return control to the lander.
- [ ] ROVER-09 — Make keyboard and touch controls available; add controller mapping after the primary controls are usable.
- [x] ROVER-10 — Show speed and interaction prompts appropriate to surface travel rather than the space-flight HUD.
- [x] ROVER-11 — Carry at least one mission delivery visually or through a clear cargo indicator and unload it at the correct site.
- [x] ROVER-12 — Decide whether rover battery/charging supports the first activities. If included, provide generous range and recovery rather than introducing an early grind.
- [ ] ROVER-13 — Add restrained dust, wheel trails and motor/suspension audio within the browser budget.
- [x] ROVER-14 — Preserve rover location and carried cargo during menu use, lander interactions and saved-game reloads.
- [ ] ROVER-15 — Test a complete settlement circuit on keyboard and touch, including stopping precisely at a service point.

The initial prototype uses a settlement-provided rover with no battery drain or damage economy; physical contacts stop the chassis and recovery preserves progress.

**Scope decision still open:** free on-foot walking, character animation and building interiors. The first surface milestone can be rover-led; these extra systems are not assumed to be required for it.

## 7. Main ship, planet proportions and safe orbital arrival

- [ ] ORBIT-01 — Measure the current ship-to-planet proportions and choose a visibly smaller main-ship scale in the solar view.
- [ ] ORBIT-02 — Tune the camera, silhouette, navigation markers, engine trails and viewing distance so the smaller ship remains readable.
- [ ] ORBIT-03 — Define the visual relationship between main ship, lander and docking port in the local orbital scene; the lander must clearly be the smaller craft.
- [ ] ORBIT-04 — Review planet visible radii and atmosphere/approach shells alongside the already implemented orbital-distance ratios. Check nearby geometry still fits.
- [ ] ORBIT-05 — Tune crossing duration through cruise speed, acceleration and route/stop pacing independently of mesh sizes. Record representative travel times rather than assuming smaller graphics create longer journeys.
- [ ] ORBIT-06 — Recalculate fuel use, reserve margins and route warnings whenever flight speeds or travel policies change.
- [ ] ORBIT-07 — Replace planet-sphere impact damage with an approach boundary that disengages cruise and safely holds/deflects the ship outside the restricted region.
- [ ] ORBIT-08 — Use swept checks so a cruise-speed frame cannot skip the approach shell or place the ship inside a planet.
- [ ] ORBIT-09 — Show destination-specific approach details: body name, available landing site, visit availability, lander status and any real prerequisites.
- [ ] ORBIT-10 — Offer an explicit Land action near an eligible destination. Keep accidental close approaches recoverable without forcing a visit.
- [ ] ORBIT-11 — Animate controlled orbital capture and move the main ship into a stable body-relative orbit.
- [ ] ORBIT-12 — Show the main ship remaining in orbit when the lander deploys; retain the mothership's identity, cargo and condition.
- [ ] ORBIT-13 — Set a clear rescue/checkpoint policy for a completed orbital capture, surface arrival and successful return docking.
- [ ] ORBIT-14 — Remove the surface pad from the orbital Mars sphere once the proper Mars visit path is complete.
- [ ] ORBIT-15 — Keep refuelling asteroid docking and relevant small-object collisions working under the new ship proportions.
- [ ] ORBIT-16 — Test inner and outer planets, extreme approach angles, repeated Land presses, low fuel, pause and rescue during approach.

**Completion gate:** deliberate planetary arrival is safe, the main ship enters orbit, and the player can start a visit without colliding with a planet mesh.

## 8. Lander and authored descent/launch sequences

- [ ] CINE-01 — Decide the delivery method for the non-interactive sequences: scripted real-time animation or pre-rendered video, with a browser payload/performance comparison.
- [ ] CINE-02 — Prefer a shared cinematic interface with play, pause, skip, complete and failure/cancel handling regardless of delivery method.
- [ ] CINE-03 — Design the lander/probe as a coherent surface-arrival and return craft, with landing supports, ascent engines and a visible docking interface.
- [ ] CINE-04 — Storyboard the first descent: lander leaves the main ship, establishes the destination, approaches the settlement and touches down.
- [ ] CINE-05 — Hand off to the actual loaded Mars scene at the correct arrival point, camera and vehicle state.
- [ ] CINE-06 — Storyboard surface departure: rover/mission handoff complete, player boards the lander, engines ignite, craft lifts off and climbs out of the settlement view.
- [ ] CINE-07 — Continue the launch sequence to orbit and reveal the waiting main ship.
- [ ] CINE-08 — End launch at a safe staging distance and low relative velocity, with the docking port visible/locatable. Hand control to the player before docking starts.
- [ ] CINE-09 — Coordinate scene loading with cinematic beats so a late asset does not create a black frame or drop the craft into missing terrain.
- [ ] CINE-10 — Provide a loading/retry path when the next scene cannot be prepared, preserving the last valid checkpoint.
- [ ] CINE-11 — Disable incompatible flight/rover inputs during a sequence and restore exactly the correct controls afterward.
- [ ] CINE-12 — Make skip reach the same valid end state as watching the full sequence, including vehicle position, cargo and active mission flags.
- [ ] CINE-13 — Make launch skip end at the manual docking stage; never treat it as docking success.
- [ ] CINE-14 — Keep pause, mute, captions and reduced-motion handling consistent with the rest of the game.
- [ ] CINE-15 — Support repeat visits with short/replayable sequences without forcing a long scene every time.
- [ ] CINE-16 — Ensure docking failure can retry from orbital staging without replaying the surface launch.
- [ ] CINE-17 — If video is chosen, verify download size, browser codecs, aspect ratios, playback gesture requirements and an equivalent recovery/skip endpoint.
- [ ] CINE-18 — If real-time sequences are chosen, verify camera paths, occlusion, surface alignment and quality levels across supported devices.

## 9. Player-controlled docking with the main ship

- [ ] DOCK-01 — Build the mothership's visible docking port and the lander's matching docking interface.
- [ ] DOCK-02 — Simulate the encounter in a planet-relative orbital frame, so the task is matching the nearby ship rather than compensating for its full solar-system motion.
- [ ] DOCK-03 — Define a safe initial lander position, orientation and velocity at the launch-cinematic endpoint.
- [ ] DOCK-04 — Add predictable low-speed lander translation and rotation, with a brake/relative-motion damping control.
- [ ] DOCK-05 — Design keyboard, touch and controller mappings that clearly distinguish translation from rotation.
- [ ] DOCK-06 — Add a docking camera and a reliable reset/look-at-target action.
- [ ] DOCK-07 — Show port distance, closing speed, lateral alignment and angular alignment with clear visual and textual cues.
- [ ] DOCK-08 — Draw an approach corridor and make the active port distinguishable from other mothership geometry.
- [ ] DOCK-09 — Define approach, alignment and final-capture stages with forgiving, explicit tolerances; tune the numbers through playtesting.
- [ ] DOCK-10 — Evaluate success only when the correct interfaces are close, aligned and moving slowly relative to one another.
- [ ] DOCK-11 — Give clear feedback for arriving too fast, at the wrong angle or outside the corridor without declaring docking complete.
- [ ] DOCK-12 — Make a bad contact recoverable through a gentle rejection/bounce or staging reset rather than a repeated catastrophic failure.
- [ ] DOCK-13 — Add a first-return tutorial that teaches the sequence one action at a time and can be replayed.
- [ ] DOCK-14 — Decide optional assist strength for accessibility. Any full auto-dock would be an explicit opt-in decision, not the standard return sequence.
- [ ] DOCK-15 — Animate the final mechanical latch only after the player's docking succeeds, then transfer control to the main ship.
- [ ] DOCK-16 — Transfer cargo, visit results and relevant vehicle state exactly once on confirmed docking.
- [ ] DOCK-17 — Stow the lander and restore the main ship's navigation, fuel HUD and destination controls.
- [ ] DOCK-18 — Handle pause, reload, rescue, failed approach and repeated retry without losing the expedition or duplicating the cargo.
- [ ] DOCK-19 — Verify the complete return loop with keyboard and touch, including a deliberate failed approach followed by a successful retry.

**Completion gate:** the player, not the launch animation, completes docking. A confirmed latch safely restores main-ship control and all visit progress.

## 10. Destination data and loading

- [ ] DATA-01 — Define one destination manifest with ID, parent body, orbit reference, location type, approach settings and available landing/docking sites.
- [ ] DATA-02 — Include scene entry, terrain/environment assets, settlement/interactable definitions, vehicle spawns, activity hooks and presentation text.
- [ ] DATA-03 — Include destination-specific descent/launch definitions and valid cinematic endpoints.
- [ ] DATA-04 — Distinguish surface destinations, moon destinations, orbital stations and refuelling asteroids. A gas giant must not automatically inherit a terrestrial surface scene.
- [ ] DATA-05 — Load lightweight destination details when selected/approached and prefetch the heavier local scene before committing to descent.
- [ ] DATA-06 — Keep source manifests and authored story content in the repository; a live AI request or paid service is not required to visit a planet.
- [ ] DATA-07 — Deduplicate shared materials, vehicle assets and reusable settlement components across destinations.
- [ ] DATA-08 — Add loading progress, error/retry handling, request cancellation and protection against entering a scene twice.
- [ ] DATA-09 — Validate manifests so missing site IDs, assets, docking endpoints or mission references are caught before a release.
- [ ] DATA-10 — Define when assets can be retained in a small cache and when geometry, textures, sounds and event listeners must be released.
- [ ] DATA-11 — Re-enter a visited destination with its saved state instead of resetting repaired equipment and completed activities.
- [ ] DATA-12 — Add Europa and later moons as child destinations with their own positions and visit data, rather than renaming their parent planet's existing platform.

## 11. Activities and stories for later destinations

These are the current **draft chapter directions**, not a requirement to implement every scene before Mars works. Each destination needs an activity that uses its setting, a reason to be there, an outcome and a connection to the next lead.

| Destination | Draft playable purpose | Local scene form to plan |
| --- | --- | --- |
| Mars / Hearth Crater | Rover service work, settlement introduction, expansion progress, eventual homecoming. | Surface settlement and surrounding driveable terrain. |
| Jupiter / Europa | Recover a survey probe and earn the mineral-survey lead. | Europa ice-lab destination and a controlled excursion area. |
| Ceres | Help a mining cooperative and retrieve the ore consignment. | Asteroid/dwarf-planet industrial site. |
| Mercury | Help fabricate the cores and manage a foundry operation. | Focused foundry site with an appropriate approach sequence. |
| Venus | Visit the transit port; the patrol seizes the completed cores. | Atmospheric/orbital port; final scene placement to decide. |
| Earth | Trace the requisition through records and a local contact. | A focused port/registry location, not a full Earth simulation. |
| Saturn / Titan | Follow a cargo route and recover evidence of the outer settlement's emergency. | Hazy port and a short local excursion. |
| Uranus / Miranda | Recover alternative stock and reactivate processing equipment. | Small salvage/industrial destination. |
| Neptune / Triton | Deliver the replacement cores, resolve the crisis and confront the patrol decision. | Remote outpost with an arrival/repair sequence. |
| Mars return | Install the cores and enter the newly completed habitat expansion. | Changed version of the original Mars scene. |

For **each** destination/chapter:

- [ ] CHAPTER-01 — Write a short chapter brief: why the player goes there, who needs what, what the player does and what changes afterward.
- [ ] CHAPTER-02 — Define a distinct primary activity and the supporting traversal/docking mechanics it requires.
- [ ] CHAPTER-03 — Identify the reusable Mars/vehicle/interaction systems and the genuinely new systems needed.
- [ ] CHAPTER-04 — Specify the arrival site, local layout, usable vehicle(s), interaction points and return-to-orbit path.
- [ ] CHAPTER-05 — Define a success result, recoverable failure/interruption behavior and repeat-visit state.
- [ ] CHAPTER-06 — Write dialogue/radio content, objective text and journal entries with localization-ready identifiers.
- [ ] CHAPTER-07 — Connect the result to the next lead without using the same task/reward structure at every world.
- [ ] CHAPTER-08 — Define cargo ownership and transfers precisely, especially ore, fabricated cores, patrol seizure and later replacements.
- [ ] CHAPTER-09 — Add any required map markers, route hints and depot context without forcing a rigid path through otherwise open space.
- [ ] CHAPTER-10 — Set cinematic, manual-docking, save and replay endpoints using the shared visit system.
- [ ] CHAPTER-11 — Test the chapter in isolation, then with real travel from the previous destination and onward to the next.
- [ ] CHAPTER-12 — Check the chapter's asset/performance budget and remove required dependencies on scenes the browser should not have loaded.

### Per-destination tracking

Use CHAPTER-01 through CHAPTER-12 as the specification checklist for each of these independently tracked packages. Mars surface foundations are tracked in section 5.

**Europa / Jupiter**

- [ ] EUROPA-01 — Add Europa as an actual moving child destination of Jupiter, with its own map entry, approach details and visit manifest.
- [ ] EUROPA-02 — Build an ice-lab arrival site, a recognizable research settlement and a small excursion area with an appropriate exploration vehicle.
- [ ] EUROPA-03 — Implement the survey-probe recovery activity, including readable radiation/safe-window rules and a recoverable failed attempt.
- [ ] EUROPA-04 — Implement the scientist interaction, recovered survey records and the Ceres lead, including the relevant cargo/journal flags.
- [ ] EUROPA-05 — Complete descent, return launch, manual docking, repeat-visit state, save/reload and the full chapter checks.

**Ceres**

- [ ] CERES-01 — Expand the named refuelling destination into a distinct mining/ice-refinery visit site with safe arrival and service access.
- [ ] CERES-02 — Define the cooperative's local problem and a physical activity involving its water/power/mining equipment.
- [ ] CERES-03 — Build ore retrieval and loading with explicit cargo mass/capacity rules where useful; avoid granting the ore before the activity succeeds.
- [ ] CERES-04 — Connect the miners, consignment records and Mercury fabrication lead to the continuing expedition.
- [ ] CERES-05 — Integrate surface/industrial traversal, departure, docking, saved activity state and the chapter checks without breaking the existing fuel service.

**Mercury**

- [ ] MERCURY-01 — Create the foundry destination, its arrival site and a visually distinct solar-facing environment.
- [ ] MERCURY-02 — Define local safe routes/work areas and any heat-related interaction, with clear feedback and recovery.
- [ ] MERCURY-03 — Implement the fabrication activity: accept the correct ore, operate the equipment and produce the exact core cargo once.
- [ ] MERCURY-04 — Add the foundry contact, Mars communication and the reason to use the Venus transit port next.
- [ ] MERCURY-05 — Validate the full visit/return-docking loop, cargo persistence and repeat-visit behavior.

**Venus**

- [ ] VENUS-01 — Decide whether the transit port is atmospheric or orbital; define compatible arrival, exploration and departure rules.
- [ ] VENUS-02 — Build a focused futuristic port with a usable local service/inspection flow and readable navigation.
- [ ] VENUS-03 — Stage the patrol encounter and requisition reveal with a clear change in player objective.
- [ ] VENUS-04 — Transfer the specified cores into patrol custody exactly once, preserve the player's ship/other cargo and record the evidence/next lead.
- [ ] VENUS-05 — Verify interruption, reload and replay around the seizure cannot duplicate or permanently erase the required story state.

**Earth**

- [ ] EARTH-01 — Build a limited port/registry destination with a clear arrival and local movement layout.
- [ ] EARTH-02 — Implement the dispatcher/contact and manifest investigation as a distinct activity rather than another collection errand.
- [ ] EARTH-03 — Define which records the player can compare, what conclusion they establish and how the Titan route is uncovered.
- [ ] EARTH-04 — Add useful repeat-visit behavior, a journal update and any local services needed for the next trip.
- [ ] EARTH-05 — Complete the shared visit, return docking, save/reload, accessibility and chapter checks.

**Titan / Saturn**

- [ ] TITAN-01 — Add Titan as a child destination of Saturn with its own approach, local scene and manifest.
- [ ] TITAN-02 — Build the hazy cargo port and a short, readable local excursion suitable for its exploration craft/vehicle.
- [ ] TITAN-03 — Implement the cargo-recorder/evidence recovery activity with guidance that remains usable at lower graphics settings.
- [ ] TITAN-04 — Reveal the remote settlement emergency through the recovered messages and establish why Miranda is the next useful lead.
- [ ] TITAN-05 — Complete the return-to-orbit, manual-docking, saved-progress and chapter checks.

**Miranda / Uranus**

- [ ] MIRANDA-01 — Add Miranda as a child destination of Uranus and define the abandoned survey/industrial arrival site.
- [ ] MIRANDA-02 — Build a compact, distinctive salvage route with terrain/traversal requirements that are feasible for the chosen rover or probe.
- [ ] MIRANDA-03 — Implement equipment reactivation and alternative-stock recovery, reusing the processing knowledge introduced at Mercury.
- [ ] MIRANDA-04 — Define replacement-core production/cargo and the handoff into the Triton emergency chapter.
- [ ] MIRANDA-05 — Verify repeatable recovery, safe departure, manual docking and persistence of the produced cargo.

**Triton / Neptune**

- [ ] TRITON-01 — Add Triton as a child destination of Neptune with a remote outpost, explicit arrival site and final-chapter manifest.
- [ ] TRITON-02 — Build the emergency delivery/repair activity with readable failure/retry rules; decide how any communications blackout affects play.
- [ ] TRITON-03 — Resolve the settlement's core requirement and the patrol confrontation with consistent ownership of both original and replacement cargo.
- [ ] TRITON-04 — Establish the return-to-Mars objective and what help/consequences follow the resolution.
- [ ] TRITON-05 — Complete the final outbound visit's launch, manual docking, journal, saves and chapter checks.

**Mars homecoming**

- [ ] HOMECOMING-01 — Verify the returning cargo and prerequisites before accepting the reactor-core installation.
- [ ] HOMECOMING-02 — Apply the completed construction/occupied expansion state to the original Mars scene.
- [ ] HOMECOMING-03 — Add the reunion, settlement response and a driveable route into the newly opened area.
- [ ] HOMECOMING-04 — Trigger credits from a completed story event and preserve the resulting state for continued exploration.
- [ ] HOMECOMING-05 — Test repeat visits, reload after credits and continued solar-system travel without undoing the ending.

## 12. Persistent expedition and recovery

- [ ] SAVE-01 — Define a versioned save schema before adding extensive surface or chapter progress.
- [ ] SAVE-02 — Save the solar simulation time, current destination/site, vehicle role, stable location and main-ship orbital state.
- [ ] SAVE-03 — Save surface activity flags, settlement expansion state, rover state and cargo ownership/contents.
- [ ] SAVE-04 — Save completed visits, known/refuelled depots, mission/journal state and rescue checkpoints.
- [ ] SAVE-05 — Autosave at safe milestones: orbit capture, surface arrival, completed local activity, launch staging and confirmed docking.
- [ ] SAVE-06 — Restore a valid stable endpoint when reloading in the middle of a cinematic or half-completed scene transition.
- [ ] SAVE-07 — Define safe docking reload/retry behavior without requiring another surface launch.
- [ ] SAVE-08 — Make rewards, repairs and cargo transfers idempotent so reloads/repeated inputs cannot duplicate them.
- [ ] SAVE-09 — Handle corrupted, missing or older saves with a clear recovery path and migrations where appropriate.
- [ ] SAVE-10 — Provide an explicit new-expedition/reset flow and a backup/export option if useful for browser-only play.
- [ ] SAVE-11 — Keep saves small and separate from downloaded scene assets; choose browser storage according to measured data needs.
- [ ] SAVE-12 — Test closing/reloading the browser at every safe endpoint in the full Mars visit loop.

## 13. Browser performance, controls and presentation

- [ ] WEB-01 — Set measurable target devices, browsers, resolution, frame-rate goals and memory/loading budgets before polishing Mars assets.
- [x] WEB-02 — Use instancing/shared materials for solar panels, habitat modules, repeated rocks and construction pieces.
- [ ] WEB-03 — Add distance-based detail and culling for terrain, settlement props and vehicles.
- [ ] WEB-04 — Keep rover collision and surface physics simpler than the visible meshes; profile the cost before adding simulated clutter.
- [ ] WEB-05 — Load only the active destination and a small amount of prefetched content, not all planet surfaces at once.
- [ ] WEB-06 — Compress large textures/audio and choose sensible texture sizes. Verify video costs separately if pre-rendered cinematics are selected.
- [ ] WEB-07 — Provide quality settings for resolution scale, shadows, effects and terrain/prop detail that preserve gameplay visibility.
- [ ] WEB-08 — Measure frame time and memory on Mars, in the solar field, during launch and during docking; record results and hardware rather than assuming the orbital scene's performance carries over.
- [ ] WEB-09 — Revisit the same planet repeatedly and verify listeners, meshes, audio and GPU resources do not accumulate.
- [ ] WEB-10 — Support browser resize, narrow windows and portrait/landscape changes without losing controls or clipping mandatory prompts.
- [ ] WEB-11 — Keep keyboard and touch control schemes discoverable and specific to the current vehicle/scene.
- [x] WEB-12 — Add captions for required dialogue, readable objective text, contrast-safe indicators and cues beyond color alone.
- [ ] WEB-13 — Provide reduced-motion/cinematic-skip options and make camera movement adjustable where practical.
- [ ] WEB-14 — Handle tab suspension, pause/resume and WebGL context loss with a valid restore/checkpoint path.
- [x] WEB-15 — Keep the browser prototype/demo compatible with static hosting; document desktop/platform and any future backend requirements separately.

## 14. Integration and release checks

- [ ] QA-01 — Orbit arrival at cruise speed never tunnels into a planet or causes the old surface-impact punishment.
- [ ] QA-02 — Choosing Land repeatedly triggers only one capture/descent and creates one lander/rover state.
- [ ] QA-03 — Descent always hands control to valid, loaded Mars terrain at a safe spawn.
- [ ] QA-04 — A rover can visit every major facility, complete the first activity and return without clipping, becoming permanently stuck or losing mission cargo.
- [ ] QA-05 — Settlement activity results and expansion presentation persist across repeat visits/reloads.
- [ ] QA-06 — Launch watched, skipped, paused and retried all reach the same valid manual-docking start state.
- [ ] QA-07 — Manual docking rejects invalid contacts and accepts a correctly aligned low-speed approach exactly once.
- [ ] QA-08 — Docking retry does not replay launch or reset surface progress.
- [ ] QA-09 — Main-ship control, lander stowage, cargo, map routes and fuel controls agree after docking.
- [ ] QA-10 — Rescue and save reload work from space, orbit, surface and docking without creating duplicate rewards or impossible vehicle states.
- [ ] QA-11 — Existing asteroid refuelling, route planning and interplanetary flight still work after the Mars loop changes.
- [ ] QA-12 — Keyboard and touch users can complete a full Mars round trip, including a recoverable docking mistake.
- [ ] QA-13 — Required content loads on a fresh browser session and survives a failed/slow destination asset request.
- [ ] QA-14 — Run the existing simulation suite plus meaningful new tests for state transitions, save migrations and docking validation.
- [ ] QA-15 — Capture a short full-loop playthrough and compare measured performance/loading against the agreed device budgets.

## 15. Decisions to settle during their milestone

These are open choices, not blockers to maintaining this backlog or starting the Mars layout:

- [ ] DECISION-01 — Scripted real-time cinematics versus pre-rendered video, with the same non-interactive user experience and stable endpoints.
- [ ] DECISION-02 — Final main-ship/planet visual proportions, cruise tuning and intended trip durations.
- [ ] DECISION-03 — Rover-led exploration alone for the first release versus adding on-foot controls and interiors later.
- [ ] DECISION-04 — Whether lander/probe and launch vehicle are one reusable craft; the default planning assumption is one craft.
- [ ] DECISION-05 — Whether rover power and lander fuel add useful decisions in the first release, and which resources are restored at settlement services.
- [ ] DECISION-06 — The amount of optional docking assistance, difficulty and controller support in the first release.
- [ ] DECISION-07 — Whether Mars construction advances only through story milestones or also through optional local activities.
- [ ] DECISION-08 — Minimum devices/browsers and concrete asset, memory, loading and frame-time budgets.

## 16. Desktop and eventual Steam release

This is a long-term product track, not a completed port. See [runtime options, architecture policy and release gates](DESKTOP-AND-STEAM-ROADMAP.md). Windows-first is the planning default; final operating-system commitments and the engine/runtime are open decisions.

- [ ] DESKTOP-01 — Confirm intended operating systems, target PC classes and the browser demo's role; record what is actually supported.
- [ ] DESKTOP-02 — Define SaveStore, InputActions, AssetProvider, WindowAndLifecycle and optional PlatformFeatures interfaces.
- [ ] DESKTOP-03 — Move direct browser storage access behind the save interface and define the complete versioned expedition record.
- [ ] DESKTOP-04 — Add a native save implementation with safe writes, backup/recovery, migrations and an explicit browser-save transfer decision.
- [ ] DESKTOP-05 — Replace physical-key-only gameplay bindings with remappable actions across rover, flight, menus and docking.
- [ ] DESKTOP-06 — Bundle required fonts/assets and verify offline loading without the preview server or a hosted page.
- [ ] DESKTOP-07 — Establish a bounded packaged Windows slice from the current game as a baseline.
- [ ] DESKTOP-08 — Assess whether larger terrain, physics, animation and content-authoring needs justify an engine comparison; choose one representative comparison if needed.
- [ ] DESKTOP-09 — Measure frame times, memory, loading, saves, controls and scene/cinematic/docking behavior on actual target Windows hardware.
- [ ] DESKTOP-10 — Choose and document the production runtime/engine before authoring the remaining planets at scale; estimate any code/UI/asset port.
- [ ] DESKTOP-11 — Set source asset formats, units, coordinate conventions, import/export rules and reusable mission/save schemas for that stack.
- [ ] DESKTOP-12 — Implement fullscreen/window modes, graphics/audio settings, sensitivity, remapping, captions and controller menu navigation.
- [ ] DESKTOP-13 — Validate focus loss, alt-tab, suspend/resume, pause, clean quit and supported recovery paths in the packaged build.
- [ ] DESKTOP-14 — Establish repeatable Windows builds and a clean-machine installation/playtest process independent of the development machine.
- [ ] DESKTOP-15 — Test update/save compatibility and keep settings separate from progression.
- [ ] DESKTOP-16 — Complete a desktop vertical slice and external playtest before committing to a release date or minimum system requirements.

- [ ] STEAM-01 — Plan publisher onboarding, fees and review lead time from current official requirements when the project is ready.
- [ ] STEAM-02 — Decide the final product name, supported platforms, scope, pricing approach and accurate store claims.
- [ ] STEAM-03 — Prepare store artwork, gameplay screenshots, trailer, description, credits and required disclosures.
- [ ] STEAM-04 — Schedule the Coming Soon page, wishlisting, demo/playtest plan and release milestones using current platform rules.
- [ ] STEAM-05 — Configure build/depot uploads, private test branches and the Steam update/release pipeline.
- [ ] STEAM-06 — Choose a maintained native integration path for any Steam APIs used by the selected runtime/engine; do not assume a desktop wrapper supplies it automatically.
- [ ] STEAM-07 — Evaluate and implement the chosen cloud-save approach, with per-user files, conflict/recovery handling and cross-machine tests.
- [ ] STEAM-08 — Validate controller mappings, prompts, menu navigation, overlay/focus behavior and Steam Input configuration as appropriate.
- [ ] STEAM-09 — Define meaningful achievements if wanted, using stable game events and migration-safe unlock state.
- [ ] STEAM-10 — Test Steam-client launch, offline/unavailable-Steam behavior and the supported save/update paths.
- [ ] STEAM-11 — Evaluate Steam Deck/Proton separately before claiming compatibility; decide any additional platform release scope.
- [ ] STEAM-12 — Complete supported-hardware testing, store/build review, player support information and the final release checklist.

## Maintaining this file

- Keep IDs stable so commits, issues and later task breakdowns can refer to them.
- Mark a task complete only when the behavior exists and its relevant completion gate/check has passed; distinguish an implemented feature from an approved design.
- When a larger item is split, retain its original ID and add scoped sub-items or links rather than silently changing its meaning.
- Update the location/chapter table and the world-scale document when a later decision supersedes their current behavior.
- Keep new discoveries and decisions beside the affected task. Record the implementation commit when a milestone is completed.
