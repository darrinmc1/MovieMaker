import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, MessageSquare } from "lucide-react"

interface ChapterGridCardProps {
  novelId: string
  number: number
  title: string
  wordCount: number
  publishedDate: string
  commentCount: number
  preview?: string
  isRead?: boolean
}

export function ChapterGridCard({
  novelId,
  number,
  title,
  wordCount,
  publishedDate,
  commentCount,
  preview = "Click to read this chapter...",
  isRead = false,
}: ChapterGridCardProps) {
  return (
    <a href={`/novel/${novelId}/chapter/${number}`} className="block group">
      <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="text-4xl font-bold text-primary/20 group-hover:text-primary/40 transition-colors">
              {number}
            </div>
            {isRead && (
              <Badge variant="secondary" className="text-xs">
                Read
              </Badge>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{preview}</p>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{wordCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{commentCount}</span>
            </div>
            <span className="ml-auto">{publishedDate}</span>
          </div>
        </CardContent>
      </Card>
    </a>
  )
}
