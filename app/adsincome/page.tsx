import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import { getUserDashboardData } from "@/lib/supabase/earnings";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CampaignTimer } from "./campaign-timer";
import { startCampaignSessionAction } from "./actions";

export const dynamic = "force-dynamic";

function safeExternalUrl(value: string | null) {
    if (!value) return null;
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
    } catch {
        return null;
    }
}

export default async function AdsIncomePage({
    searchParams,
}: {
    searchParams?: Promise<{ watch?: string; submitted?: string; error?: string }>;
}) {
    const params = searchParams ? await searchParams : {};
    const supabase = await createServerSupabaseClient();
    if (!supabase) redirect("/login");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const [dashboard, campaignResult, submissionResult] = await Promise.all([
        getUserDashboardData(),
        supabase
            .from("campaigns")
            .select("id,title,category,description,instructions,reward_minor,currency,slot_count,watch_seconds,destination_url,created_at")
            .eq("state", "active")
            .eq("review_status", "approved")
            .order("created_at", { ascending: false }),
        supabase
            .from("task_submissions")
            .select("campaign_id,status,rejection_reason,submitted_at")
            .eq("user_id", user.id),
    ]);

    const wallet = dashboard.wallet ?? {
        balance_minor: 0,
        pending_minor: 0,
        approved_minor: 0,
        currency: "BDT",
        updated_at: null,
    };
    const submissions = new Map((submissionResult.data ?? []).map((submission) => [submission.campaign_id, submission]));
    const campaignErrorMessage = campaignResult.error?.message || "";
    const rolePolicyRecursion = /infinite recursion.*user_roles|user_roles.*infinite recursion/i.test(campaignErrorMessage);
    const marketplaceMigrationMissing = /watch_seconds|destination_url/i.test(campaignErrorMessage);

    let watchSession: { id: string; campaign_id: string; expires_at: string; status: string } | null = null;
    let watchCampaign: {
        title: string;
        instructions: string;
        destination_url: string | null;
    } | null = null;
    let watchError: string | null = null;

    if (params.watch && !campaignResult.error) {
        const { data, error } = await supabase
            .from("campaign_sessions")
            .select("id,campaign_id,expires_at,status")
            .eq("id", params.watch)
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) {
            watchError = error.message;
        } else if (data) {
            watchSession = data;
            const { data: campaign } = await supabase
                .from("campaigns")
                .select("title,instructions,destination_url")
                .eq("id", data.campaign_id)
                .maybeSingle();
            watchCampaign = campaign;
        }
    }

    const metrics = [
        { label: "Wallet balance", value: wallet.balance_minor },
        { label: "Pending review", value: wallet.pending_minor },
        { label: "Approved rewards", value: wallet.approved_minor },
    ];

    return (
        <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-6 text-[#f1f4e9] sm:px-8 sm:py-10">
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                <Link href="/" className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-white">
                    <span className="grid size-8 place-items-center rounded-lg bg-[#c9f36a] text-xs font-black text-[#17210d]">T</span>taskmint
                </Link>
                <nav className="flex items-center gap-2 sm:gap-3">
                    <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-[#a9b5aa] transition hover:bg-white/5 hover:text-white">Dashboard</Link>
                    <Link href="/advertiser" className="rounded-lg px-3 py-2 text-sm font-medium text-[#a9b5aa] transition hover:bg-white/5 hover:text-white">Post a task</Link>
                    <form action={logoutAction}><button type="submit" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-[#bdc9be] transition hover:border-white/30 hover:bg-white/4 hover:text-white">Sign out</button></form>
                </nav>
            </header>

            <section className="animate-rise-in flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9f36a]">Sponsored tasks</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Watch, complete, submit.</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9aa99f]">Explore sponsor-funded content tasks. Each session is timed on the server; rewards are held pending until the campaign provider reviews your submission.</p>
                </div>
                <Link href="/advertiser" className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.04]">Post a campaign <span aria-hidden="true">↗</span></Link>
            </section>

            <div className="mt-6 border border-[#c9f36a]/20 bg-[#c9f36a]/[0.06] px-4 py-3 text-xs leading-5 text-[#cbd8bf]">
                These are TaskMint-sponsored activities, not paid impressions or clicks on AdSense/Adsterra units. Follow each campaign brief and submit a note for review.
            </div>

            {params.submitted ? <div role="status" className="mt-4 border border-[#c9f36a]/25 bg-[#c9f36a]/[0.07] px-4 py-3 text-sm text-[#d6f5a4]">Submission received. The reward is pending provider review.</div> : null}
            {params.error ? <div role="alert" className="mt-4 border border-[#e88d82]/30 bg-[#e88d82]/[0.08] px-4 py-3 text-sm text-[#f0b9b1]">{params.error}</div> : null}
            {campaignResult.error ? <div role="alert" className="mt-4 border border-[#e88d82]/30 bg-[#e88d82]/[0.08] px-4 py-3 text-sm leading-6 text-[#f0b9b1]">{rolePolicyRecursion ? <>The database role policies are recursive. Run the updated <code>supabase/migrations/20261014_campaign_marketplace.sql</code> again to repair them, then reload.</> : marketplaceMigrationMissing ? <>Base campaign tables exist, but the marketplace migration is missing. Run only <code>supabase/migrations/20261014_campaign_marketplace.sql</code> in the Supabase SQL Editor, then reload.</> : <>Campaign tables are missing. In the Supabase SQL Editor, run <code>supabase/schema.sql</code> once if the base schema has not been installed, then run <code>supabase/migrations/20261014_campaign_marketplace.sql</code>. Reload after both complete.</>} Details: {campaignResult.error.message}</div> : null}
            {submissionResult.error && !campaignResult.error ? <div role="alert" className="mt-4 border border-[#e88d82]/30 bg-[#e88d82]/[0.08] px-4 py-3 text-sm text-[#f0b9b1]">Could not load your submission history: {submissionResult.error.message}</div> : null}
            {watchError ? <div role="alert" className="mt-4 border border-[#e88d82]/30 bg-[#e88d82]/[0.08] px-4 py-3 text-sm text-[#f0b9b1]">Could not load the watch session: {watchError}</div> : null}

            <section className="mt-5 grid gap-3 sm:grid-cols-3">
                {metrics.map((metric, index) => <article key={metric.label} className={`border px-5 py-4 ${index === 0 ? "border-[#c9f36a]/25 bg-[#c9f36a]/[0.055]" : "border-white/10 bg-[#111e19]"}`}><p className="text-xs text-[#9aa99f]">{metric.label}</p><p className={`mt-2 text-2xl font-semibold ${index === 0 ? "text-[#d9f7a0]" : "text-white"}`}>৳{Number(metric.value || 0).toLocaleString("en-BD")}</p></article>)}
            </section>

            {watchSession && watchCampaign && watchSession.status === "started" ? (
                <div className="mt-6"><CampaignTimer sessionId={watchSession.id} expiresAt={watchSession.expires_at} title={watchCampaign.title} instructions={watchCampaign.instructions} destinationUrl={safeExternalUrl(watchCampaign.destination_url)} /></div>
            ) : null}
            {watchSession && watchSession.status !== "started" ? <div className="mt-6 border border-white/10 bg-[#111e19] px-4 py-3 text-sm text-[#b8c5b9]">This session has already been submitted or closed.</div> : null}

            <section className="mt-8">
                <div className="mb-4 flex items-end justify-between gap-4 border-b border-white/10 pb-4">
                    <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#839187]">Verified and funded</p><h2 className="mt-1.5 text-xl font-semibold text-white">Available campaigns</h2></div>
                    <span className="text-xs text-[#839187]">{campaignResult.data?.length ?? 0} live</span>
                </div>
                {campaignResult.data?.length ? (
                    <div className="divide-y divide-white/10 border-y border-white/10">
                        {campaignResult.data.map((campaign) => {
                            const submission = submissions.get(campaign.id);
                            return (
                                <article key={campaign.id} className="py-5 sm:px-3">
                                    <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2"><span className="rounded-sm bg-[#c9f36a]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#d6f5a4]">{campaign.category}</span><span className="text-xs text-[#839187]">{campaign.watch_seconds}s minimum</span></div>
                                            <h3 className="mt-2 text-lg font-semibold text-white">{campaign.title}</h3>
                                            <p className="mt-1 max-w-3xl text-sm leading-5 text-[#9aa99f]">{campaign.description}</p>
                                            <p className="mt-2 text-xs leading-5 text-[#839187]">Task: {campaign.instructions}</p>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 lg:justify-end">
                                            <div className="text-left lg:text-right"><p className="text-[10px] uppercase tracking-[0.12em] text-[#748278]">Reward after approval</p><p className="mt-1 text-lg font-semibold text-[#d9f7a0]">৳{Number(campaign.reward_minor).toLocaleString("en-BD")}</p></div>
                                            {submission ? <span className={`rounded-lg px-3 py-2 text-xs font-semibold ${submission.status === "approved" ? "bg-[#c9f36a]/10 text-[#d6f5a4]" : submission.status === "rejected" ? "bg-[#e88d82]/10 text-[#f0b9b1]" : "bg-white/[0.06] text-[#bdc9be]"}`}>{submission.status === "submitted" ? "In review" : submission.status}</span> : <form action={startCampaignSessionAction}><input type="hidden" name="campaignId" value={campaign.id} /><button type="submit" className="rounded-lg bg-[#c9f36a] px-4 py-2.5 text-sm font-bold text-[#17210d] transition hover:bg-[#dcff86]">Watch task <span aria-hidden="true">↗</span></button></form>}
                                        </div>
                                    </div>
                                    {submission?.status === "rejected" && submission.rejection_reason ? <p className="mt-3 border-l-2 border-[#e88d82]/50 pl-3 text-xs text-[#d7aaa3]">Provider note: {submission.rejection_reason}</p> : null}
                                </article>
                            );
                        })}
                    </div>
                ) : !campaignResult.error ? (
                    <div className="border-y border-white/10 py-12 text-center"><p className="text-base font-semibold text-white">No live campaigns right now</p><p className="mt-2 text-sm text-[#839187]">Campaigns appear here after review and verified funding.</p><Link href="/advertiser" className="mt-5 inline-flex rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.04]">Post a campaign</Link></div>
                ) : null}
            </section>
        </main>
    );
}
