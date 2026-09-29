# 02 — Player mechanics and the minute-to-minute game

## Action vocabulary

The game should be built around a small set of actions that combine well:

| Action | Basic use | Deeper use |
| --- | --- | --- |
| Drive | Enjoy roads, reach places | Read grip, gradient, traffic, and mechanical cues |
| Navigate | Follow signs or map | Learn shortcuts, plan fuel and stops |
| Park/camp | Rest and save | Place tools, supplies, and a travel base |
| Inspect | Understand a problem | Diagnose subsystems and compare parts |
| Repair | Restore condition | Choose tradeoffs in durability, cost, and time |
| Modify | Fit a useful part | Tune coherent assemblies and handling |
| Carry | Bring people or goods | Manage load, volume, balance, and commitment |
| Build | Set down a camp/workbench | Create a workshop or linked roadside network |
| Talk/listen | Meet people and hear radio | Follow optional clues and relationships |

Every action must be valuable in free play before story scripting depends on it. Avoid bespoke mechanics that appear only once in the finale.

## The core free-play loop

The player chooses an intention (or wanders), checks the car if they wish, drives, encounters a place or problem, then decides whether to stop, help, build, take a detour, or continue. Their map, vehicle, social contacts, structures, and journal persist. A successful drive can end anywhere safe; no quest or garage return is required.

Useful small objectives include finding a scenic road, collecting a compatible spare, tuning headlights for a dark route, delivering a repair kit, bringing a stranded driver to a town, or building a place to rest. All can generate stories through the same systems.

## Two layers of vehicle depth

The same car state supports two interfaces:

- **Accessible view:** “Tires are worn,” “Engine is running hot,” “This road needs better grip.” Suggested fixes and an optional auto-service action at staffed shops.
- **Detailed view:** tire compound and pressure, brake temperature, coolant capacity, gear ratios, torque curve, mass distribution, and component wear. This is for players who enjoy vehicle logic.

Do not make expert tuning mandatory for story success. A player using recommended presets must finish the game. Skilled tuning should unlock smoother, cheaper, or more interesting solutions, not exclusive access to the plot.

## On-foot boundary

The player can walk within a useful local radius of the parked car to inspect, speak, trade, enter small spaces, set a camp, and repair. The car carries bulky tools, inventory, radio, shelter, and long-distance travel. If the player walks too far, navigation points back to the car and the world remains traversable; avoid an invisible tether. Long-distance walking can be slow and uneventful by design. Story missions that require extended stealth, combat, or platforming are outside scope.

## Car ownership and failure

The player's first car should be sentimental and viable throughout the story. Acquired cars support different styles, but the first car should never be made obsolete by raw stat inflation. Damage is readable and recoverable. A flat tire, dead battery, or overheating can create a meaningful stop; none should destroy an unprepared casual player's save.

Recovery policy: clear warning before immobilization; ordinary roadside repair with common tools; a limited paid tow to the nearest reachable service; optional strict simulation settings for players who opt in. Story objectives must survive recovery and continue from a safe state.

## Tension without constant pressure

Threat comes from choosing a demanding road, carrying fragile or time-sensitive cargo, taking a poorly prepared car, or making a final story commitment. Country 1 should always have low-stress drives. Country 2 has occasional stakes and optional return. Country 3 raises stakes through scheduled closures, limited services, and relationships the player cares about. No random catastrophe may invalidate hours of building or strand the player without recourse.

## Construction and persistence

A lightweight camp can be a bed, light, storage, and portable bench. A larger workshop adds covered repair, part racks, battery charging, and a radio. Structures are modular and placed on valid sites, including player-chosen roadside clearings. Ownership and structure IDs persist; they are not tied to a mandatory base location.

Building must have a use: rest, repair range, cache access, route safety, or social gathering. Decorative expansion is welcome, but the first release should not promise Minecraft-scale voxel terrain editing. See [05](05-settlements-economy-building.md).

## Interface and controls

- Full keyboard/mouse and controller navigation, rebinding, accessibility options, subtitles, camera comfort settings, and an adjustable steering assist.
- Map has two layers: learned roads and optional guidance. Unvisited terrain can show broad geography without revealing every service.
- Interactions use verbs (“inspect,” “repair,” “talk,” “store”) rather than a huge radial menu of opaque part names.
- Radio and cabin controls are available while parked and, where safe, while driving. Driving remains the primary input focus.
- The player may pause during normal play and the Soren finale. If a timed segment is used, it must be clearly signaled and checkpointed.

## Design tests

1. A novice can understand and fix a common breakdown without external car knowledge.
2. An enthusiast can predict how a part change affects a measurable behavior.
3. A player can spend 30 minutes in Marren without starting the story and still have a satisfying session.
4. A player can set a camp, save, quit, and resume there.
5. A player who never builds beyond a portable kit can finish the story.
6. A player who builds thoughtfully can see those choices matter during the final night.
