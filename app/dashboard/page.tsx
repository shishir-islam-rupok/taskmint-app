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

    const [rolesResult, walletResult] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", claims.sub),
        supabase
            .from("wallets")
            .select("balance_minor,pending_minor,approved_minor,currency,updated_at")
            .eq("user_id", claims.sub)
            .maybeSingle(),
    ]);
    const isAdmin = (rolesResult.data || []).some((role) => role.role === "admin");

    const displayName = claims.user_metadata?.full_name || claims.email?.split("@")[0] || "TaskMint User";
    const wallet = walletResult.data ?? {
        balance_minor: 0,
        pending_minor: 0,
        approved_minor: 0,
        currency: "BDT",
        updated_at: null,
    };
    const formatMoney = (amount: number) => `৳${Number(amount || 0).toLocaleString("en-BD")}`;

    return (
        <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
            <div className="mb-9 flex items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <Link href="/" className="mb-6 flex w-fit items-center gap-2 text-sm font-extrabold tracking-tight text-white"><span className="grid size-7 place-items-center rounded-md bg-[#c9f36a] text-[10px] font-black text-[#17210d]">T</span>taskmint</Link>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9f36a]">Your workspace</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Welcome back, {displayName}</h1>
                </div>

                <div className="flex items-center gap-2">
                    {isAdmin ? <Link href="/admin/campaigns" className="rounded-lg border border-[#c9f36a]/25 px-3 py-2 text-sm font-semibold text-[#d6f5a4] hover:bg-[#c9f36a]/10">Campaign ops</Link> : null}
                    <form action={logoutAction}>
                        <button type="submit" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-[#bdc9be] transition hover:border-white/30 hover:bg-white/4 hover:text-white">Sign out</button>
                    </form>
                </div>
            </div>

            <section className="animate-rise-in grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: "Wallet balance", value: formatMoney(wallet.balance_minor), hint: "Current account balance", accent: true },
                    { label: "Pending review", value: formatMoney(wallet.pending_minor), hint: "Rewards awaiting review" },
                    { label: "Approved rewards", value: formatMoney(wallet.approved_minor), hint: "Approved in your wallet" },
                    { label: "Account status", value: claims.email_verified ? "Verified" : "Pending", hint: claims.email_verified ? "Email confirmed" : "Confirm your email" },
                ].map((item) => (
                    <article key={item.label} className={`border p-5 ${item.accent ? "border-[#c9f36a]/30 bg-[#c9f36a]/6" : "border-white/10 bg-[#111e19]"}`}>
                        <p className="text-xs font-medium text-[#9aa99f]">{item.label}</p>
                        <p className={`mt-4 text-2xl font-semibold tracking-tight ${item.accent ? "text-[#d9f7a0]" : "text-white"}`}>{item.value}</p>
                        <p className="mt-1.5 text-xs text-[#748278]">{item.hint}</p>
                    </article>
                ))}
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="border border-white/10 bg-[#111e19] p-6 sm:p-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c9f36a]">Next step</p>
                            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">Choose your workspace.</h2>
                            <p className="mt-2 max-w-md text-sm leading-6 text-[#9aa99f]">Earners can browse funded campaigns. Providers can post tasks and review submissions from their own dashboard.</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                            <Link href="/adsincome" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#c9f36a] px-4 py-3 text-sm font-bold text-[#17210d] transition hover:-translate-y-0.5 hover:bg-[#dcff86]">Earn tasks <span aria-hidden="true">↗</span></Link>
                            <Link href="/advertiser" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/4">Post a task <span aria-hidden="true">↗</span></Link>
                        </div>
                    </div>
                </div>
                <div className="border border-white/10 bg-[#111e19] p-6 sm:p-8">
                    <div className="flex items-center justify-between gap-3"><h2 className="text-base font-semibold text-white">Account details</h2><span className="rounded-full border border-[#c9f36a]/20 bg-[#c9f36a]/7 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#d6f5a4]">Secure</span></div>
                    <dl className="mt-5 space-y-4">
                        <div><dt className="text-xs text-[#748278]">Email address</dt><dd className="mt-1 break-all text-sm text-[#e2e9dc]">{claims.email}</dd></div>
                        <div><dt className="text-xs text-[#748278]">Verification</dt><dd className="mt-1 text-sm text-[#e2e9dc]">{claims.email_verified ? "Email verified" : "Awaiting confirmation"}</dd></div>
                        <div><dt className="text-xs text-[#748278]">Currency</dt><dd className="mt-1 text-sm text-[#e2e9dc]">{wallet.currency || "BDT"}</dd></div>
                    </dl>
                </div>
            </section>
        </main>
    );
}
