'use client'

import { ChapterSynthesis } from "@/types"

export default function ChapterSynthesisView({ synthesis }: { synthesis: ChapterSynthesis }) {
    return (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black tracking-tighter text-white">CHAPTER {synthesis.chapter} SYNTHESIS</h2>
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Read-only Intelligence Layer</p>
                </div>
                <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${synthesis.escalationStatus === 'rising' ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                    Escalation: {synthesis.escalationStatus}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-4">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Narrative Momentum</h3>
                    <div className="space-y-3">
                        {synthesis.actSummaries.map((summary, i) => (
                            <div key={i} className="flex gap-4 items-start p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                                <span className="text-zinc-700 font-bold text-xs mt-1">0{i + 1}</span>
                                <p className="text-xs text-zinc-400 italic leading-relaxed">“{summary}”</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-6">
                    <div>
                        <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-4">Unresolved Promises</h3>
                        <ul className="space-y-2">
                            {synthesis.unresolvedPromises.map((promise, i) => (
                                <li key={i} className="text-sm text-zinc-300 flex gap-3">
                                    <span className="text-blue-900">•</span> {promise}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xs font-black text-red-500 uppercase tracking-widest mb-4">Continuity Risks</h3>
                        <ul className="space-y-2">
                            {synthesis.continuityWarnings.map((warning, i) => (
                                <li key={i} className="text-xs text-zinc-500 flex gap-3">
                                    <span className="text-red-900">⚠️</span> {warning}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            </div>

            <footer className="pt-6 border-t border-zinc-900">
                <p className="text-[10px] text-zinc-600 font-medium italic">
                    Synthesis regenerated automatically based on latest act versions. Non-destructive cuts are excluded.
                </p>
            </footer>
        </div>
    )
}
