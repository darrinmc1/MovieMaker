"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AutoSaveIndicator } from "@/components/admin/chapters/form/auto-save-indicator"
import { RichTextEditor } from "@/components/admin/chapters/form/rich-text-editor"
import { MetricsBar } from "@/components/admin/chapters/form/metrics-bar"
import { SectionHeading } from "@/components/admin/chapters/form/section-heading"
import { CharacterCheckboxGrid } from "@/components/admin/chapters/form/character-checkbox-grid"
import { PlotThreadCheckbox } from "@/components/admin/chapters/form/plot-thread-checkbox"
import { PlotProgressionRadio } from "@/components/admin/chapters/form/plot-progression-radio"
import { PreviewModal } from "@/components/admin/chapters/form/preview-modal"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { syncNovelChapterCounts } from "@/app/actions/novel-actions"
import type { ChapterFormData, Character, PlotThread, Novel } from "@/types/chapter-form"

const mockNovels: Novel[] = [
  { id: "1", title: "Oath of Flame – The Dragon's Legacy", lastChapterNumber: 15 },
  { id: "2", title: "Depthspire – The Dungeon Below", lastChapterNumber: 0 },
]

const mockCharacters: Character[] = [
  { id: "1", name: "Kael Dragonheart", role: "protagonist" },
  { id: "2", name: "Seraphina Ashborn", role: "protagonist" },
  { id: "3", name: "Lord Malachar", role: "antagonist" },
  { id: "4", name: "Elder Thorne", role: "supporting" },
]

const mockPlotThreads: PlotThread[] = [
  {
    id: "1",
    description: "The ancient dragon oath and its binding power",
    status: "active",
    importance: "major",
  },
  {
    id: "2",
    description: "Kael's search for his lost heritage",
    status: "active",
    importance: "major",
  },
  {
    id: "3",
    description: "The rebellion against the Dragon Council",
    status: "active",
    importance: "minor",
  },
]

