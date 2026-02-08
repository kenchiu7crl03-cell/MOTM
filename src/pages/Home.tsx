
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, ArrowRight, Check } from 'lucide-react'

interface Candidate {
    id: string
    name: string
    number: number
    avatar_url: string
    category_id: string
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
    const [currentVotes, setCurrentVotes] = useState<Record<string, string>>({}) // categoryId -> candidateId
    const [searchTerm, setSearchTerm] = useState('')
    const [voteStats, setVoteStats] = useState<Record<string, number>>({}) // candidateId -> count
    const [winners, setWinners] = useState<Record<string, string>>({}) // categoryId -> candidateId
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        let deviceId = localStorage.getItem('deviceId')
        if (!deviceId) {
            deviceId = crypto.randomUUID()
            localStorage.setItem('deviceId', deviceId)
        }
    }, [])

    useEffect(() => {
        fetchData()
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
        if (config) setVotingOpen(config.value)
    }

    const fetchUserVotes = async () => {
        const deviceId = localStorage.getItem('deviceId')
        if (!deviceId) return

        const { data: votes } = await supabase.from('votes').select('category_id, candidate_id').eq('device_id', deviceId)
        if (votes) {
            const votesMap: Record<string, string> = {}
            votes.forEach(v => votesMap[v.category_id] = v.candidate_id)
            setCurrentVotes(votesMap)
        }
    }

    useEffect(() => {
        if (votingOpen) fetchUserVotes()
    }, [votingOpen])

    const calculateWinners = async () => {
        const { data: stats } = await supabase.from('vote_stats').select('*')
        if (!stats) return

        const newStats: Record<string, number> = {}
        const categoryMax: Record<string, number> = {}
        const categoryWinner: Record<string, string> = {}

        stats.forEach((row: any) => {
            newStats[row.candidate_id] = (newStats[row.candidate_id] || 0) + row.vote_count
            const currentMax = categoryMax[row.category_id] || -1
            if (row.vote_count > currentMax) {
                categoryMax[row.category_id] = row.vote_count
                categoryWinner[row.category_id] = row.candidate_id
            }
        })
        setVoteStats(newStats)
        setWinners(categoryWinner)
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

            const { error } = await supabase.from('votes').upsert({
                voter_name: voterName.trim(),
                candidate_id: selectedCandidate.id,
                category_id: selectedCandidate.category_id,
                device_id: deviceId
            }, { onConflict: 'device_id, category_id' })

            if (error) throw error

            const isChange = !!currentVotes[selectedCandidate.category_id] && currentVotes[selectedCandidate.category_id] !== selectedCandidate.id
            setCurrentVotes(prev => ({ ...prev, [selectedCandidate.category_id]: selectedCandidate.id }))

            setNotification({
                type: 'success',
                message: isChange ? `Đã thay đổi bình chọn sang ${selectedCandidate.name}!` : `Đã bình chọn cho ${selectedCandidate.name}!`
            })
            setTimeout(() => setNotification(null), 3000)
            setSelectedCandidate(null)
        } catch (error: any) {
            setNotification({
                type: 'error',
                message: error.message || "Lỗi không xác định"
            })
            setTimeout(() => setNotification(null), 3000)
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

            <div className="max-w-5xl mx-auto space-y-16 relative z-10 px-4">
                {categories.map((cat) => {
                    const filteredCandidates = candidates.filter(c =>
                        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.number.toString().includes(searchTerm)
                    )

                    const sortedCandidates = !votingOpen
                        ? [...filteredCandidates].sort((a, b) => (voteStats[b.id] || 0) - (voteStats[a.id] || 0))
                        : filteredCandidates

                    if (sortedCandidates.length === 0) return null
                    const isExpanded = expandedCategory === cat.id

                    return (
                        <section key={cat.id} className="relative group bg-white/5 border border-white/10 rounded-3xl overflow-hidden transition-all hover:border-white/20">
                            <div
                                onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                                className="p-6 flex items-center justify-between cursor-pointer active:bg-white/5"
                            >
                                <div>
                                    <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase mb-1 block">GIẢI THƯỞNG</span>
                                    <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-wide text-white">{cat.name}</h2>
                                    <p className="text-white/40 text-sm mt-1">{sortedCandidates.length} Ứng cử viên</p>
                                </div>
                                <div className={`p-3 rounded-full bg-white/10 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-emerald-500/20 text-emerald-400' : 'text-white/60'}`}>
                                    <ArrowRight className="w-6 h-6 rotate-90" />
                                </div>
                            </div>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-6 pt-0 border-t border-white/5">
                                            <div className={`grid gap-3 pt-4 ${!votingOpen ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                                                {sortedCandidates.map((cand) => {
                                                    const isWinner = !votingOpen && winners[cat.id] === cand.id
                                                    const isSelected = currentVotes[cat.id] === cand.id

                                                    return (
                                                        <motion.div
                                                            layoutId={`card-${cand.id}-${cat.id}`}
                                                            key={cand.id}
                                                            whileHover={{ y: -2, scale: 1.01 }}
                                                            whileTap={{ scale: 0.99 }}
                                                            onClick={() => {
                                                                if (!votingOpen) return
                                                                setSelectedCandidate({ ...cand, category_id: cat.id })
                                                            }}
                                                            className={`relative group cursor-pointer overflow-hidden rounded-xl border transition-all duration-200 flex items-center p-3 gap-3 ${isWinner
                                                                    ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.3)] order-first'
                                                                    : isSelected
                                                                        ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                                                        : 'bg-black/20 border-white/5 hover:border-emerald-500/30'
                                                                }`}
                                                        >
                                                            <div className="relative shrink-0">
                                                                <div className={`rounded-full overflow-hidden bg-black/30 border-2 ${isWinner ? 'w-16 h-16 border-yellow-500' : 'w-12 h-12 ' + (isSelected ? 'border-emerald-500' : 'border-white/10')}`}>
                                                                    <img
                                                                        src={cand.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cand.name}`}
                                                                        className="w-full h-full object-cover"
                                                                        alt={cand.name}
                                                                    />
                                                                </div>
                                                                {isSelected && (
                                                                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-black rounded-full p-0.5 shadow-md border-2 border-[#121212]">
                                                                        <Check size={12} strokeWidth={4} />
                                                                    </div>
                                                                )}
                                                                {isWinner && (
                                                                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-tl shadow-sm">
                                                                        WIN
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <h3 className={`font-bold leading-tight truncate ${isWinner ? 'text-yellow-400 text-base' : isSelected ? 'text-emerald-400 text-sm' : 'text-white text-sm'}`}>
                                                                            {cand.name}
                                                                        </h3>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${isWinner ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/60'}`}>
                                                                                #{cand.number}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {!votingOpen ? (
                                                                        <div className="text-right">
                                                                            <div className={`text-xl font-black ${isWinner ? 'text-yellow-400' : 'text-white/20'}`}>
                                                                                {voteStats[cand.id] || 0}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 group-hover:border-emerald-500/50'}`}>
                                                                            {isSelected && <Check size={14} className="text-black" strokeWidth={3} />}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>
                    )
                })}
            </div>

            <AnimatePresence>
                {selectedCandidate && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-sm bg-[#1a1a1a] rounded-3xl p-6 border border-white/10 relative shadow-2xl"
                        >
                            <button onClick={() => setSelectedCandidate(null)} className="absolute top-4 right-4 text-white/50 hover:text-white p-2">
                                <X size={20} />
                            </button>

                            <div className="text-center mb-6">
                                <div className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-emerald-500/20 overflow-hidden bg-black/50">
                                    <img
                                        src={selectedCandidate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCandidate.name}`}
                                        className="w-full h-full object-cover"
                                        alt={selectedCandidate.name}
                                    />
                                </div>
                                <h3 className="text-2xl font-black uppercase italic text-white mb-1">{selectedCandidate.name}</h3>
                                <p className="text-emerald-400 font-bold">#{selectedCandidate.number}</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-white/40 uppercase mb-2 ml-1">Tên người bầu chọn</label>
                                    <input
                                        type="text"
                                        placeholder="Nhập tên của bạn..."
                                        value={voterName}
                                        onChange={(e) => setVoterName(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>

                                <button
                                    onClick={handleVote}
                                    disabled={!voterName.trim() || loading}
                                    className="w-full bg-emerald-500 text-black font-black py-4 rounded-xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2"
                                >
                                    {loading ? "Processing..." : (currentVotes[selectedCandidate.category_id] ? 'THAY ĐỔI BÌNH CHỌN' : 'XÁC NHẬN BÌNH CHỌN')}
                                    {!loading && <ArrowRight size={18} />}
                                </button>
                                <p className="text-center text-[10px] text-white/30 font-medium">Hệ thống sẽ lưu tên của bạn cho lần sau.</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/10"
                        style={{
                            background: notification.type === 'success'
                                ? 'linear-gradient(to right, rgba(16, 185, 129, 0.9), rgba(6, 95, 70, 0.9))'
                                : 'linear-gradient(to right, rgba(239, 68, 68, 0.9), rgba(153, 27, 27, 0.9))'
                        }}
                    >
                        <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-white/20' : 'bg-white/10'}`}>
                            {notification.type === 'success' ? <Trophy size={20} className="text-white" /> : <X size={20} className="text-white" />}
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-lg leading-tight">
                                {notification.type === 'success' ? 'Thành công!' : 'Lỗi!'}
                            </h4>
                            <p className="text-white/80 text-sm font-medium">{notification.message}</p>
                        </div>
                        <button onClick={() => setNotification(null)} className="ml-4 p-1 hover:bg-white/10 rounded-full transition-colors">
                            <X size={16} className="text-white/60" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
