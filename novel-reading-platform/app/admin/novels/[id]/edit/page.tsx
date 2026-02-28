"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { NovelFormData, NovelFormErrors } from "@/types/novel-form"
import { FormField } from "@/components/admin/novels/form/form-field"
import { FormSection } from "@/components/admin/novels/form/form-section"
import { CharacterCounter } from "@/components/admin/novels/form/character-counter"
import { DynamicFieldList } from "@/components/admin/novels/form/dynamic-field-list"
import { StickyFormFooter } from "@/components/admin/novels/form/sticky-form-footer"
import { getNovelById, updateNovelData } from "@/lib/novels-data"
import { ChapterManagement } from "@/components/admin/novels/chapter-management"
import { ImageUploadZone } from "@/components/admin/novels/form/image-upload-zone"

const GENRES = [
  "Epic Fantasy",
  "Urban Fantasy",
  "Science Fiction",
  "Space Opera",
  "Romance",
  "Mystery",
  "Thriller",
  "Horror",
  "Literary Fiction",
  "Young Adult",
  "Middle Grade",
  "Contemporary",
]

export default function EditNovelPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [isLoadingNovel, setIsLoadingNovel] = useState(true)
  const [novel, setNovel] = useState<any>(null)

  const [formData, setFormData] = useState<NovelFormData>({
    title: "",
    author: "",
    genre: "",
    description: "",
    totalPlannedChapters: undefined,
    bookNumber: undefined,
    status: "draft",
    setting: "",
    toneAndStyle: "",
    worldRules: [],
    act1: "",
    act2: "",
    act3: "",
    themes: "",
    outline: "",
    allowComments: true,
    showViewCounts: true,
    showChapterRatings: false,
    matureContent: false,
    visibility: "public",
    emailOnComments: true,
    weeklyAnalytics: true,
    dailyDigest: false,
  })

  const [coverImageUrl, setCoverImageUrl] = useState<string>("")
  const [errors, setErrors] = useState<NovelFormErrors>({})

  useEffect(() => {
    async function loadNovel() {
      setIsLoadingNovel(true)
      try {
        const novelData = await getNovelById(params.id)
        if (novelData) {
          setNovel(novelData)
          setFormData({
            title: novelData.title || "",
            author: novelData.author || "",
            genre: novelData.genre || "",
            description: novelData.description || "",
            totalPlannedChapters: novelData.progress.total || undefined,
            bookNumber: novelData.book_number || undefined,
            status:
              novelData.status === "In Progress"
                ? "in-progress"
                : novelData.status === "Complete"
                  ? "complete"
                  : "draft",
            setting: novelData.setting || "",
            toneAndStyle: novelData.toneAndStyle || "",
            worldRules: novelData.worldRules || [],
            act1: novelData.act1 || "",
            act2: novelData.act2 || "",
            act3: novelData.act3 || "",
            themes: novelData.themes || "",
            outline: novelData.outline || "",
            allowComments: true,
            showViewCounts: true,
            showChapterRatings: false,
            matureContent: false,
            visibility: "public",
            emailOnComments: true,
            weeklyAnalytics: true,
            dailyDigest: false,
          })
          setCoverImageUrl(novelData.coverImage || "")
        }
      } catch (error) {
        console.error("Error loading novel:", error)
        toast({
          title: "Error",
          description: "Failed to load novel data.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingNovel(false)
      }
    }

    loadNovel()
  }, [params.id, toast])

  const validateForm = (): boolean => {
    const newErrors: NovelFormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Novel title is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const success = await updateNovelData(params.id, {
      title: formData.title,
      author: formData.author,
      genre: formData.genre,
      description: formData.description,
      setting: formData.setting,
      toneAndStyle: formData.toneAndStyle,
      worldRules: formData.worldRules,
      act1: formData.act1,
      act2: formData.act2,
      act3: formData.act3,
      themes: formData.themes,
      outline: formData.outline,
      book_number: formData.bookNumber,
      progress: {
        current: novel?.progress.current || 0,
        total: formData.totalPlannedChapters || 0,
      },
      coverImage: coverImageUrl,
    })

    setIsLoading(false)

    if (success) {
      toast({
        title: "Success",
        description: "✓ Novel updated successfully!",
        className: "bg-green-50 border-green-200",
      })

      router.push("/admin/novels")
    } else {
      toast({
        title: "Error",
        description: "Failed to update novel.",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    router.push("/admin/novels")
  }

  const updateFormData = (updates: Partial<NovelFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  if (isLoadingNovel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading novel...</p>
        </div>
      </div>
    )
  }

  if (!novel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Novel not found</h1>
          <Button onClick={() => router.push("/admin/novels")}>Back to Novels</Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Novels
                </Button>
                <div className="h-6 w-px bg-gray-300" />
                <h1 className="text-2xl font-bold text-gray-900">Edit Novel: {novel.title}</h1>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push(`/novel/${params.id}`)}>
                View Public Page
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-gray-100">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="chapters">Chapters</TabsTrigger>
              <TabsTrigger value="world">World Building</TabsTrigger>
              <TabsTrigger value="plot">Plot Structure</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="bg-white rounded-lg border border-gray-200 p-6">
              <FormSection>
                <FormField label="Cover Image" htmlFor="cover-image">
                  <ImageUploadZone value={coverImageUrl} onChange={(url) => setCoverImageUrl(url || "")} />
                </FormField>

                <FormField label="Novel Title" required error={errors.title} htmlFor="title">
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="Enter novel title"
                    className={errors.title ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField label="Author Name" htmlFor="author">
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => updateFormData({ author: e.target.value })}
                    placeholder="Author name"
                  />
                </FormField>

                <FormField label="Genre" required htmlFor="genre">
                  <Select value={formData.genre} onValueChange={(value) => updateFormData({ genre: value })}>
                    <SelectTrigger id="genre">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Description" htmlFor="description">
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                    placeholder="Write a compelling description of your novel..."
                    rows={5}
                  />
                  <CharacterCounter current={formData.description.length} max={500} />
                </FormField>

                <FormField label="Total Planned Chapters" htmlFor="chapters">
                  <Input
                    id="chapters"
                    type="number"
                    value={formData.totalPlannedChapters || ""}
                    onChange={(e) =>
                      updateFormData({
                        totalPlannedChapters: e.target.value ? Number.parseInt(e.target.value) : undefined,
                      })
                    }
                    placeholder="30"
                    min="1"
                  />
                </FormField>

                <FormField
                  label="Book Number"
                  htmlFor="book-number"
                  helperText="Set the order of this book in the series (e.g., 1 for Book 1, 2 for Book 2)"
                >
                  <Input
                    id="book-number"
                    type="number"
                    value={formData.bookNumber || ""}
                    onChange={(e) =>
                      updateFormData({
                        bookNumber: e.target.value ? Number.parseInt(e.target.value) : undefined,
                      })
                    }
                    placeholder="1"
                    min="1"
                  />
                </FormField>
              </FormSection>
            </TabsContent>

            <TabsContent value="chapters" className="space-y-6">
              <ChapterManagement novelId={params.id} novelTitle={novel.title} />
            </TabsContent>

            <TabsContent value="world" className="bg-white rounded-lg border border-gray-200 p-6">
              <FormSection title="World Bible">
                <FormField label="Setting" htmlFor="setting">
                  <Textarea
                    id="setting"
                    value={formData.setting}
                    onChange={(e) => updateFormData({ setting: e.target.value })}
                    placeholder="Describe the world, time period, and key locations..."
                    rows={4}
                  />
                  <CharacterCounter current={formData.setting.length} max={1000} />
                </FormField>

                <FormField label="Tone & Style" htmlFor="tone">
                  <Textarea
                    id="tone"
                    value={formData.toneAndStyle}
                    onChange={(e) => updateFormData({ toneAndStyle: e.target.value })}
                    placeholder="e.g., Dark but hopeful, Lighthearted adventure, Gritty realism..."
                    rows={3}
                  />
                  <CharacterCounter current={formData.toneAndStyle.length} max={500} />
                </FormField>

                <FormField label="Key World Rules">
                  <DynamicFieldList
                    values={formData.worldRules}
                    onChange={(values) => updateFormData({ worldRules: values })}
                    placeholder="Enter a world rule or magic system detail"
                    label="World Rule"
                  />
                </FormField>
              </FormSection>
            </TabsContent>

            <TabsContent value="plot" className="bg-white rounded-lg border border-gray-200 p-6">
              <FormSection>
                <FormField label="Act 1 - Setup" htmlFor="act1">
                  <Textarea
                    id="act1"
                    value={formData.act1}
                    onChange={(e) => updateFormData({ act1: e.target.value })}
                    placeholder="Describe the opening, inciting incident, and initial conflicts..."
                    rows={3}
                  />
                </FormField>

                <FormField label="Act 2 - Confrontation" htmlFor="act2">
                  <Textarea
                    id="act2"
                    value={formData.act2}
                    onChange={(e) => updateFormData({ act2: e.target.value })}
                    placeholder="Describe the rising action, complications, and midpoint..."
                    rows={3}
                  />
                </FormField>

                <FormField label="Act 3 - Resolution" htmlFor="act3">
                  <Textarea
                    id="act3"
                    value={formData.act3}
                    onChange={(e) => updateFormData({ act3: e.target.value })}
                    placeholder="Describe the climax and resolution..."
                    rows={3}
                  />
                </FormField>

                <FormField label="Overall Themes" htmlFor="themes">
                  <Input
                    id="themes"
                    value={formData.themes}
                    onChange={(e) => updateFormData({ themes: e.target.value })}
                    placeholder="Enter themes separated by commas"
                  />
                </FormField>

                <FormField label="Story Outline" htmlFor="outline">
                  <Textarea
                    id="outline"
                    value={formData.outline || ""}
                    onChange={(e) => updateFormData({ outline: e.target.value })}
                    placeholder="Write the full story outline that will be displayed on the book page..."
                    rows={10}
                  />
                </FormField>
              </FormSection>
            </TabsContent>

            <TabsContent value="settings" className="bg-white rounded-lg border border-gray-200 p-6">
              <FormSection title="Publishing Options">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allow-comments"
                      checked={formData.allowComments}
                      onCheckedChange={(checked) => updateFormData({ allowComments: checked as boolean })}
                    />
                    <Label htmlFor="allow-comments" className="font-normal cursor-pointer">
                      Allow comments on chapters
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-views"
                      checked={formData.showViewCounts}
                      onCheckedChange={(checked) => updateFormData({ showViewCounts: checked as boolean })}
                    />
                    <Label htmlFor="show-views" className="font-normal cursor-pointer">
                      Show view counts to readers
                    </Label>
                  </div>
                </div>
              </FormSection>
            </TabsContent>
          </Tabs>
        </div>

        <StickyFormFooter
          onCancel={handleCancel}
          onSaveDraft={handleSave}
          onPublish={handleSave}
          isLoading={isLoading}
        />
      </div>
    </>
  )
}
