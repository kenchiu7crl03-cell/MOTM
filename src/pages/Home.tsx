
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
            localStorage.setItem('voterName', voterName.trim()) // Save for next time

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
        <div className="min-h-screen bg-[#050505] text-white font-['Inter'] selection:bg-emerald-500 selection:text-black overflow-x-hidden">
            {/* Animated Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <header className="text-center py-12 relative z-10 px-4">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl"
                >
                    <Trophy className="w-4 h-4 text-emerald-400 mr-2" />
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase text-emerald-400/80">Premium Voting System</span>
                </motion.div>

                <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter font-['Outfit'] leading-none">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-400 to-blue-500 drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                        MAN OF THE MATCH
                    </span>
                </h1>

                {!votingOpen ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mt-10 max-w-2xl mx-auto p-1 rounded-[2.5rem] bg-gradient-to-r from-yellow-500/50 via-orange-500/50 to-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.2)]"
                    >
                        <div className="p-8 bg-[#0a0a0a] rounded-[2.4rem] backdrop-blur-3xl">
                            <h2 className="text-3xl font-black text-yellow-400 uppercase tracking-tighter font-['Outfit'] mb-2 flex items-center justify-center gap-3">
                                <Trophy className="w-10 h-10" /> KẾT QUẢ CHÍNH THỨC
                            </h2>
                            <p className="text-white/60 font-medium">Cổng bình chọn đã đóng. Dưới đây là bảng xếp hạng cuối cùng.</p>
                        </div>
                    </motion.div>
                ) : (
                    <div className="mt-10 max-w-xl mx-auto sticky top-6 z-40 px-4">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 text-xl">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Tìm tên hoặc số áo cầu thủ..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 shadow-2xl transition-all font-medium text-lg"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <div className="max-w-6xl mx-auto space-y-20 relative z-10 px-4 pb-20">
                {categories.map((cat) => {
                    const filteredCandidates = candidates.filter(c =>
                        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.number.toString().includes(searchTerm)
                    )

                    const sortedCandidates = !votingOpen
                        ? [...filteredCandidates].sort((a, b) => (voteStats[b.id] || 0) - (voteStats[a.id] || 0))
                        : filteredCandidates

                    if (sortedCandidates.length === 0) return null
                    const isExpanded = expandedCategory === cat.id || searchTerm.length > 0

                    return (
                        <section key={cat.id} className="relative">
                            <div
                                onClick={() => setExpandedCategory(isExpanded && searchTerm.length === 0 ? null : cat.id)}
                                className="group cursor-pointer mb-8"
                            >
                                <div className="flex items-end justify-between border-b border-white/10 pb-4 group-hover:border-emerald-500/30 transition-colors">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="h-px w-8 bg-emerald-500"></div>
                                            <span className="text-[10px] font-black text-emerald-400 tracking-[0.4em] uppercase">Category</span>
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-['Outfit'] text-white group-hover:text-emerald-400 transition-colors">
                                            {cat.name}
                                        </h2>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 transition-all duration-500 ${isExpanded ? 'rotate-180 bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : ''}`}>
                                            <ArrowRight className="w-6 h-6 rotate-90" />
                                        </div>
                                        <p className="text-white/30 text-xs font-bold mt-2 tracking-widest uppercase">{sortedCandidates.length} Candidates</p>
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                        className="overflow-hidden"
                                    >
                                        <div className={`grid gap-4 pt-4 ${!votingOpen ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                                            {sortedCandidates.map((cand, idx) => {
                                                const isWinner = !votingOpen && winners[cat.id] === cand.id
                                                const isSelected = currentVotes[cat.id] === cand.id

                                                return (
                                                    <motion.div
                                                        layoutId={`card-${cand.id}-${cat.id}`}
                                                        key={cand.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        whileHover={{ y: -5, scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => {
                                                            if (!votingOpen) return
                                                            setSelectedCandidate({ ...cand, category_id: cat.id })
                                                        }}
                                                        className={`relative group p-4 rounded-2xl border backdrop-blur-md transition-all duration-500 flex items-center gap-4 ${isWinner
                                                                ? 'bg-gradient-to-br from-yellow-500/20 via-orange-500/10 to-transparent border-yellow-500/50 shadow-[0_10px_40px_rgba(234,179,8,0.2)] order-first md:col-span-2 py-8 px-8'
                                                                : isSelected
                                                                    ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                                                                    : 'bg-white/5 border-white/5 hover:border-white/20'
                                                            }`}
                                                    >
                                                        {/* Avatar Section */}
                                                        <div className="relative shrink-0">
                                                            <div className={`relative rounded-2xl overflow-hidden bg-black/40 border-2 transition-all duration-500 ${isWinner ? 'w-24 h-24 rotate-3' : 'w-14 h-14 ' + (isSelected ? 'border-emerald-500' : 'border-white/10')}`}>
                                                                <img
                                                                    src={cand.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cand.name}`}
                                                                    className="w-full h-full object-cover"
                                                                    alt={cand.name}
                                                                />
                                                                {isWinner && <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent" />}
                                                            </div>
                                                            {isSelected && (
                                                                <motion.div
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    className="absolute -top-2 -right-2 bg-emerald-500 text-black rounded-lg p-1 shadow-2xl border-2 border-[#121212]"
                                                                >
                                                                    <Check size={14} strokeWidth={4} />
                                                                </motion.div>
                                                            )}
                                                            {isWinner && (
                                                                <div className="absolute -bottom-3 -left-3 bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded-full shadow-2xl border-2 border-black -rotate-12">
                                                                    WINNER
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Text Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div>
                                                                    <h3 className={`font-black uppercase italic font-['Outfit'] truncate tracking-tight transition-colors ${isWinner ? 'text-3xl text-yellow-500' : isSelected ? 'text-xl text-emerald-400' : 'text-lg text-white'}`}>
                                                                        {cand.name}
                                                                    </h3>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest ${isWinner ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/50'}`}>
                                                                            PLAYER #{cand.number}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {!votingOpen ? (
                                                                    <div className="text-right">
                                                                        <div className={`text-4xl font-black font-['Outfit'] drop-shadow-lg ${isWinner ? 'text-yellow-400' : 'text-white/20'}`}>
                                                                            {voteStats[cand.id] || 0}
                                                                        </div>
                                                                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Votes</p>
                                                                    </div>
                                                                ) : (
                                                                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-emerald-500 border-emerald-500 rotate-12 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-white/10 p-2 group-hover:border-emerald-500/50'}`}>
                                                                        {isSelected ? <Check size={18} className="text-black" strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-white/10" />}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Winner Particle Effect Overlay */}
                                                        {isWinner && (
                                                            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl opacity-50">
                                                                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 blur-3xl -translate-y-1/2 translate-x-1/2" />
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>
                    )
                })}
            </div>

            {/* Premium Vote Modal */}
            <AnimatePresence>
                {selectedCandidate && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCandidate(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-md bg-[#0a0a0a] rounded-[2.5rem] p-8 border border-white/10 relative shadow-[0_20px_100px_rgba(0,0,0,0.8)] overflow-hidden"
                        >
                            {/* Modal Background Glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-emerald-500/20 blur-[100px] pointer-events-none" />

                            <button onClick={() => setSelectedCandidate(null)} className="absolute top-6 right-6 text-white/40 hover:text-white p-2 hover:bg-white/5 rounded-full transition-all">
                                <X size={24} />
                            </button>

                            <div className="text-center mb-8 relative">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="w-28 h-28 rounded-3xl mx-auto mb-6 p-1 bg-gradient-to-br from-emerald-500 to-blue-600 shadow-2xl rotate-3"
                                >
                                    <div className="w-full h-full rounded-2xl overflow-hidden bg-black">
                                        <img
                                            src={selectedCandidate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCandidate.name}`}
                                            className="w-full h-full object-cover"
                                            alt={selectedCandidate.name}
                                        />
                                    </div>
                                </motion.div>
                                <h3 className="text-4xl font-black uppercase italic font-['Outfit'] text-white mb-2 leading-none">{selectedCandidate.name}</h3>
                                <p className="text-emerald-400 font-black tracking-[0.3em] uppercase text-xs">Squad Number #{selectedCandidate.number}</p>
                            </div>

                            <div className="space-y-6 relative">
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Identified Voter Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your name..."
                                        value={voterName}
                                        onChange={(e) => setVoterName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-white/10 focus:outline-none focus:border-emerald-500/50 transition-all font-bold text-lg"
                                    />
                                </div>

                                <button
                                    onClick={handleVote}
                                    disabled={!voterName.trim() || loading}
                                    className="w-full relative group h-20 overflow-hidden rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 transition-transform group-hover:scale-105" />
                                    <div className="relative flex items-center justify-center gap-3 text-black font-black uppercase tracking-tighter text-xl italic font-['Outfit']">
                                        {loading ? "Transmitting..." : (currentVotes[selectedCandidate.category_id] ? 'Update Vote' : 'Confirm Selection')}
                                        {!loading && <ArrowRight size={24} strokeWidth={3} />}
                                    </div>
                                </button>

                                <p className="text-center text-[10px] text-white/20 font-black tracking-widest uppercase">Secured by Wecat Choice System</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Notification Popup */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 px-8 py-5 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] backdrop-blur-3xl border border-white/10"
                        style={{
                            background: notification.type === 'success'
                                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(4, 120, 87, 0.9))'
                                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(185, 28, 28, 0.9))'
                        }}
                    >
                        <div className="p-3 bg-white/20 rounded-2xl">
                            {notification.type === 'success' ? <Trophy size={24} className="text-white" /> : <X size={24} className="text-white" />}
                        </div>
                        <div>
                            <h4 className="font-black text-white text-xl font-['Outfit'] leading-tight uppercase italic">
                                {notification.type === 'success' ? 'Synchronized!' : 'Alert!'}
                            </h4>
                            <p className="text-white/80 text-sm font-bold tracking-tight">{notification.message}</p>
                        </div>
                        <button onClick={() => setNotification(null)} className="ml-4 p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X size={20} className="text-white/60" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
