"""
book1_review.py — Full editorial review of Book 1 by Gemini

Reads all chapter files from a local folder, sends them to Gemini in batches,
and produces a structured editorial report saved as book1_review_report.txt

Usage:
    python book1_review.py --chapters-folder "C:\\Users\\Client\\Desktop\\book chapter updates"

The report covers:
    1. Overall book assessment (structure, pacing, arc)
    2. Per-chapter scores and notes
    3. Character arc consistency across the book
    4. Prose and style observations
    5. Specific improvement recommendations
    6. Book 2 setup — what threads are live and what needs strengthening
"""

import argparse
import os
import time
from datetime import datetime
from pathlib import Path

import config
import claude_client


CHAPTER_FILES = [
    ("Chapter 1",  "Ch1_revised.txt"),
    ("Chapter 2",  "Ch2_revised.txt"),
    ("Chapter 3",  "Ch3_revised.txt"),
    ("Chapter 4",  "Ch4_revised.txt"),
    ("Chapter 5",  "Ch5_revised.txt"),
    ("Chapter 6",  "Ch6_revised.txt"),
    ("Chapter 7",  "Ch7_revised.txt"),
    ("Chapter 8",  "Ch8_revised.txt"),
    ("Chapter 9",  "Ch9_revised.txt"),
    ("Chapter 10", "Ch10.txt"),
    ("Chapter 11", "Ch11.txt"),
    ("Chapter 12", "Ch12.txt"),
    ("Epilogue",   "Epilogue.txt"),
]

OUTLINE_FILE = "Book_1_-_Outline_-_The_Dragon_s_Last_Breath.txt"


def read_file(folder: str, filename: str) -> str | None:
    path = Path(folder) / filename
    if not path.exists():
        print(f"  ⚠️  Not found, skipping: {filename}")
        return None
    return path.read_text(encoding="utf-8", errors="replace")


# ── Individual chapter review ─────────────────────────────────────────────────

SYSTEM_CHAPTER_REVIEW = """\
You are a senior fiction editor reviewing a chapter of an epic fantasy novel called
"The Concord of Nine — Book 1: The Dragon's Last Breath."

The story follows Caelin Thorne, an exiled fire sorcerer who has been bonded to a
dying dragon's scale and must gather eight other relic bearers to prevent an ancient
evil (the Seal) from waking beneath Depthspire. His companions are:
Vex (half-elf rogue), Thornik (dwarf artificer), Serana (paladin),
Elowen (druid), Durgan (shadow-walker), Nyxara (warlock), and Aldric (veteran soldier).

You evaluate chapters honestly. Be specific — cite actual lines or moments when praising
or criticising. A score of 9-10 means genuinely excellent, publication-ready prose.

Return your review in this exact format (use the headers as written):

SCORE: X/10

STRENGTHS:
[3-5 specific strengths with line references where possible]

WEAKNESSES:
[3-5 specific weaknesses with line references where possible]

PROSE NOTES:
[Observations on sentence-level writing, dialogue, pacing rhythm]

CHARACTER MOMENTS:
[How each active character performs in this chapter — voice consistency, arc movement]

CONTINUITY FLAGS:
[Any contradictions, inconsistencies, or timeline issues]

RECOMMENDATIONS:
[3-5 specific, actionable improvements — what to change and how]\
"""


def review_chapter(name: str, text: str) -> str:
    print(f"  Reviewing {name}...")
    prompt = f"## {name}\n\n{text[:12000]}"  # Gemini context limit safety
    result = claude_client.call_claude(SYSTEM_CHAPTER_REVIEW, prompt, max_tokens=2000)
    time.sleep(3)  # Rate limit buffer
    return result


# ── Full book review ──────────────────────────────────────────────────────────

SYSTEM_BOOK_REVIEW = """\
You are a senior developmental editor reviewing a complete epic fantasy novel:
"The Concord of Nine — Book 1: The Dragon's Last Breath."

You have read all twelve chapters and the epilogue. You are now giving a
comprehensive developmental review of the book as a whole.

Be specific, honest, and constructive. Cite chapters and moments.
This is a working author who wants to improve the book, not just praise.\
"""

