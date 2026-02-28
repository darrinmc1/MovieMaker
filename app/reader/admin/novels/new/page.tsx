"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { NovelFormData, NovelFormErrors } from "@/types/novel-form"
import { FormField } from "@/components/admin/novels/form/form-field"
import { FormSection } from "@/components/admin/novels/form/form-section"
import { ImageUploadZone } from "@/components/admin/novels/form/image-upload-zone"
import { CharacterCounter } from "@/components/admin/novels/form/character-counter"
import { DynamicFieldList } from "@/components/admin/novels/form/dynamic-field-list"
import { StickyFormFooter } from "@/components/admin/novels/form/sticky-form-footer"
import { createClient } from "@/lib/supabase/client"

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

export default function NewNovelPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")

  const [formData, setFormData] = useState<NovelFormData>({
    title: "",
    author: "",
    genre: "",
    description: "",
    totalPlannedChapters: undefined,
    bookNumber: undefined,
    status: "coming-soon",
    setting: "",
    toneAndStyle: "",
    worldRules: [],
    act1: "",
    act2: "",
    act3: "",
    themes: "",
    allowComments: true,
    showViewCounts: true,
    showChapterRatings: false,
    matureContent: false,
    visibility: "public",
    emailOnComments: true,
    weeklyAnalytics: true,
    dailyDigest: false,
  })

  const [errors, setErrors] = useState<NovelFormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: NovelFormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Novel title is required"
    }

    if (!formData.author.trim()) {
      newErrors.author = "Author name is required"
    }

    if (!formData.genre) {
      newErrors.genre = "Please select a genre"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    } else if (formData.description.length < 50) {
      newErrors.description = "Description must be at least 50 characters"
    } else if (formData.description.length > 500) {
      newErrors.description = "Description must not exceed 500 characters"
    }

    if (!formData.setting.trim()) {
      newErrors.setting = "Setting is required"
    } else if (formData.setting.length > 1000) {
      newErrors.setting = "Setting must not exceed 1000 characters"
    }

    if (!formData.toneAndStyle.trim()) {
      newErrors.toneAndStyle = "Tone & Style is required"
    } else if (formData.toneAndStyle.length > 500) {
      newErrors.toneAndStyle = "Tone & Style must not exceed 500 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveDraft = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Insert novel into database
      const { data, error } = await supabase
        .from("novels")
        .insert({
          title: formData.title,
          description: formData.description,
          genre: formData.genre,
          status: formData.status,
          cover_image: formData.coverImage || null,
          total_chapters: formData.totalPlannedChapters || 0,
          published_chapters: 0,
          book_number: formData.bookNumber || null,
          views: 0,
          likes: 0,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error saving novel:", error)
        throw error
      }

      console.log("[v0] Novel saved successfully:", data)

      toast({
        title: "Success",
        description: "✓ Novel saved successfully!",
        className: "bg-green-50 border-green-200",
      })

      router.push("/admin/novels")
    } catch (error) {
      console.error("[v0] Error saving novel:", error)
      toast({
        title: "Error",
        description: "Failed to save novel. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before publishing.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Insert novel into database with published status
      const { data, error } = await supabase
        .from("novels")
        .insert({
          title: formData.title,
          description: formData.description,
          genre: formData.genre,
          status: "in-progress",
          cover_image: formData.coverImage || null,
          total_chapters: formData.totalPlannedChapters || 0,
          published_chapters: 0,
          book_number: formData.bookNumber || null,
          views: 0,
          likes: 0,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error publishing novel:", error)
        throw error
      }

      console.log("[v0] Novel published successfully:", data)

      toast({
        title: "Success",
        description: "✓ Novel published successfully!",
        className: "bg-green-50 border-green-200",
      })

      router.push("/admin/novels")
    } catch (error) {
      console.error("[v0] Error publishing novel:", error)
      toast({
        title: "Error",
        description: "Failed to publish novel. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/admin/novels")
  }

  const updateFormData = (updates: Partial<NovelFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Novels
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">Create New Novel</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100">
            <TabsTrigger
              value="basic"
              className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600"
            >
              Basic Info
            </TabsTrigger>
            <TabsTrigger
              value="world"
              className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600"
            >
              World Building
            </TabsTrigger>
            <TabsTrigger
              value="plot"
              className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600"
            >
              Plot Structure
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Basic Information */}
          <TabsContent value="basic" className="bg-white rounded-lg border border-gray-200 p-6">
            <FormSection>
              <FormField label="Novel Title" required error={errors.title} htmlFor="title">
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateFormData({ title: e.target.value })}
                  onBlur={() => {
                    if (!formData.title.trim()) {
                      setErrors((prev) => ({ ...prev, title: "Novel title is required" }))
                    } else {
                      setErrors((prev) => ({ ...prev, title: undefined }))
                    }
                  }}
                  placeholder="Enter novel title"
                  className={errors.title ? "border-red-500" : ""}
                />
              </FormField>

              <FormField label="Author Name" required error={errors.author} htmlFor="author">
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => updateFormData({ author: e.target.value })}
                  onBlur={() => {
                    if (!formData.author.trim()) {
                      setErrors((prev) => ({ ...prev, author: "Author name is required" }))
                    } else {
                      setErrors((prev) => ({ ...prev, author: undefined }))
                    }
                  }}
                  placeholder="Author name"
                  className={errors.author ? "border-red-500" : ""}
                />
              </FormField>

              <FormField label="Genre" required error={errors.genre} htmlFor="genre">
                <Select
                  value={formData.genre}
                  onValueChange={(value) => {
                    updateFormData({ genre: value })
                    setErrors((prev) => ({ ...prev, genre: undefined }))
                  }}
                >
                  <SelectTrigger id="genre" className={errors.genre ? "border-red-500" : ""}>
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

              <FormField label="Cover Image">
                <ImageUploadZone
                  value={formData.coverImage}
                  onChange={(file) => updateFormData({ coverImage: file || undefined })}
                />
              </FormField>

              <FormField label="Description" required error={errors.description} htmlFor="description">
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  onBlur={() => {
                    if (!formData.description.trim()) {
                      setErrors((prev) => ({ ...prev, description: "Description is required" }))
                    } else if (formData.description.length < 50) {
                      setErrors((prev) => ({ ...prev, description: "Description must be at least 50 characters" }))
                    } else if (formData.description.length > 500) {
                      setErrors((prev) => ({ ...prev, description: "Description must not exceed 500 characters" }))
                    } else {
                      setErrors((prev) => ({ ...prev, description: undefined }))
                    }
                  }}
                  placeholder="Write a compelling description of your novel..."
                  rows={5}
                  className={errors.description ? "border-red-500" : ""}
                />
                <CharacterCounter current={formData.description.length} max={500} />
              </FormField>

              <FormField
                label="Total Planned Chapters"
                helperText="Estimated total chapters (can be changed later)"
                htmlFor="chapters"
              >
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

              <FormField label="Status" required>
                <RadioGroup
                  value={formData.status}
                  onValueChange={(value) => updateFormData({ status: value as NovelFormData["status"] })}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="coming-soon" id="status-coming-soon" />
                    <Label htmlFor="status-coming-soon" className="font-normal cursor-pointer">
                      Coming Soon
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="draft" id="status-draft" />
                    <Label htmlFor="status-draft" className="font-normal cursor-pointer">
                      Draft
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="in-progress" id="status-progress" />
                    <Label htmlFor="status-progress" className="font-normal cursor-pointer">
                      In Progress
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="complete" id="status-complete" />
                    <Label htmlFor="status-complete" className="font-normal cursor-pointer">
                      Complete
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="on-hiatus" id="status-hiatus" />
                    <Label htmlFor="status-hiatus" className="font-normal cursor-pointer">
                      On Hiatus
                    </Label>
                  </div>
                </RadioGroup>
              </FormField>
            </FormSection>
          </TabsContent>

          {/* Tab 2: World Building */}
          <TabsContent value="world" className="bg-white rounded-lg border border-gray-200 p-6">
            <FormSection title="World Bible">
              <FormField label="Setting" required error={errors.setting} htmlFor="setting">
                <Textarea
                  id="setting"
                  value={formData.setting}
                  onChange={(e) => updateFormData({ setting: e.target.value })}
                  onBlur={() => {
                    if (!formData.setting.trim()) {
                      setErrors((prev) => ({ ...prev, setting: "Setting is required" }))
                    } else if (formData.setting.length > 1000) {
                      setErrors((prev) => ({ ...prev, setting: "Setting must not exceed 1000 characters" }))
                    } else {
                      setErrors((prev) => ({ ...prev, setting: undefined }))
                    }
                  }}
                  placeholder="Describe the world, time period, and key locations..."
                  rows={4}
                  className={errors.setting ? "border-red-500" : ""}
                />
                <CharacterCounter current={formData.setting.length} max={1000} />
              </FormField>

              <FormField label="Tone & Style" required error={errors.toneAndStyle} htmlFor="tone">
                <Textarea
                  id="tone"
                  value={formData.toneAndStyle}
                  onChange={(e) => updateFormData({ toneAndStyle: e.target.value })}
                  onBlur={() => {
                    if (!formData.toneAndStyle.trim()) {
                      setErrors((prev) => ({ ...prev, toneAndStyle: "Tone & Style is required" }))
                    } else if (formData.toneAndStyle.length > 500) {
                      setErrors((prev) => ({ ...prev, toneAndStyle: "Tone & Style must not exceed 500 characters" }))
                    } else {
                      setErrors((prev) => ({ ...prev, toneAndStyle: undefined }))
                    }
                  }}
                  placeholder="e.g., Dark but hopeful, Lighthearted adventure, Gritty realism..."
                  rows={3}
                  className={errors.toneAndStyle ? "border-red-500" : ""}
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

          {/* Tab 3: Plot Structure */}
          <TabsContent value="plot" className="bg-white rounded-lg border border-gray-200 p-6">
            <FormSection>
              <p className="text-sm text-gray-500 mb-6">Optional but helpful for planning</p>

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
                  placeholder="Enter themes separated by commas (e.g., redemption, sacrifice, hope)"
                />
              </FormField>
            </FormSection>
          </TabsContent>

          {/* Tab 4: Settings */}
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-ratings"
                    checked={formData.showChapterRatings}
                    onCheckedChange={(checked) => updateFormData({ showChapterRatings: checked as boolean })}
                    disabled
                  />
                  <Label htmlFor="show-ratings" className="font-normal cursor-pointer text-gray-400">
                    Show chapter ratings (coming soon)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mature-content"
                    checked={formData.matureContent}
                    onCheckedChange={(checked) => updateFormData({ matureContent: checked as boolean })}
                  />
                  <Label htmlFor="mature-content" className="font-normal cursor-pointer">
                    Mature content warning
                  </Label>
                </div>
              </div>
            </FormSection>

            <FormSection title="Visibility" className="mt-8">
              <RadioGroup
                value={formData.visibility}
                onValueChange={(value) => updateFormData({ visibility: value as NovelFormData["visibility"] })}
                className="space-y-3"
              >
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="public" id="visibility-public" className="mt-1" />
                  <div>
                    <Label htmlFor="visibility-public" className="font-normal cursor-pointer">
                      Public
                    </Label>
                    <p className="text-xs text-gray-500">Listed on homepage, discoverable</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="unlisted" id="visibility-unlisted" className="mt-1" />
                  <div>
                    <Label htmlFor="visibility-unlisted" className="font-normal cursor-pointer">
                      Unlisted
                    </Label>
                    <p className="text-xs text-gray-500">Only accessible via direct link</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="private" id="visibility-private" className="mt-1" />
                  <div>
                    <Label htmlFor="visibility-private" className="font-normal cursor-pointer">
                      Private
                    </Label>
                    <p className="text-xs text-gray-500">Only visible to you</p>
                  </div>
                </div>
              </RadioGroup>
            </FormSection>

            <FormSection title="Notifications" className="mt-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email-comments"
                    checked={formData.emailOnComments}
                    onCheckedChange={(checked) => updateFormData({ emailOnComments: checked as boolean })}
                  />
                  <Label htmlFor="email-comments" className="font-normal cursor-pointer">
                    Email me when new comments are posted
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="weekly-analytics"
                    checked={formData.weeklyAnalytics}
                    onCheckedChange={(checked) => updateFormData({ weeklyAnalytics: checked as boolean })}
                  />
                  <Label htmlFor="weekly-analytics" className="font-normal cursor-pointer">
                    Weekly analytics summary
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="daily-digest"
                    checked={formData.dailyDigest}
                    onCheckedChange={(checked) => updateFormData({ dailyDigest: checked as boolean })}
                  />
                  <Label htmlFor="daily-digest" className="font-normal cursor-pointer">
                    Daily digest of activity
                  </Label>
                </div>
              </div>
            </FormSection>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky Footer */}
      <StickyFormFooter
        onCancel={handleCancel}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        isLoading={isLoading}
      />
    </div>
  )
}
