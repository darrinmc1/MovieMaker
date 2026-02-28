"use client"

import { Eye, MessageSquare, Edit, ExternalLink, BookOpen, Users, GitBranch } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./status-badge"
import { ProgressBar } from "./progress-bar"
import type { Novel } from "@/types/novel"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

interface NovelCardProps {
  novel: Novel
  onEdit: () => void
  onView: () => void
  onDelete: () => void
}

export function NovelCard({ novel, onEdit, onView }: NovelCardProps) {
  const router = useRouter()

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <div className="aspect-[2/3] bg-muted overflow-hidden">
          {novel.coverUrl ? (
            <img src={novel.coverUrl || "/placeholder.svg"} alt={novel.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Eye className="h-12 w-12" />
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
          <div className="flex gap-2">
            <Button size="sm" onClick={onEdit} className="bg-white text-black hover:bg-white/90">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onView}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/admin/chapters/new?novel=${novel.id}`)}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs"
            >
              <BookOpen className="h-3 w-3 mr-1" />
              Add Chapter
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/admin/characters?novel=${encodeURIComponent(novel.title)}`)}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs"
            >
              <Users className="h-3 w-3 mr-1" />
              Characters
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/admin/plot-threads?novel=${encodeURIComponent(novel.title)}`)}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs"
            >
              <GitBranch className="h-3 w-3 mr-1" />
              Plot Threads
            </Button>
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <StatusBadge status={novel.status} />
        </div>
      </div>

      <CardContent className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-lg line-clamp-2 mb-1">{novel.title}</h3>
          <Badge variant="outline" className="text-xs">
            {novel.genre}
          </Badge>
        </div>

        <div className="mb-3">
          <ProgressBar current={novel.publishedChapters} total={novel.totalChapters} />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {novel.views.toLocaleString()}
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {novel.comments}
            </div>
          </div>
          <div className="text-xs">{formatDistanceToNow(novel.lastUpdated, { addSuffix: true })}</div>
        </div>
      </CardContent>
    </Card>
  )
}
