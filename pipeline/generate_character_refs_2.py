"""
generate_character_refs.py — Generate 4 reference images per character using full profiles.
"""

import argparse
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
    "highly detailed, professional concept art quality, "
    "photorealistic rendering, NOT cartoon, NOT anime, NOT stylised"
)

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
            "full body portrait, standing facing viewer, right arm slightly forward so the glowing hex-plate in forearm is clearly visible, left hand at side, charred-red duster coat hanging straight, neutral weathered expression, plain dark background",
            "three-quarter view, right hand raised palm-out with small controlled ember-fire curling from fingertips, hex-plate in forearm glowing intensely amber, duster coat collar up, determined expression, dark smoke background",
            "close-up bust portrait from chest up, intense weathered expression, light stubble, looking slightly past viewer, right forearm crossing chest with hex-plate and ember-motes clearly visible, ash and smoke atmosphere",
            "action pose, crouching low in ash-covered ruins, scanning surroundings warily, duster coat spread around him, right forearm resting on knee with hex-plate glowing in the dim light, destroyed stone buildings in background",
        ]
    },

    "Vex": {
        "base": (
            "Young woman in mid-20s, 5ft6 lithe acrobatic build, dusky olive complexion, sharp cheekbones, slightly upturned nose. "
            "HAIR — always exactly this: jet black hair, longer on the LEFT side falling to jaw length, RIGHT side of head shaved close to skin — a hard undercut. "
            "A single thin streak of silver runs through the longer left section only. "
            "NOT fully silver, NOT grey, NOT white — predominantly JET BLACK with ONE silver streak. "
            "EARS — medium-length pointed half-elf ears, visible through hair, not exaggeratedly long. "
            "EYES — mismatched: LEFT eye is vivid bright green, RIGHT eye is burnished amber-gold. Both eyes must be visible and clearly different colours. "
            "Wearing fitted shadow-leather black armor with dark gray accents, reinforced at joints. "
            "Three belts: one at waist, one diagonal across chest, one at thigh. "
            "Fingerless black leather gloves. Twin daggers at belt. Soft-soled boots. "
            "Torn travel cloak with multiple pockets. Simple black cord necklace at throat."
        ),
        "poses": [
            "full body portrait, standing facing viewer, weight on one hip, right hand resting on dagger hilt, head turned slightly so both mismatched eyes visible — left green right gold — shaved right side of head clearly shown, dark background",
            "three-quarter view, crouching low on a stone ledge, cloak swept back, one dagger drawn, face turned toward viewer showing mismatched eyes, shaved undercut side visible, medieval rooftop background",
            "close-up bust portrait, sardonic half-smile, one eyebrow arched, both eyes filling frame — left vivid green right burnished gold — jet black hair with single silver streak, shaved right side, shadows framing face",
            "action pose, leaping between rooftops, cloak streaming behind, both daggers drawn, shaved undercut clearly visible, medieval fantasy city rooftops at twilight background",
        ]
    },

    "Thornik": {
        "base": (
            "Photorealistic fantasy concept art — NOT cartoon, NOT animated, NOT stylised, painterly realism only. "
            "Dwarf male, equivalent vitality of a human in his 30s, 4 feet 2 inches tall, "
            "barrel-chested and broad-shouldered with a forge-worker physique — powerfully built, not comical. "
            "Wild untamed copper-red hair. Very long braided copper beard with small gear-charms woven in. "
            "Bright amber eyes, sharp and analytical. Ruddy skin with soot and oil smudges on face and hands. "
            "Multi-lens brass goggles pushed up on forehead. "
            "Scorched leather apron over his chest, pockets stuffed with parts. Heavy tool-belt with wrenches and hammers. "
            "WEAPONS — two large dwarven war axes strapped across his back in an X-cross pattern: "
            "chunky forged-steel heads with rune engravings, worn leather-wrapped handles rising clearly above both shoulders, "
            "battle-scarred and well-used. The axes are prominent — this is a fighter as much as an inventor. "
            "Massive clanking backpack worn over the axe straps, crammed with brass contraptions and coiled tubing. "
            "Steel-toed reinforced boots. Serious, capable expression — not a joke character."
        ),
        "poses": [
            "full body portrait, standing facing viewer, both axe handles visible above shoulders in X pattern, goggles on forehead, long copper beard with charms, tool-belt and apron prominent, dark forge background",
            "three-quarter view, goggles snapped down over eyes, holding a brass mechanical device in both hands examining it, axe handles visible above shoulders, workshop with glowing machinery background",
            "close-up bust portrait, intense focused expression, amber eyes sharp, copper beard prominent with gear-charms, soot smudges on face, goggles on forehead, top of axe handles just visible at shoulder edges",
            "action pose, both war axes drawn and raised mid-battle, powerful low stance, backpack still on, goggles down, fierce battle expression, dramatic firelight background",
        ]
    },

    "Serana": {
        "base": (
            "Woman, tall and straight-backed with the bearing of someone trained in grand halls of power. "
            "Road-worn white and gold plate armor that was once magnificent — now sun-bleached, patinated with age and travel, showing dents and repairs of a long journey. "
            "Silver Dawn-crest medallion at her throat (sunburst design, well-polished even if the armor is not). "
            "Dignified posture, calm controlled expression, carries herself like quiet authority. "
            "Sandy brown or light chestnut hair, practical style pulled back for combat. "
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
            "Woman in mid-to-late 20s, 5ft6, graceful but sturdy build, strong from outdoor living. "
            "Auburn curls with living blossoms woven naturally throughout — flowers that actually grow from her hair. "
            "Earth-brown eyes, warm and deep and kind. Fair skin with sun-freckles on cheeks, nose, shoulders. "
            "CRITICAL: Living vine circlet on her head — vines with leaves that turn toward sunlight, small flowers blooming on it. "
            "Moss-green ink vine-tattoos in delicate scrollwork on both forearms and wrists — pulse with emerald light when casting. "
            "Moss-green robes of natural fibers. Lichen-coloured cloak. Often barefoot. Seed pouches and herb bundles at belt."
        ),
        "poses": [
            "full body portrait, standing in forest, facing viewer, circlet flowers blooming white, vine tattoos subtly glowing, barefoot on mossy ground",
            "three-quarter view, kneeling to tend an injured person, hands glowing green-gold, vine tattoos blazing emerald, flowers in circlet bright yellow",
            "close-up bust portrait, serene gentle expression, flowers blooming white in auburn hair, vine circlet prominent, dappled forest light",
            "action pose, arms raised summoning vines from earth, tattoos blazing bright emerald, circlet flowers vivid red, roots erupting from ground around her",
        ]
    },

    "Durgan": {
        "base": (
            "Human male, 35-42 years old, 6ft tall, whipcord lean build — efficient killing machine, no bulk, pure functional strength. "
            "Dark brown to black hair pulled back tight and severe. Ice-blue pale eyes like winter sky, penetrating and cold. "
            "Pale skin. Sharp cheekbones, angular jaw, hollow cheeks. Thin scar across left jaw. Expressionless default mask. "
            "CRITICAL: his shadow behaves wrongly — it falls in the wrong direction, reaches toward things independently, "
            "pools around his feet like liquid darkness, moves against the light source. This must be visible and disturbing. "
            "Charcoal leather armor, black-gray matte finish. Ankle-length dark coat with many hidden pockets. Hood often up. Always wearing gloves."
        ),
        "poses": [
            "full body portrait, standing facing viewer, hood slightly up, gloved hands at sides, shadow falling wrong direction on floor behind him, dark background",
            "three-quarter view, emerging from shadows, his shadow reaching forward independently like a reaching hand, dim alley background",
            "close-up bust portrait, expressionless stare, pale ice-blue eyes, shadow on wall behind him clearly moving wrong direction, candlelit room",
            "action pose, mid-strike with blade, shadow swirling around him like a living cloak, darkness gathering at his feet unnaturally",
        ]
    },

    "Nyxara": {
        "base": (
            "Woman, theatrical precision in every pose and gesture. "
            "Deliberately pulls sleeves low over her hands at all times — CRITICAL: fingertips darkening to shadow-black, "
            "the darkness creeping up toward her knuckles, she is trying to hide it. "
            "Controlled and deliberate in every movement, theatrical without being flamboyant — precise. "
            "Dark hair, sharp features, calculating intelligent eyes. "
            "Clothing with long sleeves, deep jewel tones — deep purple, midnight blue, dark green — well-made and intentional. "
            "Air of someone who has made a terrible bargain and manages the consequences with iron discipline."
        ),
        "poses": [
            "full body portrait, standing facing viewer, sleeves pulled very low hiding hands, posture theatrical and precise, shadow-dark fingertips barely visible at sleeve edges, dark background",
            "three-quarter view, gesturing with one hand — sleeve slipping back to reveal shadow-black spreading up her fingers, expression tightly controlled",
            "close-up bust portrait, calculating expression, looking slightly down, one hand visible with sleeve partially revealing darkened fingertips",
            "dramatic pose, casting dark magic, shadows streaming from her hands, shadow-black fully visible on both hands, expression of fierce control",
        ]
    },
}


