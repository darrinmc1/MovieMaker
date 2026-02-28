import { Badge } from "@/components/ui/badge"

interface RoleBadgeProps {
  role: "protagonist" | "antagonist" | "supporting" | "minor"
}

const roleConfig = {
  protagonist: { label: "Protagonist", className: "bg-purple-100 text-purple-700 hover:bg-purple-100" },
  antagonist: { label: "Antagonist", className: "bg-red-100 text-red-700 hover:bg-red-100" },
  supporting: { label: "Supporting", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  minor: { label: "Minor", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = roleConfig[role]
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  )
}
