# VBook MovieMaker — Session Handoff
*Updated: March 1, 2026 — End of Session 2*

---

## Quick Start (Any PC)

```powershell
# Pull latest code
cd C:\Users\Client\Desktop\MovieMaker
git pull origin feature/moviemaker-v2
npm install
npm run dev
# → http://localhost:3001

# Activate Python venv for pipeline scripts
& "C:\Users\Client\Desktop\vbook-pipeline\venv\Scripts\Activate.ps1"
cd pipeline
```

**Save work after every session:**
```powershell
cd C:\Users\Client\Desktop\MovieMaker
git add .
git commit -m "session update"
git push origin feature/moviemaker-v2
```

---

## Environment Variables

**`C:\Users\Client\Desktop\MovieMaker\.env.local`** (Next.js app)
```
GEMINI_API_KEY=<from aistudio.google.com>
GEMINI_MODEL=gemini-2.5-flash
CHAPTERS_FOLDER=C:\Users\Client\Desktop\book chapter updates\Book 1
PIPELINE_FOLDER=C:\Users\Client\Desktop\MovieMaker\pipeline
DECISIONS_FOLDER=C:\Users\Client\Desktop\MovieMaker\pipeline\review_decisions
FAL_KEY=<your fal.ai key>
```

**`C:\Users\Client\Desktop\MovieMaker\pipeline\.env`** (Python scripts)
```
GEMINI_API_KEY=<same key>
GEMINI_MODEL=gemini-2.5-flash
GOOGLE_SERVICE_ACCOUNT_JSON=C:\Users\Client\Desktop\MovieMaker\vbook-488806-eab9709315a1.json
GOOGLE_DRIVE_ROOT_FOLDER_ID=1C2bxiJylHU0ANvJLJ805cU2zbqDwpacp
GOOGLE_SHEET_ID=1pR0K_vGfIoFvhCcx_FqAfBS409sMEtKUmR98afRuRr0
FAL_KEY=<your fal.ai key>
CLAUDE_MODEL=claude-sonnet-4-6
```

---

## Key File Locations

