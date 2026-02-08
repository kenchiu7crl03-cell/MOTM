"use client"

import { useState, useEffect } from "react"
import {
    addCategory, deleteCategory, resetVotes,
    addCandidate, updateCandidate, deleteCandidate
} from "@/app/actions"
import { PasscodeScreen } from "@/components/PasscodeScreen"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import {
    Shield, Plus, List, ArrowLeft, Trophy, Users,
    Trash2, RefreshCw, AlertTriangle, Edit2, Save, X, MoreVertical
} from "lucide-react"
import Link from "next/link"

export default function AdminManage() {
    const [isAuthorized, setIsAuthorized] = useState(false)

    // Data State
    const [categories, setCategories] = useState<any[]>([])
    const [candidates, setCandidates] = useState<any[]>([])
    const [loadingConfig, setLoadingConfig] = useState(true)

    // Forms
    const [categoryName, setCategoryName] = useState("")
    const [candidateName, setCandidateName] = useState("")
    const [candidateNumber, setCandidateNumber] = useState("")
    const [avatarUrl, setAvatarUrl] = useState("")

    // Edit Mode
    const [editingCandidate, setEditingCandidate] = useState<any | null>(null)

    // Loading States
    const [loading, setLoading] = useState(false)

    const supabase = createClient()

    // Fetch Data
    const fetchData = async () => {
        setLoadingConfig(true)
        const { data: cat } = await supabase.from('categories').select('*').order('created_at', { ascending: true })
        const { data: can } = await supabase.from('candidates').select('*').order('number', { ascending: true })
        if (cat) setCategories(cat)
        if (can) setCandidates(can)
        setLoadingConfig(false)
    }

    useEffect(() => {
        if (isAuthorized) fetchData()
    }, [isAuthorized])

    // --- Handlers ---

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!categoryName) return
        setLoading(true)
        const res = await addCategory(categoryName)
        if (res.success) {
            setCategoryName("")
            fetchData()
        } else {
            alert(res.error)
        }
        setLoading(false)
    }

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc muốn xóa giải "${name}"? Tất cả phiếu bầu liên quan sẽ bị xóa.`)) return
        setLoading(true)
        const res = await deleteCategory(id)
        if (res.success) fetchData()
        else alert(res.error)
        setLoading(false)
    }

    const handleResetVotes = async (categoryId?: string, name?: string) => {
        const msg = categoryId
            ? `Xóa TẤT CẢ phiếu bầu của giải "${name}"?`
            : "CẢNH BÁO: Xóa TOÀN BỘ phiếu bầu của TẤT CẢ giải đấu?"

        if (!confirm(msg)) return
        setLoading(true)
        const res = await resetVotes(categoryId)
        if (res.success) alert("Đã reset phiếu bầu thành công")
        else alert(res.error)
        setLoading(false)
    }

    const handleAddCandidate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!candidateName || !candidateNumber) return
        setLoading(true)
        const res = await addCandidate(candidateName, parseInt(candidateNumber), avatarUrl)
        if (res.success) {
            setCandidateName("")
            setCandidateNumber("")
            setAvatarUrl("")
            fetchData()
        } else {
            alert(res.error)
        }
        setLoading(false)
    }

    const handleUpdateCandidate = async () => {
        if (!editingCandidate) return
        setLoading(true)
        const res = await updateCandidate(
            editingCandidate.id,
            editingCandidate.name,
            parseInt(editingCandidate.number),
            editingCandidate.avatar_url
        )
        if (res.success) {
            setEditingCandidate(null)
            fetchData()
        } else {
            alert(res.error)
        }
        setLoading(false)
    }

    const handleDeleteCandidate = async (id: string, name: string) => {
        if (!confirm(`Xóa cầu thủ "${name}"?`)) return
        setLoading(true)
        const res = await deleteCandidate(id)
        if (res.success) fetchData()
        else alert(res.error)
        setLoading(false)
    }

    if (!isAuthorized) {
        return <PasscodeScreen onVerified={() => setIsAuthorized(true)} />
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8 pb-32">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row bg-black/40 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-[32px] justify-between items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm font-bold tracking-widest text-emerald-500 uppercase">Admin Dashboard</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black italic">QUẢN LÝ HỆ THỐNG</h1>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => handleResetVotes()}
                            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-3 rounded-xl transition-all border border-red-500/20 font-bold"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            <span className="hidden sm:inline">Reset All Votes</span>
                        </button>
                        <Link
                            href="/admin/results"
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl transition-all border border-white/10"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Xem Kết Quả</span>
                        </Link>
                    </div>
                </div>

                {/* --- SECTION: CATEGORIES --- */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <Trophy className="w-6 h-6 text-emerald-500" />
                        <h2 className="text-2xl font-black italic">DANH SÁCH GIẢI ĐẤU</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Create Form */}
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-[24px]">
                            <form onSubmit={handleAddCategory} className="flex gap-3">
                                <input
                                    type="text"
                                    value={categoryName}
                                    onChange={(e) => setCategoryName(e.target.value)}
                                    placeholder="Tên giải đấu mới..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-gray-600"
                                />
                                <button
                                    disabled={loading}
                                    className="bg-emerald-500 text-black font-bold px-6 rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </form>
                        </div>

                        {/* List */}
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-[24px] max-h-[300px] overflow-y-auto custom-scrollbar">
                            {categories.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">Chưa có giải đấu nào</p>
                            ) : (
                                <div className="space-y-3">
                                    {categories.map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-colors group">
                                            <span className="font-bold">{cat.name}</span>
                                            <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleResetVotes(cat.id, cat.name)}
                                                    title="Reset phiếu bầu giải này"
                                                    className="p-2 hover:bg-yellow-500/20 text-yellow-500 rounded-lg transition-colors"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                                    title="Xóa giải đấu"
                                                    className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* --- SECTION: CANDIDATES --- */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <Users className="w-6 h-6 text-emerald-500" />
                        <h2 className="text-2xl font-black italic">DANH SÁCH CẦU THỦ</h2>
                    </div>

                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden">
                        {/* Add/Edit Form */}
                        <div className="p-8 border-b border-white/10 bg-white/5">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                {editingCandidate ? <Edit2 className="w-4 h-4 text-yellow-400" /> : <Plus className="w-4 h-4 text-emerald-400" />}
                                {editingCandidate ? "Chỉnh sửa thông tin" : "Thêm cầu thủ mới"}
                            </h3>

                            <div className="grid sm:grid-cols-4 gap-4">
                                <input
                                    type="text"
                                    value={editingCandidate ? editingCandidate.name : candidateName}
                                    onChange={(e) => editingCandidate ? setEditingCandidate({ ...editingCandidate, name: e.target.value }) : setCandidateName(e.target.value)}
                                    placeholder="Tên cầu thủ..."
                                    className="sm:col-span-2 bg-black/20 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-gray-600"
                                />
                                <input
                                    type="number"
                                    value={editingCandidate ? editingCandidate.number : candidateNumber}
                                    onChange={(e) => editingCandidate ? setEditingCandidate({ ...editingCandidate, number: e.target.value }) : setCandidateNumber(e.target.value)}
                                    placeholder="Số áo"
                                    className="bg-black/20 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-gray-600"
                                />
                                <button
                                    onClick={editingCandidate ? handleUpdateCandidate : handleAddCandidate}
                                    disabled={loading}
                                    className={`font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2
                    ${editingCandidate ? "bg-yellow-500 hover:bg-yellow-400 text-black" : "bg-emerald-500 hover:bg-emerald-400 text-black"}
                  `}
                                >
                                    {editingCandidate ? "Cập Nhật" : "Thêm Mới"}
                                </button>
                            </div>

                            <div className="mt-4">
                                <input
                                    type="url"
                                    value={editingCandidate ? (editingCandidate.avatar_url || "") : avatarUrl}
                                    onChange={(e) => editingCandidate ? setEditingCandidate({ ...editingCandidate, avatar_url: e.target.value }) : setAvatarUrl(e.target.value)}
                                    placeholder="Link Avatar (https://...)"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-gray-600 text-sm"
                                />
                            </div>

                            {editingCandidate && (
                                <button
                                    onClick={() => setEditingCandidate(null)}
                                    className="mt-4 text-sm text-gray-400 hover:text-white underline"
                                >
                                    Hủy chỉnh sửa
                                </button>
                            )}
                        </div>

                        {/* Candidates Grid */}
                        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {candidates.map(candidate => (
                                <div key={candidate.id} className="relative bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 group hover:border-emerald-500/30 transition-all">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-black/20 shrink-0">
                                        <img
                                            src={candidate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.name}`}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold truncate">{candidate.name}</h4>
                                        <p className="text-emerald-500 font-bold text-sm">#{candidate.number}</p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingCandidate(candidate)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCandidate(candidate.id, candidate.name)}
                                            className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {candidates.length === 0 && <p className="text-gray-500 col-span-3 text-center">Chưa có cầu thủ nào</p>}
                        </div>
                    </div>
                </section>

            </div>
        </div>
    )
}
