#!/usr/bin/env python3
"""
VBook — epub Exporter
=====================
Reads all chapter .txt files from CHAPTERS_FOLDER and produces a complete .epub.

Usage:
    python book_epub_export.py

Outputs:
    C:/Users/Client/Desktop/vbook-pipeline/Concord_of_Nine_Book1.epub

Requirements:
    pip install ebooklib --break-system-packages
"""

import os
import re
import glob
from datetime import datetime

# ── Config ────────────────────────────────────────────────────────────────────
CHAPTERS_FOLDER = r"C:\Users\Client\Desktop\book chapter updates"
OUTPUT_PATH     = r"C:\Users\Client\Desktop\vbook-pipeline\Concord_of_Nine_Book1.epub"

BOOK_TITLE      = "The Concord of Nine"
BOOK_SUBTITLE   = "Book 1: The Dragon's Last Breath"
BOOK_AUTHOR     = "VBook Pipeline"
BOOK_LANGUAGE   = "en"
BOOK_IDENTIFIER = "concord-of-nine-book1-vbook"

# Map chapter numbers to titles — update as you finalise them
CHAPTER_TITLES = {
    1:  "The Dragon's Last Breath",
    2:  "Strangers at the Crater",
    3:  "The Road to Thornwick",
    4:  "Shadows at the Crossroads",
    5:  "The Ember Claimed",
    6:  "Into the Sanctum",
    7:  "Collapse",
    8:  "Fractured",
    9:  "The Price of Fire",
    10: "The Valeblade Oath",
    11: "What the Dead Remember",
    12: "The Seal Stirs",
    13: "Epilogue",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def find_chapter_files(folder):
    """Return sorted list of (chapter_num, filepath) tuples."""
    files = []
    for path in glob.glob(os.path.join(folder, "*.txt")):
        fname = os.path.basename(path)
        # Match patterns: Ch1.txt, Chapter1.txt, Chapter 1.txt, ch01.txt, etc.
        m = re.search(r'(?i)ch(?:apter)?\s*0*(\d+)', fname)
        if m:
            files.append((int(m.group(1)), path))
    files.sort(key=lambda x: x[0])
    return files


def clean_text(raw):
    """Clean raw chapter text for epub."""
    # Normalise line endings
    text = raw.replace('\r\n', '\n').replace('\r', '\n')
    # Strip BOM if present
    text = text.lstrip('\ufeff')
    return text.strip()


def text_to_html_paragraphs(text):
    """Convert plain text to HTML paragraphs, preserving scene breaks (*** or ---)."""
    lines = text.split('\n')
    html_parts = []
    buffer = []

    def flush():
        if buffer:
            joined = ' '.join(buffer).strip()
            if joined:
                html_parts.append(f'<p>{html_escape(joined)}</p>')
            buffer.clear()

    for line in lines:
        stripped = line.strip()
        if not stripped:
            flush()
        elif re.match(r'^(\*{3,}|---+|═{3,})$', stripped):
            flush()
            html_parts.append('<p class="scene-break">* * *</p>')
        else:
            buffer.append(stripped)

    flush()
    return '\n'.join(html_parts)


def html_escape(s):
    return (s
        .replace('&', '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
        .replace('"', '&quot;')
    )


# ── CSS ───────────────────────────────────────────────────────────────────────
STYLESHEET = """
body {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 1em;
    line-height: 1.7;
    margin: 1.5em 2em;
    color: #1a1a1a;
}

h1.book-title {
    font-size: 2em;
    text-align: center;
    margin-top: 3em;
    margin-bottom: 0.3em;
    color: #1a1a2e;
}

h2.book-subtitle {
    font-size: 1.2em;
    text-align: center;
    color: #C8741A;
    margin-bottom: 3em;
}

h1.chapter-title {
    font-size: 1.6em;
    text-align: center;
    margin-top: 2em;
    margin-bottom: 0.3em;
    color: #1a1a2e;
}

h2.chapter-number {
    font-size: 0.9em;
    text-align: center;
    color: #C8741A;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 2em;
    margin-top: 0;
}

p {
    text-indent: 1.5em;
    margin: 0 0 0.3em 0;
}

p:first-of-type,
p.scene-break + p {
    text-indent: 0;
}

p.scene-break {
    text-align: center;
    text-indent: 0;
    margin: 1.5em 0;
    color: #888;
    font-style: normal;
}

.title-page {
    text-align: center;
    padding-top: 4em;
}

.metadata {
    text-align: center;
    color: #666;
    font-size: 0.9em;
    margin-top: 4em;
}
"""


def make_title_page_html(title, subtitle, author):
    return f"""<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"
  "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <meta charset="utf-8"/>
  <title>{html_escape(title)}</title>
  <link rel="stylesheet" href="../Styles/style.css" type="text/css"/>
</head>
<body>
  <div class="title-page">
    <h1 class="book-title">{html_escape(title)}</h1>
    <h2 class="book-subtitle">{html_escape(subtitle)}</h2>
    <div class="metadata">
      <p>{html_escape(author)}</p>
      <p>Generated {datetime.now().strftime('%B %Y')}</p>
    </div>
  </div>
</body>
</html>"""


def make_chapter_html(chapter_num, title, body_html):
    chapter_label = f"Chapter {chapter_num}" if chapter_num <= 12 else "Epilogue"
    return f"""<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"
  "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <meta charset="utf-8"/>
  <title>{html_escape(title)}</title>
  <link rel="stylesheet" href="../Styles/style.css" type="text/css"/>
</head>
<body>
  <h2 class="chapter-number">{html_escape(chapter_label)}</h2>
  <h1 class="chapter-title">{html_escape(title)}</h1>
  {body_html}
</body>
</html>"""


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    try:
        from ebooklib import epub
    except ImportError:
        print("Installing ebooklib...")
        import subprocess
        subprocess.run(["pip", "install", "ebooklib", "--break-system-packages"], check=True)
        from ebooklib import epub

    print(f"Looking for chapters in: {CHAPTERS_FOLDER}")
    chapter_files = find_chapter_files(CHAPTERS_FOLDER)

    if not chapter_files:
        print("ERROR: No chapter files found. Check CHAPTERS_FOLDER path.")
        print(f"  Expected .txt files matching: Ch1.txt, Chapter1.txt, etc.")
        return

    print(f"Found {len(chapter_files)} chapter files:")
    for num, path in chapter_files:
        print(f"  Ch{num}: {os.path.basename(path)}")

    # Build epub
    book = epub.EpubBook()
    book.set_identifier(BOOK_IDENTIFIER)
    book.set_title(f"{BOOK_TITLE} — {BOOK_SUBTITLE}")
    book.add_author(BOOK_AUTHOR)
    book.set_language(BOOK_LANGUAGE)
    book.add_metadata('DC', 'description', 'Generated by the VBook AI fiction pipeline.')

    # Stylesheet
    css = epub.EpubItem(uid="style_main", file_name="Styles/style.css",
                        media_type="text/css", content=STYLESHEET.encode('utf-8'))
    book.add_item(css)

    # Title page
    title_page = epub.EpubHtml(title="Title Page", file_name="title.xhtml", lang="en")
    title_page.content = make_title_page_html(BOOK_TITLE, BOOK_SUBTITLE, BOOK_AUTHOR).encode('utf-8')
    title_page.add_item(css)
    book.add_item(title_page)

    spine = ['nav', title_page]
    toc   = []

    # Chapters
    for chapter_num, filepath in chapter_files:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            raw = f.read()

        text = clean_text(raw)
        title = CHAPTER_TITLES.get(chapter_num, f"Chapter {chapter_num}")
        body_html = text_to_html_paragraphs(text)

        chapter_item = epub.EpubHtml(
            title=title,
            file_name=f"chapter_{chapter_num:02d}.xhtml",
            lang="en"
        )
        chapter_item.content = make_chapter_html(chapter_num, title, body_html).encode('utf-8')
        chapter_item.add_item(css)
        book.add_item(chapter_item)

        spine.append(chapter_item)
        toc.append(epub.Link(f"chapter_{chapter_num:02d}.xhtml", title, f"ch{chapter_num}"))

        word_count = len(text.split())
        print(f"  ✓ Ch{chapter_num}: {title} ({word_count:,} words)")

    book.toc = toc
    book.spine = spine
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())

    # Write
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    epub.write_epub(OUTPUT_PATH, book)
    print(f"\n✅ epub written to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
