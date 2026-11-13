# 11 — Content registry

The single source for names, spellings and IDs. If another file disagrees with this one about a name or an ID, this file is right.

## 1. ID conventions

Lower snake case. A type prefix, then a place or owner, then the thing.

| Prefix | Type | Example |
| --- | --- | --- |
| `body_` | Sun-orbiting body or moon | `body_triton` |
| `site_` | Landable or dockable location | `site_triton_vigil` |
| `ch<n>_` | Chapter | `ch8_triton` |
| two-letter site code + `_` | Stop within a site | `eu_station`, `ti_quay` |
| (bare first name) | Person | `mara`, `tomas`, `varga` |
| `veh_` | Vehicle | `veh_skate` |
| `cargo_` | Hold cargo | `cargo_core` |
| `item_` | Carried thread item | `item_kofi_spool` |
| `ks_` | Keepsake | `ks_venus` |
| `pc_` | Postcard | `pc_titan` |
| `th_` | Thread | `th_obi_log` |
| `choice_` | One of the three choices | `choice_testimony` |
| `mail_` | Letter | `mail_mara_06` |
| `depot_` | Depot | `depot_tern`, `depot_07_12` |
| `ws_` | Wayside | `ws_chariklo` |
| `seq_` | Authored sequence | `seq_ve_requisition` |
| `home_<nn>` | Ring home | `home_24` |

Text keys: `<area>.<owner>.<name>`, for example `ch4.varga.receipt`, `mail.mara_06.body`, `card.home_13`.

## 2. Bodies, sites, chapters

| Body | Site ID | Site name | Chapter ID | Chapter title | Site code |
| --- | --- | --- | --- | --- | --- |
| `body_mars` | `site_mars_hearth` | Hearth | `ch0_mars` | A little more daylight | (prototype IDs kept: `workshop`, `solar`, …; new: `apron`, `ring_gate`, `school`) |
| `body_europa` | `site_europa_halden` | Halden Station | `ch1_europa` | What the ice keeps | `eu` |
| `body_ceres` | `site_ceres_occator` | Occator Cooperative | `ch2_ceres` | The weight of it | `ce` |
| `body_mercury` | `site_mercury_lantern` | Lantern Foundry | `ch3_mercury` | Lantern | `me` |
| `body_venus` | `site_venus_cythera` | Cythera Port | `ch4_venus` | Proof | `ve` |
| `body_earth` | `site_earth_meridian` | The Meridian Registry | `ch5_earth` | Position forty-one | `ea` |
| `body_titan` | `site_titan_ligeia` | Ligeia Landing | `ch6_titan` | Ligeia | `ti` |
| `body_miranda` | `site_miranda_verona` | Verona Works | `ch7_miranda` | Verona | `mi` |
| `body_triton` | `site_triton_vigil` | Vigil Station | `ch8_triton` | Vigil | `tr` |
| — | — | — | `ch9_home_leg` | The long way home | — |
| `body_mars` | `site_mars_hearth` (state `homecoming`) | Hearth | `ch10_homecoming` | The third ring | — |

Other bodies: `body_sun`, `body_jupiter`, `body_saturn`, `body_uranus`, `body_neptune` (viewpoints). The existing depot `ceres` is renamed `depot_ceres_anchorage` in native data and is unrelated to `site_ceres_occator`.

## 3. Vehicles and craft

`veh_kestrel` · `veh_wren` · `veh_nomad` · `veh_skate` · `veh_mule` · `veh_tram_me` · `veh_pod_ve` · `veh_car_ea` · `veh_skiff` · `veh_hopper` · `veh_sledge`. Set pieces: `ship_harrier`, `ship_marigold`, `ship_occator_mule_3`, `probe_linnet`.

## 4. People

Colour is the identifying suit or caption colour. Habits are the only verbal tics a writer may use.

