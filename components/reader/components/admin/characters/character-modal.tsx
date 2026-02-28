"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Character, CharacterFormData } from "@/types/character"
import { TagInput } from "./tag-input"
import { ImageUploadSquare } from "./image-upload-square"
import { useToast } from "@/hooks/use-toast"

interface CharacterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  character?: Character
  onSave: (data: CharacterFormData) => void
}

const novels = [
  { id: "1", title: "Oath of Flame – The Dragon's Legacy" },
  { id: "2", title: "Depthspire – The Dungeon Below" },
  { id: "3", title: "Crownless – The Forgotten King" },
]

export function CharacterModal({ open, onOpenChange, character, onSave }: CharacterModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<CharacterFormData>({
    novelId: "",
    name: "",
    role: "supporting",
    description: "",
    traits: [],
    portraitUrl: undefined,
    firstAppearance: 1,
    status: "active",
    internalNotes: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (character) {
      setFormData({
        novelId: character.novelId,
        name: character.name,
        role: character.role,
        description: character.description,
        traits: character.traits,
        portraitUrl: character.portraitUrl,
        firstAppearance: character.firstAppearance,
        status: character.status,
        internalNotes: character.internalNotes || "",
      })
    } else {
      setFormData({
        novelId: "",
        name: "",
        role: "supporting",
        description: "",
        traits: [],
        portraitUrl: undefined,
        firstAppearance: 1,
        status: "active",
        internalNotes: "",
      })
    }
    setErrors({})
  }, [character, open])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.novelId) newErrors.novelId = "Novel is required"
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (formData.description.length > 500) newErrors.description = "Description must be 500 characters or less"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validate()) {
      onSave(formData)
      toast({
        title: "Success",
        description: `Character ${character ? "updated" : "created"} successfully`,
      })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{character ? "Edit Character" : "Add Character"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <Label htmlFor="name">Character Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Kael Dawnbringer"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label>Role *</Label>
            <RadioGroup value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="protagonist" id="protagonist" />
                <Label htmlFor="protagonist" className="font-normal cursor-pointer">
                  Protagonist
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="antagonist" id="antagonist" />
                <Label htmlFor="antagonist" className="font-normal cursor-pointer">
                  Antagonist
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="supporting" id="supporting" />
                <Label htmlFor="supporting" className="font-normal cursor-pointer">
                  Supporting Character
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="minor" id="minor" />
                <Label htmlFor="minor" className="font-normal cursor-pointer">
                  Minor Character
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the character..."
              rows={4}
              className={errors.description ? "border-red-500" : ""}
            />
            <div className="flex justify-between text-sm">
              {errors.description ? <p className="text-red-600">{errors.description}</p> : <span />}
              <span className={formData.description.length > 500 ? "text-red-600" : "text-gray-500"}>
                {formData.description.length}/500
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Character Traits</Label>
            <TagInput
              tags={formData.traits}
              onChange={(traits) => setFormData({ ...formData, traits })}
              placeholder="Add traits (brave, loyal, cunning)..."
            />
          </div>

          <div className="space-y-2">
            <Label>Character Portrait</Label>
            <ImageUploadSquare
              value={formData.portraitUrl}
              onChange={(url) => setFormData({ ...formData, portraitUrl: url })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstAppearance">First Appearance</Label>
            <Select
              value={formData.firstAppearance.toString()}
              onValueChange={(value) => setFormData({ ...formData, firstAppearance: Number.parseInt(value) })}
            >
              <SelectTrigger id="firstAppearance">
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

          <div className="space-y-2">
            <Label>Status</Label>
            <RadioGroup
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="active" id="active" />
                <Label htmlFor="active" className="font-normal cursor-pointer">
                  Active (currently in the story)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inactive" id="inactive" />
                <Label htmlFor="inactive" className="font-normal cursor-pointer">
                  Inactive (no longer appearing)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="internalNotes">Internal Notes</Label>
            <Textarea
              id="internalNotes"
              value={formData.internalNotes}
              onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
              placeholder="Private notes about this character (not shown to readers)..."
              rows={3}
            />
            <p className="text-xs text-gray-500">For your reference only</p>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              Save Character
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
