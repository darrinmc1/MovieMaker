import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Sparkles, Clock, CheckCircle2 } from "lucide-react"

interface NovelCardProps {
  id: string
  title: string
  genre: string
  progress: { current: number; total: number }
  status: "In Progress" | "Complete" | "Not Started"
  coverImage?: string
  bookNumber?: number
}

export function NovelCard({ id, title, genre, progress, status, coverImage, bookNumber }: NovelCardProps) {
  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-2 border-2 border-slate-700/50 hover:border-purple-500/50 bg-slate-800/90 backdrop-blur-sm">
      <CardHeader className="p-0">
        <div className="aspect-[3/4] bg-gradient-to-br from-purple-900/40 via-red-900/30 to-orange-900/40 relative overflow-hidden">
          {bookNumber !== undefined && bookNumber > 0 && (
            <Badge className="absolute bottom-3 left-3 font-bold text-lg shadow-xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 text-purple-300 border-2 border-purple-500/50 backdrop-blur-sm z-10">
              Book {bookNumber}
            </Badge>
          )}
          <img
            src={
              coverImage ||
              `/placeholder.svg?height=400&width=300&query=${encodeURIComponent(title + " epic fantasy book cover sword sorcery") || "/placeholder.svg"}`
            }
            alt={`${title} cover`}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Badge
            className={`absolute top-3 right-3 font-semibold shadow-xl transition-all duration-300 border-0 ${
              status === "Complete"
                ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-emerald-500/50"
                : status === "In Progress"
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-blue-500/50 animate-pulse"
                  : "bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-slate-500/30"
            }`}
          >
            {status === "In Progress" && <Sparkles className="w-3 h-3 mr-1" />}
            {status === "Complete" && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {status === "Not Started" && <Clock className="w-3 h-3 mr-1" />}
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-lg leading-tight text-balance transition-colors group-hover:text-purple-400 text-slate-100">
            {title}
          </h3>
          <Badge
            variant="outline"
            className="shrink-0 bg-gradient-to-r from-purple-500/20 to-red-500/20 border-purple-500/40 text-purple-300 font-semibold"
          >
            {genre}
          </Badge>
        </div>
        {progress.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">
                Chapter {progress.current} of {progress.total}
              </span>
              <span className="text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="h-2.5 bg-slate-700/50 rounded-full overflow-hidden shadow-inner border border-slate-600/50">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-red-500 to-orange-500 transition-all duration-700 ease-out rounded-full shadow-lg shadow-purple-500/30"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-5 pt-0">
        {status === "Not Started" ? (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-center py-2">
              <Badge
                variant="secondary"
                className="text-sm font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-sm"
              >
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                Coming Soon
              </Badge>
            </div>
            <Button
              asChild
              variant="outline"
              className="w-full bg-transparent hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 hover:border-primary/50 hover:text-primary transition-all duration-300 font-semibold border-2 text-white"
            >
              <Link href={`/novel/${id}`}>
                <BookOpen className="mr-2 h-4 w-4" />
                See the Outline
              </Link>
            </Button>
          </div>
        ) : (
          <Button
            asChild
            className="w-full bg-gradient-to-r from-purple-600 via-red-600 to-purple-600 hover:from-purple-500 hover:via-red-500 hover:to-purple-500 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-purple-500/40 active:scale-[0.98] font-semibold text-white border-0"
          >
            <Link href={`/novel/${id}`}>
              <BookOpen className="mr-2 h-4 w-4" />
              Start Reading
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
