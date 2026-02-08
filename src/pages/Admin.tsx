
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Shield, Lock, LogOut, Plus, Trash2, Edit2,
    BarChart, Activity, RefreshCw, AlertTriangle
} from 'lucide-react'

// --- Components ---

function Login({ onLogin }: { onLogin: () => void }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
        } else {
            onLogin()
        }
        setLoading(false)
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-black text-white p-4">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-md bg-[#121212] border border-white/10 rounded-[32px] p-8 shadow-2xl"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4 text-emerald-500">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-3xl font-black italic tracking-tighter">ADMIN ACCESS</h1>
                    <p className="text-white/40 mt-2">Đăng nhập để quản lý hệ thống</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-white/30 mb-1 ml-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 placeholder:text-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
                            placeholder="admin@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-white/30 mb-1 ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 placeholder:text-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm font-medium flex items-center gap-2">
                            <AlertTriangle size={16} /> {error}
                        </div>
                    )}

                    <button
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                    >
                        {loading ? "Verifying..." : "LOGIN DASHBOARD"}
                    </button>
                </form>
            </motion.div>
        </div>
    )
}

export function Admin() {
    const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Data
    const [categories, setCategories] = useState<any[]>([])
    const [candidates, setCandidates] = useState<any[]>([])
    const [isVotingActive, setIsVotingActive] = useState(true)

    // Modals
    const [showAddCat, setShowAddCat] = useState(false)
    const [newCatName, setNewCatName] = useState('')

    const [showAddCand, setShowAddCand] = useState(false)
    const [newCand, setNewCand] = useState({ name: '', number: '', avatar_url: '' })

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setLoading(false)
            if (session) fetchData()
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            if (session) fetchData()
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchData = async () => {
        const { data: cats } = await supabase.from('categories').select('*').order('created_at')
        const { data: cands } = await supabase.from('candidates').select('*').order('number')
        const { data: config } = await supabase.from('config').select('value').eq('key', 'voting_active').single()

        if (cats) setCategories(cats)
        if (cands) setCandidates(cands)
        if (config) setIsVotingActive(config.value)
    }

    // --- Actions ---

    const handleLogout = async () => {
        await supabase.auth.signOut()
    }

    const toggleVoting = async () => {
        const newState = !isVotingActive
        const { error } = await supabase.from('config').upsert({ key: 'voting_active', value: newState })
        if (!error) setIsVotingActive(newState)
    }

    const handleAddCategory = async () => {
        if (!newCatName) return
        const { error } = await supabase.from('categories').insert({ name: newCatName })
        if (!error) {
            setNewCatName('')
            setShowAddCat(false)
            fetchData()
        }
    }

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Xóa giải này sẽ xóa luôn các phiếu bầu. Tiếp tục?")) return
        await supabase.from('categories').delete().eq('id', id)
        fetchData()
    }

    const handleAddCandidate = async () => {
        if (!newCand.name || !newCand.number) return
        const { error } = await supabase.from('candidates').insert({
            name: newCand.name,
            number: parseInt(newCand.number),
            avatar_url: newCand.avatar_url || null
        })
        if (!error) {
            setNewCand({ name: '', number: '', avatar_url: '' })
            setShowAddCand(false)
            fetchData()
        }
    }

    const handleDeleteCandidate = async (id: string) => {
        if (!confirm("Xóa cầu thủ này?")) return
        await supabase.from('candidates').delete().eq('id', id)
        fetchData()
    }

    const handleResetVotes = async () => {
        if (!confirm("CẢNH BÁO: Bạn có chắc muốn XÓA TOÀN BỘ phiếu bầu không?")) return
        // Supabase delete needs filter strictly or a policy that allows it
        await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        alert("Đã xóa sạch phiếu bầu!")
    }

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>

    if (!session) return <Login onLogin={() => { }} />

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row items-start md:items-center justify-between bg-[#121212] border border-white/10 p-6 rounded-[32px] gap-6">
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter">DASHBOARD</h1>
                        <p className="text-white/40 text-sm">Xin chào, {session.user.email}</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={toggleVoting}
                            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${isVotingActive ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}
                        >
                            <Activity size={18} /> {isVotingActive ? "Voting Active" : "Voting Closed"}
                        </button>

                        <button
                            onClick={handleResetVotes}
                            className="px-6 py-3 rounded-xl font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/20 flex items-center gap-2 transition-all"
                            title="Reset All Votes"
                        >
                            <RefreshCw size={18} /> Reset Votes
                        </button>

                        <button
                            onClick={handleLogout}
                            className="px-6 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all flex items-center gap-2"
                        >
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </header>

                <div className="grid lg:grid-cols-2 gap-8">

                    {/* Categories Panel */}
                    <section className="bg-[#121212] border border-white/10 rounded-[32px] p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Trophy size={20} className="text-emerald-500" /> Categories</h2>
                            <button onClick={() => setShowAddCat(true)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                                <Plus size={20} />
                            </button>
                        </div>

                        {showAddCat && (
                            <div className="mb-4 flex gap-2">
                                <input
                                    value={newCatName}
                                    onChange={e => setNewCatName(e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                                    placeholder="New Category Name..."
                                />
                                <button onClick={handleAddCategory} className="bg-emerald-500 text-black font-bold px-4 rounded-xl">Add</button>
                            </div>
                        )}

                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {categories.map(cat => (
                                <div key={cat.id} className="group flex items-center justify-between p-4 bg-white/5 border border-transparent hover:border-white/10 rounded-2xl transition-all">
                                    <span className="font-bold">{cat.name}</span>
                                    <button
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        className="text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Candidates Panel */}
                    <section className="bg-[#121212] border border-white/10 rounded-[32px] p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Shield size={20} className="text-blue-500" /> Candidates</h2>
                            <button onClick={() => setShowAddCand(true)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                                <Plus size={20} />
                            </button>
                        </div>

                        {showAddCand && (
                            <div className="mb-4 bg-black/40 p-4 rounded-2xl space-y-3 border border-white/5">
                                <input
                                    value={newCand.name}
                                    onChange={e => setNewCand({ ...newCand, name: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                                    placeholder="Player Name"
                                />
                                <div className="flex gap-3">
                                    <input
                                        type="number"
                                        value={newCand.number}
                                        onChange={e => setNewCand({ ...newCand, number: e.target.value })}
                                        className="w-24 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                                        placeholder="Num"
                                    />
                                    <input
                                        value={newCand.avatar_url}
                                        onChange={e => setNewCand({ ...newCand, avatar_url: e.target.value })}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                                        placeholder="Avatar URL"
                                    />
                                </div>
                                <button onClick={handleAddCandidate} className="w-full bg-emerald-500 text-black font-bold py-2 rounded-xl">Add Player</button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {candidates.map(cand => (
                                <div key={cand.id} className="group relative flex items-center gap-3 p-3 bg-white/5 border border-transparent hover:border-white/10 rounded-2xl transition-all">
                                    <img
                                        src={cand.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cand.name}`}
                                        className="w-10 h-10 rounded-full bg-black/50 object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold truncate">{cand.name}</h3>
                                        <p className="text-xs font-bold text-white/50">#{cand.number}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCandidate(cand.id)}
                                        className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500 text-white/50 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </div>
        </div>
    )
}
