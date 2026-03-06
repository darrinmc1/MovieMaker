"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, GitBranch } from "lucide-react"
import type { PlotThread } from "@/types/chapter-form"

interface PlotThreadCheckboxProps {
  plotThreads: PlotThread[]
  selectedThreads: string[]
  onChange: (threadIds: string[]) => void
}

export function PlotThreadCheckbox({ plotThreads, selectedThreads, onChange }: PlotThreadCheckboxProps) {
  const handleToggle = (threadId: string) => {
    if (selectedThreads.includes(threadId)) {
      onChange(selectedThreads.filter((id) => id !== threadId))
    } else {
      onChange([...selectedThreads, threadId])
    }
  }

  if (plotThreads.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed rounded-lg">
        <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">No plot threads added yet.</p>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add New Plot Thread
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-3 mb-4">
        {plotThreads.map((thread) => (
          <label
            key={thread.id}
            className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <Checkbox
              checked={selectedThreads.includes(thread.id)}
              onCheckedChange={() => handleToggle(thread.id)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm mb-2 line-clamp-2">{thread.description}</div>
              <div className="flex gap-2">
                <Badge variant={thread.status === "active" ? "default" : "secondary"}>{thread.status}</Badge>
                <Badge variant={thread.importance === "major" ? "default" : "outline"}>{thread.importance}</Badge>
              </div>
            </div>
          </label>
        ))}
      </div>
      <Button variant="outline" size="sm" type="button">
        <Plus className="h-4 w-4 mr-2" />
        Add New Plot Thread
      </Button>
    </div>
  )
}
