"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { List } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"

interface TableOfContentsButtonProps {
  novelId: string
  currentChapter: number
  totalChapters: number
}

export function TableOfContentsButton({ novelId, currentChapter, totalChapters }: TableOfContentsButtonProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button size="lg" className="rounded-full shadow-lg h-14 w-14 p-0">
            <List className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Table of Contents</SheetTitle>
            <SheetDescription>Navigate to any chapter</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {Array.from({ length: totalChapters }, (_, i) => i + 1).map((chapter) => (
              <Link
                key={chapter}
                href={`/novel/${novelId}/chapter/${chapter}`}
                onClick={() => setIsOpen(false)}
                className={`block p-3 rounded-lg border transition-colors ${
                  chapter === currentChapter
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted border-border"
                }`}
              >
                <div className="font-semibold">Chapter {chapter}</div>
                <div className="text-sm opacity-80">
                  {chapter === currentChapter ? "Current Chapter" : "Click to read"}
                </div>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
