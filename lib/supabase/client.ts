"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, isSupabaseConfigured } from "./config";

export function createClient() {
    if (!isSupabaseConfigured()) {
        return null;
    }

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        getSupabaseAnonKey(),
    );
}
