import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityItemProps {
  icon: LucideIcon
  iconColor: string
  description: string
  timestamp: string
}

export function ActivityItem({ icon: Icon, iconColor, description, timestamp }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 py-3">
      <div className={cn("rounded-full p-2", iconColor)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm">{description}</p>
        <p className="text-xs text-muted-foreground">{timestamp}</p>
      </div>
    </div>
  )
}
