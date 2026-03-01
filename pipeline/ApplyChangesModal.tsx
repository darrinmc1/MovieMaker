'use client'

// components/ApplyChangesModal.tsx
// Shown when user clicks "Apply Changes" after accepting suggestions.
// Step 1: dry-run — shows exactly what will change.
// Step 2: confirm — writes Ch1_v2.txt and reports results.

import { useState } from 'react'

interface Suggestion {
  suggestionId: string
  original: string
  replacement: string
  reason: string
  status?: string
}

interface ApplyResult {
  ok: boolean
  dryRun?: boolean
  applied: number
  skipped: number
  notFound: string[]
  originalText?: string
  newText?: string
  charDiff?: number
  newFile?: string
  version?: number
  savedTo?: string
  originalWordCount?: number
  newWordCount?: number
  message?: string
}

interface Props {
  chapterNum: number
  chapterTitle: string
  suggestions: Suggestion[]
  onClose: () => void
  onApplied: (newFilename: string) => void
}

function DiffLine({ original, replacement }: { original: string; replacement: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-zinc-800 text-xs font-mono">
      <div className="bg-rose-950/20 px-3 py-2 text-zinc-500 line-through leading-relaxed">{original}</div>
      <div className="bg-emerald-950/20 px-3 py-2 text-zinc-200 leading-relaxed">{replacement}</div>
    </div>
  )
}

export default function ApplyChangesModal({ chapterNum, chapterTitle, suggestions, onClose, onApplied }: Props) {
  const [step, setStep]         = useState<'confirm' | 'preview' | 'done' | 'error'>('confirm')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<ApplyResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const accepted = suggestions.filter(s => s.status === 'accepted')

  const runDryRun = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/chapters/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNum, suggestions, dryRun: true }),
      })
      const data: ApplyResult = await res.json()
      if (!res.ok) throw new Error(data.message || 'Preview failed')
      setResult(data)
      setStep('preview')
    } catch (err: any) {
      setErrorMsg(err.message)
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const applyForReal = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/chapters/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNum, suggestions, dryRun: false }),
      })
      const data: ApplyResult = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.message || 'Apply failed')
      setResult(data)
      setStep('done')
    } catch (err: any) {
      setErrorMsg(err.message)
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
          <div>
            <h2 className="text-sm font-black text-white">Apply Changes</h2>
            <p className="text-[10px] text-zinc-600 mt-0.5">Chapter {chapterNum} — {chapterTitle}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-zinc-900 text-zinc-500 hover:text-white flex items-center justify-center text-xs transition-colors">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* STEP 1 — Confirm */}
          {step === 'confirm' && (
            <div className="space-y-5">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-black text-emerald-400">{accepted.length}</div>
                    <div className="text-[9px] text-zinc-600 uppercase tracking-widest">Accepted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-zinc-600">{suggestions.length - accepted.length}</div>
                    <div className="text-[9px] text-zinc-600 uppercase tracking-widest">Skipped</div>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  This will apply <strong className="text-white">{accepted.length} accepted suggestion{accepted.length !== 1 ? 's' : ''}</strong> to the chapter text and save a new versioned file — <code className="text-zinc-400">Ch{chapterNum}_v2.txt</code> (or next available version). The original file is never modified.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Changes to apply</div>
                {accepted.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex gap-2.5 text-xs text-zinc-500 bg-zinc-900/50 rounded-lg px-3 py-2">
                    <span className="text-zinc-700 flex-none">{i + 1}.</span>
                    <span className="truncate italic">"{s.original.slice(0, 60)}{s.original.length > 60 ? '…' : ''}"</span>
                  </div>
                ))}
                {accepted.length > 5 && (
                  <div className="text-[10px] text-zinc-700 px-3">+ {accepted.length - 5} more</div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2 — Preview diff */}
          {step === 'preview' && result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-emerald-400">{result.applied}</div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-0.5">Will apply</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-zinc-500">{result.skipped}</div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-0.5">Skipped</div>
                </div>
                <div className={`border rounded-xl p-3 text-center ${(result.charDiff ?? 0) >= 0 ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-rose-950/20 border-rose-900/30'}`}>
                  <div className={`text-xl font-black ${(result.charDiff ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(result.charDiff ?? 0) > 0 ? '+' : ''}{result.charDiff} chars
                  </div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-0.5">Net change</div>
                </div>
              </div>

              {result.notFound.length > 0 && (
                <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4">
                  <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">⚠ {result.notFound.length} suggestion{result.notFound.length > 1 ? 's' : ''} not matched</div>
                  <p className="text-[11px] text-amber-200/60">These will be skipped — the original text may have already changed or the match was too loose.</p>
                </div>
              )}

              <div>
                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">Sample of changes</div>
                <div className="space-y-2">
                  {accepted.slice(0, 3).map((s, i) => (
                    <DiffLine key={i} original={s.original} replacement={s.replacement} />
                  ))}
                  {accepted.length > 3 && (
                    <div className="text-[10px] text-zinc-700 text-center py-1">+ {accepted.length - 3} more changes</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Done */}
          {step === 'done' && result && (
            <div className="space-y-5">
              <div className="flex flex-col items-center py-4 gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-950/30 border border-emerald-900/40 flex items-center justify-center text-2xl">✓</div>
                <h3 className="text-lg font-black text-white">Changes Applied</h3>
                <p className="text-xs text-zinc-500 text-center">
                  Saved as <code className="text-zinc-300">{result.newFile}</code>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-emerald-400">{result.applied}</div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-0.5">Applied</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-white">v{result.version}</div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-0.5">New version</div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600">Original word count</span>
                  <span className="text-zinc-400 font-mono">{result.originalWordCount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600">New word count</span>
                  <span className="text-zinc-400 font-mono">{result.newWordCount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600">Saved to</span>
                  <span className="text-zinc-500 font-mono text-[10px] truncate max-w-48">{result.savedTo}</span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-5">
              <div className="text-sm font-bold text-rose-300 mb-2">⚠ Failed</div>
              <p className="text-xs text-rose-200/70">{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-none px-6 py-4 border-t border-zinc-900 flex justify-between items-center">
          {step === 'done' || step === 'error' ? (
            <button onClick={() => { if (step === 'done' && result?.newFile) onApplied(result.newFile); else onClose() }}
              className="ml-auto px-6 py-2.5 bg-white text-black font-bold text-sm rounded-xl hover:bg-zinc-100 transition-all">
              {step === 'done' ? 'Done' : 'Close'}
            </button>
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2 text-zinc-600 hover:text-zinc-300 text-sm transition-colors">
                Cancel
              </button>
              <div className="flex gap-2">
                {step === 'confirm' && (
                  <button onClick={runDryRun} disabled={loading || accepted.length === 0}
                    className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-40">
                    {loading ? 'Previewing…' : 'Preview Changes →'}
                  </button>
                )}
                {step === 'preview' && (
                  <>
                    <button onClick={() => setStep('confirm')} className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold text-sm rounded-xl transition-all">
                      ← Back
                    </button>
                    <button onClick={applyForReal} disabled={loading || (result?.applied ?? 0) === 0}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-40">
                      {loading ? 'Writing file…' : `Apply ${result?.applied} Change${result?.applied !== 1 ? 's' : ''}`}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
