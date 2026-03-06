"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { NovelStatus, SortOption } from "@/types/novel"

interface FilterBarProps {
  statusFilter: NovelStatus | "all"
  genreFilter: string
  sortBy: SortOption
  onStatusChange: (status: NovelStatus | "all") => void
  onGenreChange: (genre: string) => void
  onSortChange: (sort: SortOption) => void
}

export function FilterBar({
  statusFilter,
  genreFilter,
  sortBy,
  onStatusChange,
  onGenreChange,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="in-progress">In Progress</SelectItem>
          <SelectItem value="complete">Complete</SelectItem>
          <SelectItem value="on-hiatus">On Hiatus</SelectItem>
        </SelectContent>
      </Select>

      <Select value={genreFilter} onValueChange={onGenreChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Genres" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Genres</SelectItem>
          <SelectItem value="fantasy">Fantasy</SelectItem>
          <SelectItem value="sci-fi">Sci-Fi</SelectItem>
          <SelectItem value="romance">Romance</SelectItem>
          <SelectItem value="mystery">Mystery</SelectItem>
          <SelectItem value="thriller">Thriller</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="latest">Sort by: Latest</SelectItem>
          <SelectItem value="oldest">Sort by: Oldest</SelectItem>
          <SelectItem value="most-views">Sort by: Most Views</SelectItem>
          <SelectItem value="most-comments">Sort by: Most Comments</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
