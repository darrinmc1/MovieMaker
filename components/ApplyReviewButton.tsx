'use client'

import { useState } from 'react'
import { FileEdit } from 'lucide-react'
import ApplyChangesModal from './ApplyChangesModal'

interface Suggestion {
    suggestionId: string
    original: string
    replacement: string
    reason: string
    status?: string
}

interface Props {
    chapterNum: number
    chapterTitle: string
    suggestions: Suggestion[]
}

export function ApplyReviewButton({ chapterNum, chapterTitle, suggestions }: Props) {
    const [showModal, setShowModal] = useState(false)
    const [applied, setApplied] = useState(false)

    if (suggestions.length === 0) return null

    // Ensure suggestions have 'status' field for the modal
    const suggestionsWithStatus = suggestions.map(s => ({
        ...s,
        status: s.status || 'accepted' // Default to accepted for this view
    }))

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                disabled={applied}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm ${applied
                        ? 'bg-emerald-900/40 text-emerald-400 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                    }`}
            >
                <FileEdit className="h-4 w-4" />
                {applied ? 'Review Applied' : 'Apply Editorial Suggestions'}
            </button>

            {showModal && (
                <ApplyChangesModal
                    chapterNum={chapterNum}
                    chapterTitle={chapterTitle}
                    suggestions={suggestionsWithStatus}
                    onClose={() => setShowModal(false)}
                    onApplied={(newFile) => {
                        setApplied(true)
                        setShowModal(false)
                        // Optionally reload page or show success state
                        window.location.reload()
                    }}
                />
            )}
        </>
    )
}
