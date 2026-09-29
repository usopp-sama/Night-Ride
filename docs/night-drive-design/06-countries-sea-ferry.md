# 06 — Country topology, sea crossing, and story commitment

## Geography invariant

Marren must be separated from both Hest and Soren by water in every seed. The normal route to the mainland is a ferry from Marren to Hest. Hest and Soren connect by land. Any alternate Marren–mainland ferry is post-story or optional and must not bypass the story's chapter logic.

This is a topological invariant, not a cosmetic sea texture. A pathfinding query from Marren to Hest/Soren with ferry edges removed must fail. A ferry crossing is a mode transition edge in the world graph. The camera, weather, UI, and ship scene represent that edge.

## Ferry distance from spawn

The user requirement is that the ferry be at a consistent distance from spawn but in a random direction. Define **distance** as drivable road distance, since that is what a player feels. Initial tuning band: 12–18 km along valid roads from the initial spawn to the Marren port. The exact band is a content target to playtest. Euclidean distance alone would produce worlds where the port looks close across a mountain but takes an hour to reach.

Placement procedure:

1. Pick a seed-derived angle around the spawn from a named `ferry_direction` random stream.
2. Generate or select coastal port candidates in an angular wedge around that angle.
3. Connect each candidate to spawn using candidate primary and secondary road graphs.
4. Score candidates for drivable distance band, gentle approach, usable coast, scenic rhythm, and separation from first story sites.
5. Pick the best valid candidate; widen the angular wedge in deterministic increments if none qualify.
6. If still invalid, repair road layout or use a known-good Marren macro template rotated by the chosen angle. Never silently create a 40 km ferry trip.

The direction should be broadly distributed across seeds. Do not guarantee that all 360° are equally usable when geography forbids it, but measure angle histograms and correct directional bias in the macro templates.

## Ferry as a game mechanic

The ferry is a threshold and a breather. The player drives onto it, parks, hears engines idle and harbor ambience, may speak to a few people or read a notice, then watches a short crossing. The first crossing should feel consequential; repeat trips offer a skippable sequence after the player has seen it.

On boarding: validate that the car is parked safely; commit a pre-transition save; record origin, destination, vehicle state, passengers, cargo, time/weather state, and story phase. Load a compact ferry deck scene and stream destination data in the background. On arrival: place the car at a reserved destination slot, verify collision and road chunk readiness, then release controls. If loading fails, recover to the pre-transition save rather than losing the car.

Do not simulate a vast sea with full boat physics for the first release. A small authored crossing scene, horizon treatment, audio, and deterministic sky/time progression will carry the emotional moment. The sea still needs coherent coastline and distant vista in the world map.

## Crossing availability

- In Marren, the ferry is accessible during free play after discovery. Fares and schedules should create flavor, not trap new players. A simple wait/skip system allows boarding at the next service.
- In Hest, the return ferry remains available before the Soren commitment. Story tasks must not silently revoke it.
- In Soren, the player cannot board a ferry directly home during the final chapter. The restriction follows the transport authority's vehicle registration and the specific story commitment, not an arbitrary invisible wall.
- After the finale and credits, ferries and land crossings support free travel. The same save continues.

## The Soren commitment gate

The player should receive a clear pre-crossing notice in ordinary language: entering Soren begins the final story chapter and prevents a return to Marren until its resolution. Let them save, prepare, and decline. Once committed, allow side exploration, repairs, and normal save/load within Soren. Avoid a huge uninterrupted timed lock; urgency belongs in selected missions and the final night.

World generation guarantees that entry and exit corridors, the Soren service network, Elias's yard, and final route are present and reachable. If player build choices alter roads, the commitment validator checks an alternate route before allowing entry.

## Country-state machine

`MarrenFree → HestOpen → SorenCommitted → FinaleActive → StoryResolved → PostStoryFree`

This is a *story state*, not a streaming state. In HestOpen, the player may freely return to Marren. In SorenCommitted, the ferry to Marren still exists physically, but the player's route is blocked by the stated legal and practical story conditions. PostStoryFree removes that story restriction while preserving world changes.

## Tests

- Pathfind 10,000 generated seeds with ferry edges removed: no Marren–mainland road path.
- Test spawn-to-port route distance and angle distribution across seed corpus.
- Drive every ferry approach with the beginner car, night lighting, rain, and loaded cargo.
- Save/load before boarding, during deck scene, after arrival, and after failed destination streaming.
- Return to Marren from every Hest story phase; deny/allow travel correctly around the Soren gate.
- After credits, verify all three countries and previous player structures remain accessible.
