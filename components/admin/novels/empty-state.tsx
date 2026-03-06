"use client"

import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  onCreateNovel: () => void
}

export function EmptyState({ onCreateNovel }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-indigo-500/10 p-6 mb-4">
        <BookOpen className="h-12 w-12 text-indigo-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No novels yet</h3>
      <p className="text-muted-foreground mb-6 text-center max-w-sm">
        Create your first novel to get started on your writing journey
      </p>
      <Button onClick={onCreateNovel} className="bg-indigo-600 hover:bg-indigo-700">
        <BookOpen className="h-4 w-4 mr-2" />
        Create Novel
      </Button>
    </div>
  )
}
