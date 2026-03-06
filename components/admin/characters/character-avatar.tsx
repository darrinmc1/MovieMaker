import Image from "next/image"

interface CharacterAvatarProps {
  name: string
  portraitUrl?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "w-10 h-10 text-sm",
  md: "w-12 h-12 text-base",
  lg: "w-16 h-16 text-xl",
}

const colors = [
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-teal-500",
]

export function CharacterAvatar({ name, portraitUrl, size = "md" }: CharacterAvatarProps) {
  const initial = name.charAt(0).toUpperCase()
  const colorIndex = name.charCodeAt(0) % colors.length
  const bgColor = colors[colorIndex]

  if (portraitUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden relative flex-shrink-0`}>
        <Image src={portraitUrl || "/placeholder.svg"} alt={name} fill className="object-cover" />
      </div>
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
    >
      {initial}
    </div>
  )
}
