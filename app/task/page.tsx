import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import { getUserDashboardData } from "@/lib/supabase/earnings";
import { canActivateSubscriptionWithoutPayment } from "@/lib/supabase/subscription-policy.mjs";
import { subscribePlanAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function TaskPage({
    searchParams,
}: {
    searchParams?: Promise<{ status?: string; message?: string; plan?: string }>;
}) {
    const params = searchParams ? await searchParams : {};
    const dashboard = await getUserDashboardData();
    if (!dashboard.user) redirect("/login");

    const wallet = dashboard.wallet ?? {
        balance_minor: 0,
        pending_minor: 0,
        approved_minor: 0,
        currency: "BDT",
        updated_at: null,
    };
    const statusMessage = params.status === "subscribe"
        ? `Subscription activated for ${params.plan || "your plan"}.`
        : params.status === "error"
            ? params.message || "This action could not be completed."
            : null;

    return (
        <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-6 text-[#f1f4e9] sm:px-8 sm:py-10">
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                <Link href="/" className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-white"><span className="grid size-8 place-items-center rounded-lg bg-[#c9f36a] text-xs font-black text-[#17210d]">T</span>taskmint</Link>
                <nav className="flex items-center gap-2 sm:gap-3"><Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-[#a9b5aa] hover:bg-white/5 hover:text-white">Dashboard</Link><Link href="/wallet" className="rounded-lg px-3 py-2 text-sm font-medium text-[#a9b5aa] hover:bg-white/5 hover:text-white">Wallet</Link><Link href="/adsincome" className="rounded-lg px-3 py-2 text-sm font-medium text-[#a9b5aa] hover:bg-white/5 hover:text-white">Campaigns</Link><form action={logoutAction}><button type="submit" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-[#bdc9be] hover:bg-white/4 hover:text-white">Sign out</button></form></nav>
            </header>

            {statusMessage ? <div role="status" className={`mb-5 border px-4 py-3 text-sm ${params.status === "error" ? "border-[#e88d82]/30 bg-[#e88d82]/8 text-[#f0b9b1]" : "border-[#c9f36a]/25 bg-[#c9f36a]/7 text-[#d6f5a4]"}`}>{statusMessage}</div> : null}

            <section className="animate-rise-in grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9f36a]">Task workspace</p>
                    <h1 className="mt-2 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">Your earnings, tied to reviewed work.</h1>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-[#9aa99f]">Campaign activities now use server-timed sessions and provider review. Submitted rewards stay pending until approved, and only verified funded campaigns appear in the earner dashboard.</p>

                    <div className="mt-7 grid gap-3 sm:grid-cols-2">
                        <Link href="/adsincome" className="group border border-[#c9f36a]/25 bg-[#c9f36a]/6 p-5 transition hover:border-[#c9f36a]/50">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c9f36a]">For earners</p><h2 className="mt-2 text-lg font-semibold text-white">Browse sponsored tasks <span aria-hidden="true" className="text-[#c9f36a]">↗</span></h2><p className="mt-2 text-sm leading-5 text-[#9aa99f]">Watch eligible campaign content and submit your work for review.</p>
                        </Link>
                        <Link href="/advertiser" className="group border border-white/10 bg-[#111e19] p-5 transition hover:border-white/25">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9aa99f]">For providers</p><h2 className="mt-2 text-lg font-semibold text-white">Post a task <span aria-hidden="true" className="text-[#c9f36a]">↗</span></h2><p className="mt-2 text-sm leading-5 text-[#9aa99f]">Create campaign drafts, track submissions, and review completed work.</p>
                        </Link>
                    </div>

                    <div className="mt-7 grid gap-3 sm:grid-cols-3">
                        {[
                            { label: "Wallet balance", value: wallet.balance_minor },
                            { label: "Pending review", value: wallet.pending_minor },
                            { label: "Approved", value: wallet.approved_minor },
                        ].map((item, index) => <article key={item.label} className={`border px-4 py-3 ${index === 0 ? "border-[#c9f36a]/20 bg-[#c9f36a]/4" : "border-white/10 bg-[#111e19]"}`}><p className="text-[11px] text-[#9aa99f]">{item.label}</p><p className="mt-2 text-lg font-semibold text-white">৳{Number(item.value || 0).toLocaleString("en-BD")}</p></article>)}
                    </div>
                </div>

                <aside className="border border-white/10 bg-[#111e19] p-5 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c9f36a]">Premium access</p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Plans for your workspace</h2>
                    <p className="mt-2 text-sm leading-5 text-[#9aa99f]">Subscription management remains linked to your TaskMint account.</p>
                    <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
                        {dashboard.plans.length ? dashboard.plans.map((plan) => {
                            const isActive = (dashboard.subscriptions || []).some((subscription) => subscription.plan_key === plan.key && subscription.status === "active");
                            const canActivate = canActivateSubscriptionWithoutPayment(plan.price_minor);
                            return <div key={plan.key} className="py-4">
                                <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-white">{plan.name}</h3><p className="mt-1.5 text-xs leading-5 text-[#9aa99f]">{plan.description}</p></div><span className={`shrink-0 rounded-sm px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${isActive ? "bg-[#c9f36a]/10 text-[#d6f5a4]" : "bg-white/6 text-[#9aa99f]"}`}>{isActive ? "Active" : "Available"}</span></div>
                                <div className="mt-4 flex items-center justify-between gap-3"><p className="text-lg font-semibold text-white">৳{plan.price_minor}<span className="ml-1 text-[10px] font-normal text-[#748278]">BDT</span></p><form action={subscribePlanAction}><input type="hidden" name="planKey" value={plan.key} /><button type="submit" disabled={!canActivate} className="rounded-lg border border-[#c9f36a]/30 px-3 py-2 text-xs font-semibold text-[#d6f5a4] transition hover:bg-[#c9f36a]/10 disabled:cursor-not-allowed disabled:opacity-45">{isActive ? "Active" : canActivate ? "Activate free plan" : "Payment setup required"}</button></form></div>
                                {(plan.features || []).length > 0 ? <ul className="mt-4 space-y-2">{(plan.features || []).map((feature) => <li key={feature} className="flex gap-2 text-xs text-[#a9b5aa]"><span className="text-[#c9f36a]">—</span><span>{feature}</span></li>)}</ul> : null}
                            </div>;
                        }) : <p className="py-6 text-sm text-[#839187]">No subscription plans are currently configured for this account.</p>}
                    </div>
                    <p className="mt-4 text-xs leading-5 text-[#839187]">Paid subscriptions stay unavailable until a payment provider and verified payment flow are configured.</p>
                </aside>
            </section>
        </main>
    );
}
