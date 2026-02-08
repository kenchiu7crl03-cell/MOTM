"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { PasscodeScreen } from "@/components/PasscodeScreen"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts"
import { toggleVoting } from "@/app/actions"
import { motion } from "framer-motion"
import { Trophy, RefreshCcw, Activity, Shield } from "lucide-react"
import Link from "next/link"

export default function AdminResults() {
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [results, setResults] = useState<any[]>([])
    const [votingActive, setVotingActive] = useState(true)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (!isAuthorized) return

        const fetchData = async () => {
            // Fetch votes count grouped by candidate
            const { data: votesData, error: votesError } = await supabase
                .from('votes')
                .select('candidate_id, candidates(name, number)')

            if (votesData) {
                const counts = votesData.reduce((acc: any, curr: any) => {
                    const id = curr.candidate_id
                    if (!acc[id]) {
                        acc[id] = {
                            name: curr.candidates?.name || 'Unknown',
                            count: 0,
                            number: curr.candidates?.number
                        }
                    }
                    acc[id].count += 1
                    return acc
                }, {})

                const chartData = Object.values(counts)
                    .sort((a: any, b: any) => b.count - a.count)
                setResults(chartData)
            }

            // Fetch config
            const { data: config } = await supabase
                .from('config')
                .select('value')
                .eq('key', 'voting_active')
                .single()

            if (config) setVotingActive(config.value)
            setLoading(false)
        }

        fetchData()

        // Real-time subscription
        const channel = supabase
            .channel('schema-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
                fetchData()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [isAuthorized])

    const handleToggle = async () => {
        const newStatus = !votingActive
        setVotingActive(newStatus)
        await toggleVoting(newStatus)
    }

    if (!isAuthorized) {
        return <PasscodeScreen onVerified={() => setIsAuthorized(true)} />
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-black/40 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-[32px]">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                            <span className="text-sm font-bold tracking-widest text-emerald-500 uppercase">Live Results</span>
                        </div>
                        <h1 className="text-4xl font-black italic">BẢNG KẾT QUẢ</h1>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link
                            href="/admin/manage"
                            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl transition-all border border-white/10 font-bold"
                        >
                            <Shield className="w-5 h-5 text-emerald-500" />
                            Quản Lý
                        </Link>

                        <button
                            onClick={handleToggle}
                            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all active:scale-[0.98] ${votingActive
                                ? "bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30"
                                : "bg-emerald-500 text-black hover:bg-emerald-600"
                                }`}
                        >
                            {votingActive ? "ĐÓNG BÌNH CHỌN" : "MỞ BÌNH CHỌN"}
                        </button>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] h-[600px] relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-gold-500" />
                            Xếp hạng hiện tại
                        </h2>
                        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Cập nhật thời gian thực</div>
                    </div>

                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart
                            layout="vertical"
                            data={results}
                            margin={{ left: 100, right: 40, top: 0, bottom: 0 }}
                        >
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 13 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            />
                            <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={32}>
                                {results.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={index === 0 ? '#10b981' : '#334155'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
