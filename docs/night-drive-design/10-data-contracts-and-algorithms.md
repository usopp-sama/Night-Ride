# 10 — Data contracts and algorithms

This document is a starting contract between world design, vehicle code, story, saving, and tools. Field names are illustrative but should be fixed and versioned once implementation begins.

## Identity and coordinates

Use stable IDs for countries, settlements, roads, ports, story anchors, player structures, and vehicles. IDs are generated from immutable namespace + seed + feature path, never from load order or an actor memory address. Use a local coordinate origin per streamed region or engine-supported large-world coordinates; keep saved global positions in a precise integer or double representation. Road graph distances are stored in metres.

All generation inputs are canonicalized before hashing: fixed encoding, sorted key order, explicit defaults, and pinned PRNG implementation. A `uint64` PRNG stream seeded through a stable hash is sufficient for many subsystems, but pin the algorithm itself so different compilers do not reinterpret the seed.

## World manifest (illustrative JSON)

```json
{
  "schema_version": 1,
  "generator_version": "0.1.0",
  "content_version": "prototype-01",
  "world_seed": "8b62d14fa7724c2c9a0e01f51b98d6ef",
  "world_hash": "computed-after-generation",
  "country_ids": ["marren", "hest", "soren"],
  "spawn_site_id": "marren.spawn.001",
  "ferry_edge_id": "ferry.marren.hest.001",
  "story_anchor_bindings": {
    "hest.first_night_stop": "settlement.hest.014.stop.2",
    "soren.elias_yard": "settlement.soren.006.yard.1"
  },
  "road_graph_file": "roads.bin",
  "settlements_file": "settlements.bin",
  "terrain_chunks_index": "terrain-index.bin",
  "validation_report_file": "validation.json"
}
```

The real format may be binary, but it must provide equivalent fields and a human-readable debug export. `world_hash` is computed from canonical resolved content, not from a mutable save timestamp.

## Road and settlement records

```text
RoadNode {
  id, country_id, position, role, settlement_id?, ferry_port_id?,
  safe_stop, story_access_tags[]
}

RoadEdge {
  id, from_node, to_node, geometry_ref, length_m, road_class,
  surface_id, max_grade, min_curve_radius_m, speed_intent_kmh,
  service_corridor_id, chapter_access_rule, collision_chunk_refs[]
}

Settlement {
  id, country_id, position, tier, terrain_profile, road_node_id,
  archetype_id, name_token, service_slots[], inventory_profile_id,
  build_parcels[], story_role_ids[]
}

ServiceSlot {
  id, kind, provider_npc_id?, guaranteed, stock_profile_id,
  open_hours, story_state_overrides[]
}
```

`chapter_access_rule` is an overlay with an explicit reason and alternatives. The base road graph still exists physically. Avoid deleting edges merely because a story chapter closes them.

## Vehicle and parts records

```text
VehicleDefinition {
  id, chassis_mass_kg, inertia, wheelbase_m, axle_positions,
  socket_tags[], allowed_engine_models[], base_tire_size, camera_rig_id
}

PartDefinition {
  id, category, fitment_tags[], mass_kg, price_band,
  condition_range, physical_parameters, novice_description,
  advanced_parameters, dependencies[], incompatible_tags[]
}

VehicleInstance {
  id, definition_id, owner_id, location, installed_part_ids[],
  fuel_l, tire_states[], damage_states[], mileage_km, cosmetic_state,
  last_safe_road_node_id
}

VehicleSnapshot {
  tick, transform, velocity, rpm, gear, throttle, brake,
  wheel_slip[], wheel_load[], temperatures, fuel_l, warnings[]
}
```

All units are explicit. `VehicleSnapshot` is immutable after publish; UI/audio may interpolate it. Saves use `VehicleInstance` plus necessary physical state, not an audio buffer or render actor pointer.

## Story records