| ID | Name | Colour | Two habits |
| --- | --- | --- | --- |
| `mara` | Mara Vale | `#DC9562` | Understates; ends on an instruction |
| `pip` | Pip Okafor | `#F2C14E` | Asks a second question before the first is answered; reports what "Mum says" |
| `nia` | Nia Okafor | `#D2B1CE` | Speaks in lists; corrects herself kindly |
| `jun` | Jun Park | `#E6B96F` | Measures things aloud; talks about other people's rooms |
| `tao` | Tao Reyes | `#A8C58B` | Talks to plants; gives orders as if they were jokes |
| `bea` | Bea Costa | `#DFAA86` | Quotes manifest numbers; keeps things |
| `eli` | Eli Mercer | `#B7AFD9` | Trails off; asks the player to wait a moment |
| `ren` | Ren Adebayo | `#CFC3A1` | Reassures with numbers; says "uneventful" as praise |
| `ivo`, `leila`, `sana`, `orin`, `ada` | as prototype | as prototype | as their existing lines |
| `sunniva` | Dr Sunniva Aas | `#BFE3F0` | Addresses the ice; never hurries a sentence |
| `kofi` | Kofi Mensah | `#F29E6B` | Self-mocking; counts days |
| `imani` | Imani Quispe | `#E8D36A` | "Let me ask"; names who is absent |
| `arman` | Arman Bekov | `#B9A18C` | Objects first, helps second; mentions Mara without saying her name |
| `wen` | Wen | `#9FD1B5` | "It's fine"; unfinished questions |
| `yusuf` | Yusuf Demir | `#FF8A2A` | Counts his work; short imperatives |
| `kaito` | Kaito Mori | `#E9E9E9` | Describes light; long pauses |
| `priya` | Priya Nair | `#C7B8F0` | Exact figures; explains what a thing is *for* |
| `varga` | Capt. Ines Varga | `#2E4A7A` | Complete sentences; never says "sorry", says what she did |
| `osei` | Ensign Cal Osei | `#6F8FC7` | Says less than he wants to |
| `tomas` | Tomás Ibarra | `#C9A77A` | Bureaucratic euphemism for kindness ("misfiling"); initials everything |
| `agnes` | Agnes Lindqvist | `#A9B4BF` | States the rule, then what she is not allowed to do |
| `rosa` | Rosa Tindall | `#8FE6D2` | Weather first; never asks twice |
| `obi` | Capt. Obi Nwosu | `#D9B48A` | Gives the count of his crew; no excuses |
| `emeric` | Emeric Vance | `#9AA3A8` | Dates everything; "still ready" |
| `annika` | Annika Sørensen | `#FFB45A` | Says "we"; apologises for hoping |
| `davit` | Davit Kalandadze | `#B8C7D9` | Speaks of machines as people; "not for anything" |
| `mika` | Mika | `#F6E38A` | Whispers; statements that are questions |

## 5. Cargo, items, flags

| ID | What | Enters | Leaves |
| --- | --- | --- | --- |
| `cargo_ore` | Ore canister, 12 | ch2 stage 7 | ch3 stage 0 |
| `cargo_core` (unproofed) | Core, 6 | ch3 stage 14 | — |
| `cargo_core` (proofed, set A) | Core, 6 | ch4 stage 7 | ch4 stages 9–14 (requisitioned) |
| `cargo_core` (proofed, set B) | Core, 6 | ch7 stage 11 | ch8 stages 3–8 (given) |
| `cargo_core_last` | The sixth core of set C | ch10 stage 2 (on Nomad) | ch10 stage 3 |
| `item_torque_driver` | Thread 1 | ch2 | ch10 |
| `item_cutting` | Thread 2 | cabin, seedling stage ≥ 2 | ch1 |
| `item_bea_note` | Thread 3 | ch0 | ch5 |
| `item_ice_core` | Thread 5 | ch1 | ch8 |
| `item_kofi_spool` | Thread 6 | ch1 | ch6 |
| `item_wen_sample` | Thread 7 | ch2 | ch3 |
| `item_mirror_facet` | Thread 8 | ch3 | ch7 |
| `item_blank_certificate` | Used in ch7 stage 9; thread 10 is the letter about it | ch4 | ch7 |
| `item_marigold_log` | Thread 13 | ch6 | ch8 |
| `item_emeric_letters` | Thread 14 | ch7 (if carried) | first lit relay after |
| `item_mika_drawing` | Thread 15 | ch8 | ch10 |
| `item_receipt` | Also `ks_venus` | ch4 | — |
| `item_verona_code` | — | ch6 | ch7 stage 1 |
| `item_canister_birthday` | Wayside | `ws_canister` | ch6 |

Flags (booleans, all default false): `has_assay`, `has_outer_chart`, `knows_vigil`, `told_varga_knows` (Titan reply), `harrier_at_vigil`, `drop_tanks_fitted`, `credits_seen`. Upgrades: `tank_aux`, `drive_2`, `drive_3`.

## 6. Mail manifest (62)

Format: ID · sender · sent when · gist. "+R" means it offers replies. Full text exists here only for Mara's nine and Pip's wall letters; the rest are to be written to the gist, within the rules of file 02 §8.

### 6.1 Mara (9) — full text

**`mail_mara_01`** · sent 20 fiction minutes after first cruise begins · +R