export default function NewChapterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "idle">("idle")
  const [lastSaved, setLastSaved] = useState<Date>()
  const [isPublishing, setIsPublishing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<ChapterFormData>({
    novelId: "",
    chapterNumber: 1,
    title: "",
    content: "",
    summary: "",
    directorsNotes: "",
    plotSpoilers: "",
    publicationDate: new Date(),
    scheduleForFuture: false,
    publicationTime: "",
    characters: [],
    plotThreads: [],
    status: "draft",
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.title || formData.content) {
        setAutoSaveStatus("saving")
        setTimeout(() => {
          setAutoSaveStatus("saved")
          setLastSaved(new Date())
        }, 1000)
      }
    }, 30000)

    return () => clearTimeout(timer)
  }, [formData])

  useEffect(() => {
    if (formData.novelId) {
      const novel = mockNovels.find((n) => n.id === formData.novelId)
      if (novel) {
        setFormData((prev) => ({
          ...prev,
          chapterNumber: novel.lastChapterNumber + 1,
        }))
      }
    }
  }, [formData.novelId])

  const wordCount = formData.content.split(/\s+/).filter(Boolean).length
  const characterCount = formData.content.length

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.novelId) newErrors.novelId = "Please select a novel"
    if (!formData.chapterNumber) newErrors.chapterNumber = "Chapter number is required"
    if (!formData.title) newErrors.title = "Chapter title is required"
    if (!formData.content) newErrors.content = "Chapter content is required"
    if (wordCount < 100) newErrors.content = "Chapter content must be at least 100 words"
    if (!formData.summary) newErrors.summary = "Chapter summary is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveDraft = async () => {
    if (!formData.novelId) {
      toast({
        title: "Cannot save draft",
        description: "Please select a novel first.",
        variant: "destructive",
      })
      return
    }

    if (!formData.title) {
      toast({
        title: "Cannot save draft",
        description: "Please enter a chapter title first.",
        variant: "destructive",
      })
      return
    }

    setAutoSaveStatus("saving")
    const supabase = createClient()

    try {
      console.log("[v0] Saving draft chapter to database...")

      const { data, error } = await supabase
        .from("chapters")
        .insert({
          novel_id: formData.novelId,
          chapter_number: formData.chapterNumber,
          title: formData.title,
          content: formData.content,
          summary: formData.summary,
          directors_notes: formData.directorsNotes,
          plot_spoilers: formData.plotSpoilers,
          status: "draft",
          word_count: wordCount,
          publication_date: formData.publicationDate.toISOString(),
          scheduled_for_future: formData.scheduleForFuture,
          publication_time: formData.publicationTime,
        })
        .select()

      if (error) {
        console.log("[v0] Error saving draft:", error.message)
        throw error
      }

      console.log("[v0] Draft saved successfully:", data)

      await syncNovelChapterCounts(formData.novelId)

      setAutoSaveStatus("saved")
      setLastSaved(new Date())
      toast({
        title: "Draft saved",
        description: "Your chapter has been saved as a draft.",
      })
    } catch (error) {
      console.log("[v0] Failed to save draft:", error instanceof Error ? error.message : "Unknown error")
      setAutoSaveStatus("idle")
      toast({
        title: "Error saving draft",
        description: error instanceof Error ? error.message : "Failed to save chapter",
        variant: "destructive",
      })
    }
  }

  const handlePublish = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      })
      return
    }

    setIsPublishing(true)
    const supabase = createClient()

    try {
      console.log("[v0] Publishing chapter to database...")

      const { data, error } = await supabase
        .from("chapters")
        .insert({
          novel_id: formData.novelId,
          chapter_number: formData.chapterNumber,
          title: formData.title,
          content: formData.content,
          summary: formData.summary,
          directors_notes: formData.directorsNotes,
          plot_spoilers: formData.plotSpoilers,
          status: "published",
          word_count: wordCount,
          published_at: new Date().toISOString(),
          publication_date: formData.publicationDate.toISOString(),
          scheduled_for_future: formData.scheduleForFuture,
          publication_time: formData.publicationTime,
        })
        .select()

      if (error) {
        console.error("[v0] Error publishing chapter:", error)
        throw error
      }

      console.log("[v0] Chapter published successfully:", data)

      await syncNovelChapterCounts(formData.novelId)

      toast({
        title: "Chapter published successfully!",
        description: "Your chapter is now live.",
      })
      router.push("/admin/chapters")
    } catch (error) {
      console.error("[v0] Failed to publish chapter:", error)
      setIsPublishing(false)
      toast({
        title: "Error publishing chapter",
        description: error instanceof Error ? error.message : "Failed to publish chapter",
        variant: "destructive",
      })
    }
  }

  const handlePlotThreadProgressionChange = (
    threadId: string,
    progression: "introduced" | "advanced" | "resolved" | "referenced",
  ) => {
    setFormData((prev) => ({
      ...prev,
      plotThreads: prev.plotThreads.map((pt) => (pt.id === threadId ? { ...pt, progression } : pt)),
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/admin/chapters")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Chapters
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold">Upload New Chapter</h1>
            </div>
            <div className="flex items-center gap-4">
              <AutoSaveIndicator status={autoSaveStatus} lastSaved={lastSaved} />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" onClick={handleSaveDraft}>
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isPublishing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Publish
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <form className="space-y-8">
          <div className="bg-white rounded-lg p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="novel" className="text-sm font-semibold">
                  Select Novel <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.novelId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, novelId: value }))}
                >
                  <SelectTrigger id="novel" className={errors.novelId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Choose a novel..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockNovels.map((novel) => (
                      <SelectItem key={novel.id} value={novel.id}>
                        {novel.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.novelId && <p className="text-sm text-red-500 mt-1">{errors.novelId}</p>}
              </div>

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
                  className={errors.chapterNumber ? "border-red-500" : ""}
                />
                {formData.novelId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Suggested: Chapter {mockNovels.find((n) => n.id === formData.novelId)?.lastChapterNumber! + 1}
                  </p>
                )}
                {errors.chapterNumber && <p className="text-sm text-red-500 mt-1">{errors.chapterNumber}</p>}
              </div>

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
                  className={errors.title ? "border-red-500" : ""}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100</p>
                {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="publicationDate" className="text-sm font-semibold">
                  Publication Date
                </Label>
                <Input
                  id="publicationDate"
                  type="date"
                  value={formData.publicationDate.toISOString().split("T")[0]}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      publicationDate: new Date(e.target.value),
                    }))
                  }
                />
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    id="scheduleForFuture"
                    checked={formData.scheduleForFuture}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        scheduleForFuture: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="scheduleForFuture" className="text-sm font-normal">
                    Schedule for future publication
                  </Label>
                </div>
                {formData.scheduleForFuture && (
                  <Input
                    type="time"
                    value={formData.publicationTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, publicationTime: e.target.value }))}
                    className="mt-2"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Content</h2>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Chapter Content <span className="text-red-500">*</span>
              </Label>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
                placeholder="Start writing your chapter..."
              />
              {errors.content && <p className="text-sm text-red-500 mt-2">{errors.content}</p>}
              <MetricsBar wordCount={wordCount} characterCount={characterCount} />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Metadata</h2>

            <div className="space-y-6">
              <div>
                <Label htmlFor="summary" className="text-sm font-semibold">
                  Chapter Summary <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="summary"
                  rows={3}
                  placeholder="Write a brief 2-3 sentence summary of this chapter..."
                  value={formData.summary}
                  onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                  maxLength={300}
                  className={errors.summary ? "border-red-500" : ""}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">This will be shown on the chapter list</p>
                  <p className="text-xs text-gray-500">{formData.summary.length}/300</p>
                </div>
                {errors.summary && <p className="text-sm text-red-500 mt-1">{errors.summary}</p>}
              </div>

              <SectionHeading title="Director's Notes" optional collapsible>
                <Textarea
                  rows={4}
                  placeholder="Share behind-the-scenes thoughts, writing process, inspiration..."
                  value={formData.directorsNotes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, directorsNotes: e.target.value }))}
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">Optional: Readers can choose to view this</p>
                  <p className="text-xs text-gray-500">{formData.directorsNotes?.length || 0}/1000</p>
                </div>
              </SectionHeading>

              <SectionHeading title="Plot Spoilers" optional collapsible>
                <Textarea
                  rows={4}
                  placeholder="Hint at future events, explain foreshadowing, reveal plot connections..."
                  value={formData.plotSpoilers}
                  onChange={(e) => setFormData((prev) => ({ ...prev, plotSpoilers: e.target.value }))}
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">This will be hidden by default with a spoiler warning</p>
                  <p className="text-xs text-gray-500">{formData.plotSpoilers?.length || 0}/1000</p>
                </div>
              </SectionHeading>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Characters & Plot Threads</h2>

            <div className="space-y-8">
              <div>
                <Label className="text-sm font-semibold mb-3 block">Characters in This Chapter</Label>
                <CharacterCheckboxGrid
                  characters={mockCharacters}
                  selectedCharacters={formData.characters}
                  onChange={(characters) => setFormData((prev) => ({ ...prev, characters }))}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold mb-3 block">Plot Threads Referenced</Label>
                <PlotThreadCheckbox
                  plotThreads={mockPlotThreads}
                  selectedThreads={formData.plotThreads.map((pt) => pt.id)}
                  onChange={(threadIds) => {
                    const newPlotThreads = threadIds.map((id) => {
                      const existing = formData.plotThreads.find((pt) => pt.id === id)
                      return (
                        existing || {
                          id,
                          progression: "referenced" as const,
                        }
                      )
                    })
                    setFormData((prev) => ({ ...prev, plotThreads: newPlotThreads }))
                  }}
                />
              </div>

              {formData.plotThreads.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Plot Thread Progression</Label>
                  <div className="space-y-3">
                    {formData.plotThreads.map((pt) => {
                      const thread = mockPlotThreads.find((t) => t.id === pt.id)
                      if (!thread) return null
                      return (
                        <PlotProgressionRadio
                          key={pt.id}
                          plotThread={thread}
                          value={pt.progression}
                          onChange={(progression) => handlePlotThreadProgressionChange(pt.id, progression)}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className="sticky bottom-0 bg-white border-t py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/admin/chapters")}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSaveDraft}>
              Save Draft
            </Button>
            <Button onClick={handlePublish} disabled={isPublishing} className="bg-indigo-600 hover:bg-indigo-700">
              {isPublishing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Publish Chapter
            </Button>
          </div>
        </div>
      </div>

      <PreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        formData={formData}
        characters={mockCharacters}
        plotThreads={mockPlotThreads}
      />
    </div>
  )
}
