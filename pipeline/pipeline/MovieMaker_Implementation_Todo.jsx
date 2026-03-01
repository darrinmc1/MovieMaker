import { useState } from "react";

const PHASES = [
  {
    id: "github",
    label: "GitHub Setup",
    color: "#6B8CFF",
    icon: "⬡",
    steps: [
      {
        id: "gh-1",
        title: "Clone the repo locally",
        detail: "git clone https://github.com/darrinmc1/MovieMaker\ncd MovieMaker",
        tag: "terminal",
      },
      {
        id: "gh-2",
        title: "Verify .gitignore has .env.local",
        detail: "Open .gitignore — confirm .env.local is listed. If not, add it now before committing anything. This keeps your API keys out of GitHub.",
        tag: "check",
      },
      {
        id: "gh-3",
        title: "Create a working branch",
        detail: "git checkout -b feature/moviemaker-v2\nThis keeps main clean. Merge when everything is tested.",
        tag: "terminal",
      },
    ],
  },
  {
    id: "folders",
    label: "Create App Folders",
    color: "#FF9B4E",
    icon: "◫",
    steps: [
      {
        id: "fold-1",
        title: 'Create app\\chapter\\[num]\\ folder',
        detail: "Windows can't create bracket folders via Explorer. In terminal:\nmkdir \"app\\chapter\\[num]\"",
        tag: "windows-quirk",
      },
      {
        id: "fold-2",
        title: 'Create app\\api\\chapters\\[num]\\ folder',
        detail: 'mkdir "app\\api\\chapters\\[num]"',
        tag: "windows-quirk",
      },
      {
        id: "fold-3",
        title: "Create remaining API route folders",
        detail: "mkdir app\\api\\chapters\\apply\nmkdir app\\api\\chapters\\queue\nmkdir app\\api\\search\nmkdir app\\api\\pipeline\\run\nmkdir app\\api\\characters",
        tag: "terminal",
      },
      {
        id: "fold-4",
        title: "Create page folders",
        detail: "mkdir app\\search\nmkdir app\\pipeline\nmkdir app\\characters",
        tag: "terminal",
      },
      {
        id: "fold-5",
        title: "Confirm components\\ folder exists",
        detail: "Check that components\\ exists at root. If not: mkdir components",
        tag: "check",
      },
    ],
  },
  {
    id: "drop-files",
    label: "Drop In App Files",
    color: "#4ECA8B",
    icon: "↓",
    steps: [
      {
        id: "drop-1",
        title: "app\\page.tsx  ←  home_page.tsx",
        detail: "Replaces home page. Has top nav bar (Search, Characters, Pipeline, Run All), progress bar, chapter score bars, status dots.",
        tag: "overwrite",
      },
      {
        id: "drop-2",
        title: 'app\\chapter\\[num]\\page.tsx  ←  chapter_num_page.tsx',
        detail: "Full chapter review UI. Split-screen layout, act sidebar, diff view, Apply Changes button, bulk accept/reject.",
        tag: "new",
      },
      {
        id: "drop-3",
        title: "app\\search\\page.tsx  ←  search_page.tsx",
        detail: "Full-text search across all chapter .txt files. Debounced, highlighted matches, grouped by chapter.",
        tag: "new",
      },
      {
        id: "drop-4",
        title: "app\\pipeline\\page.tsx  ←  pipeline_page.tsx",
        detail: "Pipeline dashboard. Every Python script is a button with live log streaming.",
        tag: "new",
      },
      {
        id: "drop-5",
        title: "app\\characters\\page.tsx  ←  characters_page.tsx",
        detail: "Character roster. Reads from local .txt profile files. Book 1 / Book 2 filter, click-to-expand profiles.",
        tag: "new",
      },
      {
        id: "drop-6",
        title: 'app\\api\\chapters\\[num]\\route.ts  ←  chapters_num_route.ts',
        detail: "API route for individual chapter data — reads .txt file, returns content + metadata.",
        tag: "new",
      },
      {
        id: "drop-7",
        title: "app\\api\\chapters\\apply\\route.ts  ←  chapters_apply_route.ts",
        detail: "Apply accepted suggestions to chapter files. Creates versioned copies (Ch1_v2.txt). Supports dry-run preview.",
        tag: "new",
      },
      {
        id: "drop-8",
        title: "app\\api\\chapters\\queue\\route.ts  ←  chapters_queue_route.ts",
        detail: "Queues all chapters for AI review via SSE streaming. Powers the Run All modal.",
        tag: "new",
      },
      {
        id: "drop-9",
        title: "app\\api\\search\\route.ts  ←  search_route.ts",
        detail: "Full-text search API. Searches all chapter .txt files, returns matches with surrounding context.",
        tag: "new",
      },
      {
        id: "drop-10",
        title: "app\\api\\pipeline\\run\\route.ts  ←  pipeline_run_route.ts",
        detail: "Spawns Python scripts, streams stdout/stderr back as SSE. Powers the pipeline dashboard.",
        tag: "new",
      },
      {
        id: "drop-11",
        title: "app\\api\\characters\\route.ts  ←  characters_route.ts",
        detail: "Reads character profile .txt files from PROFILES_FOLDER, parses sections, returns structured data.",
        tag: "new",
      },
      {
        id: "drop-12",
        title: "components\\RunAllModal.tsx",
        detail: "Modal for queuing all 12 chapters overnight. Live progress, skip-existing toggle, stop button.",
        tag: "new",
      },
      {
        id: "drop-13",
        title: "components\\ApplyChangesModal.tsx",
        detail: "3-step modal: confirm → diff preview → done. Shows before/after diffs for accepted suggestions.",
        tag: "new",
      },
    ],
  },
  {
    id: "env",
    label: "Environment Variables",
    color: "#E87820",
    icon: "⚙",
    steps: [
      {
        id: "env-1",
        title: "Open .env.local",
        detail: "Located at root of MovieMaker project. Create it if it doesn't exist.",
        tag: "check",
      },
      {
        id: "env-2",
        title: "Add CHAPTERS_FOLDER",
        detail: 'CHAPTERS_FOLDER=C:\\Users\\Client\\Desktop\\book chapter updates\n\nThis is where your chapter .txt files live.',
        tag: "env",
      },
      {
        id: "env-3",
        title: "Add PIPELINE_FOLDER + PYTHON_CMD",
        detail: "PIPELINE_FOLDER=C:\\Users\\Client\\Desktop\\vbook-pipeline\nPYTHON_CMD=python\n\nPYTHON_CMD may need to be 'python3' depending on your system.",
        tag: "env",
      },
      {
        id: "env-4",
        title: "Add PROFILES_FOLDER",
        detail: "PROFILES_FOLDER=C:\\Users\\Client\\Desktop\\vbook-pipeline\n\nThis is where the character .txt profile files are stored.",
        tag: "env",
      },
      {
        id: "env-5",
        title: "Add DECISIONS_FOLDER (optional)",
        detail: "DECISIONS_FOLDER=C:\\Users\\Client\\Desktop\\vbook-pipeline\\review_decisions\n\nWhere chapter review JSON files are saved. Will be auto-created if missing.",
        tag: "env",
      },
      {
        id: "env-6",
        title: "Confirm GEMINI_API_KEY is set",
        detail: "GEMINI_API_KEY=your-key-here\n\nThe chapter review route uses Gemini. Confirm this is present.",
        tag: "check",
      },
    ],
  },
  {
    id: "test",
    label: "Test Each Feature",
    color: "#C45ECA",
    icon: "✓",
    steps: [
      {
        id: "test-1",
        title: "npm run dev — confirm app starts",
        detail: "cd into MovieMaker folder, run npm run dev. Open localhost:3000. No red errors in terminal.",
        tag: "test",
      },
      {
        id: "test-2",
        title: "Home page — chapter list loads",
        detail: "Chapters appear as cards with score bars and status dots. Progress bar at top. Nav buttons visible (Search, Characters, Pipeline, Run All).",
        tag: "test",
      },
      {
        id: "test-3",
        title: "Chapter review — open a chapter",
        detail: "Click a chapter. Split-screen loads with chapter text on left, review pane on right. Act sidebar syncs scroll.",
        tag: "test",
      },
      {
        id: "test-4",
        title: "Search — find a character name",
        detail: "Click Search in nav. Type 'Caelin'. Results appear grouped by chapter with highlighted matches.",
        tag: "test",
      },
      {
        id: "test-5",
        title: "Characters page — profiles load",
        detail: "Click Characters in nav. All 7 Book 1 characters appear with colour-coded cards. Click one to expand full profile.",
        tag: "test",
      },
      {
        id: "test-6",
        title: "Pipeline page — scripts visible",
        detail: "Click Pipeline in nav. Script list appears on left. Click Run on populate_sheets — log output streams in real time.",
        tag: "test",
      },
      {
        id: "test-7",
        title: "Apply Changes — test dry run",
        detail: "Open a reviewed chapter with accepted suggestions. Click 'Apply X' button. Step through to preview — confirm diff shows before/after. Cancel without writing.",
        tag: "test",
      },
      {
        id: "test-8",
        title: "Apply Changes — write a versioned file",
        detail: "Repeat Apply Changes but click through to complete. Confirm Ch1_v2.txt (or next version) is created in CHAPTERS_FOLDER.",
        tag: "test",
      },
      {
        id: "test-9",
        title: "Run All — queue and watch",
        detail: "Click 'Run All' button on home page. Toggle skip-existing on. Click Start. Watch chapters queue with live progress. Abort after 2-3 chapters to confirm stop works.",
        tag: "test",
      },
    ],
  },
  {
    id: "github-push",
    label: "Commit & Push to GitHub",
    color: "#6B8CFF",
    icon: "↑",
    steps: [
      {
        id: "push-1",
        title: "Stage all new files",
        detail: "git add .\n\nDouble-check git status — .env.local should NOT appear in the staged list.",
        tag: "terminal",
      },
      {
        id: "push-2",
        title: "Commit",
        detail: 'git commit -m "feat: add search, pipeline, characters, apply changes, run all"\n\nOr use a more descriptive message per file group if you prefer.',
        tag: "terminal",
      },
      {
        id: "push-3",
        title: "Push to GitHub",
        detail: "git push origin feature/moviemaker-v2\n\nThen open a pull request on GitHub to merge into main when ready.",
        tag: "terminal",
      },
      {
        id: "push-4",
        title: "Verify on GitHub",
        detail: "Open https://github.com/darrinmc1/MovieMaker and confirm all new files appear in the correct folder structure.",
        tag: "check",
      },
    ],
  },
  {
    id: "standalone",
    label: "Standalone Files",
    color: "#4ECA8B",
    icon: "◈",
    steps: [
      {
        id: "sa-1",
        title: "Copy VBook_Story_Planner.html to Desktop",
        detail: "Double-click to open in browser. No server needed. Pre-loaded with all characters, Chapter 1 data, lore, and timeline. All edits save to localStorage.",
        tag: "deploy",
      },
      {
        id: "sa-2",
        title: "Copy VBook_Voting_Site.html — host or test locally",
        detail: "Open locally to test with the sample Chapter 2 vote pre-loaded.\nTo go live: drag onto Netlify Drop (netlify.com/drop) or push to GitHub Pages.",
        tag: "deploy",
      },
      {
        id: "sa-3",
        title: "Copy book_epub_export.py to vbook-pipeline\\",
        detail: "pip install ebooklib --break-system-packages\npython book_epub_export.py\n\nOutputs Concord_of_Nine_Book1.epub to the pipeline folder.",
        tag: "deploy",
      },
      {
        id: "sa-4",
        title: "File the Series Bible .docx",
        detail: "Concord_of_Nine_Series_Bible.docx — save to Google Drive or the vbook-pipeline folder. Full character profiles, world lore, voice guide, pipeline notes.",
        tag: "deploy",
      },
    ],
  },
  {
    id: "n8n",
    label: "n8n Workflows",
    color: "#FF6B6B",
    icon: "⬡",
    steps: [
      {
        id: "n8n-1",
        title: "Import phase3-review-loop.json",
        detail: "n8n → Workflows → Import from file. This is the act + chapter review/improvement loop with score gates and retry caps. Most critical workflow.",
        tag: "n8n",
      },
      {
        id: "n8n-2",
        title: "Test Phase 3 on Chapter 1",
        detail: "Set chapterNumber=1 in Set Run Config node. Run workflow. Watch acts score → improve → approve loop. Confirm it exits correctly at score ≥9 or retry cap.",
        tag: "n8n",
      },
      {
        id: "n8n-3",
        title: "Import phase4-voting.json",
        detail: "Community vote generation + tallying workflow. Set mode='generate_options' first. Generates 3 plot directions and saves to Votes sheet.",
        tag: "n8n",
      },
      {
        id: "n8n-4",
        title: "Test Phase 4 option generation",
        detail: "Run with mode='generate_options' and chapterNumber=1. Check Votes tab in Google Sheets — 3 options should appear with status=open.",
        tag: "n8n",
      },
      {
        id: "n8n-5",
        title: "Wire voting site to n8n webhook",
        detail: "In VBook_Voting_Site.html, set WEBHOOK_URL to your n8n webhook endpoint. This lets votes POST directly from the community site into the workflow.",
        tag: "n8n",
      },
      {
        id: "n8n-6",
        title: "Import phase5-scene-images.json",
        detail: "Scene extraction + DALL-E 3 image generation. Requires OPENAI_API_KEY and GDRIVE_IMAGES_FOLDER_ID env vars set in Railway.",
        tag: "n8n",
      },
      {
        id: "n8n-7",
        title: "Test Phase 5 on Chapter 1, Act 1",
        detail: "Set chapterNumber=1, processAllActs=false, actNumber=1. Run. Confirm scenes extracted, prompts built, 1 image generated and uploaded to Drive.",
        tag: "n8n",
      },
      {
        id: "n8n-8",
        title: "Import phase6-video-assembly.json",
        detail: "Narration + TTS + FFmpeg video assembly. Requires ELEVENLABS_API_KEY, GDRIVE_AUDIO_FOLDER_ID, GDRIVE_VIDEO_FOLDER_ID, and ffmpeg installed on Railway server.",
        tag: "n8n",
      },
      {
        id: "n8n-9",
        title: "Add ELEVENLABS_API_KEY to Railway",
        detail: "Railway dashboard → your n8n service → Variables → Add ELEVENLABS_API_KEY. Also set narratorVoiceId in the Phase 6 Set Config node to your chosen narrator voice.",
        tag: "n8n",
      },
      {
        id: "n8n-10",
        title: "Verify ffmpeg on Railway server",
        detail: "In n8n, add a temporary Execute Command node with: ffmpeg -version\nRun it. If it errors, add ffmpeg to your Railway Dockerfile:\nRUN apt-get install -y ffmpeg",
        tag: "n8n",
      },
    ],
  },
];

