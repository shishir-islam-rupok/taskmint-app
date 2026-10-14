"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function adminError(message: string): never {
    redirect(`/admin/campaigns?error=${encodeURIComponent(message)}`);
}

async function getAdminClient() {
    const supabase = await createServerSupabaseClient();
    if (!supabase) adminError("Supabase is not configured.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const { data: roles, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    if (error || !roles?.some((item) => item.role === "admin")) redirect("/dashboard");
    return supabase;
}

export async function reviewAdvertiserProfileAction(formData: FormData) {
    const profileId = String(formData.get("profileId") || "");
    const decision = String(formData.get("decision") || "");
    if (!profileId || (decision !== "approved" && decision !== "rejected")) adminError("Invalid provider review.");

    const supabase = await getAdminClient();
    const { data, error } = await supabase
        .from("advertiser_profiles")
        .update({ review_status: decision })
        .eq("id", profileId)
        .eq("review_status", "pending")
        .select("id")
        .maybeSingle();
    if (error || !data) adminError(error?.message || "Provider profile is no longer pending.");
    redirect(`/admin/campaigns?provider=${decision}`);
}

export async function reviewCampaignAction(formData: FormData) {
    const campaignId = String(formData.get("campaignId") || "");
    if (!campaignId) adminError("Choose a campaign.");

    const supabase = await getAdminClient();
    const { error } = await supabase.rpc("approve_campaign", { p_campaign_id: campaignId });
    if (error) adminError(error.message);
    redirect("/admin/campaigns?campaign=approved");
}

export async function reviewCampaignFundingAction(formData: FormData) {
    const fundingId = String(formData.get("fundingId") || "");
    const decision = String(formData.get("decision") || "");
    if (!fundingId || (decision !== "paid" && decision !== "rejected")) adminError("Invalid funding review.");

    const supabase = await getAdminClient();
    const { data, error } = await supabase
        .from("campaign_funding")
        .update({ status: decision })
        .eq("id", fundingId)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
    if (error || !data) adminError(error?.message || "Funding request is no longer pending.");
    redirect(`/admin/campaigns?funding=${decision}`);
}
