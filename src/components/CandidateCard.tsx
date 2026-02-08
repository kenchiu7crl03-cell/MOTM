"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CandidateCardProps {
    id: string
    name: string
    number: number
    avatar_url: string | null
    isSelected?: boolean
    onClick?: () => void
    disabled?: boolean
}

export function CandidateCard({
    name,
    number,
    avatar_url,
    isSelected,
    onClick,
    disabled
}: CandidateCardProps) {
    return (
        <motion.div
            whileHover={!disabled ? { y: -5, scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            onClick={!disabled ? onClick : undefined}
            className={cn(
                "relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer group",
                "bg-black/40 backdrop-blur-md border-white/10",
                isSelected ? "ring-2 ring-emerald-500 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "hover:border-white/20",
                disabled && "opacity-60 cursor-not-allowed grayscale-[0.5]"
            )}
        >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="p-4 flex flex-col items-center gap-4">
                {/* Avatar Circle */}
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500/30 group-hover:border-emerald-500/60 transition-colors bg-white/5 flex items-center justify-center">
                    <Image
                        src={avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
                        alt={name}
                        fill
                        className="object-cover"
                    />
                </div>

                <div className="text-center">
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{name}</h3>
                    <p className="text-emerald-500 font-black text-3xl italic">#{number}</p>
                </div>
            </div>

            {/* Stats/Badge placeholder */}
            <div className="absolute top-2 right-2 flex items-center justify-center bg-emerald-500/10 rounded-full px-2 py-1 border border-emerald-500/20">
                <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Candidate</span>
            </div>
        </motion.div>
    )
}
