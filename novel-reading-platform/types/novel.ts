export interface Novel {
  id: string
  title: string
  coverUrl?: string
  genre: string
  status: "complete" | "in-progress" | "on-hiatus"
  totalChapters: number
  publishedChapters: number
  views: number
  comments: number
  lastUpdated: Date
}

export type NovelStatus = Novel["status"]
export type ViewMode = "list" | "grid"
export type SortOption = "latest" | "oldest" | "most-views" | "most-comments"

export interface NovelData {
  id: string
  title: string
  genre: string
  progress: { current: number; total: number }
  status: "In Progress" | "Not Started" | "Complete"
  description?: string
  author?: string
  coverImage?: string
  setting?: string
  toneAndStyle?: string
  worldRules?: string[]
  act1?: string
  act2?: string
  act3?: string
  themes?: string
  outline?: string
  bookNumber?: number
}
