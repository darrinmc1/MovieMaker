"""
book_image_pipeline.py — Generate scene images for the book, per chapter and act.

USAGE:
  # Extract scenes from a chapter (splits by act first)
  python book_image_pipeline.py --step extract --chapter 1

  # Generate prompts for extracted scenes
  python book_image_pipeline.py --step prompts --chapter 1

  # Generate images for a specific act
  python book_image_pipeline.py --step generate --chapter 1 --act 1

  # Generate images for all acts in a chapter
  python book_image_pipeline.py --step generate --chapter 1

  # Check what has been generated
  python book_image_pipeline.py --step status
"""

import argparse
import base64
import importlib.util
import json
import re
import time
import requests
from pathlib import Path
from datetime import datetime

import config
import claude_client

_PIPELINE_DIR = Path(__file__).parent
DATA_DIR      = _PIPELINE_DIR / "data"
SCENES_FILE   = DATA_DIR / "book1_scenes.json"
IMAGES_DIR    = DATA_DIR / "images"
CHARS_DIR     = _PIPELINE_DIR / "characters"
REFS_DIR      = _PIPELINE_DIR / "data" / "character_refs"

BOOK_STYLE = (
    "epic fantasy illustration, painterly digital art style, "
    "cinematic dramatic lighting, rich jewel-tone colour palette, "
    "highly detailed, professional concept art quality, "
    "photorealistic rendering, NOT cartoon, NOT anime, NOT stylised"
)

# ── Location anchors for visual consistency ───────────────────────────────────

LOCATION_ANCHORS = {
    "thornwick": (
        "ruined village of Thornwick: stone melted and re-solidified into smooth glossy curves, "
        "wooden beams turned translucent, doorframes sagging into organic shapes, "
        "cobblestones ridged like cooled lava, everything coated in thick pale ash"
    ),
    "ashford": (
        "large walled city of Ashford: broad cobblestone streets, sandstone buildings "
        "with iron lanterns, busy market district, Accord banners hanging from walls"
    ),
    "crater": (
        "vast circular crater: obsidian glass floor fused from superheated sand, "
        "ember-glow pulsing in deep cracks, smoking edges, unnaturally hot shimmering air"
    ),
    "forest": (
        "ancient forest road: massive moss-covered oaks arching overhead, "
        "shafts of filtered green-gold light, dense undergrowth, roots crossing the dirt path"
    ),
    "tavern": (
        "low-ceilinged medieval tavern: heavy oak beams, roaring fireplace, "
        "rough wooden tables, tallow candles, warm amber light, smoke-stained walls"
    ),
}

def get_location_anchor(scene: dict) -> str:
    loc = scene.get("location_key", "").lower()
    for key, anchor in LOCATION_ANCHORS.items():
        if key in loc:
            return anchor
    return ""


# ── Character reference lookup ────────────────────────────────────────────────

def get_character_default(name: str) -> Path | None:
    path = REFS_DIR / name.lower() / f"{name.lower()}_default.png"
    return path if path.exists() else None


def load_character_names() -> list[str]:
    return [p.stem for p in CHARS_DIR.glob("*.py") if p.stem != "__init__"]


# ── Scene extraction via Gemini ───────────────────────────────────────────────

