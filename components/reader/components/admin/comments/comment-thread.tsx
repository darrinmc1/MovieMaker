"use client"

import type { CommentReply } from "@/types/comment"
import { AuthorBadge } from "./author-badge"
import { formatDistanceToNow } from "date-fns"

interface CommentThreadProps {
  replies: CommentReply[]
}

export function CommentThread({ replies }: CommentThreadProps) {
  if (replies.length === 0) return null

  return (
    <div className="mt-3 space-y-3">
      {replies.map((reply) => (
        <div key={reply.id} className="pl-12 border-l-2 border-indigo-200 ml-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900">{reply.authorName}</span>
            {reply.isAuthor && <AuthorBadge />}
            <span className="text-xs text-gray-500">{formatDistanceToNow(reply.createdAt, { addSuffix: true })}</span>
          </div>
          <p className="text-sm text-gray-700 bg-indigo-50 p-3 rounded-lg">{reply.content}</p>
        </div>
      ))}
    </div>
  )
}
