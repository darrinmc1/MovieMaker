import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface CharacterCardProps {
  name: string
  role: "Protagonist" | "Antagonist" | "Supporting"
  description: string
  traits: string[]
  firstAppearance: number
}

export function CharacterCard({ name, role, description, traits, firstAppearance }: CharacterCardProps) {
  const roleColors = {
    Protagonist: "bg-primary text-primary-foreground",
    Antagonist: "bg-destructive text-destructive-foreground",
    Supporting: "bg-secondary text-secondary-foreground",
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            <Badge className={roleColors[role]}>{role}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        <div className="flex flex-wrap gap-2">
          {traits.map((trait) => (
            <Badge key={trait} variant="outline" className="text-xs">
              {trait}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">First appears in Chapter {firstAppearance}</p>
      </CardContent>
    </Card>
  )
}
