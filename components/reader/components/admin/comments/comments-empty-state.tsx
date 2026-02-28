import { MessageSquare, CheckCircle, Flag } from "lucide-react"

interface CommentsEmptyStateProps {
  type: "all" | "pending" | "approved" | "flagged"
}

export function CommentsEmptyState({ type }: CommentsEmptyStateProps) {
  const states = {
    all: {
      icon: MessageSquare,
      title: "No comments yet",
      description: "Comments from readers will appear here",
    },
    pending: {
      icon: CheckCircle,
      title: "All caught up!",
      description: "No comments pending approval",
    },
    approved: {
      icon: CheckCircle,
      title: "No approved comments",
      description: "Approved comments will appear here",
    },
    flagged: {
      icon: Flag,
      title: "No flagged comments",
      description: "Flagged comments will appear here for review",
    },
  }

  const state = states[type]
  const Icon = state.icon

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{state.title}</h3>
      <p className="text-gray-600 max-w-sm">{state.description}</p>
    </div>
  )
}
