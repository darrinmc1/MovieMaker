'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface SearchMatch {
  chapterNum: number
  chapterTitle: string
  lineNumber: number
  line: string
  context: string
  matchStart: number
  matchEnd: number
}

interface SearchResult {
  matches: SearchMatch[]
  byChapter: Record<number, SearchMatch[]>
  total: number
  query: string
  truncated: boolean
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <span>{text}</span>
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return (
    <span>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-amber-500/30 text-amber-200 rounded px-0.5">{p}</mark>
          : <span key={i}>{p}</span>
      )}
    </span>
  )
}

const QUICK_SEARCHES = [
  'Caelin', 'Durgan', 'Elowen', 'Vex', 'dragon scale',
  'Depthspire', 'the Seal', 'relic', 'Sanctuary'
]

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery]         = useState('')
  const [result, setResult]       = useState<SearchResult | null>(null)
  const [loading, setLoading]     = useState(false)
  const [expanded, setExpanded]   = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const runSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setResult(null); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=100`)
      const data = await res.json()
      setResult(data)
      // Auto-expand if only one chapter has matches
      const chapters = Object.keys(data.byChapter).map(Number)
      if (chapters.length === 1) setExpanded(chapters[0])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => runSearch(query), 300)
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [query, runSearch])

  const chapterNums = result ? Object.keys(result.byChapter).map(Number).sort((a, b) => a - b) : []

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Header */}
      <header className="border-b border-zinc-900 px-8 py-5 flex items-center gap-4">
        <button onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-300 text-xs font-medium transition-colors flex-none">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Library
        </button>
        <div className="w-px h-4 bg-zinc-800 flex-none" />

        {/* Search bar */}
        <div className="flex-1 relative max-w-2xl">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && router.push('/')}
            placeholder="Search across all chapters…"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-700 border-t-zinc-400 animate-spin" />
            </div>
          )}
          {query && !loading && (
            <button onClick={() => { setQuery(''); setResult(null); inputRef.current?.focus() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors text-xs">✕</button>
          )}
        </div>

        {result && (
          <span className="text-xs text-zinc-600 flex-none">
            {result.total}{result.truncated ? '+' : ''} match{result.total !== 1 ? 'es' : ''} in {chapterNums.length} chapter{chapterNums.length !== 1 ? 's' : ''}
          </span>
        )}
      </header>

      <div className="max-w-4xl mx-auto px-8 py-8">

        {/* Empty state */}
        {!query && (
          <div className="space-y-8">
            <div className="text-center py-12">
              <div className="text-5xl mb-4 opacity-20">🔍</div>
              <p className="text-zinc-600 text-sm">Search for any word, phrase, or character name across all 12 chapters</p>
              <p className="text-zinc-800 text-xs mt-1">Searches full chapter text including all acts</p>
            </div>
            <div>
              <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-3">Quick searches</div>
              <div className="flex flex-wrap gap-2">
                {QUICK_SEARCHES.map(q => (
                  <button key={q} onClick={() => setQuery(q)}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-200 text-xs rounded-lg transition-all">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No results */}
        {result && result.total === 0 && query && (
          <div className="text-center py-16">
            <p className="text-zinc-600 text-sm">No matches for <span className="text-zinc-300">"{query}"</span></p>
            <p className="text-zinc-800 text-xs mt-1">Try a shorter phrase or check spelling</p>
          </div>
        )}

        {/* Results grouped by chapter */}
        {result && result.total > 0 && (
          <div className="space-y-2">
            {chapterNums.map(num => {
              const matches = result.byChapter[num]
              const isOpen = expanded === num
              return (
                <div key={num} className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/20">
                  {/* Chapter header */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : num)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-900/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-zinc-700 font-mono w-6">
                        {String(num).padStart(2, '0')}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-zinc-300">{matches[0].chapterTitle}</div>
                        <div className="text-[10px] text-zinc-600 mt-0.5">
                          {matches.length} match{matches.length !== 1 ? 'es' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={e => { e.stopPropagation(); router.push(`/chapter/${num}`) }}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-[10px] font-bold rounded-lg transition-all"
                      >
                        Open chapter →
                      </button>
                      <svg
                        className={`text-zinc-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </div>
                  </button>

                  {/* Matches list */}
                  {isOpen && (
                    <div className="border-t border-zinc-800/60 divide-y divide-zinc-800/30">
                      {matches.map((m, i) => (
                        <div key={i}
                          onClick={() => router.push(`/chapter/${num}`)}
                          className="px-5 py-3 hover:bg-zinc-900/60 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-[9px] text-zinc-700 font-mono flex-none mt-0.5 w-10 text-right">
                              L{m.lineNumber}
                            </span>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                              <HighlightedText text={m.context} query={query} />
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {result.truncated && (
              <div className="text-center py-4">
                <p className="text-xs text-zinc-600">Showing first 100 matches. Refine your search to see more.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
