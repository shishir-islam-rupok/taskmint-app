import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdvertiserProfileAction, createCampaignAction, reviewCampaignSubmissionAction, submitCampaignFundingRequestAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdvertiserPage({
    searchParams,
}: {
    searchParams?: Promise<{ error?: string; profile?: string; campaign?: string; review?: string; funding?: string }>;
}) {
    const params = searchParams ? await searchParams : {};
    const supabase = await createServerSupabaseClient();
    if (!supabase) redirect("/login");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile, error: profileError } = await supabase
        .from("advertiser_profiles")
        .select("id,business_name,contact_email,website,review_status")
        .eq("owner_user_id", user.id)
        .maybeSingle();

    const campaignsResult = profile
        ? await supabase
            .from("campaigns")
            .select("id,title,category,state,review_status,reward_minor,currency,slot_count,budget_minor,created_at,task_submissions(id,user_id,status,proof_text,submitted_at,reviewed_at,rejection_reason)")
            .eq("advertiser_id", profile.id)
            .order("created_at", { ascending: false })
        : { data: [], error: null };
    const campaignIds = (campaignsResult.data ?? []).map((campaign) => campaign.id);
    const fundingResult = campaignIds.length
        ? await supabase.from("campaign_funding").select("campaign_id,amount_minor,status").in("campaign_id", campaignIds)
        : { data: [], error: null };

    const paidTotals = new Map<string, number>();
    const pendingTotals = new Map<string, number>();
    for (const funding of fundingResult.data ?? []) {
        if (funding.status === "paid") {
            paidTotals.set(funding.campaign_id, (paidTotals.get(funding.campaign_id) ?? 0) + Number(funding.amount_minor));
        } else if (funding.status === "pending") {
            pendingTotals.set(funding.campaign_id, (pendingTotals.get(funding.campaign_id) ?? 0) + Number(funding.amount_minor));
        }
    }

    const campaigns = campaignsResult.data ?? [];
    const submissions = campaigns.flatMap((campaign) => campaign.task_submissions ?? []);
    const pendingReviews = submissions.filter((submission) => submission.status === "submitted").length;
    const liveCampaigns = campaigns.filter((campaign) => campaign.state === "active" && campaign.review_status === "approved").length;

    return (
        <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-6 text-[#f1f4e9] sm:px-8 sm:py-10">
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                <Link href="/" className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-white"><span className="grid size-8 place-items-center rounded-lg bg-[#c9f36a] text-xs font-black text-[#17210d]">T</span>taskmint</Link>
                <nav className="flex items-center gap-2 sm:gap-3">
                    <Link href="/adsincome" className="rounded-lg px-3 py-2 text-sm font-medium text-[#a9b5aa] transition hover:bg-white/5 hover:text-white">Earn tasks</Link>
                    <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-[#a9b5aa] transition hover:bg-white/5 hover:text-white">Workspace</Link>
                    <form action={logoutAction}><button type="submit" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-[#bdc9be] transition hover:border-white/30 hover:bg-white/4 hover:text-white">Sign out</button></form>
                </nav>
            </header>

            <section className="animate-rise-in flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9f36a]">Provider workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Post tasks. Review work.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#9aa99f]">Create sponsored activities, follow submissions, and approve rewards only after your campaign is reviewed and funded.</p></div>
                <span className="text-xs text-[#839187]">{profile?.business_name || user.email}</span>
            </section>

            {params.error ? <div role="alert" className="mt-5 border border-[#e88d82]/30 bg-[#e88d82]/[0.08] px-4 py-3 text-sm text-[#f0b9b1]">{params.error}</div> : null}
            {profileError ? <div role="alert" className="mt-5 border border-[#e88d82]/30 bg-[#e88d82]/[0.08] px-4 py-3 text-sm leading-6 text-[#f0b9b1]">Provider tables are missing. In Supabase Dashboard → SQL Editor, run <code>supabase/schema.sql</code> once if the base schema has not been installed, then run <code>supabase/migrations/20261014_campaign_marketplace.sql</code>. Details: {profileError.message}</div> : null}
            {params.profile ? <div role="status" className="mt-5 border border-[#c9f36a]/25 bg-[#c9f36a]/[0.07] px-4 py-3 text-sm text-[#d6f5a4]">Provider profile submitted. Campaigns remain in draft until reviewed.</div> : null}
            {params.campaign ? <div role="status" className="mt-5 border border-[#c9f36a]/25 bg-[#c9f36a]/[0.07] px-4 py-3 text-sm text-[#d6f5a4]">Campaign draft created. It will not appear to earners until it is approved and fully funded.</div> : null}
            {params.funding ? <div role="status" className="mt-5 border border-[#c9f36a]/25 bg-[#c9f36a]/[0.07] px-4 py-3 text-sm text-[#d6f5a4]">Funding request submitted for manual verification.</div> : null}
            {params.review ? <div role="status" className="mt-5 border border-[#c9f36a]/25 bg-[#c9f36a]/[0.07] px-4 py-3 text-sm text-[#d6f5a4]">Submission {params.review} and wallet status updated.</div> : null}
            {campaignsResult.error ? <div role="alert" className="mt-5 border border-[#e88d82]/30 bg-[#e88d82]/[0.08] px-4 py-3 text-sm text-[#f0b9b1]">Could not load campaigns: {campaignsResult.error.message}</div> : null}
            {fundingResult.error ? <div role="alert" className="mt-5 border border-[#e88d82]/30 bg-[#e88d82]/[0.08] px-4 py-3 text-sm text-[#f0b9b1]">Could not load campaign funding status: {fundingResult.error.message}</div> : null}

            <section className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                    { label: "Campaigns", value: campaigns.length },
                    { label: "Live and funded", value: liveCampaigns },
                    { label: "Submissions to review", value: pendingReviews },
                ].map((item) => <article key={item.label} className="border border-white/10 bg-[#111e19] px-5 py-4"><p className="text-xs text-[#9aa99f]">{item.label}</p><p className="mt-2 text-2xl font-semibold text-white">{item.value}</p></article>)}
            </section>

            {!profile ? (
                <section className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                    <div className="border border-white/10 bg-[#111e19] p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c9f36a]">Become a provider</p><h2 className="mt-2 text-xl font-semibold text-white">Set up your business profile</h2><p className="mt-2 text-sm leading-6 text-[#9aa99f]">Provider profiles are reviewed before campaigns can be approved. You can prepare drafts while review is pending.</p></div>
                    <form action={createAdvertiserProfileAction} className="space-y-4 border border-white/10 bg-[#111e19] p-6 sm:p-8">
                        <div><label htmlFor="businessName" className="mb-2 block text-sm font-medium text-[#dbe4d7]">Business or service name</label><input id="businessName" name="businessName" required minLength={2} maxLength={120} className="w-full rounded-lg border border-white/10 bg-[#0d1915] px-3.5 py-3 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div>
                        <div><label htmlFor="contactEmail" className="mb-2 block text-sm font-medium text-[#dbe4d7]">Contact email</label><input id="contactEmail" name="contactEmail" type="email" required maxLength={254} defaultValue={user.email || ""} className="w-full rounded-lg border border-white/10 bg-[#0d1915] px-3.5 py-3 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div>
                        <div><label htmlFor="website" className="mb-2 block text-sm font-medium text-[#dbe4d7]">Website <span className="text-[#748278]">(optional)</span></label><input id="website" name="website" type="url" placeholder="https://example.com" className="w-full rounded-lg border border-white/10 bg-[#0d1915] px-3.5 py-3 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div>
                        <button type="submit" className="rounded-lg bg-[#c9f36a] px-4 py-3 text-sm font-bold text-[#17210d] transition hover:bg-[#dcff86]">Submit provider profile</button>
                    </form>
                </section>
            ) : (
                <>
                    <div className="mt-6 flex flex-col gap-3 border border-[#c9f36a]/20 bg-[#c9f36a]/[0.05] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-[#cbd8bf]">Provider review: <span className="font-semibold capitalize text-white">{profile.review_status}</span>. Campaigns require approval and verified prepaid funding before they go live.</p><p className="text-xs text-[#9aa99f]">Profile: {profile.contact_email}</p></div>

                    <section className="mt-8 grid items-start gap-8 xl:grid-cols-[1fr_0.9fr]">
                        <div>
                            <div className="mb-4 border-b border-white/10 pb-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#839187]">Your activity</p><h2 className="mt-1.5 text-xl font-semibold text-white">Campaigns and submissions</h2></div>
                            {campaigns.length ? <div className="divide-y divide-white/10 border-y border-white/10">{campaigns.map((campaign) => {
                                const paid = paidTotals.get(campaign.id) ?? 0;
                                const pending = pendingTotals.get(campaign.id) ?? 0;
                                const funded = paid >= Number(campaign.budget_minor);
                                const fundingRemaining = Math.max(0, Number(campaign.budget_minor) - paid - pending);
                                return <article key={campaign.id} className="py-5 sm:px-2">
                                    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-white">{campaign.title}</h3><p className="mt-1 text-xs text-[#839187]">{campaign.category} · {campaign.slot_count} slots · ৳{campaign.reward_minor} per completion</p></div><span className="rounded-sm bg-white/[0.06] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#bdc9be]">{campaign.review_status === "approved" && campaign.state === "active" ? "Live" : campaign.review_status}</span></div>
                                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#9aa99f]"><span>Budget: ৳{Number(campaign.budget_minor).toLocaleString("en-BD")}</span><span>Funding: {funded ? "Verified" : `৳${paid.toLocaleString("en-BD")} of ৳${Number(campaign.budget_minor).toLocaleString("en-BD")}`}</span><span>{campaign.task_submissions?.length ?? 0} submissions</span></div>
                                    {!funded && campaign.state === "draft" && fundingRemaining > 0 ? <form action={submitCampaignFundingRequestAction} className="mt-4 grid gap-2 border border-white/10 bg-[#0d1915] p-3 sm:grid-cols-[1fr_1fr_110px_auto] sm:items-end">
                                        <input type="hidden" name="campaignId" value={campaign.id} />
                                        <div><label htmlFor={`provider-${campaign.id}`} className="mb-1 block text-[10px] text-[#839187]">Payment method</label><select id={`provider-${campaign.id}`} name="provider" required className="w-full rounded-md border border-white/10 bg-[#111e19] px-2.5 py-2 text-xs text-white"><option value="">Select</option><option value="Bank transfer">Bank transfer</option><option value="Mobile wallet">Mobile wallet</option><option value="Other manual transfer">Other manual transfer</option></select></div>
                                        <div><label htmlFor={`reference-${campaign.id}`} className="mb-1 block text-[10px] text-[#839187]">Transfer reference</label><input id={`reference-${campaign.id}`} name="providerReference" required minLength={4} maxLength={200} className="w-full rounded-md border border-white/10 bg-[#111e19] px-2.5 py-2 text-xs text-white" /></div>
                                        <div><label htmlFor={`amount-${campaign.id}`} className="mb-1 block text-[10px] text-[#839187]">Amount BDT</label><input id={`amount-${campaign.id}`} name="amountBdt" type="number" required min={1} max={fundingRemaining} defaultValue={fundingRemaining} className="w-full rounded-md border border-white/10 bg-[#111e19] px-2.5 py-2 text-xs text-white" /></div>
                                        <button type="submit" className="rounded-md border border-[#c9f36a]/30 px-3 py-2 text-xs font-semibold text-[#d6f5a4] hover:bg-[#c9f36a]/10">Request check</button>
                                        <p className="text-[10px] leading-4 text-[#748278] sm:col-span-4">Submit a manual transfer reference; an administrator must verify receipt before this campaign can launch.</p>
                                    </form> : null}
                                    {campaign.task_submissions?.length ? <div className="mt-4 space-y-3">{campaign.task_submissions.map((submission) => <div key={submission.id} className="border border-white/10 bg-[#0d1915] p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-white">Submission · {new Date(submission.submitted_at).toLocaleDateString("en-GB")}</p><span className="text-[10px] uppercase tracking-wide text-[#c9f36a]">{submission.status}</span></div>
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-[#b8c5b9]">{submission.proof_text || "No completion note supplied."}</p>
                                        {submission.status === "submitted" ? <div className="mt-4 flex flex-wrap gap-2">
                                            <form action={reviewCampaignSubmissionAction}><input type="hidden" name="submissionId" value={submission.id} /><input type="hidden" name="decision" value="approved" /><button type="submit" className="rounded-md bg-[#c9f36a] px-3 py-2 text-xs font-bold text-[#17210d] transition hover:bg-[#dcff86]">Approve reward</button></form>
                                            <form action={reviewCampaignSubmissionAction} className="flex min-w-0 flex-1 gap-2"><input type="hidden" name="submissionId" value={submission.id} /><input type="hidden" name="decision" value="rejected" /><input name="reason" maxLength={1000} placeholder="Reason (optional)" className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#111e19] px-3 py-2 text-xs text-white placeholder:text-[#748278]" /><button type="submit" className="rounded-md border border-[#e88d82]/30 px-3 py-2 text-xs font-semibold text-[#f0b9b1] hover:bg-[#e88d82]/[0.08]">Reject</button></form>
                                        </div> : submission.rejection_reason ? <p className="mt-2 text-xs text-[#d7aaa3]">Review note: {submission.rejection_reason}</p> : null}
                                    </div>)}</div> : null}
                                </article>;
                            })}</div> : <div className="border-y border-white/10 py-8 text-sm text-[#839187]">No campaigns yet. Create a draft to start the review process.</div>}
                        </div>

                        <form action={createCampaignAction} className="space-y-4 border border-white/10 bg-[#111e19] p-5 sm:p-6">
                            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c9f36a]">New campaign</p><h2 className="mt-1.5 text-xl font-semibold text-white">Post a sponsored task</h2><p className="mt-2 text-xs leading-5 text-[#839187]">A draft is not published. An administrator must approve the campaign and record verified funding first.</p></div>
                            <div><label htmlFor="title" className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">Campaign title</label><input id="title" name="title" required minLength={4} maxLength={120} className="w-full rounded-md border border-white/10 bg-[#0d1915] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div>
                            <div><label htmlFor="category" className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">Category</label><input id="category" name="category" required maxLength={60} placeholder="Video, product research, local service..." className="w-full rounded-md border border-white/10 bg-[#0d1915] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div>
                            <div><label htmlFor="description" className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">What is this task about?</label><textarea id="description" name="description" required minLength={15} maxLength={1000} rows={3} className="w-full resize-y rounded-md border border-white/10 bg-[#0d1915] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div>
                            <div><label htmlFor="instructions" className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">Worker instructions</label><textarea id="instructions" name="instructions" required minLength={10} maxLength={1500} rows={3} placeholder="Describe the eligible activity and what the worker should include in their completion note." className="w-full resize-y rounded-md border border-white/10 bg-[#0d1915] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div>
                            <div><label htmlFor="destinationUrl" className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">Sponsor page <span className="text-[#748278]">(optional)</span></label><input id="destinationUrl" name="destinationUrl" type="url" placeholder="https://example.com" className="w-full rounded-md border border-white/10 bg-[#0d1915] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div>
                            <div className="grid grid-cols-3 gap-3"><div><label htmlFor="rewardBdt" className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">৳ per task</label><input id="rewardBdt" name="rewardBdt" type="number" required min={1} max={100000} step={1} className="w-full rounded-md border border-white/10 bg-[#0d1915] px-2.5 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div><div><label htmlFor="slotCount" className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">Slots</label><input id="slotCount" name="slotCount" type="number" required min={1} max={10000} step={1} className="w-full rounded-md border border-white/10 bg-[#0d1915] px-2.5 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div><div><label htmlFor="watchSeconds" className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">Seconds</label><input id="watchSeconds" name="watchSeconds" type="number" required min={5} max={300} defaultValue={20} step={1} className="w-full rounded-md border border-white/10 bg-[#0d1915] px-2.5 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div></div>
                            <p className="text-xs leading-5 text-[#839187]">Total requested budget is reward × slots. Do not post tasks that incentivize ad-network clicks or violate a destination platform’s terms.</p>
                            <button type="submit" className="w-full rounded-lg bg-[#c9f36a] px-4 py-3 text-sm font-bold text-[#17210d] transition hover:bg-[#dcff86]">Save campaign draft</button>
                        </form>
                    </section>
                </>
            )}
        </main>
    );
}
