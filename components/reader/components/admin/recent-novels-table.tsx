import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Eye, Pencil } from "lucide-react"

interface Novel {
  id: string
  title: string
  cover: string
  status: "in-progress" | "completed" | "draft"
  chaptersWritten: number
  totalChapters: number
  lastUpdated: string
}

const statusColors = {
  "in-progress": "bg-blue-500",
  completed: "bg-green-500",
  draft: "bg-gray-500",
}

const statusLabels = {
  "in-progress": "In Progress",
  completed: "Completed",
  draft: "Draft",
}

interface RecentNovelsTableProps {
  novels?: Novel[]
}

export function RecentNovelsTable({ novels = [] }: RecentNovelsTableProps) {
  if (novels.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Novels</CardTitle>
          <Link href="/admin/novels" className="text-sm text-primary hover:underline">
            View All →
          </Link>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No novels yet</p>
            <Button className="mt-4" asChild>
              <Link href="/admin/novels/new">Create Your First Novel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Novels</CardTitle>
        <Link href="/admin/novels" className="text-sm text-primary hover:underline">
          View All →
        </Link>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-sm text-muted-foreground">
                <th className="pb-3 text-left font-medium">Novel</th>
                <th className="pb-3 text-left font-medium">Status</th>
                <th className="pb-3 text-left font-medium">Progress</th>
                <th className="pb-3 text-left font-medium">Last Updated</th>
                <th className="pb-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {novels.map((novel) => {
                const progress = (novel.chaptersWritten / novel.totalChapters) * 100
                return (
                  <tr key={novel.id} className="border-b last:border-0">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={novel.cover || "/placeholder.svg"}
                          alt={novel.title}
                          width={40}
                          height={60}
                          className="rounded object-cover"
                        />
                        <span className="font-medium">{novel.title}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge className={statusColors[novel.status]}>{statusLabels[novel.status]}</Badge>
                    </td>
                    <td className="py-4">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">
                          {novel.chaptersWritten}/{novel.totalChapters} chapters
                        </div>
                        <Progress value={progress} className="h-2 w-32" />
                      </div>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">{novel.lastUpdated}</td>
                    <td className="py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/novels/${novel.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/novel/${novel.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-4 md:hidden">
          {novels.map((novel) => {
            const progress = (novel.chaptersWritten / novel.totalChapters) * 100
            return (
              <Card key={novel.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Image
                      src={novel.cover || "/placeholder.svg"}
                      alt={novel.title}
                      width={60}
                      height={90}
                      className="rounded object-cover"
                    />
                    <div className="flex-1 space-y-2">
                      <h3 className="font-medium">{novel.title}</h3>
                      <Badge className={statusColors[novel.status]}>{statusLabels[novel.status]}</Badge>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">
                          {novel.chaptersWritten}/{novel.totalChapters} chapters
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <div className="text-xs text-muted-foreground">{novel.lastUpdated}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/novels/${novel.id}/edit`}>
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/novel/${novel.id}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
