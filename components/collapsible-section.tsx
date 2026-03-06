"use client"

import type React from "react"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmationModal } from "@/components/confirmation-modal"

interface CollapsibleSectionProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  variant?: "default" | "warning"
  requireConfirmation?: boolean
}

export function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
  variant = "default",
  requireConfirmation = false,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const bgColor = variant === "warning" ? "bg-destructive/10" : "bg-muted"
  const borderColor = variant === "warning" ? "border-destructive/20" : "border-border"

  const handleToggle = () => {
    if (!isOpen && requireConfirmation) {
      setShowConfirmation(true)
    } else {
      setIsOpen(!isOpen)
    }
  }

  const handleConfirm = () => {
    setIsOpen(true)
    setShowConfirmation(false)
  }

  return (
    <>
      <div className={`rounded-lg border ${borderColor} ${bgColor} overflow-hidden transition-all duration-200`}>
        <Button
          variant="ghost"
          className="w-full justify-between p-4 h-auto font-semibold hover:bg-muted/50 transition-colors"
          onClick={handleToggle}
        >
          <div className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {isOpen && (
          <div className="p-4 pt-0 text-sm leading-relaxed animate-in slide-in-from-top-2 duration-300">{children}</div>
        )}
      </div>

      {requireConfirmation && (
        <ConfirmationModal
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          onConfirm={handleConfirm}
          title="⚠️ Spoiler Warning"
          description="This section contains spoilers and hints about future events. Are you sure you want to continue?"
        />
      )}
    </>
  )
}
