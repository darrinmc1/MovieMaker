interface ProgressBarProps {
  current: number
  total: number
  showLabel?: boolean
}

export function ProgressBar({ current, total, showLabel = true }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="text-sm text-muted-foreground">
          {current} of {total} chapters
        </div>
      )}
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
