# 04 — Immersion systems

The nine systems that make the distance felt and the people remembered. Each has: purpose, exact behaviour, data, and acceptance checks. IDs are in file 11.

## 1. The cabin

### 1.1 Purpose
A place to be during the Quiet, and the one room the player comes to know. It is where the journey accumulates: the shelf fills, the plant grows, the board fills with photographs, the hold empties.

### 1.2 Form
One room, about 3.0 × 2.4 × 2.1 m, behind the cockpit. **The player does not walk.** The camera sits at the pilot's couch at eye height 1.15 m and looks freely: yaw ±115°, pitch −40° to +50°, field of view 62°. Gentle idle sway 0.3° at 0.1 Hz.

Enter: `Cabin` in any state that allows it. A 1.2 s move takes the exterior camera in through the cockpit window. Leave: `Cabin` or `Back`. The parent state keeps running: **cruise continues while the player is in the cabin**; that is the point.

### 1.3 Focus points
Looking within 6° of a focus point for 0.25 s raises a one-word label. `Interact` moves the camera in (0.4 s) to that point's close view. `Back` returns.

| # | Focus point | Close view | Notes |
| --- | --- | --- | --- |
| 1 | **Window** | Leans to the port-side window, 90° field | Shows the true sky from the ship's position: Sun at correct size, planets as points or discs, the destination. Look Home works here. |
| 2 | **Mail slate** | The slate fills 70% of the screen | §2 |
| 3 | **Shelf** | A shelf of ten positions | §6. `Interact` on a keepsake lifts it; stick or mouse turns it; one caption line. |
| 4 | **Seedling tray** | Close on the plant | §9 |
| 5 | **Radio** | A small deck with a dial | Off / Ship / Tapes (file 07 §8). |
| 6 | **Hold monitor** | Six cradle icons and a cargo list | Cradles show empty, ore, core, or proofed core. The most-looked-at object on the way home. |
| 7 | **Chart table** | Opens the system map | Same map as elsewhere. |
| 8 | **Pin board** | Pip's list and the postcards taken | §3 |
| 9 | **Logbook** | Opens the journal | §7 |

### 1.4 Lighting
The cabin is lit by its own warm practical lights (2,900 K) and by the real sunlight through the window. As the Sun shrinks, the window light fades and cools until, past Uranus, the room is lit only by its lamps. This is the player's most constant measure of distance and must not be faked or flattened.

### 1.5 Acceptance
- Entering and leaving the cabin during cruise never changes speed, heading, fuel use or arrival.
- A leg completed entirely from the cabin ends with the approach glide visible through the window and a chime at drop-out.
- With every lamp at default, the window's sunlit patch is visibly different at Mercury, Mars, Jupiter and Neptune (file 07 §3 gives values).

## 2. Mail and light delay

### 2.1 Purpose
To make distance a thing the player waits through, and to keep Hearth present without a live voice.

### 2.2 Rules
1. Nobody speaks live across space. Radio is live only within one site or one orbit. Everything else is a letter.
2. A letter is **sent** at a trigger and **arrives** when light could have carried it: when `t_fic − sent_at ≥ distance(sender's position at sent_at, ship's position now) ÷ c`.
3. c = 120.24 su per fiction second (1 AU = 499 light-seconds).
4. The same rule applies to what the Courier sends.
5. Every letter shows, under the sender's name: **"sent 38 min ago · 4.61 AU"**, updated live while unread and frozen at the moment it is opened.

### 2.3 What that feels like
At 60× (everywhere but cruise) one fiction hour is one real minute. So:

| Player is at | One-way light time from Mars (typical) | Real wait for a reply to something just sent |
| --- | ---: | ---: |
| Mars orbit | 0–3 s | none |
| Europa | 35–50 min | about 1½ min |
| Mercury / Venus / Earth | 5–20 min | under 1 min |
| Titan | 75–90 min | about 3 min |
| Miranda | 2 h 30–2 h 50 | about 5½ min |
| Triton | 4 h 05–4 h 25 | about 9 min |

In cruise (8,640×) delays pass in a second or two and are not felt; cruise is when letters *written days ago* catch up. The gradient across the game is the design: answers are instant near home and take nine real minutes at the edge.

