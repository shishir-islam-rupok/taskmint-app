import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import { getUserDashboardData } from "@/lib/supabase/earnings";
import { canActivateSubscriptionWithoutPayment } from "@/lib/supabase/subscription-policy.mjs";
import { subscribePlanAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function TaskPage({
    searchParams,
}: {
    searchParams?: Promise<{ status?: string; message?: string; plan?: string }>;
}) {
    const params = searchParams ? await searchParams : {};
    const dashboard = await getUserDashboardData();
    if (!dashboard.user) redirect("/login");

    const wallet = dashboard.wallet ?? {
        balance_minor: 0,
        pending_minor: 0,
        approved_minor: 0,
        currency: "BDT",
        updated_at: null,
    };
    const statusMessage = params.status === "subscribe"
        ? `${params.plan || "আপনার প্ল্যান"}-এর সাবস্ক্রিপশন চালু হয়েছে।`
        : params.status === "error"
            ? params.message || "কাজটি সম্পন্ন করা যায়নি।"
            : null;

    return (
        <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-6 text-[#f1f4e9] sm:px-8 sm:py-10">
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                <Link href="/" className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-white"><span className="grid size-8 place-items-center rounded-lg bg-[#c9f36a] text-xs font-black text-[#17210d]">T</span>taskmint</Link>
                <nav className="flex items-center gap-2 sm:gap-3"><Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-[#a9b5aa] hover:bg-white/5 hover:text-white">ড্যাশবোর্ড</Link><Link href="/wallet" className="rounded-lg px-3 py-2 text-sm font-medium text-[#a9b5aa] hover:bg-white/5 hover:text-white">ওয়ালেট</Link><Link href="/adsincome" className="rounded-lg px-3 py-2 text-sm font-medium text-[#a9b5aa] hover:bg-white/5 hover:text-white">ক্যাম্পেইন</Link><form action={logoutAction}><button type="submit" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-[#bdc9be] hover:bg-white/4 hover:text-white">লগ আউট</button></form></nav>
            </header>

            {statusMessage ? <div role="status" className={`mb-5 border px-4 py-3 text-sm ${params.status === "error" ? "border-[#e88d82]/30 bg-[#e88d82]/8 text-[#f0b9b1]" : "border-[#c9f36a]/25 bg-[#c9f36a]/7 text-[#d6f5a4]"}`}>{statusMessage}</div> : null}

            <section className="animate-rise-in grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9f36a]">কাজের কর্মক্ষেত্র</p>
                    <h1 className="mt-2 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">পর্যালোচিত কাজের ভিত্তিতে আয় করুন।</h1>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-[#9aa99f]">ক্যাম্পেইনের কাজ সার্ভার-নিয়ন্ত্রিত সেশন ও বিজ্ঞাপনদাতার পর্যালোচনার মাধ্যমে পরিচালিত হয়। জমা দেওয়া পুরস্কার অনুমোদন না হওয়া পর্যন্ত অপেক্ষমাণ থাকে; কেবল যাচাইকৃত ও অর্থায়িত ক্যাম্পেইনই এখানে দেখানো হয়।</p>

                    <div className="mt-7 grid gap-3 sm:grid-cols-2">
                        <Link href="/adsincome" className="group border border-[#c9f36a]/25 bg-[#c9f36a]/6 p-5 transition hover:border-[#c9f36a]/50">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c9f36a]">কর্মীদের জন্য</p><h2 className="mt-2 text-lg font-semibold text-white">স্পন্সর করা কাজ দেখুন <span aria-hidden="true" className="text-[#c9f36a]">↗</span></h2><p className="mt-2 text-sm leading-5 text-[#9aa99f]">যোগ্য ক্যাম্পেইনের কনটেন্ট দেখুন এবং পর্যালোচনার জন্য কাজ জমা দিন।</p>
                        </Link>
                        <Link href="/advertiser" className="group border border-white/10 bg-[#111e19] p-5 transition hover:border-white/25">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9aa99f]">বিজ্ঞাপনদাতাদের জন্য</p><h2 className="mt-2 text-lg font-semibold text-white">কাজ পোস্ট করুন <span aria-hidden="true" className="text-[#c9f36a]">↗</span></h2><p className="mt-2 text-sm leading-5 text-[#9aa99f]">ক্যাম্পেইনের খসড়া তৈরি করুন, জমা পড়া কাজ দেখুন এবং সম্পন্ন কাজ পর্যালোচনা করুন।</p>
                        </Link>
                    </div>

                    <div className="mt-7 grid gap-3 sm:grid-cols-3">
                        {[
                            { label: "ওয়ালেট ব্যালেন্স", value: wallet.balance_minor },
                            { label: "পর্যালোচনাধীন", value: wallet.pending_minor },
                            { label: "অনুমোদিত", value: wallet.approved_minor },
                        ].map((item, index) => <article key={item.label} className={`border px-4 py-3 ${index === 0 ? "border-[#c9f36a]/20 bg-[#c9f36a]/4" : "border-white/10 bg-[#111e19]"}`}><p className="text-[11px] text-[#9aa99f]">{item.label}</p><p className="mt-2 text-lg font-semibold text-white">৳{Number(item.value || 0).toLocaleString("bn-BD")}</p></article>)}
                    </div>
                </div>

                <aside className="border border-white/10 bg-[#111e19] p-5 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c9f36a]">প্রিমিয়াম সুবিধা</p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">আপনার কর্মক্ষেত্রের প্ল্যান</h2>
                    <p className="mt-2 text-sm leading-5 text-[#9aa99f]">সাবস্ক্রিপশন আপনার TaskMint অ্যাকাউন্টের সঙ্গে যুক্ত থাকবে।</p>
                    <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
                        {dashboard.plans.length ? dashboard.plans.map((plan) => {
                            const isActive = (dashboard.subscriptions || []).some((subscription) => subscription.plan_key === plan.key && subscription.status === "active");
                            const canActivate = canActivateSubscriptionWithoutPayment(plan.price_minor);
                            return <div key={plan.key} className="py-4">
                                <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-white">{plan.name}</h3><p className="mt-1.5 text-xs leading-5 text-[#9aa99f]">{plan.description}</p></div><span className={`shrink-0 rounded-sm px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${isActive ? "bg-[#c9f36a]/10 text-[#d6f5a4]" : "bg-white/6 text-[#9aa99f]"}`}>{isActive ? "চালু" : "উপলভ্য"}</span></div>
                                <div className="mt-4 flex items-center justify-between gap-3"><p className="text-lg font-semibold text-white">৳{Number(plan.price_minor).toLocaleString("bn-BD")}<span className="ml-1 text-[10px] font-normal text-[#748278]">BDT</span></p><form action={subscribePlanAction}><input type="hidden" name="planKey" value={plan.key} /><button type="submit" disabled={!canActivate} className="rounded-lg border border-[#c9f36a]/30 px-3 py-2 text-xs font-semibold text-[#d6f5a4] transition hover:bg-[#c9f36a]/10 disabled:cursor-not-allowed disabled:opacity-45">{isActive ? "চালু" : canActivate ? "বিনামূল্যের প্ল্যান চালু করুন" : "পেমেন্ট সেটআপ প্রয়োজন"}</button></form></div>
                                {(plan.features || []).length > 0 ? <ul className="mt-4 space-y-2">{(plan.features || []).map((feature) => <li key={feature} className="flex gap-2 text-xs text-[#a9b5aa]"><span className="text-[#c9f36a]">—</span><span>{feature}</span></li>)}</ul> : null}
                            </div>;
                        }) : <p className="py-6 text-sm text-[#839187]">এই অ্যাকাউন্টে কোনো সাবস্ক্রিপশন প্ল্যান সেট করা নেই।</p>}
                    </div>
                    <p className="mt-4 text-xs leading-5 text-[#839187]">পেমেন্ট প্রদানকারী ও যাচাইকৃত পেমেন্ট ব্যবস্থা সেট না করা পর্যন্ত পেইড সাবস্ক্রিপশন চালু হবে না।</p>
                </aside>
            </section>
        </main>
    );
}
