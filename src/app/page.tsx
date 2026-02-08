import { createClient } from "@/lib/supabase/server"
import { VotingGrid } from "@/components/VotingGrid"
import { Trophy, Clock, LogOut, ArrowRight } from "lucide-react"
import Link from "next/link"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export default async function Home() {
  const supabase = await createClient()

  // Get categories and candidates
  const { data: categories } = await supabase.from('categories').select('*').order('created_at', { ascending: true })
  const { data: candidates } = await supabase.from('candidates').select('*').order('number', { ascending: true })

  // Check voting status config
  const { data: config } = await supabase.from('config').select('*').eq('key', 'voting_active').single()
  const isVotingOpen = config?.value ?? true

  // Get user's cookie (if they voted before, we remember their name)
  const cookieStore = await cookies()
  const voterName = cookieStore.get('voterName')?.value

  let userVotes: any[] = []
  if (voterName) {
    const { data } = await supabase.from('votes').select('category_id, candidate_id').eq('voter_name', voterName)
    if (data) userVotes = data
  }

  const hasData = categories && categories.length > 0 && candidates && candidates.length > 0

  return (
    <main className="min-h-screen text-white overflow-x-hidden selection:bg-emerald-500 selection:text-black">
      {/* --- Aurora Background --- */}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-black">
        <div className="aurora-orb orb-1" />
        <div className="aurora-orb orb-2" />
        <div className="aurora-orb orb-3" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[20px]" /> {/* Extra blur for subtle look */}
      </div>

      {/* --- Navbar --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex items-center justify-between pointer-events-none">
        <div className="glass-morphism rounded-full px-5 py-2 flex items-center gap-3 pointer-events-auto transition-transform hover:scale-105 cursor-default box-shadow-xl">
          <div className="bg-emerald-500 rounded-full p-1 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            <Trophy className="w-4 h-4 text-black fill-black" />
          </div>
          <span className="font-black tracking-tight text-sm text-white uppercase">MOTM<span className="text-emerald-400">VOTE</span></span>
        </div>

        {/* Only show Admin link if needed, keep it subtle */}
        <Link href="/admin/results" className="pointer-events-auto opacity-60 hover:opacity-100 transition-opacity p-2 group">
          <div className="w-10 h-10 rounded-full glass-morphism flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <span className="text-xs font-bold text-emerald-400">A</span>
          </div>
        </Link>
      </nav>

      {/* --- Hero Section --- */}
      <div className="relative pt-36 pb-16 px-6 text-center z-10">
        {!isVotingOpen && (
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-2 rounded-full mb-8 font-bold text-xs tracking-[0.2em] uppercase backdrop-blur-md shadow-lg animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_red]" />
            Bình chọn đã đóng
          </div>
        )}

        <h1 className="text-6xl sm:text-8xl md:text-9xl font-black mb-8 tracking-tighter leading-[0.85] drop-shadow-2xl">
          <span className="text-white block">MAN OF</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-cyan-400 block filter drop-shadow-[0_0_30px_rgba(52,211,153,0.3)]">
            THE MATCH
          </span>
        </h1>

        <p className="text-white/70 max-w-lg mx-auto text-lg font-medium leading-relaxed backdrop-blur-sm rounded-2xl p-4 border border-white/5 bg-black/20">
          Hãy bình chọn cho cầu thủ xuất sắc nhất trận đấu.
          <br />
          <span className="text-emerald-400 text-sm mt-2 block font-bold tracking-widest uppercase">
            {voterName ? `Xin chào, ${voterName}` : "Chạm vào thẻ cầu thủ để bắt đầu"}
          </span>
        </p>
      </div>

      {/* --- Main Content --- */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 space-y-24 relative z-10 pb-40">
        {!hasData ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white/5 backdrop-blur-lg rounded-[40px] border border-white/10 mx-auto max-w-2xl px-6">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
              <Trophy className="w-10 h-10 text-emerald-500/50" />
            </div>
            <h2 className="text-3xl font-bold">Chưa có dữ liệu bình chọn</h2>
            <p className="text-gray-400 max-w-md">
              Hiện tại chưa có giải đấu hoặc cầu thủ nào được thêm vào hệ thống.
            </p>
            <Link
              href="/admin/manage"
              className="mt-4 inline-flex items-center gap-2 bg-white text-black font-black px-8 py-4 rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:-translate-y-1"
            >
              Thêm Dữ Liệu Ngay <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          categories?.map((category: any, index: number) => (
            <section key={category.id} className="relative group">
              {/* Category Header with Glass effect */}
              <div className="sticky top-24 z-30 mb-8 px-4 py-3 glass-morphism rounded-2xl flex items-center justify-between shadow-2xl transition-all duration-300 group-hover:border-emerald-500/30">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic text-white flex items-center gap-3">
                  <span className="text-emerald-500 text-3xl">/</span>
                  {category.name}
                </h2>
                <span className="text-xs font-bold text-white/40 tracking-[0.2em] bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  CATEGORY {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <VotingGrid
                candidates={candidates || []}
                categoryId={category.id}
                disabled={!isVotingOpen}
                votedCandidateId={userVotes?.find((v: any) => v.category_id === category.id)?.candidate_id}
                initialVoterName={voterName}
              />
            </section>
          ))
        )}
      </div>

      <footer className="fixed bottom-6 left-0 right-0 text-center pointer-events-none z-0">
        <p className="text-white/10 text-[10px] uppercase tracking-[0.3em] font-bold">
          System v2.0 &copy; 2026
        </p>
      </footer>
    </main>
  )
}
