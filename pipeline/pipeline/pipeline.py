"""
VBook Pipeline — Main orchestration script

Usage (Windows):
    python pipeline.py --phase setup
    python pipeline.py --phase generate --chapter 1
    python pipeline.py --phase review   --chapter 1
    python pipeline.py --phase vote     --chapter 1
    python pipeline.py --phase images   --chapter 1 --act 1
    python pipeline.py --status

Run `python pipeline.py --help` for full usage.
"""

import argparse
import json
import sys
import time
from datetime import datetime, timezone

import config
import claude_client
import google_clients
import sheets_data
import drive_structure
from config import (
    SYSTEM_ACT_WRITER, user_act_writer,
    SYSTEM_ACT_REVIEWER, user_act_reviewer,
    SYSTEM_ACT_IMPROVER, user_act_improver,
    SYSTEM_CHAPTER_REVIEWER, user_chapter_reviewer,
    SYSTEM_CHAPTER_IMPROVER, user_chapter_improver,
    SYSTEM_VOTING_OPTIONS, user_voting_options,
    SYSTEM_SCENE_EXTRACTOR, user_scene_extractor,
    STYLE_TOKEN_CARTOON,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def log(msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}")


def ts_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def word_count(text: str) -> int:
    return len(text.split())


# ── Phase: setup ──────────────────────────────────────────────────────────────

def phase_setup():
    """
    One-time setup: create Drive folder structure and verify Sheets connectivity.
    Run this first before any content generation.
    """
    log("=== PHASE: SETUP ===")
    log("Connecting to Google Drive...")
    drive = google_clients.get_drive_service()
    ids = drive_structure.ensure_structure(drive)
    log(f"Drive folders ready:")
    for name, fid in ids.items():
        log(f"  {name}: https://drive.google.com/drive/folders/{fid}")

    log("Connecting to Google Sheets...")
    sheets = google_clients.get_sheets_service()
    world_info = sheets_data.read_world_info(sheets)
    chars = sheets_data.read_characters(sheets)
    log(f"World_Info: {len(world_info.splitlines())} lines read")
    log(f"Characters: {chars.count('Name:') } character(s) found")

    log("Setup complete. Your Drive and Sheets are connected and ready.")
    log("Next step: python pipeline.py --phase generate --chapter 1")


# ── Phase: generate ───────────────────────────────────────────────────────────

def phase_generate(chapter_num: int):
    """
    Generate all 5 acts for the given chapter.
    Each act is written by Claude using world info + characters + previous acts as context.
    Acts are saved to Google Drive (as .txt files) and logged in the Acts tab of Sheets.
    """
    log(f"=== PHASE: GENERATE — Chapter {chapter_num} ===")

    drive   = google_clients.get_drive_service()
    sheets  = google_clients.get_sheets_service()

    # Ensure folder structure exists
    drive_structure.ensure_structure(drive)
    chapter_folder = drive_structure.get_chapter_folder(drive, chapter_num)

    # Load context from Sheets
    log("Reading World_Info from Sheets...")
    world_info = sheets_data.read_world_info(sheets)
    log("Reading Characters from Sheets...")
    characters = sheets_data.read_characters(sheets)

    # Get winning vote for this chapter (if Phase 4 ran for the previous chapter)
    plot_direction = sheets_data.get_winning_vote(sheets, chapter_num)
    if plot_direction:
        log(f"Using winning vote direction: {plot_direction[:80]}...")

    # Check which acts already exist for this chapter
    existing_acts = sheets_data.read_approved_acts(sheets, chapter_num)
    existing_act_nums = {int(a["Act"]) for a in existing_acts}
    log(f"Existing acts for Chapter {chapter_num}: {sorted(existing_act_nums) or 'none'}")

    for act_num in range(1, config.ACTS_PER_CHAPTER + 1):
        if act_num in existing_act_nums:
            log(f"Act {act_num} already exists — skipping")
            continue

        log(f"--- Generating Act {act_num} of {config.ACTS_PER_CHAPTER} ---")

        # Re-read previous acts each loop so we have the freshest context
        previous_acts_data = sheets_data.read_approved_acts(sheets, chapter_num)
        previous_acts_text = sheets_data.format_previous_acts(previous_acts_data)

        prompt = user_act_writer(
            world_info, characters, previous_acts_text,
            act_num, chapter_num, plot_direction
        )

        log(f"  Calling Claude ({config.CLAUDE_MODEL})...")
        act_text = claude_client.call_claude(SYSTEM_ACT_WRITER, prompt, max_tokens=3000)
        wc = word_count(act_text)
        log(f"  Generated: {wc} words")

        if wc < config.ACT_MIN_WORDS:
            log(f"  Warning: act is shorter than target ({config.ACT_MIN_WORDS} words minimum)")

        # Save to Drive
        filename = f"Act_{act_num}.txt"
        log(f"  Saving to Drive: {filename}")
        drive_file_id = google_clients.upload_text_file(
            drive, filename, act_text, chapter_folder
        )

        # Log to Sheets
        log(f"  Logging to Sheets Acts tab...")
        sheets_data.save_act_to_sheets(
            sheets,
            chapter_num=chapter_num,
            act_num=act_num,
            content=act_text,
            status="draft",
            drive_file_id=drive_file_id,
            timestamp=ts_now(),
        )

        log(f"  Act {act_num} saved. Drive ID: {drive_file_id}")

        # Small delay to avoid rate limits
        if act_num < config.ACTS_PER_CHAPTER:
            time.sleep(2)

    log(f"=== Chapter {chapter_num}: all {config.ACTS_PER_CHAPTER} acts generated ===")
    log(f"Next step: python pipeline.py --phase review --chapter {chapter_num}")


# ── Phase: review ─────────────────────────────────────────────────────────────

def phase_review(chapter_num: int):
    """
    Run the LLM review + improvement loop for all acts in a chapter.
    Each act is reviewed, improved if score < 9, and re-reviewed up to MAX_ACT_ITERATIONS times.
    After all acts are approved, the chapter-level review runs.
    Approved content is updated in Sheets and Drive.
    """
    log(f"=== PHASE: REVIEW — Chapter {chapter_num} ===")

    drive  = google_clients.get_drive_service()
    sheets = google_clients.get_sheets_service()
    chapter_folder = drive_structure.get_chapter_folder(drive, chapter_num)

    acts = sheets_data.read_approved_acts(sheets, chapter_num)
    if not acts:
        log("ERROR: No acts found for this chapter. Run --phase generate first.")
        sys.exit(1)

    log(f"Found {len(acts)} act(s) to review")

    approved_acts = []

    for act in acts:
        act_num    = int(act["Act"])
        act_text   = act["Content"]
        current_score = int(act.get("Score") or 0)

        if act.get("Status") == "approved":
            log(f"Act {act_num}: already approved (score {current_score}) — skipping")
            approved_acts.append(act_text)
            continue

        log(f"--- Reviewing Act {act_num} ---")

        iteration = 0
        needs_human = False

        while iteration < config.MAX_ACT_ITERATIONS:
            iteration += 1
            log(f"  Iteration {iteration}/{config.MAX_ACT_ITERATIONS}...")

            # Review
            review_prompt = user_act_reviewer(act_text)
            try:
                review = claude_client.call_claude_json(
                    SYSTEM_ACT_REVIEWER, review_prompt, max_tokens=1500
                )
            except ValueError as e:
                log(f"  Review JSON parse error: {e}")
                log("  Retrying in 5 seconds...")
                time.sleep(5)
                continue

            score       = int(review.get("score", 0))
            weaknesses  = review.get("weaknesses", [])
            suggestions = review.get("suggestions", [])

            log(f"  Score: {score}/10")
            if weaknesses:
                log(f"  Weaknesses: {'; '.join(weaknesses[:2])}")

            if score >= config.MIN_PASSING_SCORE:
                log(f"  ✅ Act {act_num} approved (score {score})")
                break

            if iteration == config.MAX_ACT_ITERATIONS:
                log(f"  ⚠️  Max iterations reached. Flagging for human review.")
                needs_human = True
                break

            # Improve
            log(f"  Improving act (score was {score})...")
            improve_prompt = user_act_improver(act_text, suggestions)
            act_text = claude_client.call_claude(
                SYSTEM_ACT_IMPROVER, improve_prompt, max_tokens=3000
            )
            log(f"  Improved: {word_count(act_text)} words")
            time.sleep(2)

        # Save final version back to Drive
        filename = f"Act_{act_num}.txt"
        drive_file_id = google_clients.upload_text_file(
            drive, filename, act_text, chapter_folder
        )

        # Update Sheets
        status = "needs_human_review" if needs_human else "approved"
        sheets_data.update_act_in_sheets(sheets, chapter_num, act_num, {
            "Content": act_text,
            "Score": str(score),
            "Iteration Count": str(iteration),
            "Status": status,
            "Needs Human Review": str(needs_human).lower(),
            "Drive File ID": drive_file_id,
        })

        approved_acts.append(act_text)
        log(f"  Act {act_num} — status: {status}, score: {score}")

    # ── Chapter-level review ──────────────────────────────────────────────────
    log("--- Chapter-level review ---")
    chapter_text = "\n\n".join(approved_acts)

    iteration = 0
    chapter_score = 0
    while iteration < config.MAX_CHAPTER_ITERATIONS:
        iteration += 1
        log(f"  Chapter review iteration {iteration}/{config.MAX_CHAPTER_ITERATIONS}...")

        try:
            review = claude_client.call_claude_json(
                SYSTEM_CHAPTER_REVIEWER,
                user_chapter_reviewer(chapter_text),
                max_tokens=1500,
            )
        except ValueError as e:
            log(f"  Chapter review parse error: {e}. Retrying...")
            time.sleep(5)
            continue

        chapter_score = int(review.get("score", 0))
        suggestions   = review.get("suggestions", [])
        log(f"  Chapter score: {chapter_score}/10")

        if chapter_score >= config.MIN_PASSING_SCORE:
            log(f"  ✅ Chapter {chapter_num} approved (score {chapter_score})")
            break

        if iteration == config.MAX_CHAPTER_ITERATIONS:
            log(f"  ⚠️  Chapter max iterations reached.")
            break

        log(f"  Improving chapter...")
        chapter_text = claude_client.call_claude(
            SYSTEM_CHAPTER_IMPROVER,
            user_chapter_improver(chapter_text, suggestions),
            max_tokens=8000,
        )
        time.sleep(3)

    # Save full chapter to Drive
    log("Saving full chapter to Drive...")
    chapter_filename = f"Chapter_{chapter_num:02d}_Full.txt"
    full_drive_id = google_clients.upload_text_file(
        drive, chapter_filename, chapter_text, chapter_folder
    )

    # Log to Chapters tab
    sheets_data.save_chapter_to_sheets(
        sheets,
        chapter_num=chapter_num,
        combined_text=chapter_text,
        score=str(chapter_score),
        status="approved",
        drive_file_id=full_drive_id,
    )

    log(f"=== Chapter {chapter_num} review complete. Score: {chapter_score}/10 ===")
    log(f"Full chapter saved to Drive: {chapter_filename} (ID: {full_drive_id})")
    log(f"Next step: python pipeline.py --phase vote --chapter {chapter_num}")


# ── Phase: vote ───────────────────────────────────────────────────────────────

def phase_vote(chapter_num: int):
    """
    Generate 3 plot direction options for the NEXT chapter based on the current chapter summary.
    Options are written to the Votes tab in Sheets for community voting.
    """
    log(f"=== PHASE: VOTE — Generating options for Chapter {chapter_num + 1} ===")

    sheets = google_clients.get_sheets_service()

    # Get the approved chapter text for summary
    chapters = google_clients.sheets_read(sheets, config.SHEET_CHAPTERS)
    dicts = google_clients.rows_to_dicts(chapters)
    chapter_row = next(
        (r for r in dicts if str(r.get("Chapter")) == str(chapter_num)), None
    )
    if not chapter_row:
        log(f"ERROR: Chapter {chapter_num} not found in Chapters tab. Run --phase review first.")
        sys.exit(1)

    chapter_text = chapter_row.get("Combined Text", "")

    # Generate a short summary first, then voting options
    log("Generating chapter summary...")
    summary = claude_client.call_claude(
        "You are a story summariser. Summarise the following chapter in 3–4 sentences, focusing on key plot events and how they set up what comes next. Output only the summary.",
        f"## Chapter {chapter_num}\n\n{chapter_text[:6000]}",
        max_tokens=400,
    )
    log(f"Summary: {summary[:120]}...")

    log("Generating voting options...")
    try:
        options = claude_client.call_claude_json(
            SYSTEM_VOTING_OPTIONS,
            user_voting_options(chapter_num, summary, chapter_num + 1),
            max_tokens=800,
        )
    except ValueError as e:
        log(f"ERROR generating voting options: {e}")
        sys.exit(1)

    option_a = options.get("option_a", "")
    option_b = options.get("option_b", "")
    option_c = options.get("option_c", "")

    log(f"Option A: {option_a[:80]}...")
    log(f"Option B: {option_b[:80]}...")
    log(f"Option C: {option_c[:80]}...")

    sheets_data.save_vote_options(sheets, chapter_num + 1, option_a, option_b, option_c)

    log(f"=== Voting options saved to Sheets Votes tab ===")
    log(f"Share your Google Sheet Votes tab with readers, or add voting to your reader app.")
    log(f"When voting closes, mark the winner in the 'Winning Option' and 'Winning Text' columns.")
    log(f"Then run: python pipeline.py --phase generate --chapter {chapter_num + 1}")


# ── Phase: images ─────────────────────────────────────────────────────────────

def phase_images(chapter_num: int, act_num: int | None = None):
    """
    Extract scenes from acts and generate images via DALL-E 3.
    If act_num is given, only process that act. Otherwise processes all acts in the chapter.
    """
    if not config.OPENAI_API_KEY:
        log("ERROR: OPENAI_API_KEY not set in .env — required for DALL-E 3 image generation.")
        sys.exit(1)

    import openai
    openai_client = openai.OpenAI(api_key=config.OPENAI_API_KEY)

    log(f"=== PHASE: IMAGES — Chapter {chapter_num}" + (f", Act {act_num}" if act_num else " (all acts)") + " ===")

    drive  = google_clients.get_drive_service()
    sheets = google_clients.get_sheets_service()
    drive_structure.ensure_structure(drive)

    characters = sheets_data.read_characters(sheets)
    acts = sheets_data.read_approved_acts(sheets, chapter_num)

    if act_num is not None:
        acts = [a for a in acts if int(a["Act"]) == act_num]

    if not acts:
        log("ERROR: No approved acts found. Run --phase generate and --phase review first.")
        sys.exit(1)

    for act in acts:
        a_num    = int(act["Act"])
        act_text = act["Content"]
        images_folder = drive_structure.get_act_images_folder(drive, chapter_num, a_num)

        log(f"--- Extracting scenes from Act {a_num} ---")
        try:
            scenes = claude_client.call_claude_json(
                SYSTEM_SCENE_EXTRACTOR,
                user_scene_extractor(act_text, characters),
                max_tokens=2000,
            )
        except ValueError as e:
            log(f"Scene extraction failed: {e}")
            continue

        log(f"  Extracted {len(scenes)} scenes")

        for scene in scenes:
            s_num = scene.get("scene_number", 0)
            desc  = scene.get("scene_description", "")
            chars_present = scene.get("characters_present", [])
            setting = scene.get("setting", "")
            mood    = scene.get("mood", "")
            action  = scene.get("action", "")
            angle   = scene.get("camera_angle", "")

            # Build image prompt
            image_prompt = (
                f"{STYLE_TOKEN_CARTOON}. {desc} Setting: {setting}. "
                f"Mood: {mood}. {action}. {angle} shot."
            )
            if chars_present:
                image_prompt += f" Characters present: {', '.join(chars_present)}."
            # Truncate to DALL-E limit
            image_prompt = image_prompt[:900]

            log(f"  Scene {s_num}: {desc[:60]}...")

            try:
                response = openai_client.images.generate(
                    model="dall-e-3",
                    prompt=image_prompt,
                    size="1792x1024",
                    quality="standard",
                    n=1,
                )
                image_url = response.data[0].url

                # Download and save to Drive
                import requests as req
                img_data = req.get(image_url, timeout=30).content
                filename = f"Scene_{s_num:02d}.png"
                drive_file_id = google_clients.upload_binary_file(
                    drive, filename, img_data, "image/png", images_folder
                )
                google_clients.make_file_public(drive, drive_file_id)
                drive_url = google_clients.get_image_embed_url(drive_file_id)

                # Log to Sheets
                sheets_data.save_image_record(
                    sheets, chapter_num, a_num, s_num,
                    desc, chars_present, image_prompt,
                    image_url, drive_url,
                )
                log(f"  ✅ Scene {s_num} saved: {drive_file_id}")

            except Exception as e:
                log(f"  ❌ Scene {s_num} image generation failed: {e}")

            time.sleep(2)  # Rate limit buffer

    log(f"=== Image generation complete for Chapter {chapter_num} ===")


# ── Phase: status ─────────────────────────────────────────────────────────────

def phase_status():
    """Print a status summary of all chapters and acts from Sheets."""
    log("=== PIPELINE STATUS ===")
    sheets = google_clients.get_sheets_service()

    acts = google_clients.rows_to_dicts(
        google_clients.sheets_read(sheets, config.SHEET_ACTS)
    )
    chapters = google_clients.rows_to_dicts(
        google_clients.sheets_read(sheets, config.SHEET_CHAPTERS)
    )
    votes = google_clients.rows_to_dicts(
        google_clients.sheets_read(sheets, config.SHEET_VOTES)
    )
    images = google_clients.rows_to_dicts(
        google_clients.sheets_read(sheets, config.SHEET_IMAGES)
    )

    # Group acts by chapter
    from collections import defaultdict
    by_chapter: dict[str, list] = defaultdict(list)
    for a in acts:
        by_chapter[str(a.get("Chapter", "?"))].append(a)

    print("\n" + "="*60)
    print(f"  Acts:     {len(acts)} total")
    print(f"  Chapters: {len(chapters)} approved")
    print(f"  Votes:    {len(votes)} sets generated")
    print(f"  Images:   {len(images)} scenes generated")
    print("="*60)

    for ch_num in sorted(by_chapter.keys(), key=lambda x: int(x) if x.isdigit() else 999):
        ch_acts = by_chapter[ch_num]
        approved = [a for a in ch_acts if a.get("Status") == "approved"]
        flagged  = [a for a in ch_acts if a.get("Status") == "needs_human_review"]
        draft    = [a for a in ch_acts if a.get("Status") == "draft"]
        ch_row   = next((c for c in chapters if str(c.get("Chapter")) == ch_num), None)
        ch_score = ch_row.get("Score", "–") if ch_row else "–"

        print(f"\n  Chapter {ch_num}:")
        print(f"    Acts:     {len(ch_acts)} ({len(approved)} approved, {len(draft)} draft, {len(flagged)} needs review)")
        print(f"    Chapter score: {ch_score}")
        for a in sorted(ch_acts, key=lambda x: int(x.get("Act", 0))):
            flag = "⚠️ " if a.get("Needs Human Review", "").lower() == "true" else ""
            score = a.get("Score", "–")
            print(f"    Act {a.get('Act')}: {a.get('Status','?')} | score {score} | iter {a.get('Iteration Count','?')} {flag}")

    ch_imgs = {str(r.get("Chapter")) for r in images}
    if ch_imgs:
        print(f"\n  Images generated for chapters: {', '.join(sorted(ch_imgs))}")

    vote_chapters = {str(r.get("Chapter")) for r in votes}
    if vote_chapters:
        print(f"  Voting options ready for chapters: {', '.join(sorted(vote_chapters))}")

    print()


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="VBook Pipeline — AI novel generation and review",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python pipeline.py --phase setup
  python pipeline.py --phase generate --chapter 1
  python pipeline.py --phase review   --chapter 1
  python pipeline.py --phase vote     --chapter 1
  python pipeline.py --phase images   --chapter 1
  python pipeline.py --phase images   --chapter 1 --act 2
  python pipeline.py --status
        """,
    )
    parser.add_argument(
        "--phase",
        choices=["setup", "generate", "review", "vote", "images"],
        help="Pipeline phase to run",
    )
    parser.add_argument(
        "--chapter", type=int, default=1,
        help="Chapter number to process (default: 1)",
    )
    parser.add_argument(
        "--act", type=int, default=None,
        help="Act number (used with --phase images to process a single act)",
    )
    parser.add_argument(
        "--status", action="store_true",
        help="Print current pipeline status and exit",
    )

    args = parser.parse_args()

    if args.status:
        phase_status()
        return

    if not args.phase:
        parser.print_help()
        return

    if args.phase == "setup":
        phase_setup()
    elif args.phase == "generate":
        phase_generate(args.chapter)
    elif args.phase == "review":
        phase_review(args.chapter)
    elif args.phase == "vote":
        phase_vote(args.chapter)
    elif args.phase == "images":
        phase_images(args.chapter, args.act)


if __name__ == "__main__":
    main()
