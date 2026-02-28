import { Badge } from "@/components/ui/badge"
import type { CommentStatus } from "@/types/comment"

interface StatusBadgeProps {
  status: CommentStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    pending: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
    approved: { label: "Approved", className: "bg-green-100 text-green-800 border-green-200" },
    flagged: { label: "Flagged", className: "bg-red-100 text-red-800 border-red-200" },
  }

  const variant = variants[status]

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  )
}
