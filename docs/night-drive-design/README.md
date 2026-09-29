# Night Drive — design and production bible (v0.1)

This is a planning package for a Windows/Steam single-player game. It describes the game from the first playable boot through credits and post-story free play. It is a set of **buildable specifications and decision gates**, not a claim that the game has been implemented. Values marked *initial target* must be measured in a playable build.

## Read in this order

1. [01 — Product and story spine](01-product-and-story.md): the promise, the three countries, the plot, and the ending in simple language.
2. [02 — Player mechanics](02-player-mechanics.md): what the player can do, how freedom and tension coexist, and how novices and enthusiasts share the same game.
3. [03 — Vehicle physics and audio](03-vehicle-physics-and-engine-sim.md): the physical model, Engine Simulator integration plan, and acceptance tests.
4. [04 — Seeded world generation](04-seeded-world-generation.md): deterministic generation pipeline, terrain, settlements, roads, validation, and world persistence.
5. [05 — Settlements, economy, and construction](05-settlements-economy-building.md): village/city services, stock, supply, player structures, and simulation limits.
6. [06 — Countries, sea, and ferry](06-countries-sea-ferry.md): topology, ferry placement and transition, border rules, and story lock.
7. [07 — Story implementation](07-story-implementation.md): chapter triggers, missions, escalation, finale, credits, and sandbox return.
8. [08 — Software architecture](08-software-architecture.md): project bootstrap, runtime modules, data contracts, saving, streaming, and Steam integration.
9. [09 — Production roadmap and gates](09-production-roadmap.md): exact implementation order, prototype cuts, content pipeline, tests, and release gates.
10. [10 — Data contracts and generation pseudocode](10-data-contracts-and-algorithms.md): concrete schemas and algorithms that connect the design to code.
11. [11 — Decisions and source register](11-decisions-and-sources.md): decisions made, unresolved tradeoffs, and source links.
12. [12 — Implementation backlog](12-implementation-backlog.md): an ordered, file-level path from project bootstrap and worldgen `main.cpp` to credits and post-story continuation.

## Non-negotiable product rules

- Country 1 (Marren) is a genuinely peaceful open sandbox. The main story begins only after the player reaches Country 2 (Hest).
- Marren is separated from Hest and Soren by sea. The Marren ferry is a consistent travel distance from spawn on every seed, but its direction varies.
- Hest permits return to Marren. Entering Soren is an explicit, warned story commitment; the player returns after the final sequence. Post-credits, all countries are explorable.
- The car remains the center of travel, storage, repair, discovery, and the ending. On-foot play is local and useful, not an alternate long-distance game.
- There is no fixed garage requirement. Players can camp or build where world rules permit.
- Every generated seed must preserve story reachability and a coherent distribution of roads, towns, parts, and services.
- More physics is welcome when it produces readable decisions or sensory pleasure. Complexity that only creates chores is optional or automated.

## Scope honesty

The full vision—three seeded countries, living roads, extensive vehicle customization, and a cinematic story—is a large project. The roadmap separates an authored handling slice, a seeded-world vertical slice, and full production. The first two are product tests. If they fail, adding more countries will not rescue the experience.

The prior [architecture review](../Night-Drive-Review-and-Roadmap.md) proposed a smaller, curated release and Unity as a provisional engine. This package follows the user's expanded vision and explores a C++-centric implementation. The engine decision remains gated by a Windows prototype; it is recorded in [11](11-decisions-and-sources.md).
