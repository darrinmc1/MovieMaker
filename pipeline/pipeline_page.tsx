'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ScriptMeta {
  label: string
  file: string
  args?: string[]
  description: string
}

interface ScriptStatus {
  script: ScriptMeta
  lastRun: string | null
  lastStatus: 'success' | 'error' | 'never_run'
}

interface LogLine {
  type: 'start' | 'stdout' | 'stderr' | 'info' | 'done' | 'error'
  data: string
  ts: number
}

const SCRIPT_GROUPS = [
  {
    label: 'Google Sheets',
    icon: '📊',
    scripts: ['populate_sheets', 'add_book2_data'],
  },
  {
    label: 'Book 1 Review',
    icon: '📝',
    scripts: ['book1_review'],
  },
  {
    label: 'Image Pipeline',
    icon: '🖼️',
    scripts: ['image_extract', 'image_prompts', 'image_generate', 'image_status'],
  },
]

const STATUS_STYLE: Record<string, { dot: string; text: string; label: string }> = {
  success:   { dot: 'bg-emerald-500', text: 'text-emerald-400', label: 'Last run succeeded' },
  error:     { dot: 'bg-rose-500',    text: 'text-rose-400',    label: 'Last run failed'    },
  never_run: { dot: 'bg-zinc-700',    text: 'text-zinc-600',    label: 'Never run'          },
  running:   { dot: 'bg-amber-500 animate-pulse', text: 'text-amber-400', label: 'Running…' },
}

export default function PipelinePage() {
  const router = useRouter()
  const [statuses, setStatuses]       = useState<Record<string, ScriptStatus>>({})
  const [running, setRunning]         = useState<string | null>(null)
  const [logLines, setLogLines]       = useState<LogLine[]>([])
  const [activeScript, setActiveScript] = useState<string | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const logEndRef = useRef<HTMLDivElement>(null)
  const abortRef  = useRef<AbortController | null>(null)

  // Load all script statuses on mount
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
      for (const [key, data] of results) {
        if (data) map[key] = data
      }
      setStatuses(map)
      setLoadingStatus(false)
    })
  }, [])

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logLines])

  const runScript = async (scriptKey: string) => {
    if (running) return

    // Abort any previous stream
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setRunning(scriptKey)
    setActiveScript(scriptKey)
    setLogLines([])

    try {
      const res = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptKey }),
        signal: abortRef.current.signal,
      })

      if (!res.body) throw new Error('No response stream')

      const reader = res.body.getReader()
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
                // Refresh status for this script
                fetch(`/api/pipeline/run?script=${scriptKey}`)
                  .then(r => r.json())
                  .then(data => setStatuses(prev => ({ ...prev, [scriptKey]: data })))
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
    }
  }

  const stopScript = () => {
    abortRef.current?.abort()
    setRunning(null)
    setLogLines(prev => [...prev, { type: 'info', data: '⏹ Stopped by user', ts: Date.now() }])
  }

  const lineColor = (type: LogLine['type']) => {
    if (type === 'stderr' || type === 'error') return 'text-rose-400'
    if (type === 'done')  return 'text-emerald-400 font-semibold'
    if (type === 'start') return 'text-blue-400 font-semibold'
    if (type === 'info')  return 'text-zinc-500 italic'
    return 'text-zinc-300'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Header */}
      <header className="border-b border-zinc-900 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-300 text-xs font-medium transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Library
          </button>
          <div className="w-px h-4 bg-zinc-800" />
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">Pipeline Dashboard</h1>
            <p className="text-xs text-zinc-600 mt-0.5">Run pipeline scripts directly — no terminal needed</p>
          </div>
        </div>
        {running && (
          <button onClick={stopScript}
            className="px-4 py-2 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/50 text-rose-400 text-xs font-bold rounded-lg transition-all">
            ⏹ Stop Running Script
          </button>
        )}
      </header>

      <div className="flex h-[calc(100vh-69px)]">

        {/* Script list */}
        <div className="w-80 border-r border-zinc-900 overflow-y-auto flex-none bg-[#0b0b0b] p-4 space-y-6">
          {SCRIPT_GROUPS.map(group => (
            <div key={group.label}>
              <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
                <span>{group.icon}</span> {group.label}
              </div>
              <div className="space-y-1">
                {group.scripts.map(key => {
                  const status = statuses[key]
                  const isRunning = running === key
                  const isActive = activeScript === key
                  const st = isRunning ? 'running' : (status?.lastStatus || 'never_run')
                  const stStyle = STATUS_STYLE[st]

                  return (
                    <div key={key}
                      onClick={() => !running && setActiveScript(key)}
                      className={`group rounded-xl border p-3 cursor-pointer transition-all ${
                        isActive
                          ? 'bg-zinc-800 border-zinc-700'
                          : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900 hover:border-zinc-700'
                      } ${running && !isRunning ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-white">
                          {status?.script?.label || key}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full flex-none ${stStyle.dot}`} />
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-600 leading-snug mb-2.5">
                        {status?.script?.description || ''}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] ${stStyle.text}`}>
                          {isRunning ? 'Running…' : status?.lastRun
                            ? `Last: ${new Date(status.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : 'Never run'}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); runScript(key) }}
                          disabled={!!running}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            isRunning
                              ? 'bg-amber-900/40 text-amber-400 cursor-not-allowed'
                              : running
                              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                              : 'bg-zinc-700 hover:bg-white text-white hover:text-black'
                          }`}
                        >
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
              {[
                { label: 'Chapter Review', href: '/', icon: '📖' },
                { label: 'Characters', href: '/characters', icon: '👥' },
              ].map(l => (
                <button key={l.href} onClick={() => router.push(l.href)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/40 border border-zinc-800/60 hover:bg-zinc-900 hover:border-zinc-700 text-left transition-all">
                  <span>{l.icon}</span>
                  <span className="text-xs text-zinc-400">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Log panel */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Log header */}
          <div className="flex-none flex items-center justify-between px-5 py-3 border-b border-zinc-900 bg-[#0a0a0a]">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${running ? 'bg-amber-500 animate-pulse' : logLines.length ? 'bg-zinc-600' : 'bg-zinc-800'}`} />
              <span className="text-xs text-zinc-500 font-mono">
                {running ? `Running: ${statuses[running]?.script?.label || running}` :
                 activeScript ? `${statuses[activeScript]?.script?.label || activeScript} — log` :
                 'Select a script to run'}
              </span>
            </div>
            {logLines.length > 0 && (
              <button onClick={() => setLogLines([])}
                className="text-[10px] text-zinc-700 hover:text-zinc-400 transition-colors font-medium">
                Clear
              </button>
            )}
          </div>

          {/* Log output */}
          <div className="flex-1 overflow-y-auto p-5 font-mono text-xs leading-relaxed bg-[#080808]">
            {logLines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                <div className="text-4xl opacity-20">⚡</div>
                <p className="text-zinc-700 text-sm">Click ▶ Run on any script to see output here</p>
                <p className="text-zinc-800 text-xs max-w-xs">
                  Scripts run in the background. You can navigate the app while they run.
                </p>
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

          {/* Status bar */}
          <div className="flex-none flex items-center justify-between px-5 py-2 border-t border-zinc-900/60 bg-[#080808]">
            <span className="text-[9px] text-zinc-800 font-mono">
              {logLines.length} lines
            </span>
            {running && (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[9px] text-amber-600 font-mono">Process running</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
