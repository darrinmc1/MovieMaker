import { Badge } from "@/components/ui/badge"

interface ImportanceBadgeProps {
  importance: "major" | "minor"
}

export function ImportanceBadge({ importance }: ImportanceBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={
        importance === "major"
          ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-100"
          : "bg-gray-100 text-gray-700 hover:bg-gray-100"
      }
    >
      {importance === "major" ? "Major" : "Minor"}
    </Badge>
  )
}
