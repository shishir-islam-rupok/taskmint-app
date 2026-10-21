import { ADSTERRA_UNITS } from "@/lib/ads/adsterra-config.mjs";

function integrationLabel(integration: (typeof ADSTERRA_UNITS)[number]["integration"]) {
    if (integration === "smartlink-click-only") return "শুধু বাটন · পুরস্কার নেই";
    return "প্রকাশক ট্যাগ যুক্ত";
}

export function AdsterraUnitCatalog() {
    return (
        <details className="border border-white/10 bg-[#111e19] p-5 sm:p-6">
            <summary className="cursor-pointer list-none text-sm font-semibold text-white marker:hidden">
                বিজ্ঞাপন ইউনিটের তালিকা <span className="ml-2 text-xs font-normal text-[#839187]">কাজের পুরস্কার থেকে আলাদা</span>
            </summary>
            <p className="mt-3 max-w-3xl text-xs leading-5 text-[#9aa99f]">
                আপনার দেওয়া প্রকাশক ট্যাগগুলো আলাদা sandboxed frame-এ চলে, যাতে বিজ্ঞাপন স্ক্রিপ্ট TaskMint-এর পেজ বা অ্যাকাউন্ট ডেটা পড়তে না পারে। বিজ্ঞাপন দেখাতে Adsterra-তে প্রকাশক সাইট অনুমোদিত থাকতে হবে।
            </p>
            <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
                {ADSTERRA_UNITS.map((unit) => (
                    <li key={unit.id} className="flex flex-col justify-between gap-1 py-3 text-xs sm:flex-row sm:items-center">
                        <span className="font-medium text-[#e2e9dc]">{unit.format} <span className="ml-1 font-mono text-[#839187]">ID {unit.id}</span></span>
                        <span className="text-[#9aa99f]">{integrationLabel(unit.integration)}</span>
                    </li>
                ))}
            </ul>
            <p className="mt-3 text-xs leading-5 text-[#839187]">কোনো Adsterra ইমপ্রেশন বা ক্লিক TaskMint-এর কাজের পুরস্কার হিসেবে গণনা হয় না।</p>
        </details>
    );
}
