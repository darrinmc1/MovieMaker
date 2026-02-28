"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ReactNode } from "react"

interface QuickActionButtonProps {
  icon: ReactNode
  label: string
  onClick?: () => void
  badge?: number
}

export function QuickActionButton({ icon, label, onClick, badge }: QuickActionButtonProps) {
  return (
    <Button
      variant="outline"
      className="relative h-auto flex-col gap-3 p-6 hover:bg-primary/5 hover:border-primary bg-transparent"
      onClick={onClick}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
          {badge}
        </Badge>
      )}
    </Button>
  )
}
