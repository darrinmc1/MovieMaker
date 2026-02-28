import { Badge } from "@/components/ui/badge"
import type { NovelStatus } from "@/types/novel"

interface StatusBadgeProps {
  status: NovelStatus
}

const statusConfig = {
  complete: {
    label: "Complete",
    className: "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20",
  },
  "on-hiatus": {
    label: "On Hiatus",
    className: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20",
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
