# VBook MovieMaker — Project Handoff Document
*Last updated: March 1, 2026*

---

## Project Overview

**VBook** is an AI pipeline that takes the novel "The Concord of Nine" from written text through editorial review, scene illustration, narration, and ultimately a full animated movie. The pipeline is split between:

- **MovieMaker** — a Next.js editorial UI (localhost:3001) for reviewing and editing chapters
- **Pipeline scripts** — Python scripts in `pipeline/` folder for image generation, Google Sheets population, etc.
- **n8n workflows** — automation workflows for the full review-improve loop (Phase 3+)

---

## Tech Stack

| Layer | Tool |
|---|---|
| Editorial UI | Next.js 16 (app router, Tailwind, TypeScript) |
| LLM for reviews | Gemini 2.5 Flash (via direct HTTP API) |
| Image generation | fal.ai (flux/schnell model) |
| Data storage | Google Sheets + local JSON files |
| File storage | Google Drive + local `pipeline/data/` |
| Workflow automation | n8n (on Railway) |
| Version control | GitHub — branch: `feature/moviemaker-v2` |

---

## Repository

**GitHub:** `feature/moviemaker-v2` branch  
**Local path:** `C:\Users\Client\Desktop\MovieMaker`  
**Pipeline path:** `C:\Users\Client\Desktop\MovieMaker\pipeline`  
**Python venv:** `C:\Users\Client\Desktop\vbook-pipeline\venv`

To save work after each session:
```
cd C:\Users\Client\Desktop\MovieMaker
git add .
git commit -m "session update"
git push origin feature/moviemaker-v2
```

To resume on another PC:
```
git pull origin feature/moviemaker-v2
npm install
npm run dev
```

---

## Environment Variables

**File:** `C:\Users\Client\Desktop\MovieMaker\.env.local`

```
GEMINI_API_KEY=<your key from aistudio.google.com>
GEMINI_MODEL=gemini-2.5-flash
CHAPTERS_FOLDER=C:\Users\Client\Desktop\book chapter updates\Book 1
PIPELINE_FOLDER=C:\Users\Client\Desktop\MovieMaker\pipeline
PYTHON_CMD=python
PROFILES_FOLDER=C:\Users\Client\Desktop\MovieMaker\pipeline
DECISIONS_FOLDER=C:\Users\Client\Desktop\MovieMaker\pipeline\review_decisions
FAL_KEY=<your fal.ai key>
```

**File:** `C:\Users\Client\Desktop\MovieMaker\pipeline\.env`

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

## Book Structure

