"use client"

import { useState } from "react"
import { Search, Plus, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Character } from "@/types/character"
import { CharactersTable } from "@/components/admin/characters/characters-table"
import { CharacterCard } from "@/components/admin/characters/character-card"
import { CharacterModal } from "@/components/admin/characters/character-modal"
import { DeleteConfirmationModal } from "@/components/admin/delete-confirmation-modal"
import { useToast } from "@/hooks/use-toast"

export default function CharactersPage() {
  const { toast } = useToast()
  const [characters, setCharacters] = useState<Character[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [novelFilter, setNovelFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | undefined>()
  const [characterToDelete, setCharacterToDelete] = useState<Character | undefined>()

  const handleAddCharacter = () => {
    setSelectedCharacter(undefined)
    setIsModalOpen(true)
  }

  const handleEditCharacter = (character: Character) => {
    setSelectedCharacter(character)
    setIsModalOpen(true)
  }

  const handleDeleteCharacter = (character: Character) => {
    setCharacterToDelete(character)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (characterToDelete) {
      setCharacters(characters.filter((c) => c.id !== characterToDelete.id))
      toast({
        title: "Character deleted",
        description: `${characterToDelete.name} has been removed`,
      })
      setCharacterToDelete(undefined)
    }
  }

  const handleSaveCharacter = (data: any) => {
    if (selectedCharacter) {
      setCharacters(
        characters.map((c) => (c.id === selectedCharacter.id ? { ...c, ...data, updatedAt: new Date() } : c)),
      )
    } else {
      const newCharacter: Character = {
        id: Date.now().toString(),
        ...data,
        novelTitle: "Oath of Flame – The Dragon's Legacy",
        appearances: "Ch 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setCharacters([...characters, newCharacter])
    }
  }

  const filteredCharacters = characters.filter((character) => {
    const matchesSearch = character.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesNovel = novelFilter === "all" || character.novelId === novelFilter
    const matchesStatus = statusFilter === "all" || character.status === statusFilter
    return matchesSearch && matchesNovel && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Characters</h1>
        <Button onClick={handleAddCharacter} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Character
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search characters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={novelFilter} onValueChange={setNovelFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Novels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Novels</SelectItem>
            <SelectItem value="1">Oath of Flame</SelectItem>
            <SelectItem value="2">Depthspire</SelectItem>
            <SelectItem value="3">Crownless</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredCharacters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No characters yet</h3>
          <p className="text-gray-600 mb-6 text-center max-w-sm">Add characters to track them across your story</p>
          <Button onClick={handleAddCharacter} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Character
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <CharactersTable
              characters={filteredCharacters}
              onEdit={handleEditCharacter}
              onDelete={handleDeleteCharacter}
            />
          </div>
          <div className="md:hidden space-y-4">
            {filteredCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onEdit={handleEditCharacter}
                onDelete={handleDeleteCharacter}
              />
            ))}
          </div>
        </>
      )}

      <CharacterModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        character={selectedCharacter}
        onSave={handleSaveCharacter}
      />

      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete Character?"
        description={`This will remove ${characterToDelete?.name} from your records. This cannot be undone.`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
