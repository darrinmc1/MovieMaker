"use client"

import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

interface BulkActionBarProps {
  selectedCount: number
  onApprove: () => void
  onDelete: () => void
  onClear: () => void
}

export function BulkActionBar({ selectedCount, onApprove, onDelete, onClear }: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="sticky top-0 z-10 bg-indigo-50 border-b border-indigo-200 px-6 py-3 flex items-center gap-4">
      <span className="font-medium text-indigo-900">
        {selectedCount} comment{selectedCount !== 1 ? "s" : ""} selected
      </span>
      <Button size="sm" onClick={onApprove} className="bg-green-600 hover:bg-green-700 text-white">
        <Check className="w-4 h-4 mr-1" />
        Approve Selected
      </Button>
      <Button size="sm" variant="destructive" onClick={onDelete}>
        <X className="w-4 h-4 mr-1" />
        Delete Selected
      </Button>
      <button onClick={onClear} className="text-sm text-indigo-600 hover:text-indigo-800 underline ml-auto">
        Clear Selection
      </button>
    </div>
  )
}
