# 08 — Controls, menus, onboarding, accessibility

## 1. Input actions

Game code reads **actions**, never keys. Every action is remappable. Defaults for keyboard and mouse (KBM) and a standard twin-stick controller. Button names are positional: South/East/West/North face buttons, LB/RB bumpers, LT/RT triggers, LS/RS sticks.

### 1.1 Global
| Action | KBM | Controller | Notes |
| --- | --- | --- | --- |
| `Interact` | F | South | Press, or hold where stated. Every hold has a toggle alternative (§6). |
| `Back` | Esc / Backspace | East | Leaves a close view; declines |
| `Pause` | Esc (when nothing to leave) / P | Start | |
| `Map` | M | Select / View | |
| `Cabin` | Tab | D-pad up | Where allowed |
| `Mail` | I (hold 0.5 s) | D-pad right (hold) | Overlay |
| `Camera` | C (hold 0.4 s) | D-pad down (hold) | Photo mode |
| `Look Home` | H (hold) | LS click (hold) | |
| `Toggle View` | V | RS click | |
| `Skip` | Hold Space 1.0 s | Hold North 1.0 s | Authored sequences, repeat viewings only |
| `Talk` | T | West | Near a person |
| `Recover` | Hold R 1.5 s | Hold D-pad left 1.5 s | Surface vehicles |
| Free look | Mouse (drag on surface; direct in flight) | RS | |

### 1.2 Ship (`ship`, `ship_cruise`)
| Action | KBM | Controller |
| --- | --- | --- |
| `Steer` pitch/yaw | Mouse, or W/S and A/D | LS |
| `Roll` | Z / X | LB / RB (tap) |
| `Throttle Up` / `Down` | E / Q | RT / LT (analogue sets throttle directly when "analogue throttle" is on) |
| `Boost` | Space (hold) | North (hold) |
| `Brake` | Left Shift (hold) | East (hold) |
| `Align` | R | West |
| `Cruise` | G | D-pad up (double-tap) — or from the prompt |
| `Nearest Depot` | N | D-pad left |

### 1.3 Lander (`lander`)
| Action | KBM | Controller |
| --- | --- | --- |
| Translate left/right, up/down | A/D, R/F | LS |
| Translate forward/back | W/S | RT / LT |
| Rotate pitch/yaw | Mouse or arrow keys | RS |
| Roll (Manual only) | Z / X | LB / RB |
| `Precision` | Left Ctrl (hold) | LS click (hold) |
| `Brake` | Left Shift (hold) | East (hold) |
| `Align` | Q | West |
| `Reset` | Hold Backspace 1.5 s | Hold Select 1.5 s |

`Interact` is not used while docking; F is free for "translate down".

### 1.4 Ground (`ground`)
| Action | KBM | Controller |
| --- | --- | --- |
| Accelerate / reverse | W / S | RT / LT |
| `Steer` | A / D | LS |
| `Brake` | Space | East |
| `Hop` (Hopper) | Left Shift | North |
| Camera orbit / zoom | Mouse drag / wheel | RS / RS click + up-down |
| Survey view | V | RS click |

### 1.5 Skiff (`skiff`)
Accelerate/slow W/S or RT/LT · yaw A/D or LS x · climb/descend R/F or LS y · ping `Interact` · hover `Brake`.

### 1.6 Rail (`rail`)
Forward/back W/S or RT/LT · look mouse or RS · `Interact` at a station.

### 1.7 Close views (cabin points, desk, panels, handwheels)
`Steer` moves the selection or turns the wheel · `Interact` selects or presses · `Back` leaves.

### 1.8 Prompts
Prompts show the bound input for the device last used, switching within one frame of any input from the other device. Glyph sets: keyboard, generic controller, and the two major console-style layouts. A prompt is never shown for an action that will not work.

## 2. Allowed actions by state

Anything not listed is ignored silently.

