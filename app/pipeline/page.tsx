'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScriptMeta { label: string; file: string; args?: string[]; description: string }
interface ScriptStatus { script: ScriptMeta; lastRun: string | null; lastStatus: 'success' | 'error' | 'never_run' }
interface LogLine { type: 'start' | 'stdout' | 'stderr' | 'info' | 'done' | 'error'; data: string; ts: number }

interface ActStatus {
  act: number
  scenesExtracted: number
  promptsBuilt: number
  imagesGenerated: number
  sceneIds: string[]
}
interface ChapterStatus {
  key: string
  label: string
  chapterNum: number | null
  isEpilogue: boolean
  acts: ActStatus[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SCRIPT_GROUPS = [
  { label: 'Google Sheets', icon: '📊', scripts: ['populate_sheets', 'add_book2_data'] },
  { label: 'Book 1 Review', icon: '📝', scripts: ['book1_review'] },
  { label: 'Image Pipeline', icon: '🖼️', scripts: ['image_extract', 'image_prompts', 'image_generate', 'image_full_chapter', 'image_status'] },
]

const STATUS_STYLE: Record<string, { dot: string; text: string }> = {
  success:   { dot: 'bg-emerald-500',              text: 'text-emerald-400' },
  error:     { dot: 'bg-rose-500',                 text: 'text-rose-400'    },
  never_run: { dot: 'bg-zinc-700',                 text: 'text-zinc-600'    },
  running:   { dot: 'bg-amber-500 animate-pulse',  text: 'text-amber-400'   },
}

// ── Tick component ────────────────────────────────────────────────────────────

function Tick({ done, partial }: { done: boolean; partial?: boolean }) {
  if (done)    return <span className="text-emerald-400 text-sm leading-none">✓</span>
  if (partial) return <span className="text-amber-400  text-sm leading-none">◑</span>
  return              <span className="text-zinc-700   text-sm leading-none">○</span>
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const router = useRouter()

  // Script runner state
  const [statuses,       setStatuses]       = useState<Record<string, ScriptStatus>>({})
  const [running,        setRunning]        = useState<string | null>(null)
  const [logLines,       setLogLines]       = useState<LogLine[]>([])
  const [activeScript,   setActiveScript]   = useState<string | null>(null)
  const [selectedChapter,setSelectedChapter]= useState<string>('1')
  const logEndRef  = useRef<HTMLDivElement>(null)
  const abortRef   = useRef<AbortController | null>(null)

  // Image status panel state
  const [mainTab,        setMainTab]        = useState<'log' | 'images'>('images')
  const [imageChapters,  setImageChapters]  = useState<ChapterStatus[]>([])
  const [imageLoading,   setImageLoading]   = useState(true)
  const [expandedChapter,setExpandedChapter]= useState<string | null>(null)
  const [jobQueue,       setJobQueue]       = useState<{ chapterNum: number; act: number; step: 'all' | 'extract' | 'generate' }[]>([])
  const [activeJob,      setActiveJob]      = useState<{ chapterNum: number; act: number; step: string } | null>(null)

  // ── Load script statuses ───────────────────────────────────────────────────

  useEffect(() => {
    const allKeys = SCRIPT_GROUPS.flatMap(g => g.scripts)
    Promise.all(
      allKeys.map(key =>
        fetch(`/api/pipeline/run?script=${key}`)
          .then(r => r.json())
          .then(data => [key, data] as [string, ScriptStatus])
          .catch(() => [key, null] as [string, null])
      )
    ).then(results => {
      const map: Record<string, ScriptStatus> = {}
      for (const [key, data] of results) { if (data) map[key] = data }
      setStatuses(map)
    })
  }, [])

  // ── Load image status ──────────────────────────────────────────────────────

  const loadImageStatus = useCallback(async () => {
    setImageLoading(true)
    try {
      const res  = await fetch('/api/pipeline/image-status')
      const data = await res.json()
      if (data.chapters) {
        setImageChapters(data.chapters)
        // Auto-expand first chapter with missing work
        const first = data.chapters.find((c: ChapterStatus) =>
          c.acts.some(a => a.scenesExtracted === 0 || a.imagesGenerated < a.scenesExtracted)
        )
        if (first && !expandedChapter) setExpandedChapter(first.key)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setImageLoading(false)
    }
  }, [])

  useEffect(() => { loadImageStatus() }, [loadImageStatus])

  // Auto-scroll log
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [logLines])

  // ── Script runner ──────────────────────────────────────────────────────────

  const runScript = async (scriptKey: string, extraArgs: string[] = []) => {
    if (running) return
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    setRunning(scriptKey)
    setActiveScript(scriptKey)
    setLogLines([])
    setMainTab('log')

    try {
      const args = extraArgs.length
        ? extraArgs
        : scriptKey.startsWith('image_') ? ['--chapter', selectedChapter] : []

      const res = await fetch('/api/pipeline/run', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ scriptKey, extraArgs: args }),
        signal:  abortRef.current.signal,
      })
      if (!res.body) throw new Error('No response stream')

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed: LogLine = JSON.parse(line.slice(6))
              setLogLines(prev => [...prev, parsed])
              if (parsed.type === 'done') {
                fetch(`/api/pipeline/run?script=${scriptKey}`)
                  .then(r => r.json())
                  .then(data => setStatuses(prev => ({ ...prev, [scriptKey]: data })))
                loadImageStatus()
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setLogLines(prev => [...prev, { type: 'error', data: err.message, ts: Date.now() }])
      }
    } finally {
      setRunning(null)
      setActiveJob(null)
      // Process next job in queue
      setJobQueue(prev => {
        if (prev.length > 0) {
          const [next, ...rest] = prev
          // Kick off next job after a short delay
          setTimeout(() => triggerJob(next.chapterNum, next.act, next.step), 500)
          return rest
        }
        return prev
      })
    }
  }

  const stopScript = () => {
    abortRef.current?.abort()
    setRunning(null)
    setActiveJob(null)
    setJobQueue([])
    setLogLines(prev => [...prev, { type: 'info', data: '⏹ Stopped by user', ts: Date.now() }])
  }

  // ── Image job trigger ──────────────────────────────────────────────────────

  const triggerJob = (chapterNum: number, act: number, step: 'all' | 'extract' | 'generate') => {
    const chStr = String(chapterNum)
    const actStr = String(act)
    setActiveJob({ chapterNum, act, step })

    if (step === 'all') {
      runScript('image_extract', ['--chapter', chStr, '--act', actStr])
        .then(() => runScript('image_prompts', ['--chapter', chStr, '--act', actStr]))
        .then(() => runScript('image_generate', ['--chapter', chStr, '--act', actStr]))
    } else if (step === 'extract') {
      runScript('image_extract', ['--chapter', chStr, '--act', actStr])
        .then(() => runScript('image_prompts', ['--chapter', chStr, '--act', actStr]))
    } else {
      runScript('image_generate', ['--chapter', chStr, '--act', actStr])
    }
  }

  const queueOrRun = (chapterNum: number, act: number, step: 'all' | 'extract' | 'generate') => {
    if (!running) {
      triggerJob(chapterNum, act, step)
    } else {
      setJobQueue(prev => [...prev, { chapterNum, act, step }])
    }
  }

  const lineColor = (type: LogLine['type']) => {
    if (type === 'stderr' || type === 'error') return 'text-rose-400'
    if (type === 'done')  return 'text-emerald-400 font-semibold'
    if (type === 'start') return 'text-blue-400 font-semibold'
    if (type === 'info')  return 'text-zinc-500 italic'
    return 'text-zinc-300'
  }

  // ── Chapter totals ─────────────────────────────────────────────────────────

  const chapterTotals = (ch: ChapterStatus) => {
    const totalActs    = ch.acts.length
    const extracted    = ch.acts.filter(a => a.scenesExtracted > 0).length
    const allImaged    = ch.acts.filter(a => a.scenesExtracted > 0 && a.imagesGenerated >= a.scenesExtracted).length
    const someImaged   = ch.acts.filter(a => a.imagesGenerated > 0).length
    return { totalActs, extracted, allImaged, someImaged }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <header className="border-b border-zinc-900 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-300 text-xs font-medium transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Library
          </button>
          <div className="w-px h-4 bg-zinc-800" />
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">Pipeline Dashboard</h1>
            <p className="text-xs text-zinc-600 mt-0.5">Run pipeline scripts — no terminal needed</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {jobQueue.length > 0 && (
            <span className="text-[10px] text-amber-500 font-mono">{jobQueue.length} job{jobQueue.length > 1 ? 's' : ''} queued</span>
          )}
          {running && (
            <button onClick={stopScript}
              className="px-4 py-2 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/50 text-rose-400 text-xs font-bold rounded-lg transition-all">
              ⏹ Stop
            </button>
          )}
        </div>
      </header>

      <div className="flex h-[calc(100vh-69px)]">

        {/* ── Left sidebar: scripts ── */}
        <div className="w-72 border-r border-zinc-900 overflow-y-auto flex-none bg-[#0b0b0b] p-4 space-y-6">
          {SCRIPT_GROUPS.map(group => (
            <div key={group.label}>
              <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-2 px-1 flex items-center justify-between">
                <div className="flex items-center gap-2"><span>{group.icon}</span>{group.label}</div>
                {group.label === 'Image Pipeline' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-zinc-500">Ch:</span>
                    <select value={selectedChapter} onChange={e => setSelectedChapter(e.target.value)}
                      className="bg-zinc-900 border border-zinc-700 text-[10px] text-zinc-300 rounded px-1 py-0.5 focus:outline-none">
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                      <option value="0">Epilogue</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                {group.scripts.map(key => {
                  const status    = statuses[key]
                  const isRunning = running === key
                  const isActive  = activeScript === key
                  const st        = isRunning ? 'running' : (status?.lastStatus || 'never_run')
                  const stStyle   = STATUS_STYLE[st]
                  return (
                    <div key={key} onClick={() => !running && setActiveScript(key)}
                      className={`rounded-xl border p-3 cursor-pointer transition-all ${
                        isActive ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900 hover:border-zinc-700'
                      } ${running && !isRunning ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-white">{status?.script?.label || key}</span>
                        <div className={`w-1.5 h-1.5 rounded-full flex-none ${stStyle.dot}`} />
                      </div>
                      <p className="text-[10px] text-zinc-600 leading-snug mb-2.5">{status?.script?.description || ''}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] ${stStyle.text}`}>
                          {isRunning ? 'Running…' : status?.lastRun
                            ? `Last: ${new Date(status.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : 'Never run'}
                        </span>
                        <button onClick={e => { e.stopPropagation(); runScript(key) }} disabled={!!running}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            isRunning ? 'bg-amber-900/40 text-amber-400 cursor-not-allowed'
                            : running   ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                            : 'bg-zinc-700 hover:bg-white text-white hover:text-black'}`}>
                          {isRunning ? '⏳' : '▶ Run'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Quick links */}
          <div>
            <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-2 px-1">Other Tools</div>
            <div className="space-y-1">
              {[{ label: 'Chapter Review', href: '/', icon: '📖' }, { label: 'Characters', href: '/characters', icon: '👥' }].map(l => (
                <button key={l.href} onClick={() => router.push(l.href)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/40 border border-zinc-800/60 hover:bg-zinc-900 hover:border-zinc-700 text-left transition-all">
                  <span>{l.icon}</span>
                  <span className="text-xs text-zinc-400">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Tab bar */}
          <div className="flex-none flex items-center gap-1 px-5 py-2.5 border-b border-zinc-900 bg-[#0a0a0a]">
            {([['images', '🖼️  Image Tracker'], ['log', '⚡  Run Log']] as const).map(([tab, label]) => (
              <button key={tab} onClick={() => setMainTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mainTab === tab
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-600 hover:text-zinc-300'}`}>
                {label}
              </button>
            ))}
            {running && (
              <div className="ml-auto flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] text-amber-500 font-mono">
                  {activeJob
                    ? `${activeJob.step} · Ch${activeJob.chapterNum} Act ${activeJob.act}`
                    : `Running: ${statuses[running]?.script?.label || running}`}
                </span>
              </div>
            )}
            {mainTab === 'images' && (
              <button onClick={loadImageStatus}
                className="ml-auto text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
                Refresh
              </button>
            )}
          </div>

          {/* ── IMAGE TRACKER TAB ── */}
          {mainTab === 'images' && (
            <div className="flex-1 overflow-y-auto bg-[#080808]">
              {imageLoading ? (
                <div className="flex items-center justify-center h-full gap-3 text-zinc-700">
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-700 border-t-zinc-400 animate-spin" />
                  Loading image status…
                </div>
              ) : imageChapters.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div className="text-4xl opacity-20">🖼️</div>
                  <p className="text-zinc-600 text-sm">No act files found in pipeline/acts/</p>
                  <p className="text-zinc-700 text-xs">Make sure Ch1_Act1.txt etc. exist</p>
                </div>
              ) : (
                <div className="p-5 space-y-2">

                  {/* Legend */}
                  <div className="flex items-center gap-4 px-1 pb-3 border-b border-zinc-900 mb-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-700">Legend</span>
                    {[
                      { icon: '✓', color: 'text-emerald-400', label: 'Done' },
                      { icon: '◑', color: 'text-amber-400',   label: 'Partial' },
                      { icon: '○', color: 'text-zinc-700',    label: 'Not started' },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <span className={`text-sm leading-none ${l.color}`}>{l.icon}</span>
                        <span className="text-[10px] text-zinc-600">{l.label}</span>
                      </div>
                    ))}
                    <div className="ml-auto flex items-center gap-4 text-[10px] text-zinc-600">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-zinc-700 inline-block"/>Scenes</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-900 inline-block"/>Prompts</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-900 inline-block"/>Images</span>
                    </div>
                  </div>

                  {imageChapters.map(ch => {
                    const totals     = chapterTotals(ch)
                    const isExpanded = expandedChapter === ch.key
                    const allDone    = totals.allImaged === totals.totalActs && totals.totalActs > 0
                    const noneStarted = totals.someImaged === 0 && totals.extracted === 0

                    return (
                      <div key={ch.key} className={`rounded-xl border transition-all ${
                        allDone ? 'border-emerald-900/40 bg-emerald-950/10'
                        : noneStarted ? 'border-zinc-800/60 bg-zinc-900/20'
                        : 'border-amber-900/30 bg-amber-950/10'}`}>

                        {/* Chapter header row */}
                        <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                          onClick={() => setExpandedChapter(isExpanded ? null : ch.key)}>

                          {/* Expand chevron */}
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                            className={`text-zinc-600 flex-none transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                            <path d="M9 18l6-6-6-6"/>
                          </svg>

                          {/* Chapter name */}
                          <span className="text-sm font-bold text-white w-28 flex-none">{ch.label}</span>

                          {/* Overall tick */}
                          <div className="flex-none">
                            <Tick
                              done={allDone}
                              partial={!allDone && (totals.someImaged > 0 || totals.extracted > 0)}
                            />
                          </div>

                          {/* Progress bar */}
                          <div className="flex-1 mx-2">
                            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-600 rounded-full transition-all"
                                style={{ width: `${totals.totalActs > 0 ? (totals.allImaged / totals.totalActs) * 100 : 0}%` }} />
                            </div>
                          </div>

                          {/* Counts */}
                          <span className="text-[10px] text-zinc-500 flex-none">
                            {totals.allImaged}/{totals.totalActs} acts done
                          </span>

                          {/* Generate all button */}
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              ch.acts.forEach(a => {
                                const step = a.scenesExtracted === 0 ? 'all' : 'generate'
                                queueOrRun(ch.chapterNum ?? 0, a.act, step)
                              })
                            }}
                            disabled={!!running && jobQueue.length === 0}
                            className={`flex-none px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              allDone
                                ? 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                                : 'bg-zinc-700 hover:bg-white text-white hover:text-black'
                            }`}>
                            {allDone ? '↺ Regen All' : '▶ Gen All'}
                          </button>
                        </div>

                        {/* Expanded: act rows */}
                        {isExpanded && (
                          <div className="border-t border-zinc-800/50 divide-y divide-zinc-800/30">

                            {/* Column headers */}
                            <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/30">
                              <span className="text-[9px] text-zinc-700 font-black uppercase tracking-widest w-12">Act</span>
                              <span className="text-[9px] text-zinc-700 font-black uppercase tracking-widest w-20 text-center">Scenes</span>
                              <span className="text-[9px] text-zinc-700 font-black uppercase tracking-widest w-20 text-center">Prompts</span>
                              <span className="text-[9px] text-zinc-700 font-black uppercase tracking-widest w-20 text-center">Images</span>
                              <span className="text-[9px] text-zinc-700 font-black uppercase tracking-widest flex-1" />
                              <span className="text-[9px] text-zinc-700 font-black uppercase tracking-widest w-32 text-right">Actions</span>
                            </div>

                            {ch.acts.map(act => {
                              const isJobRunning = !!running && activeJob?.chapterNum === (ch.chapterNum ?? 0) && activeJob?.act === act.act
                              const isQueued     = jobQueue.some(j => j.chapterNum === (ch.chapterNum ?? 0) && j.act === act.act)
                              const hasScenes    = act.scenesExtracted > 0
                              const hasPrompts   = act.promptsBuilt > 0
                              const hasImages    = act.imagesGenerated > 0
                              const allImaged    = hasScenes && act.imagesGenerated >= act.scenesExtracted
                              const chNum        = ch.chapterNum ?? 0

                              return (
                                <div key={act.act}
                                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                                    isJobRunning ? 'bg-amber-950/20' : 'hover:bg-zinc-800/20'}`}>

                                  {/* Act label */}
                                  <span className="text-xs font-semibold text-zinc-400 w-12">Act {act.act}</span>

                                  {/* Scenes extracted */}
                                  <div className="w-20 flex items-center justify-center gap-1.5">
                                    <Tick done={hasScenes} />
                                    <span className="text-[10px] text-zinc-600">
                                      {hasScenes ? act.scenesExtracted : '—'}
                                    </span>
                                  </div>

                                  {/* Prompts built */}
                                  <div className="w-20 flex items-center justify-center gap-1.5">
                                    <Tick
                                      done={hasPrompts && act.promptsBuilt >= act.scenesExtracted}
                                      partial={hasPrompts && act.promptsBuilt < act.scenesExtracted}
                                    />
                                    <span className="text-[10px] text-zinc-600">
                                      {hasPrompts ? `${act.promptsBuilt}/${act.scenesExtracted}` : '—'}
                                    </span>
                                  </div>

                                  {/* Images generated */}
                                  <div className="w-20 flex items-center justify-center gap-1.5">
                                    <Tick
                                      done={allImaged}
                                      partial={hasImages && !allImaged}
                                    />
                                    <span className={`text-[10px] ${allImaged ? 'text-emerald-500' : hasImages ? 'text-amber-500' : 'text-zinc-600'}`}>
                                      {hasScenes ? `${act.imagesGenerated}/${act.scenesExtracted}` : '—'}
                                    </span>
                                  </div>

                                  {/* Status label */}
                                  <div className="flex-1">
                                    {isJobRunning && (
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        <span className="text-[10px] text-amber-400">Running…</span>
                                      </div>
                                    )}
                                    {isQueued && !isJobRunning && (
                                      <span className="text-[10px] text-zinc-500 italic">Queued</span>
                                    )}
                                  </div>

                                  {/* Action buttons */}
                                  <div className="flex items-center gap-1.5 w-32 justify-end">
                                    {!hasScenes ? (
                                      // Nothing extracted yet — offer full pipeline
                                      <button
                                        onClick={() => queueOrRun(chNum, act.act, 'all')}
                                        disabled={isJobRunning}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-900/50 hover:bg-blue-700 text-blue-300 hover:text-white transition-all disabled:opacity-40">
                                        ▶ Extract + Gen
                                      </button>
                                    ) : !allImaged ? (
                                      // Scenes exist but images incomplete — generate
                                      <button
                                        onClick={() => queueOrRun(chNum, act.act, 'generate')}
                                        disabled={isJobRunning}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-900/50 hover:bg-emerald-700 text-emerald-300 hover:text-white transition-all disabled:opacity-40">
                                        ▶ Generate
                                      </button>
                                    ) : (
                                      // All done — offer regenerate
                                      <button
                                        onClick={() => queueOrRun(chNum, act.act, 'generate')}
                                        disabled={isJobRunning}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-all disabled:opacity-40">
                                        ↺ Regen
                                      </button>
                                    )}
                                    {/* Re-extract button (always available) */}
                                    {hasScenes && (
                                      <button
                                        onClick={() => queueOrRun(chNum, act.act, 'extract')}
                                        disabled={isJobRunning}
                                        title="Re-extract scenes"
                                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-zinc-800/80 hover:bg-zinc-700 text-zinc-600 hover:text-zinc-300 transition-all disabled:opacity-40">
                                        ↺ Extract
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── LOG TAB ── */}
          {mainTab === 'log' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-none flex items-center justify-between px-5 py-2 border-b border-zinc-900/60 bg-[#0a0a0a]">
                <span className="text-xs text-zinc-600 font-mono">
                  {activeScript ? `${statuses[activeScript]?.script?.label || activeScript}` : 'No script selected'}
                </span>
                {logLines.length > 0 && (
                  <button onClick={() => setLogLines([])}
                    className="text-[10px] text-zinc-700 hover:text-zinc-400 transition-colors">Clear</button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-5 font-mono text-xs leading-relaxed bg-[#080808]">
                {logLines.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                    <div className="text-4xl opacity-20">⚡</div>
                    <p className="text-zinc-700 text-sm">Click ▶ Run or use the Image Tracker to generate</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {logLines.map((line, i) => (
                      <div key={i} className={`${lineColor(line.type)} flex gap-3`}>
                        <span className="text-zinc-800 flex-none w-16 text-right">
                          {new Date(line.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="flex-1 whitespace-pre-wrap break-all">{line.data}</span>
                      </div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                )}
              </div>
              <div className="flex-none flex items-center justify-between px-5 py-2 border-t border-zinc-900/60 bg-[#080808]">
                <span className="text-[9px] text-zinc-800 font-mono">{logLines.length} lines</span>
                {running && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[9px] text-amber-600 font-mono">Process running</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
