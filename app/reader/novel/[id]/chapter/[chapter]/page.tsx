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

const mockChaptersData = {
  "test-oath-of-flame": [
    {
      number: 1,
      title: "The Awakening",
      wordCount: 2847,
      publishedDate: "Jan 1, 2024",
      directorsNotes:
        "This opening chapter sets the tone for the entire series. I wanted to introduce Elara in a way that shows both her strength and vulnerability. The fire scene was inspired by a camping trip where I watched embers dance in the darkness.",
      plotSpoilers:
        "The mysterious voice Elara hears is actually her dragon companion trying to reach her across the magical bond. The fire that doesn't burn her is the first sign of her dragon-touched heritage.",
      revisionNotes:
        "Draft 3: Added more sensory details to the fire scene. Strengthened Elara's internal conflict about her powers. Changed the ending to be more mysterious rather than revealing too much too soon.",
      content: `The flames danced before Elara's eyes, casting flickering shadows across the stone walls of her small chamber. She had been staring at the candle for hours now, watching the fire bend and sway to her unspoken commands. It was getting easier each time, the connection between her will and the element growing stronger with each passing day.

But with that growing power came fear.

"You shouldn't be doing this," came a voice from the doorway. Elara's hand jerked, and the candle flame shot up nearly a foot before she regained control, forcing it back down to a normal flicker.

Her mentor, Master Aldric, stepped into the room, his weathered face creased with concern. "The others are starting to notice. You're drawing too much attention to yourself."

"I'm just practicing," Elara said, but even she could hear the defensiveness in her voice. "Isn't that what we're supposed to do? Master our gifts?"

"Your gift is different, child." Aldric moved to the window, gazing out at the moonlit courtyard below. "Fire magic is rare enough, but the way you command it... it's as if the flames themselves recognize you as their sovereign."

Elara stood, wrapping her arms around herself. "What are you saying?"

"I'm saying that there are those who would fear such power. And fear makes people dangerous." He turned to face her, his eyes soft with something that looked like pity. "You must be careful, Elara. The world is not ready for what you might become."

That night, as Elara lay in her bed, she heard it again—that voice that had been calling to her in her dreams. It spoke in a language she didn't know but somehow understood, promising power, promising freedom, promising a destiny greater than she could imagine.

And somewhere in the distance, a dragon stirred from its ancient slumber.`,
      charactersInChapter: [
        { name: "Elara Moonwhisper", role: "Protagonist" as const },
        { name: "Master Aldric", role: "Supporting" as const },
      ],
      plotThreadsReferenced: [
        { title: "Elara's Fire Magic", status: "Active" as const },
        { title: "The Mysterious Voice", status: "Active" as const },
      ],
      comments: [
        {
          id: "1",
          author: "Sarah Mitchell",
          content: "Welcome to the beginning of Elara's journey! I'm so excited to share this story with you all.",
          timestamp: "5 days ago",
          isAuthor: true,
        },
        {
          id: "2",
          author: "DragonFan99",
          content: "Love the opening! The fire magic scene was beautifully written. Can't wait to see where this goes!",
          timestamp: "4 days ago",
        },
      ],
    },
    {
      number: 2,
      title: "Flames of Destiny",
      wordCount: 3156,
      publishedDate: "Jan 3, 2024",
      directorsNotes:
        "This chapter was all about escalation. I wanted to show that Elara's powers are growing beyond her control, setting up the conflict that will drive the next few chapters. The training yard scene was particularly fun to write!",
      plotSpoilers:
        "The 'accident' in the training yard wasn't really an accident—Elara's dragon bond is awakening, and it's causing her magic to surge unpredictably. The silver scales she sees in her vision are a glimpse of her dragon companion.",
      revisionNotes:
        "Draft 2: Expanded the training yard sequence. Added more tension between Elara and the other students. Foreshadowed the dragon bond more clearly with the scale vision.",
      content: `The training yard was already full when Elara arrived, students paired off and practicing their elemental control under the watchful eyes of the instructors. She tried to slip in unnoticed, but Master Aldric's warning from the previous night echoed in her mind: *You're drawing too much attention to yourself.*

"Ah, Elara!" Instructor Brennan's voice boomed across the yard. "Perfect timing. I need a volunteer for a demonstration."

Every instinct told her to decline, but refusing would draw even more attention. She stepped forward, acutely aware of the eyes following her movement.

"Today we're working on defensive techniques," Brennan continued, gesturing to a series of targets arranged around the yard. "The goal is to create a flame barrier strong enough to deflect incoming projectiles, but controlled enough not to harm your surroundings."

He demonstrated first, summoning a wall of fire that shimmered like a curtain between two posts. Wooden balls launched from a mechanical device bounced harmlessly off the flames, falling to the ground unburned.

"Now, Elara, your turn."

She took her position, closing her eyes and reaching for that familiar warmth inside her. The fire came easily—too easily. What should have been a controlled barrier erupted into a roaring inferno, flames shooting fifteen feet into the air.

Gasps echoed around the yard. Elara tried to pull the fire back, but it was like trying to hold back a flood with her bare hands. The flames grew hotter, brighter, and she could feel something else stirring within them—a presence, ancient and powerful, responding to her panic.

*Peace, little one,* a voice whispered in her mind, deep and resonant. *I am here.*

The flames suddenly collapsed, not extinguishing but transforming into a perfect, shimmering barrier exactly as the exercise required. But in that moment before they settled, Elara saw something in the fire—a shape, massive and serpentine, covered in silver scales that caught the light like mirrors.

When she opened her eyes, the barrier was gone, and the entire training yard was silent. Master Aldric stood at the edge of the crowd, his expression unreadable.

"Impressive control," Instructor Brennan said finally, though his voice was uncertain. "Though perhaps a bit... dramatic for a simple exercise."

That night, Elara couldn't sleep. She kept seeing those silver scales, kept hearing that voice. *I am here.* But where? And more importantly—who?`,
      charactersInChapter: [
        { name: "Elara Moonwhisper", role: "Protagonist" as const },
        { name: "Instructor Brennan", role: "Supporting" as const },
        { name: "Master Aldric", role: "Supporting" as const },
      ],
      plotThreadsReferenced: [
        { title: "Elara's Fire Magic", status: "Active" as const },
        { title: "The Dragon Bond", status: "Active" as const },
      ],
      comments: [
        {
          id: "1",
          author: "Sarah Mitchell",
          content: "The training yard scene was so much fun to write! What do you think that voice is? 👀",
          timestamp: "3 days ago",
          isAuthor: true,
        },
        {
          id: "2",
          author: "MagicLover",
          content: "OMG those silver scales! Is it a dragon?? Please tell me it's a dragon!",
          timestamp: "3 days ago",
        },
        {
          id: "3",
          author: "BookwormBeth",
          content: "The way you describe the magic is so vivid. I could feel the heat of those flames!",
          timestamp: "2 days ago",
        },
      ],
    },
    {
      number: 3,
      title: "The Dragon's Call",
      wordCount: 3421,
      publishedDate: "Jan 5, 2024",
      directorsNotes:
        "This is the chapter where everything changes. I've been building up to this moment since the first page, and I hope it delivers! The dragon reveal was something I planned from the very beginning of outlining this series.",
      plotSpoilers:
        "Silverwing is Elara's bonded dragon, and they've been connected since before Elara was born. The reason Elara's magic is so powerful is because she's channeling dragon fire, not human magic. This bond will be central to the entire series.",
      revisionNotes:
        "Draft 4: Completely rewrote the dragon reveal scene to make it more emotional. Added the backstory about Elara's parents. Extended the flight sequence. This chapter went through more revisions than any other so far!",
      content: `Elara woke to find her room filled with silver light. For a moment, she thought it was dawn, but the quality of the light was wrong—too bright, too ethereal, and it seemed to be coming from inside her chest.

She sat up, gasping, and the light pulsed in response to her heartbeat. The voice from her dreams was louder now, no longer a whisper but a clear, resonant call that seemed to vibrate through her very bones.

*Come to me.*

She didn't remember getting dressed or leaving her room. One moment she was in bed, and the next she was running through the empty corridors of the academy, following that silver light as it led her toward the mountains beyond the walls.

The gates should have been locked, but they swung open at her approach as if welcoming her home. The guards were nowhere to be seen—or perhaps they simply couldn't see her, wrapped as she was in that otherworldly glow.

The mountain path was steep and treacherous in the darkness, but Elara's feet found purchase on stones she couldn't see, guided by an instinct that wasn't entirely her own. Higher and higher she climbed, until the academy was just a collection of lights far below, and the stars seemed close enough to touch.

The cave entrance appeared suddenly, a darker shadow against the mountainside. The silver light pulsed brighter, urging her forward, and Elara stepped into the darkness without hesitation.

The cave opened into a vast cavern, its ceiling lost in shadow. And there, in the center of the space, lay a dragon.

It was smaller than the dragons from the old stories, perhaps only twice the size of a horse, but it was the most beautiful thing Elara had ever seen. Silver scales covered its body, each one catching and reflecting the light until the creature seemed to be made of living starlight. Its eyes, when they opened, were the exact shade of amber as Elara's own.

*Finally,* the dragon's voice filled her mind, warm and welcoming and achingly familiar. *I have waited so long for you to hear me, little flame.*

"You're real," Elara whispered, tears streaming down her face though she couldn't have said why she was crying. "All this time, you were real."

*As real as you are, my bonded one. I am Silverwing, and I have been yours since before you drew your first breath.* The dragon lowered its great head, and Elara reached out without thinking, her hand coming to rest on the warm scales between its eyes.

The moment they touched, memories flooded through her—not her memories, but Silverwing's. She saw herself as an infant, wrapped in blankets and placed in a basket at the academy gates. She saw her parents, faces she had never known, standing beside a silver dragon egg and speaking words of binding and protection. She saw the egg hatch on the same night she was born, the magical bond forming across the distance between them.

"My parents," Elara breathed. "They were dragon riders."

*They were the last of the dragon riders,* Silverwing confirmed. *And they gave everything to keep you safe, to hide you from those who would use our bond for their own purposes. But you are grown now, and the time for hiding is past. The world needs dragon riders again, little flame. It needs us.*

Elara looked into those amber eyes, seeing her own reflection staring back at her, and felt something settle into place inside her chest—a piece of herself she hadn't known was missing.

"Then let's fly," she said.

And they did.`,
      charactersInChapter: [
        { name: "Elara Moonwhisper", role: "Protagonist" as const },
        { name: "Silverwing", role: "Supporting" as const },
      ],
      plotThreadsReferenced: [
        { title: "The Dragon Bond", status: "Active" as const },
        { title: "Elara's True Heritage", status: "Active" as const },
        { title: "The Last Dragon Riders", status: "Active" as const },
      ],
      comments: [
        {
          id: "1",
          author: "Sarah Mitchell",
          content:
            "I may have cried while writing this chapter. Elara and Silverwing's bond is the heart of this entire story. Thank you all for coming on this journey with me! 💙",
          timestamp: "1 day ago",
          isAuthor: true,
        },
        {
          id: "2",
          author: "DragonFan99",
          content: "I KNEW IT! I KNEW IT WAS A DRAGON! This is everything I hoped for and more! Silverwing is perfect!",
          timestamp: "1 day ago",
        },
        {
          id: "3",
          author: "FantasyReader",
          content: "Okay I'm crying. The reveal about her parents was so emotional. Beautiful chapter!",
          timestamp: "1 day ago",
        },
        {
          id: "4",
          author: "MagicLover",
          content: "The flight scene at the end! Please tell me we get more dragon flying scenes!",
          timestamp: "20 hours ago",
        },
      ],
    },
  ],
}

