'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'

export default function Uploader() {
    const [uploading, setUploading] = useState(false)
    const [mode, setMode] = useState<'act' | 'character'>('act')
    const router = useRouter()

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return

        setUploading(true)

        for (const file of acceptedFiles) {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('type', mode)

            try {
                const res = await fetch('/api/ingest', {
                    method: 'POST',
                    body: formData
                })

                if (!res.ok) {
                    const errorData = await res.json()
                    alert(`Failed to upload ${file.name}: ${errorData.error}`)
                }
            } catch (err: any) {
                alert(`Error uploading ${file.name}: ${err.message}`)
            }
        }

        setUploading(false)
        router.refresh()
    }, [mode, router])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/plain': ['.txt'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        }
    })

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-white">Ingest Documents</h2>

            <div className="flex gap-4 mb-4">
                <button
                    onClick={() => setMode('act')}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg border transition-all ${mode === 'act' ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'}`}
                >
                    Story Acts / Chapters
                </button>
                <button
                    onClick={() => setMode('character')}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg border transition-all ${mode === 'character' ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'}`}
                >
                    Character Profiles
                </button>
            </div>

            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 hover:border-zinc-500 bg-black/50'}`}
            >
                <input {...getInputProps()} />
                {uploading ? (
                    <p className="text-zinc-300 font-bold animate-pulse">Processing document(s)...</p>
                ) : isDragActive ? (
                    <p className="text-blue-400 font-bold">Drop the files here...</p>
                ) : (
                    <div>
                        <p className="text-zinc-300 font-bold mb-2">Drag & drop .txt or .docx files here</p>
                        <p className="text-zinc-500 text-xs">Or click to select files for {mode === 'act' ? 'Acts' : 'Characters'}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