> Courier —
> You'll have noticed it's quiet. That's the drive doing its job. Go and sit in the back. There's a window. I put a slate there because you won't answer a radio you can't hear.
> Depots are free. Leave them better than you found them. That's the whole rule.
> The rover's fine. I haven't touched your seat.
> — M.

**`mail_mara_02`** · on leaving Europa

> So she traded. Sunniva always trades. She once got a drill bit off me for a jar of honey and I still think I came out ahead.
> Ceres, then. If a man called Arman Bekov is still alive out there, he has something of mine. Don't make a thing of it.
> Pip has put your picture on the wall. She says Jupiter is "too big on purpose".
> — M.

**`mail_mara_03`** · on leaving Ceres

> Twelve canisters. Jun wanted to know how heavy. I said: heavy enough.
> Arman voted against? Good. Means it was a real vote.
> You're past the easy part of the map now. The Sun gets big from here. Don't look at it, and don't let anyone tell you the foundry's a quick job. Nothing worth switching on is.
> Water your bean.
> — M.

**`mail_mara_04`** · on docking after Mercury

> Yusuf Demir sent a picture before you did. Six of them on a rack, and you beside them looking like you'd made them yourself. I suppose you did.
> Venus is only paperwork. Be polite to the clerk. A stamp is somebody's whole day.
> Jun's taken the covers off the ring's main feed. He says it's to check the seals. It isn't.
> Six. I counted the picture twice. Come home.
> — M.

**`mail_mara_05`** · 30 fiction minutes after the *Harrier* leaves Cythera

> I heard. The port sends a notice. It's very well written.
> I'm not going to tell you it's all right. It isn't. I'm going to tell you that you did nothing wrong and that you still have a ship.
> Go to the Registry. Ask properly. They'll say no. Ask anyway; it goes in a file, and files outlive people.
> Nobody here is angry with you. Jun put the covers back on. That's all.
> — M.

**`mail_mara_06`** · waiting at the Meridian dock after the stacks · +R · variant if complaint signed

> The council met. I'd tell you it was close but it wasn't.
> We know where they went now, and why. Two hundred and twelve. You'll have done the sum already.
> Eleven years of foundations can wait one more. Somebody out there is colder than we are. Go and see.
> I'm not ordering you. I'm not your captain; I'm your mechanic. But if it were me in that seat I'd already be plotting it.
> — M.

*Signed-complaint variant, one sentence inserted after the first paragraph:* "Tomás Ibarra tells me you signed the form. That's your right. Read it again in a month."

**`mail_mara_07`** · on leaving Titan

> At the bottom of a sea. Well. Nobody can say you didn't look.
> I don't know Miranda. Nobody does. If the works won't wake, you turn round, and that will also be a thing you did properly.
> Past Saturn the depots are mostly dark. Don't trust the chart; trust the breakers. Lamp order, then the valve, then the beacon. Leave a note. Someone will be glad of it.
> You'll be a long way from a reply out there. I'll write anyway.
> — M.

**`mail_mara_08`** · sent on receiving the Courier's question at Triton; arrives about 8 h 44 min of fiction time after the first core is lifted

> You asked if it's all right.
> By the time you read this you'll have done whatever you were going to do, so I won't pretend my answer's any use. Here it is anyway.
> I've known you since you could reach the pedals. I have never once seen you do the wrong thing slowly. If you took your time over it, it was right.
> Whatever you decided, come home.
> — M.

**`mail_mara_09`** · on the sill of Home 24 the morning after the credits

> You'll want to sleep for a week. Don't. Tao needs the pods and Pip has forty more questions and I've a rover that's been making a sound.
> I kept your seat.
> — M.

Replies: `mail_mara_01` — "Found the window." / "It's very quiet." · `mail_mara_06` — "Already plotting it." / "I'm frightened." / (no reply). Each adds one sentence to the next letter.

### 6.2 Pip (18)
| ID | When | Gist |
| --- | --- | --- |
| `mail_pip_q1` … `q9` | Given in person (q1) or sent on arrival in orbit at each world | The nine questions (file 04 §3.5), each with two or three lines around it about her day |
| `mail_pip_a1` … `a9` | On receiving each postcard | A reaction with a variant per detected extra, a wrong guess about the place, and one thing happening at Hearth. `a9` (Triton) is the only short one: "I can't see you either. But I know which way. I did the thing with the button." |

### 6.3 Thread letters (16)
One per thread, sent by the person concerned when it completes: `mail_th_<thread>` from Mara, Kofi, the Meridian packer (via Tomás), Eli, Annika (for Dr Aas, who then also writes), Rosa, Wen, Kaito, Yusuf, Priya, Tomás, Rosa (beacons), Nwosu, Emeric's sister Odile Vance, Pip (about Mika's drawing), Varga. Each ≤ 80 words. None says thank you in those words.

