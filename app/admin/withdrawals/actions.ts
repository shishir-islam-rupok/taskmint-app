"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function adminError(message: string): never {
    redirect(`/admin/withdrawals?error=${encodeURIComponent(message)}`);
}

export async function reviewWithdrawalAction(formData: FormData) {
    const requestId = String(formData.get("requestId") ?? "").trim();
    const decision = String(formData.get("decision") ?? "").trim();
    const providerReference = String(formData.get("providerReference") ?? "").trim();
    const reviewNote = String(formData.get("reviewNote") ?? "").trim();

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
        adminError("Choose a valid withdrawal request.");
    }
    if (!(decision === "processing" || decision === "paid" || decision === "rejected")) {
        adminError("Choose a valid review decision.");
    }
    if (decision === "paid" && (providerReference.length < 4 || providerReference.length > 200)) {
        adminError("Enter the payout transaction reference (4–200 characters) before marking it paid.");
    }
    if (providerReference.length > 200 || reviewNote.length > 1000) {
        adminError("The payout reference or review note is too long.");
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) adminError("Supabase is not configured.");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) redirect("/login");

    // The database RPC re-checks the caller's finance/admin role and locks the request row.
    const { error } = await supabase.rpc("review_withdrawal_request", {
        p_request_id: requestId,
        p_decision: decision,
        p_provider_reference: providerReference || null,
        p_review_note: reviewNote || null,
    });

    if (error) adminError(error.message);
    redirect(`/admin/withdrawals?reviewed=${encodeURIComponent(decision)}`);
}
