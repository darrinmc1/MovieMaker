"""
split_chapters.py — Splits chapter .txt files into individual act files.
Reports what it could and couldn't split at the end.

USAGE:
  python split_chapters.py
  python split_chapters.py --chapter 1

Output: pipeline/acts/Ch1_Act1.txt, Ch1_Act2.txt etc.
"""

import re
import argparse
from pathlib import Path

BOOK_FOLDER = Path(r"C:\Users\Client\Desktop\book chapter updates\Book 1")
OUTPUT_DIR  = Path(__file__).parent / "acts"

ACT_PATTERNS = [
    re.compile(r"^(Act\s+[IVX]+[:\s].*)$",      re.IGNORECASE | re.MULTILINE),
    re.compile(r"^(Act\s+[IVX]+)$",              re.IGNORECASE | re.MULTILINE),
    re.compile(r"^(ACT\s+\w+[:\s].*)$",          re.MULTILINE),
    re.compile(r"^(ACT\s+\w+)$",                 re.MULTILINE),
    re.compile(r"^(Chapter\s+\d+,?\s+Act\s+\d+)", re.IGNORECASE | re.MULTILINE),
]

ROMAN_MAP = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7}

def roman_to_int(s: str) -> int:
    match = re.search(r"\bI{1,3}V?|VI{0,3}|IV|IX\b", s, re.IGNORECASE)
    if match:
        return ROMAN_MAP.get(match.group().upper(), 0)
    words = {"ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5}
    for word, num in words.items():
        if word in s.upper():
            return num
    digits = re.search(r"\d+", s)
    return int(digits.group()) if digits else 0

def find_act_matches(text: str):
    for pattern in ACT_PATTERNS:
        matches = list(pattern.finditer(text))
        if len(matches) >= 2:
            return matches
    return []

def split_chapter(chapter_num: int) -> dict:
    """Returns a result dict describing what happened."""
    result = {"chapter": chapter_num, "status": None, "acts": [], "note": ""}

    candidates = (
        list(BOOK_FOLDER.glob(f"Ch{chapter_num}_*.txt")) +
        list(BOOK_FOLDER.glob(f"Ch{chapter_num}.txt")) +
        list(BOOK_FOLDER.glob(f"ch{chapter_num}*.txt"))
    )
    if not candidates:
        result["status"] = "NO_FILE"
        result["note"]   = f"No .txt file found for chapter {chapter_num}"
        return result

    chapter_file = candidates[0]
    text = chapter_file.read_text(encoding="utf-8", errors="replace")
    result["note"] = chapter_file.name

    matches = find_act_matches(text)
    if not matches:
        result["status"] = "NO_ACTS"
        # Show the first few non-empty lines as a hint
        preview = [l.strip() for l in text.splitlines() if l.strip()][:8]
        result["preview"] = preview
        return result

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    chapter_header = text[:matches[0].start()].strip()

    for i, match in enumerate(matches):
        act_header = match.group(1).strip()
        act_num    = roman_to_int(act_header)
        if act_num == 0:
            act_num = i + 1

        start    = match.end()
        end      = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body     = text[start:end].strip()
        out_path = OUTPUT_DIR / f"Ch{chapter_num}_Act{act_num}.txt"
        content  = f"{chapter_header}\n\n{act_header}\n\n{body}"
        out_path.write_text(content, encoding="utf-8")
        result["acts"].append(f"Act {act_num}: {act_header[:60]}")

    result["status"] = "OK"
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--chapter", type=int, default=None)
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Book folder  : {BOOK_FOLDER}")
    print(f"Output folder: {OUTPUT_DIR}")
    print()

    if args.chapter:
        chapters = [args.chapter]
    else:
        files = sorted(BOOK_FOLDER.glob("*.txt"))
        nums  = set()
        for f in files:
            m = re.search(r"\d+", f.stem)
            if m:
                nums.add(int(m.group()))
        chapters = sorted(nums)

    results = []
    for ch in chapters:
        print(f"Processing Chapter {ch}...", end=" ")
        r = split_chapter(ch)
        results.append(r)
        if r["status"] == "OK":
            print(f"✅ {len(r['acts'])} acts")
        elif r["status"] == "NO_ACTS":
            print(f"⚠️  no act headers found")
        else:
            print(f"❌ {r['note']}")

    # ── Final report ──────────────────────────────────────────────────────────
    ok      = [r for r in results if r["status"] == "OK"]
    no_acts = [r for r in results if r["status"] == "NO_ACTS"]
    no_file = [r for r in results if r["status"] == "NO_FILE"]

    print()
    print("=" * 60)
    print("RESULTS SUMMARY")
    print("=" * 60)

    if ok:
        print(f"\n✅ SPLIT SUCCESSFULLY ({len(ok)} chapters):")
        for r in ok:
            print(f"\n  Chapter {r['chapter']} — {r['note']}")
            for act in r["acts"]:
                print(f"    {act}")

    if no_acts:
        print(f"\n⚠️  COULD NOT FIND ACT HEADERS ({len(no_acts)} chapters):")
        print(f"  Please create act files manually as Ch<N>_Act<N>.txt in pipeline/acts/")
        for r in no_acts:
            print(f"\n  Chapter {r['chapter']} — {r['note']}")
            print(f"  First lines of file:")
            for line in r.get("preview", []):
                print(f"    > {line}")

    if no_file:
        print(f"\n❌ FILE NOT FOUND ({len(no_file)} chapters):")
        for r in no_file:
            print(f"  Chapter {r['chapter']} — {r['note']}")

    print()
    print(f"Act files written to: {OUTPUT_DIR}")
    print(f"For missing chapters, create files manually: Ch3_Act1.txt, Ch3_Act2.txt etc.")

if __name__ == "__main__":
    main()
