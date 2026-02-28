"use client"

import { useState } from "react"
import Image from "next/image"

import { Character } from "@/types"

interface Scene {
    id: string
    setting: string
    action: string
    imagePrompt: string
    narration: string
    imageUrl?: string
    isGenerating?: boolean
}

interface StoryboardViewProps {
    actText: string
    characters: Character[]
    onCharacterUpdate: (id: string, updates: Partial<Character>) => void
    onScenesUpdate?: (scenes: Scene[]) => void
}

export default function StoryboardView({ actText, characters, onCharacterUpdate, onScenesUpdate }: StoryboardViewProps) {
    const [scenes, setScenes] = useState<Scene[]>([])
    const [isExtracting, setIsExtracting] = useState(false)
    const [error, setError] = useState("")
    const [uploadingCharId, setUploadingCharId] = useState<string | null>(null)

    const extractScenes = async () => {
        if (!actText.trim()) {
            setError("Act text is empty. Write something first before storyboarding.")
            return
        }

        setIsExtracting(true)
        setError("")

        try {
            const res = await fetch("/api/storyboard", {
                method: "POST",
                body: JSON.stringify({ text: actText }),
            })

            const data = await res.json()

            if (!res.ok || data.error) {
                setError(data.error || "Failed to extract scenes.")
            } else if (data.scenes && Array.isArray(data.scenes)) {
                setScenes(data.scenes)
                onScenesUpdate?.(data.scenes)
            } else {
                setError("Invalid response format from server.")
            }
        } catch (err: any) {
            setError(err.message || "Network error while extracting scenes")
        } finally {
            setIsExtracting(false)
        }
    }

    const generateImage = async (sceneId: string, prompt: string) => {
        // Mark scene as generating
        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isGenerating: true } : s))

        try {
            const res = await fetch("/api/generate-image", {
                method: "POST",
                body: JSON.stringify({ prompt }),
            })
            const data = await res.json()

            if (!res.ok || data.error) {
                alert(data.error || "Failed to generate image")
                setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isGenerating: false } : s))
            } else {
                const newScenes = scenes.map(s => s.id === sceneId ? { ...s, isGenerating: false, imageUrl: data.imageUrl } : s)
                setScenes(newScenes)
                onScenesUpdate?.(newScenes)
            }
        } catch (err: any) {
            alert(err.message || "Network error while generating image")
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isGenerating: false } : s))
        }
    }

    const updatePrompt = (sceneId: string, newPrompt: string) => {
        const newScenes = scenes.map(s => s.id === sceneId ? { ...s, imagePrompt: newPrompt } : s);
        setScenes(newScenes)
        onScenesUpdate?.(newScenes)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, characterId: string) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingCharId(characterId)
        setError("")

        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("characterId", characterId)

            const res = await fetch("/api/upload-character-image", {
                method: "POST",
                body: formData
            })

            const data = await res.json()

            if (!res.ok || data.error) {
                setError(data.error || "Failed to upload image")
            } else if (data.imageUrl) {
                // Update parent state
                onCharacterUpdate(characterId, { image_url: data.imageUrl })
            }
        } catch (err: any) {
            setError(err.message || "Network error while uploading image")
        } finally {
            setUploadingCharId(null)
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center px-2 border-b border-zinc-800 pb-6">
                <div>
                    <h3 className="text-xl font-black text-white tracking-tight">
                        Visual Storyboard & Character Assets
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">Upload character references and break down your text into keyframes.</p>
                </div>
                <button
                    onClick={extractScenes}
                    disabled={isExtracting}
                    className="px-6 py-3 bg-white text-black text-xs font-black rounded-lg hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isExtracting ? (
                        <>
                            <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                            Extracting...
                        </>
                    ) : (
                        "🎬 Extract Scenes from Text"
                    )}
                </button>
            </div>

            {/* Character References Section */}
            {characters.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest px-2">Character Visuals (OpenArt Refs)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {characters.map(char => (
                            <div key={char.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden relative group aspect-[3/4] flex flex-col">
                                {char.image_url ? (
                                    <img src={char.image_url} alt={char.name} className="w-full h-full object-cover absolute inset-0" />
                                ) : (
                                    <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-4 text-center absolute inset-0">
                                        <span className="text-3xl mb-2 opacity-50">👤</span>
                                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider leading-tight">No Image</span>
                                    </div>
                                )}

                                {/* Overlay / Upload Button */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                                    <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-md transition-colors border border-white/20">
                                        {uploadingCharId === char.id ? 'Uploading...' : 'Upload'}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            disabled={uploadingCharId === char.id}
                                            onChange={(e) => handleFileUpload(e, char.id)}
                                        />
                                    </label>
                                </div>

                                {/* Name Label */}
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 pt-8">
                                    <p className="text-xs font-bold text-white text-center truncate shadow-sm">{char.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="h-px bg-zinc-800 my-8" />

            {error && (
                <div className="bg-red-950/40 border border-red-900/50 p-4 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            {scenes.length === 0 && !isExtracting && !error && (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50">
                    <span className="text-4xl mb-4">🎥</span>
                    <p className="text-zinc-500 font-medium">Click "Extract Scenes" to auto-generate a storyboard.</p>
                </div>
            )}

            {scenes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scenes.map((scene, i) => (
                        <div key={scene.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
                            {/* Image Area */}
                            <div className="w-full aspect-square bg-zinc-950 relative flex items-center justify-center border-b border-zinc-800 p-2">
                                {scene.imageUrl ? (
                                    <img src={scene.imageUrl} alt={scene.action} className="w-full h-full object-cover rounded-xl" />
                                ) : scene.isGenerating ? (
                                    <div className="flex flex-col items-center gap-3 text-zinc-500">
                                        <div className="animate-spin text-2xl">⏳</div>
                                        <span className="text-xs font-bold uppercase tracking-widest text-blue-400 animate-pulse">Generating Image...</span>
                                    </div>
                                ) : (
                                    <div className="text-zinc-800 text-4xl">🖼️</div>
                                )}
                            </div>

                            {/* Details Area */}
                            <div className="p-4 flex-1 flex flex-col gap-3">
                                <div>
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Scene {i + 1}</span>
                                    <p className="text-sm text-white font-bold mt-1 line-clamp-2">{scene.action}</p>
                                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1 italic">{scene.setting}</p>
                                </div>

                                <div className="flex flex-col gap-1 mt-auto">
                                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Image Prompt (DALL-E 3)</label>
                                    <textarea
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 resize-none h-20"
                                        value={scene.imagePrompt}
                                        onChange={(e) => updatePrompt(scene.id, e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={() => generateImage(scene.id, scene.imagePrompt)}
                                    disabled={scene.isGenerating}
                                    className="w-full mt-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {scene.isGenerating ? "Generating..." : scene.imageUrl ? "Regenerate Image" : "Generate Image"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
