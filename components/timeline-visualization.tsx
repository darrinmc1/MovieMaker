"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

interface TimelineChapter {
  number: number
  title: string
  plotThreads: string[]
  characters: string[]
}

interface TimelineVisualizationProps {
  chapters: TimelineChapter[]
  novelId: string
}

export function TimelineVisualization({ chapters, novelId }: TimelineVisualizationProps) {
  const allPlotThreads = Array.from(new Set(chapters.flatMap((ch) => ch.plotThreads)))

  const plotColors = ["bg-primary", "bg-amber-500", "bg-emerald-500", "bg-rose-500", "bg-violet-500", "bg-cyan-500"]

  return (
    <div className="space-y-8">
      {/* Desktop: Horizontal Timeline */}
      <div className="hidden lg:block">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute top-12 left-0 right-0 h-0.5 bg-border" />

          {/* Plot thread bars */}
          <div className="mb-8 space-y-2">
            {allPlotThreads.map((thread, idx) => (
              <div key={thread} className="flex items-center gap-3">
                <div className="w-32 text-xs font-medium truncate">{thread}</div>
                <div className="flex-1 relative h-6">
                  {chapters.map((chapter) => {
                    const hasThread = chapter.plotThreads.includes(thread)
                    return (
                      <div
                        key={chapter.number}
                        className={`absolute h-full ${
                          hasThread ? plotColors[idx % plotColors.length] : "bg-transparent"
                        } transition-opacity hover:opacity-80`}
                        style={{
                          left: `${((chapter.number - 1) / chapters.length) * 100}%`,
                          width: `${100 / chapters.length}%`,
                        }}
                        title={hasThread ? `${thread} in Chapter ${chapter.number}` : ""}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Chapter markers */}
          <div className="relative flex justify-between pt-8">
            {chapters.map((chapter) => (
              <a
                key={chapter.number}
                href={`/novel/${novelId}/chapter/${chapter.number}`}
                className="group flex flex-col items-center"
              >
                <div className="relative z-10 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold group-hover:scale-110 transition-transform">
                  {chapter.number}
                </div>
                <div className="mt-2 text-xs text-center max-w-20">
                  <div className="font-medium truncate group-hover:text-primary transition-colors">
                    Ch {chapter.number}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1 text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{chapter.characters.length}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: Vertical Timeline */}
      <div className="lg:hidden space-y-4">
        {chapters.map((chapter) => (
          <a key={chapter.number} href={`/novel/${novelId}/chapter/${chapter.number}`} className="block">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {chapter.number}
                    </div>
                    {chapter.number < chapters.length && <div className="flex-1 w-0.5 bg-border mt-2" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-4">
                    <h4 className="font-semibold mb-2">Chapter {chapter.number}</h4>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {chapter.plotThreads.map((thread, idx) => (
                          <Badge
                            key={thread}
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: `hsl(var(--primary) / ${0.2 + idx * 0.1})`,
                            }}
                          >
                            {thread}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{chapter.characters.length} characters</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}
