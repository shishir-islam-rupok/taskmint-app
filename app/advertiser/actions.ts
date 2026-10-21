"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function advertiserError(message: string): never {
    redirect(`/advertiser?error=${encodeURIComponent(message)}`);
}

function parseHttpUrl(value: string) {
    if (!value) return { valid: true, value: null };
    try {
        const url = new URL(value);
        if (url.protocol !== "https:" && url.protocol !== "http:") return { valid: false, value: null };
        return { valid: true, value: url.toString() };
    } catch {
        return { valid: false, value: null };
    }
}

export async function createAdvertiserProfileAction(formData: FormData) {
    const businessName = String(formData.get("businessName") || "").trim();
    const contactEmail = String(formData.get("contactEmail") || "").trim();
    const websiteInput = String(formData.get("website") || "").trim();
    const website = parseHttpUrl(websiteInput);

    if (businessName.length < 2 || businessName.length > 120) advertiserError("Business name must be 2 to 120 characters.");
    if (!contactEmail.includes("@") || contactEmail.length > 254) advertiserError("Enter a valid contact email.");
    if (!website.valid) advertiserError("Website must use an http or https URL.");

    const supabase = await createServerSupabaseClient();
    if (!supabase) advertiserError("Supabase is not configured.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { error } = await supabase.from("advertiser_profiles").insert({
        owner_user_id: user.id,
        business_name: businessName,
        contact_email: contactEmail,
        website: website.value,
        review_status: "pending",
    });

    if (error) advertiserError(error.message);
    redirect("/advertiser?profile=created");
}

export async function createCampaignAction(formData: FormData) {
    const title = String(formData.get("title") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const instructions = String(formData.get("instructions") || "").trim();
    const reward = Number(formData.get("rewardBdt"));
    const slots = Number(formData.get("slotCount"));
    const watchSeconds = Number(formData.get("watchSeconds"));
    const destinationInput = String(formData.get("destinationUrl") || "").trim();
    const destinationUrl = parseHttpUrl(destinationInput);

    if (title.length < 4 || title.length > 120) advertiserError("Campaign title must be 4 to 120 characters.");
    if (category.length < 2 || category.length > 60) advertiserError("Enter a campaign category.");
    if (description.length < 15 || description.length > 1000) advertiserError("Description must be 15 to 1000 characters.");
    if (instructions.length < 10 || instructions.length > 1500) advertiserError("Instructions must be 10 to 1500 characters.");
    if (!Number.isSafeInteger(reward) || reward < 1 || reward > 100000) advertiserError("Reward must be a whole BDT amount between 1 and 100,000.");
    if (!Number.isSafeInteger(slots) || slots < 1 || slots > 10000) advertiserError("Slots must be between 1 and 10,000.");
    if (!Number.isSafeInteger(watchSeconds) || watchSeconds < 5 || watchSeconds > 300) advertiserError("Viewing time must be between 5 and 300 seconds.");
    if (!destinationUrl.valid) advertiserError("Destination must use an http or https URL.");

    const supabase = await createServerSupabaseClient();
    if (!supabase) advertiserError("Supabase is not configured.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?next=%2Fadvertiser");

    const { error } = await supabase.rpc("create_advertiser_campaign", {
        p_title: title,
        p_category: category,
        p_description: description,
        p_instructions: instructions,
        p_reward_minor: reward,
        p_slot_count: slots,
        p_watch_seconds: watchSeconds,
        p_destination_url: destinationUrl.value,
    });

    if (error) advertiserError(error.message);
    redirect("/advertiser?campaign=created");
}

export async function reviewCampaignSubmissionAction(formData: FormData) {
    const submissionId = String(formData.get("submissionId") || "");
    const decision = String(formData.get("decision") || "");
    const reason = String(formData.get("reason") || "").trim();

    if (!submissionId || (decision !== "approved" && decision !== "rejected")) {
        advertiserError("Choose a valid review decision.");
    }
    if (decision === "rejected" && reason.length > 1000) advertiserError("Review note must be under 1000 characters.");

    const supabase = await createServerSupabaseClient();
    if (!supabase) advertiserError("Supabase is not configured.");
    const { error } = await supabase.rpc("review_campaign_submission", {
        p_submission_id: submissionId,
        p_decision: decision,
        p_reason: reason || null,
    });

    if (error) advertiserError(error.message);
    redirect(`/advertiser?review=${decision}`);
}

export async function submitCampaignFundingRequestAction(formData: FormData) {
    const campaignId = String(formData.get("campaignId") || "");
    const provider = String(formData.get("provider") || "").trim();
    const providerReference = String(formData.get("providerReference") || "").trim();
    const amount = Number(formData.get("amountBdt"));

    if (!campaignId || provider.length < 2 || provider.length > 60) advertiserError("Choose a payment method.");
    if (providerReference.length < 4 || providerReference.length > 200) advertiserError("Enter the payment reference from your transfer receipt.");
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100000000) advertiserError("Funding amount must be a positive whole BDT amount.");

    const supabase = await createServerSupabaseClient();
    if (!supabase) advertiserError("Supabase is not configured.");
    const { error } = await supabase.rpc("submit_campaign_funding_request", {
        p_campaign_id: campaignId,
        p_provider: provider,
        p_provider_reference: providerReference,
        p_amount_minor: amount,
    });

    if (error) advertiserError(error.message);
    redirect("/advertiser?funding=requested");
}
