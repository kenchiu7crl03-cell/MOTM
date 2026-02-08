import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        if (typeof window === 'undefined') {
            // Return a dummy object for server-side usage during build if envs are missing
            // to prevent "Your project's URL and API key are required" error during static analysis
            return {
                from: () => ({ select: () => ({ eq: () => ({ single: () => ({}) }) }) }),
                auth: {
                    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
                    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
                    signInWithOAuth: () => Promise.resolve({ error: null }),
                    signOut: () => Promise.resolve({ error: null }),
                    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
                },
                channel: () => ({ on: () => ({ subscribe: () => { } }) }),
                removeChannel: () => { },
            } as any
        }
        // Client-side, we must throw or handle missing envs
        throw new Error("Supabase URL and Key are missing!")
    }

    return createBrowserClient(supabaseUrl, supabaseKey)
}
