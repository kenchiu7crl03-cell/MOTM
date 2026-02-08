
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, AlertTriangle, ArrowRight, Check } from 'lucide-react'

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

    const fetchData = async () => {
        const { data: cats } = await supabase.from('categories').select('*').order('created_at')
        const { data: cands } = await supabase.from('candidates').select('*').order('number')
        const { data: config } = await supabase.from('config').select('value').eq('key', 'voting_active').single()

        if (cats) setCategories(cats)
        if (cands) setCandidates(cands)
        if (config) setVotingOpen(config.value)
    }

    const handleVote = async () => {
        if (!voterName.trim()) {
            alert("Vui lòng nhập tên của bạn!")
            return
        }
        if (!selectedCandidate) return

        setLoading(true)
        try {
            // 1. Check if name already voted for this category
            const { data: existingVote } = await supabase
                .from('votes')
                .select('id')
                .eq('voter_name', voterName.trim())
                .eq('category_id', selectedCandidate.category_id)
                .single()

            if (existingVote) {
                throw new Error(`Bạn (${voterName}) đã bình chọn cho giải này rồi!`)
            }

            // 2. Insert vote
            const { error } = await supabase.from('votes').insert({
                voter_name: voterName.trim(),
                candidate_id: selectedCandidate.id,
                category_id: selectedCandidate.category_id
            })

            if (error) {
                if (error.code === '23505') throw new Error('Bạn đã bình chọn cho giải này rồi!')
                throw error
            }

            localStorage.setItem('voterName', voterName.trim())
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#3b82f6'] })
            setSelectedCandidate(null)
            alert(`Đã bình chọn cho ${selectedCandidate.name} thành công!`)
        } catch (error: any) {
            alert(error.message || "Lỗi khi bình chọn")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-transparent p-4 pb-32 text-white font-sans selection:bg-emerald-500 selection:text-black">

            {/* Header */}
            <header className="text-center py-12 relative z-10">
                <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
                    <Trophy className="w-5 h-5 text-yellow-400 mr-2" />
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/80">Official Voting</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 drop-shadow-2xl">
                    MAN OF THE MATCH
                </h1>
                <p className="text-white/60 mt-4 text-lg font-medium max-w-lg mx-auto leading-relaxed">
                    Bình chọn cầu thủ xuất sắc nhất trận đấu.
                </p>

                {!votingOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 mt-6 bg-red-500/10 text-red-400 px-6 py-3 rounded-full font-bold border border-red-500/20 backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                    >
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        ĐÃ ĐÓNG BÌNH CHỌN
                    </motion.div>
                )}
            </header>

            {/* Categories */}
            <div className="max-w-7xl mx-auto space-y-24 relative z-10">
                {categories.map((cat, idx) => (
                    <section key={cat.id} className="relative group">
                        <div className="flex items-center gap-4 mb-8 sticky top-4 z-30 transition-all">
                            <div className="bg-black/40 backdrop-blur-2xl px-6 py-3 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4">
                                <span className="text-sm font-bold text-emerald-400 tracking-widest uppercase">Category 0{idx + 1}</span>
                                <div className="h-4 w-px bg-white/20" />
                                <h2 className="text-2xl font-black uppercase italic tracking-wide text-white">{cat.name}</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-2">
                            {candidates.map(cand => (
                                <motion.div
                                    layoutId={`card-${cand.id}`}
                                    key={cand.id}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        if (!votingOpen) return
                                        setSelectedCandidate({ ...cand, category_id: cat.id })
                                    }}
                                    className={`
                    relative group cursor-pointer overflow-hidden rounded-[32px] 
                    bg-gradient-to-b from-white/10 to-white/5 
                    border border-white/10 shadow-lg 
                    hover:shadow-[0_10px_40px_rgba(16,185,129,0.2)] 
                    hover:border-emerald-500/50 
                    transition-all duration-300
                    ${!votingOpen ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                  `}
                                >
                                    {/* Image Container */}
                                    <div className="aspect-[3/4] relative overflow-hidden">
                                        <img
                                            src={cand.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cand.name}`}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            alt={cand.name}
                                        />

                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                                        {/* Number Background */}
                                        <div className="absolute top-2 right-4 text-6xl font-black text-white/5 leading-none select-none group-hover:text-emerald-500/20 transition-colors duration-300">
                                            {cand.number}
                                        </div>

                                        {/* Content */}
                                        <div className="absolute bottom-0 left-0 right-0 p-5">
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <h3 className="text-xl font-bold leading-tight text-white drop-shadow-md group-hover:text-emerald-400 transition-colors">{cand.name}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="px-2 py-0.5 rounded bg-emerald-500 text-black text-xs font-black">#{cand.number}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                ))}
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
