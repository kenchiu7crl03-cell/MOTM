"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function vote(candidateId: string, categoryId: string, voterName: string) {
    const supabase = await createClient()

    // Basic validation
    if (!voterName || voterName.trim().length === 0) {
        throw new Error("Vui lòng nhập tên của bạn")
    }

    // Check if voting is closed
    const { data: config } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'voting_active')
        .single()

    if (config && !config.value) {
        throw new Error("Bình chọn đã đóng")
    }

    // Insert vote
    const { error } = await supabase
        .from('votes')
        .insert({
            voter_name: voterName.trim(),
            candidate_id: candidateId,
            category_id: categoryId,
        })

    if (error) {
        if (error.code === '23505') {
            throw new Error(`Tên "${voterName}" đã được sử dụng để bình chọn cho hạng mục này rồi.`)
        }
        throw error // Let the frontend handle generic error
    }

    // Set a cookie to remember the name (Server Action way to set cookie)
    const cookieStore = await cookies()
    cookieStore.set('voterName', voterName.trim(), { maxAge: 60 * 60 * 24 * 30 }) // 30 days

    revalidatePath('/')
    return { success: true }
}

export async function verifyAdmin(passcode: string) {
    if (passcode === process.env.ADMIN_PASSWORD) {
        // In a real app, you might want to set a secure cookie
        return { success: true }
    }
    return { success: false, error: "Sai mật mã" }
}

export async function toggleVoting(status: boolean) {
    // This should be protected by checking if user is admin
    const supabase = await createClient()

    const { error } = await supabase
        .from('config')
        .upsert({ key: 'voting_active', value: status })

    revalidatePath('/admin/results')
    return { success: !error }
}

export async function addCategory(name: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('categories').insert({ name })

    if (error) {
        if (error.code === '23505') return { success: false, error: 'Tên giải đấu đã tồn tại' }
        return { success: false, error: error.message }
    }

    revalidatePath('/')
    return { success: true }
}

export async function deleteCategory(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/')
    return { success: true }
}

export async function addCandidate(name: string, number: number, avatarUrl: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('candidates').insert({
        name,
        number,
        avatar_url: avatarUrl || null
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/')
    return { success: true }
}

export async function updateCandidate(id: string, name: string, number: number, avatarUrl: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('candidates').update({
        name,
        number,
        avatar_url: avatarUrl || null
    }).eq('id', id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/')
    return { success: true }
}

export async function deleteCandidate(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('candidates').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/')
    return { success: true }
}

export async function resetVotes(categoryId?: string) {
    const supabase = await createClient()

    // Supabase strictness might require explicit filter for delete all rows
    const query = supabase.from('votes').delete()

    if (categoryId) {
        query.eq('category_id', categoryId)
    } else {
        query.neq('id', '00000000-0000-0000-0000-000000000000') // Trick to match all
    }

    const { error } = await query
    if (error) return { success: false, error: error.message }

    revalidatePath('/')
    revalidatePath('/admin/results')
    return { success: true }
}
