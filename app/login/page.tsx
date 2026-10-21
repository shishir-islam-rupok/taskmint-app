"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const oauthProviders = ["Google", "Apple"] as const;

function getSafeNextPath(value: string | null) {
    if (!value) return "/dashboard";

    try {
        const destination = new URL(value, "https://taskmint.local");
        if (destination.origin !== "https://taskmint.local") return "/dashboard";
        return `${destination.pathname}${destination.search}${destination.hash}`;
    } catch {
        return "/dashboard";
    }
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextPath = getSafeNextPath(searchParams.get("next"));
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<"signin" | "signup">(searchParams.get("mode") === "signup" ? "signup" : "signin");
    const configured = isSupabaseConfigured();
    const [checkingSession, setCheckingSession] = useState(configured);

    useEffect(() => {
        const client = createClient();
        if (!client) {
            return;
        }

        client.auth.getUser()
            .then(({ data, error: sessionError }) => {
                if (sessionError) {
                    setError(`সেশন যাচাই করা যায়নি: ${sessionError.message}`);
                    setCheckingSession(false);
                    return;
                }

                if (data.user) {
                    router.replace(nextPath);
                    router.refresh();
                    return;
                }

                setCheckingSession(false);
            })
            .catch((sessionError: unknown) => {
                const message = sessionError instanceof Error ? sessionError.message : "অজানা ত্রুটি";
                setError(`সেশন যাচাই করা যায়নি: ${message}`);
                setCheckingSession(false);
            });
    }, [nextPath, router]);

    async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        const client = createClient();

        if (!client || !configured) {
            setError("Supabase এখনো সেটআপ করা হয়নি। চালিয়ে যেতে প্রজেক্ট URL ও key যোগ করুন।");
            setLoading(false);
            return;
        }

        if (mode === "signup") {
            const { data, error: signUpError } = await client.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
                },
            });

            if (signUpError) {
                setError(`অ্যাকাউন্ট তৈরি করা যায়নি: ${signUpError.message}`);
                setLoading(false);
                return;
            }

            if (data.user && !data.session) {
                setSuccess("অ্যাকাউন্ট তৈরি হয়েছে। সাইন আপ নিশ্চিত করতে ইমেইল দেখুন।");
            } else {
                router.replace(nextPath);
                router.refresh();
            }

            setLoading(false);
            return;
        }

        const { error: signInError } = await client.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            setError(`লগ ইন করা যায়নি: ${signInError.message}`);
            setLoading(false);
            return;
        }

        router.replace(nextPath);
        router.refresh();
    }

    async function handleProviderLogin(provider: (typeof oauthProviders)[number]) {
        const client = createClient();

        if (!client || !configured) {
            setError("Supabase এখনো সেটআপ করা হয়নি। চালিয়ে যেতে প্রজেক্ট URL ও key যোগ করুন।");
            return;
        }

        const { error: oauthError } = await client.auth.signInWithOAuth({
            provider: provider.toLowerCase() as "google" | "apple",
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
            },
        });

        if (oauthError) {
            setError(`লগ ইন করা যায়নি: ${oauthError.message}`);
        }
    }

    if (checkingSession) {
        return <main className="grid min-h-screen place-items-center px-5 text-sm text-[#a9b5aa]" role="status">আপনার সাইন-ইন অবস্থা যাচাই করা হচ্ছে…</main>;
    }

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-5 py-10 sm:px-8 sm:py-16">
            <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#111e19] shadow-[0_32px_100px_rgba(0,0,0,0.35)] lg:grid-cols-[0.95fr_1.05fr]">
                <div className="order-2 relative flex flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top_left,rgba(201,243,106,0.13),transparent_55%),linear-gradient(145deg,#172720,#101b16_65%,#0e1814)] p-7 sm:p-10 lg:order-1 lg:p-12">
                    <div className="absolute -right-20 top-28 size-64 rounded-full border border-[#c9f36a]/10" />
                    <div className="absolute -right-10 top-38 size-44 rounded-full border border-[#c9f36a]/10" />
                    <Link href="/" className="relative flex w-fit items-center gap-2.5 text-base font-extrabold tracking-tight text-white"><span className="grid size-8 place-items-center rounded-lg bg-[#c9f36a] text-xs font-black text-[#17210d]">T</span>taskmint</Link>
                    <div className="relative mt-16 sm:mt-24">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9f36a]">
                            আপনার কাজ, আপনার নিয়ন্ত্রণে
                        </p>
                        <h1 className="mt-5 max-w-sm text-4xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-5xl">অনলাইন কাজ ও আয়ের সহজ হিসাব।</h1>
                        <p className="mt-4 max-w-md text-sm leading-7 text-[#a9b5aa] sm:text-base">
                            কাজ খুঁজতে, পুরস্কারের অবস্থা দেখতে এবং নিরাপদ কর্মক্ষেত্র থেকে অ্যাকাউন্ট পরিচালনা করতে লগ ইন করুন।
                        </p>

                        <div className="mt-9 space-y-3">
                            {[
                                "নিরাপদ ও ব্যক্তিগত অ্যাকাউন্ট",
                                "ব্যালেন্স ও পুরস্কারের স্পষ্ট হিসাব",
                                "কাজ শুরুর আগেই পুরস্কারের তথ্য",
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-3 border-b border-white/8 py-3 text-sm text-[#d5ded2]">
                                    <div className="grid size-5 shrink-0 place-items-center rounded-full border border-[#c9f36a]/35 text-[10px] text-[#c9f36a]">✓</div>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="relative mt-auto pt-12 text-xs text-[#839187]">Supabase-এর মাধ্যমে নিরাপদ লগ ইন</p>
                </div>

                <div className="order-1 p-7 sm:p-10 lg:order-2 lg:p-12">
                    <div className="flex gap-1 rounded-lg border border-white/10 bg-[#0d1915] p-1">
                        <button
                            type="button"
                            onClick={() => setMode("signin")}
                            className={`flex-1 rounded-md px-3 py-2.5 text-sm font-semibold transition ${mode === "signin" ? "bg-[#c9f36a] text-[#17210d]" : "text-[#a9b5aa] hover:text-white"}`}
                        >
                            লগ ইন
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("signup")}
                            className={`flex-1 rounded-md px-3 py-2.5 text-sm font-semibold transition ${mode === "signup" ? "bg-[#c9f36a] text-[#17210d]" : "text-[#a9b5aa] hover:text-white"}`}
                        >
                            নতুন অ্যাকাউন্ট
                        </button>
                    </div>

                    <h2 className="mt-8 text-3xl font-semibold tracking-tight text-white">
                        {mode === "signin" ? "আপনার অ্যাকাউন্টে প্রবেশ করুন" : "নতুন অ্যাকাউন্ট খুলুন"}
                    </h2>

                    <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="আপনার ইমেইল"
                            aria-label="ইমেইল ঠিকানা"
                            className="w-full rounded-lg border border-white/10 bg-[#0d1915] px-4 py-3.5 text-white placeholder:text-[#748278] outline-none transition focus:border-[#c9f36a]/70"
                            required
                        />

                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="পাসওয়ার্ড"
                            aria-label="পাসওয়ার্ড"
                            className="w-full rounded-lg border border-white/10 bg-[#0d1915] px-4 py-3.5 text-white placeholder:text-[#748278] outline-none transition focus:border-[#c9f36a]/70"
                            required
                            minLength={6}
                        />

                        {error ? (
                            <p className="rounded-2xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                                {error}
                            </p>
                        ) : null}

                        {success ? (
                            <p className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                                {success}
                            </p>
                        ) : null}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-[#c9f36a] px-4 py-3.5 text-sm font-bold text-[#17210d] transition hover:bg-[#dcff86] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (mode === "signin" ? "লগ ইন হচ্ছে…" : "অ্যাকাউন্ট তৈরি হচ্ছে…") : mode === "signin" ? "ইমেইল দিয়ে লগ ইন" : "অ্যাকাউন্ট তৈরি করুন"}
                        </button>
                    </form>

                    <div className="mt-6 space-y-3">
                        {oauthProviders.map((provider) => (
                            <button
                                key={provider}
                                className="flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/2.5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/5"
                                type="button"
                                onClick={() => handleProviderLogin(provider)}
                            >
                                {provider} দিয়ে চালিয়ে যান
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 border-t border-white/8 pt-4 text-xs leading-5 text-[#839187]">
                        {configured
                            ? "Supabase লগ ইন ও অ্যাকাউন্ট তৈরির জন্য সক্রিয় আছে।"
                            : "Supabase-এর URL ও key সেট করা নেই। লগ ইন চালু করতে এগুলো যোগ করুন।"}
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<main className="grid min-h-screen place-items-center px-5 text-sm text-[#a9b5aa]" role="status">আপনার সাইন-ইন অবস্থা যাচাই করা হচ্ছে…</main>}>
            <LoginForm />
        </Suspense>
    );
}
