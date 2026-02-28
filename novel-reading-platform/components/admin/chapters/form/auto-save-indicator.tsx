"use client"

import { CheckCircle2, Loader2 } from "lucide-react"

interface AutoSaveIndicatorProps {
  status: "saved" | "saving" | "idle"
  lastSaved?: Date
}

export function AutoSaveIndicator({ status, lastSaved }: AutoSaveIndicatorProps) {
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes === 1) return "1 min ago"
    return `${minutes} min ago`
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {status === "saving" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          <span className="text-gray-600">Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-gray-600">All changes saved</span>
        </>
      )}
      {status === "idle" && lastSaved && <span className="text-gray-500">Last saved {getTimeAgo(lastSaved)}</span>}
    </div>
  )
}
