import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, List } from "lucide-react"

interface ChapterNavigationProps {
  novelId: string
  currentChapter: number
  totalChapters: number
}

export function ChapterNavigation({ novelId, currentChapter, totalChapters }: ChapterNavigationProps) {
  const hasPrevious = currentChapter > 1
  const hasNext = currentChapter < totalChapters

  return (
    <div className="flex items-center justify-between gap-4">
      {hasPrevious ? (
        <Button variant="outline" asChild className="flex-1 sm:flex-none bg-transparent">
          <Link href={`/novel/${novelId}/chapter/${currentChapter - 1}`}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Link>
        </Button>
      ) : (
        <Button variant="outline" disabled className="flex-1 sm:flex-none bg-transparent">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
      )}

      <Button variant="outline" asChild>
        <Link href={`/novel/${novelId}`}>
          <List className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Table of Contents</span>
          <span className="sm:hidden">Chapters</span>
        </Link>
      </Button>

      {hasNext ? (
        <Button variant="outline" asChild className="flex-1 sm:flex-none bg-transparent">
          <Link href={`/novel/${novelId}/chapter/${currentChapter + 1}`}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" disabled className="flex-1 sm:flex-none bg-transparent">
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
