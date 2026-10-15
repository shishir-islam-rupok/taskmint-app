"use client";

import { useState } from "react";

type AdsterraSponsoredOfferButtonProps = {
    smartlinkUrl: string | null;
    disabledReason: string | null;
};

type OfferState = "ready" | "opening" | "opened" | "error";

export function AdsterraSponsoredOfferButton({
    smartlinkUrl,
    disabledReason,
}: AdsterraSponsoredOfferButtonProps) {
    const [state, setState] = useState<OfferState>("ready");
    const [popupError, setPopupError] = useState<string | null>(null);
    const disabled = !smartlinkUrl || state === "opening" || state === "opened";

    function handleClick() {
        if (!smartlinkUrl || disabled) return;

        setPopupError(null);
        setState("opening");

        try {
            const offerWindow = window.open("about:blank", "_blank");
            if (!offerWindow) {
                setPopupError("Your browser blocked the new tab. Allow popups for TaskMint, then try again.");
                setState("error");
                return;
            }

            offerWindow.opener = null;
            offerWindow.location.replace(smartlinkUrl);
            window.setTimeout(() => setState("opened"), 200);
        } catch {
            setPopupError("The sponsored offer could not be opened. Please try again.");
            setState("error");
        }
    }

    const statusMessage = popupError
        || (state === "opening" ? "Opening the offer in a new tab…" : null)
        || (state === "opened" ? "Offer opened in a new tab. This visit does not earn a TaskMint reward." : disabledReason);

    return (
        <div>
            <button
                type="button"
                onClick={handleClick}
                disabled={disabled}
                aria-busy={state === "opening"}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#c9f36a] px-4 py-3 text-sm font-bold text-[#17210d] transition hover:bg-[#dcff86] disabled:cursor-not-allowed disabled:opacity-45"
            >
                {state === "opening" ? "Opening offer…" : state === "opened" ? "Offer opened" : "View Sponsored Offer"}
                {state === "ready" ? <span aria-hidden="true">↗</span> : null}
            </button>
            {statusMessage ? (
                <p className={`mt-2 text-xs leading-5 ${popupError ? "text-[#f0b9b1]" : "text-[#9aa99f]"}`} role={popupError ? "alert" : "status"}>
                    {statusMessage}
                </p>
            ) : null}
        </div>
    );
}
