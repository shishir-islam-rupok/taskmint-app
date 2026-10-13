import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const demoSession = cookieStore.get("taskmint_demo_session")?.value;

  if (demoSession) {
    const displayName = decodeURIComponent(demoSession || "TaskMint User");

    return (
      <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[#9ef8dc]">Dashboard</p>
            <h1 className="mt-2 text-4xl font-black text-white">Welcome, {displayName}</h1>
          </div>
          <span className="rounded-full border border-[#7ef5d3]/30 bg-[#7ef5d3]/10 px-3 py-1 text-sm font-semibold text-[#9ef8dc]">
            Demo session
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Available balance", "৳3,240"],
            ["Approved rewards", "৳1,980"],
            ["Pending review", "৳540"],
            ["Withdrawals", "2"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-[#091921] p-5">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-3 text-2xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-[#091921] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Role privileges</p>
          <ul className="mt-4 space-y-3 text-slate-300">
            <li>• Browse funded tasks with full eligibility and reward disclosure.</li>
            <li>• Submit proof for approved tasks and track review outcomes.</li>
            <li>• Manage wallet status, review payout requests, and follow withdrawals.</li>
            <li>• Access only the data assigned to the authenticated user and permitted role.</li>
          </ul>
        </div>
      </main>
    );
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "TaskMint User";

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[#9ef8dc]">Dashboard</p>
          <h1 className="mt-2 text-4xl font-black text-white">Welcome, {displayName}</h1>
        </div>
        <span className="rounded-full border border-[#7ef5d3]/30 bg-[#7ef5d3]/10 px-3 py-1 text-sm font-semibold text-[#9ef8dc]">
          User role
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Available balance", "৳3,240"],
          ["Approved rewards", "৳1,980"],
          ["Pending review", "৳540"],
          ["Withdrawals", "2"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-white/10 bg-[#091921] p-5">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-3 text-2xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-[#091921] p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Role privileges</p>
        <ul className="mt-4 space-y-3 text-slate-300">
          <li>• Browse funded tasks with full eligibility and reward disclosure.</li>
          <li>• Submit proof for approved tasks and track review outcomes.</li>
          <li>• Manage wallet status, review payout requests, and follow withdrawals.</li>
          <li>• Access only the data assigned to the authenticated user and permitted role.</li>
        </ul>
      </div>
    </main>
  );
}
