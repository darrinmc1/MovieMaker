"""
book_image_pipeline.py — Scene extraction and image generation for Book 1

WORKFLOW:
  Step 1: EXTRACT  — Gemini reads each chapter and extracts key scenes as JSON
  Step 2: PROMPTS  — Gemini writes a detailed image prompt for each scene
  Step 3: GENERATE — fal.ai generates the image for each prompt
  Step 4: SAVE     — Images saved to Google Drive, logged to Sheets Images tab
  Step 5: REPORT   — Saves a full scene/prompt report as a .txt file

USAGE:
  # Extract scenes from all chapters (run first):
  python book_image_pipeline.py --step extract --book-folder "C:\\Users\\Client\\Desktop\\book chapter updates"

  # Review the scene report, then generate images:
  python book_image_pipeline.py --step generate

  # Do both in one go:
  python book_image_pipeline.py --step all --book-folder "C:\\Users\\Client\\Desktop\\book chapter updates"

  # Generate images for one chapter only:
  python book_image_pipeline.py --step generate --chapter 1

  # Check status:
  python book_image_pipeline.py --step status
"""

import argparse
import json
import os
import time
import requests
from datetime import datetime, timezone
from pathlib import Path

import config
import claude_client
import google_clients
import drive_structure


# ── Style constants ───────────────────────────────────────────────────────────

# Master visual style for all Book 1 images — edit this to change the look of the whole book
BOOK_STYLE = (
    "Epic fantasy illustration, painterly digital art style, "
    "cinematic composition with dramatic lighting, "
    "rich jewel-tone colour palette (deep crimson, obsidian black, ember gold, forest green, silver), "
    "detailed environment and atmospheric depth, "
    "character designs consistent with established descriptions, "
    "mood-driven lighting (firelight, moonlight, shaft of daylight through stone), "
    "high detail, 16:9 widescreen aspect ratio"
)

# Character appearance anchors — included in every prompt where the character appears
# to keep visual consistency across all generated images
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

# Chapter files in order
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

# Where to save the scene data JSON between steps
SCENES_JSON_PATH = Path(r"C:\Users\Client\Desktop\vbook-pipeline\book1_scenes.json")
REPORT_PATH      = Path(r"C:\Users\Client\Desktop\book1_scene_report.txt")


# ── Scene extraction ──────────────────────────────────────────────────────────

SYSTEM_SCENE_EXTRACTOR = """\
You are a visual development artist and storyboard supervisor for an epic fantasy novel.
Your job is to identify the most visually compelling and story-critical scenes in each chapter
for illustration as standalone images.

Select scenes that:
- Are visually distinct and striking as a single image
- Represent key story beats (first appearances, emotional turning points, action climaxes, reveals)
- Cover a range of moods and settings across the chapter
- Would make a reader understand the story just by looking at them

Select 6-10 scenes per chapter. More for action-heavy chapters, fewer for quieter ones.

You must return ONLY a valid JSON array. No preamble, no explanation outside the JSON.\
"""

def extract_scenes_from_chapter(chapter_num: int, chapter_text: str) -> list[dict]:
    characters_block = "\n".join(
        f"{name}: {desc}"
        for name, desc in CHARACTER_ANCHORS.items()
    )

    prompt = f"""\
## Character Visual References
{characters_block}

## Chapter {chapter_num} Text
{chapter_text[:14000]}

Extract 6-10 key scenes for illustration. Return ONLY this JSON array:
[
  {{
    "scene_id": "ch{chapter_num:02d}_s01",
    "chapter": {chapter_num},
    "scene_number": 1,
    "title": "<short evocative title, 3-6 words>",
    "description": "<what is happening in this exact moment, 2-3 sentences>",
    "characters_present": ["<name>", ...],
    "setting": "<specific location, time of day, weather if relevant>",
    "mood": "<emotional tone: e.g. tense dread, triumphant relief, quiet grief>",
    "key_visual": "<the single most important visual element — what the eye goes to first>",
    "lighting": "<quality and source of light in this scene>",
    "camera_angle": "<suggested framing: wide establishing / mid shot / close-up / over-shoulder / low angle / etc>",
    "story_importance": "<why this scene matters to the plot or character — one sentence>",
    "movie_notes": "<additional notes for future video/animation use: camera movement, sound, timing>"
  }},
  ...
]\
"""

    print(f"    Extracting scenes from Chapter {chapter_num}...")
    try:
        result = claude_client.call_claude_json(
            SYSTEM_SCENE_EXTRACTOR, prompt, max_tokens=4000
        )
        # Fix scene IDs to be consistent
        for i, scene in enumerate(result, start=1):
            scene["scene_id"] = f"ch{chapter_num:02d}_s{i:02d}"
            scene["chapter"] = chapter_num
            scene["scene_number"] = i
        return result
    except ValueError as e:
        print(f"    ⚠️  Scene extraction failed for Ch{chapter_num}: {e}")
        return []


