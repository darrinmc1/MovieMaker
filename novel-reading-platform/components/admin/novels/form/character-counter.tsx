interface CharacterCounterProps {
  current: number
  max: number
  className?: string
}

export function CharacterCounter({ current, max, className = "" }: CharacterCounterProps) {
  const isOverLimit = current > max

  return (
    <div className={`text-xs ${isOverLimit ? "text-red-600" : "text-gray-500"} ${className}`}>
      {current}/{max} characters
    </div>
  )
}