export default function ChapterPage({ params }: { params: { id: string; chapter: string } }) {
  const novelId = params.id
  const chapterNumber = Number.parseInt(params.chapter)

  const novelChapters = mockChaptersData[novelId as keyof typeof mockChaptersData]

  if (!novelChapters) {
    notFound()
  }

  const chapterData = novelChapters.find((ch) => ch.number === chapterNumber)

  if (!chapterData) {
    notFound()
  }

  const estimatedMinutes = Math.ceil(chapterData.wordCount / 200)
  const isAdmin = true
  const totalChapters = novelId === "test-oath-of-flame" ? 3 : 30

  const chapterId = `${novelId}-chapter-${chapterNumber}`

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <ReadingProgressBar />
      <ReadingProgressTracker novelId={novelId} chapterId={chapterId} chapterNumber={chapterNumber} />
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <ChapterNavigation novelId={novelId} currentChapter={chapterData.number} totalChapters={totalChapters} />

          <div className="space-y-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Chapter {chapterData.number}: {chapterData.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <span>{chapterData.wordCount.toLocaleString()} words</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{estimatedMinutes} min read</span>
                </div>
                <span>•</span>
                <span>{chapterData.publishedDate}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <FontSizeControls />
                <ShareButton novelId={novelId} chapterNumber={chapterData.number} chapterTitle={chapterData.title} />
              </div>
            </div>

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
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <article className="flex-1 min-w-0">
              <Card>
                <CardContent className="p-8 md:p-12" data-chapter-content>
                  <div className="prose prose-lg max-w-none font-serif leading-relaxed">
                    {chapterData.content.split("\n\n").map((paragraph, index) => (
                      <p key={index} className="mb-6 text-pretty">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </article>

            <aside className="hidden lg:block lg:w-80 shrink-0 space-y-4">
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
                      {chapterData.charactersInChapter.map((character) => (
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
                      {chapterData.plotThreadsReferenced.map((thread) => (
                        <div key={thread.title} className="text-sm text-muted-foreground">
                          {thread.title}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>

          <ChapterNavigation novelId={novelId} currentChapter={chapterData.number} totalChapters={totalChapters} />

          <CommentThread comments={chapterData.comments} isAdmin={isAdmin} />
        </div>
      </main>

      <ChapterSidebarMobile
        characters={chapterData.charactersInChapter}
        plotThreads={chapterData.plotThreadsReferenced}
        commentCount={chapterData.comments.length}
      />

      <TableOfContentsButton novelId={novelId} currentChapter={chapterData.number} totalChapters={totalChapters} />
    </div>
  )
}
