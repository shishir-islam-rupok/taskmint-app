"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function campaignError(message: string): never {
    redirect(`/adsincome?error=${encodeURIComponent(message)}`);
}

export async function startCampaignSessionAction(formData: FormData) {
    const campaignId = String(formData.get("campaignId") || "");
    if (!campaignId) campaignError("Choose a campaign first.");

    const supabase = await createServerSupabaseClient();
    if (!supabase) campaignError("Supabase is not configured.");

    const { data, error } = await supabase.rpc("start_campaign_session", {
        p_campaign_id: campaignId,
    });

    if (error || !data) campaignError(error?.message || "Could not start this campaign.");
    redirect(`/adsincome?watch=${encodeURIComponent(data)}`);
}

export async function completeCampaignSessionAction(formData: FormData) {
    const sessionId = String(formData.get("sessionId") || "");
    const proofText = String(formData.get("proofText") || "").trim();
    if (!sessionId) campaignError("Your campaign session was not found.");
    if (proofText.length < 10 || proofText.length > 2000) {
        campaignError("Add a completion note between 10 and 2000 characters.");
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) campaignError("Supabase is not configured.");

    const { error } = await supabase.rpc("complete_campaign_session", {
        p_session_id: sessionId,
        p_proof_text: proofText,
    });

    if (error) campaignError(error.message);
    redirect("/adsincome?submitted=1");
}
