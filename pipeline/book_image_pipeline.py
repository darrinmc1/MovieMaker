"""
book_image_pipeline.py — Scene extraction and image generation for Book 1

WORKFLOW:
  Step 1: EXTRACT  — Gemini reads each act and extracts key scenes as JSON
  Step 2: PROMPTS  — Gemini writes a detailed image prompt for each scene
  Step 3: GENERATE — fal.ai generates the image for each prompt
  Step 4: STATUS   — Shows progress across all chapters

USAGE:
  python book_image_pipeline.py --step extract --book-folder "C:\\Users\\Client\\Desktop\\book chapter updates\\Book 1" --chapter 1
  python book_image_pipeline.py --step prompts --chapter 1
  python book_image_pipeline.py --step generate --chapter 1
  python book_image_pipeline.py --step status
"""

import argparse
import json
import os
import re
import time
import requests
from datetime import datetime, timezone
from pathlib import Path

import config
import claude_client


# ── Style constants ───────────────────────────────────────────────────────────

BOOK_STYLE = (
    "Epic fantasy illustration, painterly digital art style, "
    "cinematic composition with dramatic lighting, "
    "rich jewel-tone colour palette (deep crimson, obsidian black, ember gold, forest green, silver), "
    "detailed environment and atmospheric depth, "
    "mood-driven lighting (firelight, moonlight, shaft of daylight through stone), "
    "high detail, 16:9 widescreen aspect ratio"
)

CHARACTER_ANCHORS = {
    "Caelin": "auburn windswept hair, lean build, charred-red duster coat, glowing obsidian hex-plate embedded in right forearm with ember-motes visible inside, faint draconic scale-tattoos on neck",
    "Vex": "silver-streaked raven black hair undercut style, mismatched eyes (left green right gold), pointed half-elf ears, shadow-leather black armor, fingerless gloves, daggers at belt",
    "Thornik": "stocky dwarf 4ft tall, wild copper-red hair, long copper beard with gear-charms, amber eyes, multi-lens goggles on forehead, scorched leather apron, massive pack with brass contraptions",
    "Serana": "road-worn white and gold armor now sun-bleached and patinated, silver Dawn symbol at throat, bearing of someone trained in halls of power",
    "Elowen": "lichen-grey-green cloak alive-looking, vine circlet blooming with each breath, moss-ink tattoos on arms pulsing with verdant light, steady grief-patient brown eyes",
    "Durgan": "defined by absence of sound and presence of shadow — shadow stretches sideways from light independently, crescent bruises visible, economical stillness",
    "Nyxara": "theatrical precision in every pose, sleeves pulled down over darkening fingertips, controlled and deliberate in all movement",
    "Vharisax": "vast dragon coal-red to ash-crimson hide, fissured flanks glowing like forge embers, crumpled torn wings, eyes old gold ancient as mountains",
    "Jasper": "devastatingly handsome sharp cheekbones roguish smile, dark hair with silver streak, amber eyes, deep burgundy leather armor with gold clasps, rapier at hip, multiple rings",
    "Puddle": "half-orc, practical scarred build, surrounded by rats, built for underground survival",
}

CHAPTER_FILES = [
    (1,  "Ch1_revised.txt"),
    (2,  "Ch2_revised.txt"),
    (3,  "Ch3_revised.txt"),
    (4,  "Ch4_revised.txt"),
    (5,  "Ch5_revised.txt"),
    (6,  "Ch6_revised.txt"),
    (7,  "Ch7_revised.txt"),
    (8,  "Ch8_revised.txt"),
    (9,  "Ch9_revised.txt"),
    (10, "Ch10.txt"),
    (11, "Ch11.txt"),
    (12, "Ch12.txt"),
]

SCENES_JSON_PATH = Path(r"C:\Users\Client\Desktop\vbook-pipeline\book1_scenes.json")
REPORT_PATH      = Path(r"C:\Users\Client\Desktop\book1_scene_report.txt")


# ── Act splitting ─────────────────────────────────────────────────────────────

