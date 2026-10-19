import { ADSTERRA_UNITS } from "@/lib/ads/adsterra-config.mjs";

function integrationLabel(integration: (typeof ADSTERRA_UNITS)[number]["integration"]) {
    if (integration === "disabled") return "লোড করা হয়নি";
    if (integration === "smartlink-click-only") return "শুধু বাটন · পুরস্কার নেই";
    return "অফিশিয়াল প্রকাশক ট্যাগ প্রয়োজন";
}

export function AdsterraUnitCatalog() {
    return (
        <details className="border border-white/10 bg-[#111e19] p-5 sm:p-6">
            <summary className="cursor-pointer list-none text-sm font-semibold text-white marker:hidden">
                সাধারণ বিজ্ঞাপনের স্থান <span className="ml-2 text-xs font-normal text-[#839187]">কাজের পুরস্কার থেকে আলাদা</span>
            </summary>
            <p className="mt-3 max-w-3xl text-xs leading-5 text-[#9aa99f]">
                বিজ্ঞাপন ইউনিটের আইডি ব্যবহারযোগ্য বিজ্ঞাপন ট্যাগ নয়। Adsterra অ্যাকাউন্ট থেকে আসল প্রকাশক ট্যাগ কপি না করা পর্যন্ত ব্যানার, নেটিভ বিজ্ঞাপন এবং Social Bar লোড হবে না। ট্যাগ অপরিবর্তিত রাখতে হবে এবং iframe-এ রাখা যাবে না।
            </p>
            <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
                {ADSTERRA_UNITS.map((unit) => (
                    <li key={unit.id} className="flex flex-col justify-between gap-1 py-3 text-xs sm:flex-row sm:items-center">
                        <span className="font-medium text-[#e2e9dc]">{unit.format} <span className="ml-1 font-mono text-[#839187]">ID {unit.id}</span></span>
                        <span className={unit.integration === "disabled" ? "text-[#d7aaa3]" : "text-[#9aa99f]"}>{integrationLabel(unit.integration)}</span>
                    </li>
                ))}
            </ul>
            <p className="mt-3 text-xs leading-5 text-[#839187]">Popunder ইচ্ছাকৃতভাবে বন্ধ রাখা হয়েছে। এই ইন্টিগ্রেশনে Adsterra-এর কোনো ফরম্যাটেই TaskMint পুরস্কার প্রযোজ্য নয়।</p>
        </details>
    );
}