### 2.4 Notification
A two-note chime in the sender's tonal signature; a small envelope glyph in the sender's colour with the "sent … ago" line, shown for 6 s. It never opens by itself and never interrupts. Unread letters wait on the slate. No notifications are shown during authored sequences or hinge actions; they are held and delivered 3 s after control returns.

### 2.5 Reading
In the cabin at the mail slate, or anywhere with `Mail` (hold 0.5 s) as an overlay. Time keeps running. One letter per screen, the sender's name in their hand-style (file 07 §6), body in the reading face. Letters are kept forever and sorted newest first with a per-sender filter.

### 2.6 Replies
About one letter in three offers two or three replies of ≤ 8 words. Choosing one sends it (with light delay). The recipient's next letter contains one sentence keyed to it. A reply is never required; unanswered letters get a neutral variant. Replies never fail a thread.

### 2.7 Volume and schedule
62 letters in the 1.0 script (file 11 §6): 9 from Mara (the spine), 18 from Pip (9 questions, 9 answers to postcards), 16 thread letters, 11 chapter letters from people met, 8 on the way home. No more than three may arrive in any five real minutes; a queue holds the excess.

### 2.8 Data
```json
{
  "id": "mail_mara_06",
  "from": "mara",
  "origin_body": "mars",
  "trigger": { "event": "chapter_complete", "chapter_stage": "ch5_earth:6" },
  "delay_fic_s": 0,
  "text_key": "mail.mara_06.body",
  "replies": [
    { "id": "r_going", "text_key": "mail.mara_06.r_going", "sets": ["reply_mara06_going"] },
    { "id": "r_scared", "text_key": "mail.mara_06.r_scared", "sets": ["reply_mara06_scared"] }
  ],
  "attachments": [],
  "variants": [ { "if": ["choice_complaint == sign"], "text_key": "mail.mara_06.body_signed" } ]
}
```

### 2.9 Acceptance
- A letter triggered at Hearth while the ship is at Triton is not readable until at least 4 h 05 min of fiction time has passed.
- The "sent … ago" figure equals distance in AU × 499 s within 1%.
- Pausing does not advance delivery.
- Loading a save restores every in-flight letter with its original `sent_at`.

## 3. Postcards for Pip

### 3.1 Purpose
To make the player look, on purpose, once per world; to keep one child's voice running through the whole game; and to set up the ending, where the photographs are on a wall and the letters Pip wrote to the people in them are pinned beside them.

### 3.2 Flow
1. On arrival in orbit at each world, a letter from Pip arrives (light-delayed) with one question.
2. The question is pinned on the cabin board and shown, in her handwriting, along the bottom of the viewfinder.
3. The player takes a photograph that satisfies the question's **subject rule** (below). A small pencil tick appears beside the question when the current framing qualifies.
4. `Send` on a qualifying photograph posts it. Pip's reply arrives after the round-trip light time.
5. Only one photograph per question can be sent. Every photograph taken is kept in the album.

Postcards are optional. An unsent postcard leaves a gap on the wall at the end, with the question card still pinned there.

### 3.3 Camera
`Camera` (hold 0.4 s) enters photo mode. Time rate 0.

| Control | Range |
| --- | --- |
| Orbit around the vehicle or seat | Free; radius 2–12 m on the surface, 10–60 m in orbit and flight; fixed eye in the cabin |
| Field of view | 20°–90° |
| Roll | ±30° |
| Exposure | ±2 EV |
| Depth of field | Off / on with focus at the screen centre |
| Hide vehicle | Toggle |
| HUD | None in the image, ever |

Output: PNG at the display resolution into the user's pictures folder under `The Third Ring/`, and a 512 × 288 thumbnail stored with the save.

### 3.4 Subject rule
Each postcard has one rule evaluated at shutter time:

```json
{
  "id": "pc_europa",
  "question_key": "postcard.europa.q",
  "subjects": [
    { "tag": "body_jupiter", "min_screen_fraction": 0.06, "must_be_unoccluded_fraction": 0.5 },
    { "tag": "terrain_horizon", "must_be_on_screen": true }
  ],
  "extras": ["vehicle_skate", "person_any", "station_halden"]
}
```

