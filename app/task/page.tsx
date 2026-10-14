import Link from "next/link";
import { completeTaskAction, subscribePlanAction } from "./actions";
import { logoutAction } from "@/lib/auth/actions";
import { getUserDashboardData } from "@/lib/supabase/earnings";

const taskCatalog = [
    {
        id: "flower-view-1",
        title: "Flower View Bonus",
        rewardMinor: 140,
        duration: "20 sec",
        description: "Quick premium view for new leads and paid ad preview access.",
    },
    {
        id: "task-pass-1",
        title: "Task Pass Reward",
        rewardMinor: 220,
        duration: "30 sec",
        description: "Completed task verification confirms your user reward for the campaign window.",
    },
    {
        id: "featured-boost",
        title: "Featured Boost",
        rewardMinor: 300,
        duration: "45 sec",
        description: "Higher-value task for users with premium subscription or promoted account status.",
    },
];

export default async function TaskPage({
    searchParams,
}: {
    searchParams?: Promise<{ status?: string; reward?: string; message?: string; plan?: string }>;
}) {
    const params = searchParams ? await searchParams : {};
    const dashboard = await getUserDashboardData();
    const rewardValue = params.reward ? Number(params.reward) : 0;
    const statusMessage =
        params.status === "success"
            ? `Reward added successfully: BDT ${rewardValue}`
            : params.status === "subscribe"
              ? `Subscription activated for ${params.plan || "your plan"}.`
              : params.status === "error"
                ? params.message || "This action could not be completed."
                : "Choose an activity to get started. Your wallet updates when rewards are recorded.";

    const wallet = dashboard.wallet ?? {
        balance_minor: 0,
        pending_minor: 0,
        approved_minor: 0,
        currency: "BDT",
        updated_at: null,
    };
    const metrics = [
        { label: "Wallet balance", value: wallet.balance_minor },
        { label: "Pending review", value: wallet.pending_minor },
        { label: "Approved", value: wallet.approved_minor },
    ];

    return (
        <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-6 text-[#f1f4e9] sm:px-8 sm:py-10">
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.1] pb-5">
                <Link href="/" className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-white">
                    <span className="grid size-8 place-items-center rounded-lg bg-[#c9f36a] text-xs font-black text-[#17210d]">T</span>taskmint
                </Link>
                <nav className="flex items-center gap-2 sm:gap-3">
                    <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-[#a9b5aa] transition hover:bg-white/[0.05] hover:text-white">Dashboard</Link>
                    <form action={logoutAction}><button type="submit" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-[#bdc9be] transition hover:border-white/30 hover:bg-white/[0.04] hover:text-white">Sign out</button></form>
                </nav>
            </header>

            <section className="animate-rise-in flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9f36a]">Task board</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Make your next move.</h1>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-[#9aa99f]">Explore available activities and review the reward and time before you begin.</p>
                </div>
                <p className="text-xs text-[#748278]">Currency: {wallet.currency || "BDT"}</p>
            </section>

            <div className={`mt-7 border px-4 py-3 text-sm ${params.status === "error" ? "border-[#e88d82]/30 bg-[#e88d82]/[0.08] text-[#f0b9b1]" : params.status ? "border-[#c9f36a]/25 bg-[#c9f36a]/[0.07] text-[#d6f5a4]" : "border-white/[0.1] bg-[#111e19] text-[#b8c5b9]"}`} role="status">
                <span className="mr-2 text-[#c9f36a]">{params.status === "error" ? "!" : "·"}</span>{statusMessage}
            </div>

            <section className="mt-5 grid gap-3 sm:grid-cols-3">
                {metrics.map((item, index) => (
                    <article key={item.label} className={`border px-5 py-4 ${index === 0 ? "border-[#c9f36a]/25 bg-[#c9f36a]/[0.055]" : "border-white/[0.1] bg-[#111e19]"}`}>
                        <p className="text-xs text-[#9aa99f]">{item.label}</p>
                        <p className={`mt-2 text-2xl font-semibold tracking-tight ${index === 0 ? "text-[#d9f7a0]" : "text-white"}`}>৳{Number(item.value || 0).toLocaleString("en-BD")}</p>
                    </article>
                ))}
            </section>

            <section className="mt-8 grid items-start gap-8 xl:grid-cols-[1.45fr_0.75fr]">
                <div>
                    <div className="mb-4 flex items-end justify-between gap-4 border-b border-white/[0.1] pb-4">
                        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#839187]">Available activities</p><h2 className="mt-1.5 text-xl font-semibold text-white">Pick a task</h2></div>
                        <span className="text-xs text-[#839187]">{taskCatalog.length} available</span>
                    </div>
                    <div className="divide-y divide-white/[0.1] border-y border-white/[0.1]">
                        {taskCatalog.map((task, index) => (
                            <article key={task.id} className="group py-5 transition-colors hover:bg-white/[0.015] sm:px-3">
                                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                                    <div className="flex gap-4">
                                        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-white/[0.1] bg-[#111e19] font-mono text-xs text-[#c9f36a]">0{index + 1}</span>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-white">{task.title}</h3>{index === 0 ? <span className="rounded-sm bg-[#c9f36a]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#c9f36a]">Featured</span> : null}</div>
                                            <p className="mt-1.5 max-w-xl text-sm leading-5 text-[#9aa99f]">{task.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 pl-14 sm:justify-end sm:pl-0">
                                        <div className="text-left sm:text-right"><p className="text-[10px] uppercase tracking-[0.12em] text-[#748278]">{task.duration}</p><p className="mt-1 font-semibold text-[#d9f7a0]">৳{task.rewardMinor}</p></div>
                                        <form action={completeTaskAction}>
                                            <input type="hidden" name="taskId" value={task.id} />
                                            <input type="hidden" name="title" value={task.title} />
                                            <input type="hidden" name="rewardMinor" value={String(task.rewardMinor)} />
                                            <button type="submit" className="rounded-lg bg-[#c9f36a] px-3.5 py-2.5 text-xs font-bold text-[#17210d] transition hover:bg-[#dcff86]">Complete task <span aria-hidden="true">↗</span></button>
                                        </form>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                    <p className="mt-4 text-xs leading-5 text-[#748278]">Rewards are subject to campaign terms and any required review.</p>
                </div>

                <aside className="border border-white/[0.1] bg-[#111e19] p-5 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c9f36a]">Premium access</p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Get more from TaskMint.</h2>
                    <p className="mt-2 text-sm leading-5 text-[#9aa99f]">Explore plans and see the benefits available to your account.</p>
                    <div className="mt-5 divide-y divide-white/[0.1] border-y border-white/[0.1]">
                        {(dashboard.plans || []).map((plan) => {
                            const isActive = (dashboard.subscriptions || []).some(
                                (subscription) => subscription.plan_key === plan.key && subscription.status === "active",
                            );

                            return (
                                <div key={plan.key} className="py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div><h3 className="text-sm font-semibold text-white">{plan.name}</h3><p className="mt-1.5 text-xs leading-5 text-[#9aa99f]">{plan.description}</p></div>
                                        <span className={`shrink-0 rounded-sm px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${isActive ? "bg-[#c9f36a]/10 text-[#d6f5a4]" : "bg-white/[0.06] text-[#9aa99f]"}`}>{isActive ? "Active" : "Available"}</span>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between gap-3">
                                        <p className="text-lg font-semibold text-white">৳{plan.price_minor}<span className="ml-1 text-[10px] font-normal text-[#748278]">BDT</span></p>
                                        <form action={subscribePlanAction}><input type="hidden" name="planKey" value={plan.key} /><button type="submit" className="rounded-lg border border-[#c9f36a]/30 px-3 py-2 text-xs font-semibold text-[#d6f5a4] transition hover:bg-[#c9f36a]/10">{isActive ? "Renew plan" : "View plan"}</button></form>
                                    </div>
                                    {(plan.features || []).length > 0 ? <ul className="mt-4 space-y-2">{(plan.features || []).map((feature) => <li key={feature} className="flex gap-2 text-xs text-[#a9b5aa]"><span className="text-[#c9f36a]">—</span><span>{feature}</span></li>)}</ul> : null}
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-5 border-l-2 border-[#c9f36a]/50 pl-3"><p className="text-xs leading-5 text-[#839187]">Plan benefits and availability are managed through your TaskMint account.</p></div>
                </aside>
            </section>
        </main>
    );
}
