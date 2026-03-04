"""
generate_character_refs.py — Generate 4 reference images per character.
Character profiles live in pipeline/characters/<Name>.py — edit those to update a character.

USAGE:
  python generate_character_refs.py --character Vex
  python generate_character_refs.py --character Vex --overwrite
  python generate_character_refs.py --all
"""

import argparse
import importlib.util
import time
import requests
from pathlib import Path
from datetime import datetime

import config

_PIPELINE_DIR = Path(__file__).parent
CHARS_DIR     = _PIPELINE_DIR / "characters"
REFS_DIR      = _PIPELINE_DIR / "data" / "character_refs"

BOOK_STYLE = (
    "epic fantasy illustration, painterly digital art style, "
    "cinematic dramatic lighting, rich jewel-tone colour palette, "
    "highly detailed, professional concept art quality, "
    "photorealistic rendering, NOT cartoon, NOT anime, NOT stylised"
)


def load_character(name: str):
    """Load a character module from pipeline/characters/<Name>.py"""
    path = CHARS_DIR / f"{name}.py"
    if not path.exists():
        available = [p.stem for p in CHARS_DIR.glob("*.py") if p.stem != "__init__"]
        raise FileNotFoundError(
            f"No character file found: {path}\n"
            f"Available characters: {', '.join(sorted(available))}"
        )
    spec = importlib.util.spec_from_file_location(name, path)
    mod  = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def get_default_path(name: str) -> Path:
    return REFS_DIR / name.lower() / f"{name.lower()}_default.png"


def generate_image(prompt: str, output_path: Path, reference_path: Path | None = None) -> bool:
    api_key = config.FAL_API_KEY
    if not api_key:
        print("    FAL_KEY not set in .env")
        return False

    try:
        if reference_path and reference_path.exists():
            import base64
            ref_b64    = base64.b64encode(reference_path.read_bytes()).decode()
            ref_uri    = f"data:image/png;base64,{ref_b64}"
            print(f"    Using instant-character ref: {reference_path.name}")
            payload  = {"prompt": prompt[:1500], "image_url": ref_uri, "image_size": "portrait_4_3", "num_images": 1}
            endpoint = "fal-ai/instant-character"
        else:
            payload  = {"prompt": prompt[:1500], "image_size": "portrait_4_3", "num_inference_steps": 30, "guidance_scale": 3.5, "num_images": 1, "enable_safety_checker": True}
            endpoint = "fal-ai/flux/dev"

        resp = requests.post(
            f"https://fal.run/{endpoint}",
            headers={"Authorization": f"Key {api_key}", "Content-Type": "application/json"},
            json=payload, timeout=180,
        )
        resp.raise_for_status()
        data = resp.json()

        if "images" in data:
            url = data["images"][0]["url"]
        elif "image" in data:
            url = data["image"]["url"]
        else:
            raise RuntimeError(f"Unexpected response: {list(data.keys())}")

        img = requests.get(url, timeout=60)
        img.raise_for_status()
        output_path.write_bytes(img.content)
        return True

    except Exception as e:
        print(f"    Error: {e}")
        return False


def generate_for_character(name: str, overwrite: bool = False) -> None:
    char     = load_character(name)
    char_dir = REFS_DIR / name.lower()
    char_dir.mkdir(parents=True, exist_ok=True)

    default_path    = get_default_path(name)
    using_reference = default_path.exists()

    print(f"\n-- {name.upper()} --")
    if using_reference:
        print(f"  Default image found -- variations from: {default_path.name}")
    else:
        print(f"  No default yet -- generating 4 initial options")
        print(f"  Copy your favourite to: {default_path}")
        print(f"  Then re-run to generate consistent variations")

    for i, pose in enumerate(char.POSES, start=1):
        out = char_dir / f"{name.lower()}_ref_{i:02d}.png"

        if out.exists() and not overwrite:
            print(f"  Pose {i}: exists -- skipping (--overwrite to redo)")
            continue

        full_prompt = f"{char.BASE} {pose}. {BOOK_STYLE}"
        print(f"  Pose {i}: {pose[:70]}...")

        ok = generate_image(full_prompt, out, reference_path=default_path if using_reference else None)
        print(f"    {'Saved: ' + out.name if ok else 'Failed'}")
        time.sleep(2)


def list_characters() -> list[str]:
    return sorted(p.stem for p in CHARS_DIR.glob("*.py") if p.stem != "__init__")


def main():
    parser = argparse.ArgumentParser(description="Generate character reference images")
    parser.add_argument("--character", default=None, help="Character name e.g. Vex, Caelin")
    parser.add_argument("--all",       action="store_true", help="Generate all characters")
    parser.add_argument("--overwrite", action="store_true", help="Regenerate even if file exists")
    parser.add_argument("--list",      action="store_true", help="List available characters")
    args = parser.parse_args()

    if args.list:
        print("Available characters:", ", ".join(list_characters()))
        return

    REFS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Refs directory : {REFS_DIR}")
    print(f"Chars directory: {CHARS_DIR}")
    print(f"Timestamp      : {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    if args.all:
        for name in list_characters():
            generate_for_character(name, overwrite=args.overwrite)
    elif args.character:
        generate_for_character(args.character, overwrite=args.overwrite)
    else:
        parser.print_help()

    print(f"\nDone. Images in: {REFS_DIR}")


if __name__ == "__main__":
    main()
