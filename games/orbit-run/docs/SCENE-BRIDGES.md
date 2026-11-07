# Connecting space, orbit and the surface

Updated 7 November 2026. The abrupt change is a change of scene within the same page. It should feel like one journey, even while the game changes coordinate systems and loads a different local world.

## What is implemented now

Arrival and departure use a shared fade cover with location-specific radio text. Input and simulation are held during the handoff; the destination gets rendered before the cover disappears. Repeated activation cannot start two transfers. The reduced-motion preference removes the fade duration. On departure, a failed field-log save keeps the rover on Mars and explains the problem.

This is an interim presentation bridge. It does **not** depict descent, ascent, atmospheric flight, orbital capture or manual docking. The current lander beacon still places Kestrel directly in departure orbit. Keep those capabilities marked pending.

## The intended journey

| Stage | Player control | Visual/audio continuity | Data handoff and recovery |
| --- | --- | --- | --- |
| Deep-space approach | Main ship | Mars grows in the view; the destination marker becomes a surface-contact marker. Hearth radio identifies the landing region. | Keep the current flight checkpoint. Begin preloading the destination once selected or within approach range. |
| Orbit request | Confirm a destination and landing intent | An authored orbital-capture shot carries the same planet, lighting and ship orientation into the next view. Main ship stays outside the planet. | Record planet ID, orbit parameters, carried cargo and the last safe main-ship state. Cancel before commitment returns to flight. |
| Shuttle departure and descent | Non-interactive authored animation | Show separation from Kestrel, an orbital view of Hearth, then a terrain descent. Preserve the direction of sunlight and the same radio voice. | Preload terrain during the shot. Do not reveal the destination until terrain, collision bounds, rover and UI are ready. A load failure offers retry or return to orbit. |
| Surface arrival | Rover control after a clear cue | Follow the lander airlock or a short camera track to Nomad. Dust settles; radio says the rover is ready. HUD changes in stages. | Restore the existing rover and field log, or use the validated first-arrival spawn. Finish a save before showing control prompts. |
| Optional exploration | Rover | A distant lander, settlement landmarks and orbital radio keep the larger journey present. | Surface position, mission stage, discovery stamps and selected local stop persist. |
| Departure preparation | Confirm departure while parked | A short manifest shows what is returning with the shuttle. Do not discard cargo or uncompleted local jobs. | Flush the surface save and create a transport checkpoint. Failure leaves the player in the settlement. |
| Surface launch | Non-interactive authored animation | Dust, ascent past the settlement skyline, a thinner atmosphere, then an orbital view. Reuse the arrival geography. | End at a defined shuttle pose relative to the main ship. Save this endpoint so retry does not replay launch. |
| Manual rendezvous and docking | Shuttle control | Kestrel first appears as a distant light. Approach cues transition into the docking interface. Let the player identify and reach the correct port. | Use a local reference frame and relative velocity. Validate distance, orientation and closing speed; accept capture exactly once. |
| Main-ship departure | Main-ship control | A stowage confirmation, cargo update and camera pullback establish that docking succeeded. Transfer the radio bed back to flight. | Move ownership of cargo and control atomically to the main ship. Recompute the route from the new ship state. |

## How to build the bridge without hiding more cuts

The first authored sequence should be Mars-only and short. Build a rough greybox capture/descent/arrival and launch/rendezvous first. Review camera direction and pacing before producing detailed shots. Every sequence needs a clear first frame, final frame and defined world state at both ends.

A real-time authored camera/vehicle track is the recommended first experiment because our existing geometry can be reused and the settlement can reflect progress. A pre-rendered video is also viable if size, decoding and continuity work better on target hardware. Neither means the player must physically fly the descent: the requested experience remains a non-interactive landing/launch animation, with player control reserved for docking.

Avoid presenting a generic loading screen as if it were the final transport sequence. A fade hides the technical swap; a recognizable lander, location and radio exchange explain why that swap happened.

## State and ownership

Use a single transition coordinator. The future sequence should have explicit states such as approach, orbit capture, descent, surface, ascent, rendezvous, docking capture and main-ship flight. Each state owns one active vehicle, one input context, one camera and one HUD. Scenes do not independently decide that a transfer is complete.

A transport record should contain a unique transition ID, destination, source checkpoint, phase, intended endpoint, cargo ownership, cinematic completion and docking retry pose. A skip uses the exact same endpoint function as watching the shot. Save writes and progression rewards must be idempotent. Never award a delivery from a camera timestamp.

Do not scale Mars surface metres into the current solar-system coordinates. Keep three frames: solar navigation, local orbital rendezvous, and local surface terrain. Convert a stable planet/orbit reference at the boundary. Large planetary visuals are backgrounds during docking; they are not collision targets to ram while searching for a landing pad.

The current prototype's unlimited departure refill, direct orbit placement and browser-session-only flight state are temporary rules. Complete expedition persistence and explicit servicing rules must precede the full transport checkpoint feature.

## Camera and sound rules

- Establish the destination before a cut; reveal the same landmark after it. Hearth's dish, crater rim and solar field are useful anchors.
- Match screen direction, sun direction, approximate exposure and vehicle orientation. A short covered moment is better than an unexplained 180-degree reversal.
- Fade the old engine before transferring control. Bring up radio, lander and rover sound beds in order. Keep mute state across scenes.
- Use captions for radio and an unmistakable handover cue. Show the new controls only when they work.
- Do not rotate a user's free camera while they are driving. A scripted camera starts only after entering transport mode.
- Keep a reduced-motion option and skippable replay. Skipping cannot bypass asset readiness or a required save.

## Loading, input and failure cases

Preload destination code/assets in the background while an approach or movie is running. Keep the source scene available until the destination is validated. Under memory pressure, retain a small source checkpoint instead of both complete scenes. Release renderer resources once ownership changes; repeated round trips must not accumulate scenes, audio contexts or listeners.

Clear held keys on entry and exit. Disable map, recovery and interaction during a committed transfer. Decide how focus loss and pause affect a cinematic; a foreground return must not silently advance through a docking handover. The current fade coordinator should gain explicit suspension/cancellation before longer cinematics are added.

If loading fails, restore the source HUD, exposure, pointer focus and controllable state together. A native save failure must never claim that cargo was secured. If docking fails, restore the shuttle's last safe rendezvous pose; keep the completed surface job and launch checkpoint.

## Implementation order and acceptance checks

1. Keep the interim fade and measured loading/error behavior while building the rough orbital scene.
2. Establish the main ship's orbit and a reusable shuttle; agree on their relative sizes and docking-port geometry.
3. Author a short arrival camera track with a validated surface endpoint.
4. Author departure into a deterministic local rendezvous start.
5. Implement playable docking, clear assistance prompts and a retry point.
6. Add transport saves, skip/replay, focus-loss handling and failure recovery.
7. Review the complete loop on Windows before producing another planet's cinematic set.

Acceptance requires a full watched round trip, a skipped round trip, a loading failure, a save failure, focus loss during each phase, a failed docking attempt followed by success, and a reload at each stable checkpoint. Cargo, stage, selected destination and active craft must agree in all cases. Record load/frame-time data and a short playthrough; do not approve only the cutscene footage.
