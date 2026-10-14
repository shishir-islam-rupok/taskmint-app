import Link from "next/link";

export default function Home() {
    return (
        <main className="flex min-h-screen items-center justify-center px-6 py-16">
            <section className="w-full max-w-3xl border-l-4 border-[#7ef5d3] py-4 pl-7 sm:pl-10">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9ef8dc]">
                    TaskMint account
                </p>
                <h1 className="mt-5 max-w-2xl text-4xl font-black text-white sm:text-5xl">
                    Your work and rewards, tied to your account.
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
                    Create an account or sign in to access your private TaskMint area. Your account details are secured by Supabase authentication.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                        href="/login"
                        className="rounded-full bg-[#7ef5d3] px-6 py-3 text-sm font-bold text-[#06151b] transition hover:bg-[#9df3dc]"
                    >
                        Sign in or create account
                    </Link>
                    <Link
                        href="/task"
                        className="rounded-full border border-white/10 bg-white/3 px-6 py-3 text-sm font-bold text-white transition hover:border-[#7ef5d3]/40 hover:bg-[#7ef5d3]/10"
                    >
                        Open task board
                    </Link>
                </div>
            </section>
        </main>
    );
}
