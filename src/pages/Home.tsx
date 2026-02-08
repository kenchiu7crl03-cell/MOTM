
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, ArrowRight } from 'lucide-react'

interface Candidate {
    id: string
    name: string
    number: number
    avatar_url: string
    category_id?: string
}

interface Category {
    id: string
    name: string
}

export function Home() {
    const [categories, setCategories] = useState<Category[]>([])
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
    const [voterName, setVoterName] = useState(localStorage.getItem('voterName') || '')
    const [loading, setLoading] = useState(false)
    const [votingOpen, setVotingOpen] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [voteStats, setVoteStats] = useState<Record<string, number>>({}) // candidateId -> count
    const [winners, setWinners] = useState<Record<string, string>>({}) // categoryId -> candidateId (Winner)

    // Device ID Management
    useEffect(() => {
        let deviceId = localStorage.getItem('deviceId')
        if (!deviceId) {
            deviceId = crypto.randomUUID()
            localStorage.setItem('deviceId', deviceId)
        }
    }, [])

    useEffect(() => {
        fetchData()

        // Realtime subscription
        const subscription = supabase
            .channel('public:config')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'config', filter: 'key=eq.voting_active' }, (payload) => {
                setVotingOpen(payload.new.value)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(subscription)
        }
    }, [])

    useEffect(() => {
        // If voting is closed, fetch winners immediately
        if (!votingOpen) {
            calculateWinners()
        }
    }, [votingOpen])

    const fetchData = async () => {
        const { data: cats } = await supabase.from('categories').select('*').order('created_at')
        const { data: cands } = await supabase.from('candidates').select('*').order('number')
        const { data: config } = await supabase.from('config').select('value').eq('key', 'voting_active').single()

        if (cats) setCategories(cats)
        if (cands) setCandidates(cands)
        if (config) {
            setVotingOpen(config.value)
            if (!config.value) calculateWinners() // Also calculate on load if closed
        }
    }

    const calculateWinners = async () => {
        // Fetch stats securely (using our view)
        const { data: stats } = await supabase.from('vote_stats').select('*')
        if (!stats) return

        const newStats: Record<string, number> = {}
        const categoryMax: Record<string, number> = {}
        const categoryWinner: Record<string, string> = {}

        stats.forEach((row: any) => {
            newStats[row.candidate_id] = (newStats[row.candidate_id] || 0) + row.vote_count

            // Determine winner per category
            const currentMax = categoryMax[row.category_id] || -1
            if (row.vote_count > currentMax) {
                categoryMax[row.category_id] = row.vote_count
                categoryWinner[row.category_id] = row.candidate_id
            }
        })
        setVoteStats(newStats)
        setWinners(categoryWinner)

        // Celebrate!
        confetti({ particleCount: 300, spread: 100, origin: { y: 0.3 } })
    }

    const handleVote = async () => {
        if (!voterName.trim()) {
            alert("Vui lòng nhập tên của bạn!")
            return
        }
        if (!selectedCandidate) return

        setLoading(true)
        try {
            const deviceId = localStorage.getItem('deviceId')
            if (!deviceId) throw new Error("Lỗi thiết bị. Vui lòng thử lại!")

            // Upsert vote based on device_id and category_id
            // This will update the existing vote if user changes their mind
            const { error } = await supabase.from('votes').upsert({
                voter_name: voterName.trim(),
                candidate_id: selectedCandidate.id,
                category_id: selectedCandidate.category_id,
                device_id: deviceId
            }, { onConflict: 'device_id, category_id' })

            if (error) throw error

            localStorage.setItem('voterName', voterName.trim())
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#3b82f6'] })
            setSelectedCandidate(null)
            alert(`Đã gửi bình chọn cho ${selectedCandidate.name}!`)
        } catch (error: any) {
            alert(error.message || "Lỗi khi bình chọn")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-transparent p-4 pb-32 text-white font-sans selection:bg-emerald-500 selection:text-black">

            <header className="text-center py-8 relative z-10 px-4">
                <div className="inline-flex items-center justify-center p-2 mb-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
                    <Trophy className="w-4 h-4 text-yellow-400 mr-2" />
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/80">Official Voting</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 drop-shadow-2xl mb-2">
                    MAN OF THE MATCH
                </h1>

                {!votingOpen ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mt-6 p-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-3xl border border-yellow-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(234,179,8,0.2)]"
                    >
                        <h2 className="text-2xl font-black text-yellow-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                            <Trophy className="w-8 h-8" /> KẾT QUẢ CHÍNH THỨC
                        </h2>
                        <p className="text-white/70">Bình chọn đã kết thúc. Xin chúc mừng các cầu thủ chiến thắng!</p>
                    </motion.div>
                ) : (
                    <div className="mt-8 max-w-md mx-auto sticky top-4 z-40">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="🔍 Tìm tên hoặc số áo cầu thủ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black/60 backdrop-blur-md border border-white/20 rounded-full py-3 px-6 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xl transition-all"
                            />
                        </div>
                    </div>
                )}
            </header>

            {/* Categories */}
            <div className="max-w-5xl mx-auto space-y-16 relative z-10 px-4">
                {categories.map((cat, idx) => {
                    // Filter candidates based on search
                    const filteredCandidates = candidates.filter(c =>
                        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.number.toString().includes(searchTerm)
                    )

                    // If voting closed, sort by Winner first!
                    const sortedCandidates = !votingOpen
                        ? [...filteredCandidates].sort((a, b) => (voteStats[b.id] || 0) - (voteStats[a.id] || 0))
                        : filteredCandidates

                    if (sortedCandidates.length === 0) return null

                    return (
                        <section key={cat.id} className="relative group">
                            {/* Category Header */}
                            <div className="flex items-center gap-4 mb-6 sticky top-20 z-30 transition-all bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/5 shadow-lg mx-auto max-w-fit">
                                <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">GIẢI THƯỞNG</span>
                                <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-wide text-white">{cat.name}</h2>
                            </div>

                            {/* Candidates Grid/List */}
                            <div className={`grid gap-4 ${!votingOpen ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                                {sortedCandidates.map((cand, index) => {
                                    const isWinner = !votingOpen && winners[cat.id] === cand.id

                                    return (
                                        <motion.div
                                            layoutId={`card-${cand.id}-${cat.id}`} // Unique ID per category instance
                                            key={cand.id}
                                            whileHover={{ y: -2, scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => {
                                                if (!votingOpen) return
                                                setSelectedCandidate({ ...cand, category_id: cat.id })
                                            }}
                                            className={`
                    relative group cursor-pointer overflow-hidden rounded-2xl
                    bg-white/5 border
                    ${isWinner ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 shadow-[0_0_30px_rgba(234,179,8,0.3)] order-first' : 'border-white/10 hover:border-emerald-500/30'}
                    transition-all duration-200
                    flex items-center p-3 gap-4
                  `}
                                        >
                                            {/* Avatar Side */}
                                            <div className={`relative shrink-0 ${isWinner ? 'w-20 h-20' : 'w-16 h-16'} rounded-full overflow-hidden bg-black/30 border-2 ${isWinner ? 'border-yellow-500' : 'border-white/10'}`}>
                                                <img
                                                    src={cand.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cand.name}`}
                                                    className="w-full h-full object-cover"
                                                    alt={cand.name}
                                                />
                                                {isWinner && (
                                                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-tl-lg shadow-sm">
                                                        WINNER
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info Side */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className={`font-bold leading-tight truncate ${isWinner ? 'text-yellow-400 text-lg' : 'text-white text-base'}`}>
                                                            {cand.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${isWinner ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/60'}`}>
                                                                #{cand.number}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Right Action: Vote Button or Result */}
                                                    {!votingOpen ? (
                                                        <div className="text-right">
                                                            <div className={`text-2xl font-black ${isWinner ? 'text-yellow-400' : 'text-white/20'}`}>
                                                                {voteStats[cand.id] || 0}
                                                            </div>
                                                            <div className="text-[10px] uppercase font-bold text-white/30">Phiếu bầu</div>
                                                        </div>
                                                    ) : (
                                                        <button className="bg-emerald-500 text-black p-2 rounded-full hover:bg-emerald-400 transition-colors shadow-lg active:scale-90">
                                                            <ArrowRight size={20} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </section>
                    )
                })}
            </div>

            {/* Vote Modal */}
            <AnimatePresence>
                {selectedCandidate && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCandidate(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-md bg-[#121212] rounded-[40px] overflow-hidden border border-white/10 shadow-2xl relative z-10"
                        >
                            <button
                                onClick={() => setSelectedCandidate(null)}
                                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-white/10 rounded-full transition-colors z-20 text-white/50 hover:text-white"
                            >
                                <X size={24} />
                            </button>

                            {/* Modal Header */}
                            <div className="relative h-48 bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />

                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-24 h-24 rounded-full border-[4px] border-white/20 shadow-2xl overflow-hidden mb-2 bg-[#1a1a1a]">
                                        <img src={selectedCandidate.avatar_url} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 -mt-6 bg-[#121212] rounded-t-[32px] relative z-20">
                                <div className="text-center mb-6">
                                    <h2 className="text-3xl font-black text-white leading-none mb-1">{selectedCandidate.name}</h2>
                                    <p className="text-emerald-400 font-bold text-lg tracking-widest">#{selectedCandidate.number}</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white/5 rounded-2xl p-1 border border-white/10 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                                        <input
                                            autoFocus
                                            value={voterName}
                                            onChange={(e) => setVoterName(e.target.value)}
                                            placeholder="Nhập tên của bạn..."
                                            className="w-full bg-transparent text-white text-center font-bold text-xl py-4 placeholder:text-white/20 focus:outline-none"
                                            onKeyDown={(e) => e.key === 'Enter' && handleVote()}
                                        />
                                    </div>

                                    <button
                                        onClick={handleVote}
                                        disabled={loading || !voterName.trim()}
                                        className="w-full group bg-white hover:bg-emerald-400 text-black font-black py-4 rounded-2xl text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:scale-100 disabled:hover:bg-white"
                                    >
                                        {loading ? (
                                            "Processing..."
                                        ) : (
                                            <>GỬI BÌNH CHỌN <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                                        )}
                                    </button>

                                    <p className="text-center text-xs text-white/30 font-medium">Hệ thống sẽ lưu tên của bạn cho lần sau.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    )
}