const TAG_STYLES = {
  terminal:       { bg: "#1a2a1a", border: "#3a6a3a", text: "#6aaa6a", label: "TERMINAL" },
  "windows-quirk":{ bg: "#2a1a1a", border: "#6a3a3a", text: "#aa6a6a", label: "WINDOWS" },
  check:          { bg: "#1a1a2a", border: "#3a3a6a", text: "#6a6aaa", label: "CHECK" },
  overwrite:      { bg: "#2a2a1a", border: "#6a6a3a", text: "#aaaa6a", label: "OVERWRITE" },
  new:            { bg: "#1a2a2a", border: "#3a6a5a", text: "#5aaa8a", label: "NEW FILE" },
  env:            { bg: "#2a1a2a", border: "#6a3a6a", text: "#aa6aaa", label: "ENV VAR" },
  test:           { bg: "#2a1a1a", border: "#7a3a3a", text: "#ca6a6a", label: "TEST" },
  deploy:         { bg: "#1a2a1a", border: "#4a7a4a", text: "#7aba7a", label: "DEPLOY" },
  n8n:            { bg: "#1a1e2a", border: "#3a4a7a", text: "#6a8aca", label: "N8N" },
};

export default function TodoList() {
  const [completed, setCompleted] = useState({});
  const [expanded, setExpanded] = useState({});
  const [activePhase, setActivePhase] = useState("github");

  const toggle = (id) => setCompleted(c => ({ ...c, [id]: !c[id] }));
  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const totalSteps = PHASES.flatMap(p => p.steps).length;
  const doneSteps = Object.values(completed).filter(Boolean).length;
  const pct = Math.round((doneSteps / totalSteps) * 100);

  const currentPhase = PHASES.find(p => p.id === activePhase);
  const phaseSteps = currentPhase?.steps || [];
  const phaseDone = phaseSteps.filter(s => completed[s.id]).length;
  const phaseColor = currentPhase?.color || "#888";

  return (
    <div style={{
      background: "#0a0a12",
      minHeight: "100vh",
      color: "#ddd8f0",
      fontFamily: "'Courier New', 'Lucida Console', monospace",
      display: "grid",
      gridTemplateColumns: "220px 1fr",
      gridTemplateRows: "auto 1fr",
    }}>
      {/* ── Header ── */}
      <div style={{
        gridColumn: "1 / -1",
        padding: "16px 24px",
        borderBottom: "1px solid #1e1e32",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "linear-gradient(90deg, #0d0d1e 0%, #0a0a12 100%)",
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#5555aa", marginBottom: 4 }}>
            MOVIEMAKER · IMPLEMENTATION CHECKLIST
          </div>
          <div style={{ fontSize: 18, fontWeight: "bold", color: "#c0b8e8", letterSpacing: "0.05em" }}>
            github.com/darrinmc1/MovieMaker
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 28, fontWeight: "bold", color: phaseColor, fontFamily: "monospace" }}>
            {pct}%
          </div>
          <div style={{ fontSize: 11, color: "#555577", letterSpacing: "0.1em" }}>
            {doneSteps} / {totalSteps} COMPLETE
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div style={{ gridColumn: "1 / -1", height: 3, background: "#1a1a2a" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: `linear-gradient(90deg, #6B8CFF, ${phaseColor})`,
          transition: "width 0.4s ease",
        }} />
      </div>

      {/* ── Sidebar ── */}
      <div style={{
        borderRight: "1px solid #1e1e32",
        padding: "16px 0",
        background: "#08080f",
        overflowY: "auto",
      }}>
        {PHASES.map(phase => {
          const done = phase.steps.filter(s => completed[s.id]).length;
          const isActive = activePhase === phase.id;
          const allDone = done === phase.steps.length;
          return (
            <div
              key={phase.id}
              onClick={() => setActivePhase(phase.id)}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                borderLeft: isActive ? `3px solid ${phase.color}` : "3px solid transparent",
                background: isActive ? `${phase.color}11` : "transparent",
                transition: "all 0.15s",
                marginBottom: 2,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ color: allDone ? "#5aaa7a" : phase.color, fontSize: 14 }}>
                  {allDone ? "✓" : phase.icon}
                </span>
                <span style={{
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  color: isActive ? phase.color : allDone ? "#5aaa7a" : "#6a6888",
                  fontWeight: isActive ? "bold" : "normal",
                }}>
                  {phase.label}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 22 }}>
                <div style={{ flex: 1, height: 2, background: "#1a1a2a", borderRadius: 1 }}>
                  <div style={{
                    height: "100%",
                    width: `${phase.steps.length > 0 ? (done / phase.steps.length) * 100 : 0}%`,
                    background: allDone ? "#5aaa7a" : phase.color,
                    borderRadius: 1,
                    transition: "width 0.3s",
                  }} />
                </div>
                <span style={{ fontSize: 10, color: "#444466", minWidth: 28, textAlign: "right" }}>
                  {done}/{phase.steps.length}
                </span>
              </div>
            </div>
          );
        })}

        {/* Quick stats */}
        <div style={{ margin: "20px 16px 0", borderTop: "1px solid #1a1a2a", paddingTop: 16 }}>
          <div style={{ fontSize: 10, color: "#444466", letterSpacing: "0.12em", marginBottom: 10 }}>SUMMARY</div>
          {[
            { label: "App Files", val: "13 files" },
            { label: "n8n Workflows", val: "4 JSON" },
            { label: "Standalone", val: "4 files" },
            { label: "Repo", val: "darrinmc1" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "#555577" }}>{s.label}</span>
              <span style={{ fontSize: 10, color: "#7777aa" }}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ overflowY: "auto", padding: "20px 24px" }}>
        {/* Phase header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          paddingBottom: 12,
          borderBottom: `1px solid ${phaseColor}33`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24, color: phaseColor }}>{currentPhase?.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: "bold", color: phaseColor, letterSpacing: "0.1em" }}>
                {currentPhase?.label?.toUpperCase()}
              </div>
              <div style={{ fontSize: 11, color: "#444466", marginTop: 2 }}>
                {phaseDone} of {phaseSteps.length} steps complete
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              const allDone = phaseSteps.every(s => completed[s.id]);
              const update = {};
              phaseSteps.forEach(s => { update[s.id] = !allDone; });
              setCompleted(c => ({ ...c, ...update }));
            }}
            style={{
              padding: "6px 14px",
              background: "transparent",
              border: `1px solid ${phaseColor}55`,
              borderRadius: 3,
              color: phaseColor,
              cursor: "pointer",
              fontSize: 11,
              letterSpacing: "0.1em",
              fontFamily: "inherit",
            }}
          >
            {phaseSteps.every(s => completed[s.id]) ? "UNCHECK ALL" : "CHECK ALL"}
          </button>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {phaseSteps.map((step, i) => {
            const isDone = !!completed[step.id];
            const isOpen = !!expanded[step.id];
            const tag = TAG_STYLES[step.tag] || TAG_STYLES.check;

            return (
              <div
                key={step.id}
                style={{
                  background: isDone ? "#0d1a12" : "#0f0f1e",
                  border: `1px solid ${isDone ? "#2a4a2a" : "#1e1e32"}`,
                  borderRadius: 5,
                  overflow: "hidden",
                  transition: "all 0.2s",
                  opacity: isDone ? 0.7 : 1,
                }}
              >
                {/* Row */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  cursor: "pointer",
                }}
                  onClick={() => toggle(step.id)}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: 18, height: 18,
                    border: `1px solid ${isDone ? "#5aaa7a" : "#333355"}`,
                    borderRadius: 3,
                    background: isDone ? "#2a5a3a" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}>
                    {isDone && <span style={{ color: "#7adc9a", fontSize: 11, lineHeight: 1 }}>✓</span>}
                  </div>

                  {/* Step number */}
                  <span style={{ fontSize: 10, color: "#333355", minWidth: 16 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Title */}
                  <span style={{
                    flex: 1,
                    fontSize: 13,
                    color: isDone ? "#557755" : "#c8c0e0",
                    textDecoration: isDone ? "line-through" : "none",
                    letterSpacing: "0.02em",
                  }}>
                    {step.title}
                  </span>

                  {/* Tag */}
                  <span style={{
                    fontSize: 9,
                    padding: "2px 7px",
                    borderRadius: 2,
                    background: tag.bg,
                    border: `1px solid ${tag.border}`,
                    color: tag.text,
                    letterSpacing: "0.12em",
                    flexShrink: 0,
                  }}>
                    {tag.label}
                  </span>

                  {/* Expand toggle */}
                  {step.detail && (
                    <button
                      onClick={e => { e.stopPropagation(); toggleExpand(step.id); }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#444466",
                        cursor: "pointer",
                        fontSize: 14,
                        padding: "0 4px",
                        lineHeight: 1,
                        transition: "transform 0.2s",
                        transform: isOpen ? "rotate(180deg)" : "none",
                      }}
                    >
                      ▾
                    </button>
                  )}
                </div>

                {/* Detail panel */}
                {isOpen && step.detail && (
                  <div style={{
                    borderTop: "1px solid #1a1a2a",
                    padding: "12px 14px 12px 44px",
                    background: "#08080e",
                  }}>
                    <pre style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: 12,
                      color: "#8888bb",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.7,
                      margin: 0,
                    }}>
                      {step.detail}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Phase completion banner */}
        {phaseDone === phaseSteps.length && phaseSteps.length > 0 && (
          <div style={{
            marginTop: 20,
            padding: "14px 18px",
            background: "#0d2a18",
            border: "1px solid #2a6a3a",
            borderRadius: 5,
            textAlign: "center",
            fontSize: 12,
            color: "#5aaa7a",
            letterSpacing: "0.1em",
          }}>
            ✓ PHASE COMPLETE — move to the next section
          </div>
        )}
      </div>
    </div>
  );
}
