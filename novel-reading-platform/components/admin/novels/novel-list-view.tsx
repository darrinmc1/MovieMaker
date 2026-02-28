"use client"

import { Eye, MessageSquare, ChevronUp, ChevronDown } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "./status-badge"
import { ProgressBar } from "./progress-bar"
import { ActionDropdown } from "./action-dropdown"
import type { Novel } from "@/types/novel"
import { formatDistanceToNow } from "date-fns"

interface NovelListViewProps {
  novels: Novel[]
  sortColumn?: string
  sortDirection?: "asc" | "desc"
  onSort?: (column: string) => void
  onEdit: (id: string) => void
  onView: (id: string) => void
  onDelete: (id: string) => void
}

export function NovelListView({
  novels,
  sortColumn,
  sortDirection,
  onSort,
  onEdit,
  onView,
  onDelete,
}: NovelListViewProps) {
  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return null
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    )
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Cover</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort?.("title")}>
              Title <SortIcon column="title" />
            </TableHead>
            <TableHead>Genre</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Stats</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort?.("lastUpdated")}>
              Last Updated <SortIcon column="lastUpdated" />
            </TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {novels.map((novel) => (
            <TableRow key={novel.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="w-[60px] h-[90px] bg-muted rounded overflow-hidden">
                  {novel.coverUrl ? (
                    <img
                      src={novel.coverUrl || "/placeholder.svg"}
                      alt={novel.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Eye className="h-6 w-6" />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-semibold">{novel.title}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{novel.genre}</Badge>
              </TableCell>
              <TableCell>
                <StatusBadge status={novel.status} />
              </TableCell>
              <TableCell>
                <div className="min-w-[120px]">
                  <div className="text-sm text-muted-foreground mb-1">
                    {novel.publishedChapters}/{novel.totalChapters}
                  </div>
                  <ProgressBar current={novel.publishedChapters} total={novel.totalChapters} showLabel={false} />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {novel.views.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {novel.comments}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(novel.lastUpdated, { addSuffix: true })}
              </TableCell>
              <TableCell>
                <ActionDropdown
                  novelId={novel.id}
                  novelTitle={novel.title}
                  onEdit={() => onEdit(novel.id)}
                  onView={() => onView(novel.id)}
                  onDelete={() => onDelete(novel.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