def extract_scenes_for_chapter(chapter_num: int, book_folder: str) -> list[dict]:
    """Read chapter file, split into acts, extract 2-4 scenes per act via Gemini."""
    folder = Path(book_folder)
    candidates = list(folder.glob(f"Ch{chapter_num}*.txt")) + list(folder.glob(f"ch{chapter_num}*.txt"))
    if not candidates:
        raise FileNotFoundError(f"No chapter file found for chapter {chapter_num} in {folder}")
    chapter_file = candidates[0]
    print(f"  Reading: {chapter_file.name}")
    text = chapter_file.read_text(encoding="utf-8")

    # Split into acts
    act_pattern = re.compile(r"(Act\s+[IVX]+)", re.IGNORECASE)
    parts = act_pattern.split(text)

    acts = {}
    current_act = "prologue"
    for part in parts:
        if act_pattern.match(part):
            current_act = part.strip()
        else:
            if current_act not in acts:
                acts[current_act] = ""
            acts[current_act] += part

    all_scenes = []
    act_names = [k for k in acts.keys() if k != "prologue"]

    for act_name in act_names:
        act_text = acts[act_name][:4000]  # Limit to avoid token overflow
        act_num = len(all_scenes) // 3 + 1  # Rough act number

        # Extract act number from roman numeral
        roman = re.search(r"[IVX]+", act_name, re.IGNORECASE)
        roman_map = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5}
        act_num = roman_map.get(roman.group().upper(), 1) if roman else 1

        print(f"    Extracting scenes from {act_name}...")

        system = (
            "You are a visual scene extractor for a fantasy novel. "
            "Extract 2-4 visually distinct scenes from the provided act text. "
            "Return ONLY a JSON array, no markdown, no explanation. "
            "Each scene must have these exact fields: "
            "id (string like ch1_act1_s1), title (short), "
            "characters_present (array of character first names), "
            "location_key (one of: thornwick, ashford, crater, forest, tavern, or describe briefly), "
            "visual_description (2-3 sentences describing what we SEE, not dialogue or internal thoughts), "
            "mood (one word: tense/dramatic/peaceful/mysterious/action/emotional)"
        )
        user = f"Chapter {chapter_num}, {act_name}:\n\n{act_text}"

        try:
            scenes = claude_client.call_claude_json(system, user, max_tokens=2000)
            for s in scenes:
                s["chapter"] = chapter_num
                s["act"] = act_num
                s["act_name"] = act_name
                s["image_path"] = ""
            all_scenes.extend(scenes)
            print(f"      Found {len(scenes)} scenes")
        except Exception as e:
            print(f"      Error extracting {act_name}: {e}")

        time.sleep(1)

    return all_scenes


# ── Prompt generation ─────────────────────────────────────────────────────────

def build_prompt(scene: dict) -> str:
    parts = []

    # Location anchor
    anchor = get_location_anchor(scene)
    if anchor:
        parts.append(anchor)

    # Visual description
    parts.append(scene.get("visual_description", ""))

    # Character anchors (brief, from their BASE descriptions)
    char_names = scene.get("characters_present", [])
    known = load_character_names()
    for name in char_names:
        match = next((k for k in known if k.lower() == name.lower()), None)
        if match:
            spec = importlib.util.spec_from_file_location(match, CHARS_DIR / f"{match}.py")
            mod  = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            # Use just the first sentence of BASE as a compact anchor
            first_sentence = mod.BASE.split(".")[0] + "."
            parts.append(f"{match}: {first_sentence}")

    parts.append(BOOK_STYLE)
    return " ".join(parts)


# ── Image generation via fal.ai ───────────────────────────────────────────────

def generate_image_fal(prompt: str, output_path: Path, characters: list[str]) -> bool:
    api_key = config.FAL_API_KEY
    if not api_key:
        print("    FAL_KEY not set")
        return False

    # Find first character with a default reference image
    ref_path = None
    for name in characters:
        ref = get_character_default(name)
        if ref:
            ref_path = ref
            print(f"    Using character ref: {ref.name}")
            break

    try:
        if ref_path:
            ref_b64 = base64.b64encode(ref_path.read_bytes()).decode()
            ref_uri = f"data:image/png;base64,{ref_b64}"
            payload  = {"prompt": prompt[:1500], "image_url": ref_uri, "image_size": "landscape_16_9", "num_images": 1}
            endpoint = "fal-ai/instant-character"
        else:
            payload  = {"prompt": prompt[:1500], "image_size": "landscape_16_9", "num_inference_steps": 28, "guidance_scale": 3.5, "num_images": 1, "enable_safety_checker": True}
            endpoint = "fal-ai/flux/dev"

        resp = requests.post(
            f"https://fal.run/{endpoint}",
            headers={"Authorization": f"Key {api_key}", "Content-Type": "application/json"},
            json=payload, timeout=180,
        )
        resp.raise_for_status()
        data = resp.json()

        url = data["images"][0]["url"] if "images" in data else data["image"]["url"]
        img = requests.get(url, timeout=60)
        img.raise_for_status()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(img.content)
        return True

    except Exception as e:
        print(f"    Error: {e}")
        return False


# ── Load / save scenes JSON ───────────────────────────────────────────────────

def load_scenes() -> list[dict]:
    if SCENES_FILE.exists():
        return json.loads(SCENES_FILE.read_text(encoding="utf-8"))
    return []

