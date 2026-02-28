import { NovelCard } from "./novel-card"
import type { Novel } from "@/types/novel"

interface NovelGridViewProps {
  novels: Novel[]
  onEdit: (id: string) => void
  onView: (id: string) => void
  onDelete: (id: string) => void
}

export function NovelGridView({ novels, onEdit, onView, onDelete }: NovelGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {novels.map((novel) => (
        <NovelCard
          key={novel.id}
          novel={novel}
          onEdit={() => onEdit(novel.id)}
          onView={() => onView(novel.id)}
          onDelete={() => onDelete(novel.id)}
        />
      ))}
    </div>
  )
}
