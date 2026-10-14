export function getSupabaseAnonKey() {
    return (
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        ""
    );
}

export function isSupabaseConfigured() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = getSupabaseAnonKey();

    return Boolean(url && anonKey && url.startsWith("http"));
}
