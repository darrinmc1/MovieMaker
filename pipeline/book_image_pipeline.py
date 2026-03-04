"""
book_image_pipeline.py — Generate scene images per chapter and act.
Reads act text from pipeline/acts/Ch<N>_Act<N>.txt

USAGE:
  python book_image_pipeline.py --step extract --chapter 1 --act 1
  python book_image_pipeline.py --step extract --chapter 1          # all acts
  python book_image_pipeline.py --step prompts --chapter 1
  python book_image_pipeline.py --step generate --chapter 1 --act 1
  python book_image_pipeline.py --step status
"""

import argparse
import base64
import importlib.util
import json
import time
import requests
from pathlib import Path
from datetime import datetime

import config
import claude_client

_PIPELINE_DIR = Path(__file__).parent
ACTS_DIR      = _PIPELINE_DIR / "acts"
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

def get_character_default(name: str) -> Path | None:
    path = REFS_DIR / name.lower() / f"{name.lower()}_default.png"
    return path if path.exists() else None

def load_character_names() -> list[str]:
    return [p.stem for p in CHARS_DIR.glob("*.py") if p.stem != "__init__"]

def get_act_file(chapter: int, act: int) -> Path | None:
    path = ACTS_DIR / f"Ch{chapter}_Act{act}.txt"
    return path if path.exists() else None

def get_all_acts_for_chapter(chapter: int) -> list[int]:
    files = sorted(ACTS_DIR.glob(f"Ch{chapter}_Act*.txt"))
    acts  = []
    for f in files:
        import re
        m = re.search(r"Act(\d+)", f.name)
        if m:
            acts.append(int(m.group(1)))
    return sorted(acts)

# ── Scene extraction ──────────────────────────────────────────────────────────

def extract_scenes_for_act(chapter: int, act: int) -> list[dict]:
    act_file = get_act_file(chapter, act)
    if not act_file:
        print(f"  No file found: Ch{chapter}_Act{act}.txt in {ACTS_DIR}")
        return []

    text = act_file.read_text(encoding="utf-8", errors="replace")
    print(f"  Reading: {act_file.name} ({len(text):,} chars)")

    system = (
        "You are a visual scene extractor for a fantasy novel. "
        "Extract 2-4 visually distinct scenes from the act text provided. "
        "Return ONLY a valid JSON array, no markdown fences, no explanation. "
        "Each scene must have exactly these fields: "
        "id (string like ch1_act1_s1), "
        "title (short 3-5 word title), "
        "characters_present (array of character first names only, e.g. ['Caelin','Vex']), "
        "location_key (one word: thornwick / ashford / crater / forest / tavern / dungeon / road / camp / other), "
        "visual_description (2-3 sentences describing what we SEE: setting, characters, action — no dialogue, no internal thoughts), "
        "mood (one word: tense / dramatic / peaceful / mysterious / action / emotional / dark)"
    )
    user = f"Chapter {chapter}, Act {act}:\n\n{text[:4000]}"

    try:
        scenes = claude_client.call_claude_json(system, user, max_tokens=2000)
        for s in scenes:
            s["chapter"] = chapter
            s["act"]     = act
            s["image_path"] = ""
        print(f"  Extracted {len(scenes)} scenes")
        return scenes
    except Exception as e:
        print(f"  Error extracting scenes: {e}")
        return []

# ── Prompt building ───────────────────────────────────────────────────────────

def build_prompt(scene: dict) -> str:
    parts = []
    anchor = get_location_anchor(scene)
    if anchor:
        parts.append(anchor)
    parts.append(scene.get("visual_description", ""))

    char_names = scene.get("characters_present", [])
    known      = load_character_names()
    for name in char_names:
        match = next((k for k in known if k.lower() == name.lower()), None)
        if match:
            spec = importlib.util.spec_from_file_location(match, CHARS_DIR / f"{match}.py")
            mod  = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            first_sentence = mod.BASE.split(".")[0] + "."
            parts.append(f"{match}: {first_sentence}")

    parts.append(BOOK_STYLE)
    return " ".join(parts)

# ── Image generation ──────────────────────────────────────────────────────────

def generate_image_fal(prompt: str, output_path: Path, characters: list[str]) -> bool:
    api_key = config.FAL_API_KEY
    if not api_key:
        print("    FAL_KEY not set")
        return False

    ref_path = None
    for name in characters:
        ref = get_character_default(name)
        if ref:
            ref_path = ref
            print(f"    Using ref: {ref.name}")
            break

    try:
        if ref_path:
            ref_b64  = base64.b64encode(ref_path.read_bytes()).decode()
            ref_uri  = f"data:image/png;base64,{ref_b64}"
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
        url  = data["images"][0]["url"] if "images" in data else data["image"]["url"]
        img  = requests.get(url, timeout=60)
        img.raise_for_status()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(img.content)
        return True

    except Exception as e:
        print(f"    Error: {e}")
        return False

