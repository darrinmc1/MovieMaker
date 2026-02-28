"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Eye, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChapterUploadForm } from "./chapter-upload-form"
import { ChapterEditForm } from "./chapter-edit-form"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

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

interface ChapterManagementProps {
  novelId: string
  novelTitle: string
}

export function ChapterManagement({ novelId, novelTitle }: ChapterManagementProps) {
  const { toast } = useToast()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)

  useEffect(() => {
    fetchChapters()
  }, [novelId])

  const fetchChapters = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("chapters")
      .select("*")
      .eq("novel_id", novelId)
      .order("chapter_number", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching chapters:", error)
      toast({
        title: "Error loading chapters",
        description: error.message,
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    const formattedChapters: Chapter[] = (data || []).map((ch) => ({
      id: ch.id,
      chapterNumber: ch.chapter_number,
      title: ch.title,
      status: ch.status as "draft" | "published",
      wordCount: ch.word_count || 0,
      publishedAt: ch.published_at ? new Date(ch.published_at) : undefined,
      lastModified: new Date(ch.updated_at),
      content: ch.content,
      summary: ch.summary,
      revisionNotes: ch.revision_notes,
      directorsNotes: ch.directors_notes,
    }))

    setChapters(formattedChapters)
    setIsLoading(false)
  }

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm("Are you sure you want to delete this chapter?")) return

    const supabase = createClient()
    const { error } = await supabase.from("chapters").delete().eq("id", chapterId)

    if (error) {
      toast({
        title: "Error deleting chapter",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Chapter deleted",
      description: "The chapter has been deleted successfully.",
    })

    fetchChapters()
  }

  if (showUploadForm) {
    return (
      <ChapterUploadForm
        novelId={novelId}
        novelTitle={novelTitle}
        suggestedChapterNumber={chapters.length + 1}
        onCancel={() => setShowUploadForm(false)}
        onSuccess={() => {
          setShowUploadForm(false)
          fetchChapters()
        }}
      />
    )
  }

  if (editingChapter) {
    return (
      <ChapterEditForm
        chapter={editingChapter}
        novelId={novelId}
        novelTitle={novelTitle}
        onCancel={() => setEditingChapter(null)}
        onSuccess={() => {
          setEditingChapter(null)
          fetchChapters()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Chapter Management</h2>
            <p className="text-sm text-gray-600 mt-1">Upload, edit, and manage chapters for {novelTitle}</p>
          </div>
          <Button onClick={() => setShowUploadForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Upload New Chapter
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-600">Total Chapters</p>
            <p className="text-2xl font-bold text-gray-900">{chapters.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Published</p>
            <p className="text-2xl font-bold text-green-600">
              {chapters.filter((c) => c.status === "published").length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Drafts</p>
            <p className="text-2xl font-bold text-amber-600">{chapters.filter((c) => c.status === "draft").length}</p>
          </div>
        </div>
      </Card>

      {/* Chapters List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600">Loading chapters...</p>
          </Card>
        ) : chapters.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No chapters yet</h3>
            <p className="text-gray-600 mb-4">Start writing by uploading your first chapter</p>
            <Button onClick={() => setShowUploadForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Upload First Chapter
            </Button>
          </Card>
        ) : (
          chapters.map((chapter) => (
            <Card key={chapter.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-red-500 text-white font-bold">
                    {chapter.chapterNumber}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{chapter.title}</h3>
                      <Badge variant={chapter.status === "published" ? "default" : "secondary"}>{chapter.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>{chapter.wordCount.toLocaleString()} words</span>
                      <span>•</span>
                      <span>
                        {chapter.status === "published" && chapter.publishedAt
                          ? `Published ${chapter.publishedAt.toLocaleDateString()}`
                          : `Modified ${chapter.lastModified.toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2" onClick={() => setEditingChapter(chapter)}>
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteChapter(chapter.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
