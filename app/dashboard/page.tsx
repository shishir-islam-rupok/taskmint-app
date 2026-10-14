import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const supabase = await createServerSupabaseClient();

    if (!supabase) {
        redirect("/login");
    }

    const { data: verifiedClaims, error } = await supabase.auth.getClaims();
    const claims = verifiedClaims?.claims;

    if (error || !claims?.sub) {
        redirect("/login");
    }

    const displayName = claims.user_metadata?.full_name || claims.email?.split("@")[0] || "TaskMint User";

    return (
        <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
            <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-[#9ef8dc]">Dashboard</p>
                    <h1 className="mt-2 text-4xl font-black text-white">Welcome, {displayName}</h1>
                </div>

                <form action={logoutAction}>
                    <button
                        type="submit"
                        className="rounded-full border border-[#7ef5d3]/30 bg-[#7ef5d3]/10 px-3 py-2 text-sm font-semibold text-[#9ef8dc] transition hover:bg-[#7ef5d3]/20"
                    >
                        Sign out
                    </button>
                </form>
            </div>

            <div className="mt-8 max-w-3xl rounded-3xl border border-white/10 bg-[#091921] p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Account details</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Your session is active. Continue to the task board to start earning.
                        </p>
                    </div>

                    <Link
                        href="/task"
                        className="inline-flex rounded-full bg-[#7ef5d3] px-5 py-2.5 text-sm font-bold text-[#06151b] transition hover:bg-[#9ef3dc]"
                    >
                        Open task board
                    </Link>
                </div>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-sm text-slate-400">Email</dt>
                        <dd className="mt-1 break-all text-slate-100">{claims.email}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-400">Email verification</dt>
                        <dd className="mt-1 text-slate-100">
                            {claims.email_verified ? "Verified" : "Awaiting confirmation"}
                        </dd>
                    </div>
                </dl>
            </div>
        </main>
    );
}
