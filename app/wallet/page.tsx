import Link from "next/link";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requestWithdrawalAction } from "./actions";

export const dynamic = "force-dynamic";

const formatBdt = (amount: number) => `৳${Number(amount || 0).toLocaleString("en-BD")}`;

export default async function WalletPage({
    searchParams,
}: {
    searchParams?: Promise<{ error?: string; requested?: string }>;
}) {
    const params = searchParams ? await searchParams : {};
    const supabase = await createServerSupabaseClient();
    if (!supabase) redirect("/login");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) redirect("/login");

    const [walletResult, requestsResult] = await Promise.all([
        supabase
            .from("wallets")
            .select("balance_minor,pending_minor,approved_minor,currency,updated_at")
            .eq("user_id", user.id)
            .maybeSingle(),
        supabase
            .from("withdrawal_requests")
            .select("id,amount_minor,currency,payout_method,payout_account,status,provider_reference,review_note,requested_at,processed_at")
            .eq("user_id", user.id)
            .order("requested_at", { ascending: false })
            .limit(50),
    ]);

    const wallet = walletResult.data;
    const requests = requestsResult.data ?? [];

    return (
        <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-6 text-[#f1f4e9] sm:px-8 sm:py-10">
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                <Link href="/" className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-white"><span className="grid size-8 place-items-center rounded-lg bg-[#c9f36a] text-xs font-black text-[#17210d]">T</span>taskmint</Link>
                <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">Workspace</Link>
                    <Link href="/adsincome" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">Earn tasks</Link>
                    <Link href="/advertiser" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">Advertiser</Link>
                    <form action={logoutAction}><button type="submit" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-[#bdc9be] hover:bg-white/4 hover:text-white">Sign out</button></form>
                </nav>
            </header>

            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9f36a]">Wallet</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Your balance, your records.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#9aa99f]">Withdrawal requests reserve funds immediately. If a request is rejected, the reserved balance is returned automatically.</p></div>
                <span className="text-xs text-[#839187]">Account: {user.email}</span>
            </section>

            {params.error ? <div role="alert" className="mt-6 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm leading-6 text-[#f0b9b1]">{params.error}</div> : null}
            {params.requested ? <div role="status" className="mt-6 border border-[#c9f36a]/25 bg-[#c9f36a]/7 px-4 py-3 text-sm text-[#d6f5a4]">Withdrawal request submitted. The requested amount has been reserved and will be processed by TaskMint finance.</div> : null}
            {walletResult.error ? <div role="alert" className="mt-6 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm text-[#f0b9b1]">Could not load wallet: {walletResult.error.message}</div> : null}
            {requestsResult.error ? <div role="alert" className="mt-6 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm text-[#f0b9b1]">Could not load withdrawal history. Apply <code>supabase/migrations/20261016_wallet_withdrawals.sql</code> first. Details: {requestsResult.error.message}</div> : null}

            <section className="mt-7 grid gap-4 sm:grid-cols-3">
                <article className="border border-[#c9f36a]/25 bg-[#c9f36a]/6 p-5"><p className="text-xs text-[#9aa99f]">Available balance</p><p className="mt-3 text-3xl font-semibold tracking-tight text-[#d9f7a0]">{formatBdt(wallet?.balance_minor ?? 0)}</p><p className="mt-2 text-xs text-[#839187]">Can be requested for withdrawal</p></article>
                <article className="border border-white/10 bg-[#111e19] p-5"><p className="text-xs text-[#9aa99f]">Pending rewards</p><p className="mt-3 text-3xl font-semibold tracking-tight text-white">{formatBdt(wallet?.pending_minor ?? 0)}</p><p className="mt-2 text-xs text-[#839187]">Not available until reviewed</p></article>
                <article className="border border-white/10 bg-[#111e19] p-5"><p className="text-xs text-[#9aa99f]">Approved rewards</p><p className="mt-3 text-3xl font-semibold tracking-tight text-white">{formatBdt(wallet?.approved_minor ?? 0)}</p><p className="mt-2 text-xs text-[#839187]">Total approved task rewards</p></article>
            </section>

            <section className="mt-8 grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                <form action={requestWithdrawalAction} className="space-y-4 border border-white/10 bg-[#111e19] p-5 sm:p-7">
                    <input type="hidden" name="idempotencyKey" value={randomUUID()} />
                    <input type="hidden" name="idempotencyKey" value={randomUUID()} />
                    <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c9f36a]">Cash out</p><h2 className="mt-1.5 text-xl font-semibold text-white">Request a withdrawal</h2><p className="mt-2 text-sm leading-6 text-[#9aa99f]">Minimum ৳100. Enter payout details carefully; only use an account you control.</p></div>
                    <div><label htmlFor="amountBdt" className="mb-1.5 block text-sm font-medium text-[#dbe4d7]">Amount (BDT)</label><input id="amountBdt" name="amountBdt" type="number" required min={100} max={Math.max(100, Number(wallet?.balance_minor ?? 0))} step={1} placeholder="100" className="w-full rounded-lg border border-white/10 bg-[#0d1915] px-3.5 py-3 text-sm text-white outline-none focus:border-[#c9f36a]/60" /><p className="mt-1.5 text-xs text-[#748278]">Current available balance: {formatBdt(wallet?.balance_minor ?? 0)}</p></div>
                    <div><label htmlFor="payoutMethod" className="mb-1.5 block text-sm font-medium text-[#dbe4d7]">Payout method</label><select id="payoutMethod" name="payoutMethod" required defaultValue="" className="w-full rounded-lg border border-white/10 bg-[#0d1915] px-3.5 py-3 text-sm text-white outline-none focus:border-[#c9f36a]/60"><option value="" disabled>Select a method</option><option value="bKash">bKash</option><option value="Nagad">Nagad</option><option value="Rocket">Rocket</option><option value="Bank transfer">Bank transfer</option></select></div>
                    <div><label htmlFor="payoutAccount" className="mb-1.5 block text-sm font-medium text-[#dbe4d7]">Account number / payout details</label><input id="payoutAccount" name="payoutAccount" required minLength={6} maxLength={120} autoComplete="off" placeholder="Mobile wallet number or bank details" className="w-full rounded-lg border border-white/10 bg-[#0d1915] px-3.5 py-3 text-sm text-white outline-none focus:border-[#c9f36a]/60" /><p className="mt-1.5 text-xs leading-5 text-[#748278]">These details are visible to you and authorized TaskMint finance/admin reviewers.</p></div>
                    <button type="submit" disabled={!wallet || Number(wallet.balance_minor) < 100} className="w-full rounded-lg bg-[#c9f36a] px-4 py-3 text-sm font-bold text-[#17210d] transition hover:bg-[#dcff86] disabled:cursor-not-allowed disabled:opacity-50">Submit withdrawal request</button>
                    <p className="text-xs leading-5 text-[#748278]">Your available balance is reduced immediately to prevent double-spending. Rejected requests are refunded automatically.</p>
                </form>

                <section className="border border-white/10 bg-[#111e19] p-5 sm:p-7">
                    <div className="mb-5 flex items-end justify-between gap-3 border-b border-white/10 pb-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#839187]">History</p><h2 className="mt-1.5 text-xl font-semibold text-white">Withdrawal requests</h2></div><span className="text-xs text-[#839187]">Latest {requests.length}</span></div>
                    {requests.length ? <div className="divide-y divide-white/10">{requests.map((request) => <article key={request.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-lg font-semibold text-white">{formatBdt(request.amount_minor)}</p><p className="mt-1 text-xs text-[#9aa99f]">{request.payout_method} · {request.payout_account}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${request.status === "paid" ? "bg-[#c9f36a]/10 text-[#d6f5a4]" : request.status === "rejected" ? "bg-[#e88d82]/10 text-[#f0b9b1]" : "bg-white/6 text-[#bdc9be]"}`}>{request.status}</span></div>
                        <p className="mt-2 text-xs text-[#748278]">Requested {new Date(request.requested_at).toLocaleString("en-GB")}{request.processed_at ? ` · Updated ${new Date(request.processed_at).toLocaleString("en-GB")}` : ""}</p>
                        {request.provider_reference ? <p className="mt-2 text-xs text-[#cbd8bf]">Payout reference: {request.provider_reference}</p> : null}
                        {request.review_note ? <p className="mt-2 text-sm leading-5 text-[#b8c5b9]">Review note: {request.review_note}</p> : null}
                    </article>)}</div> : <div className="py-10 text-center"><p className="font-semibold text-white">No withdrawal requests yet</p><p className="mt-2 text-sm text-[#839187]">Your requests and their processing status will appear here.</p></div>}
                </section>
            </section>
        </main>
    );
}
