"use client"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DynamicFieldListProps {
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  label?: string
}

export function DynamicFieldList({
  values,
  onChange,
  placeholder = "Enter a value",
  label = "Items",
}: DynamicFieldListProps) {
  const handleAdd = () => {
    onChange([...values, ""])
  }

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index))
  }

  const handleChange = (index: number, value: string) => {
    const newValues = [...values]
    newValues[index] = value
    onChange(newValues)
  }

  // Ensure at least 3 empty fields initially
  const displayValues = values.length < 3 ? [...values, "", "", ""].slice(0, 3) : values

  return (
    <div className="space-y-3">
      {displayValues.map((value, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
            placeholder={placeholder}
            className="flex-1"
            aria-label={`${label} ${index + 1}`}
          />
          {values.length > 0 && index < values.length && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(index)}
              aria-label={`Remove ${label} ${index + 1}`}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="w-full bg-transparent">
        <Plus className="w-4 h-4 mr-2" />
        Add Rule
      </Button>
    </div>
  )
}
