"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AdTask = {
    id: string;
    title: string;
    brand: string;
    reward: number;
    duration: number;
    category: string;
    level: "Featured" | "Hot" | "New";
    description: string;
    badge: string;
};

type Notification = {
    type: "success" | "error";
    message: string;
};

const tasks: AdTask[] = [
    {
        id: "task-1",
        title: "Daily Brand View",
        brand: "Bangladesh Telecom",
        reward: 18,
        duration: 20,
        category: "Telecom",
        level: "Featured",
        description: "Open the campaign page and stay on the view for the full 20 seconds to confirm completion.",
        badge: "High conversion",
    },
    {
        id: "task-2",
        title: "Marketplace Discovery",
        brand: "ShopHub BD",
        reward: 25,
        duration: 25,
        category: "E-commerce",
        level: "Hot",
        description: "Browse the featured product carousel and validate the banner exposure before the timer finishes.",
        badge: "Quick payout",
    },
    {
        id: "task-3",
        title: "Finance Offer Click",
        brand: "CashFlow Plus",
        reward: 30,
        duration: 30,
        category: "Finance",
        level: "Featured",
        description: "Complete the full viewing session to unlock a verified payout for this premium ad campaign.",
        badge: "Premium reward",
    },
    {
        id: "task-4",
        title: "App Install Offer",
        brand: "KlikPay",
        reward: 22,
        duration: 20,
        category: "App",
        level: "New",
        description: "Watch the branded installation flow and keep the ad open until the confirmation prompt appears.",
        badge: "Mobile-ready",
    },
    {
        id: "task-5",
        title: "Local Business Promo",
        brand: "Dhaka Deals",
        reward: 16,
        duration: 18,
        category: "Local",
        level: "Hot",
        description: "A short local campaign with a clean verification window and quick reward settlement.",
        badge: "Fast track",
    },
];

