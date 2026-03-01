'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RunAllModal from '@/components/RunAllModal'

interface ChapterMeta {
  chapterNum: number
  title: string
  filename: string
  exists: boolean
  actCount: number
  wordCount: number
  reviewStatus: 'not_reviewed' | 'in_progress' | 'reviewed' | 'finalized'
  lastReviewed: string | null
  score: string | null
}

function scoreColor(s: string | null) {
  if (!s) return 'text-zinc-700'
  const n = parseFloat(s)
  if (n >= 8) return 'text-emerald-400'
  if (n >= 6) return 'text-amber-400'
  return 'text-rose-400'
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  not_reviewed: { label: 'Not reviewed', dot: 'bg-zinc-700',   text: 'text-zinc-600'  },
  in_progress:  { label: 'In progress',  dot: 'bg-amber-500',  text: 'text-amber-400' },
  reviewed:     { label: 'Reviewed',     dot: 'bg-blue-500',   text: 'text-blue-400'  },
  finalized:    { label: 'Finalized',    dot: 'bg-emerald-500',text: 'text-emerald-400'},
}

export default function Home() {
  const router = useRouter()
  const [chapters, setChapters]   = useState<ChapterMeta[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [hovered, setHovered]     = useState<number | null>(null)
  const [showRunAll, setShowRunAll] = useState(false)
  const [reloadKey, setReloadKey]   = useState(0)

  useEffect(() => {
    fetch('/api/chapters')
      .then(r => r.json())
      .then(d => { setChapters(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [reloadKey])

  const totalWords    = chapters.reduce((n, c) => n + (c.wordCount || 0), 0)
  const reviewed      = chapters.filter(c => c.reviewStatus !== 'not_reviewed').length
  const finalized     = chapters.filter(c => c.reviewStatus === 'finalized').length
  const scores        = chapters.filter(c => c.score).map(c => parseFloat(c.score!))
  const avgScore      = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : null

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-zinc-500 animate-spin" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Top nav */}
      <nav className="flex items-center justify-between px-8 py-3 border-b border-zinc-900">
        <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">VBook Editor</span>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/search')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-500 hover:text-zinc-200 text-xs rounded-lg transition-all">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Search
          </button>
          <button onClick={() => router.push('/characters')}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-500 hover:text-zinc-200 text-xs rounded-lg transition-all">
            👥 Characters
          </button>
          <button onClick={() => router.push('/pipeline')}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-500 hover:text-zinc-200 text-xs rounded-lg transition-all">
            ⚡ Pipeline
          </button>
          <button onClick={() => setShowRunAll(true)}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-white hover:text-black border border-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-all">
            ▶ Review All
          </button>
        </div>
      </nav>

      {/* Top stripe */}
      <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

      {/* Header */}
      <header className="max-w-4xl mx-auto px-8 pt-14 pb-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-2">The Concord of Nine · Book 1</p>
            <h1 className="text-4xl font-black text-white tracking-tight leading-none">
              The Dragon's<br />Last Breath
            </h1>
          </div>
          <div className="text-right pb-1">
            <div className="text-[10px] text-zinc-700 uppercase tracking-widest mb-1">Editorial Progress</div>
            <div className="text-3xl font-black text-white">{reviewed}<span className="text-zinc-700">/{chapters.length}</span></div>
            <div className="text-[10px] text-zinc-700 mt-0.5">{finalized} finalized</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-8 space-y-1.5">
          <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div className="h-full bg-zinc-500 rounded-full transition-all duration-700"
              style={{ width: `${(reviewed / Math.max(chapters.length, 1)) * 100}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-700">
            <span>{Math.round((reviewed / Math.max(chapters.length, 1)) * 100)}% reviewed</span>
            <span>{(totalWords / 1000).toFixed(0)}k words total{avgScore ? ` · avg ${avgScore.toFixed(1)}/10` : ''}</span>
          </div>
        </div>
      </header>

      <div className="h-px bg-zinc-900 mx-8" />

      {/* Chapter list */}
      <main className="max-w-4xl mx-auto px-8 py-8">

        {error && (
          <div className="mb-6 bg-rose-950/30 border border-rose-900/40 text-rose-300 text-xs px-5 py-4 rounded-xl">
            ⚠ {error} — Check CHAPTERS_FOLDER in .env.local
          </div>
        )}

        <div className="space-y-1">
          {chapters.map((ch, idx) => {
            const status = STATUS_CONFIG[ch.reviewStatus] || STATUS_CONFIG.not_reviewed
            const isHovered = hovered === ch.chapterNum
            const n = parseFloat(ch.score || '0')

            return (
              <div
                key={ch.chapterNum}
                onMouseEnter={() => setHovered(ch.chapterNum)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => ch.exists && router.push(`/chapter/${ch.chapterNum}`)}
                className={`group flex items-center gap-6 px-4 py-4 rounded-xl transition-all duration-150 cursor-pointer ${
                  !ch.exists ? 'opacity-30 cursor-not-allowed' :
                  isHovered ? 'bg-zinc-900' : ''
                }`}
              >
                {/* Number */}
                <div className="flex-none w-8 text-right">
                  <span className={`text-xs font-black transition-colors ${isHovered ? 'text-zinc-400' : 'text-zinc-800'}`}>
                    {String(ch.chapterNum).padStart(2, '0')}
                  </span>
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold transition-colors leading-snug ${isHovered ? 'text-white' : 'text-zinc-400'}`}>
                    {ch.title}
                  </div>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <span className="text-[10px] text-zinc-700">{ch.actCount} acts</span>
                    <span className="text-zinc-800 text-[10px]">·</span>
                    <span className="text-[10px] text-zinc-700">{(ch.wordCount / 1000).toFixed(1)}k words</span>
                  </div>
                </div>

                {/* Score */}
                <div className="flex-none w-16 text-right">
                  {ch.score ? (
                    <span className={`text-base font-black ${scoreColor(ch.score)}`}>
                      {ch.score}
                      <span className="text-xs text-zinc-700">/10</span>
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-800">—</span>
                  )}
                </div>

                {/* Score bar */}
                <div className="flex-none w-20 h-1 bg-zinc-900 rounded-full overflow-hidden">
                  {ch.score && (
                    <div className={`h-full rounded-full transition-all ${n >= 8 ? 'bg-emerald-600' : n >= 6 ? 'bg-amber-600' : 'bg-rose-700'}`}
                      style={{ width: `${(n / 10) * 100}%` }} />
                  )}
                </div>

                {/* Status */}
                <div className="flex-none flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full flex-none ${status.dot}`} />
                  <span className={`text-[10px] font-medium w-20 ${status.text}`}>{status.label}</span>
                </div>

                {/* Arrow */}
                <div className={`flex-none transition-all duration-150 ${isHovered && ch.exists ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-500">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary footer */}
        <div className="mt-12 pt-6 border-t border-zinc-900 grid grid-cols-3 gap-6">
          {[
            { label: 'Total Word Count',    value: `${(totalWords / 1000).toFixed(1)}k` },
            { label: 'Average Score',       value: avgScore ? `${avgScore.toFixed(1)}/10` : '—', color: avgScore ? scoreColor(String(avgScore)) : 'text-zinc-700' },
            { label: 'Chapters Finalized',  value: `${finalized} / ${chapters.length}` },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className={`text-2xl font-black ${(stat as any).color || 'text-white'}`}>{stat.value}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
      {/* Run All Modal */}
      {showRunAll && (
        <RunAllModal
          onClose={() => setShowRunAll(false)}
          onComplete={() => setReloadKey(k => k + 1)}
        />
      )}