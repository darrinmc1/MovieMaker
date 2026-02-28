export interface Character {
  id: string
  novelId: string
  novelTitle: string
  name: string
  role: "protagonist" | "antagonist" | "supporting" | "minor"
  description: string
  traits: string[]
  portraitUrl?: string
  firstAppearance: number // chapter number
  appearances: string // e.g., "Ch 1-15" or "Ch 2, 5, 8-12"
  status: "active" | "inactive"
  internalNotes?: string
  createdAt: Date
  updatedAt: Date
}

export interface CharacterFormData {
  novelId: string
  name: string
  role: "protagonist" | "antagonist" | "supporting" | "minor"
  description: string
  traits: string[]
  portraitUrl?: string
  firstAppearance: number
  status: "active" | "inactive"
  internalNotes?: string
}
