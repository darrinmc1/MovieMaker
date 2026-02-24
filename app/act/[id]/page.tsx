'use client'

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import charactersData from "@/data/characters.json"
import actsData from "@/data/acts.json"
import ChapterSynthesisView from "@/components/ChapterSynthesisView"

export default function ActPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [reviews, setReviews] = useState<any[]>([])
    const [summary, setSummary] = useState("")
    const [currentAct, setCurrentAct] = useState<any>(null)
    const [approvedCuts, setApprovedCuts] = useState<string[]>([])
    const [showSynthesis, setShowSynthesis] = useState(false)
    const [isEditingSummary, setIsEditingSummary] = useState(false)
    const [step, setStep] = useState<'idle' | 'reviewed' | 'approved'>('idle')
    const [characters] = useState(charactersData)
    const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
    const [reviewTab, setReviewTab] = useState<'overview' | 'findings' | 'suggestions' | 'continuity'>('overview')
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const [activePersona, setActivePersona] = useState<'developmental_editor' | 'line_editor' | 'beta_reader'>('developmental_editor')

    // Auto-save draft to localStorage
    useEffect(() => {
        const timer = setInterval(() => {
            if (step === 'reviewed' && reviews.length > 0) {
                try {
                    const draft = {
                        reviews,
                        summary,
                        approvedCuts,
                        step,
                        timestamp: new Date().toISOString()
                    }
                    localStorage.setItem(`draft_${id}`, JSON.stringify(draft))
                    setLastSaved(new Date())
                    setIsSaving(false)
                } catch (e) {
                    console.error('Failed to save draft:', e)
                }
            }
        }, 10000) // Auto-save every 10 seconds
        return () => clearInterval(timer)
    }, [reviews, summary, approvedCuts, step, id])

    useEffect(() => {
        const act = (actsData as any[]).find((a: any) => a.id === id)
        if (act) {
            setCurrentAct(act)
            setSummary(act.summary?.text || "")
        }

        // Check for draft
        const savedDraft = localStorage.getItem(`draft_${id}`)
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft)
                // Show prompt to resume (will implement in UI)
                console.log('Draft found:', draft)
            } catch (e) {
                console.error('Failed to parse draft:', e)
            }
        }
    }, [id])

    const runReview = async (personaOverride?: any) => {
        const persona = personaOverride || activePersona
        const res = await fetch("/api/review", {
            method: "POST",
            body: JSON.stringify({
                actId: id,
                persona: persona
            })
        })
        const data = await res.json()
        setReviews(data)
        setStep('reviewed')
    }

    const handleApprove = async (suggestionId: string) => {
        const res = await fetch("/api/acts/approve", {
            method: "POST",
            body: JSON.stringify({
                actId: id,
                suggestionId
            })
        })
        const data = await res.json()
        if (data.ok) {
            setStep('approved')
        }
    }

    // Helper for suggestion status (local UI only before persistence)
    const handleSuggestionStatus = (reviewIndex: number, suggestionId: string, status: 'approved' | 'rejected' | 'skipped') => {
        const updatedReviews = [...reviews]
        const suggestion = updatedReviews[reviewIndex].suggestions.find((s: any) => s.suggestionId === suggestionId)
        if (suggestion) {
            suggestion.status = status
        }
        setReviews(updatedReviews)
    }

    const handleCommentChange = (reviewIndex: number, suggestionId: string, comment: string) => {
        const updatedReviews = [...reviews]
        const suggestion = updatedReviews[reviewIndex].suggestions.find((s: any) => s.suggestionId === suggestionId)
        if (suggestion) {
            suggestion.userComment = comment
        }
        setReviews(updatedReviews)
    }


    const handleApproveCut = (cutId: string) => {
        setApprovedCuts(prev =>
            prev.includes(cutId) ? prev.filter(id => id !== cutId) : [...prev, cutId]
        )
    }

    const approveAll = async () => {
        // Collect approved changes to form new text locally (optional since handled by handleApprove)
        setStep('approved')
    }

    const approve = async () => {
        // Collect approved changes to form new text
        const approvedReplacement = reviews[0]?.suggestions.find((s: any) => s.status === 'approved')?.replacement || "Updated act text..."

        const characterUpdates = selectedCharacter
            ? [{ id: selectedCharacter, newState: `Character state updated after act ${id}` }]
            : []

        const res = await fetch("/api/acts/approve", {
            method: "POST",
            body: JSON.stringify({
                actId: id,
                text: approvedReplacement,
                summary: summary,
                characterUpdates
            })
        })

        if (res.ok) {
            setStep('approved')
        } else {
            alert("Failed to approve version")
        }
    }

    // Stub synthesis data
    const synthesisData = {
        chapter: 1,
        actSummaries: [
            "Caelin arrives at burning Thornwick and discovers the crater.",
            "He encounters a mysterious survivor who mentions the scale."
        ],
        unresolvedPromises: ["The origin of the Thornwick crater"],
        continuityWarnings: ["Character Caelin appears without defined current state."],
        escalationStatus: 'rising' as const
    }

    const filteredReviews = selectedCharacter
        ? reviews.filter(r => (r.continuityErrors || r.continuityWarnings)?.some((c: any) => c.id?.includes(selectedCharacter)))
        : reviews

    return (
        <div className="p-8 max-w-5xl mx-auto bg-black text-zinc-100 min-h-screen font-sans">
            <header className="mb-8 flex justify-between items-center bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-white">ACT {currentAct?.heading || id}</h1>
                    <p className="text-zinc-500 text-sm font-medium">
                        {currentAct
                            ? `BOOK ${currentAct.bookId?.replace('book', '') || '1'} / CHAPTER ${currentAct.chapterId?.replace('ch', '').replace(/^0+/, '') || '1'}`
                            : 'BOOK 1 / CHAPTER 1'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedCharacter(null)}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${!selectedCharacter ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}
                    >
                        ALL
                    </button>
                    {characters.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setSelectedCharacter(c.id)}
                            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${selectedCharacter === c.id ? 'bg-zinc-100 text-black border-zinc-100' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}
                        >
                            {c.name.toUpperCase()}
                        </button>
                    ))}
                </div>
            </header>

            {step === 'idle' && (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800 rounded-[2.5rem] bg-zinc-950 shadow-inner">
                    <div className="w-full max-w-lg space-y-8">
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 bg-zinc-900 rounded-full mx-auto flex items-center justify-center text-zinc-500 text-xl border border-zinc-800">✍️</div>
                            <h2 className="text-xl font-black text-white tracking-tight italic">Declare your intent for this act.</h2>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed">The AI will judge the narrative logic against your specific goals, not generic rules.</p>
                        </div>

                        <div className="flex gap-2 justify-center">
                            {[
                                { id: 'developmental_editor', label: 'Dev Editor', icon: '🧠' },
                                { id: 'line_editor', label: 'Line Editor', icon: '✍️' },
                                { id: 'beta_reader', label: 'Beta Reader', icon: '👀' }
                            ].map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setActivePersona(p.id as any)}
                                    className={`px-4 py-3 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center gap-1 w-24 ${activePersona === p.id ? 'bg-zinc-100 text-black border-zinc-100' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}
                                >
                                    <span className="text-sm">{p.icon}</span>
                                    {p.label.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => runReview()}
                            className="w-full px-8 py-5 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-white/5"
                        >
                            RUN {activePersona.replace('_', ' ').toUpperCase()} PASS ➡
                        </button>
                    </div>
                </div>
            )}

            {step === 'reviewed' && (
                <div className="space-y-8">
                    {/* Auto-save Indicator */}
                    {lastSaved && (
                        <div className="text-right text-xs text-zinc-500 flex items-center justify-end gap-2">
                            <span className={`w-2 h-2 rounded-full ${isSaving ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></span>
                            {isSaving ? 'Saving...' : `Auto-saved ${lastSaved.toLocaleTimeString()}`}
                        </div>
                    )}

                    {/* Review Navigation Tabs */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-2 overflow-x-auto">
                        {[
                            { id: 'overview', label: 'Overview', icon: '📊' },
                            { id: 'findings', label: 'Findings', icon: '🔍' },
                            { id: 'suggestions', label: 'Suggestions', icon: '✏️' },
                            { id: 'continuity', label: 'Continuity', icon: '🔗' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setReviewTab(tab.id as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                                    reviewTab === tab.id
                                        ? 'bg-white text-black'
                                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {filteredReviews.map((r: any, i: number) => (
                        <div key={i} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* OVERVIEW TAB */}
                            {reviewTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Intent Alignment & Scene Utility (Phase 1 & 2) */}
                                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 bg-blue-950/10 border border-blue-900/20 p-6 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className={`w-2 h-2 rounded-full ${r.intentAlignment?.achieved ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                                        <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Intent Alignment</h3>
                                    </div>
                                    <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                                        {r.intentAlignment?.feedback || "Evaluation matched your declared intent."}
                                    </p>
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
                                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 z-10">Stakes / Intimacy</div>
                                    <div className="flex gap-4 z-10">
                                        <div className="text-center">
                                            <div className="text-xl font-black text-white">{r.metrics?.stakesLevel || 3}</div>
                                            <div className="text-[8px] text-zinc-500 font-black uppercase">Stakes</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-black text-white">{r.metrics?.intimacyLevel || 2}</div>
                                            <div className="text-[8px] text-zinc-500 font-black uppercase">Intimacy</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-black text-white">{r.metrics?.worldImpactLevel || 3}</div>
                                            <div className="text-[8px] text-zinc-500 font-black uppercase">Impact</div>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-white/5 opacity-10 pointer-events-none"></div>
                                </div>
                            </section>

                                {/* Arc Momentum (Phase 2) */}
                                {r.characterArcMovements?.length > 0 && (
                                    <section>
                                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Character Arc Movements</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {r.characterArcMovements.map((cam: any, k: number) => (
                                                <div key={k} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-black text-zinc-500 uppercase">{characters.find(c => c.id === cam.characterId)?.name || cam.characterId}</p>
                                                        <p className="text-xs font-bold text-white capitalize">{cam.arcMovement}</p>
                                                    </div>
                                                    <div className={`w-2 h-2 rounded-full ${cam.arcMovement === 'forward' ? 'bg-green-500' : cam.arcMovement === 'regressed' ? 'bg-red-500' : 'bg-zinc-700'}`}></div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                            )}

                            {/* FINDINGS TAB */}
                            {reviewTab === 'findings' && (
                            <div className="space-y-6">

                                {/* Editorial Findings (Step 8) */}
                                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Editorial Findings</h3>
                                        <ul className="space-y-3">
                                            {r.findings.map((f: string, k: number) => (
                                                <li key={k} className="text-sm text-zinc-300 leading-relaxed flex gap-3">
                                                    <span className="text-zinc-700 font-bold">•</span> {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl border-l-4 border-l-blue-500">
                                        <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-4">Reader Promises</h3>
                                        <p className="text-sm text-zinc-300 italic leading-relaxed">
                                            The imagery of the crater introduces a significant narrative debt. The reader will expect a long-term payoff regarding its origin.
                                        </p>
                                    </div>
                                </section>

                                {/* Editorial Confidence (Stage 3.3) */}
                                {r.confidenceIndicators?.length > 0 && (
                                    <section className="p-6 bg-zinc-950 border border-zinc-900 rounded-2xl">
                                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Editorial Confidence</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {r.confidenceIndicators.map((ci: string, k: number) => (
                                                <div key={k} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-medium text-zinc-300 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                                                    {ci}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Drift Radar & Themes */}
                                {(r.driftAlerts?.length > 0 || r.themeSignals?.length > 0) && (
                                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {r.driftAlerts?.length > 0 && (
                                            <div className="bg-amber-950/20 border border-amber-900/30 p-6 rounded-2xl border-l-4 border-l-amber-600">
                                                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">⚠️ Drift Radar Alerts</h3>
                                                <ul className="space-y-2">
                                                    {r.driftAlerts.map((da: string, k: number) => (
                                                        <li key={k} className="text-xs text-amber-200 font-medium italic">"{da}"</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {r.themeSignals?.length > 0 && (
                                            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                                                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">🎭 Thematic Signals</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {r.themeSignals.map((ts: string, k: number) => (
                                                        <span key={k} className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-md text-[10px] font-bold text-zinc-400">
                                                            #{ts.toUpperCase()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                )}
                            </div>
                            )}

                            {/* CONTINUITY TAB */}
                            {reviewTab === 'continuity' && (
                            <div className="space-y-6">
                                {/* Continuity Warnings (Step 1) */}
                                {r.continuityErrors?.length > 0 && (
                                    <section className="bg-red-950/20 border border-red-900/30 p-6 rounded-2xl">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xs font-black text-red-500 uppercase tracking-widest">🚨 Critical Continuity Issues</h3>
                                            <span className="text-[10px] font-bold bg-red-900/40 text-red-200 px-2 py-0.5 rounded uppercase">Non-Blocking</span>
                                        </div>
                                        <ul className="space-y-3">
                                            {r.continuityErrors.map((c: any, j: number) => (
                                                <li key={j} className="flex justify-between items-center p-4 bg-red-950/40 rounded-xl border border-red-900/20">
                                                    <span className="text-sm font-medium text-red-100">{c.message}</span>
                                                    <button className="text-[10px] font-black text-red-400 hover:text-red-100 uppercase tracking-tighter px-3 py-1 bg-red-900/20 rounded-md border border-red-900/30">Dismiss</button>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {/* Character Integrity (Phase 4) */}
                                {r.characterTraitClaims?.length > 0 && (
                                    <section className="space-y-4">
                                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                            Character Database Integrity
                                        </h3>
                                        {r.characterTraitClaims.map((ct: any, k: number) => (
                                            <div key={k} className="bg-zinc-950 border border-blue-900/10 p-5 rounded-2xl relative group overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4">
                                                    <div className="flex gap-2">
                                                        <button className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-blue-500 transition-colors">Confirm Trait</button>
                                                        <button className="px-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-zinc-800 transition-colors">Reject</button>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-black text-blue-500 uppercase mb-1 block">New Trait Detected for {characters.find(c => c.id === ct.characterId)?.name || ct.characterId}</span>
                                                <p className="text-sm font-bold text-white mb-2">{ct.trait}</p>
                                                <p className="text-[11px] text-zinc-500 italic leading-relaxed bg-black/40 p-3 rounded-lg border border-zinc-900/50">
                                                    Evidence: {ct.evidence}
                                                </p>
                                            </div>
                                        ))}
                                    </section>
                                )}

                                {/* Outline Sync/Divergence (Phase 4 & 9) */}
                                {r.outlineStatus && r.outlineStatus !== 'unknown' && (
                                    <section className={`p-6 border rounded-2xl transition-all ${r.outlineStatus === 'aligned'
                                        ? 'bg-green-950/10 border-green-900/20 shadow-[0_0_20px_rgba(34,197,94,0.05)]'
                                        : 'bg-amber-950/10 border-amber-900/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]'
                                        }`}>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${r.outlineStatus === 'aligned' ? 'bg-green-900/20 text-green-500' : 'bg-amber-900/20 text-amber-500'
                                                    }`}>
                                                    {r.outlineStatus === 'aligned' ? '✓' : '⚠️'}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-white uppercase tracking-tight">
                                                        Outline {r.outlineStatus === 'aligned' ? 'Synchronization' : 'Divergence Detected'}
                                                    </h3>
                                                    <p className="text-xs text-zinc-500 mt-0.5">
                                                        {r.outlineStatus === 'aligned'
                                                            ? 'Act content is perfectly aligned with the planned book outline.'
                                                            : 'Act content significantly contradicts or misses beats from the Advisory Outline.'}
                                                    </p>
                                                </div>
                                            </div>
                                            {r.outlineStatus === 'diverged' && (
                                                <button className="px-5 py-2.5 bg-zinc-100 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-xl shadow-white/5">
                                                    Update Outline to Match
                                                </button>
                                            )}
                                        </div>

                                        {r.proposedOutlinePatch && (
                                            <div className="mt-6 p-4 bg-black/40 rounded-xl border border-zinc-800/50 animate-in fade-in duration-700">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Proposed Outline Update</span>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="text-[11px] text-zinc-500 line-through decoration-zinc-800 opacity-60 italic">
                                                        {r.proposedOutlinePatch.outlineBefore}
                                                    </div>
                                                    <div className="text-xs text-zinc-200 font-medium">
                                                        {r.proposedOutlinePatch.outlineAfter}
                                                    </div>
                                                    <div className="pt-2 border-t border-zinc-900 mt-2 text-[10px] text-blue-400 font-bold italic">
                                                        Rationale: {r.proposedOutlinePatch.rationale}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                )}

                                {/* Beta Reader Reactions (Stage 3.3 preview) */}
                                {r.betaReactions?.length > 0 && (
                                    <section className="space-y-4">
                                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">👥 Beta Reader Reactions (Simulated)</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {r.betaReactions.map((br: any, k: number) => (
                                                <div key={k} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl relative">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                                                            {br.personaName[0]}
                                                        </div>
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">{br.personaName}</span>
                                                    </div>
                                                    <p className="text-xs text-zinc-400 leading-relaxed italic">"{br.reaction}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                            )}

                            {/* SUGGESTIONS TAB */}
                            {reviewTab === 'suggestions' && (
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">✏️ Proposed Revisions</h3>
                                    {(() => {
                                        const total = r.suggestions?.length || 0
                                        const approved = r.suggestions?.filter((s: any) => s.status === 'approved').length || 0
                                        const rejected = r.suggestions?.filter((s: any) => s.status === 'rejected').length || 0
                                        const percent = total > 0 ? Math.round((approved / total) * 100) : 0
                                        return (
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <div className="text-xs font-black text-white">{approved}/{total}</div>
                                                    <div className="text-[10px] text-zinc-500">approved</div>
                                                </div>
                                                <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                                                        style={{ width: `${percent}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )
                                    })()}
                                </div>
                                {r.suggestions.filter((s: any) => s.status !== 'skipped').map((s: any, k: number) => (
                                    <div key={k} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                                        <div className="grid grid-cols-1 md:grid-cols-2">
                                            <div className="p-6 bg-zinc-950/50 border-r border-zinc-800/50">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
                                                    <span className="text-[10px] font-black text-zinc-500 uppercase">Original</span>
                                                </div>
                                                <p className="text-sm text-zinc-500 font-serif leading-relaxed line-through decoration-zinc-800 opacity-60">{s.original}</p>
                                            </div>
                                            <div className="p-6 bg-green-950/5">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                    <span className="text-[10px] font-black text-green-600 uppercase">Suggestion</span>
                                                </div>
                                                <p className="text-sm text-green-50 font-serif leading-relaxed">{s.replacement}</p>
                                            </div>
                                        </div>

                                        {/* Reason & Actions */}
                                        <div className="p-6 bg-zinc-900/50 border-t border-zinc-800/50 space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-6 h-6 rounded-full bg-blue-900/30 flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-blue-400 mt-0.5">💡</div>
                                                <p className="text-xs text-zinc-300 leading-relaxed">"{s.reason}"</p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={() => {
                                                        handleSuggestionStatus(i, s.suggestionId, 'approved')
                                                        handleApprove(s.suggestionId)
                                                    }}
                                                    className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                                        s.status === 'approved' 
                                                            ? 'bg-green-600 text-white shadow-lg shadow-green-500/30' 
                                                            : 'bg-green-950/30 text-green-400 border border-green-900/50 hover:bg-green-950/50 hover:border-green-800'
                                                    }`}
                                                >
                                                    {s.status === 'approved' ? '✓ Approved' : '✓ Approve'}
                                                </button>
                                                <button
                                                    onClick={() => handleSuggestionStatus(i, s.suggestionId, 'rejected')}
                                                    className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                                        s.status === 'rejected' 
                                                            ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' 
                                                            : 'bg-red-950/30 text-red-400 border border-red-900/50 hover:bg-red-950/50 hover:border-red-800'
                                                    }`}
                                                >
                                                    ✗ Reject
                                                </button>
                                            </div>

                                            {/* Notes field (always visible) */}
                                            {s.status === 'approved' && (
                                                <div className="mt-3 pt-3 border-t border-zinc-800/50">
                                                    <textarea
                                                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-green-600/50 focus:ring-1 focus:ring-green-500/20 resize-none"
                                                        placeholder="(Optional) Add a note about this change..."
                                                        value={s.userComment || ""}
                                                        onChange={(e) => handleCommentChange(i, s.suggestionId, e.target.value)}
                                                        rows={2}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </section>
                            )}


                        </div>
                    ))}

                    {/* Act Summary (Step 3) */}
                    <section className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4">
                            <button
                                onClick={() => setIsEditingSummary(!isEditingSummary)}
                                className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-100 transition-colors"
                            >
                                [{isEditingSummary ? "Save" : "Edit Summary"}]
                            </button>
                        </div>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-1 h-4 bg-white rounded-full"></span>
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Act Summary</h3>
                        </div>
                        {isEditingSummary ? (
                            <textarea
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-base text-zinc-200 focus:outline-none focus:border-white/10 min-h-[120px] transition-all"
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                autoFocus
                            />
                        ) : (
                            <p className="text-xl text-zinc-400 leading-relaxed font-light italic pr-12">"{summary}"</p>
                        )}
                    </section>

                    <footer className="pt-12 border-t border-zinc-900 flex justify-between items-center">
                        <button
                            onClick={() => setShowSynthesis(!showSynthesis)}
                            className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                        >
                            {showSynthesis ? "[Hide Synthesis]" : "[View Chapter Synthesis]"}
                        </button>
                        <button
                            onClick={approve}
                            className="px-12 py-5 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 shadow-2xl shadow-white/5 transition-all hover:scale-[1.02] active:scale-[0.98] text-xl tracking-tighter"
                        >
                            FINALIZE VERSION
                        </button>
                    </footer>

                    {showSynthesis && (
                        <div className="mt-12 animate-in slide-in-from-bottom-8 duration-700">
                            <ChapterSynthesisView synthesis={synthesisData} />
                        </div>
                    )}
                </div>
            )}

            {step === 'approved' && (
                <div className="flex flex-col items-center justify-center p-24 bg-zinc-950 border border-zinc-900 rounded-[3rem] shadow-2xl animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-500/10 rounded-full mb-8 flex items-center justify-center text-5xl border border-green-500/20">✓</div>
                    <h2 className="text-4xl font-black mb-4 text-white tracking-tighter text-center">VERSION SECURED</h2>
                    <p className="text-zinc-500 mb-12 text-center max-w-sm font-medium">Historical record created. The continuity and character states have been synchronized.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-10 py-4 bg-zinc-100 text-black font-black rounded-2xl hover:bg-white transition-all shadow-xl shadow-white/5 uppercase tracking-widest text-xs"
                    >
                        Prepare Next Act ➡
                    </button>
                </div>
            )}
        </div>
    )
}