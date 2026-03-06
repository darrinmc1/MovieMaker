"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, BookOpen, User, GitBranch, ChevronDown } from "lucide-react"
import { useState } from "react"
import type { ChapterFormData, Character, PlotThread } from "@/types/chapter-form"

interface PreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: ChapterFormData
  characters: Character[]
  plotThreads: PlotThread[]
}

export function PreviewModal({ open, onOpenChange, formData, characters, plotThreads }: PreviewModalProps) {
  const [showDirectorsNotes, setShowDirectorsNotes] = useState(false)
  const [showSpoilers, setShowSpoilers] = useState(false)

  const wordCount = formData.content.split(/\s+/).filter(Boolean).length
  const readingTime = Math.ceil(wordCount / 200)

  const selectedCharacters = characters.filter((c) => formData.characters.includes(c.id))
  const selectedThreads = plotThreads.filter((t) => formData.plotThreads.some((pt) => pt.id === t.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chapter Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Chapter Header */}
          <div className="border-b pb-4">
            <div className="text-sm text-gray-500 mb-1">Chapter {formData.chapterNumber}</div>
            <h1 className="text-3xl font-bold mb-3">{formData.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {wordCount} words
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {readingTime} min read
              </div>
            </div>
          </div>

          {/* Chapter Content */}
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formData.content }} />

          {/* Director's Notes */}
          {formData.directorsNotes && (
            <div className="border-t pt-4">
              <button
                onClick={() => setShowDirectorsNotes(!showDirectorsNotes)}
                className="flex items-center gap-2 text-sm font-semibold mb-2 hover:text-indigo-600"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${showDirectorsNotes ? "rotate-180" : ""}`} />
                Director's Notes
              </button>
              {showDirectorsNotes && (
                <div className="text-sm text-gray-700 bg-amber-50 p-4 rounded-lg">{formData.directorsNotes}</div>
              )}
            </div>
          )}

          {/* Plot Spoilers */}
          {formData.plotSpoilers && (
            <div className="border-t pt-4">
              {!showSpoilers ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSpoilers(true)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Reveal Plot Spoilers & Foreshadowing
                </Button>
              ) : (
                <div>
                  <div className="text-sm font-semibold mb-2 text-red-600">Plot Spoilers & Foreshadowing</div>
                  <div className="text-sm text-gray-700 bg-red-50 p-4 rounded-lg border border-red-200">
                    {formData.plotSpoilers}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Characters Sidebar */}
          {selectedCharacters.length > 0 && (
            <div className="border-t pt-4">
              <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Characters in This Chapter
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedCharacters.map((character) => (
                  <Badge key={character.id} variant="secondary">
                    {character.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Plot Threads Sidebar */}
          {selectedThreads.length > 0 && (
            <div className="border-t pt-4">
              <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Plot Threads Referenced
              </div>
              <div className="space-y-2">
                {selectedThreads.map((thread) => {
                  const progression = formData.plotThreads.find((pt) => pt.id === thread.id)
                  return (
                    <div key={thread.id} className="text-sm">
                      <div className="font-medium">{thread.description}</div>
                      {progression && (
                        <div className="text-gray-600 text-xs mt-1">
                          {progression.progression.charAt(0).toUpperCase() + progression.progression.slice(1)} in this
                          chapter
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>Edit Chapter</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
