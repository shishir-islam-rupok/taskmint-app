import { completeTaskAction, subscribePlanAction } from "./actions";
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
                : "Complete a task to add real earnings to your account.";

    const wallet = dashboard.wallet ?? {
        balance_minor: 0,
        pending_minor: 0,
        approved_minor: 0,
        currency: "BDT",
        updated_at: null,
    };

    return (
        <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-[#071d23]/80 p-5 shadow-[0_20px_80px_rgba(7,25,30,0.7)] backdrop-blur sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9ef8dc]">
                        TaskMint task board
                    </p>
                    <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                        Real user task and reward flow
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href="/dashboard"
                        className="rounded-full border border-white/10 bg-white/3 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-[#7ef5d3]/40 hover:bg-[#7ef5d3]/10"
                    >
                        Dashboard
                    </a>
                    <a
                        href="/login"
                        className="rounded-full bg-[#7ef5d3] px-5 py-2.5 text-sm font-bold text-[#06151b] transition hover:bg-[#9ef3dc]"
                    >
                        Sign out
                    </a>
                </div>
            </div>

            <div className="mb-6 rounded-2xl border border-[#7ef5d3]/30 bg-[#7ef5d3]/10 px-4 py-3 text-sm text-[#d9fff6]">
                {statusMessage}
            </div>

            <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: "Balance", value: `৳${Number(wallet.balance_minor || 0).toLocaleString("en-BD")}` },
                    { label: "Pending", value: `৳${Number(wallet.pending_minor || 0).toLocaleString("en-BD")}` },
                    { label: "Approved", value: `৳${Number(wallet.approved_minor || 0).toLocaleString("en-BD")}` },
                    { label: "Currency", value: wallet.currency || "BDT" },
                ].map((item) => (
                    <div key={item.label} className="rounded-3xl border border-white/10 bg-[#091921] p-5">
                        <p className="text-sm text-slate-400">{item.label}</p>
                        <p className="mt-4 text-2xl font-black text-white">{item.value}</p>
                    </div>
                ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.5fr_0.95fr]">
                <div className="rounded-[28px] border border-white/10 bg-[#091921] p-5 sm:p-6">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                                Available tasks
                            </p>
                            <h2 className="mt-2 text-2xl font-black text-white">Earn from real user activity</h2>
                        </div>
                        <span className="rounded-full border border-[#7ef5d3]/30 bg-[#7ef5d3]/10 px-3 py-1 text-xs font-semibold text-[#9ef8dc]">
                            {taskCatalog.length} tasks
                        </span>
                    </div>

                    <div className="space-y-4">
                        {taskCatalog.map((task) => (
                            <article key={task.id} className="rounded-3xl border border-white/10 bg-[#071c24] p-4">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-full border border-[#7ef5d3]/30 bg-[#7ef5d3]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ef8dc]">
                                                Featured
                                            </span>
                                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-300">
                                                Reward task
                                            </span>
                                        </div>

                                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{task.title}</h3>
                                                <p className="mt-1 text-sm text-slate-400">{task.description}</p>
                                            </div>
                                            <div className="rounded-2xl border border-[#7ef5d3]/30 bg-[#7ef5d3]/10 px-3 py-2 text-right">
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-[#9ef8dc]">Reward</p>
                                                <p className="mt-1 text-xl font-black text-[#9ef8dc]">৳{task.rewardMinor}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                                        <div className="text-left lg:text-right">
                                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Time</p>
                                            <p className="mt-1 text-lg font-bold text-white">{task.duration}</p>
                                        </div>

                                        <form action={completeTaskAction}>
                                            <input type="hidden" name="taskId" value={task.id} />
                                            <input type="hidden" name="title" value={task.title} />
                                            <input type="hidden" name="rewardMinor" value={String(task.rewardMinor)} />
                                            <button
                                                type="submit"
                                                className="rounded-full bg-[#7ef5d3] px-4 py-2.5 text-sm font-bold text-[#06151b] transition hover:bg-[#9ef3dc]"
                                            >
                                                Complete task
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>

                <aside className="rounded-[28px] border border-white/10 bg-[#091921] p-5 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                        Premium access
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-white">Flower View / Subscribe</h2>

                    <div className="mt-5 space-y-3">
                        {(dashboard.plans || []).map((plan) => {
                            const isActive = (dashboard.subscriptions || []).some(
                                (subscription) => subscription.plan_key === plan.key && subscription.status === "active",
                            );

                            return (
                                <div key={plan.key} className="rounded-3xl border border-white/10 bg-[#071c24] p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                                            <p className="mt-1 text-sm text-slate-400">{plan.description}</p>
                                        </div>
                                        <span className="rounded-full border border-[#7ef5d3]/30 bg-[#7ef5d3]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ef8dc]">
                                            {isActive ? "Active" : "Open"}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex items-end justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Price</p>
                                            <p className="mt-1 text-2xl font-black text-white">৳{plan.price_minor}</p>
                                        </div>

                                        <form action={subscribePlanAction}>
                                            <input type="hidden" name="planKey" value={plan.key} />
                                            <button
                                                type="submit"
                                                className="rounded-full border border-[#7ef5d3]/40 bg-[#7ef5d3]/10 px-4 py-2 text-sm font-bold text-[#9ef8dc] transition hover:bg-[#7ef5d3]/20"
                                            >
                                                {isActive ? "Renew" : "Subscribe"}
                                            </button>
                                        </form>
                                    </div>

                                    <ul className="mt-4 space-y-2 text-sm text-slate-300">
                                        {(plan.features || []).map((feature) => (
                                            <li key={feature} className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-[#7ef5d3]" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </aside>
            </section>
        </main>
    );
}
