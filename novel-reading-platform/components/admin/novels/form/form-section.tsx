import type React from "react"
interface FormSectionProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, children, className = "" }: FormSectionProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
      {children}
    </div>
  )
}
