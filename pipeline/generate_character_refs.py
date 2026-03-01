"""
generate_character_refs.py — Generate 4 reference images per character using full profiles.
Uses fal-ai/flux/dev for maximum quality and prompt adherence.

USAGE:
  python generate_character_refs.py
  python generate_character_refs.py --character Caelin
"""

import argparse
import json
import time
import requests
from pathlib import Path
from datetime import datetime

import config

_PIPELINE_DIR = Path(__file__).parent
REFS_DIR = _PIPELINE_DIR / "data" / "character_refs"

BOOK_STYLE = (
    "epic fantasy illustration, painterly digital art style, "
    "cinematic dramatic lighting, rich jewel-tone colour palette, "
    "highly detailed, professional concept art quality"
)

# ── Full character definitions from profiles ──────────────────────────────────

CHARACTERS = {
    "Caelin": {
        "base": (
            "Man in his late 20s, tall lean athletic build, face weathered and hardened by years of exile and travel — "
            "not boyish, defined jawline, light stubble, lived-in appearance. Windswept auburn red-brown hair. "
            "Ember-flecked hazel eyes with warm orange-gold motes. Fair complexion, weathered from outdoor travel. "
            "JACKET — always exactly this: a single long duster coat, knee-length, deep charred-red (like cooled embers, not bright red), "
            "worn leather texture, dark at the seams and cuffs from travel, faint runes etched along the inner lining visible only at edges — "
            "NOT bright red, NOT a cape, NOT a cloak, NOT multiple layers, ONE coat only. "
            "Dark practical shirt and trousers underneath. Travel-worn boots. "
            "CRITICAL RIGHT ARM: a single thumb-sized hexagonal plate of translucent obsidian is physically embedded into the skin of his right forearm — "
            "it sits flush with the skin like a dark window, and inside it amber and orange ember-motes drift slowly like fireflies in a jar. "
            "Hair-fine black filaments spread from its edges toward his wrist and elbow like dark veins under the skin. "
            "It glows with a dim internal ember light. This is the single most important visual detail — it must be present and clearly visible. "
            "Faint draconic scale-pattern tattoos on his neck (subtle, not covering his face). Small silver stud in left ear."
        ),
        "poses": [
            "full body portrait, standing facing viewer, right arm slightly forward so the glowing hex-plate in forearm is clearly visible, "
            "left hand at side, charred-red duster coat hanging straight, neutral weathered expression, plain dark background",
            "three-quarter view, right hand raised palm-out with small controlled ember-fire curling from fingertips, "
            "hex-plate in forearm glowing intensely amber, duster coat collar up, determined expression, dark smoke background",
            "close-up bust portrait from chest up, intense weathered expression, light stubble, looking slightly past viewer, "
            "right forearm crossing chest with hex-plate and ember-motes clearly visible, ash and smoke atmosphere",
            "action pose, crouching low in ash-covered ruins, scanning surroundings warily, duster coat spread around him, "
            "right forearm resting on knee with hex-plate glowing in the dim light, destroyed stone buildings in background",
        ]
    },

    "Vex": {
        "base": (
            "Young woman in mid-20s, 5'6\" lithe acrobatic build, dusky olive complexion. "
            "CRITICAL distinctive feature: mismatched eyes — left eye vivid green, right eye burnished gold. "
            "Silver-streaked raven-black hair in an undercut (shaved right side, longer on left), pointed half-elf ears visible. "
            "Sharp cheekbones, slightly upturned nose, frequently arched eyebrows. "
            "Wearing shadow-leather black armor with dark gray accents, three belts (waist, diagonal chest, thigh), "
            "fingerless gloves, twin daggers visible at belt, soft-soled boots. "
            "Torn travel cloak with multiple hidden pockets. Simple black cord necklace. "
            "Actor resemblance: Zoë Kravitz physicality, Hailee Steinfeld energy."
        ),
        "poses": [
            "full body portrait, standing facing viewer, hip cocked, hand resting on dagger hilt, mismatched eyes clearly visible, dark background",
            "three-quarter view, crouching on a ledge or rooftop, cloak swept back, daggers drawn, mismatched eyes catching light",
            "close-up bust portrait, sardonic half-smile, arched eyebrow, mismatched eyes — left green right gold — unmistakable, shadows framing face",
            "action pose, mid-leap or climbing, cloak streaming, both daggers out, twilight urban rooftop background",
        ]
    },

    "Thornik": {
        "base": (
            "Dwarf male, 50s-60s in dwarven years (vitality of a human 30-40), 4'2\" height, barrel-chested broad-shouldered powerful build. "
            "Wild untamed copper-red hair. Very long braided copper beard with small gear-charms woven throughout (audibly clicks when he moves). "
            "Bright amber eyes constantly analyzing. Ruddy skin with oil and soot smudges. "
            "Multi-lens brass goggles pushed up on forehead (multiple magnification lenses, can snap down). "
            "Scorched leather apron stuffed with pockets full of spare parts. Heavy leather tool-belt bristling with wrenches, pliers, small hammers. "
            "Massive clanking backpack crammed with brass contraptions, coiled tubing, mysterious devices. "
            "Steel-toed reinforced boots. "
            "Actor resemblance: Nick Frost energy, John Rhys-Davies stature."
        ),
        "poses": [
            "full body portrait, standing facing viewer, massive backpack visible, goggles on forehead, beard charms visible, tool-belt prominent, dark background",
            "three-quarter view, examining a mechanical device with goggles snapped down over eyes, holding something brass and complex, workshop background with tools",
            "close-up bust portrait, enormous grin and laughing, amber eyes bright, beard charms catching light, soot on cheeks",
            "action pose, running full tilt, backpack clanking, one hand throwing a small brass bomb, the other gripping a short war-axe, battle background",
        ]
    },

    "Serana": {
        "base": (
            "Woman, tall and straight-backed with the bearing of someone trained in grand halls of power. "
            "Road-worn white and gold plate armor that was once magnificent — now sun-bleached, patinated with age and travel, showing the dents and repairs of a long journey. "
            "Silver Dawn-crest medallion at her throat (sunburst design, well-polished even if the armor isn't). "
            "Dignified posture, calm controlled expression, carries herself like quiet authority. "
            "Sandy brown or light chestnut hair, practical style (pulled back for combat). "
            "Steadfast, weathered face — beautiful in a severe way."
        ),
        "poses": [
            "full body portrait, standing facing viewer, hand resting on sword hilt, armor details visible, Dawn medallion prominent, cathedral or temple background",
            "three-quarter view, kneeling in prayer or devotion, hands clasped around medallion, sunlight streaming from above onto worn armor",
            "close-up bust portrait, calm resolute expression, looking into distance, armor collar and medallion visible, dawn sky background",
            "action pose, sword raised mid-combat, armor catching firelight, defending a position, battle chaos around her",
        ]
    },

    "Elowen": {
        "base": (
            "Woman in mid-to-late 20s, 5'6\", graceful but sturdy build, strong from outdoor living. "
            "Auburn curls with living blossoms woven naturally throughout — flowers that actually grow from her hair, changing with emotion. "
            "Earth-brown eyes, warm and deep and kind. Fair skin with sun-freckles on cheeks, nose, shoulders. "
            "CRITICAL: Living vine circlet on her head — vines with leaves that turn toward sunlight, small flowers that bloom based on emotion "
            "(white = calm, red = distress, yellow = joy). Never removed, bonded to her. "
            "Moss-green ink vine-tattoos in delicate scrollwork on both forearms and wrists — pulse with emerald light when casting, dull verdant at rest. "
            "Moss-green robes of natural fibers. Lichen-coloured cloak. Often barefoot. Seed pouches and herb bundles at belt."
        ),
        "poses": [
            "full body portrait, standing in forest, facing viewer, circlet flowers blooming white (calm), vine tattoos subtly glowing, barefoot on mossy ground",
            "three-quarter view, kneeling to tend an injured person, hands glowing green-gold, vine tattoos blazing emerald, flowers in circlet bright yellow",
            "close-up bust portrait, serene gentle expression, flowers blooming white in auburn hair, vine circlet prominent, dappled forest light",
            "action pose, arms raised summoning vines from earth, tattoos blazing bright emerald, circlet flowers vivid red (distress/power), roots erupting from ground around her",
        ]
    },

    "Durgan": {
        "base": (
            "Human male, 35-42 years old, 6'0\", whipcord lean build — efficient killing machine, no bulk, pure functional strength. "
            "Dark brown to black hair pulled back tight and severe. Ice-blue pale eyes like winter sky, penetrating and cold. "
            "Pale skin, rarely sees sun. Sharp cheekbones, angular jaw, hollow cheeks. Thin scar across left jaw. Expressionless default mask. "
            "CRITICAL visual element: his shadow behaves wrongly — it falls in the wrong direction, reaches toward things independently, "
            "pools around his feet like liquid darkness, moves against the light source. This should be visible and disturbing in the image. "
            "Charcoal leather armor (black-gray, matte, absorbs light). Ankle-length dark coat with many hidden pockets. Hood often up. Always wearing gloves."
        ),
        "poses": [
            "full body portrait, standing facing viewer, hood slightly up, hands in gloves, shadow falling wrong direction on floor behind him, dark background",
            "three-quarter view, emerging from shadows, shadow reaching forward independently of his body like a reaching hand, dim alley background",
            "close-up bust portrait, expressionless stare, ice-blue eyes, shadow on wall behind him moving wrong, candlelit room",
            "action pose, mid-strike with blade, shadow swirling around him like a living cloak, darkness gathering at his feet unnaturally",
        ]
    },

    "Nyxara": {
        "base": (
            "Woman, theatrical precision in every pose and gesture. "
            "Deliberately pulls sleeves low over her hands at all times — CRITICAL: fingertips darkening to shadow-black, "
            "the darkness creeping up toward her knuckles, she's trying to hide it. "
            "Controlled and deliberate in every movement, theatrical without being flamboyant — precise. "
            "Dark hair, sharp features, calculating intelligent eyes. "
            "Clothing with long sleeves, deep jewel tones (deep purple, midnight blue, dark green), well-made and intentional. "
            "An air of someone who has made a terrible bargain and is managing its consequences with iron discipline."
        ),
        "poses": [
            "full body portrait, standing facing viewer, sleeves pulled very low hiding hands, posture theatrical and precise, shadow-dark fingertips barely visible at sleeve edges, dark background",
            "three-quarter view, gesturing with one hand — sleeve slipping back to reveal the shadow-black spreading up her fingers, expression tightly controlled",
            "close-up bust portrait, calculating expression, looking slightly down at something, one hand visible with sleeve partially revealing darkened fingertips",
            "dramatic pose, casting dark magic, shadows streaming from her hands, shadow-black now fully visible on both hands, expression of fierce control",
        ]
    },
}