def split_into_acts(text: str) -> list[tuple[str, str]]:
    """Split chapter text into acts. Returns list of (act_name, act_text) tuples."""
    act_regex = re.compile(r'^(Act [IVX]+[:\s].*)$', re.MULTILINE)
    headers = [(m.group(1).strip(), m.start()) for m in act_regex.finditer(text)]

    if not headers:
        return [("Act I", text)]

    acts = []
    for i, (name, start) in enumerate(headers):
        end = headers[i + 1][1] if i + 1 < len(headers) else len(text)
        body = text[start + len(name):end].strip()
        acts.append((name, body))
    return acts


# ── Scene extraction ──────────────────────────────────────────────────────────

SYSTEM_SCENE_EXTRACTOR = """\
You are a visual development artist and storyboard supervisor for an epic fantasy novel.
Your job is to identify the most visually compelling and story-critical scenes in each act
for illustration as standalone images.

Select 2-4 scenes per act. Choose scenes that:
- Are visually distinct and striking as a single image
- Represent key story beats (appearances, emotional turning points, action climaxes, reveals)
- Would make a reader understand the story just by looking at them

You must return ONLY a valid JSON array. No preamble, no explanation outside the JSON.\
"""

def extract_scenes_from_act(chapter_num: int, act_num: int, act_name: str, act_text: str) -> list[dict]:
    characters_block = "\n".join(
        f"{name}: {desc}" for name, desc in CHARACTER_ANCHORS.items()
    )

    prompt = f"""\
## Character Visual References
{characters_block}

## Chapter {chapter_num} — {act_name}
{act_text[:8000]}

Extract 2-4 key scenes for illustration from this act. Return ONLY this JSON array:
[
  {{
    "title": "<short evocative title, 3-6 words>",
    "description": "<what is happening in this exact moment, 2-3 sentences>",
    "characters_present": ["<name>"],
    "setting": "<specific location, time of day, weather if relevant>",
    "mood": "<emotional tone>",
    "key_visual": "<the single most important visual element>",
    "lighting": "<quality and source of light>",
    "camera_angle": "<wide establishing / mid shot / close-up / low angle / etc>"
  }}
]\
"""

    print(f"      Extracting from {act_name}...")
    return claude_client.call_claude_json(SYSTEM_SCENE_EXTRACTOR, prompt, max_tokens=3000)


# ── Prompt generation ─────────────────────────────────────────────────────────

SYSTEM_PROMPT_WRITER = """\
You are an expert AI image prompt engineer specialising in epic fantasy illustration.
Write prompts for fal.ai image generation. Output ONLY the image prompt text, 80-150 words.\
"""

def generate_image_prompt(scene: dict) -> str:
    chars_in_scene = scene.get("characters_present", [])
    char_descriptions = "\n".join(
        f"- {name}: {CHARACTER_ANCHORS.get(name, '')}"
        for name in chars_in_scene
        if name in CHARACTER_ANCHORS
    )

    prompt = f"""\
Write an image generation prompt for this scene:

Title: {scene.get('title', '')}
Description: {scene.get('description', '')}
Setting: {scene.get('setting', '')}
Mood: {scene.get('mood', '')}
Key Visual: {scene.get('key_visual', '')}
Lighting: {scene.get('lighting', '')}
Camera Angle: {scene.get('camera_angle', '')}

Characters present:
{char_descriptions if char_descriptions else "No named characters — environment/action focus"}

Append this style block at the end:
{BOOK_STYLE}

Write the complete image prompt now:\
"""

    result = claude_client.call_claude(SYSTEM_PROMPT_WRITER, prompt, max_tokens=400)
    time.sleep(1)
    return result.strip()


# ── Image generation via fal.ai ───────────────────────────────────────────────

