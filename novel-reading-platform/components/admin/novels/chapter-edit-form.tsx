"use client"

import { useState } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { RichTextEditor } from "@/components/admin/chapters/form/rich-text-editor"
import { MetricsBar } from "@/components/admin/chapters/form/metrics-bar"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { syncNovelChapterCounts } from "@/app/actions/novel-actions"

interface Chapter {
  id: string
  chapterNumber: number
  title: string
  status: "draft" | "published"
  wordCount: number
  publishedAt?: Date
  lastModified: Date
  content?: string
  summary?: string
  revisionNotes?: string
  directorsNotes?: string
}

interface ChapterEditFormProps {
  chapter: Chapter
  novelId: string
  novelTitle: string
  onCancel: () => void
  onSuccess: () => void
}

export function ChapterEditForm({ chapter, novelId, novelTitle, onCancel, onSuccess }: ChapterEditFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    chapterNumber: chapter.chapterNumber,
    title: chapter.title,
    content: chapter.content || "",
    summary: chapter.summary || "",
    revisionNotes: chapter.revisionNotes || "",
    directorsNotes: chapter.directorsNotes || "",
  })

  const wordCount = formData.content.split(/\s+/).filter(Boolean).length
  const characterCount = formData.content.length

  const handleSubmit = async (status: "draft" | "published") => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Validation error",
        description: "Please fill in the chapter title and content.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    console.log("[v0] Saving chapter to database...")

    const supabase = createClient()

    const updateData = {
      chapter_number: formData.chapterNumber,
      title: formData.title,
      content: formData.content,
      summary: formData.summary,
      revision_notes: formData.revisionNotes,
      directors_notes: formData.directorsNotes,
      status,
      word_count: wordCount,
      updated_at: new Date().toISOString(),
      ...(status === "published" && !chapter.publishedAt ? { published_at: new Date().toISOString() } : {}),
    }

    const { error } = await supabase.from("chapters").update(updateData).eq("id", chapter.id)

    if (error) {
      setIsLoading(false)
      console.error("[v0] Error saving chapter:", error)
      toast({
        title: "Error saving chapter",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    await syncNovelChapterCounts(novelId)

    setIsLoading(false)
    console.log("[v0] Chapter saved successfully")
    toast({
      title: "Chapter updated!",
      description: `Chapter ${formData.chapterNumber} has been updated successfully.`,
    })

    onSuccess()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onCancel} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Chapters
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Chapter {chapter.chapterNumber}</h2>
              <p className="text-sm text-gray-600">{novelTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={isLoading}>
              Save Draft
            </Button>
            <Button onClick={() => handleSubmit("published")} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {chapter.status === "published" ? "Update" : "Publish"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Form */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Chapter Number */}
          <div>
            <Label htmlFor="chapterNumber" className="text-sm font-semibold">
              Chapter Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="chapterNumber"
              type="number"
              min="1"
              value={formData.chapterNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  chapterNumber: Number.parseInt(e.target.value) || 1,
                }))
              }
            />
          </div>

          {/* Chapter Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-semibold">
              Chapter Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., The Forge's Secret"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100</p>
          </div>

          {/* Chapter Content */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Chapter Content <span className="text-red-500">*</span>
            </Label>
            <RichTextEditor
              content={formData.content}
              onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
              placeholder="Start writing your chapter..."
            />
            <MetricsBar wordCount={wordCount} characterCount={characterCount} />
          </div>

          {/* Chapter Summary */}
          <div>
            <Label htmlFor="summary" className="text-sm font-semibold">
              Chapter Summary
            </Label>
            <Textarea
              id="summary"
              rows={3}
              placeholder="Write a brief 2-3 sentence summary of this chapter..."
              value={formData.summary}
              onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
              maxLength={300}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">This will be shown on the chapter list</p>
              <p className="text-xs text-gray-500">{formData.summary.length}/300</p>
            </div>
          </div>

          {/* Revision Notes */}
          <div>
            <Label htmlFor="revisionNotes" className="text-sm font-semibold">
              Revision Notes
            </Label>
            <Textarea
              id="revisionNotes"
              rows={4}
              placeholder="What changed from the previous draft? Track your revisions here..."
              value={formData.revisionNotes}
              onChange={(e) => setFormData((prev) => ({ ...prev, revisionNotes: e.target.value }))}
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                Document changes, improvements, or feedback addressed in this version
              </p>
              <p className="text-xs text-gray-500">{formData.revisionNotes.length}/1000</p>
            </div>
          </div>

          {/* Director's Notes */}
          <div>
            <Label htmlFor="directorsNotes" className="text-sm font-semibold">
              Director's Notes (Optional)
            </Label>
            <Textarea
              id="directorsNotes"
              rows={4}
              placeholder="Share behind-the-scenes thoughts, writing process, inspiration..."
              value={formData.directorsNotes}
              onChange={(e) => setFormData((prev) => ({ ...prev, directorsNotes: e.target.value }))}
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">Optional: Readers can choose to view this</p>
              <p className="text-xs text-gray-500">{formData.directorsNotes.length}/1000</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Footer Actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={isLoading}>
              Save Draft
            </Button>
            <Button onClick={() => handleSubmit("published")} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {chapter.status === "published" ? "Update" : "Publish"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
