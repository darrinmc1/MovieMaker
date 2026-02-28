import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CollapsibleSection } from "@/components/collapsible-section"
import { BookOpen } from "lucide-react"
import { notFound } from "next/navigation"
import { getNovelById } from "@/lib/novels-data"

export default async function NovelPage({ params }: { params: { id: string } }) {
  const novel = await getNovelById(params.id)

  if (!novel) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      <Header />
      <SidebarNav />

      <main className="md:ml-64 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="w-full md:w-48 shrink-0">
              <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                <img
                  src={
                    novel.coverImage ||
                    `/placeholder.svg?height=400&width=300&query=${encodeURIComponent(novel.title + " epic fantasy book cover") || "/placeholder.svg"}`
                  }
                  alt={`${novel.title} cover`}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold text-balance text-foreground dark:text-white">
                    {novel.title}
                  </h1>
                  <Badge variant="outline">{novel.genre}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Badge variant={novel.status === "Complete" ? "default" : "secondary"}>{novel.status}</Badge>
                {novel.progress.total > 0 && (
                  <span className="text-sm text-muted-foreground dark:text-gray-300">
                    Chapter {novel.progress.current} of {novel.progress.total}
                  </span>
                )}
              </div>

              {novel.description && <p className="text-muted-foreground leading-relaxed">{novel.description}</p>}
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="outline">Outline</TabsTrigger>
              <TabsTrigger value="characters">Characters</TabsTrigger>
              <TabsTrigger value="plot-threads">Plot Threads</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="chapters">Chapters</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {novel.description ? (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-3">About This Story</h2>
                    <p className="text-muted-foreground leading-relaxed">{novel.description}</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-3">About This Story</h2>
                    <p className="text-muted-foreground leading-relaxed italic">No description available yet.</p>
                  </CardContent>
                </Card>
              )}

              <CollapsibleSection title="World Bible" icon={<BookOpen className="h-4 w-4" />}>
                <p className="text-muted-foreground leading-relaxed italic">No world bible available yet.</p>
              </CollapsibleSection>
            </TabsContent>

            <TabsContent value="outline" className="space-y-6 mt-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Story Outline</h2>
                  {novel.outline ? (
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      {novel.outline.split("\n").map((line, i) => (
                        <p key={i} className="mb-2">
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No outline available yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="characters" className="mt-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground italic">No characters added yet.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plot-threads" className="space-y-6 mt-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground italic">No plot threads added yet.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Story Timeline</h2>
                  <p className="text-muted-foreground text-center italic">No timeline data available yet.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chapters" className="mt-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground italic">No chapters published yet.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
