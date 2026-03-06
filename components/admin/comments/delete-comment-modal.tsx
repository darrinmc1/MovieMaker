"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle } from "lucide-react"

interface DeleteCommentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  commentCount: number
  onConfirm: (blockIp: boolean) => void
}

export function DeleteCommentModal({ open, onOpenChange, commentCount, onConfirm }: DeleteCommentModalProps) {
  const [blockIp, setBlockIp] = useState(false)

  const handleConfirm = () => {
    onConfirm(blockIp)
    setBlockIp(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle>Delete {commentCount === 1 ? "Comment" : `${commentCount} Comments`}?</DialogTitle>
          </div>
          <DialogDescription>
            This action cannot be undone. {commentCount === 1 ? "This comment" : "These comments"} will be permanently
            removed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 py-4">
          <Checkbox id="block-ip" checked={blockIp} onCheckedChange={(checked) => setBlockIp(checked as boolean)} />
          <label
            htmlFor="block-ip"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Also block this commenter's IP
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