| What | Where |
|---|---|
| Next.js app | `C:\Users\Client\Desktop\MovieMaker` |
| Chapter .txt files | `C:\Users\Client\Desktop\book chapter updates\Book 1` |
| Book 1 cover | `C:\Users\Client\Desktop\MovieMaker\public\book1-cover.jpg` |
| All cover images | `C:\Users\Client\Desktop\Novel-reading\public\images\covers\` |
| Existing character images | `C:\Users\Client\Desktop\book notes\character images\` |
| Scene data JSON | `pipeline\data\book1_scenes.json` |
| Generated scene images | `pipeline\data\images\chapter_01\` |
| Character reference images | `pipeline\data\character_refs\<name>\` |
| Review decisions | `pipeline\review_decisions\ch1_decisions.json` |
| Character profiles (.txt) | `pipeline\*.txt` |
| Service account key | `C:\Users\Client\Desktop\MovieMaker\vbook-488806-eab9709315a1.json` |

---

## ✅ COMPLETED THIS SESSION

### MovieMaker UI
- **Home page** — Book 1 cover image displayed in header alongside title
- **Chapter page** — Act sections now have large bold headings with collapse/expand toggle, larger serif reading text (Georgia, text-base, leading-8)
- **Chapter page** — Small cover thumbnail in nav bar header
- **Chapter 1 review** — Working via Gemini 2.5 Flash, scored 7.5/10, 8 suggestions saved to `review_decisions/ch1_decisions.json`

### Image Pipeline (`pipeline/book_image_pipeline.py`)
Complete rewrite with:
- **Per-act extraction** — splits chapters into acts first, extracts 2-4 scenes per act (avoids JSON truncation)
- **Location anchors** — `LOCATION_ANCHORS` dict ensures Thornwick, Ashford, The Crater etc. look consistent across all images
- **Smart generation** — uses `fal-ai/consistent-character` for scenes with known characters (passes reference image), `flux/dev` for environment-only scenes
- **Better model** — `flux/dev` with 28 steps instead of `flux/schnell` with 4 steps
- **New `--step refs`** — generates character reference images before scene generation
- Data saved to `pipeline/data/` (portable, committed to git)

### Character Reference Generator (`pipeline/generate_character_refs.py`)
- NEW script — generates 4 reference images per character using full profile details
- Uses `flux/dev` with 30 steps for maximum quality
- Full profile details from character sheets (age, build, clothing, distinctive marks, actor references)
- 7 characters defined: Caelin, Vex, Thornik, Serana, Elowen, Durgan, Nyxara
- Caelin updated after review: aged to late 20s with stubble, jacket description locked down precisely, hex-plate described as "dark window with fireflies inside"
- `--overwrite` flag to regenerate specific characters
- Images save to `pipeline/data/character_refs/<name>/`

### Infrastructure Fixes
- `claude_client.py` — rewritten to use direct HTTP (no google-genai SDK) — fixes Python 3.14 compatibility
- Gemini model updated to `gemini-2.5-flash` throughout
- Scene data path fixed to `pipeline/data/` (was pointing to old `vbook-pipeline/` folder)
- Chapter 1: 8 scenes extracted, 8 prompts generated, images generating

---

## 🔲 TODO — NEXT SESSION

### 1. Character References (START HERE)
```powershell
cd pipeline
# Caelin was regenerated with better prompt — review the 4 new images
# Then generate remaining characters:
python generate_character_refs.py --character Vex
python generate_character_refs.py --character Thornik
python generate_character_refs.py --character Serana
python generate_character_refs.py --character Elowen
python generate_character_refs.py --character Durgan
python generate_character_refs.py --character Nyxara
```
Compare against existing images in `C:\Users\Client\Desktop\book notes\character images\`  
Use whichever is better per character — copy preferred image into `pipeline\data\character_refs\<name>\<name>_ref_01.png`

### 2. Regenerate Chapter 1 Scene Images With References
The 8 Chapter 1 scenes were generated with old schnell model and no references. Delete old images and regenerate:
```powershell
# Clear old local_path entries from scenes JSON first (or delete the image files)
# Then regenerate — pipeline will now use consistent-character for character scenes
python book_image_pipeline.py --step generate --chapter 1
```

### 3. Wire Images Into Chapter Reading View
Scene images need to appear inline in the act sections of the chapter page.

**How to do it:**
- Add API endpoint `app/api/chapters/[num]/images/route.ts` that reads `book1_scenes.json` and returns scenes filtered by chapter + act number
- In `ActSection` component in `app/chapter/[num]/page.tsx`, fetch images for that act and render them between paragraphs or at the top of the act
- Image files are at `pipeline/data/images/chapter_01/` — Next.js needs to serve them, either via an API route that reads the file or by symlinking into `public/`

### 4. Run Reviews for Chapters 2–12
```powershell
# In the UI: open each chapter and click Run Review
# Or trigger via the Run All button on home page
```

### 5. Run Image Pipeline for Chapters 2–12
```powershell
python book_image_pipeline.py --step extract --book-folder "C:\Users\Client\Desktop\book chapter updates\Book 1" --chapter 2
python book_image_pipeline.py --step prompts --chapter 2
python book_image_pipeline.py --step generate --chapter 2
# Repeat for chapters 3-12
```

### 6. Apply Suggestions Feature (Needs Testing)
- Accept/reject buttons exist in the suggestions panel
- `app/api/chapters/apply/route.ts` exists but hasn't been tested end-to-end
- Should: take accepted suggestions, send to Gemini for surgical rewrite, save versioned file

### 7. Pipeline Dashboard — Image Steps
- Add extract/prompts/generate as runnable actions in the Pipeline page for each chapter
- Currently only shows generic Python scripts

### 8. Save.bat — One-Click Git Push
Create `C:\Users\Client\Desktop\MovieMaker\save.bat`:
```batch
@echo off
cd /d C:\Users\Client\Desktop\MovieMaker
git add .
git commit -m "session update %date% %time%"
git push origin feature/moviemaker-v2
echo Done.
pause
```

### 9. Novel Reading Platform Integration
- `C:\Users\Client\Desktop\Novel-reading` is a separate app with all book covers
- Needs to pull in: chapter text, act images, review scores from MovieMaker pipeline
- Not started — future phase

---

## Image Pipeline Commands Reference

```powershell
cd C:\Users\Client\Desktop\MovieMaker\pipeline

# Generate character reference images (run once per character)
python generate_character_refs.py                        # all characters
python generate_character_refs.py --character Caelin     # one character
python generate_character_refs.py --character Caelin --overwrite  # regenerate

# Image pipeline (run in order for each chapter)
python book_image_pipeline.py --step extract --book-folder "C:\Users\Client\Desktop\book chapter updates\Book 1" --chapter 1
python book_image_pipeline.py --step prompts --chapter 1
python book_image_pipeline.py --step generate --chapter 1
python book_image_pipeline.py --step status
```

---

## Known Issues / Gotchas

| Issue | Fix |
|---|---|
| Python 3.14 + google-genai SDK incompatible | `claude_client.py` uses direct HTTP — do NOT reinstall the SDK |
| Gemini model name | Must be `gemini-2.5-flash` — `gemini-2.0-flash` is deprecated for new users |
| Port conflict on startup | `taskkill /PID <n> /F` then `del .next\dev\lock` then `npm run dev` |
| Scenes JSON not found | Data lives in `pipeline\data\book1_scenes.json` — old path `vbook-pipeline\` is outdated |
| Act detection fails | Chapter .txt files must have headers matching `^Act [IVX]+` pattern |
| Images too generic | Old images used flux/schnell — new pipeline uses flux/dev + consistent-character |

---

## GitHub

**Branch:** `feature/moviemaker-v2`  
**Files committed this session:**
- `app/page.tsx` — cover image in header
- `app/chapter/[num]/page.tsx` — act headings, collapse, larger text, cover thumbnail
- `app/api/chapters/review/route.ts` — Gemini review endpoint
- `pipeline/book_image_pipeline.py` — full rewrite with location anchors, consistent-character, flux/dev
- `pipeline/claude_client.py` — direct HTTP, no SDK
- `pipeline/generate_character_refs.py` — NEW character reference generator
- `pipeline/data/book1_scenes.json` — Chapter 1 scenes + prompts
- `public/book1-cover.jpg` — Book 1 cover
- `HANDOFF.md` — previous handoff doc
