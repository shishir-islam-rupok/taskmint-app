import Link from "next/link";
import { logoutAction } from "@/lib/auth/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const features = [
    {
        number: "01",
        title: "আপনার সময়ের সঙ্গে মানানসই কাজ",
        description: "ছোট ও স্পষ্ট কাজগুলো দেখুন, আপনার সুবিধামতো বেছে নিন।",
    },
    {
        number: "02",
        title: "হিসাবসহ ওয়ালেট",
        description: "ব্যালেন্স, যাচাইাধীন পুরস্কার ও অনুমোদিত আয় এক জায়গায় দেখুন।",
    },
    {
        number: "03",
        title: "আপনার অ্যাকাউন্ট, আপনার নিয়ন্ত্রণে",
        description: "নিরাপদে সাইন ইন করুন এবং আপনার কাজ ও অ্যাকাউন্টের তথ্য ব্যক্তিগত রাখুন।",
    },
];

export const dynamic = "force-dynamic";

export default async function Home() {
    const supabase = await createServerSupabaseClient();
    let signedIn = false;

    if (supabase) {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        signedIn = Boolean(data.user);
    }

    return (
        <main className="overflow-hidden">
            <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
                <Link href="/" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-white">
                    <span className="grid size-9 place-items-center rounded-xl bg-[#c9f36a] text-sm font-black text-[#17210d]">T</span>
                    taskmint
                </Link>
                <nav className="flex items-center gap-3 sm:gap-7">
                    <a href="#how-it-works" className="hidden text-sm text-[#a6b3aa] transition hover:text-white sm:inline">যেভাবে কাজ করে</a>
                    <a href="#why-taskmint" className="hidden text-sm text-[#a6b3aa] transition hover:text-white sm:inline">কেন TaskMint</a>
                    {signedIn ? (
                        <>
                            <Link href="/dashboard" className="text-sm font-semibold text-white transition hover:text-[#c9f36a]">আমার ড্যাশবোর্ড</Link>
                            <form action={logoutAction}><button type="submit" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:border-white/30">সাইন আউট</button></form>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-semibold text-white transition hover:text-[#c9f36a]">লগ ইন</Link>
                            <Link href="/login?mode=signup" className="rounded-lg bg-[#c9f36a] px-4 py-2.5 text-sm font-bold text-[#17210d] transition hover:bg-[#dcff86]">শুরু করুন <span aria-hidden="true">↗</span></Link>
                        </>
                    )}
                </nav>
            </header>

            <section className="relative mx-auto grid min-h-162.5 max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:pb-28 lg:pt-16">
                <div className="animate-rise-in relative z-10 max-w-2xl">
                    <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#c9f36a]/20 bg-[#c9f36a]/7 px-3 py-1.5 text-xs font-semibold text-[#d6f5a4]">
                        <span className="size-1.5 rounded-full bg-[#c9f36a]" />
                        অনলাইনে আয়ের সহজ ও স্বচ্ছ উপায়
                    </div>
                    <h1 className="max-w-2xl text-5xl font-semibold leading-[1.06] tracking-[-0.045em] text-[#f2f4e9] sm:text-6xl lg:text-[68px]">
                        ছোট কাজ।<br /><span className="text-[#c9f36a]">বাস্তব অগ্রগতি।</span>
                    </h1>
                    <p className="mt-6 max-w-lg text-base leading-7 text-[#a9b5aa] sm:text-lg sm:leading-8">
                        ছোট ছোট কাজ খুঁজুন, প্রতিটি পুরস্কারের হিসাব রাখুন এবং একটি নিরাপদ অ্যাকাউন্ট থেকেই আয় পরিচালনা করুন।
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link href={signedIn ? "/dashboard" : "/login?mode=signup"} className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#c9f36a] px-5 py-3.5 text-sm font-bold text-[#17210d] transition hover:-translate-y-0.5 hover:bg-[#dcff86]">
                            {signedIn ? "ড্যাশবোর্ডে যান" : "অ্যাকাউন্ট খুলুন"} <span aria-hidden="true">↗</span>
                        </Link>
                        <Link href={signedIn ? "/adsincome" : "/login"} className="inline-flex items-center justify-center rounded-lg border border-white/15 px-5 py-3.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/4">
                            কাজগুলো দেখুন
                        </Link>
                    </div>
                    <div className="mt-9 flex items-center gap-2.5 text-sm text-[#9aa99f]">
                        <span className="grid size-7 place-items-center rounded-full border border-[#c9f36a]/25 text-xs text-[#c9f36a]">✓</span>
                        <span>নিরাপদ অ্যাকাউন্টে আয়ের স্বচ্ছ হিসাব</span>
                    </div>
                </div>

                <div className="animate-rise-in relative mx-auto w-full max-w-135 [animation-delay:120ms]">
                    <div className="absolute -right-12 top-8 h-56 w-56 rounded-full bg-[#c9f36a]/8 blur-3xl" />
                    <div className="relative rotate-1 rounded-[18px] border border-white/10 bg-[#111e19] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.35)] sm:p-4">
                        <div className="flex items-center justify-between border-b border-white/8 px-2 pb-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-white"><span className="grid size-6 place-items-center rounded-md bg-[#c9f36a] text-[10px] font-black text-[#17210d]">T</span> সারসংক্ষেপ</div>
                        <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-[#9aa99f]">আপনার কর্মক্ষেত্র</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-3">
                            <div className="col-span-2 rounded-xl border border-white/8 bg-[#0d1915] p-4 sm:p-5">
                                <p className="text-xs text-[#9aa99f]">আপনার ওয়ালেট</p>
                                <div className="mt-2 flex items-end justify-between gap-4">
                                    <p className="text-3xl font-semibold tracking-tight text-white">৳ —<span className="ml-1 text-sm font-medium text-[#9aa99f]">BDT</span></p>
                                    <span className="mb-1 rounded-md bg-[#c9f36a]/10 px-2 py-1 text-[10px] font-semibold text-[#c9f36a]">অ্যাকাউন্ট সংযুক্ত</span>
                                </div>
                                <div className="mt-5 flex h-20 items-center justify-center rounded-lg border border-dashed border-white/10 text-xs text-[#748278] sm:h-24">
                                    কাজ ও পুরস্কারের হিসাব এক জায়গায়
                                </div>
                            </div>
                            <div className="rounded-xl border border-white/8 bg-[#0d1915] p-4">
                                <p className="text-xs text-[#9aa99f]">যাচাইাধীন</p><p className="mt-2 text-xl font-semibold text-white">হিসাবভুক্ত</p><p className="mt-1 text-[10px] text-[#748278]">যাচাইয়ের অবস্থা</p>
                            </div>
                            <div className="rounded-xl border border-white/8 bg-[#0d1915] p-4">
                                <p className="text-xs text-[#9aa99f]">অনুমোদিত</p><p className="mt-2 text-xl font-semibold text-white">দেখতে পাবেন</p><p className="mt-1 text-[10px] text-[#748278]">আপনার ওয়ালেটে</p>
                            </div>
                        </div>
                        <div className="mt-3 rounded-xl border border-white/8 bg-[#0d1915] p-4">
                            <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold text-white">শুরু করার একটি কাজ</p><span className="text-[10px] text-[#9aa99f]">২০ সেকেন্ড</span></div>
                            <div className="flex items-center justify-between gap-3"><div><p className="text-xs text-[#dce5d8]">ফুল দেখা বোনাস</p><p className="mt-1 text-[10px] text-[#748278]">দ্রুত সম্পন্ন করার কাজ</p></div><span className="rounded-md bg-[#c9f36a] px-2.5 py-1.5 text-[10px] font-bold text-[#17210d]">৳ ১৪০</span></div>
                        </div>
                    </div>
                    <div className="absolute -bottom-5 -left-5 rounded-xl border border-white/10 bg-[#172720] px-4 py-3 shadow-xl sm:-left-8">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-[#9aa99f]">অ্যাকাউন্টের অবস্থা</p><p className="mt-1 flex items-center gap-2 text-xs font-semibold text-[#d6f5a4]"><span className="size-1.5 rounded-full bg-[#c9f36a]" /> ব্যক্তিগত ও সুরক্ষিত</p>
                    </div>
                </div>
            </section>

            <section id="how-it-works" className="border-y border-white/8 bg-[#111e19]/60">
                <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:grid-cols-3 sm:px-8 sm:py-10">
                    {[{ value: "০১", label: "অ্যাকাউন্ট খুলুন" }, { value: "০২", label: "একটি কাজ বেছে নিন" }, { value: "০৩", label: "পুরস্কারের হিসাব রাখুন" }].map((step) => <div key={step.value} className="flex items-center gap-4"><span className="font-mono text-xs text-[#c9f36a]">{step.value}</span><span className="text-sm font-medium text-[#e2e9dc]">{step.label}</span></div>)}
                </div>
            </section>

            <section id="why-taskmint" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
                <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c9f36a]">TaskMint-এর বিশেষত্ব</p>
                        <h2 className="mt-4 max-w-md text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">কাজ ও আয়ের হিসাব থাকুক এক নজরে।</h2>
                        <p className="mt-4 max-w-md text-sm leading-6 text-[#9aa99f]">কী কাজ করতে পারবেন, কত আয় হয়েছে এবং প্রতিটি পুরস্কারের অবস্থা—সবই জানুন সহজে।</p>
                        <Link href={signedIn ? "/dashboard" : "/login?mode=signup"} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#c9f36a] hover:text-[#dcff86]">TaskMint শুরু করুন <span aria-hidden="true">↗</span></Link>
                    </div>
                    <div className="divide-y divide-white/10 border-y border-white/10">
                        {features.map((feature) => <article key={feature.number} className="grid gap-3 py-6 sm:grid-cols-[52px_1fr] sm:gap-5"><span className="font-mono text-xs text-[#839187]">{feature.number}</span><div><h3 className="text-base font-semibold text-white">{feature.title}</h3><p className="mt-2 max-w-lg text-sm leading-6 text-[#9aa99f]">{feature.description}</p></div></article>)}
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/8">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 text-xs text-[#839187] sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>© {new Date().getFullYear()} TaskMint</span><span>নিরাপদ অ্যাকাউন্ট · আয়ের স্বচ্ছ হিসাব</span>{signedIn ? <Link href="/dashboard" className="font-semibold text-[#c9f36a]">ড্যাশবোর্ড <span aria-hidden="true">↗</span></Link> : <Link href="/login" className="font-semibold text-[#c9f36a]">লগ ইন <span aria-hidden="true">↗</span></Link>}</div>
            </footer>
        </main>
    );
}
