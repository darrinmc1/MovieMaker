"use client"
import { Users, GitBranch, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Character {
  name: string
  role: "Protagonist" | "Supporting" | "Antagonist"
}

interface PlotThread {
  title: string
  status: "Active" | "Resolved" | "Pending"
}

interface ChapterSidebarMobileProps {
  characters: Character[]
  plotThreads: PlotThread[]
  commentCount: number
}

export function ChapterSidebarMobile({ characters, plotThreads, commentCount }: ChapterSidebarMobileProps) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border shadow-lg">
      <Tabs defaultValue="characters" className="w-full">
        <TabsList className="w-full grid grid-cols-3 rounded-none h-14">
          <TabsTrigger value="characters" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Characters</span>
            <Badge variant="secondary" className="ml-1">
              {characters.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="plots" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">Plots</span>
            <Badge variant="secondary" className="ml-1">
              {plotThreads.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Comments</span>
            <Badge variant="secondary" className="ml-1">
              {commentCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <div className="max-h-[50vh] overflow-y-auto">
          <TabsContent value="characters" className="m-0 p-4 space-y-2">
            <h3 className="font-semibold text-sm mb-3">Characters in This Chapter</h3>
            {characters.map((character) => (
              <div key={character.name} className="flex items-center gap-2">
                <Badge variant={character.role === "Protagonist" ? "default" : "secondary"} className="text-xs">
                  {character.role}
                </Badge>
                <span className="text-sm">{character.name}</span>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="plots" className="m-0 p-4 space-y-2">
            <h3 className="font-semibold text-sm mb-3">Plot Threads Referenced</h3>
            {plotThreads.map((thread) => (
              <div key={thread.title} className="text-sm text-muted-foreground">
                {thread.title}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="comments" className="m-0 p-4">
            <p className="text-sm text-muted-foreground text-center py-4">Scroll down to view and post comments</p>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