# ── Prompt generation ─────────────────────────────────────────────────────────

SYSTEM_PROMPT_WRITER = """\
You are an expert AI image prompt engineer specialising in epic fantasy illustration.
You write prompts for fal.ai's image generation models.

Your prompts must:
- Open with the core visual subject (what we see first)
- Include specific character appearance details for anyone present
- Describe the environment with sensory specificity
- Specify lighting with precision (source, quality, colour, direction)
- Include the emotional/mood tone
- End with the style block
- Be 80-150 words — detailed but not bloated
- Never use prohibited words: realistic, photorealistic, photograph, real person

Output ONLY the image prompt text. No preamble, no explanation.\
"""

def generate_image_prompt(scene: dict) -> str:
    chars_in_scene = scene.get("characters_present", [])
    char_descriptions = "\n".join(
        f"- {name}: {CHARACTER_ANCHORS.get(name, 'see character profile')}"
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

Characters present and their appearance:
{char_descriptions if char_descriptions else "No named characters — environment/action focus"}

Master style to append at the end of every prompt:
{BOOK_STYLE}

Write the complete image prompt now:\
"""

    result = claude_client.call_claude(SYSTEM_PROMPT_WRITER, prompt, max_tokens=400)
    time.sleep(1)
    return result.strip()


# ── Image generation via fal.ai ───────────────────────────────────────────────

def generate_image_fal(prompt: str, scene_id: str) -> bytes | None:
    """Generate an image using fal.ai and return raw PNG bytes."""
    api_key = config.FAL_API_KEY
    if not api_key:
        print("    ⚠️  FAL_KEY not set in .env — skipping image generation")
        return None

    url = "https://fal.run/fal-ai/flux/schnell"
    headers = {
        "Authorization": f"Key {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "prompt": prompt[:900],  # fal.ai prompt limit
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

        # Download the image
        img_response = requests.get(image_url, timeout=60)
        img_response.raise_for_status()
        return img_response.content

    except Exception as e:
        print(f"    ❌ fal.ai error for {scene_id}: {e}")
        return None


# ── Drive saving ──────────────────────────────────────────────────────────────

def save_image_to_drive(drive, scene: dict, image_bytes: bytes) -> str:
    """Save image to Drive under VBook/Images/Chapter_XX/"""
    ch_num = scene["chapter"]
    scene_id = scene["scene_id"]

    # Get or create chapter images folder
    images_folder = drive_structure.get_act_images_folder(drive, ch_num, 0)
    # Use chapter-level folder (act 0 = chapter level)
    chapter_images = google_clients.get_or_create_folder(
        drive,
        f"Chapter_{ch_num:02d}",
        drive_structure._folder_cache.get("images", config.GOOGLE_DRIVE_ROOT_FOLDER_ID)
    )

    filename = f"{scene_id}_{scene.get('title', 'scene').replace(' ', '_')[:30]}.png"
    drive_file_id = google_clients.upload_binary_file(
        drive, filename, image_bytes, "image/png", chapter_images
    )
    google_clients.make_file_public(drive, drive_file_id)
    embed_url = google_clients.get_image_embed_url(drive_file_id)
    return drive_file_id, embed_url


# ── Report generation ─────────────────────────────────────────────────────────

def save_scene_report(all_scenes: list[dict]) -> None:
    lines = [
        "=" * 70,
        "  THE CONCORD OF NINE — BOOK 1",
        "  SCENE BREAKDOWN & IMAGE PROMPT REPORT",
        f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"  Total scenes: {len(all_scenes)}",
        "=" * 70,
        "",
    ]

    current_chapter = None
    for scene in all_scenes:
        ch = scene.get("chapter")
        if ch != current_chapter:
            current_chapter = ch
            lines += [
                "",
                f"{'─' * 60}",
                f"  CHAPTER {ch}",
                f"{'─' * 60}",
                "",
            ]

        lines += [
            f"Scene {scene.get('scene_number', '?')}: {scene.get('title', '')}",
            f"  ID:          {scene.get('scene_id', '')}",
            f"  Setting:     {scene.get('setting', '')}",
            f"  Mood:        {scene.get('mood', '')}",
            f"  Characters:  {', '.join(scene.get('characters_present', []))}",
            f"  Key Visual:  {scene.get('key_visual', '')}",
            f"  Lighting:    {scene.get('lighting', '')}",
            f"  Angle:       {scene.get('camera_angle', '')}",
            f"  Importance:  {scene.get('story_importance', '')}",
            f"  Movie Notes: {scene.get('movie_notes', '')}",
            "",
            f"  IMAGE PROMPT:",
            f"  {scene.get('image_prompt', '(not yet generated)')}",
            "",
            f"  Drive ID:    {scene.get('drive_file_id', '(not yet generated)')}",
            f"  Image URL:   {scene.get('embed_url', '(not yet generated)')}",
            "",
        ]

    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n📄 Report saved: {REPORT_PATH}")


# ── Load / save scenes JSON ───────────────────────────────────────────────────

def load_scenes() -> list[dict]:
    if SCENES_JSON_PATH.exists():
        return json.loads(SCENES_JSON_PATH.read_text(encoding="utf-8"))
    return []


def save_scenes(scenes: list[dict]) -> None:
    SCENES_JSON_PATH.write_text(
        json.dumps(scenes, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )


# ── Steps ─────────────────────────────────────────────────────────────────────

def step_extract(book_folder: str, chapter_filter: int | None = None) -> None:
    """Read chapters and extract scenes using Gemini."""
    print(f"\n── STEP 1: SCENE EXTRACTION ────────────────────────────────")

    existing = load_scenes()
    existing_ids = {s["scene_id"] for s in existing}

    all_scenes = list(existing)

    for ch_num, filename in CHAPTER_FILES:
        if chapter_filter and ch_num != chapter_filter:
            continue

        # Skip if already extracted
        already = [s for s in existing if s.get("chapter") == ch_num]
        if already:
            print(f"  Chapter {ch_num}: {len(already)} scenes already extracted — skipping")
            continue

        path = Path(book_folder) / filename
        if not path.exists():
            print(f"  Chapter {ch_num}: ⚠️  File not found — {filename}")
            continue

        text = path.read_text(encoding="utf-8", errors="replace")
        scenes = extract_scenes_from_chapter(ch_num, text)

        if scenes:
            all_scenes.extend(scenes)
            save_scenes(all_scenes)
            print(f"  Chapter {ch_num}: ✅ {len(scenes)} scenes extracted")
        
        time.sleep(3)

    print(f"\nTotal scenes extracted: {len(all_scenes)}")
    save_scene_report(all_scenes)
    print(f"\nNext: review {REPORT_PATH}")
    print(f"Then: python book_image_pipeline.py --step prompts")


def step_prompts(chapter_filter: int | None = None) -> None:
    """Generate image prompts for all extracted scenes."""
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
            continue  # Already has prompt

        prompt = generate_image_prompt(scene)
        scene["image_prompt"] = prompt
        updated += 1
        print(f"  ✅ {scene['scene_id']}: {scene.get('title', '')[:50]}")

    save_scenes(scenes)
    save_scene_report(scenes)
    print(f"\n{updated} prompts generated. Report updated.")
    print(f"Next: python book_image_pipeline.py --step generate")


def step_generate(chapter_filter: int | None = None) -> None:
    """Generate images via fal.ai and save to Drive."""
    print(f"\n── STEP 3: IMAGE GENERATION ────────────────────────────────")

    scenes = load_scenes()
    if not scenes:
        print("No scenes found. Run --step extract first.")
        return

    drive  = google_clients.get_drive_service()
    sheets = google_clients.get_sheets_service()
    drive_structure.ensure_structure(drive)

    generated = 0
    for scene in scenes:
        if chapter_filter and scene.get("chapter") != chapter_filter:
            continue
        if scene.get("drive_file_id"):
            print(f"  {scene['scene_id']}: already generated — skipping")
            continue
        if not scene.get("image_prompt"):
            print(f"  {scene['scene_id']}: no prompt yet — run --step prompts first")
            continue

        print(f"  Generating: {scene['scene_id']} — {scene.get('title', '')[:50]}...")

        image_bytes = generate_image_fal(scene["image_prompt"], scene["scene_id"])
        if not image_bytes:
            continue

        # Save to Drive
        try:
            ch_num = scene["chapter"]
            chapter_images_folder = google_clients.get_or_create_folder(
                drive,
                f"Chapter_{ch_num:02d}",
                drive_structure.ensure_structure(drive)["images"]
            )
            filename = f"{scene['scene_id']}_{scene.get('title','scene').replace(' ','_')[:25]}.png"
            drive_file_id = google_clients.upload_binary_file(
                drive, filename, image_bytes, "image/png", chapter_images_folder
            )
            google_clients.make_file_public(drive, drive_file_id)
            embed_url = google_clients.get_image_embed_url(drive_file_id)

            scene["drive_file_id"] = drive_file_id
            scene["embed_url"] = embed_url
            scene["generated_at"] = datetime.now(timezone.utc).isoformat()

            # Log to Sheets
            google_clients.sheets_append(sheets, config.SHEET_IMAGES, [
                str(ch_num),
                "",  # act
                str(scene.get("scene_number", "")),
                scene.get("description", ""),
                ", ".join(scene.get("characters_present", [])),
                scene.get("image_prompt", ""),
                embed_url,
                f"https://drive.google.com/file/d/{drive_file_id}/view",
                "generated",
                scene.get("generated_at", ""),
            ])

            save_scenes(scenes)
            generated += 1
            print(f"    ✅ Saved: {filename}")
            print(f"    🔗 {embed_url}")

        except Exception as e:
            print(f"    ❌ Drive save failed: {e}")

        time.sleep(2)

    save_scene_report(scenes)
    print(f"\n{generated} images generated and saved to Drive.")


def step_status() -> None:
    """Print current status of the image pipeline."""
    scenes = load_scenes()
    if not scenes:
        print("No scenes extracted yet. Run --step extract first.")
        return

    total = len(scenes)
    with_prompts = sum(1 for s in scenes if s.get("image_prompt"))
    with_images  = sum(1 for s in scenes if s.get("drive_file_id"))

    print(f"\n── IMAGE PIPELINE STATUS ───────────────────────────────────")
    print(f"  Total scenes extracted: {total}")
    print(f"  Prompts generated:      {with_prompts} / {total}")
    print(f"  Images generated:       {with_images} / {total}")
    print(f"  Scenes JSON:            {SCENES_JSON_PATH}")
    print(f"  Report:                 {REPORT_PATH}")

    by_chapter = {}
    for s in scenes:
        ch = s.get("chapter", "?")
        by_chapter.setdefault(ch, {"scenes": 0, "prompts": 0, "images": 0})
        by_chapter[ch]["scenes"] += 1
        if s.get("image_prompt"): by_chapter[ch]["prompts"] += 1
        if s.get("drive_file_id"): by_chapter[ch]["images"] += 1

    print(f"\n  {'Ch':<5} {'Scenes':<8} {'Prompts':<10} {'Images':<8}")
    print(f"  {'──':<5} {'──────':<8} {'───────':<10} {'──────':<8}")
    for ch in sorted(by_chapter.keys()):
        d = by_chapter[ch]
        print(f"  {ch:<5} {d['scenes']:<8} {d['prompts']:<10} {d['images']:<8}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="VBook Image Pipeline — scene extraction and image generation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Steps (run in order):
  python book_image_pipeline.py --step extract  --book-folder "C:\\Users\\Client\\Desktop\\book chapter updates"
  python book_image_pipeline.py --step prompts
  python book_image_pipeline.py --step generate
  python book_image_pipeline.py --step status

Or run all at once:
  python book_image_pipeline.py --step all --book-folder "C:\\Users\\Client\\Desktop\\book chapter updates"
        """
    )
    parser.add_argument(
        "--step",
        choices=["extract", "prompts", "generate", "all", "status"],
        required=True,
    )
    parser.add_argument(
        "--book-folder",
        default=r"C:\Users\Client\Desktop\book chapter updates",
        help="Folder containing chapter .txt files",
    )
    parser.add_argument(
        "--chapter",
        type=int,
        default=None,
        help="Process only this chapter number",
    )

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
