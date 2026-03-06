import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle } from "lucide-react"

interface PlotThreadBadgeProps {
  title: string
  importance: "Major" | "Minor"
  status: "Active" | "Resolved"
  chapterIntroduced: number
}

export function PlotThreadBadge({ title, importance, status, chapterIntroduced }: PlotThreadBadgeProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
      <div className="shrink-0">
        {status === "Resolved" ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium text-sm">{title}</h4>
          <Badge variant={importance === "Major" ? "default" : "secondary"} className="text-xs">
            {importance}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Introduced in Chapter {chapterIntroduced}</p>
      </div>
    </div>
  )
}
