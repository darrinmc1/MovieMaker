'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ScriptInfo {
  label: string
  file: string
  description: string
  args?: string[]
}

interface ScriptStatus {
  script: ScriptInfo
  lastRun: string | null
  lastStatus: 'success' | 'error' | 'never_run'
}

interface LogLine {
  type: 'start' | 'info' | 'stdout' | 'stderr' | 'done' | 'error'
  data: string
  ts: number
}

const SCRIPT_KEYS = [
  'populate_sheets',
  'book1_review',
  'add_book2_data',
  'image_extract',
  'image_prompts',
  'image_generate',
  'image_status',
]

const STATUS_STYLE = {
  success:   { dot: 'bg-emerald-500', text: 'text-emerald-400', label: 'Last run OK' },
  error:     { dot: 'bg-rose-500',    text: 'text-rose-400',    label: 'Last run failed' },
  never_run: { dot: 'bg-zinc-700',    text: 'text-zinc-600',    label: 'Never run' },
}

const LOG_STYLE: Record<LogLine['type'], string> = {
  start:  'text-zinc-300 font-bold',
  info:   'text-zinc-500',
  stdout: 'text-zinc-400',
  stderr: 'text-rose-400',
  done:   'text-emerald-400 font-bold',
  error:  'text-rose-400 font-bold',
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function PipelinePage() {
  const router = useRouter()
  const [scripts, setScripts] = useState<Record<string, ScriptStatus>>({})
  const [loading, setLoading] = useState(true)
  const [activeScript, setActiveScript] = useState<string | null>(null)
  const [running, setRunning] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogLine[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all(
      SCRIPT_KEYS.map(key =>
        fetch(`/api/pipeline/run?script=${key}`)
          .then(r => r.json())
          .then(d => [key, d] as [string, ScriptStatus])
      )
    ).then(entries => {
      setScripts(Object.fromEntries(entries))
      setActiveScript(SCRIPT_KEYS[0])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    // Auto-scroll log to bottom
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [logs])

  async function runScript(key: string) {
    if (running) return
    setRunning(key)
    setActiveScript(key)
    setLogs([])

    try {
      const res = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptKey: key }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No stream')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        const lines = text.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          try {
            const msg = JSON.parse(line.slice(6)) as LogLine
            setLogs(l => [...l, msg])
          } catch { /* skip malformed */ }
        }
      }

      // Refresh this script's status
      fetch(`/api/pipeline/run?script=${key}`)
        .then(r => r.json())
        .then(d => setScripts(s => ({ ...s, [key]: d })))

    } catch (e: unknown) {
      setLogs(l => [...l, {
        type: 'error',
        data: `Failed to run: ${e instanceof Error ? e.message : 'Unknown error'}`,
        ts: Date.now(),
      }])
    } finally {
      setRunning(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-zinc-500 animate-spin" />
      </div>
    </div>
  )

  const active = activeScript ? scripts[activeScript] : null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Header */}
      <header className="flex-none border-b border-zinc-900 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-300 text-xs font-medium transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Library
        </button>
        <div className="w-px h-4 bg-zinc-800" />
        <div>
          <div className="text-[10px] text-zinc-700 uppercase tracking-widest">VBook</div>
          <div className="text-sm font-black text-white">Pipeline Dashboard</div>
        </div>
        <div className="ml-auto text-[10px] text-zinc-700">
          {running ? (
            <span className="text-amber-400 animate-pulse">⟳ Running {scripts[running]?.script?.label}…</span>
          ) : (
            `${SCRIPT_KEYS.length} scripts available`
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Script list */}
        <aside className="flex-none w-64 border-r border-zinc-900 overflow-y-auto bg-[#080808] p-3">
          <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest px-2 mb-3">Scripts</div>
          {SCRIPT_KEYS.map(key => {
            const s = scripts[key]
            if (!s) return null
            const st = STATUS_STYLE[s.lastStatus] || STATUS_STYLE.never_run
            const isActive  = activeScript === key
            const isRunning = running === key

            return (
              <button
                key={key}
                onClick={() => setActiveScript(key)}
                className={`w-full text-left px-3 py-3 rounded-xl mb-1 transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold truncate">{s.script.label}</span>
                  {isRunning && (
                    <span className="flex-none w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                  {!isRunning && (
                    <span className={`flex-none w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  )}
                </div>
                <div className="text-[9px] text-zinc-700">{timeAgo(s.lastRun)}</div>
              </button>
            )
          })}
        </aside>

        {/* Main panel */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Script details */}
          {active && (
            <div className="flex-none border-b border-zinc-900 px-6 py-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-black text-white mb-1">{active.script.label}</div>
                <div className="text-xs text-zinc-500 mb-2">{active.script.description}</div>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 ${STATUS_STYLE[active.lastStatus].text}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLE[active.lastStatus].dot}`} />
                    <span className="text-[10px]">{STATUS_STYLE[active.lastStatus].label}</span>
                  </div>
                  <span className="text-zinc-800 text-[10px]">·</span>
                  <span className="text-[10px] text-zinc-700">
                    {active.script.file}
                    {active.script.args ? ` ${active.script.args.join(' ')}` : ''}
                  </span>
                  {active.lastRun && (
                    <>
                      <span className="text-zinc-800 text-[10px]">·</span>
                      <span className="text-[10px] text-zinc-700">Last run {timeAgo(active.lastRun)}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => activeScript && runScript(activeScript)}
                disabled={!!running}
                className="flex-none flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-white hover:text-black border border-zinc-700 text-zinc-300 text-sm font-bold rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {running === activeScript ? (
                  <><span className="animate-spin">⟳</span> Running…</>
                ) : (
                  <>▶ Run</>
                )}
              </button>
            </div>
          )}

          {/* Log output */}
          <div ref={logRef} className="flex-1 overflow-y-auto p-6 font-mono">
            {logs.length === 0 && !running && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-zinc-700 text-3xl mb-3">▶</div>
                <div className="text-sm text-zinc-600">Select a script and click Run</div>
                <div className="text-[10px] text-zinc-700 mt-1">Output will stream here in real time</div>
              </div>
            )}
            {logs.map((line, i) => (
              <div key={i} className={`text-xs leading-relaxed mb-0.5 ${LOG_STYLE[line.type] || 'text-zinc-400'}`}>
                <span className="text-zinc-700 mr-2 select-none text-[9px]">
                  {new Date(line.ts).toLocaleTimeString('en-AU', { hour12: false })}
                </span>
                {line.data}
              </div>
            ))}
            {running && (
              <div className="text-[10px] text-amber-400 font-mono animate-pulse mt-1">
                ⟳ process running…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
