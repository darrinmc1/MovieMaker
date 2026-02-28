"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Type } from "lucide-react"

type FontSize = "small" | "medium" | "large"

const fontSizeClasses = {
  small: "text-base",
  medium: "text-lg",
  large: "text-xl",
}

export function FontSizeControls() {
  const [fontSize, setFontSize] = useState<FontSize>("medium")

  useEffect(() => {
    const saved = localStorage.getItem("reading-font-size") as FontSize
    if (saved && fontSizeClasses[saved]) {
      setFontSize(saved)
    }
  }, [])

  const changeFontSize = (size: FontSize) => {
    setFontSize(size)
    localStorage.setItem("reading-font-size", size)

    // Apply to chapter content
    const content = document.querySelector("[data-chapter-content]")
    if (content) {
      content.classList.remove("text-base", "text-lg", "text-xl")
      content.classList.add(fontSizeClasses[size])
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Type className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-1 border border-border rounded-md">
        <Button
          variant={fontSize === "small" ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={() => changeFontSize("small")}
        >
          A-
        </Button>
        <Button
          variant={fontSize === "medium" ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-3 text-sm"
          onClick={() => changeFontSize("medium")}
        >
          A
        </Button>
        <Button
          variant={fontSize === "large" ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-3 text-base"
          onClick={() => changeFontSize("large")}
        >
          A+
        </Button>
      </div>
    </div>
  )
}
