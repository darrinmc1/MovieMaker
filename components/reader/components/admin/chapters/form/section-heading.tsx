"use client"

import type React from "react"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SectionHeadingProps {
  title: string
  optional?: boolean
  collapsible?: boolean
  defaultOpen?: boolean
  children: React.ReactNode
}

export function SectionHeading({ title, optional, collapsible, defaultOpen = true, children }: SectionHeadingProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  if (!collapsible) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {title}
          {optional && <span className="text-gray-500 font-normal ml-2">(Optional)</span>}
        </h2>
        {children}
      </div>
    )
  }

  return (
    <div className="mb-8">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left mb-4 hover:text-indigo-600 transition-colors"
      >
        <h2 className="text-lg font-semibold text-gray-900">
          {title}
          {optional && <span className="text-gray-500 font-normal ml-2">(Optional)</span>}
        </h2>
        <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  )
}