def generate_image_fal(prompt: str, scene_id: str) -> bytes | None:
    api_key = config.FAL_API_KEY
    if not api_key:
        print("    ⚠️  FAL_KEY not set — skipping image generation")
        return None

    url = "https://fal.run/fal-ai/flux/schnell"
    headers = {
        "Authorization": f"Key {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "prompt": prompt[:900],
        "image_size": "landscape_16_9",
        "num_inference_steps": 4,
        "num_images": 1,
        "enable_safety_checker": True,
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        response.raise_for_status()
        data = response.json()
        image_url = data["images"][0]["url"]
        img_response = requests.get(image_url, timeout=60)
        img_response.raise_for_status()
        return img_response.content
    except Exception as e:
        print(f"    ❌ fal.ai error for {scene_id}: {e}")
        return None


# ── Save images locally ───────────────────────────────────────────────────────

def save_image_locally(scene: dict, image_bytes: bytes) -> str:
    """Save image to local folder and return file path."""
    ch_num = scene["chapter"]
    scene_id = scene["scene_id"]
    output_dir = Path(r"C:\Users\Client\Desktop\book1_images") / f"chapter_{ch_num:02d}"
    output_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{scene_id}_{scene.get('title','scene').replace(' ','_')[:30]}.png"
    filepath = output_dir / filename
    filepath.write_bytes(image_bytes)
    return str(filepath)


# ── Load / save scenes JSON ───────────────────────────────────────────────────

def load_scenes() -> list[dict]:
    if SCENES_JSON_PATH.exists():
        return json.loads(SCENES_JSON_PATH.read_text(encoding="utf-8"))
    return []


def save_scenes(scenes: list[dict]) -> None:
    SCENES_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    SCENES_JSON_PATH.write_text(
        json.dumps(scenes, indent=2, ensure_ascii=False), encoding="utf-8"
    )


# ── Report ────────────────────────────────────────────────────────────────────

def save_scene_report(all_scenes: list[dict]) -> None:
    lines = [
        "=" * 70,
        "  THE CONCORD OF NINE — BOOK 1 — SCENE REPORT",
        f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"  Total scenes: {len(all_scenes)}",
        "=" * 70, "",
    ]
    current_chapter = None
    for scene in all_scenes:
        ch = scene.get("chapter")
        if ch != current_chapter:
            current_chapter = ch
            lines += ["", f"{'─' * 60}", f"  CHAPTER {ch}", f"{'─' * 60}", ""]
        lines += [
            f"Scene {scene.get('scene_number', '?')} [{scene.get('act_name', '')}]: {scene.get('title', '')}",
            f"  Setting:    {scene.get('setting', '')}",
            f"  Mood:       {scene.get('mood', '')}",
            f"  Characters: {', '.join(scene.get('characters_present', []))}",
            f"  Key Visual: {scene.get('key_visual', '')}",
            "",
            f"  PROMPT: {scene.get('image_prompt', '(not yet generated)')}",
            f"  FILE:   {scene.get('local_path', scene.get('embed_url', '(not yet generated)'))}",
            "",
        ]
    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n📄 Report saved: {REPORT_PATH}")


# ── Steps ─────────────────────────────────────────────────────────────────────

def step_extract(book_folder: str, chapter_filter: int | None = None) -> None:
    print(f"\n── STEP 1: SCENE EXTRACTION (per act) ──────────────────────────────")

    existing = load_scenes()
    all_scenes = list(existing)

    for ch_num, filename in CHAPTER_FILES:
        if chapter_filter and ch_num != chapter_filter:
            continue

        already = [s for s in existing if s.get("chapter") == ch_num]
        if already:
            print(f"  Chapter {ch_num}: {len(already)} scenes already extracted — skipping")
            continue

        filepath = Path(book_folder) / filename
        if not filepath.exists():
            print(f"  Chapter {ch_num}: ⚠️  File not found — {filename}")
            continue

        text = filepath.read_text(encoding="utf-8", errors="replace")
        acts = split_into_acts(text)
        print(f"  Chapter {ch_num}: {len(acts)} acts found")

        chapter_scenes = []
        scene_counter = 1

        for act_idx, (act_name, act_text) in enumerate(acts, start=1):
            try:
                scenes = extract_scenes_from_act(ch_num, act_idx, act_name, act_text)
                for scene in scenes:
                    scene["scene_id"] = f"ch{ch_num:02d}_s{scene_counter:02d}"
                    scene["chapter"] = ch_num
                    scene["act_number"] = act_idx
                    scene["act_name"] = act_name
                    scene["scene_number"] = scene_counter
                    scene_counter += 1
                chapter_scenes.extend(scenes)
                print(f"      ✅ {len(scenes)} scenes")
            except Exception as e:
                print(f"      ⚠️  Failed: {e}")
            time.sleep(2)

        if chapter_scenes:
            all_scenes.extend(chapter_scenes)
            save_scenes(all_scenes)
            print(f"  Chapter {ch_num}: ✅ {len(chapter_scenes)} total scenes extracted")

    print(f"\nTotal scenes extracted: {len(all_scenes)}")
    save_scene_report(all_scenes)
    print(f"Then: python book_image_pipeline.py --step prompts")


def step_prompts(chapter_filter: int | None = None) -> None:
    print(f"\n── STEP 2: PROMPT GENERATION ───────────────────────────────")

    scenes = load_scenes()
    if not scenes:
        print("No scenes found. Run --step extract first.")
        return

    updated = 0
    for scene in scenes:
        if chapter_filter and scene.get("chapter") != chapter_filter:
            continue
        if scene.get("image_prompt"):
            continue

        prompt = generate_image_prompt(scene)
        scene["image_prompt"] = prompt
        updated += 1
        print(f"  ✅ {scene['scene_id']}: {scene.get('title', '')[:50]}")

    save_scenes(scenes)
    save_scene_report(scenes)
    print(f"\n{updated} prompts generated.")
    print(f"Next: python book_image_pipeline.py --step generate")


def step_generate(chapter_filter: int | None = None) -> None:
    print(f"\n── STEP 3: IMAGE GENERATION ────────────────────────────────")

    scenes = load_scenes()
    if not scenes:
        print("No scenes found. Run --step extract first.")
        return

    generated = 0
    for scene in scenes:
        if chapter_filter and scene.get("chapter") != chapter_filter:
            continue
        if scene.get("local_path") or scene.get("drive_file_id"):
            print(f"  {scene['scene_id']}: already generated — skipping")
            continue
        if not scene.get("image_prompt"):
            print(f"  {scene['scene_id']}: no prompt — run --step prompts first")
            continue

        print(f"  Generating: {scene['scene_id']} — {scene.get('title', '')[:50]}...")

        image_bytes = generate_image_fal(scene["image_prompt"], scene["scene_id"])
        if not image_bytes:
            continue

        local_path = save_image_locally(scene, image_bytes)
        scene["local_path"] = local_path
        scene["generated_at"] = datetime.now(timezone.utc).isoformat()
        save_scenes(scenes)
        generated += 1
        print(f"    ✅ Saved: {local_path}")
        time.sleep(1)

    save_scene_report(scenes)
    print(f"\n{generated} images generated and saved to C:\\Users\\Client\\Desktop\\book1_images\\")


def step_status() -> None:
    scenes = load_scenes()
    if not scenes:
        print("No scenes extracted yet.")
        return

    total        = len(scenes)
    with_prompts = sum(1 for s in scenes if s.get("image_prompt"))
    with_images  = sum(1 for s in scenes if s.get("local_path") or s.get("drive_file_id"))

    print(f"\n── IMAGE PIPELINE STATUS ───────────────────────────────────")
    print(f"  Total scenes:  {total}")
    print(f"  With prompts:  {with_prompts} / {total}")
    print(f"  With images:   {with_images} / {total}")

    by_chapter: dict[int, dict] = {}
    for s in scenes:
        ch = s.get("chapter", 0)
        by_chapter.setdefault(ch, {"scenes": 0, "prompts": 0, "images": 0})
        by_chapter[ch]["scenes"] += 1
        if s.get("image_prompt"): by_chapter[ch]["prompts"] += 1
        if s.get("local_path") or s.get("drive_file_id"): by_chapter[ch]["images"] += 1

    print(f"\n  {'Ch':<5} {'Scenes':<8} {'Prompts':<10} {'Images'}")
    for ch in sorted(by_chapter.keys()):
        d = by_chapter[ch]
        print(f"  {ch:<5} {d['scenes']:<8} {d['prompts']:<10} {d['images']}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="VBook Image Pipeline")
    parser.add_argument("--step", choices=["extract", "prompts", "generate", "all", "status"], required=True)
    parser.add_argument("--book-folder", default=r"C:\Users\Client\Desktop\book chapter updates\Book 1")
    parser.add_argument("--chapter", type=int, default=None)
    args = parser.parse_args()

    if args.step == "extract":
        step_extract(args.book_folder, args.chapter)
    elif args.step == "prompts":
        step_prompts(args.chapter)
    elif args.step == "generate":
        step_generate(args.chapter)
    elif args.step == "status":
        step_status()
    elif args.step == "all":
        step_extract(args.book_folder, args.chapter)
        step_prompts(args.chapter)
        step_generate(args.chapter)


if __name__ == "__main__":
    main()
