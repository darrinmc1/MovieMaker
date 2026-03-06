"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, ArrowRight, LogIn } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ReadingProgress {
  id: string
  novel_id: string
  chapter_id: string
  chapter_number: number
  progress_percentage: number
  last_read_at: string
  novels: {
    id: string
    title: string
    cover_image: string
    genre: string
  }
  chapters: {
    id: string
    chapter_number: number
    title: string
  }
}

export function ContinueReadingSection() {
  const [readingProgress, setReadingProgress] = useState<ReadingProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuthAndFetchProgress = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }

        setIsAuthenticated(true)

        const response = await fetch("/api/reading-progress")
        if (response.ok) {
          const { data } = await response.json()
          setReadingProgress(data || [])
        }
      } catch (error) {
        console.error("[v0] Failed to fetch reading progress:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthAndFetchProgress()
  }, [])

  if (isLoading) {
    return (
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Continue Reading</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse border-purple-500/20">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded-lg mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    )
  }

  if (!isAuthenticated) {
    return (
      <section className="mb-16 animate-in fade-in duration-500">
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-red-500/5">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-red-500 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Track Your Reading Progress</h3>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                Sign in to automatically save your place and pick up right where you left off across all your devices.
              </p>
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/auth/login">
                <Button className="bg-gradient-to-r from-purple-500 to-red-500 hover:from-purple-600 hover:to-red-600">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button variant="outline" className="border-purple-500/20 bg-transparent">
                  Create Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    )
  }

  if (readingProgress.length === 0) {
    return null
  }

  return (
    <section className="mb-16 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="h-6 w-6 text-purple-400" />
        <h2 className="text-2xl font-bold">Continue Reading</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {readingProgress.slice(0, 3).map((progress, index) => (
          <Card
            key={progress.id}
            className="group hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4 border-purple-500/20"
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
          >
            <CardContent className="p-0">
              <div className="relative aspect-[3/2] overflow-hidden rounded-t-lg">
                <img
                  src={
                    progress.novels.cover_image ||
                    `/placeholder.svg?height=300&width=450&query=${encodeURIComponent(progress.novels.title + " book cover") || "/placeholder.svg"}`
                  }
                  alt={progress.novels.title}
                  className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Badge className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-red-500 border-0">
                  {progress.progress_percentage}% Complete
                </Badge>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-purple-400 transition-colors">
                    {progress.novels.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Chapter {progress.chapter_number}: {progress.chapters.title}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Last read {formatTimeAgo(progress.last_read_at)}</span>
                </div>

                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-red-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progress.progress_percentage}%` }}
                  />
                </div>

                <Link href={`/novel/${progress.novel_id}/chapter/${progress.chapter_number}`}>
                  <Button className="w-full group/btn bg-gradient-to-r from-purple-500 to-red-500 hover:from-purple-600 hover:to-red-600">
                    Continue Reading
                    <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`
  return `${Math.floor(diffInSeconds / 2592000)} months ago`
}
