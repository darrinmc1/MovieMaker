"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NovelsPageHeader } from "@/components/admin/novels/novels-page-header"
import { FilterBar } from "@/components/admin/novels/filter-bar"
import { NovelListView } from "@/components/admin/novels/novel-list-view"
import { NovelGridView } from "@/components/admin/novels/novel-grid-view"
import { EmptyState } from "@/components/admin/novels/empty-state"
import { DeleteConfirmModal } from "@/components/admin/novels/delete-confirm-modal"
import type { Novel, NovelStatus, ViewMode, SortOption } from "@/types/novel"
import type { NovelData } from "@/types/novel"
import { getNovels } from "@/lib/novels-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NovelsPage() {
  const router = useRouter()
  const [novelsData, setNovelsData] = useState<NovelData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [novels, setNovels] = useState<Novel[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [statusFilter, setStatusFilter] = useState<NovelStatus | "all">("all")
  const [genreFilter, setGenreFilter] = useState("all")
  const [sortBy, setSortBy] = useState<SortOption>("latest")
  const [sortColumn, setSortColumn] = useState<string>("lastUpdated")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; novel: Novel | null }>({
    open: false,
    novel: null,
  })

  useEffect(() => {
    async function fetchNovels() {
      setIsLoading(true)
      const data = await getNovels()
      setNovelsData(data)

      // Convert to Novel type for the UI
      const mappedNovels: Novel[] = data.map((novel) => ({
        id: novel.id,
        title: novel.title,
        coverUrl: novel.coverImage || "",
        genre: novel.genre,
        status: novel.status === "In Progress" ? "in-progress" : novel.status === "Complete" ? "complete" : "on-hiatus",
        totalChapters: novel.progress.total || 0,
        publishedChapters: novel.progress.current || 0,
        views: 0,
        comments: 0,
        lastUpdated: new Date(),
      }))

      setNovels(mappedNovels)
      setIsLoading(false)
    }

    fetchNovels()
  }, [])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handleEdit = (id: string) => {
    router.push(`/admin/novels/${id}/edit`)
  }

  const handleView = (id: string) => {
    router.push(`/novel/${id}`)
  }

  const handleDelete = (id: string) => {
    const novel = novels.find((n) => n.id === id)
    if (novel) {
      setDeleteModal({ open: true, novel })
    }
  }

  const confirmDelete = () => {
    console.log("[v0] Delete novel:", deleteModal.novel?.id)
    setDeleteModal({ open: false, novel: null })
    // Perform delete operation
  }

  const handleCreateNovel = () => {
    router.push("/admin/novels/new")
  }

  // Filter and sort novels
  const filteredNovels = novels
    .filter((novel) => {
      const matchesSearch = novel.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || novel.status === statusFilter
      const matchesGenre = genreFilter === "all" || novel.genre.toLowerCase() === genreFilter.toLowerCase()
      return matchesSearch && matchesStatus && matchesGenre
    })
    .sort((a, b) => {
      let comparison = 0

      if (sortColumn === "title") {
        comparison = a.title.localeCompare(b.title)
      } else if (sortColumn === "lastUpdated") {
        comparison = a.lastUpdated.getTime() - b.lastUpdated.getTime()
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Access - All Novels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {novelsData.map((novel) => (
                <Link
                  key={novel.id}
                  href={`/admin/novels/${novel.id}/edit`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <BookOpen className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{novel.title}</p>
                    <p className="text-xs text-muted-foreground">{novel.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <NovelsPageHeader
          searchQuery={searchQuery}
          viewMode={viewMode}
          onSearchChange={setSearchQuery}
          onViewModeChange={setViewMode}
          onCreateNovel={handleCreateNovel}
        />

        {novels.length === 0 ? (
          <EmptyState onCreateNovel={handleCreateNovel} />
        ) : (
          <>
            <FilterBar
              statusFilter={statusFilter}
              genreFilter={genreFilter}
              sortBy={sortBy}
              onStatusChange={setStatusFilter}
              onGenreChange={setGenreFilter}
              onSortChange={setSortBy}
            />

            {viewMode === "list" ? (
              <NovelListView
                novels={filteredNovels}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
              />
            ) : (
              <NovelGridView novels={filteredNovels} onEdit={handleEdit} onView={handleView} onDelete={handleDelete} />
            )}
          </>
        )}

        <DeleteConfirmModal
          open={deleteModal.open}
          novelTitle={deleteModal.novel?.title || ""}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal({ open: false, novel: null })}
        />
      </div>
    </>
  )
}
