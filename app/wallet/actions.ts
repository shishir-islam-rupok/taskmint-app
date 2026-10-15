"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateWithdrawalRequest } from "@/lib/finance/withdrawal-validation.mjs";

function walletError(message: string): never {
    redirect(`/wallet?error=${encodeURIComponent(message)}`);
}

export async function requestWithdrawalAction(formData: FormData) {
    const validation = validateWithdrawalRequest({
        amount: String(formData.get("amountBdt") ?? ""),
        method: String(formData.get("payoutMethod") ?? ""),
        details: String(formData.get("payoutAccount") ?? ""),
        idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
    });
    if (!validation.valid) walletError(validation.reason);

    const supabase = await createServerSupabaseClient();
    if (!supabase) walletError("Supabase is not configured.");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) redirect("/login");

    const { error } = await supabase.rpc("request_withdrawal", {
        p_amount_minor: validation.amount,
        p_payout_method: validation.method,
        p_payout_account: validation.details,
        p_idempotency_key: validation.idempotencyKey,
    });

    if (error) walletError(error.message);
    redirect("/wallet?requested=1");
}
