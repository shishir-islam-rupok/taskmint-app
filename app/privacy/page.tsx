import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy | TaskMint",
    description: "TaskMint privacy information for account, task, and sponsored-offer activity.",
};

export default function PrivacyPage() {
    return (
        <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-10 text-[#f1f4e9] sm:px-8 sm:py-16">
            <Link href="/" className="text-sm font-semibold text-[#c9f36a] hover:text-[#dcff86]">TaskMint</Link>
            <p className="mt-12 text-xs font-semibold uppercase tracking-[0.14em] text-[#c9f36a]">Privacy information</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Your data and sponsored offers</h1>
            <div className="mt-8 space-y-7 text-sm leading-7 text-[#b8c5b9]">
                <section>
                    <h2 className="text-base font-semibold text-white">TaskMint account and activity</h2>
                    <p className="mt-2">TaskMint uses Supabase to authenticate accounts and store account, campaign submission, and wallet records needed to operate the service. Authentication cookies are used to keep your session secure.</p>
                </section>
                <section>
                    <h2 className="text-base font-semibold text-white">Optional Adsterra Smartlink</h2>
                    <p className="mt-2">The Adsterra offer is opened only after you select “View Sponsored Offer.” It opens an external Adsterra destination in a separate tab. Adsterra may process technical, traffic-source, and interaction information under its own policies. TaskMint does not receive a verified completion event from this Smartlink and does not award TaskMint rewards for ad clicks, views, or conversions.</p>
                    <p className="mt-2"><a href="https://adsterra.com/privacy-policy-managed/" target="_blank" rel="noopener noreferrer" className="text-[#d6f5a4] underline decoration-[#c9f36a]/40 underline-offset-4">Adsterra privacy policy</a> · <a href="https://adsterra.com/publishers-terms-managed/" target="_blank" rel="noopener noreferrer" className="text-[#d6f5a4] underline decoration-[#c9f36a]/40 underline-offset-4">Adsterra publisher terms</a></p>
                </section>
                <section>
                    <h2 className="text-base font-semibold text-white">Ad tags</h2>
                    <p className="mt-2">TaskMint does not currently load Adsterra banner, native, Social Bar, or Popunder tags. These placements remain disabled until the exact unmodified publisher tags from an approved Adsterra account are configured. No ad-network tracking script is loaded by this page.</p>
                </section>
            </div>
            <Link href="/adsincome" className="mt-10 inline-flex rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/4">Back to sponsored tasks</Link>
        </main>
    );
}
