import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { reviewAdvertiserProfileAction, reviewCampaignAction, reviewCampaignFundingAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CampaignOperationsPage({
    searchParams,
}: {
    searchParams?: Promise<{ error?: string; provider?: string; campaign?: string; funding?: string }>;
}) {
    const params = searchParams ? await searchParams : {};
    const supabase = await createServerSupabaseClient();
    if (!supabase) redirect("/login");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const { data: roles, error: rolesError } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    if (rolesError || !roles?.some((role) => role.role === "admin")) redirect("/dashboard");

    const [profilesResult, campaignsResult, fundingResult] = await Promise.all([
        supabase.from("advertiser_profiles").select("id,business_name,contact_email,website,review_status,created_at").order("created_at", { ascending: false }),
        supabase.from("campaigns").select("id,advertiser_id,title,category,reward_minor,budget_minor,slot_count,state,review_status,created_at").order("created_at", { ascending: false }),
        supabase.from("campaign_funding").select("id,campaign_id,provider,provider_reference,amount_minor,currency,status,created_at").eq("status", "pending").order("created_at", { ascending: false }),
    ]);

    const profiles = profilesResult.data ?? [];
    const campaigns = campaignsResult.data ?? [];
    const pendingProviders = profiles.filter((profile) => profile.review_status === "pending");
    const pendingCampaigns = campaigns.filter((campaign) => campaign.review_status === "pending");
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
    const campaignById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));

    return (
        <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-6 text-[#f1f4e9] sm:px-8 sm:py-10">
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9f36a]">TaskMint operations</p><h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Campaign review</h1></div>
                <nav className="flex gap-2"><Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">Workspace</Link><Link href="/admin/withdrawals" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">Payouts</Link><Link href="/adsincome" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">Earn tasks</Link></nav>
            </header>

            {params.error ? <div role="alert" className="mb-5 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm text-[#f0b9b1]">{params.error}</div> : null}
            {params.provider ? <div role="status" className="mb-5 border border-[#c9f36a]/25 bg-[#c9f36a]/7 px-4 py-3 text-sm text-[#d6f5a4]">Provider profile {params.provider}.</div> : null}
            {params.campaign ? <div role="status" className="mb-5 border border-[#c9f36a]/25 bg-[#c9f36a]/7 px-4 py-3 text-sm text-[#d6f5a4]">Campaign approved and activated.</div> : null}
            {params.funding ? <div role="status" className="mb-5 border border-[#c9f36a]/25 bg-[#c9f36a]/7 px-4 py-3 text-sm text-[#d6f5a4]">Funding request {params.funding}.</div> : null}

            <div className="mb-8 border-l-2 border-[#c9f36a]/60 bg-[#111e19] px-4 py-3 text-xs leading-5 text-[#a9b5aa]">Verify payment references against your external bank or wallet statement before marking funds paid. Campaign activation checks the full reserved budget and approved provider profile.</div>

            {profilesResult.error ? <p className="mb-4 text-sm text-[#f0b9b1]">Provider queue: {profilesResult.error.message}</p> : null}
            <section className="mb-10">
                <div className="mb-4 flex items-end justify-between border-b border-white/10 pb-3"><div><p className="text-xs uppercase tracking-[0.14em] text-[#839187]">Provider checks</p><h2 className="mt-1 text-lg font-semibold text-white">Pending provider profiles</h2></div><span className="text-xs text-[#839187]">{pendingProviders.length} pending</span></div>
                {pendingProviders.length ? <div className="divide-y divide-white/10 border-y border-white/10">{pendingProviders.map((profile) => <article key={profile.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center"><div><h3 className="font-semibold text-white">{profile.business_name || "Unnamed provider"}</h3><p className="mt-1 text-xs text-[#9aa99f]">{profile.contact_email}{profile.website ? ` · ${profile.website}` : ""}</p><p className="mt-1 text-[10px] text-[#748278]">Submitted {new Date(profile.created_at).toLocaleDateString("en-GB")}</p></div><div className="flex gap-2"><form action={reviewAdvertiserProfileAction}><input type="hidden" name="profileId" value={profile.id} /><input type="hidden" name="decision" value="approved" /><button type="submit" className="rounded-md bg-[#c9f36a] px-3 py-2 text-xs font-bold text-[#17210d] hover:bg-[#dcff86]">Approve provider</button></form><form action={reviewAdvertiserProfileAction}><input type="hidden" name="profileId" value={profile.id} /><input type="hidden" name="decision" value="rejected" /><button type="submit" className="rounded-md border border-[#e88d82]/30 px-3 py-2 text-xs font-semibold text-[#f0b9b1] hover:bg-[#e88d82]/8">Reject</button></form></div></article>)}</div> : <p className="border-y border-white/10 py-6 text-sm text-[#839187]">No provider profiles awaiting review.</p>}
            </section>

            <section className="mb-10">
                <div className="mb-4 flex items-end justify-between border-b border-white/10 pb-3"><div><p className="text-xs uppercase tracking-[0.14em] text-[#839187]">Payment reconciliation</p><h2 className="mt-1 text-lg font-semibold text-white">Funding references</h2></div><span className="text-xs text-[#839187]">{fundingResult.data?.length ?? 0} pending</span></div>
                {fundingResult.error ? <p className="text-sm text-[#f0b9b1]">Funding queue: {fundingResult.error.message}</p> : fundingResult.data?.length ? <div className="divide-y divide-white/10 border-y border-white/10">{fundingResult.data.map((funding) => <article key={funding.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center"><div><h3 className="font-semibold text-white">{campaignById.get(funding.campaign_id)?.title || "Campaign"}</h3><p className="mt-1 text-xs text-[#9aa99f]">{profileById.get(campaignById.get(funding.campaign_id)?.advertiser_id || "")?.business_name || "Provider"} · {funding.provider}</p><p className="mt-1 text-xs text-[#bdc9be]">Reference: {funding.provider_reference || "Missing"} · Amount: ৳{Number(funding.amount_minor).toLocaleString("en-BD")}</p></div><div className="flex gap-2"><form action={reviewCampaignFundingAction}><input type="hidden" name="fundingId" value={funding.id} /><input type="hidden" name="decision" value="paid" /><button type="submit" className="rounded-md bg-[#c9f36a] px-3 py-2 text-xs font-bold text-[#17210d] hover:bg-[#dcff86]">Verify received</button></form><form action={reviewCampaignFundingAction}><input type="hidden" name="fundingId" value={funding.id} /><input type="hidden" name="decision" value="rejected" /><button type="submit" className="rounded-md border border-[#e88d82]/30 px-3 py-2 text-xs font-semibold text-[#f0b9b1] hover:bg-[#e88d82]/8">Reject reference</button></form></div></article>)}</div> : <p className="border-y border-white/10 py-6 text-sm text-[#839187]">No funding references awaiting verification.</p>}
            </section>

            <section>
                <div className="mb-4 flex items-end justify-between border-b border-white/10 pb-3"><div><p className="text-xs uppercase tracking-[0.14em] text-[#839187]">Content and budget</p><h2 className="mt-1 text-lg font-semibold text-white">Campaign approval</h2></div><span className="text-xs text-[#839187]">{pendingCampaigns.length} pending</span></div>
                {campaignsResult.error ? <p className="text-sm text-[#f0b9b1]">Campaign queue: {campaignsResult.error.message}</p> : pendingCampaigns.length ? <div className="divide-y divide-white/10 border-y border-white/10">{pendingCampaigns.map((campaign) => <article key={campaign.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center"><div><h3 className="font-semibold text-white">{campaign.title}</h3><p className="mt-1 text-xs text-[#9aa99f]">{profileById.get(campaign.advertiser_id)?.business_name || "Provider"} · {campaign.category} · {campaign.slot_count} slots</p><p className="mt-1 text-xs text-[#bdc9be]">Reward: ৳{Number(campaign.reward_minor).toLocaleString("en-BD")} · Required budget: ৳{Number(campaign.budget_minor).toLocaleString("en-BD")}</p></div><form action={reviewCampaignAction}><input type="hidden" name="campaignId" value={campaign.id} /><button type="submit" className="rounded-md bg-[#c9f36a] px-3 py-2 text-xs font-bold text-[#17210d] hover:bg-[#dcff86]">Approve if funded</button></form></article>)}</div> : <p className="border-y border-white/10 py-6 text-sm text-[#839187]">No campaign drafts awaiting approval.</p>}
            </section>
        </main>
    );
}
