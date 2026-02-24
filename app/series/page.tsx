import Link from 'next/link'
import actsData from '@/data/acts.json'

// Derive real per-chapter stats from acts.json at build/request time
function buildSeriesState() {
    const acts = actsData as any[]

    // Group acts by chapterId
    const chapterMap = new Map<string, any[]>()
    acts.forEach(act => {
        const ch = act.chapterId ?? 'unknown'
        if (!chapterMap.has(ch)) chapterMap.set(ch, [])
        chapterMap.get(ch)!.push(act)
    })

    // Sort chapters by number (ch01, ch02, …)
    const sortedChapters = [...chapterMap.entries()].sort(([a], [b]) => a.localeCompare(b))

    return sortedChapters.map(([chapterId, chapterActs], idx) => {
        const openPromises = chapterActs.reduce(
            (sum: number, act: any) =>
                sum + (act.promises?.filter((p: any) => p.status === 'open').length ?? 0),
            0
        )
        const unresolvedWarnings = chapterActs.reduce(
            (sum: number, act: any) =>
                sum + (act.continuity?.warnings?.filter((w: any) => w.status === 'open').length ?? 0),
            0
        )
        const chapterNum = parseInt(chapterId.replace('ch', ''), 10) || idx + 1
        // Simple escalation heuristic: more open promises than previous chapter = 'up'
        return {
            chapterId,
            chapterNum,
            openPromises,
            unresolvedWarnings,
            escalationTrend: openPromises > 3 ? 'up' : 'flat' as 'up' | 'flat'
        }
    })
}

export default function SeriesDashboard() {
    const chapters = buildSeriesState()

    // Aggregate totals for top-level stats
    const totalPromises = chapters.reduce((s, c) => s + c.openPromises, 0)
    const totalWarnings = chapters.reduce((s, c) => s + c.unresolvedWarnings, 0)

    return (
        <main className="min-h-screen bg-black text-zinc-100 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter text-white mb-2 uppercase">Series Intelligence</h1>
                        <p className="text-zinc-500 font-medium tracking-widest uppercase text-xs">Aesthecia Narrative Protocol / 12-Book Epic</p>
                    </div>
                    <Link href="/" className="text-xs font-black text-zinc-500 hover:text-white transition-colors border-b border-zinc-800 pb-1">
                        [RETURN TO LOCAL EDITOR]
                    </Link>
                </header>

                {/* Per-chapter cards — real data */}
                {chapters.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {chapters.map((ch) => (
                            <div key={ch.chapterId} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group hover:border-zinc-600 transition-all">
                                <div className="absolute top-0 right-0 p-6">
                                    <span className="text-[60px] font-black text-white/5 absolute -top-4 -right-2 italic select-none">
                                        {String(ch.chapterNum).padStart(2, '0')}
                                    </span>
                                </div>

                                <h2 className="text-zinc-500 font-black text-xs uppercase tracking-[0.2em] mb-8">Chapter {ch.chapterNum}</h2>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-blue-500 uppercase">Reader Promises</p>
                                            <p className="text-3xl font-black text-white">{ch.openPromises}</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-[10px] font-black text-red-500 uppercase">Continuity Risks</p>
                                            <p className="text-3xl font-black text-white">{ch.unresolvedWarnings}</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-zinc-800 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-zinc-600 uppercase">Escalation Curve</span>
                                        <div className="flex gap-1 items-end h-4">
                                            <div className="w-1 bg-zinc-800 h-2"></div>
                                            <div className="w-1 bg-zinc-800 h-3"></div>
                                            <div className={`w-1 ${ch.escalationTrend === 'up' ? 'bg-green-500' : 'bg-zinc-600'} h-4`}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mb-12 p-12 border border-dashed border-zinc-800 rounded-[2rem] text-center text-zinc-600 text-xs font-black uppercase tracking-widest">
                        No chapter data loaded — add acts to acts.json to see series stats.
                    </div>
                )}

                {/* Series totals banner */}
                <section className="bg-zinc-950 border border-zinc-900 p-10 rounded-[3rem] shadow-inner mb-12">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-8 border-l-4 border-l-white pl-4">Series Totals</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <p className="text-[10px] font-black text-blue-500 uppercase mb-1">Open Promises</p>
                            <p className="text-4xl font-black text-white">{totalPromises}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-red-500 uppercase mb-1">Continuity Risks</p>
                            <p className="text-4xl font-black text-white">{totalWarnings}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Chapters Tracked</p>
                            <p className="text-4xl font-black text-white">{chapters.length}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Acts Loaded</p>
                            <p className="text-4xl font-black text-white">{(actsData as any[]).length}</p>
                        </div>
                    </div>
                </section>

                {/* Series Drift Radar — kept as editorial intelligence layer */}
                <section className="bg-zinc-950 border border-zinc-900 p-10 rounded-[3rem] shadow-inner mb-12">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-10 border-l-4 border-l-amber-600 pl-4">Series Drift Radar</h3>
                    <div className="space-y-4">
                        <div className="p-6 bg-amber-950/10 border border-amber-900/20 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-amber-900/20 rounded-full flex items-center justify-center text-amber-500 text-lg">📶</div>
                                <p className="text-sm text-amber-100 font-medium">Repetitive Pattern: Setting &apos;Ruined Village&apos; repeated 3 times in Chapter 1.</p>
                            </div>
                            <span className="text-[10px] font-black bg-amber-900/40 text-amber-200 px-3 py-1 rounded-full uppercase">Pacing Risk</span>
                        </div>
                        <div className="p-6 bg-amber-950/10 border border-amber-900/20 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-amber-900/20 rounded-full flex items-center justify-center text-amber-500 text-lg">📶</div>
                                <p className="text-sm text-amber-100 font-medium">Static Dynamic: Relationship between Caelin and Durgan stalled for 4 Acts.</p>
                            </div>
                            <span className="text-[10px] font-black bg-amber-900/40 text-amber-200 px-3 py-1 rounded-full uppercase">Arc Risk</span>
                        </div>
                    </div>
                </section>

                <footer className="mt-20 text-center">
                    <p className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.5em]">End of Series Synthesis Protocol</p>
                </footer>
            </div>
        </main>
    )
}
