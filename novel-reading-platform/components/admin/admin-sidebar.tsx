"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  BookOpen,
  Plus,
  FileText,
  Users,
  Target,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
} from "lucide-react"
import { useState } from "react"

const navItems = [
  { icon: LayoutDashboard, label: "Admin Dashboard", href: "/admin" },
  { icon: BookOpen, label: "Novels", href: "/admin/novels" },
  { icon: Plus, label: "New Novel", href: "/admin/novels/new" },
  { icon: FileText, label: "Chapters", href: "/admin/chapters" },
  { icon: Users, label: "Characters", href: "/admin/characters" },
  { icon: Target, label: "Plot Threads", href: "/admin/plot-threads" },
  { icon: MessageSquare, label: "Comments", href: "/admin/comments" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r-2 border-purple-500/50 bg-transparent text-white transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-purple-500/30 px-6">
            <h1 className="text-xl font-bold">The Concord of Nine</h1>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium bg-purple-500/20 text-white hover:bg-purple-500/30 border-2 border-purple-400/50 hover:border-purple-400 mb-4"
              >
                <Home className="h-5 w-5" />← Back to Home
              </Link>

              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white transition-all hover:bg-purple-500/20",
                      isActive && "bg-purple-500/30 shadow-lg",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>

          {/* Logout */}
          <div className="border-t border-purple-500/30 p-3">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-white hover:bg-purple-500/20 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
