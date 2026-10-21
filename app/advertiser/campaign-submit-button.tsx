"use client";

import { useFormStatus } from "react-dom";

export function CampaignSubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="w-full rounded-md bg-[#c9f36a] px-4 py-3 text-sm font-bold text-[#17210d] transition hover:bg-[#dcff86] disabled:cursor-wait disabled:opacity-70"
        >
            {pending ? "ক্যাম্পেইনের খসড়া পোস্ট হচ্ছে…" : "ক্যাম্পেইনের খসড়া পোস্ট করুন"}
        </button>
    );
}
