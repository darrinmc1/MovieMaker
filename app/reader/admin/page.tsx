import { StatsCard } from "@/components/admin/stats-card"
import { QuickActionButton } from "@/components/admin/quick-action-button"
import { RecentNovelsTable } from "@/components/admin/recent-novels-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, FileText, MessageSquare, Eye, Plus } from "lucide-react"
import { getNovels } from "@/lib/novels-data"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getNeonClient } from "@/lib/neon/client"

export default async function AdminDashboard() {
  const novels = await getNovels()

  const sql = getNeonClient()

  const novelsResult = await sql`SELECT COUNT(*) as count FROM novels`
  const novelsCount = parseInt(novelsResult[0]?.count || "0", 10)

  const chaptersResult = await sql`SELECT COUNT(*) as count FROM chapters`
  const chaptersCount = parseInt(chaptersResult[0]?.count || "0", 10)

  const commentsCount = 0

  return (
    <>
      {/* Removed SidebarNav component and md:ml-64 margin since admin layout already provides sidebar */}
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Novels"
            value={novelsCount || 0}
            trend={{ value: 0, isPositive: true }}
            icon={<BookOpen className="h-5 w-5" />}
            iconColor="bg-purple-500"
          />
          <StatsCard
            title="Total Chapters"
            value={chaptersCount || 0}
            trend={{ value: 0, isPositive: true }}
            icon={<FileText className="h-5 w-5" />}
            iconColor="bg-blue-500"
          />
          <StatsCard
            title="Total Comments"
            value={commentsCount}
            trend={{ value: 0, isPositive: true }}
            icon={<MessageSquare className="h-5 w-5" />}
            iconColor="bg-green-500"
          />
          <StatsCard
            title="Views This Week"
            value="0"
            trend={{ value: 0, isPositive: true }}
            icon={<Eye className="h-5 w-5" />}
            iconColor="bg-amber-500"
          />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Novels - Quick Access</CardTitle>
            <Link href="/admin/novels">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {novels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800 mb-4">
                  <BookOpen className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">No novels yet</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Create your first novel to get started
                </p>
                <Link href="/admin/novels/new">
                  <Button>Create Novel</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {novels.map((novel) => (
                  <Link
                    key={novel.id}
                    href={`/admin/novels/${novel.id}/edit`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <BookOpen className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{novel.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {novel.progress.current}/{novel.progress.total || 0} chapters
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <p className="text-sm text-muted-foreground">
              To add chapters, characters, or manage comments for a specific novel, navigate to that novel's edit page
              above.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/admin/novels/new">
                <QuickActionButton icon={<Plus className="h-5 w-5" />} label="Create Novel" />
              </Link>
              <Link href="/admin/novels">
                <QuickActionButton icon={<BookOpen className="h-5 w-5" />} label="Manage Novels" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800 mb-4">
                  <FileText className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">No activity yet</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Start creating content to see activity here
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Novels Table */}
          <div className="lg:col-span-2">
            <RecentNovelsTable novels={novels} />
          </div>
        </div>
      </div>
    </>
  )
}