A subject passes if its tagged bounds project on screen with at least the stated fraction of the frame and at least the stated share unoccluded (tested with nine rays). `extras` are detected the same way and select which of Pip's reply variants is used ("Is that you in the little car?").

### 3.5 The nine questions
| # | World | Pip asks | Qualifying subject |
| --- | --- | --- | --- |
| 1 | Mars | "Take one of home from up high so I can see what you see when you leave." | Hearth commons and solar field together, from the overlook or from orbit |
| 2 | Europa | "Is Jupiter really bigger than the sky?" | Jupiter with the ice horizon |
| 3 | Ceres | "Can you jump over a house there?" | The Mule airborne, or the mass driver's full length |
| 4 | Mercury | "How big is the Sun? Don't look at it." | The Sun on the crater rim with a heliostat |
| 5 | Venus | "Are the clouds yellow or is that just in books?" | The cloud deck below the port |
| 6 | Earth | "Is it true that it's blue? Mum says she misses it." | Earth through a Registry window |
| 7 | Titan | "Does it rain?" | The shoreline of Ligeia Mare |
| 8 | Miranda | "What is the tallest thing you have ever seen?" | Verona Rupes, top and foot in frame |
| 9 | Triton | "Can you still see us?" | The Sun as a star, taken while Look Home is held |

### 3.6 Acceptance
- A qualifying frame shows the tick within 0.2 s; a non-qualifying one never does.
- Sending is impossible without the tick; the reason is never explained in words.
- At homecoming the classroom wall shows exactly the photographs sent, in order, using the stored thumbnails re-rendered as prints.

## 4. Look Home

### 4.1 Behaviour
Hold `Look Home` in any state except authored sequences. The camera eases over 0.6 s to face Mars's true direction. A thin ring, 14 px, marks the spot. One line of text appears beneath it:

> **Hearth · 9.31 AU · 1 h 17 min**

Release: the camera returns over 0.4 s.

| Case | Shown |
| --- | --- |
| Mars resolvable (within 0.6 AU) | Mars as a small disc inside the ring |
| Mars a point | A pale red point, magnitude scaled from distance and phase |
| Mars within 5° of the Sun | No point. Text: **"Home is in the Sun's glare."** then the distance line |
| On a surface, Mars below the horizon | The camera turns to the horizon point beneath which Mars lies; a small downward chevron; text **"Below the horizon"** then the distance line |
| On Mars | The ring settles on the Hearth commons. Text: **"Hearth · here."** |
| At Earth | As normal. (Tomás, if nearby, has a line the first time.) |

### 4.2 Direction on a surface
Each site has latitude, longitude and a rotation model (file 05/06). The direction to Mars is computed from the solar-frame positions and rotated into the site frame. Do not fake it; players will check it against the map.

### 4.3 Use by the game
- Eli's thread counts a **reading** when Look Home is held for 5 s while stationary on a surface or in orbit beyond 5 AU. Three readings at three different bodies complete it.
- The Triton postcard must be taken while Look Home is held.
- The game counts uses silently for the playtest measure in file 01.

### 4.4 Acceptance
- The indicated direction agrees with the map bearing within 1° in the solar frame and within 2° on a surface.
- At Triton on the reference day, Mars is within 5° of the Sun and the glare text shows.

## 5. Threads and windows

### 5.1 Purpose
To let the player's small kindnesses be counted without ever showing a counter, and to make the ending personal.

### 5.2 Rules
- A **thread** is one person's small request that is completed somewhere else. There are sixteen.
- Threads are offered in conversation or by letter. None is announced as a quest. The journal's People page keeps one plain sentence per open thread ("Arman still has Mara's torque driver.").
- A thread cannot be failed. If the moment is missed, the item stays in the hold and the thread can be completed on any later visit, including after the credits.
- Carried thread items appear physically: on the cabin shelf's lower rail or in the hold list.
- Completion is silent: a letter later, at most.

