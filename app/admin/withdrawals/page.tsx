import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { reviewWithdrawalAction } from "./actions";

export const dynamic = "force-dynamic";

const formatBdt = (amount: number) => `৳${Number(amount || 0).toLocaleString("en-BD")}`;

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
                    <Link href="/admin/campaigns" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">Campaign operations</Link>
                    <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">Workspace</Link>
                    <form action={logoutAction}><button type="submit" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-[#bdc9be] hover:bg-white/4 hover:text-white">Sign out</button></form>
                </nav>
            </header>

            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9f36a]">Finance operations</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Withdrawal review</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#9aa99f]">Verify each payout using your actual bank or mobile-wallet account before marking it paid. Rejecting an active request automatically refunds the user's reserved balance.</p></div><span className="text-xs text-[#839187]">Signed in as {user.email}</span></section>

            {params.error ? <div role="alert" className="mt-6 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm leading-6 text-[#f0b9b1]">{params.error}</div> : null}
            {params.reviewed ? <div role="status" className="mt-6 border border-[#c9f36a]/25 bg-[#c9f36a]/7 px-4 py-3 text-sm text-[#d6f5a4]">Withdrawal updated: {params.reviewed}.</div> : null}
            {requestsError ? <div role="alert" className="mt-6 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm leading-6 text-[#f0b9b1]">Could not load withdrawal requests. Apply <code>supabase/migrations/20261016_wallet_withdrawals.sql</code> first. Details: {requestsError.message}</div> : null}

            <section className="mt-7 grid gap-4 sm:grid-cols-3"><article className="border border-[#c9f36a]/25 bg-[#c9f36a]/6 p-5"><p className="text-xs text-[#9aa99f]">Active requests</p><p className="mt-3 text-3xl font-semibold text-[#d9f7a0]">{activeCount}</p></article><article className="border border-white/10 bg-[#111e19] p-5"><p className="text-xs text-[#9aa99f]">Reserved amount in queue</p><p className="mt-3 text-3xl font-semibold text-white">{formatBdt(totalActive)}</p></article><article className="border border-white/10 bg-[#111e19] p-5"><p className="text-xs text-[#9aa99f]">Showing</p><p className="mt-3 text-3xl font-semibold text-white">{rows.length}</p><p className="mt-2 text-xs text-[#839187]">Most recent requests (maximum 100)</p></article></section>

            <section className="mt-8 border border-white/10 bg-[#111e19] p-5 sm:p-7">
                <div className="mb-5 border-b border-white/10 pb-4"><h2 className="text-xl font-semibold text-white">Payout queue</h2><p className="mt-1.5 text-sm text-[#839187]">Never rely on the submitted form alone as proof of payment. Confirm the actual transaction externally first.</p></div>
                {rows.length ? <div className="divide-y divide-white/10">{rows.map((request) => {
                    const isActive = request.status === "requested" || request.status === "processing";
                    return <article key={request.id} className="py-6 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><h3 className="text-xl font-semibold text-white">{formatBdt(request.amount_minor)}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${request.status === "paid" ? "bg-[#c9f36a]/10 text-[#d6f5a4]" : request.status === "rejected" ? "bg-[#e88d82]/10 text-[#f0b9b1]" : "bg-white/6 text-[#bdc9be]"}`}>{request.status}</span></div><p className="mt-2 break-all text-xs text-[#748278]">Request ID: {request.id}</p><p className="mt-2 text-sm text-[#dbe4d7]">User ID: <span className="break-all text-[#9aa99f]">{request.user_id}</span></p><p className="mt-2 text-sm text-[#dbe4d7]">Payout: <span className="font-semibold">{request.payout_method}</span> · <span className="break-all">{request.payout_account || "No payout details recorded"}</span></p><p className="mt-1 text-xs text-[#748278]">Requested {new Date(request.requested_at).toLocaleString("en-GB")}{request.processed_at ? ` · Finalized ${new Date(request.processed_at).toLocaleString("en-GB")}` : ""}</p>{request.provider_reference ? <p className="mt-2 text-xs text-[#cbd8bf]">Payout reference: {request.provider_reference}</p> : null}{request.review_note ? <p className="mt-2 text-sm leading-5 text-[#9aa99f]">Note: {request.review_note}</p> : null}</div>
                        </div>
                        {isActive ? <form action={reviewWithdrawalAction} className="mt-5 grid gap-3 border border-white/10 bg-[#0d1915] p-4 lg:grid-cols-[1fr_1fr]">
                            <input type="hidden" name="requestId" value={request.id} />
                            <div><label htmlFor={`payoutReference-${request.id}`} className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">Payout transaction reference (required to mark paid)</label><input id={`payoutReference-${request.id}`} name="providerReference" maxLength={200} placeholder="Bank/mobile-wallet receipt reference" defaultValue={request.provider_reference ?? ""} className="w-full rounded-md border border-white/10 bg-[#111e19] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/50" /></div>
                            <div><label htmlFor={`reviewNote-${request.id}`} className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">Review note (optional)</label><input id={`reviewNote-${request.id}`} name="reviewNote" maxLength={1000} defaultValue={request.review_note ?? ""} placeholder="Reason or internal note" className="w-full rounded-md border border-white/10 bg-[#111e19] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/50" /></div>
                            <div className="flex flex-wrap gap-2 lg:col-span-2"><button name="decision" value="processing" type="submit" className="rounded-md border border-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/5">Mark processing</button><button name="decision" value="paid" type="submit" className="rounded-md bg-[#c9f36a] px-3 py-2 text-xs font-bold text-[#17210d] hover:bg-[#dcff86]">Confirm paid</button><button name="decision" value="rejected" type="submit" className="rounded-md border border-[#e88d82]/30 px-3 py-2 text-xs font-semibold text-[#f0b9b1] hover:bg-[#e88d82]/8">Reject & refund</button></div>
                        </form> : <p className="mt-4 text-xs text-[#748278]">This request is finalized. A new decision is not allowed.</p>}
                    </article>;
                })}</div> : <div className="py-12 text-center"><p className="font-semibold text-white">No withdrawal requests</p><p className="mt-2 text-sm text-[#839187]">Requests will appear here after users submit them.</p></div>}
            </section>
        </main>
    );
}