# ── fal.ai generation ─────────────────────────────────────────────────────────

def generate_image(prompt: str, output_path: Path) -> bool:
    """Generate one image using flux/dev and save it."""
    api_key = config.FAL_API_KEY
    if not api_key:
        print("    ❌ FAL_KEY not set in .env")
        return False

    try:
        response = requests.post(
            "https://fal.run/fal-ai/flux/dev",
            headers={"Authorization": f"Key {api_key}", "Content-Type": "application/json"},
            json={
                "prompt": prompt[:1500],
                "image_size": "portrait_4_3",
                "num_inference_steps": 30,
                "guidance_scale": 3.5,
                "num_images": 1,
                "enable_safety_checker": True,
            },
            timeout=180,
        )
        response.raise_for_status()
        data = response.json()
        image_url = data["images"][0]["url"]

        img_response = requests.get(image_url, timeout=60)
        img_response.raise_for_status()
        output_path.write_bytes(img_response.content)
        return True

    except Exception as e:
        print(f"    ❌ Error: {e}")
        return False


# ── Main ──────────────────────────────────────────────────────────────────────

def generate_for_character(char_name: str, overwrite: bool = False) -> None:
    char = CHARACTERS.get(char_name)
    if not char:
        print(f"❌ Unknown character: {char_name}")
        return

    char_dir = REFS_DIR / char_name.lower()
    char_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n── {char_name.upper()} ──────────────────────────────────────────────")

    for i, pose in enumerate(char["poses"], start=1):
        output_path = char_dir / f"{char_name.lower()}_ref_{i:02d}.png"

        if output_path.exists() and not overwrite:
            print(f"  Pose {i}: already exists — skipping (use --overwrite to regenerate)")
            continue

        full_prompt = f"{char['base']} {pose}. {BOOK_STYLE}"
        print(f"  Pose {i}: {pose[:60]}...")

        success = generate_image(full_prompt, output_path)
        if success:
            print(f"    ✅ Saved: {output_path.name}")
        else:
            print(f"    ❌ Failed — skipping")

        time.sleep(2)


def main():
    parser = argparse.ArgumentParser(description="Generate character reference images")
    parser.add_argument("--character", default=None, help=f"Character name. Options: {', '.join(CHARACTERS.keys())}")
    parser.add_argument("--overwrite", action="store_true", help="Regenerate even if file exists")
    args = parser.parse_args()

    REFS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {REFS_DIR}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    if args.character:
        generate_for_character(args.character, overwrite=args.overwrite)
    else:
        for char_name in CHARACTERS.keys():
            generate_for_character(char_name, overwrite=args.overwrite)

    print(f"\n✅ Done. Images saved to: {REFS_DIR}")
    print("Review each character folder. Delete any bad images and re-run with --overwrite to regenerate.")


if __name__ == "__main__":
    main()
