import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdvertiserProfileAction, createCampaignAction, reviewCampaignSubmissionAction, submitCampaignFundingRequestAction } from "./actions";
import { CampaignSubmitButton } from "./campaign-submit-button";

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
                    <Link href="/adsincome" className="rounded-lg px-3 py-2 text-sm font-medium text-[#a9b5aa] transition hover:bg-white/5 hover:text-white">কাজ খুঁজুন</Link>
                    <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-[#a9b5aa] transition hover:bg-white/5 hover:text-white">ড্যাশবোর্ড</Link>
                    <form action={logoutAction}><button type="submit" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-[#bdc9be] transition hover:border-white/30 hover:bg-white/4 hover:text-white">লগ আউট</button></form>
                </nav>
            </header>

            <section className="animate-rise-in flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9f36a]">বিজ্ঞাপনদাতার কর্মক্ষেত্র</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">কাজ পোস্ট করুন, জমা কাজ পর্যালোচনা করুন।</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#9aa99f]">স্পন্সর করা কাজ তৈরি করুন, জমা পড়া কাজ দেখুন এবং ক্যাম্পেইন যাচাই ও অর্থায়নের পর পুরস্কার অনুমোদন করুন।</p></div>
                <span className="text-xs text-[#839187]">{profile?.business_name || user.email}</span>
            </section>

            {params.error ? <div role="alert" className="mt-5 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm text-[#f0b9b1]">{params.error}</div> : null}
            {profileError ? <div role="alert" className="mt-5 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm leading-6 text-[#f0b9b1]">বিজ্ঞাপনদাতার টেবিল পাওয়া যায়নি। Supabase Dashboard → SQL Editor-এ বেস স্কিমা ইনস্টল না থাকলে আগে একবার <code>supabase/schema.sql</code>, এরপর <code>supabase/migrations/20261014_campaign_marketplace.sql</code> চালান। বিস্তারিত: {profileError.message}</div> : null}
            {params.profile ? <div role="status" className="mt-5 border border-[#c9f36a]/25 bg-[#c9f36a]/7 px-4 py-3 text-sm text-[#d6f5a4]">বিজ্ঞাপনদাতার প্রোফাইল জমা হয়েছে। পর্যালোচনা না হওয়া পর্যন্ত ক্যাম্পেইন খসড়া অবস্থায় থাকবে।</div> : null}
            {params.campaign ? <div role="status" className="mt-5 border border-[#c9f36a]/25 bg-[#c9f36a]/7 px-4 py-3 text-sm text-[#d6f5a4]">ক্যাম্পেইনের খসড়া তৈরি হয়েছে। অনুমোদন ও সম্পূর্ণ অর্থায়ন না হওয়া পর্যন্ত কর্মীরা এটি দেখতে পাবেন না।</div> : null}
            {params.funding ? <div role="status" className="mt-5 border border-[#c9f36a]/25 bg-[#c9f36a]/7 px-4 py-3 text-sm text-[#d6f5a4]">অর্থ জমার অনুরোধ যাচাইয়ের জন্য জমা হয়েছে।</div> : null}
            {params.review ? <div role="status" className="mt-5 border border-[#c9f36a]/25 bg-[#c9f36a]/7 px-4 py-3 text-sm text-[#d6f5a4]">জমা কাজ {params.review}; ওয়ালেটের অবস্থা হালনাগাদ হয়েছে।</div> : null}
            {campaignsResult.error ? <div role="alert" className="mt-5 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm text-[#f0b9b1]">ক্যাম্পেইন লোড করা যায়নি: {campaignsResult.error.message}</div> : null}
            {fundingResult.error ? <div role="alert" className="mt-5 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm text-[#f0b9b1]">ক্যাম্পেইনের অর্থায়নের অবস্থা লোড করা যায়নি: {fundingResult.error.message}</div> : null}

            <section className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                    { label: "ক্যাম্পেইন", value: campaigns.length },
                    { label: "সক্রিয় ও অর্থায়িত", value: liveCampaigns },
                    { label: "পর্যালোচনাধীন জমা কাজ", value: pendingReviews },
                ].map((item) => <article key={item.label} className="border border-white/10 bg-[#111e19] px-5 py-4"><p className="text-xs text-[#9aa99f]">{item.label}</p><p className="mt-2 text-2xl font-semibold text-white">{item.value}</p></article>)}
            </section>

            {!profile ? (
                <section className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                    <div className="border border-white/10 bg-[#111e19] p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c9f36a]">বিজ্ঞাপনদাতা হিসেবে শুরু করুন</p><h2 className="mt-2 text-xl font-semibold text-white">আপনার ব্যবসার প্রোফাইল তৈরি করুন</h2><p className="mt-2 text-sm leading-6 text-[#9aa99f]">ক্যাম্পেইন অনুমোদনের আগে বিজ্ঞাপনদাতার প্রোফাইল যাচাই করা হয়। যাচাই চলাকালীন খসড়া তৈরি করতে পারবেন।</p></div>
                    <form action={createAdvertiserProfileAction} className="space-y-4 border border-white/10 bg-[#111e19] p-6 sm:p-8">
                        <div><label htmlFor="businessName" className="mb-2 block text-sm font-medium text-[#dbe4d7]">ব্যবসা বা সেবার নাম</label><input id="businessName" name="businessName" required minLength={2} maxLength={120} className="w-full rounded-lg border border-white/10 bg-[#0d1915] px-3.5 py-3 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div>
                        <div><label htmlFor="contactEmail" className="mb-2 block text-sm font-medium text-[#dbe4d7]">যোগাযোগের ইমেইল</label><input id="contactEmail" name="contactEmail" type="email" required maxLength={254} defaultValue={user.email || ""} className="w-full rounded-lg border border-white/10 bg-[#0d1915] px-3.5 py-3 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div>
                        <div><label htmlFor="website" className="mb-2 block text-sm font-medium text-[#dbe4d7]">ওয়েবসাইট <span className="text-[#748278]">(ঐচ্ছিক)</span></label><input id="website" name="website" type="url" placeholder="https://example.com" className="w-full rounded-lg border border-white/10 bg-[#0d1915] px-3.5 py-3 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div>
                        <button type="submit" className="rounded-lg bg-[#c9f36a] px-4 py-3 text-sm font-bold text-[#17210d] transition hover:bg-[#dcff86]">বিজ্ঞাপনদাতার প্রোফাইল জমা দিন</button>
                    </form>
                </section>
            ) : (
                <>
                    <div className="mt-6 flex flex-col gap-3 border border-[#c9f36a]/20 bg-[#c9f36a]/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-[#cbd8bf]">বিজ্ঞাপনদাতার যাচাই: <span className="font-semibold capitalize text-white">{profile.review_status === "approved" ? "অনুমোদিত" : profile.review_status === "rejected" ? "প্রত্যাখ্যাত" : "পর্যালোচনাধীন"}</span>। ক্যাম্পেইন চালু করতে অনুমোদন এবং অগ্রিম অর্থ জমা যাচাই প্রয়োজন।</p><p className="text-xs text-[#9aa99f]">প্রোফাইল: {profile.contact_email}</p></div>

                    <section className="mt-8 grid items-start gap-8 xl:grid-cols-[1fr_0.9fr]">
                        <div>
                            <div className="mb-4 border-b border-white/10 pb-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#839187]">আপনার কার্যক্রম</p><h2 className="mt-1.5 text-xl font-semibold text-white">ক্যাম্পেইন ও জমা কাজ</h2></div>
                            {campaigns.length ? <div className="divide-y divide-white/10 border-y border-white/10">{campaigns.map((campaign) => {
                                const paid = paidTotals.get(campaign.id) ?? 0;
                                const pending = pendingTotals.get(campaign.id) ?? 0;
                                const funded = paid >= Number(campaign.budget_minor);
                                const fundingRemaining = Math.max(0, Number(campaign.budget_minor) - paid - pending);
                                return <article key={campaign.id} className="py-5 sm:px-2">
                                    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-white">{campaign.title}</h3><p className="mt-1 text-xs text-[#839187]">{campaign.category} · {Number(campaign.slot_count).toLocaleString("bn-BD")}টি সুযোগ · প্রতি সম্পন্ন কাজে ৳{Number(campaign.reward_minor).toLocaleString("bn-BD")}</p></div><span className="rounded-sm bg-white/6 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#bdc9be]">{campaign.review_status === "approved" && campaign.state === "active" ? "চালু" : campaign.review_status === "approved" ? "অনুমোদিত" : campaign.review_status === "rejected" ? "প্রত্যাখ্যাত" : "পর্যালোচনাধীন"}</span></div>
                                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#9aa99f]"><span>বাজেট: ৳{Number(campaign.budget_minor).toLocaleString("bn-BD")}</span><span>জমা: {funded ? "যাচাইকৃত" : `৳${paid.toLocaleString("bn-BD")} / ৳${Number(campaign.budget_minor).toLocaleString("bn-BD")}`}</span><span>{Number(campaign.task_submissions?.length ?? 0).toLocaleString("bn-BD")}টি জমা কাজ</span></div>
                                    {!funded && campaign.state === "draft" && fundingRemaining > 0 ? <form action={submitCampaignFundingRequestAction} className="mt-4 grid gap-2 border border-white/10 bg-[#0d1915] p-3 sm:grid-cols-[1fr_1fr_110px_auto] sm:items-end">
                                        <input type="hidden" name="campaignId" value={campaign.id} />
                                        <div><label htmlFor={`provider-${campaign.id}`} className="mb-1 block text-[10px] text-[#839187]">পেমেন্ট পদ্ধতি</label><select id={`provider-${campaign.id}`} name="provider" required className="w-full rounded-md border border-white/10 bg-[#111e19] px-2.5 py-2 text-xs text-white"><option value="">নির্বাচন করুন</option><option value="Bank transfer">ব্যাংক ট্রান্সফার</option><option value="Mobile wallet">মোবাইল ওয়ালেট</option><option value="Other manual transfer">অন্যান্য ম্যানুয়াল ট্রান্সফার</option></select></div>
                                        <div><label htmlFor={`reference-${campaign.id}`} className="mb-1 block text-[10px] text-[#839187]">ট্রান্সফার রেফারেন্স</label><input id={`reference-${campaign.id}`} name="providerReference" required minLength={4} maxLength={200} className="w-full rounded-md border border-white/10 bg-[#111e19] px-2.5 py-2 text-xs text-white" /></div>
                                        <div><label htmlFor={`amount-${campaign.id}`} className="mb-1 block text-[10px] text-[#839187]">পরিমাণ (টাকা)</label><input id={`amount-${campaign.id}`} name="amountBdt" type="number" required min={1} max={fundingRemaining} defaultValue={fundingRemaining} className="w-full rounded-md border border-white/10 bg-[#111e19] px-2.5 py-2 text-xs text-white" /></div>
                                        <button type="submit" className="rounded-md border border-[#c9f36a]/30 px-3 py-2 text-xs font-semibold text-[#d6f5a4] hover:bg-[#c9f36a]/10">যাচাইয়ের অনুরোধ</button>
                                        <p className="text-[10px] leading-4 text-[#748278] sm:col-span-4">ম্যানুয়াল ট্রান্সফারের রেফারেন্স জমা দিন; ক্যাম্পেইন চালুর আগে প্রশাসককে অর্থপ্রাপ্তি যাচাই করতে হবে।</p>
                                    </form> : null}
                                    {campaign.task_submissions?.length ? <div className="mt-4 space-y-3">{campaign.task_submissions.map((submission) => <div key={submission.id} className="border border-white/10 bg-[#0d1915] p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-white">জমার তারিখ · {new Date(submission.submitted_at).toLocaleDateString("bn-BD")}</p><span className="text-[10px] uppercase tracking-wide text-[#c9f36a]">{submission.status === "submitted" ? "জমা হয়েছে" : submission.status === "approved" ? "অনুমোদিত" : "প্রত্যাখ্যাত"}</span></div>
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-[#b8c5b9]">{submission.proof_text || "কাজ সম্পন্নের কোনো নোট দেওয়া হয়নি।"}</p>
                                        {submission.status === "submitted" ? <div className="mt-4 flex flex-wrap gap-2">
                                            <form action={reviewCampaignSubmissionAction}><input type="hidden" name="submissionId" value={submission.id} /><input type="hidden" name="decision" value="approved" /><button type="submit" className="rounded-md bg-[#c9f36a] px-3 py-2 text-xs font-bold text-[#17210d] transition hover:bg-[#dcff86]">পুরস্কার অনুমোদন</button></form>
                                            <form action={reviewCampaignSubmissionAction} className="flex min-w-0 flex-1 gap-2"><input type="hidden" name="submissionId" value={submission.id} /><input type="hidden" name="decision" value="rejected" /><input name="reason" maxLength={1000} placeholder="কারণ (ঐচ্ছিক)" className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#111e19] px-3 py-2 text-xs text-white placeholder:text-[#748278]" /><button type="submit" className="rounded-md border border-[#e88d82]/30 px-3 py-2 text-xs font-semibold text-[#f0b9b1] hover:bg-[#e88d82]/8">প্রত্যাখ্যান</button></form>
                                        </div> : submission.rejection_reason ? <p className="mt-2 text-xs text-[#d7aaa3]">পর্যালোচনা নোট: {submission.rejection_reason}</p> : null}
                                    </div>)}</div> : null}
                                </article>;
                            })}</div> : <div className="border-y border-white/10 py-8 text-sm text-[#839187]">এখনো কোনো ক্যাম্পেইন নেই। পর্যালোচনা শুরু করতে একটি খসড়া তৈরি করুন।</div>}
                        </div>

                        <form action={createCampaignAction} className="space-y-4 border border-white/10 bg-[#111e19] p-5 sm:p-6">
                            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c9f36a]">নতুন ক্যাম্পেইন</p><h2 className="mt-1.5 text-xl font-semibold text-white">স্পন্সর করা কাজ পোস্ট করুন</h2><p className="mt-2 text-xs leading-5 text-[#839187]">খসড়া প্রকাশিত হয় না। আগে প্রশাসককে ক্যাম্পেইন অনুমোদন এবং জমা অর্থ যাচাই করতে হবে।</p></div>
                            <div><label htmlFor="title" className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">ক্যাম্পেইনের শিরোনাম</label><input id="title" name="title" required minLength={4} maxLength={120} className="w-full rounded-md border border-white/10 bg-[#0d1915] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div>
                            <div><label htmlFor="category" className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">বিভাগ</label><input id="category" name="category" required maxLength={60} placeholder="ভিডিও, পণ্য গবেষণা, স্থানীয় সেবা..." className="w-full rounded-md border border-white/10 bg-[#0d1915] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div>
                            <div><label htmlFor="description" className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">কাজটি কী বিষয়ে?</label><textarea id="description" name="description" required minLength={15} maxLength={1000} rows={3} className="w-full resize-y rounded-md border border-white/10 bg-[#0d1915] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div>
                            <div><label htmlFor="instructions" className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">কর্মীর জন্য নির্দেশনা</label><textarea id="instructions" name="instructions" required minLength={10} maxLength={1500} rows={3} placeholder="করণীয় কাজ এবং সম্পন্নের নোটে কী লিখতে হবে তা জানান।" className="w-full resize-y rounded-md border border-white/10 bg-[#0d1915] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div>
                            <div><label htmlFor="destinationUrl" className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">স্পন্সরের পেজ <span className="text-[#748278]">(ঐচ্ছিক)</span></label><input id="destinationUrl" name="destinationUrl" type="url" placeholder="https://example.com" className="w-full rounded-md border border-white/10 bg-[#0d1915] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div>
                            <div className="grid grid-cols-3 gap-3"><div><label htmlFor="rewardBdt" className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">প্রতি কাজে ৳</label><input id="rewardBdt" name="rewardBdt" type="number" required min={1} max={100000} step={1} className="w-full rounded-md border border-white/10 bg-[#0d1915] px-2.5 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div><div><label htmlFor="slotCount" className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">কাজের সংখ্যা</label><input id="slotCount" name="slotCount" type="number" required min={1} max={10000} step={1} className="w-full rounded-md border border-white/10 bg-[#0d1915] px-2.5 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div><div><label htmlFor="watchSeconds" className="mb-1.5 block text-xs font-medium text-[#dbe4d7]">সময় (সেকেন্ড)</label><input id="watchSeconds" name="watchSeconds" type="number" required min={5} max={300} defaultValue={20} step={1} className="w-full rounded-md border border-white/10 bg-[#0d1915] px-2.5 py-2.5 text-sm text-white outline-none focus:border-[#c9f36a]/60" /></div></div>
                            <p className="text-xs leading-5 text-[#839187]">মোট বাজেট = পুরস্কার × কাজের সংখ্যা। বিজ্ঞাপন নেটওয়ার্কের ক্লিক উৎসাহিত করে বা গন্তব্য প্ল্যাটফর্মের শর্ত ভঙ্গ করে এমন কাজ পোস্ট করবেন না।</p>
                            <CampaignSubmitButton />
                        </form>
                    </section>
                </>
            )}
        </main>
    );
}
