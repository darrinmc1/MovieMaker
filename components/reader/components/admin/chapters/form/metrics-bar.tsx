"use client"

interface MetricsBarProps {
  wordCount: number
  characterCount: number
}

export function MetricsBar({ wordCount, characterCount }: MetricsBarProps) {
  const readingTime = Math.ceil(wordCount / 200)

  return (
    <div className="flex items-center gap-6 text-sm text-gray-600 pt-2 border-t">
      <div>
        <span className="font-medium">{wordCount.toLocaleString()}</span> words
      </div>
      <div>
        <span className="font-medium">{characterCount.toLocaleString()}</span> characters
      </div>
      <div>
        <span className="font-medium">{readingTime}</span> min read
      </div>
    </div>
  )
}