### 6.4 Chapter letters (11)
| ID | From | When | Gist |
| --- | --- | --- | --- |
| `mail_ch1_kofi` | Kofi | Mid-leg to Ceres | The bean cutting has a new leaf; day count |
| `mail_ch2_wen` | Wen | Mid-leg to Mercury | Pretending not to care about the sample |
| `mail_ch3_kaito` | Kaito | Leaving Mercury | What the mirrors look like from below |
| `mail_ch4_notice` | Compact Patrol (form letter, Varga's initials) | With the receipt | Requisition Order 7, formal |
| `mail_ch4_priya` | Priya | Leg to Earth | She has checked: the receipt is valid; she is sorry that it is |
| `mail_ch5_denial` | Agnes | After the appeal | The formal denial; one handwritten line under the signature |
| `mail_ch5_jun` | Jun | At Earth, after Mara's | "The frames are fine. Frames keep." |
| `mail_ch5_tomas` | Tomás | Ten real minutes without a plot | The nudge (file 06) |
| `mail_ch6_harbour` | Ligeia harbour crew | Leaving Titan | How to wake a dark depot; a joke about methane |
| `mail_ch6_obi` | Nwosu | Leg to Uranus | His crew's names, all nine |
| `mail_ch8_davit` | Davit | Leaving Triton | The old core is on a plinth |

### 6.5 The way home (8)
| ID | From | Leg fraction | Gist |
| --- | --- | ---: | --- |
| `mail_h_annika` | Annika | 0.04 | Four lines; "we" |
| `mail_h_rosa` | Rosa | 0.12 | Weather; a ship left for the inner system and she will not say whose |
| `mail_h_imani` | Imani | 0.40 | "Arman's borrowed the Mule." |
| `mail_h_yusuf` | Yusuf | 0.57 | Busy month |
| `mail_h_sunniva` | Dr Aas | 0.63 | A water filter has gone missing from her stores; she knows where |
| `mail_h_priya` | Priya | 0.74 | Fastest stamp |
| `mail_h_tomas` | Tomás | 0.85 | Position forty-one |
| `mail_h_pip` | Pip | 0.98 | DON'T LOOK AT THE RING |

## 7. Pip's letters on the wall (9) — full text

Shown beside each postcard at homecoming. Child's spelling is kept light: one or two slips each, no more.

1. **Beside the Mars postcard** (to the Courier, never sent): "I didnt send this one. It is for when you get back. This is what it looked like when you left. I counted the windows. 43."
2. **Europa — to Dr Aas:** "Dear Doctor of the Ice. My friend took your picture. My friend gave away our cores to people who are cold. Do you have anything for a house. It does not have to be big."
3. **Ceres — to the Cooperative:** "My friend gave away our cores to people who were cold. Do you have any more of the rocks? I can pay 4 and a bit. Mum says you vote. Please can you vote."
4. **Mercury — to Yusuf:** "Dear Mr Demir. You made six and they are at the bottom of a sea now, sorry. Can you make six more if someone brings rocks. I am asking the rock people as well."
5. **Venus — to Priya:** "Dear Stamp Lady. If some cores come can you stamp them fast. Not badly. Just fast."
6. **Earth — to Tomás:** "Dear Mr Ibarra. Mara says you have a list and we are number 41. I am not asking to be number 1. I am asking what number is fair now."
7. **Titan — to Rosa:** "Dear Harbour. Is there a ship that is going this way. It does not need to be a nice one."
8. **Miranda — to nobody:** "To whoever is at the tall cliff. Mum says no one is. I am writing anyway in case. Thank you for keeping it ready."
9. **Triton — to Mika:** "Dear Mika. I got your drawing. I am glad you are warm. We have room. This is a picture of the room."

## 8. Postcards, threads, keepsakes

Defined in file 04 §3.5, §5.3 and §6. IDs: `pc_mars`, `pc_europa`, `pc_ceres`, `pc_mercury`, `pc_venus`, `pc_earth`, `pc_titan`, `pc_miranda`, `pc_triton`; `ks_mars` … `ks_triton`, `ks_home`; thread IDs as listed there.

## 9. The twenty-four homes

| Home | Household | Lit by | Fitting shown on the card |
| ---: | --- | --- | --- |
| 1 | The Reyes family (Tao's brother, three boys) | always | — |
| 2 | Sana Idris and her father | always | — |
| 3 | The Hale-Noor household | always | — |
| 4 | Four of Hearth's first-born, now grown | always | — |
| 5 | Kept for whoever turns up. Tonight: the crew of the *Occator Mule 3* | always | — |
| 6 | The Costa family | always | — |
| 7 | Jun Park | always | — |
| 8 | The Sen family | `th_mara_driver` | Workbench built with a thirty-year-old torque driver |
| 9 | The Abara family, from Earth | `th_tao_seedling` | Bean plants from the *Kestrel*'s tray |
| 10 | The Mercer-Sol household | `th_bea_note` | A box of seals, and a second note, from Meridian freight |
| 11 | Eli Mercer's parents, from Earth | `th_eli_sky` | A framed plot: three readings of home |
| 12 | The Okonkwo family | `th_sunniva_core` | Water filter from Halden Station, Europa |
| 13 | The Lindholm family | `th_kofi_recording` | Harbour bell from Ligeia Landing, Titan |
| 14 | Two apprentices from the print yard | `th_wen_assay` | Door handles cast from the Occator vein, Ceres |
| 15 | The Adebayo family | `th_kaito_mirror` | A heliostat facet, hung as a mirror, from Lantern Foundry |
| 16 | The Park cousins | `th_yusuf_mark` | A stove stamped YD, Mercury |
| 17 | Nia's sister's family, from Earth | `th_priya_certificate` | A proofed nameplate from Cythera Port, Venus |
| 18 | The Vale household (Mara's nephew) | `th_tomas_touch` | The keepsake given to Tomás, returned, mounted, with a Registry stamp |
| 19 | The Idris cousins | `th_rosa_beacons` | A fog lamp from Ligeia Landing |
| 20 | The Costa grandparents, from Earth | `th_obi_log` | The *Marigold*'s galley table |
| 21 | Odile Vance, from Earth | `th_emeric_letters` | A photograph of a man at a gate on Miranda |
| 22 | The Okafor family: Nia and Pip | `th_mika_drawing` | Paper stars in the window |
| 23 | Kept by the Patrol for crews in transit | `th_varga` | The *Harrier*'s spare running light, as a porch lamp |
| 24 | The Courier | always | A shelf |

Dark-home card: "Home *n* — waiting on fittings." Post-game neighbour card: "Home *n* — fitted by the neighbours."

## 10. Beacon notes (pool of 30)

Assigned to lit depots by `hash(depot_id) mod 30`. Three short lines at most.

1. Valve sticks. Hit it. Not hard.
2. Passed through with my daughter. She's asleep. Thanks for the light.
3. If you're reading this in the Drift, turn round. Nothing past here but me.
4. Left a spare gasket in the red box. Take it if you need it.
5. Forty-one days out. Talked to this pump for an hour. It's a good listener.
6. Whoever fixed the beacon: I saw it from two AU. I cried a bit. Don't tell anyone.
7. Breaker three lies. Trust four.
8. Happy birthday to me. Fifty today. Had the good tea.
9. Don't believe the gauge. Believe the sound.
10. For the next one through: it gets better after Saturn. No it doesn't. But you do.
11. Left it cleaner than I found it. You're welcome. Do the same.
12. I was here. So were you, now. That's two of us.
13. The cradle light flickers. It's not a ghost. I checked.
14. Running late for a wedding on Ceres. If you see them, I'm coming.
15. Took nothing. Fixed the latch. Sang to it.
16. Nine crew, one working toilet. Pray for us.
17. First time out this far. Is it always this quiet? Don't answer.
18. My mother kept this depot for thirty years. Be kind to it.
19. Purge twice. Once is never enough.
20. Tell Hygiea Exchange they still owe me a coffee.
21. Engine's making a sound. Probably fine. Writing this just in case.
22. You're doing all right. Whoever you are.
23. Saw the rings from the dark side. Worth the whole trip.
24. Borrowed a wrench in year twelve. Returning it now. Sorry.
25. Mind the frost on the wheel. Took the skin off my glove.
26. Three weeks without a voice. Then this note. Thank you, stranger.
27. If the beacon's dark, it isn't broken. It's waiting.
28. Kept the light on for you.
29. Home is behind you and to the left. Roughly.
30. Leave a note. It matters more than you'd think.

Player note parts — openings: "Passed through." / "Lit this one." / "Going out." / "Going home." / "From Hearth." / "For whoever's next." / "It's quiet here." / "Still going." — closings: "Safe home." / "Mind the valve." / "Leave it better." / "You're not alone." / "Keep the light on." / "Water your plants." / "It's worth it." / "— Kestrel."

## 11. Registry change rule

Adding, renaming or removing any ID is a design change: it is proposed in a work-package report and applied here first, then in data. IDs are never reused for a different thing.
