"""
VBook Pipeline — Config & Prompt Templates
Uses Google Gemini as the LLM and fal.ai for image generation.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ── API Keys & Credentials ────────────────────────────────────────────────────

GEMINI_API_KEY              = os.environ["GEMINI_API_KEY"]
GOOGLE_SERVICE_ACCOUNT_JSON = os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"]
GOOGLE_DRIVE_ROOT_FOLDER_ID = os.environ["GOOGLE_DRIVE_ROOT_FOLDER_ID"]
GOOGLE_SHEET_ID             = os.environ["GOOGLE_SHEET_ID"]
FAL_API_KEY                 = os.getenv("FAL_KEY", "")
NEON_DATABASE_URL           = os.getenv("NEON_DATABASE_URL", "")

# ── Model & Story Settings ────────────────────────────────────────────────────

GEMINI_MODEL         = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
ACTS_PER_CHAPTER     = int(os.getenv("ACTS_PER_CHAPTER", "5"))
ACT_MIN_WORDS        = int(os.getenv("ACT_MIN_WORDS", "800"))
ACT_MAX_WORDS        = int(os.getenv("ACT_MAX_WORDS", "1200"))
MAX_ACT_ITERATIONS   = int(os.getenv("MAX_ACT_ITERATIONS", "5"))
MAX_CHAPTER_ITERATIONS = int(os.getenv("MAX_CHAPTER_ITERATIONS", "3"))
MIN_PASSING_SCORE    = int(os.getenv("MIN_PASSING_SCORE", "9"))

# ── Google Scopes ─────────────────────────────────────────────────────────────

GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
]

# ── Google Sheets Tab Names ───────────────────────────────────────────────────

SHEET_WORLD_INFO  = "World_Info"
SHEET_CHARACTERS  = "Characters"
SHEET_ACTS        = "Acts"
SHEET_CHAPTERS    = "Chapters"
SHEET_VOTES       = "Votes"
SHEET_IMAGES      = "Images"
SHEET_MEDIA       = "Media"

# ── Drive Subfolder Names ─────────────────────────────────────────────────────

DRIVE_CHAPTERS_FOLDER = "Chapters"
DRIVE_IMAGES_FOLDER   = "Images"
DRIVE_MEDIA_FOLDER    = "Media"
DRIVE_CHARS_FOLDER    = "Characters"

# ── Image Style Token ─────────────────────────────────────────────────────────

STYLE_TOKEN_CARTOON = (
    "2D animated film style, hand-drawn line art, vibrant colour palette, "
    "Studio Ghibli-inspired backgrounds, expressive character faces, "
    "cinematic composition, soft natural lighting"
)

STYLE_TOKEN_REALISTIC = (
    "cinematic photography, 35mm film grain, dramatic chiaroscuro lighting, "
    "photorealistic skin texture, 8K resolution, shallow depth of field, movie still aesthetic"
)

# ── Prompts ───────────────────────────────────────────────────────────────────

SYSTEM_ACT_WRITER = """\
You are a professional fiction novelist writing a serialised novel called VBook.

Your job is to write individual acts that form chapters of the story.

Rules you must follow:
- Write in third-person limited perspective, staying close to the POV character's thoughts and senses
- Match the tone established in the World_Info: dark but hopeful, gritty realism with moments of wonder and dry humour
- Use vivid, grounded prose — show don't tell
- Dialogue must reflect each character's distinct voice style as defined in the Characters data
- Do not introduce new characters without instruction
- Do not resolve plot threads that belong to future acts
- Do not break the fourth wall or address the reader
- Output ONLY the act text. No preamble, no title, no word count note.\
"""

def user_act_writer(world_info: str, characters: str, previous_acts: str,
                    act_number: int, chapter_number: int, plot_direction: str = "") -> str:
    parts = [
        "## World Information",
        world_info,
        "",
        "## Characters",
        characters,
        "",
        "## Story So Far (Previous Acts This Chapter)",
        previous_acts,
        "",
        "## Your Task",
        f"Write Act {act_number} of Chapter {chapter_number}.",
        "",
        f"Target length: {ACT_MIN_WORDS}–{ACT_MAX_WORDS} words.",
    ]
    if plot_direction:
        parts += ["", f"Plot direction for this chapter: {plot_direction}"]
    parts += ["", "Begin the act directly. No title heading."]
    return "\n".join(parts)


SYSTEM_ACT_REVIEWER = """\
You are a senior fiction editor reviewing acts for a serialised novel.

You evaluate acts strictly and honestly. A score of 9 or 10 means the act is genuinely
excellent and publication-ready. Do not inflate scores.

You must return ONLY valid JSON — no preamble, no explanation outside the JSON object.\
"""

def user_act_reviewer(act_content: str) -> str:
    return f"""\
Review the following act and score it from 1 to 10 across these five criteria:
1. Narrative quality (prose, imagery, flow)
2. Pacing (scene rhythm, tension, beats)
3. Character consistency (voices, motivations match established profiles)
4. Dialogue (natural, character-specific, purposeful)
5. Engagement (hooks the reader, earns its length)

The overall score should be a single integer representing the act's overall quality.
A 9 means excellent with only minor polish needed. A 10 means flawless. Be strict.

## Act to Review
{act_content}

Return ONLY this JSON structure, nothing else:
{{
  "score": <integer 1-10>,
  "criteria_scores": {{
    "narrative_quality": <integer 1-10>,
    "pacing": <integer 1-10>,
    "character_consistency": <integer 1-10>,
    "dialogue": <integer 1-10>,
    "engagement": <integer 1-10>
  }},
  "weaknesses": [<string>, ...],
  "suggestions": [<string>, ...]
}}\
"""


SYSTEM_ACT_IMPROVER = """\
You are a professional fiction editor making surgical improvements to a novel act.

