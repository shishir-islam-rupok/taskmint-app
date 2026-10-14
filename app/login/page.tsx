"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const oauthProviders = ["Google", "Apple"] as const;

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("user@example.com");
    const [password, setPassword] = useState("password123");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<"signin" | "signup">("signin");
    const configured = isSupabaseConfigured();

    async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        const client = createClient();

        if (!client || !configured) {
            setError("Supabase is not configured yet. Add your project URL and key to continue.");
            setLoading(false);
            return;
        }

        if (mode === "signup") {
            const { data, error: signUpError } = await client.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                setError(signUpError.message);
                setLoading(false);
                return;
            }

            if (data.user && !data.session) {
                setSuccess("Account created. Check your email to confirm your sign-up.");
            } else {
                router.push("/dashboard");
            }

            setLoading(false);
            return;
        }

        const { error: signInError } = await client.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            setError(signInError.message);
            setLoading(false);
            return;
        }

        router.push("/dashboard");
    }

    async function handleProviderLogin(provider: (typeof oauthProviders)[number]) {
        const client = createClient();

        if (!client || !configured) {
            setError("Supabase is not configured yet. Add your project URL and key to continue.");
            return;
        }

        const { error: oauthError } = await client.auth.signInWithOAuth({
            provider: provider.toLowerCase() as "google" | "apple",
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        });

        if (oauthError) {
            setError(oauthError.message);
        }
    }

    return (
        <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-16">
            <div className="grid w-full max-w-4xl gap-8 overflow-hidden rounded-4xl border border-white/10 bg-[#081b22] shadow-2xl shadow-[#0b2431]/40 lg:grid-cols-2">
                <div className="bg-linear-to-br from-[#0d1d27] via-[#0a1b22] to-[#071114] p-8 sm:p-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9ef8dc]">
                        Secure access
                    </p>
                    <h1 className="mt-5 text-4xl font-black text-white">Welcome to TaskMint</h1>
                    <p className="mt-4 text-base leading-7 text-slate-300">
                        Sign in to review task eligibility, manage your wallet, and track approved submissions with clear payout visibility.
                    </p>

                    <div className="mt-8 space-y-3">
                        {[
                            "Email verification on signup",
                            "Role-based dashboard access",
                            "Protected payout and review flows",
                        ].map((item) => (
                            <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3 px-3 py-3 text-sm text-slate-200">
                                <div className="h-2.5 w-2.5 rounded-full bg-[#7ef5d3]" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 sm:p-10">
                    <div className="flex gap-2 rounded-full border border-white/10 bg-[#091921] p-1">
                        <button
                            type="button"
                            onClick={() => setMode("signin")}
                            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${mode === "signin" ? "bg-[#7ef5d3] text-[#06151b]" : "text-slate-300"}`}
                        >
                            Sign in
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("signup")}
                            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-[#7ef5d3] text-[#06151b]" : "text-slate-300"}`}
                        >
                            Create account
                        </button>
                    </div>

                    <h2 className="mt-6 text-3xl font-bold text-white">
                        {mode === "signin" ? "Access your account" : "Create your account"}
                    </h2>

                    <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            className="w-full rounded-full border border-white/10 bg-[#091921] px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-[#7ef5d3]/70"
                            required
                        />

                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Password"
                            className="w-full rounded-full border border-white/10 bg-[#091921] px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-[#7ef5d3]/70"
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
                            className="w-full rounded-full bg-[#7ef5d3] px-4 py-3 text-sm font-bold text-[#06151b] transition hover:bg-[#9ef3dc] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (mode === "signin" ? "Signing in..." : "Creating account...") : mode === "signin" ? "Sign in with email" : "Create account"}
                        </button>
                    </form>

                    <div className="mt-6 space-y-3">
                        {oauthProviders.map((provider) => (
                            <button
                                key={provider}
                                className="flex w-full items-center justify-center rounded-full border border-white/10 bg-white/4 px-4 py-3 text-sm font-semibold text-white transition hover:border-[#7ef5d3]/40 hover:bg-[#7ef5d3]/10"
                                type="button"
                                onClick={() => handleProviderLogin(provider)}
                            >
                                Continue with {provider}
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 rounded-2xl border border-white/10 bg-[#091921] p-4 text-sm text-slate-300">
                        {configured
                            ? "Supabase auth is enabled for live sign-in and account creation."
                            : "Supabase env values are not configured yet. Add your project URL and key to enable authentication."}
                    </div>
                </div>
            </div>
        </main>
    );
}