def save_scenes(scenes: list[dict]):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SCENES_FILE.write_text(json.dumps(scenes, indent=2, ensure_ascii=False), encoding="utf-8")


# ── Steps ─────────────────────────────────────────────────────────────────────

def step_extract(chapter: int, book_folder: str):
    print(f"\n[EXTRACT] Chapter {chapter}")
    scenes     = load_scenes()
    # Remove existing scenes for this chapter
    scenes     = [s for s in scenes if s.get("chapter") != chapter]
    new_scenes = extract_scenes_for_chapter(chapter, book_folder)
    scenes.extend(new_scenes)
    save_scenes(scenes)
    print(f"  Saved {len(new_scenes)} scenes. Total in file: {len(scenes)}")


def step_prompts(chapter: int):
    print(f"\n[PROMPTS] Chapter {chapter}")
    scenes = load_scenes()
    updated = 0
    for s in scenes:
        if s.get("chapter") != chapter:
            continue
        s["prompt"] = build_prompt(s)
        updated += 1
    save_scenes(scenes)
    print(f"  Built prompts for {updated} scenes.")


def step_generate(chapter: int, act: int | None):
    print(f"\n[GENERATE] Chapter {chapter}" + (f", Act {act}" if act else ", all acts"))
    scenes  = load_scenes()
    targets = [s for s in scenes if s.get("chapter") == chapter]
    if act:
        targets = [s for s in targets if s.get("act") == act]

    if not targets:
        print("  No scenes found. Run --step extract first.")
        return

    for s in targets:
        scene_id = s.get("id", "unknown")
        title    = s.get("title", "scene")
        act_num  = s.get("act", 1)
        prompt   = s.get("prompt", "")

        if not prompt:
            print(f"  {scene_id}: no prompt — run --step prompts first")
            continue

        out_dir  = IMAGES_DIR / f"chapter_{chapter:02d}" / f"act_{act_num:02d}"
        out_path = out_dir / f"{scene_id}_{title[:30].replace(' ','_')}.png"

        if out_path.exists():
            print(f"  {scene_id}: already exists — skipping")
            s["image_path"] = str(out_path)
            continue

        print(f"  Generating: {scene_id} — {title}")
        ok = generate_image_fal(prompt, out_path, s.get("characters_present", []))
        if ok:
            s["image_path"] = str(out_path)
            print(f"    Saved: {out_path.name}")
        else:
            print(f"    Failed")
        save_scenes(scenes)
        time.sleep(2)


def step_status():
    print("\n[STATUS]")
    scenes = load_scenes()
    if not scenes:
        print("  No scenes found.")
        return
    by_chapter = {}
    for s in scenes:
        ch = s.get("chapter", "?")
        by_chapter.setdefault(ch, []).append(s)

    for ch, ch_scenes in sorted(by_chapter.items()):
        by_act = {}
        for s in ch_scenes:
            act = s.get("act", "?")
            by_act.setdefault(act, []).append(s)
        print(f"\n  Chapter {ch}:")
        for act, act_scenes in sorted(by_act.items()):
            done  = sum(1 for s in act_scenes if s.get("image_path"))
            total = len(act_scenes)
            bar   = "█" * done + "░" * (total - done)
            print(f"    Act {act}: [{bar}] {done}/{total} images")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Book image pipeline")
    parser.add_argument("--step",        required=True, choices=["extract", "prompts", "generate", "status"])
    parser.add_argument("--chapter",     type=int, default=None)
    parser.add_argument("--act",         type=int, default=None, help="Specific act number (for generate step)")
    parser.add_argument("--book-folder", default=r"C:\Users\Client\Desktop\book chapter updates\Book 1")
    args = parser.parse_args()

    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    if args.step == "extract":
        if not args.chapter:
            parser.error("--chapter required for extract step")
        step_extract(args.chapter, args.book_folder)

    elif args.step == "prompts":
        if not args.chapter:
            parser.error("--chapter required for prompts step")
        step_prompts(args.chapter)

    elif args.step == "generate":
        if not args.chapter:
            parser.error("--chapter required for generate step")
        step_generate(args.chapter, args.act)

    elif args.step == "status":
        step_status()


if __name__ == "__main__":
    main()
