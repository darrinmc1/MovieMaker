"use client"

import { MoreVertical, Pencil, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Character } from "@/types/character"
import { CharacterAvatar } from "./character-avatar"
import { RoleBadge } from "./role-badge"

interface CharacterCardProps {
  character: Character
  onEdit: (character: Character) => void
  onDelete: (character: Character) => void
}

export function CharacterCard({ character, onEdit, onDelete }: CharacterCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <CharacterAvatar name={character.name} portraitUrl={character.portraitUrl} size="lg" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{character.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <RoleBadge role={character.role} />
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(character)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(character)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-sm text-gray-600 mt-2">{character.novelTitle}</p>

          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="text-gray-600">{character.appearances}</span>
            <Badge
              variant="secondary"
              className={character.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}
            >
              {character.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