export default function AdsIncomePage() {
    const [selectedTask, setSelectedTask] = useState<AdTask>(tasks[0]);
    const [countdown, setCountdown] = useState<number>(tasks[0].duration);
    const [isViewing, setIsViewing] = useState(false);
    const [completedTasks, setCompletedTasks] = useState<string[]>([]);
    const [wallet, setWallet] = useState({
        balance: 2840,
        pending: 560,
        approved: 1960,
    });
    const [withdrawal, setWithdrawal] = useState("500");
    const [notification, setNotification] = useState<Notification | null>(null);

    useEffect(() => {
        if (!isViewing || !selectedTask) {
            return;
        }

        const timer = window.setInterval(() => {
            setCountdown((current) => {
                if (current <= 1) {
                    window.clearInterval(timer);
                    completeTask(selectedTask);
                    return 0;
                }

                return current - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [isViewing, selectedTask]);

    const totalEarningsToday = tasks
        .filter((task) => completedTasks.includes(task.id))
        .reduce((sum, task) => sum + task.reward, 0);

    const payoutThreshold = 500;

    function openTask(task: AdTask) {
        setSelectedTask(task);
        setCountdown(task.duration);
        setIsViewing(true);
        setNotification(null);
    }

    function completeTask(task: AdTask) {
        if (completedTasks.includes(task.id)) {
            setIsViewing(false);
            return;
        }

        setCompletedTasks((current) => [...current, task.id]);
        setWallet((current) => ({
            balance: current.balance + task.reward,
            pending: current.pending + task.reward,
            approved: current.approved + task.reward,
        }));
        setIsViewing(false);
        setNotification({
            type: "success",
            message: `Verified! BDT ${task.reward} has been credited to your wallet.`,
        });
    }

    function handleWithdrawalRequest(event: React.FormEvent) {
        event.preventDefault();

        const amount = Number(withdrawal);

        if (!amount || amount < payoutThreshold) {
            setNotification({
                type: "error",
                message: `Minimum payout threshold is BDT ${payoutThreshold}.`,
            });
            return;
        }

        if (wallet.balance < amount) {
            setNotification({
                type: "error",
                message: "Your available balance is lower than the withdrawal request.",
            });
            return;
        }

        setWallet((current) => ({
            ...current,
            balance: current.balance - amount,
            pending: current.pending - amount,
        }));

        setNotification({
            type: "success",
            message: `Payout request submitted for BDT ${amount}. Review will be processed within 24 hours.`,
        });
    }

    return (
        <main className="min-h-screen px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-[#071d23]/80 p-5 shadow-[0_20px_80px_rgba(7,25,30,0.7)] backdrop-blur sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9ef8dc]">
                            TaskMint earnings
                        </p>
                        <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                            Paid-to-Click dashboard
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="rounded-full border border-white/10 bg-white/3 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-[#7ef5d3]/40 hover:bg-[#7ef5d3]/10"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/login"
                            className="rounded-full bg-[#7ef5d3] px-5 py-2.5 text-sm font-bold text-[#06151b] transition hover:bg-[#9ef3dc]"
                        >
                            Sign out
                        </Link>
                    </div>
                </header>

                {notification ? (
                    <div
                        className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${notification.type === "success"
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                                : "border-red-500/40 bg-red-500/10 text-red-200"
                            }`}
                    >
                        {notification.message}
                    </div>
                ) : null}

                <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: "Available balance", value: `৳${wallet.balance.toLocaleString("en-BD")}`, accent: "text-[#9ef8dc]" },
                        { label: "Pending rewards", value: `৳${wallet.pending.toLocaleString("en-BD")}`, accent: "text-amber-300" },
                        { label: "Approved earnings", value: `৳${wallet.approved.toLocaleString("en-BD")}`, accent: "text-cyan-300" },
                        { label: "Today earned", value: `৳${totalEarningsToday.toLocaleString("en-BD")}`, accent: "text-violet-300" },
                    ].map((item) => (
                        <div key={item.label} className="rounded-3xl border border-white/10 bg-[#091921] p-5 shadow-lg shadow-[#07151a]/50">
                            <p className="text-sm text-slate-400">{item.label}</p>
                            <p className={`mt-4 text-2xl font-black ${item.accent}`}>{item.value}</p>
                        </div>
                    ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.5fr_0.95fr]">
                    <div className="rounded-[28px] border border-white/10 bg-[#091921] p-5 shadow-[0_20px_60px_rgba(7,25,30,0.6)] sm:p-6">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                                    Available campaigns
                                </p>
                                <h2 className="mt-2 text-2xl font-black text-white">Earn by viewing ads</h2>
                            </div>
                            <span className="rounded-full border border-[#7ef5d3]/30 bg-[#7ef5d3]/10 px-3 py-1 text-xs font-semibold text-[#9ef8dc]">
                                {tasks.length} active offers
                            </span>
                        </div>

                        <div className="space-y-4">
                            {tasks.map((task) => {
                                const isDone = completedTasks.includes(task.id);

                                return (
                                    <article
                                        key={task.id}
                                        className="rounded-3xl border border-white/10 bg-[#071c24] p-4 transition hover:border-[#7ef5d3]/40 hover:bg-[#0b242b]"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded-full border border-[#7ef5d3]/30 bg-[#7ef5d3]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ef8dc]">
                                                        {task.level}
                                                    </span>
                                                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-300">
                                                        {task.category}
                                                    </span>
                                                </div>

                                                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white">{task.title}</h3>
                                                        <p className="mt-1 text-sm text-slate-400">{task.brand}</p>
                                                    </div>
                                                    <div className="rounded-2xl border border-[#7ef5d3]/30 bg-[#7ef5d3]/10 px-3 py-2 text-right">
                                                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#9ef8dc]">Reward</p>
                                                        <p className="mt-1 text-xl font-black text-[#9ef8dc]">৳{task.reward}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                                                <div className="text-left lg:text-right">
                                                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Time</p>
                                                    <p className="mt-1 text-lg font-bold text-white">{task.duration}s</p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => openTask(task)}
                                                    className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${isDone
                                                            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                                                            : "bg-[#7ef5d3] text-[#06151b] hover:bg-[#9ef3dc]"
                                                        }`}
                                                >
                                                    {isDone ? "Completed" : "View ad"}
                                                </button>
                                            </div>
                                        </div>

                                        <p className="mt-3 text-sm leading-6 text-slate-300">{task.description}</p>
                                    </article>
                                );
                            })}
                        </div>
                    </div>

                    <aside className="rounded-[28px] border border-white/10 bg-[#091921] p-5 shadow-[0_20px_60px_rgba(7,25,30,0.6)] sm:p-6">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                                    Active task
                                </p>
                                <h2 className="mt-2 text-2xl font-black text-white">Ad viewer</h2>
                            </div>
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                                {selectedTask.badge}
                            </span>
                        </div>

                        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#071c24]">
                            <div className="flex items-center justify-between border-b border-white/10 bg-[#07151a] px-4 py-3">
                                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                    {selectedTask.brand}
                                </span>
                                <span className="rounded-full border border-[#7ef5d3]/30 bg-[#7ef5d3]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9ef8dc]">
                                    {selectedTask.category}
                                </span>
                            </div>

                            <div className="relative h-56 border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(126,245,211,0.28),_transparent_34%),linear-gradient(135deg,#0e1d26,#081d22,#0a1a20)] p-4">
                                <div className="absolute inset-x-4 top-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                    <span>{selectedTask.title}</span>
                                    <span>Sponsored</span>
                                </div>

                                <div className="absolute inset-x-6 bottom-5 rounded-2xl border border-[#7ef5d3]/20 bg-[#07151a]/80 p-4 backdrop-blur-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Campaign</p>
                                            <p className="mt-1 text-lg font-black text-white">{selectedTask.brand}</p>
                                        </div>
                                        <div className="rounded-full bg-[#7ef5d3] px-3 py-1.5 text-xs font-black text-[#06151b]">
                                            Reward ৳{selectedTask.reward}
                                        </div>
                                    </div>
                                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                                        <div
                                            className="h-full rounded-full bg-[#7ef5d3] transition-all duration-1000"
                                            style={{ width: `${((selectedTask.duration - countdown) / selectedTask.duration) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 rounded-3xl border border-white/10 bg-[#061a20] p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Timer</p>
                                    <p className="mt-2 text-3xl font-black text-white">{countdown}s</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsViewing(!isViewing)}
                                    className="rounded-full bg-[#7ef5d3] px-4 py-2 text-sm font-bold text-[#06151b] transition hover:bg-[#9ef3dc]"
                                >
                                    {isViewing ? "Pause" : "Start task"}
                                </button>
                            </div>

                            <p className="mt-4 text-sm leading-6 text-slate-300">
                                {selectedTask.description}
                            </p>
                        </div>
                    </aside>
                </section>

                <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-[28px] border border-white/10 bg-[#091921] p-5 sm:p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                            Wallet & payout
                        </p>
                        <h2 className="mt-2 text-2xl font-black text-white">Withdrawal request</h2>

                        <form onSubmit={handleWithdrawalRequest} className="mt-5 space-y-4">
                            <div>
                                <label htmlFor="withdrawalAmount" className="mb-2 block text-sm text-slate-300">
                                    Amount in BDT
                                </label>
                                <input
                                    id="withdrawalAmount"
                                    type="number"
                                    min={payoutThreshold}
                                    step="50"
                                    value={withdrawal}
                                    onChange={(event) => setWithdrawal(event.target.value)}
                                    className="w-full rounded-2xl border border-white/10 bg-[#061a20] px-4 py-3 text-white outline-none transition focus:border-[#7ef5d3]/60"
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#061a20] px-4 py-3 text-sm text-slate-300">
                                <span>Min payout</span>
                                <span className="font-bold text-[#9ef8dc]">BDT {payoutThreshold}</span>
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-full bg-[#7ef5d3] px-4 py-3 text-sm font-bold text-[#06151b] transition hover:bg-[#9ef3dc]"
                            >
                                Submit payout request
                            </button>
                        </form>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-[#091921] p-5 sm:p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                            Summary
                        </p>
                        <h2 className="mt-2 text-2xl font-black text-white">Earning progress</h2>

                        <div className="mt-5 space-y-4">
                            <div>
                                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                                    <span>Approved rate</span>
                                    <span className="font-bold text-[#9ef8dc]">82%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                                    <div className="h-full w-[82%] rounded-full bg-[#7ef5d3]" />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-[#061a20] p-4 text-sm text-slate-300">
                                <div className="flex items-center justify-between">
                                    <span>Available</span>
                                    <span className="font-bold text-white">৳{wallet.balance.toLocaleString("en-BD")}</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <span>Pending</span>
                                    <span className="font-bold text-amber-300">৳{wallet.pending.toLocaleString("en-BD")}</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <span>Approved</span>
                                    <span className="font-bold text-cyan-300">৳{wallet.approved.toLocaleString("en-BD")}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
