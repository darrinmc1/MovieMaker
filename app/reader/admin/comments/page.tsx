"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import type { Comment } from "@/types/comment"
import { CommentCard } from "@/components/admin/comments/comment-card"
import { BulkActionBar } from "@/components/admin/comments/bulk-action-bar"
import { CommentsEmptyState } from "@/components/admin/comments/comments-empty-state"
import { DeleteCommentModal } from "@/components/admin/comments/delete-comment-modal"
import { useToast } from "@/hooks/use-toast"

const mockComments: Comment[] = []

export default function CommentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedNovel, setSelectedNovel] = useState("all")
  const [selectedChapter, setSelectedChapter] = useState("all")
  const [dateRange, setDateRange] = useState("7days")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedComments, setSelectedComments] = useState<string[]>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const { toast } = useToast()

  // Filter comments based on tab
  const filteredComments = mockComments.filter((comment) => {
    if (activeTab === "all") return true
    return comment.status === activeTab
  })

  // Count comments by status
  const counts = {
    all: mockComments.length,
    pending: mockComments.filter((c) => c.status === "pending").length,
    approved: mockComments.filter((c) => c.status === "approved").length,
    flagged: mockComments.filter((c) => c.status === "flagged").length,
  }

  const handleSelectComment = (id: string) => {
    setSelectedComments((prev) => (prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]))
  }

  const handleApprove = (id: string) => {
    toast({
      title: "Comment approved",
      description: "The comment has been approved successfully.",
    })
  }

  const handleBulkApprove = () => {
    toast({
      title: `${selectedComments.length} comments approved`,
      description: "The selected comments have been approved successfully.",
    })
    setSelectedComments([])
  }

  const handleDelete = (id: string) => {
    setSelectedComments([id])
    setDeleteModalOpen(true)
  }

  const handleBulkDelete = () => {
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = (blockIp: boolean) => {
    toast({
      title: `${selectedComments.length} comment${selectedComments.length !== 1 ? "s" : ""} deleted`,
      description: blockIp ? "IP address has been blocked." : "Comments have been removed.",
    })
    setSelectedComments([])
  }

  const handleFlag = (id: string) => {
    toast({
      title: "Comment flagged",
      description: "The comment has been flagged for review.",
    })
  }

  const handleRemoveFlag = (id: string) => {
    toast({
      title: "Flag removed",
      description: "The flag has been removed from the comment.",
    })
  }

  const handleReply = (id: string, content: string) => {
    toast({
      title: "Reply posted",
      description: "Your reply has been posted successfully.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Comments</h1>
        <p className="text-gray-600 mt-1">Moderate and respond to reader comments</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedNovel} onValueChange={setSelectedNovel}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Novels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Novels</SelectItem>
            <SelectItem value="1">Oath of Flame</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedChapter} onValueChange={setSelectedChapter} disabled={selectedNovel === "all"}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Chapters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chapters</SelectItem>
            <SelectItem value="ch1">Chapter 1</SelectItem>
            <SelectItem value="ch2">Chapter 2</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionBar
        selectedCount={selectedComments.length}
        onApprove={handleBulkApprove}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedComments([])}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="relative">
            All
            <Badge variant="secondary" className="ml-2">
              {counts.all}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending
            <Badge variant="secondary" className={counts.pending > 0 ? "ml-2 bg-amber-100 text-amber-800" : "ml-2"}>
              {counts.pending}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="relative">
            Approved
            <Badge variant="secondary" className="ml-2">
              {counts.approved}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="flagged" className="relative">
            Flagged
            <Badge variant="secondary" className={counts.flagged > 0 ? "ml-2 bg-red-100 text-red-800" : "ml-2"}>
              {counts.flagged}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {filteredComments.length === 0 ? (
            <CommentsEmptyState type="all" />
          ) : (
            filteredComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                isSelected={selectedComments.includes(comment.id)}
                onSelect={handleSelectComment}
                onApprove={handleApprove}
                onDelete={handleDelete}
                onFlag={handleFlag}
                onRemoveFlag={handleRemoveFlag}
                onReply={handleReply}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {filteredComments.length === 0 ? (
            <CommentsEmptyState type="pending" />
          ) : (
            filteredComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                isSelected={selectedComments.includes(comment.id)}
                onSelect={handleSelectComment}
                onApprove={handleApprove}
                onDelete={handleDelete}
                onFlag={handleFlag}
                onRemoveFlag={handleRemoveFlag}
                onReply={handleReply}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-6">
          {filteredComments.length === 0 ? (
            <CommentsEmptyState type="approved" />
          ) : (
            filteredComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                isSelected={selectedComments.includes(comment.id)}
                onSelect={handleSelectComment}
                onApprove={handleApprove}
                onDelete={handleDelete}
                onFlag={handleFlag}
                onRemoveFlag={handleRemoveFlag}
                onReply={handleReply}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4 mt-6">
          {filteredComments.length === 0 ? (
            <CommentsEmptyState type="flagged" />
          ) : (
            filteredComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                isSelected={selectedComments.includes(comment.id)}
                onSelect={handleSelectComment}
                onApprove={handleApprove}
                onDelete={handleDelete}
                onFlag={handleFlag}
                onRemoveFlag={handleRemoveFlag}
                onReply={handleReply}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Modal */}
      <DeleteCommentModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        commentCount={selectedComments.length}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
