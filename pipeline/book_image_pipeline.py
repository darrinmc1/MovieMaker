"""
book_image_pipeline.py — Generate scene images per chapter and act.
Reads act text from pipeline/acts/Ch<N>_Act<N>.txt

USAGE:
  python book_image_pipeline.py --step extract --chapter 1 --act 1
  python book_image_pipeline.py --step extract --chapter 1          # all acts
  python book_image_pipeline.py --step prompts --chapter 1
  python book_image_pipeline.py --step generate --chapter 1 --act 1
  python book_image_pipeline.py --step status

  # Run everything in one go:
  python book_image_pipeline.py --all                    # all chapters, all acts
  python book_image_pipeline.py --all --chapter 1        # one chapter, all acts
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
        "ruined village of Thornwick: stone buildings melted and re-solidified into smooth glossy curves, "
        "wooden beams turned translucent amber, doorframes sagging into organic shapes, "
        "cobblestones ridged like cooled lava flows, everything coated in thick pale ash, "
        "eerie silence, smoke still rising from collapsed rooftops, orange dawn sky"
    ),
    "ashford": (
        "large walled city of Ashford: broad cobblestone streets slick with rain, sandstone buildings "
        "with iron lanterns casting warm pools of light, busy market district, "
        "Accord banners hanging from stone walls, crowded with merchants and travellers"
    ),
    "crater": (
        "vast circular crater in barren volcanic highlands: obsidian glass floor fused from superheated sand, "
        "deep cracks pulsing with ember-orange glow from below, thin smoke drifting upward, "
        "unnaturally hot shimmering air distorting the horizon, "
        "crater walls steep and blackened, oppressive red-orange sky overhead"
    ),
    "crater_dragon": (
        "vast crater interior at dusk: obsidian-black floor split by molten fissures glowing orange-red, "
        "massive ancient dragon collapsed at crater's centre surrounded by lava-light, "
        "smoke and heat haze rising, crater walls looming dark overhead, "
        "apocalyptic ember-red sky, dramatic silhouette lighting from below"
    ),
    "forest": (
        "ancient forest road through towering oaks: massive moss-covered trunks arching overhead forming a dark canopy, "
        "shafts of filtered green-gold light cutting through, dense undergrowth pressing close, "
        "gnarled roots crossing the dirt path, mist hanging low between trees"
    ),
    "forest_corrupted": (
        "dying corrupted forest: ancient oaks with bark turned black and split, "
        "leaves withered to grey ash still on branches, dark veins of corruption spreading across ground, "
        "sickly purple-black mist drifting between trunks, unnatural silence, no birdsong"
    ),
    "tavern": (
        "low-ceilinged medieval tavern interior: heavy dark oak beams, roaring stone fireplace, "
        "rough-hewn wooden tables and benches, tallow candles in iron holders, "
        "warm amber light, smoke-stained plaster walls, smell of ale and wood smoke"
    ),
    "mountain": (
        "high mountain pass in the Emberpeaks: jagged grey stone cliffs rising on both sides, "
        "thin cold air, distant peaks shrouded in cloud, loose scree underfoot, "
        "wind-blasted sparse vegetation, dramatic storm-grey sky"
    ),
    "sanctum": (
        "ancient dragon sanctum carved into mountain rock: vast vaulted stone chambers, "
        "walls etched with Draconic script glowing faint amber, "
        "crystalline formations growing from floor and ceiling, "
        "air thick with ancient heat, deep silence broken only by distant rumbling"
    ),
    "camp": (
        "wilderness camp at night: small fire burning low, bedrolls spread on rocky ground, "
        "pine trees pressing close in darkness, stars visible through canopy breaks, "
        "cold clear mountain air, flickering shadows cast by firelight"
    ),
    "road": (
        "open road through rolling countryside: dirt track cutting through sparse farmland, "
        "distant treeline on horizon, overcast grey sky, wind bending long grass at roadside"
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
        "location_key (choose the best match: thornwick / ashford / crater / crater_dragon / forest / forest_corrupted / tavern / mountain / sanctum / camp / road / other), "
        "visual_description (4-6 sentences describing what we SEE in rich detail: exact setting details, lighting, atmosphere, character positions, clothing, actions, foreground and background elements — no dialogue, no internal thoughts, be specific and vivid), "
        "mood (one word: tense / dramatic / peaceful / mysterious / action / emotional / dark), "
        "camera_angle (one of: behind — character seen from behind facing scene; "
        "side — character in profile; "
        "face — character face visible, dramatic portrait angle; "
        "wide — no main character focus, establishing landscape shot). "
        "Use 'behind' for dramatic moments where character faces something overwhelming (dragon, crater, army). "
        "Use 'face' for emotional or conversational scenes. "
        "Use 'wide' for pure location/atmosphere establishing shots. "
        "Use 'side' for action or travel scenes."
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

CAMERA_ANGLE_PHRASES = {
    "behind": "viewed from behind, character silhouetted against scene, back to camera, dramatic rear perspective",
    "side":   "character in profile, side view, three-quarter angle, dynamic composition",
    "face":   "character face visible, medium shot, emotional expression, cinematic portrait framing",
    "wide":   "wide establishing shot, no foreground characters, full landscape panorama, epic scale",
}

def build_prompt(scene: dict) -> str:
    parts = []

    # Location anchor
    anchor = get_location_anchor(scene)
    if anchor:
        parts.append(anchor)

    # Visual description
    parts.append(scene.get("visual_description", ""))

    # Camera angle
    angle = scene.get("camera_angle", "behind")
    angle_phrase = CAMERA_ANGLE_PHRASES.get(angle, CAMERA_ANGLE_PHRASES["behind"])
    parts.append(angle_phrase)

    # Character descriptions — only if face or side (behind/wide don't need face detail)
    char_names = scene.get("characters_present", [])
    known      = load_character_names()
    if angle in ("face", "side"):
        for name in char_names:
            match = next((k for k in known if k.lower() == name.lower()), None)
            if match:
                spec = importlib.util.spec_from_file_location(match, CHARS_DIR / f"{match}.py")
                mod  = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
                first_sentence = mod.BASE.split(".")[0] + "."
                parts.append(f"{match}: {first_sentence}")
    elif angle == "behind" and char_names:
        # For behind shots just describe the outfit/silhouette, not the face
        match = next((k for k in known if k.lower() == char_names[0].lower()), None)
        if match:
            spec = importlib.util.spec_from_file_location(match, CHARS_DIR / f"{match}.py")
            mod  = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            # Use just the clothing/silhouette part of BASE
            base = getattr(mod, "BASE", "")
            # Extract sentences mentioning clothing/coat/outfit
            outfit_hints = [s.strip() for s in base.split(".") if any(w in s.lower() for w in ["coat", "duster", "cloak", "robe", "outfit", "clothing", "wear", "jacket"])]
            if outfit_hints:
                parts.append(f"{match} silhouette: {outfit_hints[0]}.")

    parts.append(BOOK_STYLE)
    return " ".join(parts)

# ── Image generation ──────────────────────────────────────────────────────────

def generate_image_fal(prompt: str, output_path: Path, characters: list[str], base_image: Path | None = None) -> bool:
    """
    Generate a scene image.
    - characters: used to find a character ref for instant-character (face scenes)
    - base_image: first scene image from this act — used as style reference for consistency
    """
    api_key = config.FAL_API_KEY
    if not api_key:
        print("    FAL_KEY not set")
        return False

    char_ref_path = None
    for name in characters:
        ref = get_character_default(name)
        if ref:
            char_ref_path = ref
            print(f"    Using char ref: {ref.name}")
            break

    try:
        if char_ref_path:
            # Face/side shot — use instant-character for face consistency
            ref_b64  = base64.b64encode(char_ref_path.read_bytes()).decode()
            ref_uri  = f"data:image/png;base64,{ref_b64}"
            payload  = {
                "prompt":     prompt[:2500],
                "image_url":  ref_uri,
                "image_size": "landscape_16_9",
                "num_images": 1,
            }
            endpoint = "fal-ai/instant-character"
            print(f"    Endpoint: instant-character (face ref)")

        elif base_image and base_image.exists():
            # No face ref needed — use base scene image for style/palette consistency
            base_b64 = base64.b64encode(base_image.read_bytes()).decode()
            base_uri = f"data:image/png;base64,{base_b64}"
            payload  = {
                "prompt":           prompt[:2500],
                "image_url":        base_uri,
                "image_size":       "landscape_16_9",
                "strength":         0.75,   # how much to deviate from base (0=copy, 1=ignore)
                "num_inference_steps": 30,
                "guidance_scale":   4.0,
                "num_images":       1,
                "enable_safety_checker": True,
            }
            endpoint = "fal-ai/flux/dev/image-to-image"
            print(f"    Endpoint: flux img2img (style from base: {base_image.name})")

        else:
            # First scene in act — pure text-to-image, sets the style baseline
            payload  = {
                "prompt":              prompt[:2500],
                "image_size":          "landscape_16_9",
                "num_inference_steps": 30,
                "guidance_scale":      4.0,
                "num_images":          1,
                "enable_safety_checker": True,
            }
            endpoint = "fal-ai/flux/dev"
            print(f"    Endpoint: flux txt2img (base scene)")

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

    # Track the first successfully generated image per act to use as style base
    act_base_images: dict[int, Path] = {}

    for s in targets:
        scene_id = s.get("id", "unknown")
        title    = s.get("title", "scene")
        act_num  = s.get("act", 1)
        prompt   = s.get("prompt", "")
        angle    = s.get("camera_angle", "behind")

        if not prompt:
            print(f"  {scene_id}: no prompt — run --step prompts first")
            continue

        safe_title = title[:30].replace(" ", "_").replace("/", "_")
        out_dir    = IMAGES_DIR / f"chapter_{chapter:02d}" / f"act_{act_num:02d}"
        out_path   = out_dir / f"{scene_id}_{safe_title}.png"

        if out_path.exists():
            print(f"  {scene_id}: already exists — skipping")
            s["image_path"] = str(out_path)
            # Register as base if none yet for this act
            if act_num not in act_base_images:
                act_base_images[act_num] = out_path
            continue

        # Decide whether to pass character ref (face/side) or base image (behind/wide)
        char_ref_names = s.get("characters_present", []) if angle in ("face", "side") else []
        base_img       = None if angle in ("face", "side") else act_base_images.get(act_num)

        print(f"  Generating: [{chapter}.{act_num}] {title} ({angle})")
        ok = generate_image_fal(prompt, out_path, char_ref_names, base_image=base_img)
        if ok:
            s["image_path"] = str(out_path)
            print(f"    Saved: {out_path.name}")
            # First success in this act becomes the style base
            if act_num not in act_base_images:
                act_base_images[act_num] = out_path
                print(f"    Set as style base for Act {act_num}")
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

def get_all_chapters() -> list[int]:
    """Find all chapter numbers that have act files."""
    chapters = set()
    import re
    for f in ACTS_DIR.glob("Ch*_Act*.txt"):
        m = re.search(r"Ch(\d+)_Act", f.name)
        if m:
            chapters.add(int(m.group(1)))
    return sorted(chapters)


def run_all(chapter: int | None):
    """Run extract → prompts → generate for all acts in one or all chapters."""
    chapters = [chapter] if chapter else get_all_chapters()
    if not chapters:
        print("No act files found. Make sure pipeline/acts/ has Ch<N>_Act<N>.txt files.")
        return

    print(f"\n[ALL] Processing chapters: {chapters}")
    for ch in chapters:
        acts = get_all_acts_for_chapter(ch)
        if not acts:
            print(f"  Chapter {ch}: no act files found, skipping")
            continue
        print(f"\n{'='*50}")
        print(f"  CHAPTER {ch} — {len(acts)} acts: {acts}")
        print(f"{'='*50}")
        for act in acts:
            print(f"\n  --- Ch{ch} Act{act} ---")
            step_extract(ch, act)
            step_prompts(ch, act)
            step_generate(ch, act)

    print("\n[ALL] Done! Run --step status to see results.")


def run_interactive():
    """Interactive mode — process chapters one at a time with prompts between each."""
    all_chapters = get_all_chapters()
    if not all_chapters:
        print("No act files found. Make sure pipeline/acts/ has Ch<N>_Act<N>.txt files.")
        return

    print(f"\n[INTERACTIVE MODE]")
    print(f"Available chapters: {all_chapters}")
    print(f"Commands: type a chapter number, 'all', 'next', 'status', or 'q' to quit\n")

    last_chapter = None

    while True:
        try:
            choice = input("Which chapter? > ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print("\nExiting.")
            break

        if choice in ("q", "quit", "exit"):
            print("Done!")
            break

        elif choice == "status":
            step_status()

        elif choice == "all":
            run_all(None)

        elif choice in ("next", "n", ""):
            if last_chapter is None:
                next_ch = all_chapters[0]
            else:
                idx = all_chapters.index(last_chapter) if last_chapter in all_chapters else -1
                next_ch = all_chapters[idx + 1] if idx + 1 < len(all_chapters) else None
            if next_ch is None:
                print("All chapters done!")
            else:
                run_all(next_ch)
                last_chapter = next_ch
                remaining = [c for c in all_chapters if c > next_ch]
                if remaining:
                    print(f"\nRemaining chapters: {remaining}")
                    print("Type a number, 'next', 'status', or 'q'")

        elif choice.isdigit():
            ch = int(choice)
            if ch not in all_chapters:
                print(f"Chapter {ch} not found. Available: {all_chapters}")
            else:
                run_all(ch)
                last_chapter = ch
                remaining = [c for c in all_chapters if c > ch]
                if remaining:
                    print(f"\nRemaining chapters: {remaining}")
                    print("Type a number, 'next', 'status', or 'q'")

        else:
            print(f"  Unknown command '{choice}'. Type a chapter number, 'next', 'all', 'status', or 'q'")


def main():
    parser = argparse.ArgumentParser(description="Book image pipeline")
    parser.add_argument("--step",    choices=["extract", "prompts", "generate", "status"])
    parser.add_argument("--chapter", type=int, default=None)
    parser.add_argument("--act",     type=int, default=None)
    parser.add_argument("--all",         action="store_true", help="Run extract+prompts+generate for all acts")
    parser.add_argument("--interactive",  action="store_true", help="Interactive chapter-by-chapter mode")
    args = parser.parse_args()

    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    if args.interactive:
        run_interactive()
        return

    if args.all:
        run_all(args.chapter)
        return

    if not args.step:
        parser.error("Either --step or --all is required")

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
