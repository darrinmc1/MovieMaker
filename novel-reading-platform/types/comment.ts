export type CommentStatus = "pending" | "approved" | "flagged"

export interface Comment {
  id: string
  novelId: string
  novelTitle: string
  chapterId: string
  chapterNumber: number
  chapterTitle: string
  commenterName: string
  commenterEmail?: string
  commenterAvatar?: string
  commenterIp?: string
  content: string
  hasSpoilers: boolean
  status: CommentStatus
  flagCount: number
  flagReasons?: string[]
  createdAt: Date
  replies: CommentReply[]
}

export interface CommentReply {
  id: string
  content: string
  isAuthor: boolean
  authorName: string
  createdAt: Date
}

export interface CommenterHistory {
  name: string
  email?: string
  ip?: string
  totalComments: number
  firstComment: Date
  lastComment: Date
  comments: Comment[]
}
