# 05 — Settlements, parts, economy, and player building

## Settlement design goal

Each settlement should be a place with a reason to stop, not a row of randomized vending machines. Its geography, road position, local work, service list, and people should tell the same story. Generated settlements have stable IDs and persistent inventories/relationships in the save.

## Settlement tiers and service slots

| Tier | Typical role | Guaranteed public basics | Optional specialties |
| --- | --- | --- | --- |
| Isolated stop | A reason to pull over | Safe parking or marked rest | Pump, radio, food, small cache, viewpoint |
| Hamlet | Small local community | Rest, simple supplies, basic help | Tire repair, tools, farm/utility parts, camp site |
| Village | Recurring local hub | Rest, basic repair, fuel access within coverage corridor | Salvage, bodywork, electrical, lodging, towing |
| Town | Regional service | Fuel, repair, common parts, trade, save/recovery | Engine, suspension, fabrication, specialist tuning |
| City | Large regional hub | Broad services, transport links, story-capable facilities | Rare parts, customs, large yards, multiple mechanics |

These are content roles, not promises that every tier contains every storefront. The coverage solver ensures any normal route reaches necessary services within a tested driving range. A world can generate a hamlet without a mechanic; it cannot generate a compulsory chapter with no way to repair a required fault.

## Service roll algorithm

1. Classify site by tier, terrain, road centrality, country, local industry, and story state.
2. Reserve mandatory slots for regional coverage and story needs.
3. Roll remaining slots from weighted compatible profiles; cap duplicate specialties within a service radius.
4. Assign named facade/interior kits and NPC schedules from the same profile.
5. Allocate inventory groups and price bands from supply links.
6. Validate access, service spacing, and stock availability; replace lowest-priority optional slots to repair failures.

Example: a mountain village near a steep pass is more likely to have tires and towing; a port town is more likely to stock batteries, loading gear, and ferry information. This is a policy probability, not a deterministic stereotype. A rare town can be surprisingly specialized if the surrounding region still meets coverage rules.

## Parts and compatibility

Parts use stable identifiers, categories, fitment tags, quality, condition, mass, cost, and performance effects. Categories: engine, cooling, intake/exhaust, gearbox, differential, tires, suspension, brakes, lighting, battery/electrical, storage, towing, radio/navigation, comfort, body, fuel system. Each vehicle has socket/interface tags; matching is data driven.

The inventory UI answers three simple questions before showing advanced detail: **Does it fit? What improves? What gets worse?** Enthusiasts can inspect curves and dimensions. Common consumables and story-required parts must have multiple acquisition routes (buy, salvage, repair, trade, guaranteed mission source).

Avoid a single escalating “tier” ladder. A reliable stock radiator can be preferable to a high-output radiator in a cold, low-load route. Upgrades should create playstyle tradeoffs.

## Economy and supply

Every settlement has a simplified supply profile: produced groups, consumed groups, road/ferry links, stock capacity, and replenishment cadence. Simulate these as regional records, not thousands of individually driving trucks. Visible traffic can represent the underlying economy, but the economy survives when an area is unloaded.

Prices and stock may vary modestly across seeds and story states. Shortages in Hest and Soren communicate the plot, but a casual player must retain access to baseline fuel and recovery. Prevent arbitrage from becoming the only effective way to progress. Money comes from ordinary work (deliveries, repairs, mapping, salvage), and story completion must not require grinding random jobs.

The simulation should distinguish *flavor scarcity* (a specialty part is rare) from *hard progression scarcity* (a required part is absent). The latter is addressed by explicit guaranteed sources.

## Player-built places

Building tiers:

1. **Portable:** tent/bed, lamp, basic toolkit, small cache. Fits a valid roadside clearing.
2. **Field workshop:** shelter, workbench, jack, storage, radio, charging/fuel storage. Requires more area and materials.
3. **Permanent roadside site:** garage bays, rest area, signage, supply storage, and optional NPC services. Requires a designated or procedurally validated build parcel.

The player may establish multiple sites. There is no mandatory home garage. Placement needs land ownership/world rules that are legible in fiction, but avoid endless permit bureaucracy. Use stable build parcels near roads and freeform object placement within them. Portable camping can occur at more places than permanent construction.

Construction can improve route access, but it cannot rewrite mandatory roads in ways that break story reachability. A player-made shortcut or service can be optional support for the finale; the authored fallback route remains viable.

## Persistence and recovery

Inventory, vehicle modifications, shop rolls, structures, and NPC relationships are saved by stable ID. If an asset is removed in an update, migrate the state to a replacement or give a recoverable generic part—never silently delete a player's main car or camp. A tow/recovery service can reach a vehicle on any drivable road, including generated roads, using the logical road graph.

## Example generated settlement cards

**Pine Bend (Marren, ridge village):** 18–25 buildings, tire specialist, small pump, radio mast, camping parcel, one scenic overlook. A novice can fix a flat; an expert finds a rare tire compound. The ridge road is safe but technical.

**East Quay (Hest, ferry town):** ferry office, fuel, general repair, cargo yard, two cafes, independent night stop on a side road. Arrival immediately introduces the difference between official and informal routes.

**Ash Yard (Soren, industrial town):** authorized depot, limited public pump, salvage yard, guarded conversion facility, local mechanic who knows Elias. Its services reflect Soren's system while still giving players a way to recover.

Names and counts are examples. Generator policy decides which compatible card or variation fits a seed.
