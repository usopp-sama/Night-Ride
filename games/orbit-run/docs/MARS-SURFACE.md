# Hearth Crater — first playable Mars build

The longer-term product direction is a desktop game and eventual Steam release; see the [desktop roadmap](DESKTOP-AND-STEAM-ROADMAP.md). This browser build remains the current prototype.

This milestone implements the first two Mars goals in [the development checklist](DEVELOPMENT-CHECKLIST.md): an explorable settlement with a drivable rover and a short service activity. It introduces a real local terrain scene instead of putting the player on the orbital Mars sphere's tiny landing platform.

## Play

Run `python3 dev_server.py` from `games/orbit-run`, open the local URL and choose **Explore Mars**. The **Fly the solar system** option retains the existing space game. `/?scene=mars` is also a direct surface entry for development and previews.

In space, approach within 650 gameplay units of Mars and press F (or choose Visit Hearth). The game loads the surface scene and keeps the main ship in Mars departure orbit. At the surface, drive to the lander service beacon and press F to return to orbit.

| Control | Action |
| --- | --- |
| W / Up | Accelerate forward |
| S / Down | Brake toward reverse, then reverse |
| A / D or Left / Right | Steer |
| Space | Brake to a stop |
| F | Interact at a nearby service beacon while parked |
| R | Recover the rover to the lander, preserving cargo/activity progress |
| V | Toggle settlement survey camera |
| C | Reset chase camera |
| Drag on the scene / scroll | Look around / change chase distance |
| M or Site atlas | Open/close local settlement map |
| P / Escape | Pause; Escape also closes the local map |

Touch devices have drive, reverse, steering and brake buttons, plus the same interaction button. A physical mobile-device playthrough and controller support remain later verification/work items.

## The settlement

- A bounded local region with approximately 2.7 km of rendered terrain, a 960 m rover radius limit, an asymmetric crater rim, nearby slopes and instanced rocks.
- Four inhabited pressure modules with elevated connecting passages. The passages leave vertical clearance over the service roads.
- A greenhouse with visible planting beds, a communications dish and external utility tanks/pipes.
- A vehicle workshop, cargo storage, a parked surface lander and navigable service beacons.
- A large solar field with 216 arrays, shared panel textures, instanced frames/supports, a local field-status sign and service lanes.
- An unfinished expansion area with foundations, building frames, stored construction material and a crane.
- A crater-overlook destination and radio interactions at the settlement's other facilities.
- A six-wheel utility rover with acceleration/braking/reverse, terrain-following wheel contact, visual chassis pitch/roll, a camera, facility/large-boulder collision, dust and synthesized motor audio.

This is a rover-led prototype. Buildings and the lander are exterior scenes; walking, interiors, fleet selection and deep vehicle simulation are not part of this milestone.

## The first activity

1. Drive from the lander berth to the workshop and park at its service beacon.
2. Press F to collect a replacement array controller. An orange payload appears on the rover.
3. Drive to the east solar field control station and install the controller with F.
4. The isolated bank comes online: the visible field-status sign and lights change, displayed power rises from 42% to 78%, the payload is removed, and construction equipment resumes activity.
5. Visit the third-ring service beacon to inspect the foundations and complete the local activity.

Only the correct parked interactions advance this sequence. Repeating them does not duplicate the cargo or reset the outcome. This restores construction services; it does not fabricate the story's rare-metal reactor cores or complete the habitat expansion.

## Saves and scene lifetime

A small versioned surface record (`orbit-run.mars.v1`) stores activity stage, rover position/heading and the chosen local waypoint in browser local storage. It autosaves during the visit and at important actions/departure. On reload the rover is parked, and invalid/colliding positions fall back to the berth without discarding valid activity progress. Invalid/unrecognized save versions fall back to a fresh local record. If browser storage is unavailable, the visit remains playable for the session.

Solar-system time continues during an active surface visit; pause and local map freeze simulation. The solar and Mars scenes share one renderer and one fixed-step main loop. Mars assets are loaded on entry, and scene geometry, textures, shadows, audio, pointer listeners and UI handlers are released on exit. Returning to Mars restores its surface record.

This is surface persistence only. The entire expedition/spaceflight save schema and later chapter state still need the fuller persistence milestone.

## What remains for the transport milestone

Surface entry/exit currently uses a loading/direct handoff. There is **no completed descent/rocket-launch cinematic and no playable mothership docking yet**. The surface lander is a visual berth and a return interaction. Those features remain unchecked in the development backlog; this milestone must not be treated as their implementation.

The main ship's smaller visual proportions, dedicated orbital operations scene, cinematic staging endpoints and player-controlled return docking will be built together. Other worlds still use their prototype visit interfaces. Planetary sphere contacts now stop the ship at an approach stand-off rather than applying the old impact damage; the full orbital-capture experience remains future work.

## Verification

The Node suite adds Mars-specific checks for safe sites/spawns, rover acceleration/braking/reverse at 30/60 Hz, steering, facility/solar collision bounds, a real-input first trip to the workshop, ordered/idempotent activity interactions, parking requirements, save validation and clear rendered road centre lines. The earlier solar-system suite remains in place.

Browser verification covered surface loading/rendering, normal rover driving, controller collection, visible cargo, delivery and power change, expansion inspection/completion, reload persistence, rover recovery, return to orbit and re-entry with the completed activity preserved. Console errors were checked. Final browser checks also cover the local map and pause/resume. Device performance targets, physical touch testing, detailed graphics options and full cross-browser release verification remain open.