def review_full_book(chapter_summaries: list[tuple[str, str]], outline: str) -> str:
    print("  Running full book developmental review...")

    summary_block = "\n\n".join(
        f"=== {name} ===\n{review[:800]}"
        for name, review in chapter_summaries
    )

    prompt = f"""\
## Book Outline (for reference)
{outline[:3000]}

## Chapter Review Summaries
{summary_block}

Now provide your full developmental review covering:

1. OVERALL ASSESSMENT (2-3 paragraphs)
   Structure, pacing across the full book, whether the arc lands.

2. BOOK-LEVEL SCORE: X/10

3. CHARACTER ARC ANALYSIS
   For each main character: does their arc across the book work?
   Who grows, who stagnates, who needs more development?
   Characters: Caelin, Vex, Thornik, Serana, Elowen, Durgan, Nyxara, Aldric

4. THEMATIC CONSISTENCY
   Are the core themes (chosen vs choosing, doubt as companion to faith,
   found family, the cost of power) carried through consistently?

5. PACING ANALYSIS
   Which chapters drag? Which move too fast? Where are the strongest peaks?

6. PROSE PATTERNS
   Recurring strengths and weaknesses in the writing style across the book.
   Any habits the author should watch for in Book 2.

7. WHAT WORKS BRILLIANTLY
   The 5 best moments or sequences in the entire book — be specific.

8. THE 10 MOST IMPORTANT IMPROVEMENTS
   Ranked by impact. Be specific about which chapters, which scenes, what to change.

9. BOOK 2 SETUP ASSESSMENT
   Which threads are well-planted for Book 2?
   Which threads need strengthening before Book 2 begins?
   What is missing that Book 2 will need to establish early?

10. FINAL RECOMMENDATION
    Is this book ready to publish as-is, needs light revision, or needs
    structural work? What is the single most important thing to fix?\
"""

    result = claude_client.call_claude(SYSTEM_BOOK_REVIEW, prompt, max_tokens=4000)
    return result


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Book 1 editorial review by Gemini")
    parser.add_argument(
        "--chapters-folder",
        default=r"C:\Users\Client\Desktop\book chapter updates",
        help="Path to the folder containing chapter .txt files",
    )
    parser.add_argument(
        "--output",
        default=r"C:\Users\Client\Desktop\book1_review_report.txt",
        help="Where to save the review report",
    )
    args = parser.parse_args()

    folder = args.chapters_folder
    print(f"\n📚 Book 1 Editorial Review")
    print(f"   Chapters folder: {folder}")
    print(f"   Output: {args.output}")
    print(f"   Model: {config.GEMINI_MODEL}\n")

    # Read outline
    outline = read_file(folder, OUTLINE_FILE) or ""

    # Review each chapter
    chapter_reviews = []
    print("── Per-chapter reviews ──────────────────────────────────────")
    for name, filename in CHAPTER_FILES:
        text = read_file(folder, filename)
        if text is None:
            chapter_reviews.append((name, f"SCORE: N/A\n\nFile not found: {filename}"))
            continue
        review = review_chapter(name, text)
        chapter_reviews.append((name, review))

    # Full book developmental review
    print("\n── Full book developmental review ───────────────────────────")
    book_review = review_full_book(chapter_reviews, outline)

    # Assemble report
    ts = datetime.now().strftime("%Y-%m-%d %H:%M")
    lines = [
        "=" * 70,
        "  THE CONCORD OF NINE — BOOK 1: THE DRAGON'S LAST BREATH",
        "  EDITORIAL REVIEW REPORT",
        f"  Generated: {ts} | Model: {config.GEMINI_MODEL}",
        "=" * 70,
        "",
        "PART ONE — PER-CHAPTER REVIEWS",
        "=" * 70,
        "",
    ]

    for name, review in chapter_reviews:
        lines += [
            f"{'─' * 60}",
            f"  {name.upper()}",
            f"{'─' * 60}",
            review,
            "",
        ]

    lines += [
        "=" * 70,
        "PART TWO — FULL BOOK DEVELOPMENTAL REVIEW",
        "=" * 70,
        "",
        book_review,
        "",
        "=" * 70,
        "END OF REPORT",
        "=" * 70,
    ]

    report = "\n".join(lines)

    # Save
    Path(args.output).write_text(report, encoding="utf-8")
    print(f"\n✅ Report saved to: {args.output}")
    print(f"   Total length: {len(report):,} characters")
    print("\nOpen the file in Notepad or Word to read the full review.")


if __name__ == "__main__":
    main()