| State | Allowed (beyond its own controls) |
| --- | --- |
| `solar_flight` | Pause, Map, Cabin (throttle 0 only), Mail, Camera, Look Home, Toggle View |
| `cruise` | Pause, Map, Cabin, Mail, Camera, Look Home, Toggle View, Brake |
| `cabin` | Pause, Mail, Camera, Look Home (at the window), Back |
| `depot_docked` | Pause, Map, Cabin, Mail, Camera, Look Home, panel |
| `orbit_capture`, `descent`, `launch`, `docked_latch` | Pause, Skip (repeat viewings) |
| `orbit_ready` | Pause, Map, Cabin, Mail, Camera, Look Home |
| `surface` | Pause, Map (site atlas), Mail, Camera, Look Home, Talk, Recover |
| `docking` | Pause, Toggle View, Camera, Look Home |
| Hinge actions H3, H5, H6 | Pause, Camera, Look Home only |

## 3. Menus

### 3.1 Title
The *Kestrel* in Mars orbit at the current save's light (or the prologue dawn for a new game). Options: **Continue** · **New expedition** · **Album** · **Settings** · **Credits** · **Quit**. No news, no store links, no account.

### 3.2 Saves
Three expedition slots. Each shows: Expedition Day, place, a thumbnail of the last photograph taken (or the cabin), play time. Autosave only; no manual save, because every stable moment already saves. **New expedition** on an occupied slot asks for a 2 s hold. Each slot keeps three rolling backups (file 09 §5).

### 3.3 Pause
**Resume** · **Journal** · **Settings** · **Return to last port** (flight only; explains exactly what it does) · **Quit to title**. The game is saved before the menu is drawn.

### 3.4 Settings
| Group | Options |
| --- | --- |
| **Controls** | Remap every action per device; invert Y (flight, camera separately); sensitivity (flight, camera, lander rotation); analogue throttle; hold-to-toggle (§6); docking assist level; vibration 0–100% |
| **Display** | Window mode; resolution; resolution scale 50–100%; V-sync; frame cap (30/60/120/unlimited); quality preset (Low/Medium/High) with per-item overrides: shadows, effects, draw distance, star count; field of view ±10°; brightness calibration screen |
| **Sound** | Master, music, effects, signatures, each 0–100%; dynamic range (Wide/Night); mono; mute when unfocused |
| **Reading** | Text size 100/125/150/200%; caption background opacity; sound captions; speaker colours on/off; dyslexia-friendly spacing; letter auto-scroll off by default |
| **Comfort** | Reduce motion (removes camera shake, authored camera moves become dissolves between stills, the cabin sway stops); camera drift when idle on/off; radiation grain off; flash reduction (arc flash, perihelion sweep and mirror glare are limited to a 20% luminance step per second) |
| **Assists** | Visual sound cues (default on); docking assist; ground steering assist (reduces slide on the Skate and Mule by raising grip toward 0.9); cruise wayside pings on/off; pause on focus loss |
| **Language** | Text language |

Settings are stored separately from saves and apply immediately with no restart, except window mode.

## 4. Onboarding

### 4.1 Rules
1. Teach by a person, on the radio, in one line, at the moment of need. No tutorial pop-ups, no slides, no control diagram unless the player opens Settings.
2. One new input per beat. Wait for the player to do it. Never time out; never repeat a hint sooner than 30 s.
3. Each prompt shows at most the first three times its action is needed, then only on request (a 2 s idle near a usable thing).
4. Nothing learned is ever needed under pressure on its first use.

### 4.2 Teaching order
| When | What | Who |
| --- | --- | --- |
| Prologue stage 0 | Drive, brake | Mara |
| Stage 1 | Interact while parked | Mara |
| Stage 2 → 3 | Site atlas, waypoint | Ivo |
| Stage 5 | Photo mode, postcards | Pip |
| Stage 5 | Look Home ("Hold it and it'll show you where we are. Do it from far away. I want to know if it works.") | Pip |
| Stage 8 | Launch confirm | — |
| Stage 9 | Docking, five beats | Mara |
| First departure | Map, plotting, range ring | Mara (letter with a diagram in the margin) |
| First clear space | Align, cruise | Mara (one line) |
| First cruise | Cabin, mail slate | Mara's first letter arriving is the reason to go in |
| First depot | Depot docking; panel is optional and unprompted beyond its label | Beacon note |
| Europa | Listening | Kofi |
| Ceres | Loads | Arman |
| Mercury | Handwheels | Kaito |
| Titan | Skiff, sonar | Rosa |
| Tern Light | Dark-depot restart | The panel's own lamp order; one line in the harbour crew's letter |
| Miranda | Nothing | Nobody |

