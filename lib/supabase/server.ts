import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, isSupabaseConfigured } from "./config";

export async function createServerSupabaseClient() {
    if (!isSupabaseConfigured()) {
        return null;
    }

    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        getSupabaseAnonKey(),
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options),
                        );
                    } catch {
                        // The server component is not allowed to set cookies in some cases.
                    }
                },
            },
        },
    );
}
