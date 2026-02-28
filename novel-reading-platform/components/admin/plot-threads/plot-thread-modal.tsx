"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import type { PlotThread, PlotThreadFormData } from "@/types/plot-thread"
import { useToast } from "@/hooks/use-toast"

interface PlotThreadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plotThread?: PlotThread
  onSave: (data: PlotThreadFormData) => void
}

const novels = [
  { id: "1", title: "Oath of Flame – The Dragon's Legacy" },
  { id: "2", title: "Depthspire – The Dungeon Below" },
  { id: "3", title: "Crownless – The Forgotten King" },
]

const mockCharacters = [
  { id: "1", name: "Kael Dawnbringer", portraitUrl: undefined },
  { id: "2", name: "Lyra Shadowmend", portraitUrl: undefined },
  { id: "3", name: "Theron Ironscale", portraitUrl: undefined },
  { id: "4", name: "Mira Flameheart", portraitUrl: undefined },
]

export function PlotThreadModal({ open, onOpenChange, plotThread, onSave }: PlotThreadModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<PlotThreadFormData>({
    novelId: "",
    description: "",
    importance: "minor",
    status: "active",
    introducedChapter: 1,
    resolvedChapter: undefined,
    relatedCharacterIds: [],
    internalNotes: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (plotThread) {
      setFormData({
        novelId: plotThread.novelId,
        description: plotThread.description,
        importance: plotThread.importance,
        status: plotThread.status,
        introducedChapter: plotThread.introducedChapter,
        resolvedChapter: plotThread.resolvedChapter,
        relatedCharacterIds: plotThread.relatedCharacterIds,
        internalNotes: plotThread.internalNotes || "",
      })
    } else {
      setFormData({
        novelId: "",
        description: "",
        importance: "minor",
        status: "active",
        introducedChapter: 1,
        resolvedChapter: undefined,
        relatedCharacterIds: [],
        internalNotes: "",
      })
    }
    setErrors({})
  }, [plotThread, open])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.novelId) newErrors.novelId = "Novel is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (formData.description.length > 200) newErrors.description = "Description must be 200 characters or less"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validate()) {
      onSave(formData)
      toast({
        title: "Success",
        description: `Plot thread ${plotThread ? "updated" : "created"} successfully`,
      })
      onOpenChange(false)
    }
  }

  const handleCharacterToggle = (characterId: string) => {
    setFormData({
      ...formData,
      relatedCharacterIds: formData.relatedCharacterIds.includes(characterId)
        ? formData.relatedCharacterIds.filter((id) => id !== characterId)
        : [...formData.relatedCharacterIds, characterId],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plotThread ? "Edit Plot Thread" : "Add Plot Thread"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this plot thread or storyline..."
              rows={3}
              className={errors.description ? "border-red-500" : ""}
            />
            <div className="flex justify-between text-sm">
              {errors.description ? <p className="text-red-600">{errors.description}</p> : <span />}
              <span className={formData.description.length > 200 ? "text-red-600" : "text-gray-500"}>
                {formData.description.length}/200
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="novel">Novel *</Label>
            <Select value={formData.novelId} onValueChange={(value) => setFormData({ ...formData, novelId: value })}>
              <SelectTrigger id="novel" className={errors.novelId ? "border-red-500" : ""}>
                <SelectValue placeholder="Select novel..." />
              </SelectTrigger>
              <SelectContent>
                {novels.map((novel) => (
                  <SelectItem key={novel.id} value={novel.id}>
                    {novel.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.novelId && <p className="text-sm text-red-600">{errors.novelId}</p>}
          </div>

          <div className="space-y-2">
            <Label>Importance *</Label>
            <RadioGroup
              value={formData.importance}
              onValueChange={(value: any) => setFormData({ ...formData, importance: value })}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="major" id="major" />
                <Label htmlFor="major" className="font-normal cursor-pointer">
                  Major <span className="text-gray-500 text-sm">(Core to main story)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="minor" id="minor" />
                <Label htmlFor="minor" className="font-normal cursor-pointer">
                  Minor <span className="text-gray-500 text-sm">(Subplot or side element)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Status *</Label>
            <RadioGroup
              value={formData.status}
              onValueChange={(value: any) => {
                setFormData({
                  ...formData,
                  status: value,
                  resolvedChapter: value === "resolved" ? formData.resolvedChapter : undefined,
                })
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="active" id="status-active" />
                <Label htmlFor="status-active" className="font-normal cursor-pointer">
                  Active <span className="text-gray-500 text-sm">(Currently developing)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="resolved" id="status-resolved" />
                <Label htmlFor="status-resolved" className="font-normal cursor-pointer">
                  Resolved <span className="text-gray-500 text-sm">(Concluded)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="abandoned" id="status-abandoned" />
                <Label htmlFor="status-abandoned" className="font-normal cursor-pointer">
                  Abandoned <span className="text-gray-500 text-sm">(No longer pursuing)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="introducedChapter">Introduced in Chapter *</Label>
              <Select
                value={formData.introducedChapter.toString()}
                onValueChange={(value) => setFormData({ ...formData, introducedChapter: Number.parseInt(value) })}
              >
                <SelectTrigger id="introducedChapter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      Chapter {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolvedChapter">Resolved in Chapter</Label>
              <Select
                value={formData.resolvedChapter?.toString() || ""}
                onValueChange={(value) => setFormData({ ...formData, resolvedChapter: Number.parseInt(value) })}
                disabled={formData.status !== "resolved"}
              >
                <SelectTrigger id="resolvedChapter" className={formData.status !== "resolved" ? "opacity-50" : ""}>
                  <SelectValue placeholder="Select chapter..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      Chapter {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Related Characters</Label>
            <p className="text-sm text-gray-500 mb-3">Select characters involved in this plot</p>
            <div className="grid grid-cols-2 gap-3">
              {mockCharacters.map((character) => (
                <div key={character.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`character-${character.id}`}
                    checked={formData.relatedCharacterIds.includes(character.id)}
                    onCheckedChange={() => handleCharacterToggle(character.id)}
                  />
                  <Label htmlFor={`character-${character.id}`} className="font-normal cursor-pointer">
                    {character.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="internalNotes">Internal Notes</Label>
            <Textarea
              id="internalNotes"
              value={formData.internalNotes}
              onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
              placeholder="Planning notes, future developments..."
              rows={3}
            />
            <p className="text-xs text-gray-500">For your reference only</p>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              Save Plot Thread
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
