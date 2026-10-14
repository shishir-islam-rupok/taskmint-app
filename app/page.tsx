import Link from "next/link";

const features = [
    {
        number: "01",
        title: "Work that fits your day",
        description: "Browse short, clearly scoped activities and choose the ones that work for you.",
    },
    {
        number: "02",
        title: "A wallet with a paper trail",
        description: "See your balance, pending rewards, and approved earnings in one place.",
    },
    {
        number: "03",
        title: "Your account stays yours",
        description: "Sign in securely and keep your activity and account details private.",
    },
];

export default function Home() {
    return (
        <main className="overflow-hidden">
            <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
                <Link href="/" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-white">
                    <span className="grid size-9 place-items-center rounded-xl bg-[#c9f36a] text-sm font-black text-[#17210d]">T</span>
                    taskmint
                </Link>
                <nav className="flex items-center gap-3 sm:gap-7">
                    <a href="#how-it-works" className="hidden text-sm text-[#a6b3aa] transition hover:text-white sm:inline">How it works</a>
                    <a href="#why-taskmint" className="hidden text-sm text-[#a6b3aa] transition hover:text-white sm:inline">Why TaskMint</a>
                    <Link href="/login" className="text-sm font-semibold text-white transition hover:text-[#c9f36a]">Sign in</Link>
                    <Link href="/login" className="rounded-lg bg-[#c9f36a] px-4 py-2.5 text-sm font-bold text-[#17210d] transition hover:bg-[#dcff86]">Get started <span aria-hidden="true">↗</span></Link>
                </nav>
            </header>

            <section className="relative mx-auto grid min-h-[650px] max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:pb-28 lg:pt-16">
                <div className="animate-rise-in relative z-10 max-w-2xl">
                    <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#c9f36a]/20 bg-[#c9f36a]/[0.07] px-3 py-1.5 text-xs font-semibold text-[#d6f5a4]">
                        <span className="size-1.5 rounded-full bg-[#c9f36a]" />
                        A clearer way to earn online
                    </div>
                    <h1 className="max-w-2xl text-5xl font-semibold leading-[1.06] tracking-[-0.045em] text-[#f2f4e9] sm:text-6xl lg:text-[68px]">
                        Small tasks.<br /><span className="text-[#c9f36a]">Real progress.</span>
                    </h1>
                    <p className="mt-6 max-w-lg text-base leading-7 text-[#a9b5aa] sm:text-lg sm:leading-8">
                        Find bite-sized activities, track every reward, and manage your earnings from one secure account.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link href="/login" className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#c9f36a] px-5 py-3.5 text-sm font-bold text-[#17210d] transition hover:-translate-y-0.5 hover:bg-[#dcff86]">
                            Create your account <span aria-hidden="true">↗</span>
                        </Link>
                        <Link href="/login" className="inline-flex items-center justify-center rounded-lg border border-white/15 px-5 py-3.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.04]">
                            Explore the platform
                        </Link>
                    </div>
                    <div className="mt-9 flex items-center gap-2.5 text-sm text-[#9aa99f]">
                        <span className="grid size-7 place-items-center rounded-full border border-[#c9f36a]/25 text-xs text-[#c9f36a]">✓</span>
                        <span>Secure, account-based reward tracking</span>
                    </div>
                </div>

                <div className="animate-rise-in relative mx-auto w-full max-w-[540px] [animation-delay:120ms]">
                    <div className="absolute -right-12 top-8 h-56 w-56 rounded-full bg-[#c9f36a]/[0.08] blur-3xl" />
                    <div className="relative rotate-[1deg] rounded-[18px] border border-white/10 bg-[#111e19] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.35)] sm:p-4">
                        <div className="flex items-center justify-between border-b border-white/[0.08] px-2 pb-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-white"><span className="grid size-6 place-items-center rounded-md bg-[#c9f36a] text-[10px] font-black text-[#17210d]">T</span> Overview</div>
                            <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-[#9aa99f]">YOUR WORKSPACE</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-3">
                            <div className="col-span-2 rounded-xl border border-white/[0.08] bg-[#0d1915] p-4 sm:p-5">
                                <p className="text-xs text-[#9aa99f]">Your wallet</p>
                                <div className="mt-2 flex items-end justify-between gap-4">
                                    <p className="text-3xl font-semibold tracking-tight text-white">৳ —<span className="ml-1 text-sm font-medium text-[#9aa99f]">BDT</span></p>
                                    <span className="mb-1 rounded-md bg-[#c9f36a]/10 px-2 py-1 text-[10px] font-semibold text-[#c9f36a]">Account linked</span>
                                </div>
                                <div className="mt-5 flex h-20 items-center justify-center rounded-lg border border-dashed border-white/10 text-xs text-[#748278] sm:h-24">
                                    Your activity and rewards, in one place
                                </div>
                            </div>
                            <div className="rounded-xl border border-white/[0.08] bg-[#0d1915] p-4">
                                <p className="text-xs text-[#9aa99f]">Pending</p><p className="mt-2 text-xl font-semibold text-white">Tracked</p><p className="mt-1 text-[10px] text-[#748278]">Review status</p>
                            </div>
                            <div className="rounded-xl border border-white/[0.08] bg-[#0d1915] p-4">
                                <p className="text-xs text-[#9aa99f]">Approved</p><p className="mt-2 text-xl font-semibold text-white">Visible</p><p className="mt-1 text-[10px] text-[#748278]">In your wallet</p>
                            </div>
                        </div>
                        <div className="mt-3 rounded-xl border border-white/[0.08] bg-[#0d1915] p-4">
                            <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold text-white">A task to get started</p><span className="text-[10px] text-[#9aa99f]">20 SEC</span></div>
                            <div className="flex items-center justify-between gap-3"><div><p className="text-xs text-[#dce5d8]">Flower View Bonus</p><p className="mt-1 text-[10px] text-[#748278]">Quick campaign activity</p></div><span className="rounded-md bg-[#c9f36a] px-2.5 py-1.5 text-[10px] font-bold text-[#17210d]">৳ 140</span></div>
                        </div>
                    </div>
                    <div className="absolute -bottom-5 -left-5 rounded-xl border border-white/10 bg-[#172720] px-4 py-3 shadow-xl sm:-left-8">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-[#9aa99f]">Account status</p><p className="mt-1 flex items-center gap-2 text-xs font-semibold text-[#d6f5a4]"><span className="size-1.5 rounded-full bg-[#c9f36a]" /> Private & secure</p>
                    </div>
                </div>
            </section>

            <section id="how-it-works" className="border-y border-white/[0.08] bg-[#111e19]/60">
                <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:grid-cols-3 sm:px-8 sm:py-10">
                    {[{ value: "01", label: "Create an account" }, { value: "02", label: "Choose an activity" }, { value: "03", label: "Track your rewards" }].map((step) => <div key={step.value} className="flex items-center gap-4"><span className="font-mono text-xs text-[#c9f36a]">{step.value}</span><span className="text-sm font-medium text-[#e2e9dc]">{step.label}</span></div>)}
                </div>
            </section>

            <section id="why-taskmint" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
                <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c9f36a]">The TaskMint difference</p>
                        <h2 className="mt-4 max-w-md text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">A calmer way to keep your work in view.</h2>
                        <p className="mt-4 max-w-md text-sm leading-6 text-[#9aa99f]">Know what you can do, what you have earned, and where each reward stands. No clutter, no guesswork.</p>
                        <Link href="/login" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#c9f36a] hover:text-[#dcff86]">Start with TaskMint <span aria-hidden="true">↗</span></Link>
                    </div>
                    <div className="divide-y divide-white/[0.1] border-y border-white/[0.1]">
                        {features.map((feature) => <article key={feature.number} className="grid gap-3 py-6 sm:grid-cols-[52px_1fr] sm:gap-5"><span className="font-mono text-xs text-[#839187]">{feature.number}</span><div><h3 className="text-base font-semibold text-white">{feature.title}</h3><p className="mt-2 max-w-lg text-sm leading-6 text-[#9aa99f]">{feature.description}</p></div></article>)}
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/[0.08]">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 text-xs text-[#839187] sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>© {new Date().getFullYear()} TaskMint</span><span>Secure account access · Transparent reward tracking</span><Link href="/login" className="font-semibold text-[#c9f36a]">Sign in <span aria-hidden="true">↗</span></Link></div>
            </footer>
        </main>
    );
}