### 5.3 The sixteen
| # | ID | Given by | The ask | Completed when | Lights |
| --- | --- | --- | --- | --- | --- |
| 1 | `th_mara_driver` | Mara, Mars | "If Arman Bekov's still on Ceres, he has my torque driver." | Driver returned to Mara at homecoming | Home 8 |
| 2 | `th_tao_seedling` | Tao, Mars | Give a cutting to someone who will grow it | Cutting given to Kofi at Halden | Home 9 |
| 3 | `th_bea_note` | Bea, Mars | A reply for "whoever packed box 7-441" | Note left at the Meridian freight desk | Home 10 |
| 4 | `th_eli_sky` | Eli, Mars | Three readings of home from beyond 5 AU | Third reading taken | Home 11 |
| 5 | `th_sunniva_core` | Dr Aas, Europa | An ice core for Vigil's spectrometer, "the best one anywhere" | Core handed to Annika at Vigil | Home 12 |
| 6 | `th_kofi_recording` | Kofi, Europa | The sound under the ice, for his mother | Spool given to Rosa at Ligeia Landing | Home 13 |
| 7 | `th_wen_assay` | Wen, Ceres | Have the foundry master check her sample | Sample shown to Yusuf; his verdict mailed | Home 14 |
| 8 | `th_kaito_mirror` | Kaito, Mercury | Put this facet "somewhere properly dark" | Facet set at Emeric's grave on Miranda | Home 15 |
| 9 | `th_yusuf_mark` | Yusuf, Mercury | "Show me one switched on." | A photograph of Vigil's lit reactor hall sent to Yusuf | Home 16 |
| 10 | `th_priya_certificate` | Priya, Venus | "Tell me what it was used for." | Letter to Priya sent from Miranda or Triton | Home 17 |
| 11 | `th_tomas_touch` | Tomás, Earth | He has never touched anything from another world | One keepsake given to him (player's choice of those carried) | Home 18 |
| 12 | `th_rosa_beacons` | Rosa, Titan | Three fog beacons are out | All three relit from the skiff | Home 19 |
| 13 | `th_obi_log` | Capt. Nwosu, Titan | Take the *Marigold*'s log to Vigil: "they should know we tried" | Log given to Annika | Home 20 |
| 14 | `th_emeric_letters` | — (found), Miranda | Emeric's unsent letters | `choice_letters = carry` and a live relay reached | Home 21 |
| 15 | `th_mika_drawing` | Mika, Triton | A drawing for "the girl who asks the questions" | Drawing accepted from Mika in the commons | Home 22 |
| 16 | `th_varga` | — | — | `choice_testimony = for` | Home 23 |

Homes 1–7 and Home 24 (the Courier's) are always lit.

### 5.4 The ring at the end
The Third Ring is an arc of 24 homes. As the rover approaches along the ring road, each home within 60 m switches on if its condition is met: a 1.2 s warm ramp, a soft relay click, staggered by at least 0.5 s. Stopping within 13 m of a home shows a card:

> **Home 13 — the Lindholm family.** Harbour bell from Ligeia Landing, Titan.

or, for a dark home:

> **Home 13 — waiting on fittings.**

The card names the household (file 11 §9), the fitting, and where it came from. It does **not** say "because you…". The player makes that link.

### 5.5 After the credits
Each completed post-game round trip (any world and back to Hearth) lights one dark home whose thread has since been completed, or, if none has, one dark home anyway with the card *"Fitted by the neighbours."* All 24 are lit within at most sixteen trips. No achievement is tied to lighting all of them on the first run.

### 5.6 Acceptance
- No interface element anywhere shows a count of threads or windows before the credits.
- With zero threads complete, eight windows light and the ending plays without any line implying fault.
- With sixteen complete, all 24 light.

## 6. Keepsakes

One small object per world, given at the chapter's end, placed on the cabin shelf in order. Each can be lifted, turned and read.

| # | World | Object | Caption |
| --- | --- | --- | --- |
| 1 | Mars | A worn wheel nut from Nomad | "Mara says every rover has a sound before something goes wrong." |
| 2 | Europa | A sealed vial of meltwater | "Older than anything alive. Dr Aas says not to drink it." |
| 3 | Ceres | An ore chip with a bright fleck | "First cut of the Occator vein. Twelve votes to one." |
| 4 | Mercury | A sprue button from the pour, stamped YD | "The bit you break off. Yusuf keeps all of his." |
| 5 | Venus | Receipt for six cores, Requisition Order 7 | "Signed I. Varga. The paper is very good quality." |
| 6 | Earth | A card with one Registry stamp impression | "Position forty-one. Tomás pressed it twice." |
| 7 | Titan | A rounded ice pebble from the shore | "Worn smooth by a river that isn't water." |
| 8 | Miranda | A brass switch tag: PILE — DO NOT ISOLATE | "E. Vance's handwriting on the back: 'not yet'." |
| 9 | Triton | A paper star | "Mika cut it. There are two hundred and eleven more." |
| 10 | Home | The key to Home 24 | (no caption) |

The keepsake given to Tomás (thread 11) leaves the shelf; its place stays empty, with a faint dust outline, until the ending, where it is found mounted in Home 18.

## 7. The journal

A logbook, not a quest log. Five tabs:

| Tab | Content |
| --- | --- |
| **Log** | One sentence per event, dated by Expedition Day, written in the Courier's plain past tense. The current intention is the top line ("Take the controller to the east field."). Never more than one intention. |
| **People** | Everyone met: name, place, one line. Open threads appear as one sentence with no checkbox. |
| **Cargo** | What is aboard and whose it is. |
| **Postcards** | Questions and the photographs sent. |
| **Sky** | One page per body visited: true distance from the Sun, light-time from Hearth today, the Sun's apparent size as a drawn disc to scale beside Mars's, surface gravity, one true fact. Pages appear only after a visit. |

No percentages, no completion counts, no map of collectibles.

## 8. Tending the Commons

### 8.1 Purpose
To give depot stops a small pleasure, to make the outer dark something the player pushes back by hand, and to pay off on the way home.

### 8.2 The panel
On docking, the camera may move (on `Interact` at the panel prompt) to the depot's control panel seen through the *Kestrel*'s side window: a weathered board with breakers, one valve wheel, one tuning dial, and the beacon-note plate.

Three tasks, none of which can fail:

| Task | Action | Duration |
| --- | --- | ---: |
| **Breakers** | Four breakers; a lamp shows the order; flip each (press at each as the selector moves). A wrong one simply does not latch. | ~15 s |
| **Purge** | Hold the valve open until the gauge needle is in the green band, then release. The band is wide (±20%). Overshoot just vents and settles. | ~20 s |
| **Beacon** | Turn the dial until two tones merge into one and the beacon lamp steadies. | ~20 s |

- **Dark depot:** all three, in that order. Then the pumps run, the beacon turns, the frost on the cradle lights begins to clear, and `lit` is set for good.
- **Lit depot:** tending is optional: one task (chosen by depot ID) for about 20 seconds.

### 8.3 What tending does
- Marks the depot as tended by the player; the map shows it with a small filled dot.
- Lets the player leave a **beacon note**.
- Nothing else. No reward, no counter, no bonus fuel.

### 8.4 Along the story route
| Leg | Depot | State on the way out | On the way home |
| --- | --- | --- | --- |
| Saturn → Uranus | Tern Light | Dark. The player's first restart; one teaching line from the harbour crew's parting letter. | (not on the line home) |
| Uranus → Neptune | Petrel Light | Dark. No guidance. | Lit; flashes its beacon three times as the *Kestrel* passes; the player's own note is read back on the HUD. |
| Neptune → Mars | Albatross Light | Dark, seen on the outer chart as "last heard from: 31 years". Not on any outbound route. | **Lit.** Flashes as the *Kestrel* passes. Its note: *"Lit for the Kestrel. Safe home."* signed **I.V.** (if testimony was for, or silent) or **O.N., Marigold** (if against). |

### 8.5 Beacon notes
Every lit depot carries one three-line note from an earlier traveller, chosen deterministically from a pool of thirty (file 11 §10): practical, tired, funny, kind. *"Valve sticks. Hit it. Not hard." "Passed through with my daughter. She's asleep. Thanks for the light." "If you're reading this in the Drift, turn around, there's nothing past here but me."*

The player composes a note from parts: one of eight openings and one of eight closings. On any later visit their note is the one shown.

### 8.6 Acceptance
- A dark depot restart completes in under 90 s for a first-time player and cannot be failed or left half done in a way that blocks refuelling on return.
- On the reference home leg, Petrel and Albatross each pass within 3,000 su and their flashes are visible from the cabin window.
- If the player never restarted Petrel (rescued past it), it is dark on the way home and only Albatross flashes.

## 9. The seedling

Tao's tray: one dwarf bean. It sits by the cabin window.

| Stage | From Expedition Day | Looks like |
| ---: | ---: | --- |
| 0 | 0 | Soil, a label in Tao's writing: "It's a bean. Don't name it." |
| 1 | 8 | Two seed leaves |
| 2 | 25 | Four true leaves, leaning toward the window |
| 3 | 55 | A vine with a string to climb |
| 4 | 90 | Flowers |
| 5 | 125 | Green pods |
| 6 | 175 | Dry pods, rattling |

- It leans toward the window, and the lean grows weaker as the Sun fades; past Saturn it grows toward the cabin lamp instead.
- **Watering:** available at the tray when the soil is dry (every 20 fiction days). A held `Interact` for 1.5 s. Unwatered for more than 20 days after going dry, it droops; watering restores it within one fiction day. **It cannot die.**
- A cutting can be taken once, at stage 2 or later, for thread 2.
- At homecoming Tao takes the dry pods: *"You brought back more than I sent."*

## 10. Waysides

Optional places met in the Quiet. Each is authored, fixed in the solar frame near a reference leg, takes two to five minutes, and gives a journal line and something to look at. None gives an item needed for anything.

**Ping:** when the ship in cruise will pass within 20,000 su of an undiscovered wayside, a single soft tone and *"Something nearby — hold `Brake` to stop."* for 12 real seconds. Ignoring it is fine; the wayside stays on the map as a small open circle.

| ID | On leg | What it is | What the player does |
| --- | --- | --- | --- |
| `ws_milestone` | Mars → Jupiter, at 3.0 AU | A buoy painted by passing crews for forty years | Hold to add a mark. It is there on every later pass. |
| `ws_hut` | Jupiter → Ceres | A prospector's shelter on a tumbling rock | Dock; read three pages of a logbook that ends mid-sentence, cheerfully |
| `ws_comet` | Ceres → Mercury | A small comet near perihelion (fictional) | Fly through the tail; the cabin window frosts and clears |
| `ws_lighthouse` | Earth → Saturn, near Jupiter's orbit | An unstaffed relay with a guestbook of beacon notes | Read ten notes; leave one |
| `ws_canister` | Earth → Saturn, 7 AU | A lost canister repeating a birthday message for "Rosa" | May carry it to Titan. Rosa: "That's from eleven years ago. He always was late." |
| `ws_chariklo` | Saturn → Uranus, 15.8 AU | Chariklo, a real small body with real rings | Orbit once inside the ring gap. A Sky page. |
| `ws_chorus` | Uranus → Neptune | A patch of space where Vigil's observatory carrier is the only signal | Shut the drive down for sixty seconds and listen |

**Viewpoints:** Jupiter, Saturn, Uranus and Neptune themselves accept orbit capture as viewpoints with no descent. Each has one authored orbit position, one Sky page and one unprompted line from the cabin radio's Ship channel. Saturn's parks the *Kestrel* just above the ring plane.

## 11. How these systems meet

| Moment | Systems in play |
| --- | --- |
| First cruise (Mars → Europa) | Cabin introduced by Mara's first letter; seedling at stage 1; `ws_milestone`; first light-delayed reply |
| Venus | Hold monitor empties in view; receipt goes on the shelf |
| Earth | Tomás thread takes a keepsake away; Look Home with Earth in the foreground |
| Tern Light | First dark restart; the outer chart explains itself |
| Miranda | No mail arrives for the whole chapter unless the player waits five real minutes; the plant grows toward the lamp |
| Triton | Nine-minute answer; Look Home shows only glare; last postcard |
| Way home | Empty hold monitor; depots flashing; letters catching up; the window light returning |
| Home | Windows; wall of postcards; shelf carried to Home 24 |
