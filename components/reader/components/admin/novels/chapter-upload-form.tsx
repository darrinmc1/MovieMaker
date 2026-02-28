"use client"

import { useState, useEffect } from "react"
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

interface ChapterUploadFormProps {
  novelId: string
  novelTitle: string
  suggestedChapterNumber: number
  onCancel: () => void
  onSuccess: () => void
}

export function ChapterUploadForm({
  novelId,
  novelTitle,
  suggestedChapterNumber,
  onCancel,
  onSuccess,
}: ChapterUploadFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [databaseNovelId, setDatabaseNovelId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [formData, setFormData] = useState({
    chapterNumber: suggestedChapterNumber,
    title: "",
    content: "",
    summary: "",
    revisionNotes: "",
    directorsNotes: "",
  })

  const wordCount = formData.content.split(/\s+/).filter(Boolean).length
  const characterCount = formData.content.length

  useEffect(() => {
    async function initializeNovel() {
      const supabase = createClient()

      try {
        console.log("[v0] Initializing novel in database...")
        console.log("[v0] Looking for novel with slug/id:", novelId)

        const { data: existingNovels, error: searchError } = await supabase
          .from("novels")
          .select("id, title")
          .eq("title", novelTitle)
          .limit(1)

        if (searchError) {
          console.error("[v0] Error searching for novel:", searchError)
          throw searchError
        }

        if (existingNovels && existingNovels.length > 0) {
          console.log("[v0] Found existing novel in database:", existingNovels[0])
          setDatabaseNovelId(existingNovels[0].id)
        } else {
          console.log("[v0] Novel not found in database, creating new entry...")
          const { data: newNovel, error: insertError } = await supabase
            .from("novels")
            .insert({
              title: novelTitle,
              description: "Novel created from chapter upload",
              genre: "Epic Fantasy",
              status: "In Progress",
              total_chapters: 0,
              published_chapters: 0,
            })
            .select("id")
            .single()

          if (insertError) {
            console.error("[v0] Error creating novel:", insertError)
            throw insertError
          }

          console.log("[v0] Created new novel in database:", newNovel)
          setDatabaseNovelId(newNovel.id)
        }
      } catch (error) {
        console.error("[v0] Failed to initialize novel:", error)
        toast({
          title: "Error initializing novel",
          description: "Failed to prepare novel for chapter upload. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsInitializing(false)
      }
    }

    initializeNovel()
  }, [novelId, novelTitle, toast])

  const handleSubmit = async (status: "draft" | "published") => {
    if (!databaseNovelId) {
      toast({
        title: "Error",
        description: "Novel not properly initialized. Please try again.",
        variant: "destructive",
      })
      return
    }

    if (!formData.title || !formData.content) {
      toast({
        title: "Validation error",
        description: "Please fill in the chapter title and content.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      console.log("[v0] Saving chapter to database...")
      console.log("[v0] Using database novel UUID:", databaseNovelId)

      const { data: existingChapter, error: checkError } = await supabase
        .from("chapters")
        .select("id")
        .eq("novel_id", databaseNovelId)
        .eq("chapter_number", formData.chapterNumber)
        .maybeSingle()

      if (checkError) {
        console.error("[v0] Error checking for existing chapter:", checkError)
        throw checkError
      }

      const chapterData = {
        novel_id: databaseNovelId,
        chapter_number: formData.chapterNumber,
        title: formData.title,
        content: formData.content,
        summary: formData.summary,
        revision_notes: formData.revisionNotes,
        directors_notes: formData.directorsNotes,
        status,
        word_count: wordCount,
        ...(status === "published" && { published_at: new Date().toISOString() }),
      }

      let data, error

      if (existingChapter) {
        console.log("[v0] Updating existing chapter:", existingChapter.id)
        const result = await supabase.from("chapters").update(chapterData).eq("id", existingChapter.id).select()

        data = result.data
        error = result.error
      } else {
        console.log("[v0] Inserting new chapter")
        const result = await supabase.from("chapters").insert(chapterData).select()

        data = result.data
        error = result.error
      }

      if (error) {
        console.error("[v0] Error saving chapter:", error)
        throw error
      }

      console.log("[v0] Chapter saved successfully:", data)
      setIsLoading(false)

      toast({
        title: status === "published" ? "Chapter published!" : "Draft saved",
        description: `Chapter ${formData.chapterNumber} has been ${existingChapter ? "updated" : "created"} and ${status === "published" ? "published" : "saved as draft"}.`,
      })

      onSuccess()
    } catch (error) {
      console.error("[v0] Failed to save chapter:", error)
      setIsLoading(false)
      toast({
        title: "Error saving chapter",
        description: error instanceof Error ? error.message : "Failed to save chapter",
        variant: "destructive",
      })
    }
  }

  if (isInitializing) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Preparing novel...</h3>
          <p className="text-gray-600">Setting up the database for chapter upload</p>
        </Card>
      </div>
    )
  }

  if (!databaseNovelId) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Failed to initialize novel</h3>
          <p className="text-gray-600 mb-4">Unable to prepare the database for chapter upload</p>
          <Button onClick={onCancel}>Back to Chapters</Button>
        </Card>
      </div>
    )
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
              <h2 className="text-lg font-semibold text-gray-900">Upload New Chapter</h2>
              <p className="text-sm text-gray-600">{novelTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={isLoading}>
              Save Draft
            </Button>
            <Button onClick={() => handleSubmit("published")} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Publish
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
            <p className="text-xs text-gray-500 mt-1">Suggested: Chapter {suggestedChapterNumber}</p>
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
              Publish Chapter
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
