'use client'

// components/RunAllModal.tsx
// Triggered from the home page. Queues all chapters for review and shows live progress.

import { useState, useRef, useEffect } from 'react'

interface ChapterResult {
  chapterNum: number
  chapterTitle?: string
  status: 'pending' | 'running' | 'done' | 'skipped' | 'error'
  score?: number
  error?: string
}

interface Props {
  onClose: () => void
  onComplete: () => void  // reload chapter list when done
}

const CHAPTER_TITLES: Record<number, string> = {
  1:  "The Dragon's Last Breath",   2: "Gathering Shadows",
  3:  "Nature's Messenger",         4: "The Seven",
  5:  "The Undervault",             6: "Stone That Breathes",
  7:  "The Sanctum Falls",          8: "Aftermath",
  9:  "The Road Between",          10: "The Red Sky",
  11: "Graveside Oath",            12: "Before the Boundary",
}

function scoreColor(s?: number) {
  if (!s) return 'text-zinc-600'
  if (s >= 8) return 'text-emerald-400'
  if (s >= 6) return 'text-amber-400'
  return 'text-rose-400'
}

export default function RunAllModal({ onClose, onComplete }: Props) {
  const [skipExisting, setSkipExisting] = useState(true)
  const [started, setStarted]           = useState(false)
  const [complete, setComplete]         = useState(false)
  const [chapters, setChapters]         = useState<ChapterResult[]>(
    Array.from({ length: 12 }, (_, i) => ({
      chapterNum: i + 1,
      chapterTitle: CHAPTER_TITLES[i + 1],
      status: 'pending',
    }))
  )
  const [summary, setSummary] = useState<{
    reviewed: number; skipped: number; errors: number; avgScore: string | null
  } | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chapters])

  const updateChapter = (num: number, update: Partial<ChapterResult>) => {
    setChapters(prev => prev.map(c => c.chapterNum === num ? { ...c, ...update } : c))
  }

  const start = async () => {
    setStarted(true)
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/chapters/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapters: 'all', skipExisting }),
        signal: abortRef.current.signal,
      })

      if (!res.body) throw new Error('No stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          try {
            const event = JSON.parse(part.slice(6))

            if (event.type === 'progress') {
              updateChapter(event.chapterNum, { status: 'running' })
            }
            if (event.type === 'chapter_done') {
              updateChapter(event.chapterNum, { status: 'done', score: event.score })
            }
            if (event.type === 'skip') {
              updateChapter(event.chapterNum, { status: 'skipped', score: event.score })
            }
            if (event.type === 'error') {
              updateChapter(event.chapterNum, { status: 'error', error: event.error })
            }
            if (event.type === 'complete') {
              setSummary({
                reviewed: event.reviewed,
                skipped: event.skipped,
                errors: event.errors,
                avgScore: event.avgScore,
              })
              setComplete(true)
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Queue error:', err)
      }
    }
  }

  const stop = () => {
    abortRef.current?.abort()
    setStarted(false)
    setChapters(prev => prev.map(c =>
      c.status === 'running' || c.status === 'pending' ? { ...c, status: 'pending' } : c
    ))
  }

  const statusIcon = (s: ChapterResult['status'], score?: number) => {
    if (s === 'running')  return <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
    if (s === 'done')     return <span className={`text-sm font-black ${scoreColor(score)}`}>{score}/10</span>
    if (s === 'skipped')  return <span className="text-xs text-zinc-600 font-mono">{score ? `${score}/10` : '—'}</span>
    if (s === 'error')    return <span className="text-xs text-rose-500">error</span>
    return <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
  }

  const doneCount  = chapters.filter(c => c.status === 'done').length
  const totalCount = chapters.length
  const progress   = doneCount / totalCount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
          <div>
            <h2 className="text-sm font-black text-white">Review All Chapters</h2>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              {started ? `${doneCount + chapters.filter(c => c.status === 'skipped').length} / ${totalCount} complete` : 'Runs Gemini review on each chapter sequentially (~8 min total)'}
            </p>
          </div>
          {!started && (
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg bg-zinc-900 text-zinc-500 hover:text-white flex items-center justify-center text-xs transition-colors">✕</button>
          )}
        </div>

        {/* Progress bar */}
        {started && (
          <div className="h-0.5 bg-zinc-900">
            <div className="h-full bg-zinc-500 transition-all duration-500"
              style={{ width: `${progress * 100}%` }} />
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Pre-start options */}
          {!started && (
            <div className="px-6 py-5 space-y-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-500 leading-relaxed space-y-2">
                <p>Gemini will review all 12 chapters one by one. Each takes ~40 seconds. Results are saved to <code className="text-zinc-400">review_decisions/</code> as they complete.</p>
                <p>You can close this window and the queue will continue running in the background.</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div onClick={() => setSkipExisting(!skipExisting)}
                  className={`w-9 h-5 rounded-full transition-all relative ${skipExisting ? 'bg-zinc-600' : 'bg-zinc-800'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${skipExisting ? 'left-4' : 'left-0.5'}`} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-300">Skip already-reviewed chapters</div>
                  <div className="text-[10px] text-zinc-600">Chapters with existing reviews won't be re-run</div>
                </div>
              </label>
            </div>
          )}

          {/* Chapter list */}
          {started && (
            <div className="px-4 py-3 space-y-0.5">
              {chapters.map(c => (
                <div key={c.chapterNum}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    c.status === 'running' ? 'bg-amber-950/10 border border-amber-900/20' :
                    c.status === 'done' ? 'bg-zinc-900/30' :
                    c.status === 'error' ? 'bg-rose-950/10 border border-rose-900/20' :
                    ''
                  }`}>
                  <span className="text-[10px] text-zinc-700 font-mono w-5 flex-none">{String(c.chapterNum).padStart(2, '0')}</span>
                  <span className={`text-xs flex-1 transition-colors ${
                    c.status === 'running' ? 'text-white font-medium' :
                    c.status === 'done' || c.status === 'skipped' ? 'text-zinc-400' :
                    'text-zinc-700'
                  }`}>{c.chapterTitle}</span>
                  {c.status === 'skipped' && <span className="text-[9px] text-zinc-700 uppercase tracking-widest">skipped</span>}
                  {c.error && <span className="text-[10px] text-rose-500 truncate max-w-32">{c.error}</span>}
                  <div className="flex-none w-12 flex justify-end">
                    {statusIcon(c.status, c.score)}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Complete summary */}
          {complete && summary && (
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-emerald-400">{summary.reviewed}</div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-0.5">Reviewed</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-zinc-500">{summary.skipped}</div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-0.5">Skipped</div>
                </div>
                <div className={`border rounded-xl p-3 text-center ${summary.avgScore ? 'bg-amber-950/20 border-amber-900/30' : 'bg-zinc-900 border-zinc-800'}`}>
                  <div className={`text-xl font-black ${summary.avgScore ? 'text-amber-400' : 'text-zinc-600'}`}>
                    {summary.avgScore || '—'}
                  </div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-0.5">Avg score</div>
                </div>
              </div>
              {summary.errors > 0 && (
                <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-3">
                  <p className="text-xs text-rose-300">{summary.errors} chapter{summary.errors > 1 ? 's' : ''} failed — check the chapter files exist on disk</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-none px-6 py-4 border-t border-zinc-900 flex justify-between items-center">
          {!started && (
            <>
              <button onClick={onClose} className="px-4 py-2 text-zinc-600 hover:text-zinc-300 text-sm transition-colors">Cancel</button>
              <button onClick={start}
                className="px-6 py-2.5 bg-white text-black font-bold text-sm rounded-xl hover:bg-zinc-100 active:scale-[0.98] transition-all">
                Start Review Queue →
              </button>
            </>
          )}
          {started && !complete && (
            <button onClick={stop}
              className="ml-auto px-4 py-2 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/50 text-rose-400 text-xs font-bold rounded-lg transition-all">
              ⏹ Stop
            </button>
          )}
          {complete && (
            <button onClick={() => { onComplete(); onClose() }}
              className="ml-auto px-6 py-2.5 bg-white text-black font-bold text-sm rounded-xl hover:bg-zinc-100 transition-all">
              Done — Back to Library
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
