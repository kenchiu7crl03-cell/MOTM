"use client"

import { useState } from "react"
import { verifyAdmin } from "@/app/actions"
import { motion } from "framer-motion"
import { Lock } from "lucide-react"

export function PasscodeScreen({ onVerified }: { onVerified: () => void }) {
    const [passcode, setPasscode] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const res = await verifyAdmin(passcode)
        if (res.success) {
            onVerified()
        } else {
            setError(res.error || "Sai mật mã")
            setPasscode("")
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm p-8 rounded-[32px] bg-black/40 backdrop-blur-xl border border-white/10 text-center"
            >
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                        <Lock className="w-8 h-8 text-emerald-500" />
                    </div>
                </div>

                <h1 className="text-2xl font-black mb-2 italic">ADMIN ACCESS</h1>
                <p className="text-gray-400 mb-8 font-medium">Nhập mật mã để xem kết quả</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        placeholder="••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-center text-3xl tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                        autoFocus
                    />
                    {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl hover:bg-emerald-600 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? "ĐANG KIỂM TRA..." : "TRUY CẬP"}
                    </button>
                </form>
            </motion.div>
        </div>
    )
}
