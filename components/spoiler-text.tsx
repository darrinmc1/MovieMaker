"use client"

import { useState } from "react"

interface SpoilerTextProps {
  children: string
}

export function SpoilerText({ children }: SpoilerTextProps) {
  const [isRevealed, setIsRevealed] = useState(false)

  return (
    <span
      className={`${
        isRevealed ? "bg-transparent" : "bg-foreground text-transparent select-none blur-sm"
      } cursor-pointer transition-all duration-200 px-1 rounded`}
      onClick={() => setIsRevealed(true)}
      title={isRevealed ? "" : "Click to reveal spoiler"}
    >
      {children}
    </span>
  )
}
