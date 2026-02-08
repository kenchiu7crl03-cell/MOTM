"use client"

import { useState, useRef, useEffect } from "react"
import { CandidateCard } from "./CandidateCard"
import { vote } from "@/app/actions"
import confetti from "canvas-confetti"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"

interface Candidate {
    id: string
    name: string
    number: number
    avatar_url: string | null
}

interface VotingGridProps {
    candidates: Candidate[]
    categoryId: string
    disabled?: boolean
    votedCandidateId?: string
    initialVoterName?: string
}

export function VotingGrid({ candidates, categoryId, disabled, votedCandidateId, initialVoterName }: VotingGridProps) {
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
    const [isVoted, setIsVoted] = useState(!!votedCandidateId)
    const [loading, setLoading] = useState(false)
    const [voterName, setVoterName] = useState(initialVoterName || "")
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        // If user opens the modal and doesn't have a name pre-filled, focus the input
        if (selectedCandidate && !initialVoterName) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [selectedCandidate, initialVoterName])

    const handleVote = async () => {
        const trimmedName = voterName.trim()
        if (!selectedCandidate || !trimmedName) return

        setLoading(true)
        try {
            await vote(selectedCandidate.id, categoryId, trimmedName)
            setIsVoted(true)
            confetti({
                particleCount: 200,
                spread: 120,
                origin: { y: 0.6 },
                colors: ['#10b981', '#fbbf24', '#ffffff'],
                drift: 1,
                scalar: 1.2
            })
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
            setSelectedCandidate(null)
        }
    }

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {candidates.map((candidate) => (
                    <CandidateCard
                        key={candidate.id}
                        {...candidate}
                        isSelected={votedCandidateId === candidate.id}
                        onClick={() => {
                            if (disabled || isVoted) return
                            setSelectedCandidate(candidate)
                        }}
                        disabled={disabled || isVoted}
                    />
                ))}
            </div>

            <AnimatePresence>
                {selectedCandidate && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCandidate(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />

                        {/* iOS 26 Inspired Glass Sheet */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="relative w-full sm:max-w-md bg-white/10 backdrop-blur-3xl border-t sm:border border-white/20 sm:rounded-[40px] rounded-t-[40px] overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                        >
                            {/* Top Handle */}
                            <div className="flex justify-center pt-3 pb-1 sm:hidden">
                                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                            </div>

                            <div className="p-8 text-center">
                                {/* Candidate Highlight */}
                                <div className="flex flex-col items-center mb-6">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] mb-4">
                                        <img
                                            src={selectedCandidate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCandidate.name}`}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <h3 className="text-3xl font-black text-white tracking-tight leading-none mb-1">
                                        {selectedCandidate.name}
                                    </h3>
                                    <p className="text-emerald-400 font-bold text-lg italic">#{selectedCandidate.number}</p>
                                </div>

                                {/* Name Input Logic */}
                                <div className="bg-black/20 rounded-[24px] p-1 border border-white/5 mb-6">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={voterName}
                                        onChange={(e) => setVoterName(e.target.value)}
                                        placeholder="Nhập tên của bạn..."
                                        className="w-full bg-transparent text-white text-center font-bold text-xl py-4 placeholder:text-white/30 focus:outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleVote()}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleVote}
                                        disabled={loading || !voterName.trim()}
                                        className="w-full bg-white text-black font-black py-4 rounded-[24px] text-lg hover:bg-gray-200 transition-all active:scale-[0.96] disabled:opacity-50 disabled:scale-100 shadow-[0_4px_20px_rgba(255,255,255,0.1)]"
                                    >
                                        {loading ? "ĐANG GỬI..." : "GỬI BÌNH CHỌN"}
                                    </button>
                                    <button
                                        onClick={() => setSelectedCandidate(null)}
                                        className="w-full text-gray-400 font-bold py-4 hover:text-white transition-colors"
                                    >
                                        Hủy bỏ
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
