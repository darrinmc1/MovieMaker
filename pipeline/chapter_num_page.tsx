'use client'

import { useState, useEffect, use, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ApplyChangesModal from '@/components/ApplyChangesModal'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActData { actNum: number; heading: string; text: string }

interface Suggestion {
  suggestionId: string
  original: string
  replacement: string
  reason: string
  status?: 'pending' | 'accepted' | 'rejected'
  userNote?: string
}

interface ActReview {
  actNum: number; heading: string; score: number; summary: string
  strengths: string[]; issues: string[]; suggestions: Suggestion[]
}

interface Review {
  chapterNum: number; persona: string; score: number; scoreRationale: string
  overview: string
  strengths: Array<{ title: string; detail: string }>
  weaknesses: Array<{ title: string; detail: string }>
  actBreakdown: ActReview[]
  characterMoments: Array<{ character: string; assessment: string; arcMovement: string }>
  continuityFlags: string[]
  proseNotes: string
  topRecommendations: string[]
  book2Setup: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CHAPTER_TITLES: Record<number, string> = {
  1: "The Dragon's Last Breath", 2: "Gathering Shadows",
  3: "Nature's Messenger",       4: "The Seven",
  5: "The Undervault",           6: "Stone That Breathes",
  7: "The Sanctum Falls",        8: "Aftermath",
  9: "The Road Between",        10: "The Red Sky",
  11: "Graveside Oath",         12: "Before the Boundary",
}

const PERSONAS = [
  { id: 'developmental_editor', label: 'Dev Editor',   icon: '🧠', desc: 'Structure & arc' },
  { id: 'line_editor',          label: 'Line Editor',  icon: '✍️', desc: 'Prose & style'  },
  { id: 'beta_reader',          label: 'Beta Reader',  icon: '👀', desc: 'Reader reaction' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 8) return 'text-emerald-400'
  if (s >= 6) return 'text-amber-400'
  return 'text-rose-400'
}

function scoreBg(s: number) {
  if (s >= 8) return 'bg-emerald-950/30 border-emerald-800/40'
  if (s >= 6) return 'bg-amber-950/30 border-amber-800/40'
  return 'bg-rose-950/30 border-rose-800/40'
}

function arcIcon(m: string) {
  if (m === 'forward')   return { icon: '↑', color: 'text-emerald-400' }
  if (m === 'regressed') return { icon: '↓', color: 'text-rose-400' }
  return { icon: '→', color: 'text-zinc-500' }
}

// ── SuggestionCard ────────────────────────────────────────────────────────────

function SuggestionCard({ s, actIdx, suggIdx, onUpdate, isFocused, onFocus }: {
  s: Suggestion; actIdx: number; suggIdx: number
  onUpdate: (actIdx: number, id: string, u: Partial<Suggestion>) => void
  isFocused: boolean; onFocus: () => void
}) {
  const accepted = s.status === 'accepted'
  const rejected = s.status === 'rejected'

  return (
    <div onClick={onFocus} className={`rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer ${
      isFocused ? 'ring-1 ring-zinc-600' : ''
    } ${
      accepted ? 'border-emerald-800/50 bg-emerald-950/10' :
      rejected  ? 'border-zinc-800/30 bg-zinc-900/20 opacity-40' :
                  'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
    }`}>
      <div className="grid grid-cols-2 divide-x divide-zinc-800">
        <div className="p-4">
          <div className="text-[9px] font-black text-rose-400/70 uppercase tracking-widest mb-2">Before</div>
          <p className="text-xs text-zinc-500 font-mono leading-relaxed">{s.original}</p>
        </div>
        <div className="p-4">
          <div className="text-[9px] font-black text-emerald-400/70 uppercase tracking-widest mb-2">After</div>
          <p className="text-xs text-zinc-200 font-mono leading-relaxed">{s.replacement}</p>
        </div>
      </div>
      <div className="px-4 pb-4 pt-3 border-t border-zinc-800/50 space-y-3">
        <p className="text-[11px] text-zinc-500 italic leading-relaxed">{s.reason}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); onUpdate(actIdx, s.suggestionId, { status: accepted ? 'pending' : 'accepted' }) }}
            className={`flex-none px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
              accepted ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'bg-zinc-800 text-zinc-400 hover:bg-emerald-950/60 hover:text-emerald-300'
            }`}>
            {accepted ? '✓ Accepted' : '✓ Accept'}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onUpdate(actIdx, s.suggestionId, { status: rejected ? 'pending' : 'rejected' }) }}
            className={`flex-none px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
              rejected ? 'bg-rose-700 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-rose-950/50 hover:text-rose-400'
            }`}>
            ✗
          </button>
          {accepted && (
            <input
              onClick={e => e.stopPropagation()}
              placeholder="Note (optional)…"
              value={s.userNote || ''}
              onChange={e => onUpdate(actIdx, s.suggestionId, { userNote: e.target.value })}
              className="flex-1 min-w-0 bg-zinc-800/70 border border-zinc-700/50 rounded-lg px-3 py-1.5 text-[11px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-700/50"
            />
          )}
          <span className="ml-auto text-[9px] text-zinc-700 font-mono">{suggIdx + 1}</span>
        </div>
      </div>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 py-20">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-zinc-400 animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-zinc-400 text-sm">{message}</p>
        <p className="text-zinc-700 text-xs mt-1">Takes 30–60 seconds</p>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ChapterReviewPage({ params }: { params: Promise<{ num: string }> }) {
  const { num } = use(params)
  const router = useRouter()
  const chapterNum = parseInt(num)

  const [chapterData, setChapterData] = useState<{ acts: ActData[]; wordCount: number; actCount: number } | null>(null)
  const [review, setReview]           = useState<Review | null>(null)
  const [loading, setLoading]         = useState(true)
  const [reviewing, setReviewing]     = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [pane, setPane]               = useState<'split' | 'read' | 'review'>('split')
  const [activeAct, setActiveAct]     = useState(0)
  const [reviewSection, setReviewSection] = useState<'overview' | 'acts' | 'characters' | 'continuity'>('overview')
  const [persona, setPersona]         = useState<'developmental_editor' | 'line_editor' | 'beta_reader'>('developmental_editor')
  const [selectedActReview, setSelectedActReview] = useState(0)
  const [focusedSugg, setFocusedSugg] = useState<string | null>(null)
  const [showApply, setShowApply]       = useState(false)
  const [showSaveToast, setShowSaveToast] = useState(false)
  const [lastSaved, setLastSaved]     = useState<string | null>(null)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load
  useEffect(() => {
    Promise.all([
      fetch(`/api/chapters/${chapterNum}`).then(r => r.json()),
      fetch(`/api/chapters/decisions?chapter=${chapterNum}`).then(r => r.json()).catch(() => null),
    ]).then(([ch, saved]) => {
      setChapterData(ch)
      if (saved?.decisions?.review) setReview(saved.decisions.review)
      setLoading(false)
    })
  }, [chapterNum])

  // Auto-save on review change
  useEffect(() => {
    if (!review) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => doSave(review), 2500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [review])

  // ⌘S
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); if (review) doSave(review) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [review])

  const doSave = useCallback(async (r: Review) => {
    await fetch('/api/chapters/decisions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterNum, decisions: { review: r } }),
    })
    setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    setShowSaveToast(true)
    setTimeout(() => setShowSaveToast(false), 2200)
  }, [chapterNum])

  const runReview = async () => {
    setReviewing(true); setReviewError(null)
    try {
      const res = await fetch('/api/chapters/review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNum, persona }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Review failed')
      setReview(data); setReviewSection('overview'); setPane('split')
    } catch (err: any) { setReviewError(err.message) }
    finally { setReviewing(false) }
  }

  const updateSuggestion = useCallback((actIdx: number, id: string, update: Partial<Suggestion>) => {
    setReview(prev => {
      if (!prev) return prev
      const next = JSON.parse(JSON.stringify(prev)) as Review
      const s = next.actBreakdown[actIdx]?.suggestions.find(s => s.suggestionId === id)
      if (s) Object.assign(s, update)
      return next
    })
  }, [])

  const totalAccepted = review?.actBreakdown.reduce((n, a) => n + a.suggestions.filter(s => s.status === 'accepted').length, 0) ?? 0
  const totalSugg     = review?.actBreakdown.reduce((n, a) => n + a.suggestions.length, 0) ?? 0

  if (loading) return (
    <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Spinner message={`Loading Chapter ${chapterNum}…`} />
    </div>
  )

  return (
    <div className="h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex-none h-13 flex items-center justify-between px-5 border-b border-zinc-900 bg-[#0a0a0a] z-30 gap-4" style={{ height: 52 }}>

        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button onClick={() => router.push('/')}
            className="flex-none flex items-center gap-1.5 text-zinc-600 hover:text-zinc-300 transition-colors text-xs font-medium shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Library
          </button>
          <div className="w-px h-3.5 bg-zinc-800 flex-none" />
          <div className="min-w-0 flex items-center gap-2">
            <span className="text-[10px] text-zinc-700 font-mono shrink-0">Ch.{chapterNum}</span>
            <h1 className="text-sm font-semibold text-zinc-300 truncate">{CHAPTER_TITLES[chapterNum]}</h1>
            {review && <span className={`text-sm font-black flex-none ${scoreColor(review.score)}`}>{review.score}/10</span>}
          </div>
        </div>

        {/* Pane toggle */}
        <div className="flex-none flex items-center gap-0.5 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
          {(['read','split','review'] as const).map(v => (
            <button key={v} onClick={() => setPane(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                pane === v ? 'bg-zinc-700 text-white' : 'text-zinc-600 hover:text-zinc-300'
              }`}>
              {v === 'split' ? '⊟ Split' : v === 'read' ? '📖 Read' : '🔍 Review'}
            </button>
          ))}
        </div>

        <div className="flex-1 flex items-center justify-end gap-3">
          <div className={`flex items-center gap-1.5 text-xs transition-all duration-300 ${showSaveToast ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-600">Saved {lastSaved}</span>
          </div>
          <div className="flex gap-1">
            {chapterNum > 1 && (
              <button onClick={() => router.push(`/chapter/${chapterNum - 1}`)}
                className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-600 hover:text-white text-xs rounded-lg transition-all">
                ← {chapterNum - 1}
              </button>
            )}
            {chapterNum < 12 && (
              <button onClick={() => router.push(`/chapter/${chapterNum + 1}`)}
                className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-600 hover:text-white text-xs rounded-lg transition-all">
                {chapterNum + 1} →
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">

        {/* Act sidebar */}
        <aside className="flex-none w-44 border-r border-zinc-900 flex flex-col overflow-hidden bg-[#0b0b0b]">
          <div className="px-3 pt-3 pb-2 border-b border-zinc-900/60">
            <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">
              {chapterData?.actCount} Acts · {((chapterData?.wordCount || 0) / 1000).toFixed(1)}k w
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {chapterData?.acts.map((act, idx) => {
              const actRev = review?.actBreakdown?.find(a => a.actNum === act.actNum)
              return (
                <button key={idx} onClick={() => setActiveAct(idx)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl transition-all group ${
                    activeAct === idx ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:bg-zinc-900 hover:text-zinc-300'
                  }`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wide">Act {act.actNum}</span>
                    {actRev && <span className={`text-[10px] font-black ${scoreColor(actRev.score)}`}>{actRev.score}</span>}
                  </div>
                  <div className="text-[9px] mt-0.5 truncate opacity-50 leading-tight">
                    {act.heading.replace(/^Act [IVX]+:\s*/i, '')}
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* READ pane */}
        {(pane === 'read' || pane === 'split') && (
          <div className={`flex flex-col overflow-hidden border-r border-zinc-900 ${pane === 'split' ? 'w-1/2' : 'flex-1'}`}>
            <div className="flex-none flex items-center justify-between px-5 py-2.5 border-b border-zinc-900/60 bg-[#0a0a0a]">
              <span className="text-xs text-zinc-600 truncate">{chapterData?.acts[activeAct]?.heading}</span>
              <div className="flex items-center gap-1 flex-none">
                <button onClick={() => setActiveAct(Math.max(0, activeAct - 1))} disabled={activeAct === 0}
                  className="p-1.5 rounded-lg text-zinc-700 hover:text-zinc-300 hover:bg-zinc-900 disabled:opacity-20 transition-all">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <span className="text-[10px] text-zinc-700 font-mono w-8 text-center">{activeAct + 1}/{chapterData?.acts.length}</span>
                <button onClick={() => setActiveAct(Math.min((chapterData?.acts.length ?? 1) - 1, activeAct + 1))} disabled={activeAct >= (chapterData?.acts.length ?? 1) - 1}
                  className="p-1.5 rounded-lg text-zinc-700 hover:text-zinc-300 hover:bg-zinc-900 disabled:opacity-20 transition-all">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-7 py-8">
              <div className="text-zinc-300 leading-[1.9] text-[15px] whitespace-pre-wrap max-w-prose mx-auto"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                {chapterData?.acts[activeAct]?.text}
              </div>
              <div className="mt-10 flex justify-between max-w-prose mx-auto">
                {activeAct > 0 ? (
                  <button onClick={() => setActiveAct(activeAct - 1)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-500 text-xs rounded-lg transition-colors">
                    ← Prev
                  </button>
                ) : <div />}
                {activeAct < (chapterData?.acts.length ?? 1) - 1 && (
                  <button onClick={() => setActiveAct(activeAct + 1)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-500 text-xs rounded-lg transition-colors">
                    Next →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* REVIEW pane */}
        {(pane === 'review' || pane === 'split') && (
          <div className={`flex flex-col overflow-hidden ${pane === 'split' ? 'w-1/2' : 'flex-1'}`}>

            {/* No review */}
            {!review && !reviewing && (
              <div className="flex-1 flex flex-col items-center justify-center px-8 gap-7">
                <div className="text-center">
                  <div className="text-5xl mb-3">🧠</div>
                  <h2 className="text-lg font-bold text-white mb-1">AI Editorial Review</h2>
                  <p className="text-xs text-zinc-600 max-w-xs leading-relaxed">
                    Gemini reads the full chapter and returns structured feedback — scores, prose suggestions, character arcs, continuity flags.
                  </p>
                </div>

                <div className="flex gap-2">
                  {PERSONAS.map(p => (
                    <button key={p.id} onClick={() => setPersona(p.id as any)}
                      className={`px-4 py-3 rounded-xl border text-center transition-all w-28 ${
                        persona === p.id ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-transparent text-zinc-600 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                      }`}>
                      <div className="text-xl mb-1">{p.icon}</div>
                      <div className="text-[10px] font-black uppercase tracking-wide">{p.label}</div>
                      <div className="text-[9px] text-zinc-600 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>

                {reviewError && (
                  <div className="bg-rose-950/30 border border-rose-900/40 text-rose-300 text-xs px-4 py-3 rounded-xl max-w-xs">⚠ {reviewError}</div>
                )}

                <button onClick={runReview}
                  className="px-8 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-zinc-100 active:scale-[0.98] transition-all shadow-xl shadow-white/5">
                  Run {PERSONAS.find(p => p.id === persona)?.label} Review →
                </button>
              </div>
            )}

            {reviewing && <Spinner message={`Gemini reviewing Chapter ${chapterNum}…`} />}

            {review && !reviewing && (
              <div className="flex-1 flex flex-col overflow-hidden">

                {/* Tabs header */}
                <div className="flex-none border-b border-zinc-900 px-4 pt-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-2xl font-black ${scoreColor(review.score)}`}>
                        {review.score}<span className="text-sm text-zinc-700">/10</span>
                      </span>
                      <span className="text-[11px] text-zinc-600 max-w-xs">{review.scoreRationale}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {totalSugg > 0 && (
                        <span className="text-[10px] text-zinc-700">
                          <span className="text-emerald-400 font-bold">{totalAccepted}</span>/{totalSugg}
                        </span>
                      )}
                      {totalAccepted > 0 && (
                        <button onClick={() => setShowApply(true)}
                          className="px-2.5 py-1 bg-emerald-900/50 hover:bg-emerald-800/60 border border-emerald-800/60 text-emerald-400 text-[10px] font-bold rounded-lg transition-all">
                          ✓ Apply {totalAccepted}
                        </button>
                      )}
                      <button onClick={runReview}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-600 hover:text-white text-[10px] font-bold rounded-lg transition-all">
                        ↺ Re-run
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-0.5">
                    {([
                      { id: 'overview',   label: 'Overview'   },
                      { id: 'acts',       label: 'Acts',       badge: totalSugg > 0 ? String(totalSugg) : null },
                      { id: 'characters', label: 'Characters' },
                      { id: 'continuity', label: 'Continuity', badge: review.continuityFlags?.length > 0 ? String(review.continuityFlags.length) : null },
                    ] as const).map(t => (
                      <button key={t.id} onClick={() => setReviewSection(t.id as any)}
                        className={`px-3.5 py-2 text-xs font-medium transition-all rounded-t-lg -mb-px flex items-center gap-1.5 ${
                          reviewSection === t.id
                            ? 'text-white border border-b-[#0a0a0a] border-zinc-800 bg-[#0a0a0a]'
                            : 'text-zinc-600 hover:text-zinc-300'
                        }`}>
                        {t.label}
                        {t.badge && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                            t.id === 'continuity' ? 'bg-amber-900/50 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                          }`}>{t.badge}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section scroll area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

                  {/* OVERVIEW */}
                  {reviewSection === 'overview' && (
                    <>
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
                        <p className="text-sm text-zinc-300 leading-relaxed">{review.overview}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-emerald-950/20 border border-emerald-900/25 rounded-xl p-4 space-y-2.5">
                          <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Strengths</div>
                          {review.strengths.map((s, i) => (
                            <div key={i}>
                              <div className="text-xs font-semibold text-emerald-300">{s.title}</div>
                              <div className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">{s.detail}</div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-rose-950/20 border border-rose-900/25 rounded-xl p-4 space-y-2.5">
                          <div className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Weaknesses</div>
                          {review.weaknesses.map((w, i) => (
                            <div key={i}>
                              <div className="text-xs font-semibold text-rose-300">{w.title}</div>
                              <div className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">{w.detail}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                        <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-2">Prose Notes</div>
                        <p className="text-xs text-zinc-500 leading-relaxed">{review.proseNotes}</p>
                      </div>
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                        <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-2.5">Top Recommendations</div>
                        <ol className="space-y-2">
                          {review.topRecommendations.map((r, i) => (
                            <li key={i} className="flex gap-2.5 text-xs text-zinc-400 leading-relaxed">
                              <span className="font-black text-zinc-700 w-4 flex-none">{i + 1}.</span>{r}
                            </li>
                          ))}
                        </ol>
                      </div>
                      {review.book2Setup && (
                        <div className="bg-violet-950/20 border border-violet-900/30 rounded-xl p-4">
                          <div className="text-[9px] font-black text-violet-500 uppercase tracking-widest mb-2">Book 2 Setup</div>
                          <p className="text-xs text-zinc-500 leading-relaxed">{review.book2Setup}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* ACTS */}
                  {reviewSection === 'acts' && (
                    <>
                      <div className="flex gap-1.5 flex-wrap">
                        {review.actBreakdown?.map((act, idx) => (
                          <button key={idx} onClick={() => { setSelectedActReview(idx); setActiveAct(idx) }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              selectedActReview === idx ? 'bg-zinc-800 text-white border-zinc-600' : 'border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-300'
                            }`}>
                            Act {act.actNum} <span className={`ml-1 ${scoreColor(act.score)}`}>{act.score}</span>
                          </button>
                        ))}
                      </div>

                      {review.actBreakdown?.[selectedActReview] && (() => {
                        const act = review.actBreakdown[selectedActReview]
                        return (
                          <div className="space-y-3">
                            <div className={`rounded-xl border p-4 ${scoreBg(act.score)}`}>
                              <div className="flex justify-between items-start gap-3">
                                <div>
                                  <div className="text-xs font-bold text-white">{act.heading}</div>
                                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{act.summary}</p>
                                </div>
                                <span className={`text-2xl font-black flex-none ${scoreColor(act.score)}`}>{act.score}</span>
                              </div>
                            </div>

                            {(act.strengths?.length > 0 || act.issues?.length > 0) && (
                              <div className="grid grid-cols-2 gap-2">
                                {act.strengths?.length > 0 && (
                                  <div className="bg-emerald-950/15 border border-emerald-900/20 rounded-xl p-3">
                                    <div className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1.5">Works</div>
                                    {act.strengths.map((s, i) => <p key={i} className="text-[11px] text-zinc-600 mb-1 leading-relaxed">• {s}</p>)}
                                  </div>
                                )}
                                {act.issues?.length > 0 && (
                                  <div className="bg-rose-950/15 border border-rose-900/20 rounded-xl p-3">
                                    <div className="text-[9px] font-black text-rose-700 uppercase tracking-widest mb-1.5">Issues</div>
                                    {act.issues.map((s, i) => <p key={i} className="text-[11px] text-zinc-600 mb-1 leading-relaxed">• {s}</p>)}
                                  </div>
                                )}
                              </div>
                            )}

                            {act.suggestions?.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">
                                    {act.suggestions.filter(s => s.status === 'accepted').length}/{act.suggestions.length} accepted
                                  </div>
                                  <div className="flex gap-1">
                                    <button onClick={() => act.suggestions.forEach(s => updateSuggestion(selectedActReview, s.suggestionId, { status: 'accepted' }))}
                                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-600 hover:text-emerald-400 hover:border-emerald-900/50 text-[9px] font-black uppercase rounded-lg transition-all">
                                      Accept all
                                    </button>
                                    <button onClick={() => act.suggestions.forEach(s => updateSuggestion(selectedActReview, s.suggestionId, { status: 'rejected' }))}
                                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-600 hover:text-rose-400 hover:border-rose-900/50 text-[9px] font-black uppercase rounded-lg transition-all">
                                      Reject all
                                    </button>
                                  </div>
                                </div>
                                {act.suggestions.map((s, sIdx) => (
                                  <SuggestionCard key={s.suggestionId} s={s} actIdx={selectedActReview} suggIdx={sIdx}
                                    onUpdate={updateSuggestion} isFocused={focusedSugg === s.suggestionId}
                                    onFocus={() => setFocusedSugg(s.suggestionId)} />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </>
                  )}

                  {/* CHARACTERS */}
                  {reviewSection === 'characters' && (
                    <div className="space-y-2">
                      {review.characterMoments?.map((c, i) => {
                        const arc = arcIcon(c.arcMovement)
                        return (
                          <div key={i} className="flex gap-3 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                            <div className={`flex-none text-lg font-black ${arc.color} w-5 text-center mt-0.5`}>{arc.icon}</div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-white mb-0.5">{c.character}</div>
                              <p className="text-[11px] text-zinc-500 leading-relaxed">{c.assessment}</p>
                            </div>
                            <div className={`flex-none text-[9px] font-black uppercase tracking-widest self-start mt-1 ${arc.color}`}>{c.arcMovement}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* CONTINUITY */}
                  {reviewSection === 'continuity' && (
                    <div className="space-y-2">
                      {!review.continuityFlags?.length ? (
                        <div className="flex items-center gap-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-5">
                          <span className="text-xl">✓</span>
                          <p className="text-sm text-emerald-400">No continuity issues flagged</p>
                        </div>
                      ) : review.continuityFlags.map((flag, i) => (
                        <div key={i} className="flex gap-3 bg-amber-950/20 border border-amber-900/30 rounded-xl p-4">
                          <span className="flex-none text-amber-500 mt-0.5 text-sm">⚠</span>
                          <p className="text-xs text-amber-200 leading-relaxed">{flag}</p>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Apply Changes Modal */}
      {showApply && review && (
        <ApplyChangesModal
          chapterNum={chapterNum}
          chapterTitle={CHAPTER_TITLES[chapterNum] || ''}
          suggestions={review.actBreakdown.flatMap(a => a.suggestions)}
          onClose={() => setShowApply(false)}
          onApplied={(newFile) => {
            setShowApply(false)
          }}
        />
      )}

      {/* Status bar */}
      <div className="flex-none flex items-center px-5 gap-4 border-t border-zinc-900/60 bg-[#080808]" style={{ height: 28 }}>
        <span className="text-[9px] text-zinc-800">⌘S save</span>
        {review && totalSugg > 0 && (
          <span className="text-[9px] text-zinc-800">{totalAccepted}/{totalSugg} suggestions accepted</span>
        )}
        <span className="ml-auto text-[9px] text-zinc-800">{CHAPTER_TITLES[chapterNum]}</span>
      </div>
    </div>
  )
}
