'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Character {
  name: string
  book: number
  rawText: string | null
  summary: string
  sections: Record<string, string>
  wordCount: number
  missing?: boolean
  // Book 2 fields
  role?: string
  age?: number | null
  race?: string
  appearance?: string
  personality?: string
  arcGoal?: string
  book2Role?: string
}

const CHARACTER_COLORS: Record<string, string> = {
  'Caelin Thorne':          'emerald',
  'Virella "Vex" Sunshadow':'violet',
  'Thornik Bramblebrew':    'amber',
  'Serana Valeblade':       'yellow',
  'Elowen Greenbloom':      'green',
  'Durgan Nightcloak':      'slate',
  'Nyxara Veilthorn':       'purple',
  'Jasper Coinblight':      'orange',
  'Puddle Thrym':           'teal',
}

const ARC_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-950/20 border-emerald-900/30 text-emerald-300',
  violet:  'bg-violet-950/20 border-violet-900/30 text-violet-300',
  amber:   'bg-amber-950/20 border-amber-900/30 text-amber-300',
  yellow:  'bg-yellow-950/20 border-yellow-900/30 text-yellow-300',
  green:   'bg-green-950/20 border-green-900/30 text-green-300',
  slate:   'bg-slate-950/20 border-slate-700/30 text-slate-300',
  purple:  'bg-purple-950/20 border-purple-900/30 text-purple-300',
  orange:  'bg-orange-950/20 border-orange-900/30 text-orange-300',
  teal:    'bg-teal-950/20 border-teal-900/30 text-teal-300',
}

const ACCENT: Record<string, string> = {
  emerald: 'text-emerald-400',
  violet:  'text-violet-400',
  amber:   'text-amber-400',
  yellow:  'text-yellow-400',
  green:   'text-green-400',
  slate:   'text-slate-400',
  purple:  'text-purple-400',
  orange:  'text-orange-400',
  teal:    'text-teal-400',
}

function SectionBlock({ title, content }: { title: string; content: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = content.length > 300
  const displayed = isLong && !expanded ? content.slice(0, 300) + '…' : content

  return (
    <div className="space-y-1.5">
      <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{title.replace(/_/g, ' ')}</div>
      <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{displayed}</p>
      {isLong && (
        <button onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors font-medium">
          {expanded ? '↑ Show less' : '↓ Show more'}
        </button>
      )}
    </div>
  )
}

export default function CharactersPage() {
  const router = useRouter()
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState<Character | null>(null)
  const [bookFilter, setBookFilter] = useState<1 | 2 | 'all'>('all')
  const [search, setSearch]         = useState('')

  useEffect(() => {
    fetch('/api/characters')
      .then(r => r.json())
      .then(data => { setCharacters(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = characters.filter(c => {
    if (bookFilter !== 'all' && c.book !== bookFilter) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

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

      <header className="border-b border-zinc-900 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-300 text-xs font-medium transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Library
          </button>
          <div className="w-px h-4 bg-zinc-800" />
          <h1 className="text-lg font-black text-white tracking-tight">Story Bible — Characters</h1>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search characters…"
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 w-44"
          />
          <div className="flex gap-1 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
            {(['all', 1, 2] as const).map(v => (
              <button key={v} onClick={() => setBookFilter(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  bookFilter === v ? 'bg-zinc-700 text-white' : 'text-zinc-600 hover:text-zinc-300'
                }`}>
                {v === 'all' ? 'All' : `Book ${v}`}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-69px)]">

        {/* Character grid */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-w-6xl">
            {filtered.map(c => {
              const color = CHARACTER_COLORS[c.name] || 'zinc'
              const cardStyle = ARC_COLORS[color] || 'bg-zinc-900 border-zinc-800 text-zinc-300'
              const accentStyle = ACCENT[color] || 'text-zinc-300'

              return (
                <button key={c.name} onClick={() => setSelected(c)}
                  className={`text-left p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${cardStyle} ${
                    selected?.name === c.name ? 'ring-1 ring-white/20' : ''
                  } ${c.missing ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className={`text-sm font-black leading-tight ${accentStyle}`}>{c.name}</div>
                    <div className="flex-none">
                      <span className="text-[9px] font-black text-zinc-600 bg-zinc-900/50 px-1.5 py-0.5 rounded-full uppercase">
                        Bk{c.book}
                      </span>
                    </div>
                  </div>
                  {c.role && <div className="text-[10px] text-zinc-600 mb-2">{c.role}</div>}
                  <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-3">{c.summary}</p>
                  {c.missing && <p className="text-[10px] text-rose-500 mt-1">Profile file missing</p>}
                  {c.wordCount > 0 && (
                    <div className="mt-3 text-[9px] text-zinc-700">{c.wordCount.toLocaleString()} word profile</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Profile panel */}
        {selected && (
          <div className="w-96 border-l border-zinc-900 flex flex-col overflow-hidden bg-[#0b0b0b]">
            <div className="flex-none flex items-center justify-between px-5 py-4 border-b border-zinc-900">
              <div>
                <div className={`text-base font-black ${ACCENT[CHARACTER_COLORS[selected.name]] || 'text-white'}`}>
                  {selected.name}
                </div>
                {selected.role && <div className="text-[10px] text-zinc-600 mt-0.5">{selected.role}</div>}
              </div>
              <button onClick={() => setSelected(null)}
                className="w-7 h-7 rounded-lg bg-zinc-900 text-zinc-500 hover:text-white flex items-center justify-center text-xs transition-colors">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

              {/* Book 2 character layout */}
              {selected.book === 2 && (
                <>
                  {selected.appearance && <SectionBlock title="Appearance" content={selected.appearance} />}
                  {selected.personality && <SectionBlock title="Personality" content={selected.personality} />}
                  {selected.arcGoal && <SectionBlock title="Arc Goal" content={selected.arcGoal} />}
                  {selected.book2Role && <SectionBlock title="Role in Depthspire" content={selected.book2Role} />}
                </>
              )}

              {/* Book 1 character — parsed sections */}
              {selected.book === 1 && Object.keys(selected.sections).length > 0 && (
                Object.entries(selected.sections).map(([key, val]) => (
                  val ? <SectionBlock key={key} title={key} content={val} /> : null
                ))
              )}

              {/* Fallback — raw text */}
              {selected.book === 1 && Object.keys(selected.sections).length === 0 && selected.rawText && (
                <div>
                  <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">Full Profile</div>
                  <pre className="text-[11px] text-zinc-500 leading-relaxed whitespace-pre-wrap font-sans">
                    {selected.rawText.slice(0, 3000)}
                    {selected.rawText.length > 3000 && '\n\n… (truncated — full profile in file)'}
                  </pre>
                </div>
              )}

              {selected.missing && (
                <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-4">
                  <p className="text-xs text-rose-300">Profile file not found.</p>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    Add <code className="text-zinc-500">{selected.name}</code> profile .txt to PROFILES_FOLDER in .env.local
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
