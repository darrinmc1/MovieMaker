"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Settings, Menu, X, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function SidebarNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const isAdminSection = pathname.startsWith("/admin")

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-20 left-4 z-50 md:hidden text-white hover:bg-white/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r-2 border-purple-500/50 bg-transparent z-40 transition-transform duration-200",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <ScrollArea className="h-full py-6 px-4">
          <nav className="space-y-2">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-base font-bold transition-colors border-2",
                pathname === "/"
                  ? "bg-purple-500/30 text-white border-purple-400"
                  : "text-white hover:bg-purple-500/20 hover:text-white border-purple-500/30 hover:border-purple-400",
              )}
              onClick={() => setIsOpen(false)}
            >
              <Home className="h-5 w-5" />
              Home
            </Link>

            <div className="h-2" />

            <Link
              href="/books"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/books"
                  ? "bg-purple-500/30 text-white"
                  : "text-white/80 hover:bg-purple-500/20 hover:text-white",
              )}
              onClick={() => setIsOpen(false)}
            >
              <BookOpen className="h-4 w-4" />
              Books
            </Link>

            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-purple-500/30 text-white"
                  : "text-white/80 hover:bg-purple-500/20 hover:text-white",
              )}
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-4 w-4" />
              Admin
            </Link>

            {isAdminSection && pathname !== "/admin" && (
              <>
                <div className="h-4" />
                <Link
                  href="/admin"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium bg-purple-500/20 text-white hover:bg-purple-500/30 border-2 border-purple-400/50 hover:border-purple-400"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="h-4 w-4" />← Back to Admin
                </Link>
              </>
            )}
          </nav>
        </ScrollArea>
      </aside>
    </>
  )
}
