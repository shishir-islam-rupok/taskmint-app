import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAnonKey } from "@/lib/supabase/config";

const protectedRoutes = ["/dashboard", "/wallet", "/advertiser", "/review", "/admin"];

export async function proxy(request: NextRequest) {
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        getSupabaseAnonKey(),
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
                    });
                },
            },
        },
    );

    const { data } = await supabase.auth.getUser();
    const pathname = request.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`),
    );

    if (isProtectedRoute && !data.user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
}

export const config = {
    matcher: ["/dashboard/:path*", "/wallet/:path*", "/advertiser/:path*", "/review/:path*", "/admin/:path*"],
};
