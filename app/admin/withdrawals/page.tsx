import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { reviewWithdrawalAction } from "./actions";

export const dynamic = "force-dynamic";

const formatBdt = (amount: number) => `৳${Number(amount || 0).toLocaleString("bn-BD")}`;
const statusLabels: Record<string, string> = {
    requested: "অনুরোধ করা হয়েছে",
    processing: "প্রক্রিয়াধীন",
    paid: "পরিশোধিত",
    rejected: "বাতিল",
};

export default async function AdminWithdrawalsPage({
    searchParams,
}: {
    searchParams?: Promise<{ error?: string; reviewed?: string }>;
}) {
    const params = searchParams ? await searchParams : {};
    const supabase = await createServerSupabaseClient();
    if (!supabase) redirect("/login");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) redirect("/login");

    const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
    const canReview = (roles ?? []).some((role) => role.role === "admin" || role.role === "finance");
    if (rolesError || !canReview) redirect("/dashboard");

    const { data: requests, error: requestsError } = await supabase
        .from("withdrawal_requests")
        .select("id,user_id,amount_minor,currency,payout_method,payout_account,status,provider_reference,review_note,requested_at,processed_at,reviewer_id")
        .order("requested_at", { ascending: false })
        .limit(100);

    const rows = requests ?? [];
    const activeCount = rows.filter((request) => request.status === "requested" || request.status === "processing").length;
    const totalActive = rows
        .filter((request) => request.status === "requested" || request.status === "processing")
        .reduce((sum, request) => sum + Number(request.amount_minor || 0), 0);

    return (
        <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-6 text-[#f1f4e9] sm:px-8 sm:py-10">
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                <Link href="/" className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-white"><span className="grid size-8 place-items-center rounded-lg bg-[#c9f36a] text-xs font-black text-[#17210d]">T</span>taskmint</Link>
                <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Link href="/admin" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">অ্যাডমিন</Link>
                    <Link href="/admin/campaigns" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">ক্যাম্পেইন পরিচালনা</Link>
                    <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">ড্যাশবোর্ড</Link>
                    <form action={logoutAction}><button type="submit" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-[#bdc9be] hover:bg-white/4 hover:text-white">লগ আউট</button></form>
                </nav>
            </header>

            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9f36a]">অর্থ ব্যবস্থাপনা</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">উত্তোলনের অনুরোধ পর্যালোচনা</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#9aa99f]">পরিশোধিত হিসেবে চিহ্নিত করার আগে ব্যাংক বা মোবাইল ওয়ালেটে লেনদেনটি যাচাই করুন। সক্রিয় অনুরোধ বাতিল করলে ব্যবহারকারীর সংরক্ষিত ব্যালেন্স স্বয়ংক্রিয়ভাবে ফেরত যায়।</p></div><span className="text-xs text-[#839187]">লগ ইন: {user.email}</span></section>

            {params.error ? <div role="alert" className="mt-6 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm leading-6 text-[#f0b9b1]">{params.error}</div> : null}
            {params.reviewed ? <div role="status" className="mt-6 border border-[#c9f36a]/25 bg-[#c9f36a]/7 px-4 py-3 text-sm text-[#d6f5a4]">উত্তোলনের অবস্থা হালনাগাদ হয়েছে: {statusLabels[params.reviewed] ?? params.reviewed}।</div> : null}
            {requestsError ? <div role="alert" className="mt-6 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm leading-6 text-[#f0b9b1]">উত্তোলনের অনুরোধ লোড করা যায়নি। আগে <code>supabase/migrations/20261016_wallet_withdrawals.sql</code> চালান। বিস্তারিত: {requestsError.message}</div> : null}

            <section className="mt-7 grid gap-4 sm:grid-cols-3"><article className="border border-[#c9f36a]/25 bg-[#c9f36a]/6 p-5"><p className="text-xs text-[#9aa99f]">সক্রিয় অনুরোধ</p><p className="mt-3 text-3xl font-semibold text-[#d9f7a0]">{activeCount.toLocaleString("bn-BD")}</p></article><article className="border border-white/10 bg-[#111e19] p-5"><p className="text-xs text-[#9aa99f]">অপেক্ষমাণ মোট অর্থ</p><p className="mt-3 text-3xl font-semibold text-white">{formatBdt(totalActive)}</p></article><article className="border border-white/10 bg-[#111e19] p-5"><p className="text-xs text-[#9aa99f]">দেখানো হচ্ছে</p><p className="mt-3 text-3xl font-semibold text-white">{rows.length.toLocaleString("bn-BD")}</p><p className="mt-2 text-xs text-[#839187]">সাম্প্রতিক সর্বোচ্চ ১০০টি অনুরোধ</p></article></section>

            <section className="mt-8 border border-white/10 bg-[#111e19] p-5 sm:p-7">
                <div className="mb-5 border-b border-white/10 pb-4"><h2 className="text-xl font-semibold text-white">পেমেন্টের অনুরোধ</h2><p className="mt-1.5 text-sm text-[#839187]">শুধু জমা দেওয়া ফর্মকে পেমেন্টের প্রমাণ ধরে নেবেন না। আগে প্রকৃত লেনদেন আলাদাভাবে নিশ্চিত করুন।</p></div>
                {rows.length ? <div className="divide-y divide-white/10">{rows.map((request) => {
                    const isActive = request.status === "requested" || request.status === "processing";
                    return <article key={request.id} className="py-6 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><h3 className="text-xl font-semibold text-white">{formatBdt(request.amount_minor)}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${request.status === "paid" ? "bg-[#c9f36a]/10 text-[#d6f5a4]" : request.status === "rejected" ? "bg-[#e88d82]/10 text-[#f0b9b1]" : "bg-white/6 text-[#bdc9be]"}`}>{statusLabels[request.status] ?? request.status}</span></div><p className="mt-2 break-all text-xs text-[#748278]">অনুরোধ আইডি: {request.id}</p><p className="mt-2 text-sm text-[#dbe4d7]">ব্যবহারকারী আইডি: <span className="break-all text-[#9aa99f]">{request.user_id}</span></p><p className="mt-2 text-sm text-[#dbe4d7]">পেমেন্ট: <span className="font-semibold">{request.payout_method}</span> · <span className="break-all">{request.payout_account || "পেমেন্টের তথ্য নেই"}</span></p><p className="mt-1 text-xs text-[#748278]">অনুরোধ: {new Date(request.requested_at).toLocaleString("bn-BD")}{request.processed_at ? ` · নিষ্পত্তি: ${new Date(request.processed_at).toLocaleString("bn-BD")}` : ""}</p>{request.provider_reference ? <p className="mt-2 text-xs text-[#cbd8bf]">পেমেন্ট রেফারেন্স: {request.provider_reference}</p> : null}{request.review_note ? <p className="mt-2 text-sm leading-5 text-[#9aa99f]">নোট: {request.review_note}</p> : null}</div>
                        </div>
                        {isActive ? <form action={reviewWithdrawalAction} className="mt-5 grid gap-3 border border-white/10 bg-[#0d1915] p-4 lg:grid-cols-[1fr_1fr]">
                            <input type="hidden" name="requestId" value={request.id} />
                            <div><label htmlFor={`payoutReference-${request.id}`} className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">পেমেন্ট লেনদেনের রেফারেন্স (পরিশোধ নিশ্চিত করতে আবশ্যক)</label><input id={`payoutReference-${request.id}`} name="providerReference" maxLength={200} placeholder="ব্যাংক/মোবাইল ওয়ালেট রসিদের রেফারেন্স" defaultValue={request.provider_reference ?? ""} className="w-full rounded-md border border-white/10 bg-[#111e19] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/50" /></div>
                            <div><label htmlFor={`reviewNote-${request.id}`} className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">পর্যালোচনার নোট (ঐচ্ছিক)</label><input id={`reviewNote-${request.id}`} name="reviewNote" maxLength={1000} defaultValue={request.review_note ?? ""} placeholder="কারণ বা অভ্যন্তরীণ নোট" className="w-full rounded-md border border-white/10 bg-[#111e19] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/50" /></div>
                            <div className="flex flex-wrap gap-2 lg:col-span-2"><button name="decision" value="processing" type="submit" className="rounded-md border border-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/5">প্রক্রিয়াধীন চিহ্নিত করুন</button><button name="decision" value="paid" type="submit" className="rounded-md bg-[#c9f36a] px-3 py-2 text-xs font-bold text-[#17210d] hover:bg-[#dcff86]">পরিশোধ নিশ্চিত করুন</button><button name="decision" value="rejected" type="submit" className="rounded-md border border-[#e88d82]/30 px-3 py-2 text-xs font-semibold text-[#f0b9b1] hover:bg-[#e88d82]/8">বাতিল ও অর্থ ফেরত</button></div>
                        </form> : <p className="mt-4 text-xs text-[#748278]">এই অনুরোধ নিষ্পত্তি হয়েছে। নতুন সিদ্ধান্ত নেওয়া যাবে না।</p>}
                    </article>;
                })}</div> : <div className="py-12 text-center"><p className="font-semibold text-white">কোনো উত্তোলনের অনুরোধ নেই</p><p className="mt-2 text-sm text-[#839187]">ব্যবহারকারীরা অনুরোধ জমা দিলে এখানে দেখা যাবে।</p></div>}
            </section>
        </main>
    );
}
