"""
add_book2_data.py — Adds Book 2 characters and world info to Google Sheets

Adds:
  - Jasper Coinblight (new character)
  - Puddle Thrym (new character)
  - Book 2 world info rows (Depthspire, the Destruction Relic, new locations, Durgan's arc)

Run: python add_book2_data.py
"""

import config
import google_clients


def main():
    sheets = google_clients.get_sheets_service()

    # ── NEW CHARACTERS (append to Characters tab) ─────────────────────────────

    new_characters = [
        [
            "Jasper Coinblight",
            "Relic hunter / Con artist / Duelist / Book 2 addition",
            "32, human. Devastatingly handsome — sharp cheekbones, roguish smile that disarms before you realise you've been robbed. Dark hair with a distinctive silver streak (claims it's from a curse; it's inherited). Amber eyes that miss nothing while appearing distracted. Expensive but practical adventuring gear: tailored leather armor in deep burgundy with gold clasps. Rapier at his hip (family heirloom — he knows how to use it at fencing-master level, and conceals this until necessary). Multiple rings, each with a story (some true, most embellished). Moves with practiced grace — every gesture calculated for effect.",
            "Public persona: smooth talker who makes everyone feel like the most important person in the room. Compliments flow naturally. Self-deprecating humour that makes him seem harmless. Bumbling charm as deliberate misdirection. Private reality: highly intelligent, constant risk assessment, skilled combatant who prefers others don't know it, genuinely respects competence. Loyal to exactly one person — himself, though this may surprise him by the end. Knows when to shut up, which is a rare skill for a talker.",
            "Relic hunter and information broker with extensive knowledge of ancient ruins, dungeon architecture, Concord law, and artifact market values. Can read three dead languages and five living ones. Expert at trap identification, negotiation, and manipulation. Prefers to let others take point while gathering information, positioning himself near exits and treasure. Strikes decisively only when no other option exists. His knowledge of Concord law becomes critical at the Warden Prime encounter — he finds the legal loophole in the Warden's programming: 'The Concord is dissolved, your mandate ended.'",
            "Specific dynamic with Vex — professional respect between two people who read others for a living, neither fully trusting the other. His test at the Depthspire escape: does he abandon the party for treasure, or prove he's changed? His choice defines whether he's redeemable. Jasper's contribution to the Warden Prime encounter is finding the Concord law argument.",
            "Eloquent without being flowery. Uses people's names frequently (builds false intimacy). Asks questions that seem casual but gather information. Laughs easily, especially at himself. Knows when to shut up. Every word is calculated — even the ones that seem throwaway.",
            "active"
        ],
        [
            "Puddle Thrym",
            "Half-orc ratcatcher / Scout / Underground navigator / Book 2 addition",
            "Half-orc, raised in sewers. Physical description not specified beyond half-orc heritage. Likely scarred and practical-looking — built for survival, not presentation. Always accompanied by rats.",
            "Cheerful demeanor that conceals the fact he has never truly felt accepted by either human or orc society. His rats are his only family and he will go to violent lengths to protect them. Dreams of finding a place where his unusual skills are genuinely valued rather than just tolerated. Sees the world from the rat's perspective: every building has hidden ways, every wall has cracks, every person drops crumbs that tell stories.",
            "Born in the sewers beneath Grayhaven City to an orc sewer worker and a human plague victim. Raised by rats after his parents died of disease. The rats taught him their language of squeaks and whistles. His knowledge of tunnels comes from years of following rat highways spanning entire cities underground. His underground network spans multiple kingdoms — if the Concord of Nine has agents anywhere, his rats will have seen them. His scouting abilities can uncover hidden bases and smuggling operations that conventional spies would miss. Critical role in Book 2: his rats mapped Depthspire's escape routes. He guides the party out of the collapsing prison when all other paths are blocked. This moment proves he was essential all along.",
            "Proves himself to Puddle through the Depthspire escape — his knowledge saves everyone. His unexpected heroism is the emotional payoff of his arc in Book 2. Jasper sees him as a useful asset before seeing him as a person.",
            "Communicates with rats via squeaks and whistles. Speaks common but with a practical, unadorned directness — no embellishment, no performance. Notices things others miss because he's been trained to read environments the way rats do. Enthusiasm about tunnels and underground spaces reads as slightly odd in surface-world company.",
            "active"
        ],
    ]

    print("Appending new characters to Characters tab...")
    for char in new_characters:
        google_clients.sheets_append(sheets, config.SHEET_CHARACTERS, char)
        print(f"  ✅ Added: {char[0]}")

    # ── BOOK 2 WORLD INFO (append to World_Info tab) ──────────────────────────

    new_world_info = [
        ["book2_title", "The Concord of Nine — Book 2: Depthspire (The Prison Core)", "Book 2 title"],
        ["depthspire", "Depthspire is a prison-vault built by the First Concord — both a proving ground for relic-seekers and a containment facility for things too dangerous to kill but too powerful to release. Corrupted mages, possessed warriors, entities that slipped through conjuration rifts, necromantic experiments that went too well. The wards are tied to the relics' dormant state — as the Nine awaken (starting with Caelin's Dragon's Ember), the binding magic weakens and Depthspire's prisoners stir. Some cells have already failed. The prison is vomiting monsters into the overworld.", "Book 2 primary location"],
        ["depthspire_paths", "Three paths converge on the central vault (the Heart of Depthspire): Path of Flame (prisoners contained through heat/light — Fire-Touched Berserkers, rogue Salamander Constructs; trial: mastery of destructive power without losing control). Path of Shadow (entities between states — Shade Haunts, Mirror Wraiths, the Forgotten; trial: seeing truth through deception, maintaining identity when reality bends). Path of Stone (prisoners sealed in architectural prisons — Stone Screamers, Architect's Mistakes, Earthbound Titans; trial: patience and problem-solving under pressure).", "Book 2 dungeon structure"],
        ["warden_prime", "The Warden Prime (called The Lawgiver) is the original jailer of Depthspire — a 15-foot Transmutation masterwork construct with four arms, expressionless mask face, glowing core through translucent chest. Speaks in formal archaic Common. Views itself as keeper of law. Does not differentiate between prisoners escaping and adventurers entering — all are containment breaches. Victory options: destroy it (most dangerous), reprogram it via Thornik (makes it ally), out-argue its logic using Concord law (Jasper's solution — 'The Concord is dissolved, your mandate ended'), Puddle's manual override (requires sacrifice, found by his rats in the walls), or seal the vault and leave.", "Book 2 primary antagonist construct"],
        ["destruction_relic", "The Unmaker's Edge — a blade of void-metal that constantly unmakes and remaking itself. Looking at it hurts — eyes want to slide away, mind recoils. It is beautiful in the way entropy is beautiful. The end of all things, perfected. Stored on a pedestal of black stone that drinks light in the central vault. This is what has been calling to Durgan since Book 1 — his shadow possession is tied to Destruction/Entropy magic, and the shadow has been manipulating him toward this relic the entire time.", "Book 2 MacGuffin — the Destruction Relic"],
        ["durgan_arc_book2", "Durgan's Book 2 climax has three possible resolutions: (A) Willing Sacrifice — Durgan fights the shadow from inside while party faces the physical manifestation of his internal war. Caelin channels Dragon's Ember to show Durgan that destruction doesn't mean ending. Durgan wins — shadow integrates into him, becomes part of him and subject to his will. Eyes: ice-blue with void-black pupils. Blade bonds to him permanently. Every use of Destruction costs him (ages slightly, loses memories, feels cold). (B) Stalemate — partial control, two souls sharing one body, uneasy truce, they argue constantly. (C) Pyrrhic — Durgan wins but is slowly unmaking himself; every use accelerates it; party watches him fade across remaining books. Key moment: 'Not while I am me' from the Boundary Bridge in Book 1 was foreshadowing this climax.", "Durgan's Book 2 arc options"],
        ["book2_consequence", "The Conjuration relic may be lost depending on resolution path. If lost: Conjuration magic worldwide begins to fail — summoning spells fizzle, portals collapse, dimensional travel becomes impossible. This makes reaching remaining relic sites much harder for Book 3+. The Seal's forces now know the heroes can be beaten. Depthspire collapses. Whatever escaped is now in the world. Thematic core: sometimes winning means losing something precious. Redemption has costs.", "Book 2 consequences and world impact"],
        ["architects_codex", "The Architect's Codex is stored in Depthspire's central vault alongside lesser relics and treasure. It contains partial blueprints of the Concord's design — relevant to Thornik's grandfather's research. Its full contents are to be determined.", "Book 2 secondary objective"],
    ]

    print("\nAppending Book 2 world info to World_Info tab...")
    for row in new_world_info:
        google_clients.sheets_append(sheets, config.SHEET_WORLD_INFO, row)
        print(f"  ✅ Added: {row[0]}")

    print("\n✅ Done! Book 2 data added:")
    print(f"   - 2 new characters (Jasper Coinblight, Puddle Thrym)")
    print(f"   - 7 new world info rows (Depthspire, paths, Warden Prime, Destruction Relic, Durgan arc, consequences, Codex)")
    print("\nRun python pipeline.py --phase setup to verify the counts.")


if __name__ == "__main__":
    main()