# ── fal.ai generation ─────────────────────────────────────────────────────────

def generate_image(prompt: str, output_path: Path, reference_image_path=None) -> bool:
    api_key = config.FAL_API_KEY
    if not api_key:
        print("    FAL_KEY not set in .env")
        return False

    try:
        if reference_image_path and Path(reference_image_path).exists():
            import base64
            ref_b64 = base64.b64encode(Path(reference_image_path).read_bytes()).decode()
            ref_data_uri = f"data:image/png;base64,{ref_b64}"
            print(f"    Using instant-character ref: {Path(reference_image_path).name}")
            payload = {
                "prompt": prompt[:1500],
                "image_url": ref_data_uri,
                "image_size": "portrait_4_3",
                "num_images": 1,
            }
            endpoint = "fal-ai/instant-character"
        else:
            payload = {
                "prompt": prompt[:1500],
                "image_size": "portrait_4_3",
                "num_inference_steps": 30,
                "guidance_scale": 3.5,
                "num_images": 1,
                "enable_safety_checker": True,
            }
            endpoint = "fal-ai/flux/dev"

        response = requests.post(
            f"https://fal.run/{endpoint}",
            headers={"Authorization": f"Key {api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=180,
        )
        response.raise_for_status()
        data = response.json()

        if "images" in data:
            image_url = data["images"][0]["url"]
        elif "image" in data:
            image_url = data["image"]["url"]
        else:
            raise RuntimeError(f"Unexpected response shape: {list(data.keys())}")

        img_response = requests.get(image_url, timeout=60)
        img_response.raise_for_status()
        output_path.write_bytes(img_response.content)
        return True

    except Exception as e:
        print(f"    Error: {e}")
        return False


def get_default_path(char_name: str) -> Path:
    return REFS_DIR / char_name.lower() / f"{char_name.lower()}_default.png"


def generate_for_character(char_name: str, overwrite: bool = False) -> None:
    char = CHARACTERS.get(char_name)
    if not char:
        print(f"Unknown character: {char_name}")
        return

    char_dir = REFS_DIR / char_name.lower()
    char_dir.mkdir(parents=True, exist_ok=True)

    default_path = get_default_path(char_name)
    using_reference = default_path.exists()

    print(f"\n-- {char_name.upper()} --")
    if using_reference:
        print(f"  Default image found -- generating variations from: {default_path.name}")
    else:
        print(f"  No default image yet -- generating 4 initial options (text-to-image)")
        print(f"  After reviewing, copy your favourite to: {default_path}")
        print(f"  Then re-run to generate scene variations from that face")

    for i, pose in enumerate(char["poses"], start=1):
        output_path = char_dir / f"{char_name.lower()}_ref_{i:02d}.png"

        if output_path.exists() and not overwrite:
            print(f"  Pose {i}: already exists -- skipping (use --overwrite to regenerate)")
            continue

        full_prompt = f"{char['base']} {pose}. {BOOK_STYLE}"
        print(f"  Pose {i}: {pose[:60]}...")

        success = generate_image(
            full_prompt,
            output_path,
            reference_image_path=default_path if using_reference else None
        )
        if success:
            print(f"    Saved: {output_path.name}")
        else:
            print(f"    Failed -- skipping")

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

    print(f"\nDone. Images saved to: {REFS_DIR}")
    print("Review each folder. Delete bad images and re-run with --overwrite to regenerate.")


if __name__ == "__main__":
    main()
