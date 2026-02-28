export interface ChapterFormData {
  novelId: string
  chapterNumber: number
  title: string
  content: string
  summary: string
  directorsNotes?: string
  plotSpoilers?: string
  publicationDate: Date
  scheduleForFuture: boolean
  publicationTime?: string
  characters: string[]
  plotThreads: {
    id: string
    progression: "introduced" | "advanced" | "resolved" | "referenced"
  }[]
  status: "draft" | "published"
}

export interface Character {
  id: string
  name: string
  role: "protagonist" | "antagonist" | "supporting"
  avatar?: string
}

export interface PlotThread {
  id: string
  description: string
  status: "active" | "resolved"
  importance: "major" | "minor"
}

export interface Novel {
  id: string
  title: string
  coverImage?: string
  lastChapterNumber: number
}
