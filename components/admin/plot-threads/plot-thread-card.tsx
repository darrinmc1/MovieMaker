"use client"

import { MoreVertical, Pencil, Trash2, CheckCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import type { PlotThread } from "@/types/plot-thread"
import { ImportanceBadge } from "./importance-badge"
import { StatusBadge } from "./status-badge"

interface PlotThreadCardProps {
  plotThread: PlotThread
  onEdit: (plotThread: PlotThread) => void
  onDelete: (plotThread: PlotThread) => void
  onMarkResolved: (plotThread: PlotThread) => void
}

export function PlotThreadCard({ plotThread, onEdit, onDelete, onMarkResolved }: PlotThreadCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-2">{plotThread.description}</h3>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <ImportanceBadge importance={plotThread.importance} />
            <StatusBadge status={plotThread.status} />
          </div>

          <p className="text-sm text-gray-600 mb-2">{plotThread.novelTitle}</p>

          <div className="text-sm text-gray-600">
            Ch {plotThread.introducedChapter} →{" "}
            {plotThread.resolvedChapter ? `Ch ${plotThread.resolvedChapter}` : "Active"}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(plotThread)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            {plotThread.status !== "resolved" && (
              <DropdownMenuItem onClick={() => onMarkResolved(plotThread)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Resolved
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onDelete(plotThread)} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
