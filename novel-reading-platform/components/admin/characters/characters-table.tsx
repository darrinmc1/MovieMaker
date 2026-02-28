"use client"

import { useState } from "react"
import { MoreVertical, Pencil, Trash2, BookOpen, FileText } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import type { Character } from "@/types/character"
import { CharacterAvatar } from "./character-avatar"
import { RoleBadge } from "./role-badge"

interface CharactersTableProps {
  characters: Character[]
  onEdit: (character: Character) => void
  onDelete: (character: Character) => void
}

export function CharactersTable({ characters, onEdit, onDelete }: CharactersTableProps) {
  const router = useRouter()
  const [sortField, setSortField] = useState<keyof Character>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSort = (field: keyof Character) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedCharacters = [...characters].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    const modifier = sortDirection === "asc" ? 1 : -1

    if (typeof aValue === "string" && typeof bValue === "string") {
      return aValue.localeCompare(bValue) * modifier
    }
    return 0
  })

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-[60px]">Avatar</TableHead>
            <TableHead className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort("name")}>
              Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort("role")}>
              Role {sortField === "role" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead>Novel</TableHead>
            <TableHead>Appearances</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[60px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCharacters.map((character) => (
            <TableRow key={character.id} className="hover:bg-gray-50">
              <TableCell>
                <CharacterAvatar name={character.name} portraitUrl={character.portraitUrl} />
              </TableCell>
              <TableCell className="font-semibold">{character.name}</TableCell>
              <TableCell>
                <RoleBadge role={character.role} />
              </TableCell>
              <TableCell className="text-gray-600">{character.novelTitle}</TableCell>
              <TableCell className="text-gray-600">{character.appearances}</TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={
                    character.status === "active"
                      ? "bg-green-100 text-green-700 hover:bg-green-100"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                  }
                >
                  {character.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(character)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Character
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => router.push(`/admin/novels?search=${encodeURIComponent(character.novelTitle)}`)}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Novel
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(`/admin/chapters?novel=${encodeURIComponent(character.novelTitle)}`)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Chapters
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(character)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
