"use client"

import { useEffect, useRef } from "react"

interface ReadingProgressTrackerProps {
  novelId: string
  chapterId: string
  chapterNumber: number
}

export function ReadingProgressTracker({ novelId, chapterId, chapterNumber }: ReadingProgressTrackerProps) {
  const lastSavedProgress = useRef({ scroll: 0, percentage: 0 })
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const saveProgress = async (scrollPosition: number, progressPercentage: number) => {
      // Only save if progress has changed significantly (more than 5%)
      if (
        Math.abs(progressPercentage - lastSavedProgress.current.percentage) < 5 &&
        Math.abs(scrollPosition - lastSavedProgress.current.scroll) < 100
      ) {
        return
      }

      try {
        const response = await fetch("/api/reading-progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            novelId,
            chapterId,
            chapterNumber,
            scrollPosition,
            progressPercentage: Math.round(progressPercentage),
          }),
        })

        if (response.ok) {
          lastSavedProgress.current = { scroll: scrollPosition, percentage: progressPercentage }
          console.log("[v0] Reading progress saved:", { scrollPosition, progressPercentage })
        }
      } catch (error) {
        console.error("[v0] Failed to save reading progress:", error)
      }
    }

    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight - windowHeight
      const scrolled = window.scrollY
      const progress = (scrolled / documentHeight) * 100

      // Debounce the save operation
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveProgress(scrolled, Math.min(progress, 100))
      }, 2000) // Save 2 seconds after user stops scrolling
    }

    // Save progress when user leaves the page
    const handleBeforeUnload = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight - windowHeight
      const scrolled = window.scrollY
      const progress = (scrolled / documentHeight) * 100

      // Use sendBeacon for reliable tracking on page unload
      const data = JSON.stringify({
        novelId,
        chapterId,
        chapterNumber,
        scrollPosition: scrolled,
        progressPercentage: Math.round(Math.min(progress, 100)),
      })

      navigator.sendBeacon("/api/reading-progress", data)
    }

    window.addEventListener("scroll", handleScroll)
    window.addEventListener("beforeunload", handleBeforeUnload)

    // Save initial progress on mount
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [novelId, chapterId, chapterNumber])

  return null // This component doesn't render anything
}
