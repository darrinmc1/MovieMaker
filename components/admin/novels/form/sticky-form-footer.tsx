"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface StickyFormFooterProps {
  onCancel: () => void
  onSaveDraft: () => void
  onPublish: () => void
  isLoading?: boolean
  disabled?: boolean
}

export function StickyFormFooter({
  onCancel,
  onSaveDraft,
  onPublish,
  isLoading = false,
  disabled = false,
}: StickyFormFooterProps) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onSaveDraft} disabled={isLoading || disabled}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
          <Button
            type="button"
            onClick={onPublish}
            disabled={isLoading || disabled}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              "Publish Novel"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
