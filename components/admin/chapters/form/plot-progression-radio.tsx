"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { PlotThread } from "@/types/chapter-form"

interface PlotProgressionRadioProps {
  plotThread: PlotThread
  value: "introduced" | "advanced" | "resolved" | "referenced"
  onChange: (value: "introduced" | "advanced" | "resolved" | "referenced") => void
}

export function PlotProgressionRadio({ plotThread, value, onChange }: PlotProgressionRadioProps) {
  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <div className="font-medium text-sm mb-3 line-clamp-1">{plotThread.description}</div>
      <RadioGroup value={value} onValueChange={onChange} className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="introduced" id={`${plotThread.id}-introduced`} />
          <Label htmlFor={`${plotThread.id}-introduced`} className="cursor-pointer">
            Introduced
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="advanced" id={`${plotThread.id}-advanced`} />
          <Label htmlFor={`${plotThread.id}-advanced`} className="cursor-pointer">
            Advanced
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="resolved" id={`${plotThread.id}-resolved`} />
          <Label htmlFor={`${plotThread.id}-resolved`} className="cursor-pointer">
            Resolved
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="referenced" id={`${plotThread.id}-referenced`} />
          <Label htmlFor={`${plotThread.id}-referenced`} className="cursor-pointer">
            Referenced
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}
