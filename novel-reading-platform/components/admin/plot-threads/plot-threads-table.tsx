"use client"

import { useState } from "react"
import { MoreVertical, Pencil, Trash2, CheckCircle, BookOpen, FileText } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { PlotThread } from "@/types/plot-thread"
import { ImportanceBadge } from "./importance-badge"
import { StatusBadge } from "./status-badge"

interface PlotThreadsTableProps {
  plotThreads: PlotThread[]
  onEdit: (plotThread: PlotThread) => void
  onDelete: (plotThread: PlotThread) => void
  onMarkResolved: (plotThread: PlotThread) => void
}

export function PlotThreadsTable({ plotThreads, onEdit, onDelete, onMarkResolved }: PlotThreadsTableProps) {
  const router = useRouter()
  const [sortField, setSortField] = useState<keyof PlotThread>("description")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSort = (field: keyof PlotThread) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedPlotThreads = [...plotThreads].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    const modifier = sortDirection === "asc" ? 1 : -1

    if (typeof aValue === "string" && typeof bValue === "string") {
      return aValue.localeCompare(bValue) * modifier
    }
    if (typeof aValue === "number" && typeof bValue === "number") {
      return (aValue - bValue) * modifier
    }
    return 0
  })

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort("description")}>
              Description {sortField === "description" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead>Novel</TableHead>
            <TableHead>Importance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Introduced</TableHead>
            <TableHead>Resolved</TableHead>
            <TableHead className="w-[60px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlotThreads.map((plotThread) => (
            <TableRow key={plotThread.id} className="hover:bg-gray-50">
              <TableCell className="font-semibold max-w-md">
                <div className="truncate" title={plotThread.description}>
                  {plotThread.description}
                </div>
              </TableCell>
              <TableCell className="text-gray-600">{plotThread.novelTitle}</TableCell>
              <TableCell>
                <ImportanceBadge importance={plotThread.importance} />
              </TableCell>
              <TableCell>
                <StatusBadge status={plotThread.status} />
              </TableCell>
              <TableCell className="text-gray-600">Ch {plotThread.introducedChapter}</TableCell>
              <TableCell className="text-gray-600">
                {plotThread.resolvedChapter ? `Ch ${plotThread.resolvedChapter}` : "—"}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(plotThread)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Plot Thread
                    </DropdownMenuItem>
                    {plotThread.status !== "resolved" && (
                      <DropdownMenuItem onClick={() => onMarkResolved(plotThread)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Resolved
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => router.push(`/admin/novels?search=${encodeURIComponent(plotThread.novelTitle)}`)}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Novel
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(`/admin/chapters?novel=${encodeURIComponent(plotThread.novelTitle)}`)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Chapters
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(plotThread)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
