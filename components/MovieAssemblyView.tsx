"use client"

import { useState } from "react"
import { Character } from "@/types"

interface VideoClip {
    id: string
    sceneId: string
    imageUrl: string
    videoUrl?: string
    isGenerating?: boolean
    prompt: string
}

interface MovieAssemblyViewProps {
    actText: string
    storyboardImages: { sceneId: string, imageUrl: string, prompt: string }[]
}

export default function MovieAssemblyView({ actText, storyboardImages }: MovieAssemblyViewProps) {
    const [clips, setClips] = useState<VideoClip[]>(
        storyboardImages.map(img => ({
            id: crypto.randomUUID(),
            sceneId: img.sceneId,
            imageUrl: img.imageUrl,
            prompt: img.prompt
        }))
    )
    const [error, setError] = useState("")

    const generateVideo = async (clipId: string, imageUrl: string, prompt: string) => {
        setClips(prev => prev.map(c => c.id === clipId ? { ...c, isGenerating: true } : c))
        setError("")

        try {
            const res = await fetch("/api/generate-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl, prompt })
            })

            const data = await res.json()

            if (!res.ok || data.error) {
                setError(data.error || "Failed to generate video")
                setClips(prev => prev.map(c => c.id === clipId ? { ...c, isGenerating: false } : c))
            } else if (data.videoUrl) {
                setClips(prev => prev.map(c =>
                    c.id === clipId ? { ...c, videoUrl: data.videoUrl, isGenerating: false } : c
                ))
            }
        } catch (err: any) {
            setError(err.message || "Network error while generating video")
            setClips(prev => prev.map(c => c.id === clipId ? { ...c, isGenerating: false } : c))
        }
    }

    if (storyboardImages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-950 shadow-inner">
                <span className="text-6xl mb-4">🎬</span>
                <h2 className="text-2xl font-black text-white">Movie Assembly</h2>
                <p className="text-sm text-zinc-400 max-w-md text-center mt-2">
                    You haven't generated any storyboard images yet. Go back to the <strong className="text-zinc-200">Image Breakdown</strong> tab to extract scenes and generate your keyframes first.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center px-2 border-b border-zinc-800 pb-6">
                <div>
                    <h3 className="text-xl font-black text-white tracking-tight">
                        Movie Assembly
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">Animate your storyboard keyframes into video clips using Fal.ai (Stable Video Diffusion / Kling).</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-950/40 border border-red-900/50 p-4 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clips.map((clip, i) => (
                    <div key={clip.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
                        {/* Media Area */}
                        <div className="w-full aspect-video bg-black relative flex items-center justify-center border-b border-zinc-800">
                            {clip.videoUrl ? (
                                <video
                                    src={clip.videoUrl}
                                    controls
                                    autoPlay
                                    loop
                                    className="w-full h-full object-cover"
                                />
                            ) : clip.isGenerating ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/80 backdrop-blur-sm z-10">
                                    <div className="w-8 h-8 rounded-full border-4 border-zinc-700 border-t-white animate-spin" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-white animate-pulse">Rendering Video...</span>
                                    <span className="text-[10px] text-zinc-400">(This can take up to 30 seconds)</span>
                                </div>
                            ) : null}

                            {/* Base Image underneath for when video isn't loaded or generating */}
                            {!clip.videoUrl && (
                                <img src={clip.imageUrl} alt="Keyframe" className="w-full h-full object-cover opacity-50" />
                            )}
                        </div>

                        {/* Details Area */}
                        <div className="p-4 flex-1 flex flex-col gap-3">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Clip {i + 1}</span>

                            <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-2">Motion Prompt</label>
                            <textarea
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 resize-none h-16"
                                placeholder="Describe the motion (e.g., 'Slow cinematic pan to the right, soft lighting')"
                                defaultValue={clip.prompt}
                                onChange={(e) => {
                                    setClips(prev => prev.map(c => c.id === clip.id ? { ...c, prompt: e.target.value } : c))
                                }}
                            />

                            <button
                                onClick={() => generateVideo(clip.id, clip.imageUrl, clip.prompt)}
                                disabled={clip.isGenerating}
                                className="w-full mt-auto py-3 bg-white text-black text-xs font-black rounded-lg hover:bg-zinc-200 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {clip.isGenerating ? "Rendering..." : clip.videoUrl ? "🎬 Rerender Video" : "🎬 Animate Image"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
