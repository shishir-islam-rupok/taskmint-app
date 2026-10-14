import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    const requestedPath = request.nextUrl.searchParams.get("next") ?? "/dashboard";
    const destination = new URL(requestedPath, request.url);

    if (destination.origin !== request.nextUrl.origin) {
        destination.pathname = "/dashboard";
        destination.search = "";
        destination.hash = "";
    }

    if (!code) {
        return NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
    }

    const supabase = await createServerSupabaseClient();

    if (!supabase) {
        return NextResponse.redirect(new URL("/login?error=auth_not_configured", request.url));
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        return NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
    }

    return NextResponse.redirect(destination);
}