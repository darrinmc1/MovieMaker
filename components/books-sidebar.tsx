"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Home, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import { cn } from "@/lib/utils"

const novels = [
  { id: "oath-of-flame", title: "Oath of Flame" },
  { id: "depthspire", title: "Depthspire" },
  { id: "crownless", title: "Crownless" },
  { id: "mimic-hollow", title: "Mimic Hollow" },
  { id: "moonveil", title: "Moonveil" },
  { id: "relics-of-chance", title: "Relics of Chance" },
  { id: "arcana", title: "Arcana" },
  { id: "ironmarch-pact", title: "The Ironmarch Pact" },
  { id: "wyrmspires-wake", title: "Wyrmspire's Wake" },
  { id: "initiate-the-end", title: "Initiate the End" },
]

export function SidebarNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-20 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-border bg-background z-40 transition-transform duration-200",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <ScrollArea className="h-full py-6 px-4">
          <nav className="space-y-6">
            {/* Home link */}
            <div>
              <Link
                href="/"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === "/"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                onClick={() => setIsOpen(false)}
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
            </div>

            {/* Books section */}
            <div>
              <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                The Concord of Nine
              </h3>
              <div className="space-y-1">
                {novels.map((novel) => (
                  <Link
                    key={novel.id}
                    href={`/novel/${novel.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      pathname === `/novel/${novel.id}`
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span className="truncate">{novel.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </ScrollArea>
      </aside>
    </>
  )
}
