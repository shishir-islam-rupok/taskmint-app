const tasks = [
  {
    title: "Bangladesh SME Buyer Interview",
    category: "Research",
    reward: "৳450",
    time: "18 mins",
    proof: "Voice + screen share",
    mode: "Mobile friendly",
    status: "Funded",
  },
  {
    title: "Food delivery app usability test",
    category: "Usability",
    reward: "৳600",
    time: "22 mins",
    proof: "Screen recording",
    mode: "Remote",
    status: "New",
  },
  {
    title: "Checkout flow accessibility review",
    category: "QA",
    reward: "৳320",
    time: "12 mins",
    proof: "Checklist + notes",
    mode: "Desktop",
    status: "High priority",
  },
];

const stats = [
  { label: "Available tasks", value: "128" },
  { label: "Avg. payout", value: "৳410" },
  { label: "Approval rate", value: "92%" },
  { label: "Active advertisers", value: "34" },
];

const queue = [
  { user: "Nadia R.", task: "App onboarding review", amount: "৳300", risk: "Low" },
  { user: "Arafat K.", task: "Survey completion", amount: "৳190", risk: "Normal" },
  { user: "Jui S.", task: "Website usability test", amount: "৳420", risk: "Escalated" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#06151b] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header className="mb-10 flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7ef5d3] text-sm font-bold text-[#06151b]">
              T
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">TaskMint</p>
              <p className="text-xs text-slate-400">Microtask rewards</p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#tasks" className="transition hover:text-[#7ef5d3]">Tasks</a>
            <a href="#wallet" className="transition hover:text-[#7ef5d3]">Wallet</a>
            <a href="#advertisers" className="transition hover:text-[#7ef5d3]">Advertisers</a>
            <a href="#review" className="transition hover:text-[#7ef5d3]">Review</a>
          </nav>

          <div className="flex items-center gap-3">
            <button className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-[#7ef5d3] hover:text-[#7ef5d3] sm:inline-flex">
              Log in
            </button>
            <button className="rounded-full bg-[#7ef5d3] px-4 py-2 text-sm font-semibold text-[#06151b] transition hover:bg-[#a7f9df]">
              Start earning
            </button>
          </div>
        </header>

        <section className="grid gap-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0d1d27] via-[#091a22] to-[#071114] p-6 shadow-2xl shadow-[#0b2d35]/40 md:p-10 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center rounded-full border border-[#7ef5d3]/30 bg-[#7ef5d3]/10 px-3 py-1 text-xs font-medium text-[#9ef8dc]">
              Demo prototype · no real money connected
            </div>
            <h1 className="max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl">
              Research tasks that pay for real effort and real feedback.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              Complete verified product research, usability tests, and customer feedback tasks. Earn rewards after review, with transparency around rules, proof, and payout status.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button className="rounded-full bg-[#7ef5d3] px-6 py-3 text-sm font-bold text-[#06151b] transition hover:bg-[#9df3dc]">
                Explore tasks
              </button>
              <button className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
                Advertiser demo
              </button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {stats.slice(0, 3).map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/8 bg-[#0b1f29] p-4">
                  <p className="text-2xl font-bold text-[#7ef5d3]">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[#7ef5d3]/20 bg-[#071115] p-5 shadow-inner shadow-[#7ef5d3]/5">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Wallet</p>
              <span className="rounded-full border border-[#7ef5d3]/20 bg-[#7ef5d3]/10 px-2 py-1 text-xs font-medium text-[#9ef8dc]">
                Available
              </span>
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#0b1d27] p-4">
              <p className="text-sm text-slate-400">Current balance</p>
              <p className="mt-2 text-4xl font-black text-white">৳3,240</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/3 p-3">
                  <p className="text-slate-400">Pending</p>
                  <p className="mt-2 font-semibold text-[#7ef5d3]">৳540</p>
                </div>
                <div className="rounded-xl bg-white/3 p-3">
                  <p className="text-slate-400">Rewards</p>
                  <p className="mt-2 font-semibold text-[#7ef5d3]">৳1,980</p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                ["Approved", "৳590"],
                ["Under review", "৳240"],
                ["Withdrawal reserved", "৳450"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 px-3 py-2 text-sm">
                  <span className="text-slate-300">{label}</span>
                  <span className="font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="tasks" className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[#0c1d27] p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Marketplace</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Open tasks</h2>
              </div>
              <button className="rounded-full border border-[#7ef5d3]/25 bg-[#7ef5d3]/10 px-4 py-2 text-sm font-semibold text-[#9ef8dc]">
                Filters
              </button>
            </div>

            <div className="space-y-4">
              {tasks.map((task) => (
                <article key={task.title} className="rounded-2xl border border-white/8 bg-[#091921] p-4 transition hover:border-[#7ef5d3]/40 hover:bg-[#0a1f2a]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#7ef5d3]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9ef8dc]">
                          {task.category}
                        </span>
                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-300">
                          {task.status}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-white">{task.title}</h3>
                    </div>
                    <div className="rounded-xl bg-[#7ef5d3]/10 px-3 py-2 text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Reward</p>
                      <p className="mt-1 text-xl font-black text-[#7ef5d3]">{task.reward}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                    <span className="rounded-full border border-white/8 bg-white/3 px-2.5 py-1.5">{task.time}</span>
                    <span className="rounded-full border border-white/8 bg-white/3 px-2.5 py-1.5">{task.proof}</span>
                    <span className="rounded-full border border-white/8 bg-white/3 px-2.5 py-1.5">{task.mode}</span>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <p className="text-sm text-slate-400">Eligible in Bangladesh</p>
                    <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#071114] transition hover:bg-slate-200">
                      Start task
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside id="advertisers" className="rounded-[2rem] border border-white/10 bg-[#0d1c25] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Advertiser snapshot</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Campaign health</h2>

            <div className="mt-5 space-y-4">
              {[
                ["Campaign budget", "৳2.4L"],
                ["Approved spend", "৳1.6L"],
                ["Remaining slots", "84"],
                ["Review SLA", "12 hrs"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/8 bg-[#091921] px-4 py-3">
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="mt-2 text-xl font-bold text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[#7ef5d3]/20 bg-[#7ef5d3]/10 p-4">
              <p className="text-sm text-[#9ef8dc]">Revenue split</p>
              <p className="mt-2 text-2xl font-black text-white">60 / 40</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Platform and reward pool are separated by approved funded spend and published rules for review, payout, and fee handling.
              </p>
            </div>
          </aside>
        </section>

        <section id="review" className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div id="wallet" className="rounded-[2rem] border border-white/10 bg-[#0a1b22] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Payout controls</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Withdrawal flow</h2>

            <div className="mt-5 rounded-2xl border border-white/8 bg-[#091921] p-4">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Bank transfer</span>
                <span className="rounded-full bg-[#7ef5d3]/10 px-2 py-1 text-[#9ef8dc]">Verified</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                <span>Min payout</span>
                <span className="font-semibold text-white">৳250</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-slate-300">
                <span>Review SLA</span>
                <span className="font-semibold text-white">48 hrs</span>
              </div>
            </div>

            <button className="mt-5 w-full rounded-full bg-[#7ef5d3] px-4 py-3 text-sm font-bold text-[#06151b] transition hover:bg-[#9ef3dc]">
              Request payout
            </button>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0b1d27] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Moderator queue</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Submission review</h2>
              </div>
              <span className="rounded-full border border-[#7ef5d3]/20 bg-[#7ef5d3]/10 px-3 py-1 text-sm font-semibold text-[#9ef8dc]">
                12 pending
              </span>
            </div>

            <div className="space-y-3">
              {queue.map((item) => (
                <div key={item.user} className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-[#091921] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">{item.user}</p>
                    <p className="text-sm text-slate-300">{item.task}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[#7ef5d3]">{item.amount}</span>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                      {item.risk}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
