import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { NovelCard } from "@/components/novel-card"
// import { ContinueReadingSection } from "@/components/continue-reading-section"
import { getNovels } from "@/lib/novels-data"

export default async function HomePage() {
  const novels = await getNovels()

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(220,38,38,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      <Header />
      <SidebarNav />

      <main className="md:ml-64 container mx-auto px-4 py-6 relative z-10">
        <section className="mb-8 text-center space-y-6 animate-in fade-in duration-500">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance tracking-tight bg-gradient-to-br from-purple-400 via-red-500 to-orange-500 bg-clip-text text-transparent drop-shadow-sm">
              The Concord of Nine
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-purple-500/50 to-purple-500" />
              <div className="h-2 w-2 rounded-full bg-gradient-to-br from-purple-500 to-red-500 shadow-lg shadow-purple-500/50" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent via-red-500/50 to-red-500" />
            </div>
          </div>
          <p className="text-lg md:text-xl text-slate-300 text-balance max-w-2xl mx-auto leading-relaxed animate-in fade-in duration-700 delay-150">
            An epic sword and sorcery saga. Follow along as each book comes to life, one chapter at a time.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm animate-in fade-in duration-700 delay-300 flex-wrap">
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-purple-500/10 border border-purple-500/30 text-purple-300 font-medium shadow-sm">
              <span className="text-purple-400">●</span> {novels.length} Books
            </span>
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-red-500/10 border border-red-500/30 text-red-300 font-medium shadow-sm">
              <span className="text-red-400">●</span> Epic Fantasy
            </span>
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-500/10 border border-orange-500/30 text-orange-300 font-medium shadow-sm">
              <span className="text-orange-400">●</span> Updates Weekly
            </span>
          </div>
        </section>

        {/* <ContinueReadingSection /> */}

        <section>
          {novels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {novels.map((novel, index) => (
                <div
                  key={novel.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
                >
                  <NovelCard {...novel} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No novels available yet.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