### 4.3 The first ten minutes
0:00 black; a workshop radio; Mara's signature. 0:10 fade up inside Nomad at dawn, facing the commons, windows lit. 0:20 first line. 0:30 the player is driving. By 3:00 the controller is on the bed. By 6:00 the east bank is on and the sign changes. By 10:00 the player is at the ring gate. No menu, logo sequence or text crawl stands between launch and the rover: studio and title cards run over the first drive.

## 5. Difficulty

There are no difficulty levels. The assists in §3.4 are the whole of it, and each can be changed at any time without comment from the game.

## 6. Accessibility

Minimum commitments for 1.0:

| Need | Provision |
| --- | --- |
| No reliance on sound | Visual sound cues for every audio-led task (Europa bearing arc, Titan sonar ring, beacon tuning shown as two converging needles, radiation dial). Verified by a full playthrough muted. |
| No reliance on colour | Every state shown by colour also has shape or text (lit/dark depots: filled/hollow; receiver balance: needle; locked mirror: clamp icon). Checked in three colour-vision simulations. |
| Holds | Every hold has a toggle alternative: press once to begin, the action completes by itself at the same duration, press again to cancel. This preserves the hinge timing without sustained force. |
| Repeated presses | None required anywhere. |
| One-handed play | All contexts completable with either stick alone plus face buttons through remapping; docking Guided needs three inputs. A documented one-hand preset per side. |
| Fine motor | Precision modifier can be latched; tolerances ×1.5 in Guided; handwheel and desk tasks accept keyboard steps. |
| Reading | Sizes to 200%; high-contrast caption plates; no information conveyed only in handwriting faces (each has a "plain text" toggle). |
| Motion | Reduce motion; field of view; no forced camera rotation while the player controls a vehicle. |
| Photosensitivity | Flash reduction; no element flashes more than three times per second at any setting. |
| Cognitive load | One intention at a time; no timers; journal always states the current intention in one sentence; pause anywhere. |
| Screen-reader support for menus | Menu items and settings expose text to the platform's accessibility interface where the engine supports it; letters and the journal can be read aloud by the platform reader. |

A setting that changes how a hinge moment is performed (hold-to-toggle) must not remove the wait: H3, H5 and H6 still take their full duration.

## 7. Localization

- All player-facing text is addressed by key (file 11). No text in scenes, textures or code. Signs on buildings are icon-first with a short word rendered from a key.
- Reply options, captions and prompts allow 40% expansion. Letters wrap freely.
- Handwriting faces must have a fallback per script; if none exists, the plain-text style is used.
- Numbers, dates and units are formatted per locale; AU and light-time are always shown in the same form.
- Tonal signatures are language-independent, which is one reason for decision D14.
- 1.0 ships in English with the pipeline proven by one pseudo-locale test (accented, expanded, right-to-left mirrored layout check).

## 8. Platform behaviours

| Event | Behaviour |
| --- | --- |
| Focus lost | Pause (setting); audio muted (setting); held inputs cleared |
| Controller disconnected | Pause; resume on any device |
| Display or resolution change | UI re-lays out; never clips a prompt or caption |
| Quit requested (window close, system) | Save flushes, with a 3 s limit; then quit. If it cannot save: one dialog offering Quit anyway / Keep playing. |
| Suspend and resume | As focus loss; first frame after resume uses a zero time step |
| Ultra-wide and 16:10 | HUD anchors to a 16:9 safe area; authored sequences letterbox rather than crop |
| Steam Deck class devices | Target 40 fps at the Low preset, 800p; all text legible at 100% size on a 7-inch screen. Not claimed until measured. |

## 9. Acceptance for this file

- The whole game is completed in test: (a) keyboard only; (b) controller only; (c) muted with visual cues; (d) with hold-to-toggle on; (e) at 200% text with no overlap or truncation; (f) with Reduce Motion on.
- Rebinding any action updates every prompt that refers to it.
- No prompt ever shows a key for an action that is disallowed in the current state.
