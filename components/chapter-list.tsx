"use client"

import { useState } from "react"
import Link from "next/link"
import { MessageCircle, LayoutGrid, List } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChapterGridCard } from "@/components/chapter-grid-card"

interface Chapter {
  number: number
  title: string
  wordCount: number
  publishedDate: string
  commentCount: number
}

interface ChapterListProps {
  novelId: string
  chapters: Chapter[]
}

export function ChapterList({ novelId, chapters }: ChapterListProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
          <List className="h-4 w-4 mr-2" />
          List
        </Button>
        <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
          <LayoutGrid className="h-4 w-4 mr-2" />
          Grid
        </Button>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-3">
          {chapters.map((chapter) => (
            <Link key={chapter.number} href={`/novel/${novelId}/chapter/${chapter.number}`}>
              <Card className="transition-all hover:shadow-md hover:border-primary/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-balance">
                        Chapter {chapter.number}: {chapter.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{chapter.wordCount.toLocaleString()} words</span>
                        <span>{chapter.publishedDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm">{chapter.commentCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.map((chapter) => (
            <ChapterGridCard
              key={chapter.number}
              novelId={novelId}
              number={chapter.number}
              title={chapter.title}
              wordCount={chapter.wordCount}
              publishedDate={chapter.publishedDate}
              commentCount={chapter.commentCount}
              isRead={chapter.number <= 5}
            />
          ))}
        </div>
      )}
    </div>
  )
}
