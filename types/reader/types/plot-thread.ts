export interface PlotThread {
  id: string
  novelId: string
  novelTitle: string
  description: string
  importance: "major" | "minor"
  status: "active" | "resolved" | "abandoned"
  introducedChapter: number
  resolvedChapter?: number
  relatedCharacterIds: string[]
  internalNotes?: string
  createdAt: Date
  updatedAt: Date
}

export interface PlotThreadFormData {
  novelId: string
  description: string
  importance: "major" | "minor"
  status: "active" | "resolved" | "abandoned"
  introducedChapter: number
  resolvedChapter?: number
  relatedCharacterIds: string[]
  internalNotes?: string
}
