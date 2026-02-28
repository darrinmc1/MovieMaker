"use client"

import { useState } from "react"
import { Search, Plus, Target } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PlotThread } from "@/types/plot-thread"
import { PlotThreadsTable } from "@/components/admin/plot-threads/plot-threads-table"
import { PlotThreadCard } from "@/components/admin/plot-threads/plot-thread-card"
import { PlotThreadModal } from "@/components/admin/plot-threads/plot-thread-modal"
import { DeleteConfirmationModal } from "@/components/admin/delete-confirmation-modal"
import { useToast } from "@/hooks/use-toast"

export default function PlotThreadsPage() {
  const { toast } = useToast()
  const [plotThreads, setPlotThreads] = useState<PlotThread[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [novelFilter, setNovelFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [importanceFilter, setImportanceFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedPlotThread, setSelectedPlotThread] = useState<PlotThread | undefined>()
  const [plotThreadToDelete, setPlotThreadToDelete] = useState<PlotThread | undefined>()

  const handleAddPlotThread = () => {
    setSelectedPlotThread(undefined)
    setIsModalOpen(true)
  }

  const handleEditPlotThread = (plotThread: PlotThread) => {
    setSelectedPlotThread(plotThread)
    setIsModalOpen(true)
  }

  const handleDeletePlotThread = (plotThread: PlotThread) => {
    setPlotThreadToDelete(plotThread)
    setIsDeleteModalOpen(true)
  }

  const handleMarkResolved = (plotThread: PlotThread) => {
    setPlotThreads(
      plotThreads.map((pt) =>
        pt.id === plotThread.id ? { ...pt, status: "resolved" as const, updatedAt: new Date() } : pt,
      ),
    )
    toast({
      title: "Plot thread resolved",
      description: "The plot thread has been marked as resolved",
    })
  }

  const handleConfirmDelete = () => {
    if (plotThreadToDelete) {
      setPlotThreads(plotThreads.filter((pt) => pt.id !== plotThreadToDelete.id))
      toast({
        title: "Plot thread deleted",
        description: "The plot thread has been removed",
      })
      setPlotThreadToDelete(undefined)
    }
  }

  const handleSavePlotThread = (data: any) => {
    if (selectedPlotThread) {
      setPlotThreads(
        plotThreads.map((pt) => (pt.id === selectedPlotThread.id ? { ...pt, ...data, updatedAt: new Date() } : pt)),
      )
    } else {
      const newPlotThread: PlotThread = {
        id: Date.now().toString(),
        ...data,
        novelTitle: "Oath of Flame – The Dragon's Legacy",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setPlotThreads([...plotThreads, newPlotThread])
    }
  }

  const filteredPlotThreads = plotThreads.filter((plotThread) => {
    const matchesSearch = plotThread.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesNovel = novelFilter === "all" || plotThread.novelId === novelFilter
    const matchesStatus = statusFilter === "all" || plotThread.status === statusFilter
    const matchesImportance = importanceFilter === "all" || plotThread.importance === importanceFilter
    return matchesSearch && matchesNovel && matchesStatus && matchesImportance
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Plot Threads</h1>
        <Button onClick={handleAddPlotThread} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Plot Thread
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search plot threads..."
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
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="abandoned">Abandoned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={importanceFilter} onValueChange={setImportanceFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Importance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Importance</SelectItem>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredPlotThreads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No plot threads yet</h3>
          <p className="text-gray-600 mb-6 text-center max-w-sm">Track storylines and subplots across chapters</p>
          <Button onClick={handleAddPlotThread} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Plot Thread
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <PlotThreadsTable
              plotThreads={filteredPlotThreads}
              onEdit={handleEditPlotThread}
              onDelete={handleDeletePlotThread}
              onMarkResolved={handleMarkResolved}
            />
          </div>
          <div className="md:hidden space-y-4">
            {filteredPlotThreads.map((plotThread) => (
              <PlotThreadCard
                key={plotThread.id}
                plotThread={plotThread}
                onEdit={handleEditPlotThread}
                onDelete={handleDeletePlotThread}
                onMarkResolved={handleMarkResolved}
              />
            ))}
          </div>
        </>
      )}

      <PlotThreadModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        plotThread={selectedPlotThread}
        onSave={handleSavePlotThread}
      />

      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete Plot Thread?"
        description={`This will remove "${plotThreadToDelete?.description}" from your records. This cannot be undone.`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
