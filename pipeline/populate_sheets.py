"""
populate_sheets.py — Run this ONCE to populate World_Info and Characters tabs
from the official character profiles for The Concord of Nine — Book 1: The Dragon's Last Breath.

Run: python populate_sheets.py
"""

import config
import google_clients


def main():
    sheets = google_clients.get_sheets_service()

    # ── WORLD INFO ────────────────────────────────────────────────────────────

    world_info = [
        ["Key", "Value", "Notes"],
        ["title", "The Concord of Nine — Book 1: The Dragon's Last Breath", "Series and book title"],
        ["setting", "A medieval-adjacent world of kingdoms, mountain ranges, ancient sanctums and deep dwarven holds. Story begins at Thornwick (village destroyed by dragonfire, now glass-transformed obsidian crater), moves through the Emberpeaks mountain range, the First Sanctum, the Undervault (ancient dwarf-warded deep hall), the Ironwood forest region, and toward Depthspire (prison-mountain, final Book 1 destination). Capital of Caelin's homeland: Emberhall, volcanic capital of the Emberkin Dominion.", "Physical world"],
        ["tone", "Epic fantasy with grounded, human stakes. Dark but purposeful — characters carry real grief, doubt, and guilt alongside hope and determination. Dry humour surfaces under pressure, especially from Vex. Prose should be vivid and specific: sensory detail, weight of objects, how pain actually feels. Third-person limited, close POV (usually Caelin). Short paragraphs for action and tension, longer for introspection.", "Narrative tone and style"],
        ["lore", "The First Concord was an ancient alliance between dragons and dwarves who forged Nine Relics — one for each school of magic — to maintain the balance of power and keep a dangerous entity (the Tenth, also called the Seal) sealed beneath Depthspire. Each relic bonds to a specific bearer. Vharisax was the last guardian dragon, now dead, who passed the Dragon's Ember (Evocation relic) to Caelin. The other eight bearers must be found and their relics claimed. The Nine relic bearers working together are the mechanism for keeping the Seal contained.", "Core lore and world history"],
        ["the_seal", "Something ancient and immensely dangerous is sealed beneath Depthspire. The Concord's wards are failing — hairline fractures, not collapse yet. Older seals beneath still hold. At the absolute base, something that has been still for a very long time makes a sound. It is patient as geology. It counts heartbeats. The Nine Relics and their bearers exist to keep it contained. The Ninefold Concord rhyme: 'Nine the arts and nine the lights, / Nine the souls to set them right; / Keep the chain and guard the frame — / Wake not the Tenth that has no name.'", "Central threat / primary antagonist"],
        ["rules", "Dragon's Ember scale (hex-plate in Caelin's RIGHT forearm): pulses white-hot sting for lies/evasion, silver shimmer for magic nearby, black-violet for corruption/shadow-thralls, gold for wards/divine magic, prismatic for relic proximity. Cannot be hidden — cloth smolders, metal burns. Dragonfire transforms matter (softens/reshapes) rather than consuming. Each dragonfire use costs escalating pain — vision narrows, filaments burn like hooks, scale throbs red. Elowen can ease pain temporarily but effect fades faster each time. Flame-path visible only to Caelin. Draconic is a real language Caelin can read instinctively.", "World rules and magic system"],
        ["shadow_thralls", "Corrupted creatures serving whatever wakes beneath the Seal. Attack in groups. Scale goes black-violet on approach. Destroyed by the Ember's red-gold plasma. Becoming more organised — scouts, forward elements, coordinated ambushes. Shadow-scouts are smaller and faster than combat thralls. Durgan's shadow condition is related to but distinct from shadow-thrall corruption.", "Antagonist forces"],
        ["the_nine_relics", "Dragon's Ember (Caelin — Evocation/fire, claimed Ch5). Eight others yet to be found and claimed. Each bonds to a bearer with specific magical affinity. Relics were forged in the First Concord by dragons and dwarves working together. Thornik's grandfather's journal contains partial blueprints.", "MacGuffin structure — the quest"],
        ["locations", "Thornwick: destroyed village, glass-obsidian crater where Vharisax died. Emberpeaks: mountain range containing First Sanctum. First Sanctum: dragon-built sanctum, draconic inscriptions, site of Dragon's Ember claim. Undervault: ancient dwarf-warded deep hall, nine resonance-sink pillars, acoustic properties. Deepstone Hold: Thornik's home, subterranean forge-citadel. Emberhall: Caelin's homeland capital (volcanic). Marrowsend/Nightfall's Reach: where Vex grew up. Ironwood: forest region, Aldric contact. Depthspire: prison-mountain, Book 1 destination, something sealed at the base.", "Key locations"],
        ["themes", "The cost of being chosen vs choosing. Doubt as companion to faith, not its enemy. Found family forming under pressure and crisis rather than comfort. The weight of carrying something you didn't ask for. Guilt and its relationship to action. Trust built through demonstrated reliability. Power always has a price.", "Core themes"],
        ["writing_style", "Third-person limited, close POV (usually Caelin). Scale reactions (warmth, sting, glow colour) used as emotional beats and pacing tools, not just exposition. Dialogue is character-distinctive — each character has a specific voice pattern. Every act should end on a moment of movement (physical or emotional), not a summary. Sensory and specific prose: smells, textures, weight of objects, quality of light. Dry humour surfaces in dark moments. Do not resolve tension before it has earned resolution.", "Style guide for generation"],
    ]

    # ── CHARACTERS ────────────────────────────────────────────────────────────

    characters = [
        ["Name", "Role", "Physical Description", "Personality", "Backstory", "Relationships", "Voice Style", "Status"],

        [
            "Caelin Thorne",
            "Protagonist / Dragon's Ember bearer / Fire sorcerer",
            "Mid-20s (25-27). Tall, lean sorcerer's build — athletic from travel, not warrior bulk. Auburn hair (red-brown, naturally windswept). Ember-flecked hazel eyes (warm brown with orange/gold motes). Fair skin, weathered from exile and travel. Faint draconic scale-tattoos on neck (pre-existing bloodline marks, separate from the embedded scale). Dragon's Ember: thumb-sized hex-edged plate of translucent obsidian embedded in RIGHT forearm, ember-motes drifting inside, hair-fine black filaments spreading toward elbow and wrist — CANNOT be hidden (cloth scorches, leather/metal burns). Wears charred-red duster lined with glowing runes. Small stud earring, left ear. Dragon-hilt knife at belt (childhood origin unknown). Habitually tugs sleeve over scale despite knowing it won't work.",
            "Guilt-driven and reluctant. Never wanted this burden and hasn't stopped second-guessing the cost to others. Protective instinct is bone-deep — saves Mira without calculation. The scale punishes every evasion, which has forced brutal honesty he didn't entirely choose. Introspective, constantly questioning his choices and identity. Fears leading companions to their deaths, fears becoming the destructive force his family accused him of being, fears the scale consuming who he is. Rarely uses contractions when serious (noble upbringing habit). Looks away when receiving gratitude. Touches forehead when Draconic translations surface.",
            "Born in Emberhall, volcanic capital of the Emberkin Dominion, to Lord Aranth Thorne (dragon-blood sorcerer lineage) and Lady Miravelle Thorne. Twin sister Lyralei (ice sorcerer, whereabouts unknown). Exiled in late teens/early 20s when visions of the Concord of Nine were deemed heretical by the family council — stripped of titles, cast out. Spent wandering years studying lost tomes, mastering outlawed flame rites, learning fragments of Draconic (dreams carried sounds not his own). Arrived at Thornwick by chance or fate. Saved Mira from collapsed cottage — his fire softened wood to translucent glass for the first time. Found dying Vharisax in the crater. Scale bonded to right forearm. Fever for three days as scale integrated. Vex kept him alive.",
            "Closest to Vex — she kept him alive through the fever, her loyalty has become something he can't categorise. Respects Serana deeply even when they disagree on method. Thornik's relentless optimism breaks his guilt spirals in ways he needs. Elowen's ability to ease his pain makes him quietly protective of her. Chose to keep Durgan visible rather than distant — a decision he monitors carefully. Nyxara unsettles him slightly. Saw Mira's face in every decision since Thornwick.",
            "Terse under pressure, more expansive when immediate danger passes. Leads with observation before conclusion. Understatement as deflection: 'it's what I have' means 'I'm terrified.' Direct and honest under stress because the scale enforces it. Formal cadence from noble upbringing loosens as trust builds. Self-deprecating when praised. Questions himself aloud: 'If I do this, what does it make me?'",
            "active"
        ],

        [
            "Virella 'Vex' Sunshadow",
            "Deuteragonist / Rogue / Relic hunter / Half-elf",
            "Mid-20s (24-26). 5'6\", lithe and acrobatic — lean muscle, dancer's grace. Silver-streaked raven black hair, undercut (shaved right side, longer left). Mismatched eyes: left green, right gold — impossible to forget. Dusky olive skin. Pointed ears (half-elf, usually visible). Sharp cheekbones, slightly upturned nose, expressive eyebrows frequently arched in skepticism. Nick scar on right eyebrow. Faint burn marks on fingertips and palms (relic-hunting accidents). Shadow-leather armor, black with dark grey accents. Three belts concealing weapons and tools. Soft-soled boots for silent movement, hidden blade sheaths in both. Fingerless gloves. Simple black cord necklace (mother's only remaining possession). Checks daggers from habit the way others check their breathing.",
            "Sharp, practical, and armored in sarcasm. Skeptical by profession and training — trust is a calculated risk, never a default. Not unkind, but unkindness is the first tool she reaches for under uncertainty. Calculates sight lines and exit routes reflexively. Hates not knowing things and masks it with pre-emptive dismissal. Loyalty once given is absolute and expressed through action, never words. Stayed with Caelin through his fever framing it as 'investment protection' — three days forcing water down his throat. Hates being called Virella.",
            "Born in Nightfall's Reach, shadow-veiled slums of Marrowsend City. Mother Helena Sunshadow: renowned artifact curator whose research notes referenced 'fire-kept covenants,' 'old alliances,' and 'Nine that bind the Tenth' — the notes stop mid-sentence. Helena died on expedition (official story: structural collapse; Vex suspects otherwise). Father never mentioned. Orphaned at 13-15, adopted by street gang, trained in lockpicking, pickpocketing, escape routing. Left gang at 18, established reputation as independent artifact retriever specialising in forbidden relics. Helena's coded research notes pointed to Thornwick — that's why Vex was there. Finding what happened to her mother and why the notes stop is her real mission.",
            "Closest to Caelin — has seen him at his most broken and chose to stay. Protective in a way she'd never name. Challenges him consistently, which he needs. Specific verbal sparring dynamic with Nyxara — evenly matched, neither wins. Read Durgan correctly from the start: doesn't fully trust but respects his honesty about what he is. Treats Thornik like an annoying but valued sibling — mocks his inventions, grins when they explode anyway. Her relationship with Serana is respectful but careful.",
            "Quick, clipped when tense; drawling mockery when relaxed. Drops articles and shortens words when emotional (street cant habit). 'That's a terrible plan. I'm in.' 'I've had worse odds.' 'Don't waste my effort.' 'Terrible plan' is affection. 'I've followed worse' is high praise. Doesn't explain herself unless pushed. Uses humour as distance management. Never says what something means to her directly.",
            "active"
        ],

        [
            "Thornik Bramblebrew",
            "Artificer / Engineer / Dwarf / Axis-first combatant",
            "50s-60s (dwarven prime, vitality equivalent to human 30s-40s). 4'2\", barrel-chested, powerful arms from forge work. Wild copper-red hair, untamed. Long copper beard braided with gear-charms that clink with every movement. Bright amber eyes, constantly analysing. Ruddy skin perpetually oil-smudged. Burn scar on right forearm. Missing left pinky tip. Goggles on forehead (multi-lens, magnification, heat-vision, magical detector — snap down with mechanical snick when examining). Scorched leather apron, pockets overflowing with springs, screws, crystals. Tool-belt bristling with wrenches, pliers, hammers. Steel-toed reinforced boots. Massive clanking pack (brass contraptions, mysterious devices). Twin hand-axes (dwarf-forged, clan symbols engraved, never dull) strapped to back. Bandolier of devices across chest.",
            "Boisterous optimist who coexists with deep well-worn grief. Compulsive tinkerer — hands never idle, adjusts gadgets mid-conversation. Enthusiastic pessimist: predicts disaster cheerfully then proceeds anyway. Fiercely loyal, recklessly so. Guilt-driven by the Wyrmspire catastrophe (overcompensates with safety protocols that he then ignores in the heat of the moment). Childlike wonder when discoveries materialise. Slaps malfunctioning devices — surprisingly effective. Victory grin after explosions work as intended. Beard-stroking when thinking (gear-charms jingle). AXES FIRST in combat, gadgets as support only.",
            "Born in Deepstone Hold, subterranean forge-citadel of the Emberpeak Mountains. Youngest of five siblings. Father Bromli Bramblebrew: Master Artificer, stern and brilliant, never forgave the Wyrmspire disaster. Mother Lisella: hearthkeeper, died when Thornik was 40. In his 30s, contributed to the Wyrmspire Titan Engine — a magical feedback loop during activation collapsed half of Deepstone Hold, killed hundreds including two siblings. Self-imposed exile to perfect inventions safely and prevent repeat. Grandfather (name TBD) died chasing dragon-forge legends in the Emberpeaks, branded a fool — wrote final journal entries in blood about 'Pedestals of the Nine,' 'songs in sealed halls,' 'prices paid in flame.' Thornik carries the journal always. Three nights before Thornwick every sensor in Deepstone Hold went mad simultaneously, all pointing to Thornwick. He followed.",
            "Deeply fond of Caelin — Caelin's existence proves grandfather right, and Thornik's optimism breaks Caelin's guilt spirals. Positions shield gadgets specifically to protect Caelin. His friendship with Serana is built on shared conversations about doubt — his philosophical, hers theological. Fascinated by Elowen's nature magic (how does it interact with arcane tech?). Quietly devastated by her loss in Ch7. His devices scream near Durgan's shadow — he is wary but pragmatic. Cautiously curious about Nyxara (shadow magic + tech = intriguing), embarrassed by her flirting.",
            "Booming baritone with hearty laughter. Excited rambling: technical jargon rapid-fire when explaining. Self-interrupts — starts a sentence, gets distracted by an idea, never finishes the original. Laugh-punctuation after grim observations. 'By my beard!' 'Saints of lost hinges!' 'Brilliant!' Refers to his devices with specific personality. 'Usually wrong but not about this.' Makes terrible tea that everyone drinks anyway. 'Fifty-fifty odds' is his standard risk assessment.",
            "active"
        ],

        [
            "Serana Valeblade",
            "Paladin / Silver Dawn cleric / Battle-healer",
            "Road-worn armor that was once white and gold, now sun-bleached and patinated — not neglect but months in the saddle with no time for appearances. Old injuries poorly healed, the kind that never quite stop aching. Carries herself with the practiced ease of someone who announces themselves in halls of power. Her palm glows soft silver-gold when her faith engages — the light has been unreliable since encountering the scale. Silver Dawn symbol at her throat (her hand returns to it habitually even when the light doesn't answer).",
            "Formally trained in faith and battle in equal measure. Her doubt is not a crisis of belief but a recalibration — the forked voice (Shield the bearer / Offer the bearer) is a genuine theological problem she approaches with analytical rigour. Draws secular wards (geometry, not prayer) when the divine doesn't answer, calling it pragmatism rather than loss of faith. Sets marching orders, establishes rules, holds the group to standard. When genuinely afraid she goes very quiet. Doubt surfaces as precision and dry observation rather than despair.",
            "Came to Thornwick looking for Elder Gareth. Her divine light synchronized with Caelin's scale during the Thornwick shadow-thrall fight — a moment she didn't expect and hasn't stopped thinking about. Years of service before this quest, suggested by the patina of her armor and the quality of her old injuries. The Silver Dawn's forked voice is a new phenomenon — before Thornwick, her faith was straightforward.",
            "Respects Caelin and follows his lead while disagreeing with specific choices openly. Friendship with Thornik built on conversations about doubt as changed input rather than lost faith. Elowen's nature magic recognizes her divine light across the space of faith and nature — mutual recognition without full understanding. Watches Durgan carefully. Reaching for chalk to refresh wards before he finishes asking: her instinct to protect expresses through action.",
            "Formal cadence that loosens under pressure and at the fire. States things as questions when she's actually giving instructions. Dry wit surfaces in unlikely moments: 'If the gods meant us for this, they'd have given us thicker lungs.' When she's genuinely afraid she goes very quiet. States her doubt precisely rather than dramatically.",
            "active"
        ],

        [
            "Elowen Greenbloom",
            "Druid / Last of the Sylvaran Grove circle",
            "Cloak the colour of lichen — grey-green, alive-looking. Circlet of vine that blooms with each breath. Moss-ink tattoos curl down her arms, pulsing faintly with life magic; they darken and dim visibly as she uses her power to ease Caelin's pain — the cost made physical and visible. Brown eyes, clear, full of grief so steady it has settled into patience. Reads by touch and presence as much as sight.",
            "Carries grief the way a root carries weight — distributed, long-practised, not dramatic. Accepted terrible truths and continues anyway, which is different from being at peace with them. Has been easing Caelin's pain at cost to herself and has never mentioned the cost directly. Her magic answers nature — spring rain, turned earth, growing things, the opposite of the rot-corruption spreading from the sanctum. Asks permission before touching. States observations that carry more weight than their delivery suggests.",
            "Last of a broken circle — the circles broke when the balance did, most druids walk alone now. Drawn to the group by the forest's pain (the corruption spreading from the sanctum direction), not by Caelin's quest. Has been walking toward this for a very long time knowing it would hurt and going anyway. The vine-marks on her arms are the visible record of what she has given. Fell into step without asking permission or offering more explanation than she'd already given. Status at end of Book 1: presumed lost in sanctum collapse (Ch7) — epilogue suggests she may have survived via deep root network.",
            "Her relationship with Caelin is specific: she eases his pain, he is protective of her in a way he tries not to show. Quiet friendship with Thornik — they share doubt as a practice. Her night conversation with Durgan (she told him about shadow, he didn't respond) is significant — she reads him more accurately than most. Elowen and Nyxara's night watch exchange: 'decide who you are when the Weave doesn't answer.'",
            "Spare and precise. No preamble. 'The forest screams' as an opening. Asks permission before touching. States observations once and doesn't repeat them. 'I'm running out' said once, quietly, never again. When she says something it lands with full weight because she doesn't use words to fill space.",
            "active"
        ],

        [
            "Durgan Nightcloak",
            "Shadow-walker / Former imperial soldier",
            "Appears at the fire with no sound of arrival or departure — nobody hears him come or go. His shadow moves independently: stretches sideways from the light, crosses toward things with its own apparent will. Crescent bruises on his body where the shadow recoils against ward-light. Nosebleeds when the shadow tests its limits, drying black. Physical description otherwise unspecified — he is defined by what he does rather than how he looks.",
            "Economical to the point of near-absence. Makes the daily choice not to let the shadow win — this is his internal practice, maintained continuously. When the shadow moves before he stops it, his face shows the arithmetic of a man getting an answer he doesn't like. 'Minutes between episodes now. Hours before. Days once.' Does not ask for help. Will not turn away from an offered hand. His truth to the Boundary Bridge: 'I will not hurt them. Not while I am me' — acknowledging what is coming without surrendering to it.",
            "Former soldier of an empire that fell — three words that are his whole introduction. Something happened to give him the shadow condition. The shadow moves independently, has apparent will, and is getting harder to control with time. He arrived at the fire one night with no sound, vanished the same way, walked back in at dawn and offered his name. Caelin chose to keep him visible rather than wonder where he'd gone.",
            "Vex read him correctly from the start and has never fully trusted him, which he seems to consider fair. Elowen's night conversation with him is the closest he comes to being known by someone. Caelin's decision to keep him visible rather than distant is the arrangement he has honoured. Thornik's devices scream near his shadow — Thornik is wary, positions gadgets between Durgan and vulnerable party members.",
            "Minimal. 'Soldier. Empire fell.' is his entire introduction. Answers direct questions with minimum required words. His silence is not hostility — it is the economy of someone who learned that words cost and spent too many already. When he speaks at length it matters. The nosebleed detail is always understated.",
            "active"
        ],

        [
            "Nyxara Veilthorn",
            "Warlock / Bound to unnamed patron",
            "Arrives with theatrical precision at the sanctum pillars. Sleeves pulled down over darkening fingertips — the accumulating cost of the patron's power is visible if you look for it. Everything else about her presentation is deliberate: the theatrical timing, the controlled reveal, the information given sideways.",
            "Deliberately vague about her patron — 'old bargain' is all she offers. Watches everything and catalogues it. Teaches Caelin to balance heat and cold simultaneously as foundation for air-shaping — suggesting she knows more than she's volunteered. 'Clever' is her highest compliment. Does not sleep. Uses theatrical delivery as misdirection — what she says directly is usually less important than what she omits.",
            "A warlock with bound talent and an old bargain. The patron is not named. Thornik's device clicked its 'uncharted magic' pattern on meeting her, identified her as warlock. She arrived at the sanctum pillars with theatrical precision — timed, not accidental. The darkening fingertips suggest the patron's cost is accumulating and has been for some time.",
            "Specific verbal sparring dynamic with Vex — evenly matched, neither wins cleanly. Watches Caelin's practice casts with the focused assessment of someone who knows exactly what they're seeing. Teaches him the heat/cold balance exercise, calls the result 'Clever.' Her night watch with Elowen produces the exchange: 'decide who you are when the Weave doesn't answer.'",
            "Measured, precise, occasionally sharp. Delivers information sideways. Theatrical about herself in ways that reveal nothing. 'Full of surprises' as self-description. Uses precision as a kind of armour — the words are exact but they don't point where you expect.",
            "active"
        ],

        [
            "Vharisax",
            "Dragon / Last Concord guardian / Deceased",
            "Vast beyond mortal scale — easily the size of a barn. Hide dulled from coal-red to ash-crimson at death, fissured along flanks where internal heat still glowed like forge embers struggling against dark. Wings crumpled and torn, one bent at an angle that makes you wince. Eyes old gold, ancient as mountains, still holding purpose even at the end. After death: completely gone from the crater, leaving only a perfect dragon-shaped shadow scorched into the obsidian glass floor.",
            "Carried genuine regret for what her search cost Thornwick — not defensive about it, just weary fact. Ancient, patient, and precise. Spoke not as sound but as meaning pressing directly into Caelin's mind — old Draconic rendered crystalline and clear. Chose Caelin because he proved himself by saving Mira: turning fire back to wood rather than letting it burn.",
            "Last guardian of the First Concord. Felt the rot in her heart three days before she died. Searched nearby villages in her remaining time, called out in the old tongue, used fire to test who might answer — only ember-born could have shaped what she wrought. Passed the Dragon's Ember to Caelin in the crater. Burned to ember-motes that descended onto the scale; left a ghost outline in glass where she lay. The ember-motes in Caelin's scale may contain what's left of her.",
            "Passed everything to Caelin. The crater is where Caelin returns on the third day to say thank you to empty air. The scale's ember-motes drifted faster when he crouched at her outline's edge.",
            "Speaks only in direct sense-meaning — no sound, just meaning pressing into the mind. Ancient, precise, heavy with genuine regret. 'I had no choice' without defensiveness. 'At last. The bloodline answers.' Every word carries the weight of ten thousand years.",
            "deceased"
        ],
    ]

    # ── Write to Sheets ───────────────────────────────────────────────────────

    print("Clearing and writing World_Info tab...")
    sheets.spreadsheets().values().clear(
        spreadsheetId=config.GOOGLE_SHEET_ID,
        range="World_Info!A1:Z1000",
    ).execute()
    sheets.spreadsheets().values().update(
        spreadsheetId=config.GOOGLE_SHEET_ID,
        range="World_Info!A1",
        valueInputOption="USER_ENTERED",
        body={"values": world_info},
    ).execute()
    print(f"  ✅ Written {len(world_info) - 1} world info rows")

    print("Clearing and writing Characters tab...")
    sheets.spreadsheets().values().clear(
        spreadsheetId=config.GOOGLE_SHEET_ID,
        range="Characters!A1:Z1000",
    ).execute()
    sheets.spreadsheets().values().update(
        spreadsheetId=config.GOOGLE_SHEET_ID,
        range="Characters!A1",
        valueInputOption="USER_ENTERED",
        body={"values": characters},
    ).execute()
    print(f"  ✅ Written {len(characters) - 1} character rows")

    print("\n✅ Done! Google Sheet is now fully populated with:")
    print(f"   - {len(world_info) - 1} world info entries (setting, tone, lore, rules, locations, themes, style)")
    print(f"   - {len(characters) - 1} characters (Caelin, Vex, Thornik, Serana, Elowen, Durgan, Nyxara, Vharisax)")
    print("\nNext steps:")
    print("   python pipeline.py --phase setup   (verify everything reads correctly)")
    print("   python pipeline.py --phase generate --chapter 1")


if __name__ == "__main__":
    main()
