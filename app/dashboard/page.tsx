import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const supabase = await createServerSupabaseClient();

    if (!supabase) {
        redirect("/login");
    }

    const { data: verifiedClaims, error } = await supabase.auth.getClaims();
    const claims = verifiedClaims?.claims;

    if (error || !claims?.sub) {
        redirect("/login");
    }

    const [rolesResult, walletResult] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", claims.sub),
        supabase
            .from("wallets")
            .select("balance_minor,pending_minor,approved_minor,currency,updated_at")
            .eq("user_id", claims.sub)
            .maybeSingle(),
    ]);
    const isAdmin = (rolesResult.data || []).some((role) => role.role === "admin");
    const isFinance = (rolesResult.data || []).some((role) => role.role === "finance");

    const displayName = claims.user_metadata?.full_name || claims.email?.split("@")[0] || "TaskMint ব্যবহারকারী";
    const wallet = walletResult.data ?? {
        balance_minor: 0,
        pending_minor: 0,
        approved_minor: 0,
        currency: "BDT",
        updated_at: null,
    };
    const formatMoney = (amount: number) => `৳${Number(amount || 0).toLocaleString("bn-BD")}`;

    return (
        <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
            <div className="mb-9 flex items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <Link href="/" className="mb-6 flex w-fit items-center gap-2 text-sm font-extrabold tracking-tight text-white"><span className="grid size-7 place-items-center rounded-md bg-[#c9f36a] text-[10px] font-black text-[#17210d]">T</span>taskmint</Link>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9f36a]">আপনার কর্মক্ষেত্র</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">স্বাগতম, {displayName}</h1>
                </div>

                <div className="flex items-center gap-2">
                    {isAdmin || isFinance ? <Link href="/admin" className="rounded-lg border border-[#c9f36a]/25 px-3 py-2 text-sm font-semibold text-[#d6f5a4] hover:bg-[#c9f36a]/10">অ্যাডমিন</Link> : null}
                    <Link href="/wallet" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-[#bdc9be] hover:bg-white/4">ওয়ালেট</Link>
                    <form action={logoutAction}>
                        <button type="submit" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-[#bdc9be] transition hover:border-white/30 hover:bg-white/4 hover:text-white">লগ আউট</button>
                    </form>
                </div>
            </div>

            <section className="animate-rise-in grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: "ওয়ালেট ব্যালেন্স", value: formatMoney(wallet.balance_minor), hint: "বর্তমান অ্যাকাউন্ট ব্যালেন্স", accent: true },
                    { label: "পর্যালোচনাধীন", value: formatMoney(wallet.pending_minor), hint: "যাচাইয়ের অপেক্ষায় থাকা পুরস্কার" },
                    { label: "অনুমোদিত পুরস্কার", value: formatMoney(wallet.approved_minor), hint: "ওয়ালেটে অনুমোদিত আয়" },
                    { label: "অ্যাকাউন্টের অবস্থা", value: claims.email_verified ? "যাচাইকৃত" : "অপেক্ষমাণ", hint: claims.email_verified ? "ইমেইল নিশ্চিত হয়েছে" : "ইমেইল নিশ্চিত করুন" },
                ].map((item) => (
                    <article key={item.label} className={`border p-5 ${item.accent ? "border-[#c9f36a]/30 bg-[#c9f36a]/6" : "border-white/10 bg-[#111e19]"}`}>
                        <p className="text-xs font-medium text-[#9aa99f]">{item.label}</p>
                        <p className={`mt-4 text-2xl font-semibold tracking-tight ${item.accent ? "text-[#d9f7a0]" : "text-white"}`}>{item.value}</p>
                        <p className="mt-1.5 text-xs text-[#748278]">{item.hint}</p>
                    </article>
                ))}
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="border border-white/10 bg-[#111e19] p-6 sm:p-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c9f36a]">পরবর্তী ধাপ</p>
                            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">আপনার কাজের ক্ষেত্র বেছে নিন</h2>
                            <p className="mt-2 max-w-md text-sm leading-6 text-[#9aa99f]">কর্মীরা অর্থায়িত ক্যাম্পেইন থেকে কাজ বেছে নিতে পারেন। বিজ্ঞাপনদাতারা কাজ পোস্ট করে জমা দেওয়া কাজ যাচাই করতে পারেন।</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                            <Link href="/adsincome" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#c9f36a] px-4 py-3 text-sm font-bold text-[#17210d] transition hover:-translate-y-0.5 hover:bg-[#dcff86]">কাজ খুঁজুন <span aria-hidden="true">↗</span></Link>
                            <Link href="/advertiser" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/4">কাজ পোস্ট করুন <span aria-hidden="true">↗</span></Link>
                        </div>
                    </div>
                </div>
                <div className="border border-white/10 bg-[#111e19] p-6 sm:p-8">
                    <div className="flex items-center justify-between gap-3"><h2 className="text-base font-semibold text-white">অ্যাকাউন্টের তথ্য</h2><span className="rounded-full border border-[#c9f36a]/20 bg-[#c9f36a]/7 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#d6f5a4]">নিরাপদ</span></div>
                    <dl className="mt-5 space-y-4">
                        <div><dt className="text-xs text-[#748278]">ইমেইল ঠিকানা</dt><dd className="mt-1 break-all text-sm text-[#e2e9dc]">{claims.email}</dd></div>
                        <div><dt className="text-xs text-[#748278]">যাচাইকরণ</dt><dd className="mt-1 text-sm text-[#e2e9dc]">{claims.email_verified ? "ইমেইল যাচাইকৃত" : "নিশ্চিতকরণের অপেক্ষায়"}</dd></div>
                        <div><dt className="text-xs text-[#748278]">মুদ্রা</dt><dd className="mt-1 text-sm text-[#e2e9dc]">{wallet.currency || "BDT"}</dd></div>
                    </dl>
                </div>
            </section>
        </main>
    );
}
