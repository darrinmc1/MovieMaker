"use client"

import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ViewToggle } from "./view-toggle"
import type { ViewMode } from "@/types/novel"

interface NovelsPageHeaderProps {
  searchQuery: string
  viewMode: ViewMode
  onSearchChange: (query: string) => void
  onViewModeChange: (mode: ViewMode) => void
  onCreateNovel: () => void
}

export function NovelsPageHeader({
  searchQuery,
  viewMode,
  onSearchChange,
  onViewModeChange,
  onCreateNovel,
}: NovelsPageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">My Novels</h1>
        <Button onClick={onCreateNovel} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          New Novel
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search novels..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <ViewToggle view={viewMode} onViewChange={onViewModeChange} />
      </div>
    </div>
  )
}
