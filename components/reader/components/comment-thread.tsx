"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, MessageCircle, Flag, ChevronDown, ChevronUp, Trash2, CheckCircle } from "lucide-react"
import { formatTimestamp } from "@/lib/format-timestamp"
import { SpoilerText } from "@/components/spoiler-text"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Comment {
  id: string
  author: string
  content: string
  timestamp: string
  isAuthor?: boolean
  replies?: Comment[]
  likes?: number
  isReviewed?: boolean
}

interface CommentThreadProps {
  comments: Comment[]
  isAdmin?: boolean
}

type SortOption = "newest" | "oldest" | "most-liked"

export function CommentThread({ comments: initialComments, isAdmin = false }: CommentThreadProps) {
  const [comments, setComments] = useState(initialComments)
  const [newComment, setNewComment] = useState("")
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!newComment.trim()) {
      setError("Comment cannot be empty")
      return
    }

    if (newComment.length > 500) {
      setError("Comment must be 500 characters or less")
      return
    }

    const comment: Comment = {
      id: Date.now().toString(),
      author: newName.trim() || "Anonymous",
      content: newComment,
      timestamp: new Date().toISOString(),
      isAuthor: false,
      likes: 0,
      replies: [],
      isReviewed: false,
    }

    setComments([...comments, comment])
    setNewComment("")
    setNewName("")
    setNewEmail("")
    setShowPreview(false)
  }

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter((c) => c.id !== commentId))
  }

  const handleMarkReviewed = (commentId: string) => {
    setComments(comments.map((c) => (c.id === commentId ? { ...c, isReviewed: !c.isReviewed } : c)))
  }

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    } else if (sortBy === "oldest") {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    } else {
      return (b.likes || 0) - (a.likes || 0)
    }
  })

  const processContent = (content: string) => {
    const parts = content.split(/(\[spoiler\].*?\[\/spoiler\])/g)
    return parts.map((part, idx) => {
      const spoilerMatch = part.match(/\[spoiler\](.*?)\[\/spoiler\]/)
      if (spoilerMatch) {
        return <SpoilerText key={idx}>{spoilerMatch[1]}</SpoilerText>
      }
      return <span key={idx}>{part}</span>
    })
  }

  const charCount = newComment.length
  const charLimit = 500

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Comments ({comments.length})</h2>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="most-liked">Most Liked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input placeholder="Your name (optional)" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input
                type="email"
                placeholder="Email (optional, for notifications only - never displayed)"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="text-sm"
              />
              <div className="space-y-2">
                {showPreview ? (
                  <Card className="bg-muted">
                    <CardContent className="p-3">
                      <p className="text-sm leading-relaxed">{processContent(newComment)}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Textarea
                    placeholder="Share your thoughts on this chapter... Use [spoiler]text[/spoiler] for spoilers"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    required
                    maxLength={500}
                  />
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className={charCount > charLimit ? "text-destructive" : "text-muted-foreground"}>
                    {charCount}/{charLimit} characters
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    disabled={!newComment.trim()}
                  >
                    {showPreview ? "Edit" : "Preview"}
                  </Button>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={charCount > charLimit}>
                Post Comment
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {sortedComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            processContent={processContent}
            isAdmin={isAdmin}
            onDelete={handleDeleteComment}
            onMarkReviewed={handleMarkReviewed}
          />
        ))}
      </div>
    </div>
  )
}

function CommentItem({
  comment,
  processContent,
  depth = 0,
  isAdmin = false,
  onDelete,
  onMarkReviewed,
}: {
  comment: Comment
  processContent: (content: string) => React.ReactNode
  depth?: number
  isAdmin?: boolean
  onDelete?: (id: string) => void
  onMarkReviewed?: (id: string) => void
}) {
  const [isLiked, setIsLiked] = useState(false)
  const [likes, setLikes] = useState(comment.likes || 0)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [replyName, setReplyName] = useState("")
  const [replies, setReplies] = useState(comment.replies || [])
  const [showReplies, setShowReplies] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const initials = comment.author
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const handleLike = () => {
    if (isLiked) {
      setLikes(likes - 1)
    } else {
      setLikes(likes + 1)
    }
    setIsLiked(!isLiked)
  }

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim()) return

    const newReply: Comment = {
      id: Date.now().toString(),
      author: replyName.trim() || "Anonymous",
      content: replyText,
      timestamp: new Date().toISOString(),
      likes: 0,
      replies: [],
      isReviewed: false,
    }

    setReplies([...replies, newReply])
    setReplyText("")
    setReplyName("")
    setShowReplyForm(false)
  }

  const canReply = depth < 3

  return (
    <>
      <Card className={comment.isReviewed ? "border-green-500/50" : ""}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{comment.author}</span>
                {comment.isAuthor && (
                  <Badge variant="default" className="text-xs">
                    Author
                  </Badge>
                )}
                {comment.isReviewed && (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                    Reviewed
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">{formatTimestamp(comment.timestamp)}</span>
              </div>
              <p className="text-sm leading-relaxed">{processContent(comment.content)}</p>

              <div className="flex items-center gap-4 pt-1">
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={handleLike}>
                  <Heart className={`h-3 w-3 ${isLiked ? "fill-current text-red-500" : ""}`} />
                  <span>{likes}</span>
                </Button>
                {canReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                  >
                    <MessageCircle className="h-3 w-3" />
                    Reply
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground">
                  <Flag className="h-3 w-3" />
                  Report
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs text-green-600 hover:text-green-700"
                      onClick={() => onMarkReviewed?.(comment.id)}
                    >
                      <CheckCircle className="h-3 w-3" />
                      {comment.isReviewed ? "Unmark" : "Mark Reviewed"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs text-destructive hover:text-destructive/90"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </>
                )}
              </div>

              {showReplyForm && (
                <Card className="mt-3 bg-muted/50">
                  <CardContent className="p-3">
                    <form onSubmit={handleReply} className="space-y-2">
                      <Input
                        placeholder="Your name (optional)"
                        value={replyName}
                        onChange={(e) => setReplyName(e.target.value)}
                        size={1}
                      />
                      <Textarea
                        placeholder="Write a reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        required
                        maxLength={500}
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">
                          Post Reply
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setShowReplyForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {replies.length > 0 && (
            <div className="ml-12 mt-4 space-y-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {replies.length} {replies.length === 1 ? "reply" : "replies"}
              </Button>
              {showReplies && (
                <div className="space-y-3 border-l-2 border-border pl-4">
                  {replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      processContent={processContent}
                      depth={depth + 1}
                      isAdmin={isAdmin}
                      onDelete={onDelete}
                      onMarkReviewed={onMarkReviewed}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this comment and all its replies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.(comment.id)
                setShowDeleteDialog(false)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
