"""
book_image_pipeline.py — Scene extraction and image generation for Book 1

WORKFLOW:
  Step 0: REFS     — Generate one reference image per main character (run once)
  Step 1: EXTRACT  — Gemini reads each act and extracts key scenes as JSON
  Step 2: PROMPTS  — Gemini writes a detailed image prompt for each scene
  Step 3: GENERATE — fal.ai generates images with character/location consistency
  Step 4: STATUS   — Shows progress across all chapters

USAGE:
  python book_image_pipeline.py --step refs
  python book_image_pipeline.py --step extract --book-folder "C:\\Users\\Client\\Desktop\\book chapter updates\\Book 1" --chapter 1
  python book_image_pipeline.py --step prompts --chapter 1
  python book_image_pipeline.py --step generate --chapter 1
  python book_image_pipeline.py --step status
"""

import argparse
import base64
import json
import re
import time
import requests
from datetime import datetime, timezone
from pathlib import Path

import config
import claude_client


# ── Style ─────────────────────────────────────────────────────────────────────

BOOK_STYLE = (
    "Epic fantasy illustration, painterly digital art style, "
    "cinematic composition with dramatic lighting, "
    "rich jewel-tone colour palette — deep crimson, obsidian black, ember gold, forest green, silver, "
    "detailed environment and atmospheric depth, "
    "mood-driven lighting: firelight, moonlight, shafts of daylight through stone, "
    "high detail, 16:9 widescreen aspect ratio"
)

# ── Character anchors — used in every prompt where character appears ──────────

CHARACTER_ANCHORS = {
    "Caelin": (
        "young man, auburn windswept hair, lean athletic build, charred-red long duster coat, "
        "glowing obsidian hex-plate embedded in right forearm with ember-motes drifting inside it, "
        "faint draconic scale-tattoos curling up his neck"
    ),
    "Vex": (
        "half-elf, silver-streaked raven-black hair in an undercut, mismatched eyes: left vivid green right burnished gold, "
        "pointed ears, shadow-leather black armor, fingerless gloves, twin daggers at belt, "
        "compact and quick-looking"
    ),
    "Thornik": (
        "dwarf, 4 feet tall, wild copper-red hair, very long copper beard hung with small gear-charms, "
        "amber eyes, multi-lens brass goggles pushed up on forehead, scorched leather apron, "
        "enormous backpack bristling with brass contraptions and coiled tubing"
    ),
    "Serana": (
        "tall woman, road-worn white and gold plate armor sun-bleached and patinated with age, "
        "silver Dawn-crest medallion at her throat, straight-backed bearing of someone trained in halls of power"
    ),
    "Elowen": (
        "woman, lichen-grey-green cloak that moves as if alive, "
        "vine circlet on her head with small flowers blooming along it, "
        "moss-ink green tattoos on both forearms pulsing faint emerald light, "
        "steady grief-patient brown eyes"
    ),
    "Durgan": (
        "lean man, his shadow falls the wrong direction from every light source, "
        "crescent-shaped bruises under his eyes, moves with absolute economical stillness, "
        "dark nondescript clothing"
    ),
    "Nyxara": (
        "woman, theatrical precise posture, sleeves deliberately pulled low over her hands, "
        "fingertips darkening to shadow-black, controlled and deliberate in every movement"
    ),
    "Vharisax": (
        "enormous ancient dragon, coal-red to ash-crimson scaled hide, "
        "deep fissures in flanks glowing orange like forge-cracks, "
        "crumpled torn wings, eyes the colour of old gold, vast and mountain-slow"
    ),
    "Jasper": (
        "strikingly handsome man, sharp cheekbones, roguish smile, dark hair with a silver streak, "
        "amber eyes, deep burgundy leather armor with gold clasps, rapier at hip, "
        "multiple rings on both hands"
    ),
    "Puddle": (
        "half-orc, practical scarred build, several rats visible on his shoulders or nearby, "
        "gear suited for underground survival"
    ),
}

# ── Location anchors — ensures each location looks consistent across images ───

