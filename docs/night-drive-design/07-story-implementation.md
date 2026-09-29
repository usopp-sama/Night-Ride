# 07 — Story implementation and ending

## Principle

The main story is a path through the systems the player already uses: driving, listening, navigation, repairs, supplies, contacts, and route preparation. The opening country must be satisfying without plot pressure. Once the player crosses into Hest, the story acquires direction; once they enter Soren, it acquires urgency.

## Chapter plan

| Chapter | Player-facing beat | Required game actions | State change |
| --- | --- | --- | --- |
| 0. Home roads | Player settles into Marren | Drive, stop, camp/repair, discover ferry | None; sandbox persists |
| 1. Crossing | Clue or curiosity leads to Hest | Ferry, first Hest night stop | `HestOpen`; story starts |
| 2. First missing route | Meet local mechanic and a driver affected by closures | Trace/drive a road, fix a vehicle, help one stop | Night Line becomes concrete |
| 3. Elias's trail | Find records and people who knew Elias | Multi-stop journey, one repair/part decision | Reveal Elias alive in Soren |
| 4. The agreement | Learn Hest/Soren transport deal and its costs | Help named drivers; choose route preparations | Soren objective becomes clear |
| 5. Commitment | Prepare for crossing | Save/checkpoint, vehicle readiness, border drive | `SorenCommitted` |
| 6. Yard | Find Elias and their car | Navigate regulated roads, obtain access, inspect/repair car | Two-car objective established |
| 7. Final preparation | Coordinate allies and fuel/stops | Choose final route, ready both cars, optional support | `FinaleActive` |
| 8. Last Night Run | Cross staged closures before dawn | Driving, route choice, repair, timed but checkpointed segments | `StoryResolved` |
| 9. Homecoming | Return to Marren | Ferry/road return, quiet final drive | Credits, then `PostStoryFree` |

The clue that takes the player to Hest is not a single fragile collectible. Multiple leads converge on the same first night stop; any one suffices. If the player simply takes the ferry, they can discover the story by arriving there. The story begins in Hest, even if Marren planted the clues.

## Specific human stakes

At least three Hest people should be introduced through playable needs, not exposition: a mechanic whose parts access is being cut, a driver whose route has been retired, and someone in a remote settlement who depends on that route. Their names and personalities are authored. Their exact shop/stop locations can bind to generated sites. The player should revisit one of them after a meaningful change so the result is visible.

Elias has a clear reason to stay in Soren: their car holds records and parts knowledge that can help people leave or maintain independent cars. The record itself is not a magic key; it is a practical map and contact network. Elias has made choices the player may question. Mara Venn represents the authority's safety case through actual improvements in major routes, while the costs of exclusion are visible in Hest and Soren.

## Story binding to generated worlds

Author *roles and scenes*, generate *where they occur*. Each required scene declares site requirements: country, settlement tier, nearby road class, possible interior kit, traversal distance, and prerequisites. The world generator reserves valid sites before optional villages. Story binding writes site IDs into the manifest.

Example: the first Hest night stop requires an arrival town or nearby branch, a repair interaction, an NPC spawn, safe parking, and a route onward. A random seed changes the shape of the drive and the town's optional services; it does not put the mechanic in a village without a road.

Only optional encounters use broad event pools. Required story scenes remain authored and tested. Dialogue may reference generated settlement names through slots, but crucial emotional lines should be authored without awkwardly filling many procedural variables.

## Escalation schedule

Escalation follows story milestones, not real-time decay. The player can free roam without the world punishing them for taking a scenic detour.

1. Hest arrives as odd absences: an unlit stop, an empty parts shelf, a missing driver.
2. Specific consequences appear: a repaired car returns to service; another route is licensed away.
3. Elias is confirmed alive; the conflict becomes personal.
4. The Hest/Soren agreement is announced; the Night Line's future is threatened.
5. In Soren, the player's vehicle registration creates practical restrictions; Elias's car gets a scheduled conversion slot.
6. The final night starts only when the player explicitly commits from a preparation screen/scene.

Local setbacks must be reversible or clearly authored. Do not randomly raid a player-built camp or destroy a favorite car to create drama.

## Final night design

The Last Night Run is a sequence of playable drives joined by brief pauses. It is not one uninterrupted timer across an entire country. Proposed phases:

1. **Release:** Ready Elias's car and leave the yard. First obstacle tests diagnosis or spare preparation.
2. **Separation:** Road closures force a route choice. Player knowledge, maps, and optional restored stops offer alternatives.
3. **Relay:** The two cars and a small number of allies coordinate through a night stop. Avoid a long fragile AI convoy; use off-screen ally progress records and tightly controlled visible companions.
4. **Crossing:** The player drives the final route under pressure from staged access closures, darkness, fatigue, and car condition. Ordinary road physics remain authoritative.
5. **Quiet after:** Reach Hest; tension falls. Ferry/return to Marren is a restorative final drive.

Each phase has a checkpoint. Failure rewinds to the last meaningful preparation point, preserving a player's built world and non-story inventory. The final route must be finishable with guaranteed story supplies and the beginner assist preset. Optional camps, parts, and allies affect ease, route choices, and epilogue details.

## Ending and credits

At dawn, the player and Elias return to Marren in separate cars. The story acknowledges named people helped or missed. Hest night stops begin to reopen; Soren recognizes a narrow path for independent vehicles. Avoid an instant nationwide transformation. Show the player's first car worn but still theirs.

Credits should follow the quiet final scene and include third-party notices where required. After credits, offer “Continue driving.” The existing save transitions to `PostStoryFree`, with all countries available and story changes persisted. Players can skip credits and still receive the same state transition; credits can be replayed from the menu.

## Narrative tests

- Reach Hest via each clue and via direct ferry; story starts in all cases.
- Ignore the plot in Marren for hours with no forced deadline.
- Return to Marren at every Hest milestone.
- Save/quit/reload throughout Soren; state and car are correct.
- Enter the finale with minimal and maximal optional preparation; both complete with different details.
- Credits skip, full playback, crash/restart, and post-story continuation all lead to the same resolved world state.
