import { Header } from "@/components/header"
import { ChapterNavigation } from "@/components/chapter-navigation"
import { CollapsibleSection } from "@/components/collapsible-section"
import { CommentThread } from "@/components/comment-thread"
import { ReadingProgressBar } from "@/components/reading-progress-bar"
import { ReadingProgressTracker } from "@/components/reading-progress-tracker"
import { FontSizeControls } from "@/components/font-size-controls"
import { ShareButton } from "@/components/share-button"
import { TableOfContentsButton } from "@/components/table-of-contents-button"
import { ChapterSidebarMobile } from "@/components/chapter-sidebar-mobile"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, AlertTriangle, Users, GitBranch, Clock, FileEdit } from "lucide-react"
import { notFound } from "next/navigation"
import { existsSync, readFileSync } from "fs"
import path from "path"
import Image from "next/image"

import { ApplyReviewButton } from "@/components/ApplyReviewButton"

// ── Load real act files from pipeline ────────────────────────────────────────
function loadChapterActs(chapterNum: number): { act: number; text: string }[] {
  const pipelineDir = process.env.PIPELINE_FOLDER || path.join(process.cwd(), 'pipeline')
  const actsDir = path.join(pipelineDir, 'acts')
  const acts: { act: number; text: string }[] = []

  for (let a = 1; a <= 10; a++) {
    const filePath = path.join(actsDir, `Ch${chapterNum}_Act${a}.txt`)
    if (!existsSync(filePath)) break
    acts.push({ act: a, text: readFileSync(filePath, 'utf-8') })
  }
  return acts
}

// ── Load suggestions for chapter ─────────────────────────────────────────────
function loadChapterSuggestions(chapterNum: number): any[] {
  const decisionsDir = process.env.DECISIONS_FOLDER || path.join(process.cwd(), 'pipeline', 'review_decisions')
  const possiblePaths = [
    path.join(decisionsDir, `chapter_${String(chapterNum).padStart(2, '0')}_decisions.json`),
    path.join(decisionsDir, `ch${chapterNum}_decisions.json`)
  ]

  for (const p of possiblePaths) {
    if (existsSync(p)) {
      try {
        const data = JSON.parse(readFileSync(p, 'utf-8'))
        // Normalize schema — some use 'suggestions' top level, some use 'actBreakdown[].suggestions'
        if (data.suggestions) return data.suggestions.map((s: any) => ({
          suggestionId: s.id || s.suggestionId,
          original: s.original,
          replacement: s.suggested || s.replacement,
          reason: s.reason,
          status: 'accepted'
        }))

        // Fallback: collect from acts
        if (data.actBreakdown) {
          return data.actBreakdown.flatMap((a: any) => a.suggestions || []).map((s: any) => ({
            suggestionId: s.suggestionId || s.id,
            original: s.original,
            replacement: s.replacement || s.suggested,
            reason: s.reason,
            status: 'accepted'
          }))
        }
      } catch (e) {
        console.error("Error reading suggestions:", e)
      }
    }
  }
  return []
}

// ── Load scene images for chapter from book1_scenes.json ─────────────────────
function loadActImages(chapterNum: number): Record<number, string> {
  const pipelineDir = process.env.PIPELINE_FOLDER || path.join(process.cwd(), 'pipeline')
  const scenesFile = path.join(pipelineDir, 'data', 'book1_scenes.json')

  if (!existsSync(scenesFile)) return {}

  const scenes: any[] = JSON.parse(readFileSync(scenesFile, 'utf-8'))
  const actImages: Record<number, string> = {}

  for (const scene of scenes) {
    if (scene.chapter === chapterNum && scene.image_path) {
      const act = scene.act as number
      if (!actImages[act]) {
        // Use the relative path for the public folder if possible, or the API route
        // Assuming images are generating into data/images/chapter_XX/act_XX/
        const filename = path.basename(scene.image_path)
        const chapterStr = String(chapterNum).padStart(2, '0')
        const actStr = String(act).padStart(2, '0')
        actImages[act] = `/api/chapters/image-file?path=${encodeURIComponent(scene.image_path)}`
      }
    }
  }
  return actImages
}

const mockChaptersData: Record<string, any[]> = {
  "vbook-book1": [
    {
      number: 1,
      title: "The Dragon's Last Breath",
      wordCount: 3500,
      publishedDate: "Mar 1, 2024",
      directorsNotes: "The beginning of Caelin's journey.",
      plotSpoilers: "He finds a dragon scale.",
      revisionNotes: "Added more grit.",
      content: "Chapter 1 content...",
      charactersInChapter: [{ name: "Caelin", role: "Protagonist" }],
      plotThreadsReferenced: [{ title: "The Seal", status: "Active" }],
      comments: []
    }
  ]
}

