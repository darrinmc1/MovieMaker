'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Act {
  number: number
  name: string
  content: string
  wordCount: number
}

interface Suggestion {
  id: string
  actNumber: number
  type: 'rewrite' | 'insert' | 'delete' | 'rephrase'
  original: string
  suggested: string
  reason: string
  accepted: boolean | null
}

interface ChapterData {
  chapterNum: number
  title: string
  filename: string
  exists: boolean
  content: string
  acts: Act[]
  wordCount: number
  actCount: number
  reviewStatus: string
  score: string | null
  lastReviewed: string | null
  suggestions: Suggestion[]
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  not_reviewed: { label: 'Not reviewed', dot: 'bg-zinc-700',    text: 'text-zinc-500' },
  in_progress:  { label: 'In progress',  dot: 'bg-amber-500',   text: 'text-amber-400' },
  reviewed:     { label: 'Reviewed',     dot: 'bg-blue-500',    text: 'text-blue-400' },
  finalized:    { label: 'Finalized',    dot: 'bg-emerald-500', text: 'text-emerald-400' },
}

function scoreColor(s: string | null) {
  if (!s) return 'text-zinc-700'
  const n = parseFloat(s)
  if (n >= 8) return 'text-emerald-400'
  if (n >= 6) return 'text-amber-400'
  return 'text-rose-400'
}

function ActSection({ act, refCallback }: { act: Act; refCallback: (el: HTMLDivElement | null) => void }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div ref={refCallback} className="mb-16">
      {/* Act heading */}
      <div className="flex items-center gap-4 mb-6 group cursor-pointer" onClick={() => setCollapsed(c => !c)}>
        <div className="flex-none">
          <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Act {act.number}</div>
          <div className="text-lg font-black text-zinc-200 leading-tight">{act.name}</div>
        </div>
        <div className="flex-1 h-px bg-zinc-800" />
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-700">{act.wordCount.toLocaleString()} words</span>
          <button className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors text-xs">
            {collapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {/* Act content */}
      {!collapsed && (
        <div className="text-base text-zinc-300 leading-8 whitespace-pre-wrap"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: '0.01em' }}>
          {act.content}
        </div>
      )}

      {collapsed && (
        <div className="text-xs text-zinc-700 italic py-2 pl-1">Act collapsed — click heading to expand</div>
      )}
    </div>
  )
}

