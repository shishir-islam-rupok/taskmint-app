import Link from "next/link";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requestWithdrawalAction } from "./actions";

export const dynamic = "force-dynamic";

const formatBdt = (amount: number) => `৳${Number(amount || 0).toLocaleString("bn-BD")}`;

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
                    <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">ড্যাশবোর্ড</Link>
                    <Link href="/adsincome" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">কাজ খুঁজুন</Link>
                    <Link href="/advertiser" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">বিজ্ঞাপনদাতা</Link>
                    <form action={logoutAction}><button type="submit" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-[#bdc9be] hover:bg-white/4 hover:text-white">লগ আউট</button></form>
                </nav>
            </header>

            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9f36a]">ওয়ালেট</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">আপনার ব্যালেন্স ও লেনদেনের হিসাব</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#9aa99f]">উত্তোলনের অনুরোধ করলে অর্থ সঙ্গে সঙ্গে সংরক্ষিত হয়। অনুরোধ বাতিল হলে সংরক্ষিত অর্থ স্বয়ংক্রিয়ভাবে ফেরত আসে।</p></div>
                <span className="text-xs text-[#839187]">অ্যাকাউন্ট: {user.email}</span>
            </section>

            {params.error ? <div role="alert" className="mt-6 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm leading-6 text-[#f0b9b1]">{params.error}</div> : null}
            {params.requested ? <div role="status" className="mt-6 border border-[#c9f36a]/25 bg-[#c9f36a]/7 px-4 py-3 text-sm text-[#d6f5a4]">উত্তোলনের অনুরোধ জমা হয়েছে। অনুরোধের অর্থ সংরক্ষিত হয়েছে এবং TaskMint ফাইন্যান্স টিম প্রক্রিয়া করবে।</div> : null}
            {walletResult.error ? <div role="alert" className="mt-6 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm text-[#f0b9b1]">ওয়ালেট লোড করা যায়নি: {walletResult.error.message}</div> : null}
            {requestsResult.error ? <div role="alert" className="mt-6 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm text-[#f0b9b1]">উত্তোলনের ইতিহাস লোড করা যায়নি। আগে <code>supabase/migrations/20261016_wallet_withdrawals.sql</code> চালান। বিস্তারিত: {requestsResult.error.message}</div> : null}

            <section className="mt-7 grid gap-4 sm:grid-cols-3">
                <article className="border border-[#c9f36a]/25 bg-[#c9f36a]/6 p-5"><p className="text-xs text-[#9aa99f]">উত্তোলনযোগ্য ব্যালেন্স</p><p className="mt-3 text-3xl font-semibold tracking-tight text-[#d9f7a0]">{formatBdt(wallet?.balance_minor ?? 0)}</p><p className="mt-2 text-xs text-[#839187]">উত্তোলনের অনুরোধ করতে পারবেন</p></article>
                <article className="border border-white/10 bg-[#111e19] p-5"><p className="text-xs text-[#9aa99f]">পর্যালোচনাধীন পুরস্কার</p><p className="mt-3 text-3xl font-semibold tracking-tight text-white">{formatBdt(wallet?.pending_minor ?? 0)}</p><p className="mt-2 text-xs text-[#839187]">যাচাই না হওয়া পর্যন্ত উত্তোলনযোগ্য নয়</p></article>
                <article className="border border-white/10 bg-[#111e19] p-5"><p className="text-xs text-[#9aa99f]">অনুমোদিত পুরস্কার</p><p className="mt-3 text-3xl font-semibold tracking-tight text-white">{formatBdt(wallet?.approved_minor ?? 0)}</p><p className="mt-2 text-xs text-[#839187]">অনুমোদিত কাজের মোট পুরস্কার</p></article>
            </section>

            <section className="mt-8 grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                <form action={requestWithdrawalAction} className="space-y-4 border border-white/10 bg-[#111e19] p-5 sm:p-7">
                    <input type="hidden" name="idempotencyKey" value={randomUUID()} />
                    <input type="hidden" name="idempotencyKey" value={randomUUID()} />
                    <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c9f36a]">অর্থ উত্তোলন</p><h2 className="mt-1.5 text-xl font-semibold text-white">উত্তোলনের অনুরোধ করুন</h2><p className="mt-2 text-sm leading-6 text-[#9aa99f]">সর্বনিম্ন ৳১০০। পেমেন্টের তথ্য সতর্কভাবে দিন এবং নিজের অ্যাকাউন্ট ব্যবহার করুন।</p></div>
                    <div><label htmlFor="amountBdt" className="mb-1.5 block text-sm font-medium text-[#dbe4d7]">পরিমাণ (BDT)</label><input id="amountBdt" name="amountBdt" type="number" required min={100} max={Math.max(100, Number(wallet?.balance_minor ?? 0))} step={1} placeholder="100" className="w-full rounded-lg border border-white/10 bg-[#0d1915] px-3.5 py-3 text-sm text-white outline-none focus:border-[#c9f36a]/60" /><p className="mt-1.5 text-xs text-[#748278]">বর্তমান উত্তোলনযোগ্য ব্যালেন্স: {formatBdt(wallet?.balance_minor ?? 0)}</p></div>
                    <div><label htmlFor="payoutMethod" className="mb-1.5 block text-sm font-medium text-[#dbe4d7]">পেমেন্ট পদ্ধতি</label><select id="payoutMethod" name="payoutMethod" required defaultValue="" className="w-full rounded-lg border border-white/10 bg-[#0d1915] px-3.5 py-3 text-sm text-white outline-none focus:border-[#c9f36a]/60"><option value="" disabled>পদ্ধতি নির্বাচন করুন</option><option value="bKash">বিকাশ</option><option value="Nagad">নগদ</option><option value="Rocket">রকেট</option><option value="Bank transfer">ব্যাংক ট্রান্সফার</option></select></div>
                    <div><label htmlFor="payoutAccount" className="mb-1.5 block text-sm font-medium text-[#dbe4d7]">অ্যাকাউন্ট নম্বর / পেমেন্টের তথ্য</label><input id="payoutAccount" name="payoutAccount" required minLength={6} maxLength={120} autoComplete="off" placeholder="মোবাইল ওয়ালেট নম্বর অথবা ব্যাংকের তথ্য" className="w-full rounded-lg border border-white/10 bg-[#0d1915] px-3.5 py-3 text-sm text-white outline-none focus:border-[#c9f36a]/60" /><p className="mt-1.5 text-xs leading-5 text-[#748278]">এই তথ্য আপনি এবং অনুমোদিত TaskMint ফাইন্যান্স/অ্যাডমিন পর্যালোচকেরা দেখতে পারবেন।</p></div>
                    <button type="submit" disabled={!wallet || Number(wallet.balance_minor) < 100} className="w-full rounded-lg bg-[#c9f36a] px-4 py-3 text-sm font-bold text-[#17210d] transition hover:bg-[#dcff86] disabled:cursor-not-allowed disabled:opacity-50">উত্তোলনের অনুরোধ জমা দিন</button>
                    <p className="text-xs leading-5 text-[#748278]">একই অর্থ একাধিকবার তোলার ঝুঁকি ঠেকাতে ব্যালেন্স সঙ্গে সঙ্গে কমানো হয়। বাতিল অনুরোধের অর্থ স্বয়ংক্রিয়ভাবে ফেরত আসে।</p>
                </form>

                <section className="border border-white/10 bg-[#111e19] p-5 sm:p-7">
                    <div className="mb-5 flex items-end justify-between gap-3 border-b border-white/10 pb-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#839187]">ইতিহাস</p><h2 className="mt-1.5 text-xl font-semibold text-white">উত্তোলনের অনুরোধ</h2></div><span className="text-xs text-[#839187]">সর্বশেষ {requests.length}টি</span></div>
                    {requests.length ? <div className="divide-y divide-white/10">{requests.map((request) => <article key={request.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-lg font-semibold text-white">{formatBdt(request.amount_minor)}</p><p className="mt-1 text-xs text-[#9aa99f]">{request.payout_method} · {request.payout_account}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${request.status === "paid" ? "bg-[#c9f36a]/10 text-[#d6f5a4]" : request.status === "rejected" ? "bg-[#e88d82]/10 text-[#f0b9b1]" : "bg-white/6 text-[#bdc9be]"}`}>{request.status}</span></div>
                        <p className="mt-2 text-xs text-[#748278]">অনুরোধ: {new Date(request.requested_at).toLocaleString("bn-BD")}{request.processed_at ? ` · হালনাগাদ: ${new Date(request.processed_at).toLocaleString("bn-BD")}` : ""}</p>
                        {request.provider_reference ? <p className="mt-2 text-xs text-[#cbd8bf]">পেমেন্ট রেফারেন্স: {request.provider_reference}</p> : null}
                        {request.review_note ? <p className="mt-2 text-sm leading-5 text-[#b8c5b9]">পর্যালোচকের নোট: {request.review_note}</p> : null}
                    </article>)}</div> : <div className="py-10 text-center"><p className="font-semibold text-white">এখনো কোনো উত্তোলনের অনুরোধ নেই</p><p className="mt-2 text-sm text-[#839187]">আপনার অনুরোধ ও প্রক্রিয়ার অবস্থা এখানে দেখা যাবে।</p></div>}
                </section>
            </section>
        </main>
    );
}
