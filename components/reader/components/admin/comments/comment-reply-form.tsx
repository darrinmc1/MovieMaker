"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface CommentReplyFormProps {
  onSubmit: (content: string) => void
  onCancel: () => void
}

export function CommentReplyForm({ onSubmit, onCancel }: CommentReplyFormProps) {
  const [content, setContent] = useState("")
  const maxLength = 500

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content)
      setContent("")
    }
  }

  return (
    <div className="mt-3 pl-12 space-y-2">
      <label className="text-sm font-medium text-gray-700">Reply as Author</label>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
        placeholder="Write your reply..."
        rows={3}
        className="resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {content.length}/{maxLength}
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Post Reply
          </Button>
        </div>
      </div>
    </div>
  )
}