export default function ChapterPage() {
  const router = useRouter()
  const params = useParams()
  const num = params?.num as string

  const [chapter, setChapter] = useState<ChapterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeAct, setActiveAct] = useState(1)
  const [reviewing, setReviewing] = useState(false)
  const [reviewLog, setReviewLog] = useState<string[]>([])
  const [showApply, setShowApply] = useState(false)
  const actRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    if (!num) return
    fetch(`/api/chapters/${num}`)
      .then(r => r.json())
      .then(d => { setChapter(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [num])

  const accepted = chapter?.suggestions?.filter(s => s.accepted === true) || []
  const pending  = chapter?.suggestions?.filter(s => s.accepted === null) || []
  const status   = STATUS_CONFIG[chapter?.reviewStatus || 'not_reviewed']

  function scrollToAct(actNum: number) {
    setActiveAct(actNum)
    actRefs.current[actNum]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function runReview() {
    if (!chapter) return
    setReviewing(true)
    setReviewLog(['Starting AI review…'])
    try {
      const res = await fetch('/api/chapters/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNum: chapter.chapterNum }),
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
            const msg = JSON.parse(line.slice(6))
            if (msg.log) setReviewLog(l => [...l, msg.log])
            if (msg.done) {
              // reload chapter to get new suggestions
              const fresh = await fetch(`/api/chapters/${num}`).then(r => r.json())
              setChapter(fresh)
              setReviewLog(l => [...l, '✓ Review complete'])
            }
          } catch { /* skip */ }
        }
      }
    } catch (e: unknown) {
      setReviewLog(l => [...l, `Error: ${e instanceof Error ? e.message : 'Unknown error'}`])
    } finally {
      setReviewing(false)
    }
  }

  async function acceptSuggestion(id: string, accept: boolean) {
    if (!chapter) return
    const updated = {
      ...chapter,
      suggestions: chapter.suggestions.map(s =>
        s.id === id ? { ...s, accepted: accept } : s
      )
    }
    setChapter(updated)
    // Persist decision
    await fetch('/api/chapters/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapterNum: chapter.chapterNum,
        action: 'decision',
        suggestionId: id,
        accepted: accept,
      }),
    })
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-zinc-500 animate-spin" />
      </div>
    </div>
  )

  if (error || !chapter?.exists) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-center px-8">
      <div>
        <div className="text-zinc-600 text-4xl mb-4">✗</div>
        <div className="text-white font-bold mb-2">Chapter {num} not found</div>
        <div className="text-zinc-600 text-sm mb-6">{error || 'File does not exist in CHAPTERS_FOLDER'}</div>
        <button onClick={() => router.push('/')}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm rounded-lg hover:text-white transition-colors">
          ← Back to library
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Header */}
      <header className="flex-none border-b border-zinc-900 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => router.push('/')}
            className="flex-none flex items-center gap-1.5 text-zinc-600 hover:text-zinc-300 text-xs font-medium transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Library
          </button>
          <div className="w-px h-4 bg-zinc-800 flex-none" />
          <div className="flex-none w-8 h-12 rounded overflow-hidden border border-zinc-800">
            <img src="/book1-cover.jpg" alt="cover" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-zinc-700 uppercase tracking-widest">Chapter {chapter.chapterNum}</div>
            <div className="text-sm font-black text-white truncate">{chapter.title}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-none">
          {/* Status */}
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            <span className={`text-[10px] font-medium ${status.text}`}>{status.label}</span>
          </div>

          {/* Score */}
          {chapter.score && (
            <div className={`text-sm font-black ${scoreColor(chapter.score)}`}>
              {chapter.score}<span className="text-xs text-zinc-700">/10</span>
            </div>
          )}

          {/* Stats */}
          <div className="text-[10px] text-zinc-700">
            {chapter.actCount} acts · {(chapter.wordCount / 1000).toFixed(1)}k words
          </div>

          {/* Actions */}
          {accepted.length > 0 && (
            <button onClick={() => setShowApply(true)}
              className="px-3 py-1.5 bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-800/50 text-emerald-300 text-xs font-bold rounded-lg transition-all">
              Apply {accepted.length} change{accepted.length !== 1 ? 's' : ''}
            </button>
          )}

          <button
            onClick={runReview}
            disabled={reviewing}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-white hover:text-black border border-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {reviewing ? '⟳ Reviewing…' : '⚡ Run Review'}
          </button>
        </div>
      </header>

      {/* Body — 3 column layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Act sidebar */}
        <aside className="flex-none w-44 border-r border-zinc-900 overflow-y-auto py-4 px-2 bg-[#080808]">
          <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest px-2 mb-3">Acts</div>
          {chapter.acts.map(act => (
            <button
              key={act.number}
              onClick={() => scrollToAct(act.number)}
              className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all ${
                activeAct === act.number
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <div className="text-[10px] font-black mb-0.5">Act {act.number}</div>
              <div className="text-[9px] text-zinc-700 truncate">{(act.wordCount / 1000).toFixed(1)}k words</div>
            </button>
          ))}

          {/* Pending suggestions count */}
          {pending.length > 0 && (
            <div className="mt-4 px-2">
              <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-2">Suggestions</div>
              <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg px-3 py-2">
                <div className="text-amber-400 font-black text-sm">{pending.length}</div>
                <div className="text-[9px] text-zinc-600">pending</div>
              </div>
            </div>
          )}
        </aside>

        {/* Chapter text */}
        <main className="flex-1 overflow-y-auto px-10 py-8 max-w-3xl">
          {chapter.acts.map(act => (
            <ActSection
              key={act.number}
              act={act}
              refCallback={(el: HTMLDivElement | null) => { actRefs.current[act.number] = el }}
            />
          ))}
        </main>

        {/* Review panel */}
        <aside className="flex-none w-80 border-l border-zinc-900 overflow-y-auto bg-[#080808]">

          {/* Live review log */}
          {(reviewing || reviewLog.length > 0) && (
            <div className="border-b border-zinc-900 p-4">
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">Review Log</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {reviewLog.map((line, i) => (
                  <div key={i} className="text-[10px] text-zinc-500 font-mono">{line}</div>
                ))}
                {reviewing && <div className="text-[10px] text-amber-400 font-mono animate-pulse">thinking…</div>}
              </div>
            </div>
          )}

          {/* Suggestions */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                Suggestions ({chapter.suggestions.length})
              </div>
              {pending.length > 0 && (
                <div className="flex gap-1">
                  <button
                    onClick={() => chapter.suggestions.forEach(s => s.accepted === null && acceptSuggestion(s.id, true))}
                    className="text-[9px] text-emerald-500 hover:text-emerald-300 font-bold transition-colors"
                  >Accept all</button>
                  <span className="text-zinc-700 text-[9px]">/</span>
                  <button
                    onClick={() => chapter.suggestions.forEach(s => s.accepted === null && acceptSuggestion(s.id, false))}
                    className="text-[9px] text-rose-500 hover:text-rose-300 font-bold transition-colors"
                  >Reject all</button>
                </div>
              )}
            </div>

            {chapter.suggestions.length === 0 && !reviewing && (
              <div className="text-center py-8">
                <div className="text-zinc-700 text-2xl mb-2">◎</div>
                <div className="text-xs text-zinc-600">No suggestions yet</div>
                <div className="text-[10px] text-zinc-700 mt-1">Run Review to get AI feedback</div>
              </div>
            )}

            <div className="space-y-3">
              {chapter.suggestions.map(s => (
                <div key={s.id}
                  className={`rounded-xl border p-3 transition-all ${
                    s.accepted === true  ? 'border-emerald-900/40 bg-emerald-950/10' :
                    s.accepted === false ? 'border-zinc-800 bg-zinc-900/20 opacity-40' :
                    'border-zinc-800 bg-zinc-900/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-wide">
                      Act {s.actNumber} · {s.type}
                    </span>
                    {s.accepted === null && (
                      <div className="flex gap-1">
                        <button onClick={() => acceptSuggestion(s.id, true)}
                          className="w-5 h-5 rounded bg-emerald-900/40 text-emerald-400 hover:bg-emerald-800/40 text-[10px] flex items-center justify-center transition-colors">✓</button>
                        <button onClick={() => acceptSuggestion(s.id, false)}
                          className="w-5 h-5 rounded bg-rose-900/40 text-rose-400 hover:bg-rose-800/40 text-[10px] flex items-center justify-center transition-colors">✕</button>
                      </div>
                    )}
                    {s.accepted === true  && <span className="text-[9px] text-emerald-500 font-bold">✓ Accepted</span>}
                    {s.accepted === false && <span className="text-[9px] text-zinc-600 font-bold">✕ Rejected</span>}
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed mb-1.5">{s.reason}</p>
                  {s.original && (
                    <div className="bg-rose-950/20 rounded px-2 py-1 mb-1">
                      <div className="text-[8px] text-rose-600 uppercase font-bold mb-0.5">Before</div>
                      <p className="text-[10px] text-zinc-500 line-clamp-2">{s.original}</p>
                    </div>
                  )}
                  {s.suggested && (
                    <div className="bg-emerald-950/20 rounded px-2 py-1">
                      <div className="text-[8px] text-emerald-600 uppercase font-bold mb-0.5">After</div>
                      <p className="text-[10px] text-zinc-400 line-clamp-2">{s.suggested}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Apply Changes Modal */}
      {showApply && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-8">
          <div className="bg-[#111] border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-base font-black text-white mb-1">Apply {accepted.length} Changes</h2>
            <p className="text-xs text-zinc-500 mb-6">
              This will write accepted suggestions to a new version of Ch{chapter.chapterNum}_v2.txt.
              The original file is untouched.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowApply(false)}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm rounded-lg hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={async () => {
                await fetch('/api/chapters/apply', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chapterNum: chapter.chapterNum, action: 'write' }),
                })
                setShowApply(false)
              }}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors">
                Write Version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
