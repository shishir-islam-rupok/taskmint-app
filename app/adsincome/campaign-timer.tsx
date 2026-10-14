"use client";

import { useEffect, useState } from "react";
import { completeCampaignSessionAction } from "./actions";

export function CampaignTimer({
    sessionId,
    expiresAt,
    title,
    instructions,
    destinationUrl,
}: {
    sessionId: string;
    expiresAt: string;
    title: string;
    instructions: string;
    destinationUrl: string | null;
}) {
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

    useEffect(() => {
        const updateCountdown = () => {
            setSecondsLeft(Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / 1000)));
        };

        updateCountdown();
        const timer = window.setInterval(updateCountdown, 1000);
        return () => window.clearInterval(timer);
    }, [expiresAt]);

    return (
        <section className="border border-[#c9f36a]/25 bg-[#111e19] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c9f36a]">Active sponsored task</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9aa99f]">{instructions}</p>
                </div>
                <div className="min-w-28 border border-white/10 bg-[#0d1915] px-4 py-3 text-center">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#748278]">Time remaining</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
                        {secondsLeft === null ? "--" : `${secondsLeft}s`}
                    </p>
                </div>
            </div>

            {destinationUrl ? (
                <a
                    href={destinationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.04]"
                >
                    Open sponsor page <span className="ml-2" aria-hidden="true">↗</span>
                </a>
            ) : null}

            <form action={completeCampaignSessionAction} className="mt-5 border-t border-white/[0.08] pt-5">
                <input type="hidden" name="sessionId" value={sessionId} />
                <label htmlFor="proofText" className="mb-2 block text-sm font-medium text-[#dbe4d7]">
                    Completion note for campaign review
                </label>
                <textarea
                    id="proofText"
                    name="proofText"
                    minLength={10}
                    maxLength={2000}
                    required
                    rows={3}
                    placeholder="Briefly describe the requested activity you completed."
                    className="w-full resize-y rounded-lg border border-white/10 bg-[#0d1915] px-3.5 py-3 text-sm text-white placeholder:text-[#748278] outline-none transition focus:border-[#c9f36a]/60"
                />
                <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <p className="max-w-xl text-xs leading-5 text-[#839187]">The timer is enforced server-side. Rewards remain pending until the campaign provider reviews your submission.</p>
                    <button
                        type="submit"
                        disabled={secondsLeft === null || secondsLeft > 0}
                        className="shrink-0 rounded-lg bg-[#c9f36a] px-4 py-2.5 text-sm font-bold text-[#17210d] transition hover:bg-[#dcff86] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Submit for review
                    </button>
                </div>
            </form>
        </section>
    );
}
