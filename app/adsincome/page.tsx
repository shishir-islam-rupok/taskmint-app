import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CampaignTimer } from "./campaign-timer";
import { startCampaignSessionAction } from "./actions";
import { AdsterraSponsoredOfferButton } from "./adsterra-sponsored-offer";
import { resolveAdsterraConfig } from "@/lib/ads/adsterra-config.mjs";

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

    const adsterra = resolveAdsterraConfig({
        authenticated: Boolean(user),
        publisherSiteApproved: process.env.ADSTERRA_PUBLISHER_SITE_APPROVED === "true",
        smartlinkUrl: process.env.ADSTERRA_SMARTLINK_URL,
    });

    const [walletResult, campaignResult, submissionResult] = await Promise.all([
        supabase
            .from("wallets")
            .select("balance_minor,pending_minor,approved_minor,currency,updated_at")
            .eq("user_id", user.id)
            .maybeSingle(),
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

    const wallet = walletResult.data ?? {
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
        { label: "ওয়ালেট ব্যালেন্স", value: wallet.balance_minor },
        { label: "পর্যালোচনাধীন", value: wallet.pending_minor },
        { label: "অনুমোদিত পুরস্কার", value: wallet.approved_minor },
    ];

    return (
        <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-6 text-[#f1f4e9] sm:px-8 sm:py-10">
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                <Link href="/" className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-white">
                    <span className="grid size-8 place-items-center rounded-lg bg-[#c9f36a] text-xs font-black text-[#17210d]">T</span>taskmint
                </Link>
                <nav className="flex items-center gap-2 sm:gap-3">
                    <Link href="/ads" className="rounded-lg px-3 py-2 text-sm font-medium text-[#a9b5aa] transition hover:bg-white/5 hover:text-white">বিজ্ঞাপন</Link>
                    <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-[#a9b5aa] transition hover:bg-white/5 hover:text-white">ড্যাশবোর্ড</Link>
                    <Link href="/advertiser" className="rounded-lg px-3 py-2 text-sm font-medium text-[#a9b5aa] transition hover:bg-white/5 hover:text-white">কাজ পোস্ট</Link>
                    <form action={logoutAction}><button type="submit" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-[#bdc9be] transition hover:border-white/30 hover:bg-white/4 hover:text-white">লগ আউট</button></form>
                </nav>
            </header>

            <section className="animate-rise-in flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9f36a]">স্পন্সর করা কাজ</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">কাজ দেখুন, সম্পন্ন করুন, জমা দিন।</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9aa99f]">স্পন্সরের অর্থায়নে তৈরি কাজগুলো দেখুন। প্রতিটি সেশনের সময় সার্ভারে গণনা হয়; ক্যাম্পেইনদাতা আপনার জমা কাজ পর্যালোচনা না করা পর্যন্ত পুরস্কার অপেক্ষমাণ থাকবে।</p>
                </div>
                <Link href="/advertiser" className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/4">ক্যাম্পেইন পোস্ট করুন <span aria-hidden="true">↗</span></Link>
            </section>

            <div className="mt-6 border border-[#c9f36a]/20 bg-[#c9f36a]/6 px-4 py-3 text-xs leading-5 text-[#cbd8bf]">
                এগুলো TaskMint-এর স্পন্সর করা কার্যক্রম; AdSense/Adsterra বিজ্ঞাপনের পেইড ইমপ্রেশন বা ক্লিক নয়। প্রতিটি ক্যাম্পেইনের নির্দেশনা মেনে কাজের নোট জমা দিন।
            </div>

            <section className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_auto]">
                <div className="border border-white/10 bg-[#111e19] p-5 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c9f36a]">Adsterra Smartlink · ইউনিট 31739173</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">ঐচ্ছিক স্পন্সর অফার</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9aa99f]">আপনি চাইলে বাইরের Adsterra অফারটি খুলুন। এটি TaskMint-এর কাজ নয়: ক্লিক, দেখা বা কনভার্সন থেকে TaskMint সেশন বা ওয়ালেট পুরস্কার তৈরি হয় না।</p>
                    <div className="mt-4">
                        <AdsterraSponsoredOfferButton smartlinkUrl={adsterra.smartlinkUrl} disabledReason={adsterra.reason} />
                    </div>
                    <p className="mt-4 text-xs leading-5 text-[#839187]">লিংকটি অ্যাকাউন্ট-নির্দিষ্ট এবং আপনার ক্লিকের পরেই খুলবে। <Link href="/privacy" className="text-[#d6f5a4] underline decoration-[#c9f36a]/40 underline-offset-4">গোপনীয়তা নীতি</Link> · <a href="https://adsterra.com/publishers-terms-managed/" target="_blank" rel="noopener noreferrer" className="text-[#d6f5a4] underline decoration-[#c9f36a]/40 underline-offset-4">Adsterra প্রকাশক নীতিমালা</a></p>
                </div>
                <div className="border border-white/10 bg-[#111e19] p-5 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#839187]">পুরস্কারের যোগ্যতা</p>
                    <p className="mt-2 text-sm font-semibold text-white">Adsterra বিজ্ঞাপনে কোনো পুরস্কার নেই</p>
                    <p className="mt-2 max-w-sm text-xs leading-5 text-[#9aa99f]">Adsterra-এর প্রকাশক নীতিমালায় ইমপ্রেশন, ক্লিক বা কাজ বাড়ানোর জন্য পুরস্কার দেওয়া নিষিদ্ধ। Smartlink বিজ্ঞাপন দেখা ও কনভার্সন থেকে আয় করে, TaskMint-এ কাজ সম্পন্নের যাচাইকৃত তথ্য পাঠায় না।</p>
                </div>
            </section>


            {params.submitted ? <div role="status" className="mt-4 border border-[#c9f36a]/25 bg-[#c9f36a]/7 px-4 py-3 text-sm text-[#d6f5a4]">আপনার জমা কাজ পাওয়া গেছে। পুরস্কার বিজ্ঞাপনদাতার পর্যালোচনার অপেক্ষায় আছে।</div> : null}
            {params.error ? <div role="alert" className="mt-4 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm text-[#f0b9b1]">{params.error}</div> : null}
            {campaignResult.error ? <div role="alert" className="mt-4 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm leading-6 text-[#f0b9b1]">{rolePolicyRecursion ? <>ডেটাবেসের রোল নীতিতে পুনরাবৃত্তি সমস্যা হয়েছে। Supabase SQL Editor-এ <code>supabase/migrations/20261015_fix_user_roles_recursion.sql</code> চালিয়ে পেজটি আবার লোড করুন।</> : marketplaceMigrationMissing ? <>ক্যাম্পেইনের বেস টেবিল আছে, তবে মার্কেটপ্লেস মাইগ্রেশন নেই। Supabase SQL Editor-এ শুধু <code>supabase/migrations/20261014_campaign_marketplace.sql</code> চালিয়ে পেজটি আবার লোড করুন।</> : <>ক্যাম্পেইনের টেবিল পাওয়া যায়নি। Supabase SQL Editor-এ বেস স্কিমা ইনস্টল না থাকলে আগে একবার <code>supabase/schema.sql</code>, এরপর <code>supabase/migrations/20261014_campaign_marketplace.sql</code> চালান। দুটো শেষ হলে পেজটি আবার লোড করুন।</>} বিস্তারিত: {campaignResult.error.message}</div> : null}
            {walletResult.error ? <div role="alert" className="mt-4 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm text-[#f0b9b1]">ওয়ালেটের সারাংশ লোড করা যায়নি: {walletResult.error.message}</div> : null}
            {submissionResult.error && !campaignResult.error ? <div role="alert" className="mt-4 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm text-[#f0b9b1]">আপনার জমা কাজের ইতিহাস লোড করা যায়নি: {submissionResult.error.message}</div> : null}
            {watchError ? <div role="alert" className="mt-4 border border-[#e88d82]/30 bg-[#e88d82]/8 px-4 py-3 text-sm text-[#f0b9b1]">কাজ দেখার সেশন লোড করা যায়নি: {watchError}</div> : null}

            <section className="mt-5 grid gap-3 sm:grid-cols-3">
                {metrics.map((metric, index) => <article key={metric.label} className={`border px-5 py-4 ${index === 0 ? "border-[#c9f36a]/25 bg-[#c9f36a]/5.5" : "border-white/10 bg-[#111e19]"}`}><p className="text-xs text-[#9aa99f]">{metric.label}</p><p className={`mt-2 text-2xl font-semibold ${index === 0 ? "text-[#d9f7a0]" : "text-white"}`}>৳{Number(metric.value || 0).toLocaleString("bn-BD")}</p></article>)}
            </section>

            {watchSession && watchCampaign && watchSession.status === "started" ? (
                <div className="mt-6"><CampaignTimer sessionId={watchSession.id} expiresAt={watchSession.expires_at} title={watchCampaign.title} instructions={watchCampaign.instructions} destinationUrl={safeExternalUrl(watchCampaign.destination_url)} /></div>
            ) : null}
            {watchSession && watchSession.status !== "started" ? <div className="mt-6 border border-white/10 bg-[#111e19] px-4 py-3 text-sm text-[#b8c5b9]">এই সেশনটি ইতিমধ্যে জমা দেওয়া হয়েছে অথবা বন্ধ করা হয়েছে।</div> : null}

            <section className="mt-8">
                <div className="mb-4 flex items-end justify-between gap-4 border-b border-white/10 pb-4">
                <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#839187]">যাচাইকৃত ও অর্থায়িত</p><h2 className="mt-1.5 text-xl font-semibold text-white">উপলভ্য ক্যাম্পেইন</h2></div>
                <span className="text-xs text-[#839187]">{Number(campaignResult.data?.length ?? 0).toLocaleString("bn-BD")}টি চালু</span>
                </div>
                {campaignResult.data?.length ? (
                    <div className="divide-y divide-white/10 border-y border-white/10">
                        {campaignResult.data.map((campaign) => {
                            const submission = submissions.get(campaign.id);
                            return (
                                <article key={campaign.id} className="py-5 sm:px-3">
                                    <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2"><span className="rounded-sm bg-[#c9f36a]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#d6f5a4]">{campaign.category}</span><span className="text-xs text-[#839187]">{Number(campaign.watch_seconds).toLocaleString("bn-BD")} সেকেন্ড অপেক্ষা</span></div>
                                            <h3 className="mt-2 text-lg font-semibold text-white">{campaign.title}</h3>
                                            <p className="mt-1 max-w-3xl text-sm leading-5 text-[#9aa99f]">{campaign.description}</p>
                                            <p className="mt-2 text-xs leading-5 text-[#839187]">কাজের নির্দেশনা: {campaign.instructions}</p>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 lg:justify-end">
                                            <div className="text-left lg:text-right"><p className="text-[10px] uppercase tracking-[0.12em] text-[#748278]">অনুমোদনের পর পুরস্কার</p><p className="mt-1 text-lg font-semibold text-[#d9f7a0]">৳{Number(campaign.reward_minor).toLocaleString("bn-BD")}</p></div>
                                            {submission ? <span className={`rounded-lg px-3 py-2 text-xs font-semibold ${submission.status === "approved" ? "bg-[#c9f36a]/10 text-[#d6f5a4]" : submission.status === "rejected" ? "bg-[#e88d82]/10 text-[#f0b9b1]" : "bg-white/6 text-[#bdc9be]"}`}>{submission.status === "submitted" ? "পর্যালোচনাধীন" : submission.status === "approved" ? "অনুমোদিত" : "প্রত্যাখ্যাত"}</span> : <form action={startCampaignSessionAction}><input type="hidden" name="campaignId" value={campaign.id} /><button type="submit" className="rounded-lg bg-[#c9f36a] px-4 py-2.5 text-sm font-bold text-[#17210d] transition hover:bg-[#dcff86]">কাজ শুরু করুন <span aria-hidden="true">↗</span></button></form>}
                                        </div>
                                    </div>
                                    {submission?.status === "rejected" && submission.rejection_reason ? <p className="mt-3 border-l-2 border-[#e88d82]/50 pl-3 text-xs text-[#d7aaa3]">বিজ্ঞাপনদাতার নোট: {submission.rejection_reason}</p> : null}
                                </article>
                            );
                        })}
                    </div>
                ) : !campaignResult.error ? (
                    <div className="border-y border-white/10 py-12 text-center"><p className="text-base font-semibold text-white">এখন কোনো ক্যাম্পেইন চালু নেই</p><p className="mt-2 text-sm text-[#839187]">পর্যালোচনা ও অর্থায়ন যাচাইয়ের পর ক্যাম্পেইন এখানে দেখা যাবে।</p><Link href="/advertiser" className="mt-5 inline-flex rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/4">ক্যাম্পেইন পোস্ট করুন</Link></div>
                ) : null}
            </section>
        </main>
    );
}
