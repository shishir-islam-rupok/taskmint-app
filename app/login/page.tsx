const providers = ["Email", "Google", "Apple"];

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-16">
      <div className="grid w-full max-w-4xl gap-8 overflow-hidden rounded-4xl border border-white/10 bg-[#081b22] shadow-2xl shadow-[#0b2431]/40 lg:grid-cols-2">
        <div className="bg-linear-to-br from-[#0d1d27] via-[#0a1b22] to-[#071114] p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9ef8dc]">
            Secure access
          </p>
          <h1 className="mt-5 text-4xl font-black text-white">Welcome back to TaskMint</h1>
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
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Sign in</p>
          <h2 className="mt-3 text-3xl font-bold text-white">Access your account</h2>

          <div className="mt-6 space-y-3">
            {providers.map((provider) => (
              <button
                key={provider}
                className="flex w-full items-center justify-center rounded-full border border-white/10 bg-white/4 px-4 py-3 text-sm font-semibold text-white transition hover:border-[#7ef5d3]/40 hover:bg-[#7ef5d3]/10"
                type="button"
              >
                Continue with {provider}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#091921] p-4 text-sm text-slate-300">
            Demo note: this page is the auth entry point for the production foundation. Real provider
            configuration and server-side auth are required before live sign-in.
          </div>
        </div>
      </div>
    </main>
  );
}
