"""
VBook Pipeline — Google Sheets data readers
Reads World_Info, Characters, and Acts tabs.
Formats them as text blocks ready to paste into Claude prompts.
"""

from google_clients import get_sheets_service, sheets_read, sheets_append, rows_to_dicts
import config


def read_world_info(sheets=None) -> str:
    """Read World_Info tab and return a formatted 'Key: Value' string."""
    if sheets is None:
        sheets = get_sheets_service()
    rows = rows_to_dicts(sheets_read(sheets, config.SHEET_WORLD_INFO))
    lines = [
        f"{r['Key']}: {r['Value']}"
        for r in rows
        if r.get("Key") and r.get("Value")
    ]
    return "\n".join(lines)


def read_characters(sheets=None) -> str:
    """Read Characters tab and return structured character blocks."""
    if sheets is None:
        sheets = get_sheets_service()
    rows = rows_to_dicts(sheets_read(sheets, config.SHEET_CHARACTERS))
    blocks = []
    for r in rows:
        if not r.get("Name"):
            continue
        if r.get("Status", "active").lower() not in ("active", ""):
            continue
        block = "\n".join([
            f"Name: {r.get('Name', '')}",
            f"Role: {r.get('Role', '')}",
            f"Appearance: {r.get('Physical Description', '')}",
            f"Personality: {r.get('Personality', '')}",
            f"Backstory: {r.get('Backstory', '')}",
            f"Relationships: {r.get('Relationships', '')}",
            f"Voice: {r.get('Voice Style', '')}",
        ])
        blocks.append(block)
    return "\n\n---\n\n".join(blocks)


def read_approved_acts(sheets=None, chapter_num: int = 1) -> list[dict]:
    """
    Return a list of approved acts for the given chapter, sorted by act number.
    Each dict has: chapter, act, content, score, status, drive_file_id
    """
    if sheets is None:
        sheets = get_sheets_service()
    rows = rows_to_dicts(sheets_read(sheets, config.SHEET_ACTS))
    acts = [
        r for r in rows
        if str(r.get("Chapter")) == str(chapter_num)
        and r.get("Content")
        and r.get("Status") not in ("TEST", "needs_human_review")
    ]
    acts.sort(key=lambda r: int(r.get("Act", 0)))
    return acts


def format_previous_acts(acts: list[dict]) -> str:
    """Format a list of act dicts into the 'Story So Far' block for prompts."""
    if not acts:
        return "This is the opening act of the chapter. There are no previous acts."
    return "\n\n".join(
        f"--- Act {a['Act']} ---\n{a['Content']}" for a in acts
    )


def save_act_to_sheets(
    sheets,
    chapter_num: int,
    act_num: int,
    content: str,
    score: str = "",
    iteration_count: int = 0,
    status: str = "draft",
    needs_human_review: bool = False,
    drive_file_id: str = "",
    timestamp: str = "",
) -> None:
    """Append a new act row to the Acts tab."""
    from datetime import datetime, timezone
    ts = timestamp or datetime.now(timezone.utc).isoformat()
    sheets_append(sheets, config.SHEET_ACTS, [
        str(chapter_num),
        str(act_num),
        content,
        str(score),
        str(iteration_count),
        status,
        str(needs_human_review).lower(),
        drive_file_id,
        ts,
    ])


def update_act_in_sheets(sheets, chapter_num: int, act_num: int, updates: dict) -> None:
    """
    Find the row for (chapter_num, act_num) and update specific columns.
    updates is a dict of column_name -> new_value.
    Column order in Acts: Chapter(0), Act(1), Content(2), Score(3),
                          Iteration Count(4), Status(5), Needs Human Review(6),
                          Drive File ID(7), Timestamp(8)
    """
    col_map = {
        "Chapter": 0, "Act": 1, "Content": 2, "Score": 3,
        "Iteration Count": 4, "Status": 5, "Needs Human Review": 6,
        "Drive File ID": 7, "Timestamp": 8,
    }
    rows = sheets_read(sheets, config.SHEET_ACTS)
    target_row = None
    for i, row in enumerate(rows[1:], start=2):  # 1-based, skip header
        if (len(row) > 1
                and str(row[0]) == str(chapter_num)
                and str(row[1]) == str(act_num)):
            target_row = i
            break
    if target_row is None:
        print(f"  Warning: Act {act_num} of Chapter {chapter_num} not found in Sheets for update")
        return
    for col_name, value in updates.items():
        col_idx = col_map.get(col_name)
        if col_idx is None:
            continue
        col_letter = chr(ord("A") + col_idx)
        range_ = f"{config.SHEET_ACTS}!{col_letter}{target_row}"
        sheets.spreadsheets().values().update(
            spreadsheetId=config.GOOGLE_SHEET_ID,
            range=range_,
            valueInputOption="USER_ENTERED",
            body={"values": [[str(value)]]},
        ).execute()


def save_chapter_to_sheets(
    sheets,
    chapter_num: int,
    combined_text: str,
    score: str,
    status: str,
    plot_direction: str = "",
    drive_file_id: str = "",
) -> None:
    """Append a row to the Chapters tab."""
    from datetime import datetime, timezone
    ts = datetime.now(timezone.utc).isoformat()
    sheets_append(sheets, config.SHEET_CHAPTERS, [
        str(chapter_num),
        combined_text,
        str(score),
        status,
        plot_direction,
        drive_file_id,
        ts,
    ])


def save_vote_options(sheets, chapter_num: int, option_a: str, option_b: str, option_c: str) -> None:
    """Append a row to the Votes tab with 3 plot direction options."""
    from datetime import datetime, timezone
    ts = datetime.now(timezone.utc).isoformat()
    sheets_append(sheets, config.SHEET_VOTES, [
        str(chapter_num), option_a, option_b, option_c,
        "0", "0", "0", "", "", ts,
    ])


def get_winning_vote(sheets, chapter_num: int) -> str:
    """Return the winning vote text for a chapter, or empty string if not yet tallied."""
    rows = rows_to_dicts(sheets_read(sheets, config.SHEET_VOTES))
    for r in rows:
        if str(r.get("Chapter")) == str(chapter_num) and r.get("Winning Text"):
            return r["Winning Text"]
    return ""


def save_image_record(
    sheets,
    chapter_num: int,
    act_num: int,
    scene_num: int,
    scene_description: str,
    characters_present: list,
    prompt: str,
    image_url: str,
    drive_path: str,
    status: str = "generated",
) -> None:
    """Append a row to the Images tab."""
    from datetime import datetime, timezone
    ts = datetime.now(timezone.utc).isoformat()
    sheets_append(sheets, config.SHEET_IMAGES, [
        str(chapter_num), str(act_num), str(scene_num),
        scene_description, ", ".join(characters_present),
        prompt, image_url, drive_path, status, ts,
    ])
