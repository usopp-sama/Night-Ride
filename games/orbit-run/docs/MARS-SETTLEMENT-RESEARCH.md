# Hearth Crater: an inhabited settlement, not a landing plaza

Updated 7 November 2026. This document separates published research from the fictional choices used in the game. There is no inhabited settlement on Mars today. Hearth is a later, expanding community; it is not a prediction or an engineering design for a real mission.

## Sources and what they change

| Primary reference | Evidence or concept | Application in Hearth | Limit |
| --- | --- | --- | --- |
| [NASA CHAPEA](https://www.nasa.gov/humans-in-space/chapea/) and [first crew retrospective](https://www.nasa.gov/missions/voyagers-of-mars-the-first-chapea-crews-yearlong-journey/) | An Earth-based habitat analog studies extended crew living, maintenance, growing food and resource constraints. | Add daily life, medical/EVA services and grow facilities alongside machines. Residents talk about ordinary work and home. | An analog is not a flight-qualified habitat or proof of a large settlement. |
| [BIG: Mars Dune Alpha](https://big.dk/projects/mars-chapea-4310) | The architect's project for NASA and ICON treats the human experience as part of habitat design. | Give residential quarters their own identity and a quieter refuge. Plan private/shared spaces for later interiors. | Our exterior modules are original procedural game art, not a reproduction of that building. |
| [NASA: MOXIE mission completion](https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/) | An instrument demonstrated making oxygen from the Martian atmosphere. | A separate atmosphere-works district has intake equipment, processing modules and storage tanks. Orin explains why redundancy matters. | MOXIE did not demonstrate a settlement-scale life-support or propellant factory. Hearth's enlarged plant is speculative. |
| [NASA: Mars Surface Power Technology Decision, 2024 architecture review](https://www.nasa.gov/wp-content/uploads/2024/12/acr24-mars-surface-power-decision.pdf) | NASA selected fission as its primary surface-power technology for the human-Mars architecture studied; dust and reduced sunlight complicate solar generation. | Keep the solar farm for the player's repair activity, but add a remote, bermed power-reserve district. The disabled array constrains expansion rather than instantly killing everyone. | Hearth's exact energy mix, spacing, demand and percentages are authored gameplay. A game berth or berm is not a real safety assessment. |
| [Röstel et al.: subsurface radiation and habitat shielding](https://doi.org/10.1029/2019je006246) | Modeling examines the protection offered by Martian soil and how shielding depends on material and location. | Add regolith-covered modules and an earth-covered shelter. The pressure vessel remains a separate interior structure. | No universal shielding thickness is claimed by the game. The meshes do not simulate radiation. |

All links were checked during this milestone, except the paper's publisher access may vary. Source facts are design inputs, not assets bundled with the game. No NASA, ESA or architect imagery has been copied into the game.

## Layout policy

Hearth needs a visible chain of dependencies: water supports growing and people; atmosphere processing supports breathing; power supports every plant; freight brings components; workshops keep rovers working; construction converts that effort into homes. The road network should make that chain understandable through exploration.

The old campus stays close to the rover's arrival position. The first controller activity still works without a long detour. Larger districts surround it, with gaps that give driving a purpose. Essential mission interactions are not hidden behind optional lore or conversations.

| District | Arrival beacon (metres, x/z) | What is visible now | Current interaction |
| --- | --- | --- | --- |
| Original campus, six stops | Around 0 / 0 | Workshop, four original habitats, grow dome, 216 arrays, third-ring frames, overlook, lander | Existing three-step controller activity, local comms, departure |
| West residential quarter | -490 / -140 | Nine shielded pressure modules; six more modules extend the intermediate campus | Nia's conversation and a discovery stamp |
| Medical & EVA station | -490 / -420 | Medical module, service equipment and airlock facade | Leila's conversation and stop log |
| South grow campus | 270 / -500 | Three insulated crop houses with glazed roof/visitor details | Tao's conversation and stop log |
| Ice & water works | 700 / -500 | Processing hut, tank bank and utility equipment | Sana's conversation and stop log |
| Atmosphere works | 850 / -160 | CO₂-processing concept and oxygen storage | Orin's conversation and stop log |
| South freight terminal | 650 / 380 | Eighteen freight containers and a transfer gantry | Bea's conversation and stop log |
| North science relay | 100 / -940 | Instrument module and dish | Eli's conversation and stop log |
| Regolith shelter | -800 / -540 | Soil-covered refuge and pressure entrance | Stop log and shelter explanation |
| Materials & print yard | -950 / 410 | Print gantry, test blocks and materials stock | Ada's conversation and stop log |
| Remote power reserve | 1160 / -700 | Fictional fission-power compound, radiators/equipment and berms | Ren's conversation and stop log |

There are **16 stops, 19 pressure habitat modules, 12 named residents, and 12 connected road splines**. Playable radius is 2,200 m, previously 960 m; diameter grows from 1.92 km to 4.4 km, giving approximately 5.25 times the bounded ground area. Actual developed districts span about 2.1 km east–west and 1.35 km north–south. The terrain mesh extends 5.5 km across to provide a surrounding crater.

These are not 16 full quests. New districts currently provide recognizable places, local radio descriptions, people and persistent discovery stamps. The first repair activity remains the only complete local mission chain.

## People, not a crowd simulation

Mara, Ivo and Jun work at the original workshop, solar farm and construction site. Nia, Leila, Tao, Sana, Orin, Bea, Eli, Ada and Ren populate the new districts. Each wears a helmet, suit and backpack outdoors. They move along small authored loops beside the service beacons and turn toward a nearby rover. Park within 19 m and press **T**, or use the on-screen talk button, for a captioned radio exchange.

This milestone adds original low-detail procedural characters. It does not add on-foot control, voiced dialogue, interiors, complex schedules, collision avoidance or branching quests. Crew are non-blocking, so a lightweight character cannot strand a rover in a narrow road. Every EVA loop is checked against facility collision bounds.

## Art and realism rules for the next pass

- Everyday pressure spaces should look insulated and maintainable. The original transparent dome remains a readable landmark; do not cover the whole city with exposed glass.
- Use soil shielding as a visible architectural language. Water reserves, doors, seals and airlocks should have recognizable functions.
- Keep exterior workers suited. Future casual clothing belongs inside pressurized interiors.
- Move the operational launch site farther from inhabited quarters when transport is implemented. The current berth remains a provisional prototype shortcut; no real plume/ejecta exclusion radius has been calculated.
- Grow food in controlled facilities. Outdoor vegetation, open water and Earth-style unprotected balconies do not belong here.
- Freight and industry should have their own work yards. A larger settlement needs repair and recycling infrastructure, not only more houses.
- Communicate power as a redundant system. Do not turn a routine solar repair into an unavoidable settlement-extinction alarm.
- Do not introduce survival chores merely because the reference architecture has life-support systems. The player's experience should remain welcoming and exploratory.

## Performance policy

The enlarged settlement keeps one shared renderer and fixed-step simulation. Static infrastructure primitives are baked into a mesh per common material; solar panels/supports and rocks remain instanced. Character rigs are small, with no skeleton assets or remote services. Distant crew are hidden beyond 500 m during normal driving. The atlas updates at HUD cadence, and persistence runs every three simulation seconds rather than every frame.

These reduce repeated draw work, but they are not evidence of a particular frame rate on Windows. The next performance gate should record CPU/GPU frame times, loading, memory and renderer calls at the original campus, freight terminal, residential quarter and survey camera on target hardware. If material-level world batches become too broad for useful culling, split them by district rather than immediately increasing detail everywhere.

## Useful next activities

1. A short water-filter delivery connects workshop, water works and the grow campus.
2. An EVA buddy check introduces the medical stop without a punishment timer.
3. A freight manifest points toward the first off-world rare-metal lead.
4. A science-relay calibration rewards a trip away from the busy centre with a view and a quiet radio exchange.
5. A visible third-ring construction milestone changes the skyline after the player's return.

Each should change something visible or useful. Keep the distant-resource expedition separate from routine maintenance, and preserve free exploration before accepting the outward journey.