LOCATION_ANCHORS = {
    "Thornwick": (
        "small medieval village utterly devastated by dragonfire — but unlike normal fire damage, "
        "stone has melted and re-solidified into smooth glossy curves, wooden beams turned translucent, "
        "doorframes sagging into organic shapes, cobblestones ridged like cooled lava, "
        "everything coated in thick pale ash, eerie preserved silence"
    ),
    "Ashford": (
        "large walled city, broad cobblestone streets, sandstone buildings with iron lanterns, "
        "busy market district, banners of the Accord hanging from towers"
    ),
    "The Crater": (
        "vast circular depression in earth where a dragon died, "
        "obsidian glass floor fused from superheated sand and rock, "
        "faint ember-glow still pulsing in deep cracks, "
        "smoking at the edges, unnaturally hot air shimmering above it"
    ),
    "Forest Road": (
        "ancient forest, massive moss-covered oaks arching over a dirt road, "
        "shafts of filtered green-gold light, dense undergrowth, "
        "roots crossing the path, bird sounds, sense of deep age"
    ),
    "Tavern": (
        "low-ceilinged medieval tavern, heavy oak beams, roaring fireplace, "
        "rough wooden tables, tallow candles in iron holders, "
        "smell of woodsmoke and ale implied in the warm amber light"
    ),
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

_PIPELINE_DIR    = Path(__file__).parent
SCENES_JSON_PATH = _PIPELINE_DIR / "data" / "book1_scenes.json"
REPORT_PATH      = _PIPELINE_DIR / "data" / "book1_scene_report.txt"
REFS_DIR         = _PIPELINE_DIR / "data" / "character_refs"


# ── fal.ai helpers ────────────────────────────────────────────────────────────

def _fal_post(endpoint: str, payload: dict) -> dict:
    """POST to a fal.ai endpoint and return JSON response."""
    api_key = config.FAL_API_KEY
    response = requests.post(
        f"https://fal.run/{endpoint}",
        headers={"Authorization": f"Key {api_key}", "Content-Type": "application/json"},
        json=payload,
        timeout=180,
    )
    response.raise_for_status()
    return response.json()


def _download_image(url: str) -> bytes:
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    return r.content


def _image_to_data_uri(image_bytes: bytes) -> str:
    b64 = base64.b64encode(image_bytes).decode()
    return f"data:image/png;base64,{b64}"


# ── Step 0: Generate character reference images ───────────────────────────────

CHARACTER_REF_PROMPTS = {
    "Caelin": (
        "Full body portrait of a young man: auburn windswept hair, lean athletic build, "
        "charred-red long duster coat, glowing obsidian hex-plate embedded in right forearm "
        "with ember-motes floating inside it, faint draconic scale-tattoos on neck. "
        "Neutral standing pose, facing camera, clear full-body view. "
        "Epic fantasy illustration style, painterly, dramatic rim lighting, dark background."
    ),
    "Vex": (
        "Full body portrait of a half-elf: silver-streaked raven-black undercut hair, "
        "mismatched eyes left green right gold, pointed ears, shadow-leather black armor, "
        "fingerless gloves, twin daggers at belt. "
        "Neutral standing pose, facing camera, clear full-body view. "
        "Epic fantasy illustration style, painterly, dramatic rim lighting, dark background."
    ),
    "Thornik": (
        "Full body portrait of a dwarf 4 feet tall: wild copper-red hair, very long copper beard "
        "with small gear-charms woven in, amber eyes, multi-lens brass goggles on forehead, "
        "scorched leather apron, enormous backpack with brass contraptions. "
        "Neutral standing pose, facing camera, clear full-body view. "
        "Epic fantasy illustration style, painterly, dramatic rim lighting, dark background."
    ),
    "Serana": (
        "Full body portrait of a tall woman in road-worn white and gold plate armor, "
        "sun-bleached and patinated, silver Dawn-crest medallion at throat, "
        "straight-backed dignified bearing. "
        "Neutral standing pose, facing camera, clear full-body view. "
        "Epic fantasy illustration style, painterly, dramatic rim lighting, dark background."
    ),
    "Vharisax": (
        "Full body portrait of an enormous ancient dragon: coal-red to ash-crimson scaled hide, "
        "deep fissures in flanks glowing orange like forge-cracks, crumpled torn wings, "
        "eyes old gold colour. Resting pose on rocky ground, full body visible. "
        "Epic fantasy illustration style, painterly, dramatic lighting, dark background."
    ),
}


def step_refs() -> None:
    """Generate one reference image per main character using flux/dev."""
    print(f"\n── STEP 0: CHARACTER REFERENCE IMAGES ──────────────────────────────")
    REFS_DIR.mkdir(parents=True, exist_ok=True)

    for char_name, ref_prompt in CHARACTER_REF_PROMPTS.items():
        ref_path = REFS_DIR / f"{char_name.lower()}_ref.png"
        if ref_path.exists():
            print(f"  {char_name}: already exists — skipping")
            continue

        print(f"  Generating reference for {char_name}...")
        try:
            data = _fal_post("fal-ai/flux/dev", {
                "prompt": ref_prompt,
                "image_size": "portrait_4_3",
                "num_inference_steps": 28,
                "guidance_scale": 3.5,
                "num_images": 1,
                "enable_safety_checker": True,
            })
            image_bytes = _download_image(data["images"][0]["url"])
            ref_path.write_bytes(image_bytes)
            print(f"  ✅ Saved: {ref_path}")
        except Exception as e:
            print(f"  ❌ Failed for {char_name}: {e}")
        time.sleep(2)

    print(f"\nReference images saved to: {REFS_DIR}")
    print("Review them — if a character looks wrong, delete the file and re-run --step refs")
    print("Next: python book_image_pipeline.py --step extract ...")


# ── Act splitting ─────────────────────────────────────────────────────────────

def split_into_acts(text: str) -> list[tuple[str, str]]:
    act_regex = re.compile(r'^(Act [IVX]+[:\s].*)$', re.MULTILINE)
    headers = [(m.group(1).strip(), m.start()) for m in act_regex.finditer(text)]
    if not headers:
        return [("Act I", text)]
    acts = []
    for i, (name, start) in enumerate(headers):
        end = headers[i + 1][1] if i + 1 < len(headers) else len(text)
        acts.append((name, text[start + len(name):end].strip()))
    return acts


# ── Scene extraction ──────────────────────────────────────────────────────────

SYSTEM_SCENE_EXTRACTOR = """\
You are a visual development artist and storyboard supervisor for an epic fantasy novel.
Identify the most visually compelling and story-critical scenes in each act for illustration.

Select 2-4 scenes per act. Choose scenes that are visually distinct and striking as single images.
Also identify which named location from this list the scene takes place in (if any):
Thornwick, Ashford, The Crater, Forest Road, Tavern — or write the specific location name if different.

Return ONLY a valid JSON array. No preamble, no explanation.\
"""


def extract_scenes_from_act(chapter_num: int, act_num: int, act_name: str, act_text: str) -> list[dict]:
    characters_block = "\n".join(f"{n}: {d}" for n, d in CHARACTER_ANCHORS.items())
    prompt = f"""\
## Character Visual References
{characters_block}

## Chapter {chapter_num} — {act_name}
{act_text[:8000]}

Extract 2-4 key scenes. Return ONLY this JSON array:
[
  {{
    "title": "<3-6 word evocative title>",
    "description": "<what is happening right now, 2-3 sentences>",
    "characters_present": ["<name>"],
    "location_key": "<Thornwick|Ashford|The Crater|Forest Road|Tavern|other — write exact name>",
    "setting": "<specific location detail, time of day, weather>",
    "mood": "<emotional tone>",
    "key_visual": "<the single most important visual element>",
    "lighting": "<quality and source of light>",
    "camera_angle": "<wide establishing|mid shot|close-up|low angle|over-shoulder>"
  }}
]\
"""
    print(f"      Extracting from {act_name}...")
    return claude_client.call_claude_json(SYSTEM_SCENE_EXTRACTOR, prompt, max_tokens=3000)


# ── Prompt generation ─────────────────────────────────────────────────────────

SYSTEM_PROMPT_WRITER = """\
You are an expert AI image prompt engineer for epic fantasy illustration.
Write prompts for fal.ai. Output ONLY the image prompt, 80-150 words. No preamble.\
"""


def generate_image_prompt(scene: dict) -> str:
    chars_in_scene = scene.get("characters_present", [])
    char_block = "\n".join(
        f"- {n}: {CHARACTER_ANCHORS[n]}"
        for n in chars_in_scene if n in CHARACTER_ANCHORS
    )

    # Add location anchor if we recognise the location
    location_key = scene.get("location_key", "")
    location_anchor = LOCATION_ANCHORS.get(location_key, "")
    location_block = f"\nLocation visual anchor — {location_key}: {location_anchor}" if location_anchor else ""

    prompt = f"""\
Write an image generation prompt for this scene:

Title: {scene.get('title', '')}
Description: {scene.get('description', '')}
Setting: {scene.get('setting', '')}
Mood: {scene.get('mood', '')}
Key Visual: {scene.get('key_visual', '')}
Lighting: {scene.get('lighting', '')}
Camera Angle: {scene.get('camera_angle', '')}

Characters (include these exact visual details):
{char_block if char_block else "No named characters — environment/action focus"}
{location_block}

End prompt with this style block:
{BOOK_STYLE}

Write the complete image prompt now:\
"""
    result = claude_client.call_claude(SYSTEM_PROMPT_WRITER, prompt, max_tokens=400)
    time.sleep(1)
    return result.strip()


# ── Image generation ──────────────────────────────────────────────────────────

def generate_image_fal(scene: dict) -> bytes | None:
    """
    Smart generation:
    - If scene has characters with reference images → use consistent-character endpoint
    - Otherwise → use flux/dev for high quality environment shots
    """
    api_key = config.FAL_API_KEY
    if not api_key:
        print("    ⚠️  FAL_KEY not set")
        return None

    prompt = scene.get("image_prompt", "")
    scene_id = scene.get("scene_id", "")
    chars = scene.get("characters_present", [])

    # Find characters that have reference images
    chars_with_refs = [
        c for c in chars
        if c in CHARACTER_REF_PROMPTS and (REFS_DIR / f"{c.lower()}_ref.png").exists()
    ]

    try:
        if chars_with_refs:
            # Use consistent-character with the first character's reference image
            primary_char = chars_with_refs[0]
            ref_path = REFS_DIR / f"{primary_char.lower()}_ref.png"
            ref_bytes = ref_path.read_bytes()
            ref_data_uri = _image_to_data_uri(ref_bytes)

            print(f"    Using consistent-character ref for {primary_char}")
            data = _fal_post("fal-ai/consistent-character", {
                "prompt": prompt[:900],
                "subject_image_url": ref_data_uri,
                "output_format": "png",
                "num_images": 1,
            })
            image_url = data.get("images", [{}])[0].get("url") or data.get("image", {}).get("url")
        else:
            # Environment/action scene — use flux/dev for quality
            print(f"    Using flux/dev (environment scene)")
            data = _fal_post("fal-ai/flux/dev", {
                "prompt": prompt[:900],
                "image_size": "landscape_16_9",
                "num_inference_steps": 28,
                "guidance_scale": 3.5,
                "num_images": 1,
                "enable_safety_checker": True,
            })
            image_url = data["images"][0]["url"]

        if not image_url:
            print(f"    ❌ No image URL in response")
            return None

        return _download_image(image_url)

    except Exception as e:
        print(f"    ❌ fal.ai error for {scene_id}: {e}")
        return None


# ── Save images locally ───────────────────────────────────────────────────────

def save_image_locally(scene: dict, image_bytes: bytes) -> str:
    ch_num = scene["chapter"]
    scene_id = scene["scene_id"]
    output_dir = _PIPELINE_DIR / "data" / "images" / f"chapter_{ch_num:02d}"
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
    SCENES_JSON_PATH.write_text(json.dumps(scenes, indent=2, ensure_ascii=False), encoding="utf-8")


# ── Report ────────────────────────────────────────────────────────────────────

def save_scene_report(all_scenes: list[dict]) -> None:
    lines = ["=" * 70, "  THE CONCORD OF NINE — BOOK 1 — SCENE REPORT",
             f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
             f"  Total scenes: {len(all_scenes)}", "=" * 70, ""]
    current_chapter = None
    for scene in all_scenes:
        ch = scene.get("chapter")
        if ch != current_chapter:
            current_chapter = ch
            lines += ["", f"{'─' * 60}", f"  CHAPTER {ch}", f"{'─' * 60}", ""]
        lines += [
            f"Scene {scene.get('scene_number','?')} [{scene.get('act_name','')}]: {scene.get('title','')}",
            f"  Location:   {scene.get('location_key','')} — {scene.get('setting','')}",
            f"  Mood:       {scene.get('mood','')}",
            f"  Characters: {', '.join(scene.get('characters_present',[]))}",
            f"  PROMPT: {scene.get('image_prompt','(not yet generated)')}",
            f"  FILE:   {scene.get('local_path', '(not yet generated)')}",
            "",
        ]
    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n📄 Report saved: {REPORT_PATH}")


# ── Pipeline steps ────────────────────────────────────────────────────────────

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
                    scene.update({
                        "scene_id": f"ch{ch_num:02d}_s{scene_counter:02d}",
                        "chapter": ch_num,
                        "act_number": act_idx,
                        "act_name": act_name,
                        "scene_number": scene_counter,
                    })
                    scene_counter += 1
                chapter_scenes.extend(scenes)
                print(f"      ✅ {len(scenes)} scenes")
            except Exception as e:
                print(f"      ⚠️  Failed: {e}")
            time.sleep(2)

        if chapter_scenes:
            all_scenes.extend(chapter_scenes)
            save_scenes(all_scenes)
            print(f"  Chapter {ch_num}: ✅ {len(chapter_scenes)} total scenes")

    print(f"\nTotal scenes: {len(all_scenes)}")
    save_scene_report(all_scenes)


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
        scene["image_prompt"] = generate_image_prompt(scene)
        updated += 1
        print(f"  ✅ {scene['scene_id']}: {scene.get('title','')[:50]}")

    save_scenes(scenes)
    save_scene_report(scenes)
    print(f"\n{updated} prompts generated.")


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
        if scene.get("local_path"):
            print(f"  {scene['scene_id']}: already generated — skipping")
            continue
        if not scene.get("image_prompt"):
            print(f"  {scene['scene_id']}: no prompt — run --step prompts first")
            continue

        print(f"  Generating: {scene['scene_id']} — {scene.get('title','')[:50]}...")
        image_bytes = generate_image_fal(scene)
        if not image_bytes:
            continue

        local_path = save_image_locally(scene, image_bytes)
        scene["local_path"] = local_path
        scene["generated_at"] = datetime.now(timezone.utc).isoformat()
        save_scenes(scenes)
        generated += 1
        print(f"    ✅ {local_path}")
        time.sleep(1)

    save_scene_report(scenes)
    print(f"\n{generated} images generated.")


def step_status() -> None:
    scenes = load_scenes()
    if not scenes:
        print("No scenes extracted yet.")
        return

    total        = len(scenes)
    with_prompts = sum(1 for s in scenes if s.get("image_prompt"))
    with_images  = sum(1 for s in scenes if s.get("local_path"))

    refs_exist = [c for c in CHARACTER_REF_PROMPTS if (REFS_DIR / f"{c.lower()}_ref.png").exists()]

    print(f"\n── IMAGE PIPELINE STATUS ───────────────────────────────────")
    print(f"  Character refs:  {len(refs_exist)}/{len(CHARACTER_REF_PROMPTS)} ({', '.join(refs_exist) or 'none'})")
    print(f"  Total scenes:    {total}")
    print(f"  With prompts:    {with_prompts} / {total}")
    print(f"  With images:     {with_images} / {total}")

    by_chapter: dict = {}
    for s in scenes:
        ch = s.get("chapter", 0)
        by_chapter.setdefault(ch, {"scenes": 0, "prompts": 0, "images": 0})
        by_chapter[ch]["scenes"] += 1
        if s.get("image_prompt"): by_chapter[ch]["prompts"] += 1
        if s.get("local_path"): by_chapter[ch]["images"] += 1

    print(f"\n  {'Ch':<5} {'Scenes':<8} {'Prompts':<10} {'Images'}")
    for ch in sorted(by_chapter.keys()):
        d = by_chapter[ch]
        print(f"  {ch:<5} {d['scenes']:<8} {d['prompts']:<10} {d['images']}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="VBook Image Pipeline")
    parser.add_argument("--step", choices=["refs", "extract", "prompts", "generate", "all", "status"], required=True)
    parser.add_argument("--book-folder", default=r"C:\Users\Client\Desktop\book chapter updates\Book 1")
    parser.add_argument("--chapter", type=int, default=None)
    args = parser.parse_args()

    if args.step == "refs":
        step_refs()
    elif args.step == "extract":
        step_extract(args.book_folder, args.chapter)
    elif args.step == "prompts":
        step_prompts(args.chapter)
    elif args.step == "generate":
        step_generate(args.chapter)
    elif args.step == "status":
        step_status()
    elif args.step == "all":
        step_refs()
        step_extract(args.book_folder, args.chapter)
        step_prompts(args.chapter)
        step_generate(args.chapter)


if __name__ == "__main__":
    main()
