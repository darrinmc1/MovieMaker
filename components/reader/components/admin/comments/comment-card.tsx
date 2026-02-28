"use client"

import { useState } from "react"
import type { Comment } from "@/types/comment"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { StatusBadge } from "./status-badge"
import { CommentReplyForm } from "./comment-reply-form"
import { CommentThread } from "./comment-thread"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import {
  Check,
  X,
  MessageSquare,
  Flag,
  FlagOff,
  MoreVertical,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileText,
} from "lucide-react"

interface CommentCardProps {
  comment: Comment
  isSelected: boolean
  onSelect: (id: string) => void
  onApprove: (id: string) => void
  onDelete: (id: string) => void
  onFlag: (id: string) => void
  onRemoveFlag: (id: string) => void
  onReply: (id: string, content: string) => void
}

export function CommentCard({
  comment,
  isSelected,
  onSelect,
  onApprove,
  onDelete,
  onFlag,
  onRemoveFlag,
  onReply,
}: CommentCardProps) {
  const router = useRouter()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showFullContent, setShowFullContent] = useState(false)
  const [showReplies, setShowReplies] = useState(true)

  const borderColor = {
    pending: "border-l-amber-500",
    approved: "border-l-green-500",
    flagged: "border-l-red-500",
  }[comment.status]

  const truncatedContent = comment.content.length > 200 ? comment.content.slice(0, 200) + "..." : comment.content

  return (
    <div
      className={`bg-white border-l-4 ${borderColor} rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 ${
        isSelected ? "bg-indigo-50" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Checkbox checked={isSelected} onCheckedChange={() => onSelect(comment.id)} className="mt-1" />
        <Avatar className="w-10 h-10">
          <AvatarImage src={comment.commenterAvatar || "/placeholder.svg"} />
          <AvatarFallback className="bg-indigo-100 text-indigo-700">
            {comment.commenterName[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{comment.commenterName}</span>
            <span className="text-sm text-gray-500">{formatDistanceToNow(comment.createdAt, { addSuffix: true })}</span>
          </div>
        </div>
        <StatusBadge status={comment.status} />
      </div>

      {/* Chapter Reference */}
      <div className="text-sm text-gray-600 mb-2 pl-14">
        {comment.novelTitle} - Chapter {comment.chapterNumber}: {comment.chapterTitle}
      </div>

      {/* Comment Content */}
      <div className="pl-14 mb-3">
        <p className="text-gray-800 whitespace-pre-wrap">{showFullContent ? comment.content : truncatedContent}</p>
        {comment.content.length > 200 && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-sm text-indigo-600 hover:text-indigo-800 mt-1"
          >
            {showFullContent ? "Show less" : "Read more"}
          </button>
        )}
        {comment.hasSpoilers && (
          <div className="flex items-center gap-1 text-amber-600 text-sm mt-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Contains spoilers</span>
          </div>
        )}
      </div>

      {/* Flagged Warning */}
      {comment.status === "flagged" && comment.flagReasons && (
        <div className="pl-14 mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          <div className="flex items-center gap-1">
            <Flag className="w-4 h-4" />
            <span className="font-medium">
              Flagged by {comment.flagCount} user{comment.flagCount !== 1 ? "s" : ""}
            </span>
          </div>
          <span className="text-red-700">Reason: {comment.flagReasons.join(", ")}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pl-14 flex-wrap">
        {comment.status === "pending" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onApprove(comment.id)}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <Check className="w-4 h-4 mr-1" />
            Approve
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(comment.id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="w-4 h-4 mr-1" />
          Delete
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowReplyForm(!showReplyForm)}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <MessageSquare className="w-4 w-4 mr-1" />
          Reply
        </Button>
        {comment.status === "flagged" ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemoveFlag(comment.id)}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          >
            <FlagOff className="w-4 h-4 mr-1" />
            Remove Flag
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onFlag(comment.id)}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          >
            <Flag className="w-4 h-4 mr-1" />
            Flag
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="text-gray-600">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/admin/chapters?novel=${encodeURIComponent(comment.novelTitle)}`)}
            >
              <FileText className="w-4 h-4 mr-2" />
              View Chapter
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/admin/novels?search=${encodeURIComponent(comment.novelTitle)}`)}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              View Novel
            </DropdownMenuItem>
            <DropdownMenuItem>View Commenter History</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Mark as Spam</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {comment.replies.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowReplies(!showReplies)}
            className="ml-auto text-gray-600"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
            {showReplies ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>
        )}
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <CommentReplyForm
          onSubmit={(content) => {
            onReply(comment.id, content)
            setShowReplyForm(false)
          }}
          onCancel={() => setShowReplyForm(false)}
        />
      )}

      {/* Replies Thread */}
      {showReplies && <CommentThread replies={comment.replies} />}
    </div>
  )
}
