export interface NovelFormData {
  // Basic Info
  title: string
  author: string
  genre: string
  coverImage?: File | string
  description: string
  totalPlannedChapters?: number
  status: "draft" | "in-progress" | "complete" | "on-hiatus"

  // World Building
  setting: string
  toneAndStyle: string
  worldRules: string[]

  // Plot Structure
  act1: string
  act2: string
  act3: string
  themes: string
  outline?: string // Add outline field

  // Settings
  allowComments: boolean
  showViewCounts: boolean
  showChapterRatings: boolean
  matureContent: boolean
  visibility: "public" | "unlisted" | "private"
  emailOnComments: boolean
  weeklyAnalytics: boolean
  dailyDigest: boolean
}

export interface NovelFormErrors {
  title?: string
  author?: string
  genre?: string
  description?: string
  setting?: string
  toneAndStyle?: string
  outline?: string // Added outline field for validation errors
}
