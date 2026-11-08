# Other destination foundations

Planning update: 8 November 2026. The next content focus is establishing more places to explore while the remaining Mars and transport features stay on the todo list. This document changes work order; it does not mark any new location implemented or change the draft story.

## First pass: Europa, then Ceres and Mercury

| Destination | Local-world direction | First usable foundation | Later chapter work |
| --- | --- | --- | --- |
| Europa, a moon of Jupiter | An isolated ice-research station | Ice plain/ridges, pressure laboratory, communications mast, arrival area, expedition staging bay, instrument stop and a short vehicle excursion with a scientist contact | Survey-probe recovery, survey records and the Ceres lead |
| Ceres | A mining-cooperative depot | Cargo yard, workshop, processing sheds, excavation overlook and a hauling route | Help the cooperative and obtain the ore consignment |
| Mercury | A focused industrial/foundry outpost | Sheltered arrival area, equipment yard, foundry facade and a maintenance route | Fabrication activity and completed-core cargo |

These are original fictional settings, not researched mission layouts or commitments to final place names. Detailed environment/vehicle choices and scientific constraints should be researched when each location enters implementation. Europa's primary distinction should be exploration and field research, Ceres's moving materials, and Mercury's making something; avoid repeating Mars's controller-delivery activity in every setting.

Europa goes first because it gives us a second environment and forces the shared system to support a moon. It must be its own child destination of Jupiter, not Jupiter's current landing pad renamed. The map and approach behavior must make that relationship understandable. Its local preview can be built before its final orbital representation is ready, but a preview must not imply that interplanetary travel to it is already implemented.

Ceres already has a named refuelling anchorage in the prototype. The later explorable site needs a separate stable identity and explicit navigation relationship; do not silently replace the fuel stop or break existing routes.

## What counts as a foundation

For each world, build one bounded explorable location rather than the whole planetary surface:

1. A distinct terrain palette, skyline and landmark.
2. A valid arrival/spawn area and an appropriate initial exploration vehicle; reuse rover systems where they fit rather than committing to unique physics immediately.
3. A small connected route with roughly four to six worthwhile stops.
4. At least one named contact or readable radio interaction that explains the place.
5. A safe departure/return interaction and a clearly labelled development preview.
6. Destination-specific progress storage boundaries, shared scene cleanup, and repeat-visit checks.

A development preview may use the current fade handoff as a temporary bridge. Final descent/launch animations, docking and chapter completion remain explicitly pending. Do not add a map button that promises playable content before that content exists.

## Reusable foundations to establish with Europa

Use stable destination and site IDs, an explicit parent body and location type, a scene entry point, arrival data, allowed vehicle roles, interactables and a progress namespace. Keep data separate from the renderer. Reuse the shared save boundary, controls, waypoint presentation and lifecycle; preserve Mars-specific activity rules inside Mars.

A destination owns its local environment and progress. A shared coordinator owns which scene, vehicle, camera and input context are active. Entering Europa must not clear Mars's repaired solar bank, cargo record or discovered stops. The complete expedition save system is still a separate task; isolated local progress does not substitute for it.

Load the active world's heavy scene on demand. Keep shared assets reusable, and dispose of destination resources/listeners on exit. Compare first and repeat entries as part of the existing startup-jitter investigation. Keep the browser and desktop builds backed by the same source files.

## Later location briefs

| Destination | Bounded location to explore first |
| --- | --- |
| Venus | A transit port, with orbital versus atmospheric placement still to decide; not a generic ground settlement |
| Earth | A focused port/administration hub for the investigation, rather than a whole Earth city |
| Titan, a moon of Saturn | A hazy freight port and an outward cargo route |
| Miranda, a moon of Uranus | A salvage and processing site with visibly inactive machinery |
| Triton, a moon of Neptune | A remote outpost arranged around its eventual repair/delivery activity |

These retain the existing draft chapter roles. Jupiter, Saturn, Uranus and Neptune remain parent-world approaches; they do not acquire interchangeable ground towns just because the prototype has generic landing interfaces.

## Work order

Start the shared destination foundation and Europa blockout. Use what Europa reveals to improve the shared code before making Ceres, then Mercury. Keep the other locations as short briefs until they enter work. Transport integration, full saves and the first outward story mission follow as those systems become ready; starting a blockout is not the same as shipping a chapter.

The startup investigation, proper orbital scene, arrival/launch cinematics, manual docking, complete expedition saves and the Mars-to-Europa briefing remain in the maintained [implementation checklist](DEVELOPMENT-CHECKLIST.md), sections 4, 6–12 and 18–19. Windows verification and the production runtime decision remain open.