Rules you must follow:
- Preserve at least 90% of the original text unchanged
- Do not alter any plot events, character decisions, or story outcomes
- Do not change the opening or closing sentences unless explicitly listed in the suggestions
- Do not add new characters or locations
- Apply ONLY the improvements listed — ignore any other issues you notice
- Output ONLY the improved act text. No preamble, no explanation.\
"""

def user_act_improver(act_content: str, suggestions: list) -> str:
    numbered = "\n".join(f"{i+1}. {s}" for i, s in enumerate(suggestions))
    return f"""\
## Original Act
{act_content}

## Improvements to Apply
{numbered}

Rewrite the act applying only these specific improvements.
Preserve 90% of the original text. Do not change any plot events.
Output only the improved act text.\
"""


SYSTEM_CHAPTER_REVIEWER = """\
You are a senior fiction editor reviewing a full chapter of a serialised novel.

You are checking whether the chapter works as a complete unit — not individual acts.

You must return ONLY valid JSON — no preamble, no explanation outside the JSON object.\
"""

def user_chapter_reviewer(chapter_text: str) -> str:
    return f"""\
Review the following chapter and evaluate it on these criteria:
1. Continuity (do acts flow into each other without contradiction or jarring gaps?)
2. Chapter arc (does the chapter have a clear beginning, rising tension, and a meaningful end?)
3. Pacing (does the overall chapter move at the right speed?)
4. Cliffhanger (does the chapter end with a strong hook into the next chapter?)

Score from 1–10 overall. Be strict. A 9 means this chapter is genuinely excellent.

## Full Chapter Text
{chapter_text}

Return ONLY this JSON structure:
{{
  "score": <integer 1-10>,
  "criteria_scores": {{
    "continuity": <integer 1-10>,
    "chapter_arc": <integer 1-10>,
    "pacing": <integer 1-10>,
    "cliffhanger": <integer 1-10>
  }},
  "weaknesses": [<string>, ...],
  "suggestions": [<string>, ...]
}}\
"""


SYSTEM_CHAPTER_IMPROVER = """\
You are a professional fiction editor making surgical improvements to a full novel chapter.

Rules you must follow:
- Preserve at least 90% of the original text unchanged
- Focus changes at act boundaries and chapter endings unless suggestions specify otherwise
- Do not change any plot events or character decisions
- Apply ONLY the improvements listed
- Output ONLY the improved chapter text. No preamble, no explanation.\
"""

def user_chapter_improver(chapter_text: str, suggestions: list) -> str:
    numbered = "\n".join(f"{i+1}. {s}" for i, s in enumerate(suggestions))
    return f"""\
## Original Chapter
{chapter_text}

## Improvements to Apply
{numbered}

Rewrite the chapter applying only these specific improvements.
Preserve 90% of the original. Do not change any plot events.
Output only the improved chapter text.\
"""


SYSTEM_VOTING_OPTIONS = """\
You are a story architect generating plot direction options for a serialised novel.

Your options must be meaningfully different from each other — not just variations in tone,
but genuinely different story directions that will lead the narrative down distinct paths.

You must return ONLY valid JSON.\
"""

def user_voting_options(chapter_number: int, chapter_summary: str, next_chapter: int) -> str:
    return f"""\
## Story So Far
Chapter {chapter_number} just concluded. Here is a summary of what happened:

{chapter_summary}

## Your Task
Generate 3 distinct plot direction options for Chapter {next_chapter}.

Each option should:
- Be 2–3 sentences describing the direction
- Be clearly different from the other two options
- Feel like a natural but surprising continuation
- Leave room for the writer to fill in the details

Return ONLY this JSON:
{{
  "chapter": {next_chapter},
  "option_a": "<2-3 sentence plot direction>",
  "option_b": "<2-3 sentence plot direction>",
  "option_c": "<2-3 sentence plot direction>"
}}\
"""


SYSTEM_SCENE_EXTRACTOR = """\
You are a visual storytelling assistant extracting key scenes from novel acts
for illustration and animation.

You must return ONLY valid JSON — an array of scene objects.\
"""

def user_scene_extractor(act_content: str, characters: str) -> str:
    return f"""\
Extract the 8–12 most visually important scenes from the following act.

Each scene must capture a distinct moment that can be illustrated as a single image.
Prioritise: action moments, emotional beats, character reveals, location establishing shots.

## Act Content
{act_content}

## Characters Reference (for physical descriptions)
{characters}

Return ONLY a JSON array:
[
  {{
    "scene_number": <integer>,
    "scene_description": "<what is happening in this moment, 1-2 sentences>",
    "characters_present": ["<n>", ...],
    "setting": "<specific location and time of day>",
    "mood": "<emotional tone: e.g. tense, melancholy, triumphant>",
    "action": "<the key physical action or pose happening>",
    "camera_angle": "<suggested framing: e.g. wide establishing, close-up, over-the-shoulder>"
  }},
  ...
]\
"""

SYSTEM_NARRATION_WRITER = """\
You are a scriptwriter adapting a novel chapter into a spoken narration script.

The script will be read aloud by a text-to-speech voice. Write for the ear, not the eye.\
"""

def user_narration_writer(chapter_text: str) -> str:
    return f"""\
Adapt the following chapter into a narration script suitable for text-to-speech.

Requirements:
- Target 700 words (approximately 5 minutes at natural speaking pace)
- Use short, clear sentences — avoid complex nested clauses
- Preserve key emotional beats and story events
- Remove or simplify dialogue — the narrator summarises rather than quotes directly
- End on the same note as the chapter's cliffhanger

## Chapter Text
{chapter_text}

Output only the narration script. No headings, no stage directions.\
"""