**Book 1: "The Dragon's Last Breath" (Oath of Flame)**
- 12 chapters + epilogue
- 5 acts per chapter
- ~58,000 words total
- Chapter files: `C:\Users\Client\Desktop\book chapter updates\Book 1\`
  - Ch1_revised.txt → Ch9_revised.txt
  - Ch10.txt, Ch11.txt, Ch12.txt, Epilogue.txt

**Main characters:** Caelin Thorne, Vex Sunshadow, Thornik Bramblebrew, Serana Valeblade, Durgan Nightcloak, Elowen Greenbloom (MIA Ch.7), Nyxara Veilthorn (joins Ch.8)

---

## ✅ COMPLETED

### MovieMaker UI (Next.js App)
- **Home page** (`app/page.tsx`) — chapter list with scores, progress bar, word counts, Book 1 cover image
- **Chapter page** (`app/chapter/[num]/page.tsx`) — 3-column split: act sidebar, chapter text reader, suggestions panel
  - Act headings with collapse/expand toggle
  - Larger serif text for comfortable reading
  - Book cover thumbnail in header
  - Live review log with SSE streaming
- **Search page** (`app/search/page.tsx`) — full-text search across all chapters
- **Characters page** (`app/characters/page.tsx`) — loads character profiles from pipeline folder
- **Pipeline page** (`app/pipeline/page.tsx`) — script runner dashboard with live log output

### API Routes
- `app/api/chapters/route.ts` — lists all chapters with metadata
- `app/api/chapters/[num]/route.ts` — individual chapter data, splits into acts
- `app/api/chapters/review/route.ts` — Gemini editorial review with SSE streaming, saves to `review_decisions/ch{N}_decisions.json`
- `app/api/chapters/apply/route.ts` — applies accepted suggestions, writes versioned file
- `app/api/chapters/queue/route.ts` — run-all queue
- `app/api/characters/route.ts` — serves character profiles
- `app/api/search/route.ts` — full-text search
- `app/api/pipeline/run/route.ts` — spawns Python pipeline scripts

### Pipeline Scripts
- `pipeline/book_image_pipeline.py` — complete image pipeline:
  - `--step extract` — splits chapters into acts, extracts 2-4 scenes per act via Gemini
  - `--step prompts` — generates fal.ai image prompts per scene
  - `--step generate` — generates images via fal.ai, saves to `pipeline/data/images/`
  - `--step status` — shows progress across all chapters
- `pipeline/claude_client.py` — Gemini API wrapper using direct HTTP (no SDK, Python 3.14 compatible)
- `pipeline/config.py` — environment variable loader
- `pipeline/data/book1_scenes.json` — scene data store (8 scenes for Ch1 extracted)

### n8n Workflows (in `pipeline/`)
- `phase3-review-loop.json` — iterative review loop (score gate 9/10, max 5 retries/act, 3/chapter)
- `phase4-voting.json` — chapter direction voting system
- `phase5-scene-images.json` — scene image generation workflow
- `phase6-video-assembly.json` — video assembly workflow

### Other Deliverables
- `pipeline/VBook_Story_Planner.html` — interactive story planning tool
- `pipeline/VBook_Voting_Site.html` — reader voting site for plot directions
- `pipeline/book_epub_export.py` — exports finished chapters to epub format
- `pipeline/Concord_of_Nine_Series_Bible.docx` — full series bible document
- `public/book1-cover.jpg` — Book 1 cover image (used in home + chapter pages)

### Chapter Reviews Completed
- **Chapter 1:** Score 7.5/10, 8 suggestions generated, saved to `review_decisions/ch1_decisions.json`

### Image Pipeline Progress (Chapter 1)
- ✅ 8 scenes extracted (across all acts)
- ✅ 8 image prompts generated
- ⏳ Image generation in progress (running `--step generate` when this doc was written)
- Scenes: Thornwick's Ashy Silence, Softened Beam Awakened Power, Mira's Whispered Prophecy, Obsidian Crater Dying Dragon, The Last Guardian's Plea, Choice of Destiny, The Dragon's Mark, Ember's Inheritance

---

## 🔲 STILL TO DO

### Immediate Next Steps (this session)
1. **Confirm Chapter 1 images generate successfully** — check `pipeline/data/images/chapter_01/`
2. **Wire images into the chapter reading view** — show generated scene images inline within each act section in the chapter page

### Image Display in Reader
- Add an API endpoint that serves scene images for a given chapter/act
- In `ActSection` component, fetch and display images between paragraphs or at the top of each act
- Images stored at `pipeline/data/images/chapter_{N}/`
- The `book1_scenes.json` has `local_path` field once generated — use this to map scene to act

### Chapter Reviews Remaining
- Run editorial review for Chapters 2–12
- Consider running "Review All" queue to process all chapters overnight

### Image Pipeline Remaining
- Run extract → prompts → generate for Chapters 2–12
- Each chapter: ~8–15 scenes, ~$0.01–0.05 per image on fal.ai

### Apply Suggestions Feature
- The "Apply Changes" modal exists in the UI but needs testing
- Accepted suggestions should trigger a rewrite via Gemini and save a versioned file
- `app/api/chapters/apply/route.ts` needs verification

### Pipeline Dashboard
- The Pipeline page exists but needs the image pipeline steps wired up as runnable scripts
- Currently only shows Python scripts — add extract/prompts/generate as chapter-specific actions

### Git & Deployment
- Create `save.bat` in MovieMaker root for one-click commit+push
- Merge `feature/moviemaker-v2` into main when stable
- Consider Railway deployment for the Next.js app so it's accessible without running locally

### Phase 5 (n8n) — Image Generation via n8n
- `phase5-scene-images.json` workflow exists but Google Drive integration needs testing
- Currently images save locally — need to verify Drive upload works when running via n8n

### Phase 6 — Video Assembly
- `phase6-video-assembly.json` workflow exists
- Needs: ElevenLabs/OpenAI TTS for narration, FFmpeg for assembly
- Not yet started — depends on Phase 5 being stable

### Novel Reading Platform
- Separate app at `C:\Users\Client\Desktop\Novel-reading`
- Has cover images for Books 1–10
- Needs to be connected to the generated content (chapters, images) from MovieMaker

---

## Key File Locations

| What | Where |
|---|---|
| Next.js app | `C:\Users\Client\Desktop\MovieMaker` |
| Chapter files | `C:\Users\Client\Desktop\book chapter updates\Book 1` |
| Cover images | `C:\Users\Client\Desktop\Novel-reading\public\images\covers` |
| Scene data JSON | `C:\Users\Client\Desktop\MovieMaker\pipeline\data\book1_scenes.json` |
| Generated images | `C:\Users\Client\Desktop\MovieMaker\pipeline\data\images\` |
| Review decisions | `C:\Users\Client\Desktop\MovieMaker\pipeline\review_decisions\` |
| Character profiles | `C:\Users\Client\Desktop\MovieMaker\pipeline\*.txt` |
| Service account key | `C:\Users\Client\Desktop\MovieMaker\vbook-488806-eab9709315a1.json` |

---

## Running the App

```powershell
# Activate venv (for pipeline scripts)
& "C:\Users\Client\Desktop\vbook-pipeline\venv\Scripts\Activate.ps1"

# Start the UI
cd C:\Users\Client\Desktop\MovieMaker
npm run dev
# → http://localhost:3001

# Run image pipeline for a chapter
cd pipeline
python book_image_pipeline.py --step extract --book-folder "C:\Users\Client\Desktop\book chapter updates\Book 1" --chapter 1
python book_image_pipeline.py --step prompts --chapter 1
python book_image_pipeline.py --step generate --chapter 1
python book_image_pipeline.py --step status
```

---

## Known Issues / Gotchas

- **Python 3.14 + google-genai SDK** — incompatible. `claude_client.py` uses direct HTTP instead. Do not reinstall the SDK.
- **Gemini model name** — must be `gemini-2.5-flash` (not `gemini-2.0-flash` which is deprecated for new users)
- **Port conflict** — if port 3000 is in use, Next.js moves to 3001. Kill PID with `taskkill /PID <n> /F` then `del .next\dev\lock`
- **Scenes JSON path** — data lives in `pipeline/data/book1_scenes.json`. The old path `vbook-pipeline/book1_scenes.json` is outdated.
- **Act detection** — chapters must have headers matching `^Act [IVX]+` for the pipeline to split correctly
