import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
    const supabase = await createServerSupabaseClient();
    if (!supabase) redirect("/login");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) redirect("/login");

    const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
    if (rolesError) redirect("/dashboard");

    const userRoles = roles ?? [];
    const isAdmin = userRoles.some(({ role }) => role === "admin");
    const canReviewPayouts = isAdmin || userRoles.some(({ role }) => role === "finance");
    if (!canReviewPayouts) redirect("/dashboard");

    const sections = [
        ...(isAdmin ? [{
            href: "/admin/campaigns",
            title: "ক্যাম্পেইন পরিচালনা",
            description: "বিজ্ঞাপনদাতার প্রোফাইল, ক্যাম্পেইন ও অর্থ জমার রেফারেন্স যাচাই করুন।",
            action: "ক্যাম্পেইন পর্যালোচনা",
        }] : []),
        {
            href: "/admin/withdrawals",
            title: "উত্তোলনের অনুরোধ",
            description: "ব্যবহারকারীর অর্থ উত্তোলনের অনুরোধ যাচাই ও নিষ্পত্তি করুন।",
            action: "উত্তোলন পর্যালোচনা",
        },
    ];

    return (
        <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-6 text-[#f1f4e9] sm:px-8 sm:py-10">
            <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                <Link href="/" className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-white"><span className="grid size-8 place-items-center rounded-lg bg-[#c9f36a] text-xs font-black text-[#17210d]">T</span>taskmint</Link>
                <nav className="flex flex-wrap items-center gap-2">
                    <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">ড্যাশবোর্ড</Link>
                    <form action={logoutAction}><button type="submit" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-[#bdc9be] hover:bg-white/4 hover:text-white">লগ আউট</button></form>
                </nav>
            </header>

            <section>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9f36a]">অ্যাডমিন ও পরিচালনা</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">প্রশাসনিক কাজ</h1>
                <p className="mt-3 text-sm leading-6 text-[#9aa99f]">আপনার দায়িত্ব অনুযায়ী পরিচালনা ও পর্যালোচনার কাজ বেছে নিন।</p>
            </section>

            <section className="mt-8 grid gap-4 md:grid-cols-2">
                {sections.map((section) => (
                    <article key={section.href} className="border border-white/10 bg-[#111e19] p-6">
                        <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                        <p className="mt-3 min-h-12 text-sm leading-6 text-[#9aa99f]">{section.description}</p>
                        <Link href={section.href} className="mt-6 inline-flex rounded-lg bg-[#c9f36a] px-4 py-3 text-sm font-bold text-[#17210d] transition hover:bg-[#dcff86]">{section.action}<span className="ml-2" aria-hidden="true">↗</span></Link>
                    </article>
                ))}
            </section>
        </main>
    );
}