```text
StoryState {
  chapter, completed_beat_ids[], active_beat_ids[],
  discovered_clue_ids[], relationship_flags[],
  soren_commitment_acknowledged, finale_checkpoint_id?,
  credits_seen, post_story_unlocked
}

StoryBeat {
  id, prerequisites[], valid_site_role, on_enter_actions[],
  on_complete_actions[], failure_recovery, optional,
  min_world_capabilities[]
}
```

Every required beat has a unique ID, idempotent completion action, safe reload behavior, and a recovery path if an actor fails to spawn. Story actions update persistent state first, then presentation. A repeated trigger must not grant the same rare part twice or replay an irreversible world change.

## Generator pseudocode

```cpp
WorldManifest GenerateWorld(const GenerateRequest& request) {
    auto rng = NamedStreams(request.seed, request.generatorVersion);
    auto topology = ReserveCountryTopology(rng["topology"]);
    ReserveStorySiteEnvelopes(topology, request.storyRequirements);
    auto terrain = GenerateMacroTerrain(topology, rng["terrain"]);
    auto spawn = ChooseMarrenSpawn(terrain, rng["spawn"]);
    auto ferry = SolveFerryPortByRouteDistance(
        terrain, spawn, request.ferryDistanceBand, rng["ferry_direction"]);
    auto sites = PlaceSettlements(terrain, ferry, rng["settlements"]);
    auto roads = BuildAndRepairRoadGraph(terrain, sites, rng["roads"]);
    BindStoryAnchors(sites, roads, request.storyRequirements);
    AssignServicesWithCoverageSolver(sites, roads, rng["services"]);
    PlaceOptionalContent(terrain, roads, sites, rng["optional_content"]);
    auto report = ValidateAll(topology, terrain, roads, sites, ferry);
    if (!report.ok()) return RetryOrCuratedFallback(request, report);
    return FreezeManifest(topology, terrain, roads, sites, ferry, report);
}
```

The ferry solver must consider road distance after the road graph is built; in actual code this is an iterative macro-road/ferry candidate solve. The pseudocode shows conceptual dependencies, not a claim that one pass suffices. A bounded retry count is mandatory for worst-case loading time.

## Ferry solver sketch

For each candidate coastal site in a seed-derived angle wedge, reserve a viable road corridor from spawn, estimate route distance, and score `distance error + port terrain penalty + road geometry penalty + repetition penalty`. Build the best candidate, then compute actual graph shortest path. If outside the band, repair corridor length or select the next candidate. Reject candidate if the sea channel is not navigable or the approach lacks a service node. Record selected angle and distance in validation diagnostics.

## Service coverage solver sketch

For each required service type and each mandatory journey corridor, run shortest-path search to nearest compatible service. If distance or stock is unacceptable, reserve a slot in the cheapest suitable settlement along the corridor. Repeat until all required service constraints pass. Only then roll optional specialties. Story-specific parts use explicit guaranteed source sets with at least two acquisition methods where possible.

## Save payload and transaction

```text
SaveHeader { format_version, world_hash, build_version, timestamp, checksum }
SaveBody   { manifest_ref_or_copy, player, vehicles[], structures[],
             discovery, settlement_state, story_state, world_clock }
```

On save: freeze a consistent state at a tick boundary; serialize to a temporary slot; verify checksum and schema; replace the prior slot; retain the previous good copy. On load: validate schema/hash, migrate if supported, resolve stable IDs, check safe car placement and required story objects, then activate chunks before player control. A corrupted current slot falls back to the prior good copy with a clear message.

## Authoring and debugging tools

The `WorldGen` CLI prints seed, generator version, selected ferry angle/route distance, settlement/service counts, mandatory route results, and manifest hash. `SeedInspector` draws country/coast masks, road graph, service radii, chapter gates, ferry corridor, and story sites; it can jump to a seeded world in the game. A bad seed report should be reproducible from one command and a pinned content version.
