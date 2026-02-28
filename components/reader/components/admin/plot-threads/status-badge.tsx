import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  status: "active" | "resolved" | "abandoned"
}

const statusConfig = {
  active: { label: "Active", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  resolved: { label: "Resolved", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  abandoned: { label: "Abandoned", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  )
}
