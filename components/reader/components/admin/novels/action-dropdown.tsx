"use client"

import { MoreVertical, Edit, Eye, Trash2, BookOpen, Users, GitBranch } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface ActionDropdownProps {
  novelId: string
  novelTitle: string
  onEdit: () => void
  onView: () => void
  onDelete: () => void
}

export function ActionDropdown({ novelId, novelTitle, onEdit, onView, onDelete }: ActionDropdownProps) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Novel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onView}>
          <Eye className="h-4 w-4 mr-2" />
          View Public
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(`/admin/chapters/new?novel=${novelId}`)}>
          <BookOpen className="h-4 w-4 mr-2" />
          Add Chapter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/admin/characters?novel=${encodeURIComponent(novelTitle)}`)}>
          <Users className="h-4 w-4 mr-2" />
          Manage Characters
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/admin/plot-threads?novel=${encodeURIComponent(novelTitle)}`)}>
          <GitBranch className="h-4 w-4 mr-2" />
          Manage Plot Threads
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-red-600">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
