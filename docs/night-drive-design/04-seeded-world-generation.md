# 04 — Seeded world generation policy

## Core rule

The seed chooses among designed possibilities. It does not choose whether the game is playable. All worlds preserve a coherent three-country story, a fixed sea separation, services needed for normal play, and viable routes for the finale.

World generation occurs at New Game time as a deterministic **logical manifest**. Visual and collision chunks are then built or loaded around the player. Save the resolved manifest so later updates cannot silently alter a player's roads.

## Inputs and outputs

Inputs: 128-bit user or random seed, generator version, content pack version, difficulty/assist preset, country template catalog, archetype weights, and story anchor requirements.

Outputs: country polygons, coastlines, ferry ports, terrain macrofields, road graph, settlement graph, service inventories, resource sites, story anchors, scenic POIs, chunk descriptors, stable IDs, and validation report. Decorative vegetation and clutter can be generated lazily from chunk seeds; important routes and services cannot.

Use named independent PRNG streams derived from `(world seed, generator version, country ID, subsystem name, feature ID)`. Never use one global random stream across all systems. A new bench or tree must not move the ferry or remove a town.

## Generation order

1. Select three compatible country *archetypes* and a global shape family. Archetypes control distributions, not plot outcomes.
2. Establish country topology: Marren separated by sea; Hest and Soren share a traversable land border. Reserve a ferry corridor and essential story sites before terrain noise.
3. Choose Marren spawn and ferry direction. Enforce a route-distance band to the port as described in [06](06-countries-sea-ferry.md).
4. Generate low-frequency landforms, coastlines, watersheds, and climate bands. Put the sea crossing in actual navigable water. Smooth important approaches.
5. Place story anchor envelopes: first Hest night stop, Hest mechanic hub, Hest/Soren crossing, Soren yard, final route, return border. Do not place the exact building yet; reserve suitable terrain and access.
6. Place settlement candidates according to topography and access: coastal ports, valley villages, ridge towns, junction markets, industrial towns. Reject implausible sites.
7. Build a road graph connecting mandatory nodes. Add secondary loops, scenic roads, and optional branches subject to a road-density budget.
8. Create local terrain and road geometry together: cut/fill, retaining surfaces, bridges/tunnels from approved templates, drainage, shoulders, collision, and sight lines.
9. Assign settlement tiers and service slots. Solve mandatory supply constraints first; roll optional specialties second.
10. Place POIs, salvage, rest spots, radio coverage, signs, traffic routes, and environmental detail.
11. Validate all constraints. Repair locally where possible; reject and resample at most a bounded number of times, then use a curated fallback template with deterministic variation.
12. Freeze and serialize the manifest with hashes and generation diagnostics.

## Country archetypes

Each country has a stable narrative identity but multiple terrain expressions. For example, Marren may be coastal hills, broad farmland, or wooded ridges; all have welcoming roads, useful small settlements, and a calm spawn region. Hest may be plateaus or rolling valleys; all have a partially functioning night route network. Soren may be basin industry or a dense highland corridor; all have controlled border and service infrastructure. Never let an archetype contradict its required story role.

## Terrain policy

Build macro terrain from height fields and masks: continental/coastal shape, ridge lines, watershed, erosion-like smoothing, local detail. The order matters: story/road reservations constrain erosion and coast generation. Use physically plausible water flow as a design heuristic; do not promise scientific geology.

Towns favor workable slope, buildable area, water or road access, and plausible distance from neighboring services. Ports need sheltered coast and road approach. Mountain roads need switchback templates, max grade, and minimum curve radius suitable for the slowest required car. Extreme terrain becomes optional scenic content rather than a mandatory story barrier.

Terrain generation must preserve route readability at night. Silhouettes, signs, reflective markers, and landmarks should help players navigate without covering the map in HUD icons.

## Road graph policy

Nodes represent settlements, ports, junctions, service stops, story sites, and scenic destinations. Edges have class, length, surface, grade envelope, curvature envelope, speed intent, service spacing, scenic identity, traffic weight, and discovery state. Render splines and collision are outputs of this graph, not independent truths.

Mandatory graph invariants:

- Every required destination is reachable in its chapter state.
- Marren spawn reaches ferry by at least one low-risk path and preferably two distinct route experiences.
- Every country has a connected primary network. Optional dead ends are clearly signaled.
- Ferry arrivals have nearby fuel, rest, and orientation services.
- Story route closures never remove all recovery paths or strand the player without a safe save location.
- Required upgrade/repair capability is available before any route that needs it.
- Final story route is validated against a standard beginner vehicle plus guaranteed story preparation, not against rare optional loot.

Roads are assembled from authored grammar pieces: straight, bend, hairpin, junction, bridge, tunnel, town street, gravel branch, coastal road, ferry approach. The generator varies layout and context while respecting grade, radius, crossing clearance, intersection visibility, and collision seam rules. A road may be beautiful but fails generation if a player cannot actually drive it.

## Settlement placement and ecology

The world should have a hierarchy: a few cities, several towns, many villages/hamlets, and isolated stops. Their sizes and distances are content-budget parameters, not hard-coded lore. Nearby terrain and network position influence services:

- Junction towns favor fuel, mechanics, parts, and lodging.
- Coastal ports favor ferry services, cargo, small repair yards, and weather information.
- Mountain villages favor tires, suspension, towing, and shelters.
- Farming areas favor utility parts, fuel storage, and tool repair.
- Industrial areas favor salvage, fabrication, heavy parts, and specialist workshops.
- Scenic remote settlements may lack advanced parts but offer camping, radio, or local knowledge.

The generator uses weighted service slots plus explicit coverage rules. A blacksmith-style specialty is delightful because it varies; a missing fuel source across an entire story corridor is a bug. Detailed rules are in [05](05-settlements-economy-building.md).

## Variation without incoherence

Use authored “idea packets”: terrain + road + settlement + services + sound/visual motifs. An example packet is a wooded ridge with one switchback road, a tire shop in the valley town, and a radio overlook. Another is a coastal plain with long straight roads, a ferry settlement, and an old service station. Packets can combine if their geometry and economic rules agree. This is stronger than independent random rolls for every asset.

Provide designer controls for required frequency, rare-event cap, minimum novelty, and adjacency. Anti-repetition should compare adjacent regions; two successive towns should not have identical service profiles unless that is a deliberate corridor theme.

## Validation and seed corpus

The generator emits a machine-readable validation report with failed constraints, repair attempts, and manifest hash. Test at least a fixed regression corpus of seeds plus broad random fuzzing; extend the corpus whenever a bad world is found.

Automated checks cover land/water topology, ferry distance, graph connectivity, road grade/curve bounds, settlement access, service coverage, quest anchors, buildable clearings, and safe spawn/return. A headless route walker drives every required path with a simplified vehicle envelope. Humans review selected seeds at night for pacing, town identity, and memorable roads. “Passes graph tests” is necessary but not sufficient.

## Save and update policy

Store the seed and generator version **and** a compact resolved world manifest: stable IDs, anchor positions, country and road graph, settlement/service rolls, POI state, story sites, and content revisions. Save player structures/changes separately. When content changes, load old manifests through explicit migrations; never silently regenerate an existing save from the same seed under a new algorithm.
