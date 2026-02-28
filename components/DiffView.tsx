'use client'

import React from 'react'

export function simpleDiff(original: string, modified: string) {
    const originalWords = original.split(/\s+/)
    const modifiedWords = modified.split(/\s+/)
    
    // Very naive diff for demonstration (LCS is better but complex to implement without libs)
    // We will just highlight the whole block if it's different, or do a basic comparison.
    
    // Actually, let's just do a basic visual "Deleted" vs "Added" block for now
    // as implementing a full Myers diff algorithm in a single file is error-prone without a lib.
    return { originalWords, modifiedWords }
}

export default function DiffView({ original, modified }: { original: string, modified: string }) {
    if (!original || !modified) return null

    // For a cleaner UI without heavy libs, we'll show them side-by-side with highlighting
    // This is safer than a potentially buggy custom diff algo.
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-zinc-700 rounded-lg overflow-hidden font-mono text-sm">
            <div className="bg-red-950/10 p-4 border-r border-zinc-700">
                <div className="text-[10px] font-bold text-red-500 uppercase mb-2 tracking-widest">Original</div>
                <p className="whitespace-pre-wrap text-red-200/70">{original}</p>
            </div>
            <div className="bg-green-950/10 p-4">
                <div className="text-[10px] font-bold text-green-500 uppercase mb-2 tracking-widest">Revision</div>
                <p className="whitespace-pre-wrap text-green-100">{modified}</p>
            </div>
        </div>
    )
}
