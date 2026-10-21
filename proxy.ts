import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAnonKey, isSupabaseConfigured } from "@/lib/supabase/config";

const protectedRoutes = ["/dashboard", "/wallet", "/advertiser", "/review", "/admin"];

function loginRedirect(request: NextRequest) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
    if (!isSupabaseConfigured()) {
        return loginRedirect(request);
    }

    let response = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        getSupabaseAnonKey(),
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet, headers) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    response = NextResponse.next({ request });

                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                    Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
                },
            },
        },
    );

    const { data: verifiedClaims } = await supabase.auth.getClaims();
    const pathname = request.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`),
    );

    if (isProtectedRoute && !verifiedClaims?.claims) {
        const redirectResponse = loginRedirect(request);
        response.cookies.getAll().forEach(({ name, value, ...options }) => {
            redirectResponse.cookies.set(name, value, options);
        });
        for (const name of ["cache-control", "expires", "pragma"]) {
            const value = response.headers.get(name);
            if (value) redirectResponse.headers.set(name, value);
        }
        return redirectResponse;
    }

    return response;
}

export const config = {
    matcher: ["/dashboard/:path*", "/wallet/:path*", "/advertiser/:path*", "/review/:path*", "/admin/:path*"],
};
