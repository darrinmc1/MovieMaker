"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, User } from "lucide-react"
import type { Character } from "@/types/chapter-form"

interface CharacterCheckboxGridProps {
  characters: Character[]
  selectedCharacters: string[]
  onChange: (characterIds: string[]) => void
}

export function CharacterCheckboxGrid({ characters, selectedCharacters, onChange }: CharacterCheckboxGridProps) {
  const handleToggle = (characterId: string) => {
    if (selectedCharacters.includes(characterId)) {
      onChange(selectedCharacters.filter((id) => id !== characterId))
    } else {
      onChange([...selectedCharacters, characterId])
    }
  }

  const getRoleBadgeVariant = (role: Character["role"]) => {
    switch (role) {
      case "protagonist":
        return "default"
      case "antagonist":
        return "destructive"
      case "supporting":
        return "secondary"
    }
  }

  if (characters.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed rounded-lg">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">No characters added yet. Add your first character.</p>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add New Character
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {characters.map((character) => (
          <label
            key={character.id}
            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <Checkbox
              checked={selectedCharacters.includes(character.id)}
              onCheckedChange={() => handleToggle(character.id)}
            />
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                {character.avatar ? (
                  <img
                    src={character.avatar || "/placeholder.svg"}
                    alt={character.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-indigo-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{character.name}</div>
                <Badge variant={getRoleBadgeVariant(character.role)} className="text-xs mt-1">
                  {character.role}
                </Badge>
              </div>
            </div>
          </label>
        ))}
      </div>
      <Button variant="outline" size="sm" type="button">
        <Plus className="h-4 w-4 mr-2" />
        Add New Character
      </Button>
    </div>
  )
}