export default function ChapterPage({ params }: { params: { id: string; chapter: string } }) {
  const novelId = params.id
  const chapterNumber = Number.parseInt(params.chapter)

  // Try to load real act files first
  const realActs = loadChapterActs(chapterNumber)
  const actImages = loadActImages(chapterNumber)
  const suggestions = loadChapterSuggestions(chapterNumber)
  const hasRealContent = realActs.length > 0

  // Fall back to mock data if no real acts found
  const novelChapters = mockChaptersData[novelId as keyof typeof mockChaptersData]
  const chapterData = novelChapters?.find((ch) => ch.number === chapterNumber)

  // If no real content AND no mock data, 404
  if (!hasRealContent && !chapterData) {
    notFound()
  }

  const wordCount = hasRealContent
    ? realActs.reduce((sum, a) => sum + a.text.split(/\s+/).length, 0)
    : chapterData!.wordCount

  const estimatedMinutes = Math.ceil(wordCount / 200)
  const isAdmin = true
  const totalChapters = 12
  const chapterId = `${novelId}-chapter-${chapterNumber}`
  const chapterTitle = hasRealContent ? `Chapter ${chapterNumber}` : `Chapter ${chapterData!.number}: ${chapterData!.title}`

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <ReadingProgressBar />
      <ReadingProgressTracker novelId={novelId} chapterId={chapterId} chapterNumber={chapterNumber} />
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <ChapterNavigation novelId={novelId} currentChapter={chapterNumber} totalChapters={totalChapters} />

          <div className="space-y-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {chapterTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <span>{wordCount.toLocaleString()} words</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{estimatedMinutes} min read</span>
                </div>
                <span>•</span>
                {chapterData && <span>{chapterData.publishedDate}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <FontSizeControls />
                <ShareButton novelId={novelId} chapterNumber={chapterNumber} chapterTitle={chapterTitle} />
                <ApplyReviewButton chapterNum={chapterNumber} chapterTitle={chapterTitle} suggestions={suggestions} />
              </div>
            </div>

            {chapterData && (
              <div className="space-y-4">
                <CollapsibleSection title="📝 Director's Notes" icon={<Lightbulb className="h-4 w-4" />}>
                  <p className="text-muted-foreground leading-relaxed">{chapterData.directorsNotes}</p>
                </CollapsibleSection>

                {chapterData.revisionNotes && (
                  <CollapsibleSection title="✏️ Revision Notes" icon={<FileEdit className="h-4 w-4" />}>
                    <p className="text-muted-foreground leading-relaxed">{chapterData.revisionNotes}</p>
                  </CollapsibleSection>
                )}

                <CollapsibleSection
                  title="⚠️ Plot Spoilers - Read After Chapter"
                  icon={<AlertTriangle className="h-4 w-4" />}
                  variant="warning"
                  requireConfirmation={true}
                >
                  <p className="text-muted-foreground leading-relaxed">{chapterData.plotSpoilers}</p>
                </CollapsibleSection>
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <article className="flex-1 min-w-0 space-y-8">
              {hasRealContent ? (
                // Real act files — one card per act with image at top
                realActs.map(({ act, text }) => (
                  <Card key={act}>
                    <CardContent className="p-0 overflow-hidden" data-chapter-content>
                      {/* Act image — shown if available */}
                      {actImages[act] && (
                        <div className="relative w-full aspect-video">
                          <Image
                            src={actImages[act]}
                            alt={`Chapter ${chapterNumber} Act ${act}`}
                            fill
                            className="object-cover"
                            priority={act === 1}
                          />
                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent" />
                        </div>
                      )}
                      <div className="p-8 md:p-12">
                        <h2 className="text-lg font-semibold text-muted-foreground mb-6 uppercase tracking-widest">
                          Act {act}
                        </h2>
                        <div className="prose prose-lg max-w-none font-serif leading-relaxed">
                          {text.split("\n\n").filter(Boolean).map((paragraph: string, index: number) => (
                            <p key={index} className="mb-6 text-pretty">
                              {paragraph.trim()}
                            </p>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                // Fallback mock content
                <Card>
                  <CardContent className="p-8 md:p-12" data-chapter-content>
                    <div className="prose prose-lg max-w-none font-serif leading-relaxed">
                      {chapterData!.content.split("\n\n").map((paragraph: string, index: number) => (
                        <p key={index} className="mb-6 text-pretty">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </article>

            <aside className="hidden lg:block lg:w-80 shrink-0 space-y-4">
              {chapterData && (
                <Card className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">Characters in This Chapter</h3>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {chapterData.charactersInChapter.length}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {chapterData.charactersInChapter.map((character: any) => (
                          <div key={character.name} className="flex items-center gap-2">
                            <Badge
                              variant={character.role === "Protagonist" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {character.role}
                            </Badge>
                            <span className="text-sm">{character.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">Plot Threads Referenced</h3>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {chapterData.plotThreadsReferenced.length}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {chapterData.plotThreadsReferenced.map((thread: any) => (
                          <div key={thread.title} className="text-sm text-muted-foreground">
                            {thread.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>

          <ChapterNavigation novelId={novelId} currentChapter={chapterNumber} totalChapters={totalChapters} />

          {chapterData && <CommentThread comments={chapterData.comments} isAdmin={isAdmin} />}
        </div>
      </main>

      {chapterData && (
        <ChapterSidebarMobile
          characters={chapterData.charactersInChapter}
          plotThreads={chapterData.plotThreadsReferenced}
          commentCount={chapterData.comments.length}
        />
      )}

      <TableOfContentsButton novelId={novelId} currentChapter={chapterNumber} totalChapters={totalChapters} />
    </div>
  )
}
