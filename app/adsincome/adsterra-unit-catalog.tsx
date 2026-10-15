import { ADSTERRA_UNITS } from "@/lib/ads/adsterra-config.mjs";

function integrationLabel(integration: (typeof ADSTERRA_UNITS)[number]["integration"]) {
    if (integration === "disabled") return "Not loaded";
    if (integration === "smartlink-click-only") return "Button only · no reward";
    return "Official publisher tag required";
}

export function AdsterraUnitCatalog() {
    return (
        <details className="border border-white/10 bg-[#111e19] p-5 sm:p-6">
            <summary className="cursor-pointer list-none text-sm font-semibold text-white marker:hidden">
                Standard ad placements <span className="ml-2 text-xs font-normal text-[#839187]">Separate from task rewards</span>
            </summary>
            <p className="mt-3 max-w-3xl text-xs leading-5 text-[#9aa99f]">
                Ad unit IDs are not executable ad tags. Standard banners, native ads, and the social bar remain unloaded until you copy the exact publisher tag from your Adsterra account. Tags must remain unchanged and must not be placed in an iframe.
            </p>
            <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
                {ADSTERRA_UNITS.map((unit) => (
                    <li key={unit.id} className="flex flex-col justify-between gap-1 py-3 text-xs sm:flex-row sm:items-center">
                        <span className="font-medium text-[#e2e9dc]">{unit.format} <span className="ml-1 font-mono text-[#839187]">ID {unit.id}</span></span>
                        <span className={unit.integration === "disabled" ? "text-[#d7aaa3]" : "text-[#9aa99f]"}>{integrationLabel(unit.integration)}</span>
                    </li>
                ))}
            </ul>
            <p className="mt-3 text-xs leading-5 text-[#839187]">Popunder is intentionally disabled. No Adsterra format in this integration is eligible for TaskMint rewards.</p>
        </details>
    );
}