# ── JSON helpers ──────────────────────────────────────────────────────────────

def load_scenes() -> list[dict]:
    if SCENES_FILE.exists():
        return json.loads(SCENES_FILE.read_text(encoding="utf-8"))
    return []

def save_scenes(scenes: list[dict]):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SCENES_FILE.write_text(json.dumps(scenes, indent=2, ensure_ascii=False), encoding="utf-8")

# ── Steps ─────────────────────────────────────────────────────────────────────

def step_extract(chapter: int, act: int | None):
    acts = [act] if act else get_all_acts_for_chapter(chapter)
    if not acts:
        print(f"No act files found for Chapter {chapter} in {ACTS_DIR}")
        return

    print(f"\n[EXTRACT] Chapter {chapter}, Acts: {acts}")
    scenes = load_scenes()
    # Remove scenes being re-extracted
    scenes = [s for s in scenes if not (s["chapter"] == chapter and (act is None or s["act"] == act))]

    for a in acts:
        print(f"\n  Act {a}:")
        new = extract_scenes_for_act(chapter, a)
        scenes.extend(new)
        save_scenes(scenes)
        time.sleep(1)

    print(f"\n  Total scenes in file: {len(scenes)}")

def step_prompts(chapter: int, act: int | None):
    print(f"\n[PROMPTS] Chapter {chapter}" + (f" Act {act}" if act else ""))
    scenes  = load_scenes()
    updated = 0
    for s in scenes:
        if s["chapter"] != chapter:
            continue
        if act and s["act"] != act:
            continue
        s["prompt"] = build_prompt(s)
        updated += 1
    save_scenes(scenes)
    print(f"  Built prompts for {updated} scenes.")

def step_generate(chapter: int, act: int | None):
    print(f"\n[GENERATE] Chapter {chapter}" + (f" Act {act}" if act else " all acts"))
    scenes  = load_scenes()
    targets = [s for s in scenes if s["chapter"] == chapter]
    if act:
        targets = [s for s in targets if s["act"] == act]

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

        safe_title = title[:30].replace(" ", "_").replace("/", "_")
        out_dir    = IMAGES_DIR / f"chapter_{chapter:02d}" / f"act_{act_num:02d}"
        out_path   = out_dir / f"{scene_id}_{safe_title}.png"

        if out_path.exists():
            print(f"  {scene_id}: already exists — skipping")
            s["image_path"] = str(out_path)
            continue

        print(f"  Generating: [{chapter}.{act_num}] {title}")
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

    # Show available act files
    print(f"\n  Act files in {ACTS_DIR}:")
    by_chapter = {}
    for f in sorted(ACTS_DIR.glob("Ch*_Act*.txt")):
        import re
        m = re.search(r"Ch(\d+)_Act(\d+)", f.name)
        if m:
            ch, act = int(m.group(1)), int(m.group(2))
            by_chapter.setdefault(ch, []).append(act)
    for ch in sorted(by_chapter):
        acts = sorted(by_chapter[ch])
        print(f"    Chapter {ch:2d}: Acts {acts}")

    # Show image generation progress
    scenes = load_scenes()
    if not scenes:
        print("\n  No scenes extracted yet. Run --step extract to begin.")
        return

    print(f"\n  Image generation progress:")
    by_ch = {}
    for s in scenes:
        ch = s["chapter"]
        by_ch.setdefault(ch, {}).setdefault(s["act"], []).append(s)

    for ch in sorted(by_ch):
        print(f"\n    Chapter {ch}:")
        for act in sorted(by_ch[ch]):
            act_scenes = by_ch[ch][act]
            done  = sum(1 for s in act_scenes if s.get("image_path"))
            total = len(act_scenes)
            bar   = "█" * done + "░" * (total - done)
            print(f"      Act {act}: [{bar}] {done}/{total}")

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Book image pipeline")
    parser.add_argument("--step",    required=True, choices=["extract", "prompts", "generate", "status"])
    parser.add_argument("--chapter", type=int, default=None)
    parser.add_argument("--act",     type=int, default=None)
    args = parser.parse_args()

    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    if args.step in ["extract", "prompts", "generate"] and not args.chapter:
        parser.error(f"--chapter required for {args.step} step")

    if args.step == "extract":
        step_extract(args.chapter, args.act)
    elif args.step == "prompts":
        step_prompts(args.chapter, args.act)
    elif args.step == "generate":
        step_generate(args.chapter, args.act)
    elif args.step == "status":
        step_status()

if __name__ == "__main__":
    main()
