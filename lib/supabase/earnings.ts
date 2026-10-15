import { createServerSupabaseClient } from "@/lib/supabase/server";
import { canActivateSubscriptionWithoutPayment } from "./subscription-policy.mjs";

export type WalletSummary = {
    balance_minor: number;
    pending_minor: number;
    approved_minor: number;
    currency: string;
    updated_at: string | null;
};

export type SubscriptionPlan = {
    id: string;
    key: string;
    name: string;
    description: string;
    type: string;
    price_minor: number;
    duration_days: number;
    features: string[];
};

export async function getUserDashboardData() {
    const supabase = await createServerSupabaseClient();

    if (!supabase) {
        return {
            configured: false,
            user: null,
            wallet: null,
            plans: [] as SubscriptionPlan[],
            subscriptions: [] as Array<{ id: string; plan_key: string; status: string; started_at: string; ends_at: string | null; plan: SubscriptionPlan | null }>,
            transactions: [] as Array<{ id: string; title: string; reward_minor: number; status: string; created_at: string; source_type: string }>,
        };
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            configured: true,
            user: null,
            wallet: null,
            plans: [] as SubscriptionPlan[],
            subscriptions: [] as Array<{ id: string; plan_key: string; status: string; started_at: string; ends_at: string | null; plan: SubscriptionPlan | null }>,
            transactions: [] as Array<{ id: string; title: string; reward_minor: number; status: string; created_at: string; source_type: string }>,
        };
    }

    type SubscriptionRow = {
        id: string;
        plan_key: string;
        status: string;
        started_at: string;
        ends_at: string | null;
        plan: SubscriptionPlan | null;
    };

    const [walletResult, planResult, subscriptionResult, transactionResult] = await Promise.allSettled([
        supabase
            .from("wallets")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle(),
        supabase
            .from("subscription_plans")
            .select("*")
            .order("price_minor", { ascending: true }),
        supabase
            .from("user_subscriptions")
            .select("*, plan:subscription_plans(*)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        supabase
            .from("wallet_transactions")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(12),
    ] as const);

    const wallet: WalletSummary | null = walletResult.status === "fulfilled" && !walletResult.value.error
        ? walletResult.value.data
        : null;

    let plans: SubscriptionPlan[] = [];
    if (planResult.status === "fulfilled" && !planResult.value.error && planResult.value.data) {
        plans = (planResult.value.data as SubscriptionPlan[]).map((plan) => ({
            ...plan,
            features: Array.isArray(plan.features) ? plan.features : [],
        }));
    }

    const subscriptions: Array<{ id: string; plan_key: string; status: string; started_at: string; ends_at: string | null; plan: SubscriptionPlan | null }> =
        subscriptionResult.status === "fulfilled" && !subscriptionResult.value.error && subscriptionResult.value.data
            ? (subscriptionResult.value.data as SubscriptionRow[]).map((row) => ({
                id: row.id,
                plan_key: row.plan_key,
                status: row.status,
                started_at: row.started_at,
                ends_at: row.ends_at,
                plan: row.plan ? {
                    ...row.plan,
                    features: Array.isArray(row.plan.features) ? row.plan.features : [],
                } : null,
            }))
            : [];

    const transactions: Array<{ id: string; title: string; reward_minor: number; status: string; created_at: string; source_type: string }> =
        transactionResult.status === "fulfilled" && !transactionResult.value.error && transactionResult.value.data
            ? transactionResult.value.data as Array<{ id: string; title: string; reward_minor: number; status: string; created_at: string; source_type: string }>
            : [];

    return {
        configured: true,
        user,
        wallet,
        plans,
        subscriptions,
        transactions,
    };
}

export async function subscribeToPlan(planKey: string) {
    const supabase = await createServerSupabaseClient();

    if (!supabase) {
        return { success: false, message: "Supabase is not configured." };
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return { success: false, message: "User session is not valid." };
    }

    const plan = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("key", planKey)
        .maybeSingle();

    if (plan.error || !plan.data) {
        return { success: false, message: "Selected subscription plan was not found." };
    }

    if (!canActivateSubscriptionWithoutPayment(plan.data.price_minor)) {
        return { success: false, message: "Paid subscriptions cannot be activated until a payment provider is configured." };
    }

    const { error } = await supabase.rpc("activate_free_subscription", {
        p_plan_key: planKey,
    });

    if (error) {
        return { success: false, message: error.message };
    }

    return {
        success: true,
        message: `${plan.data.name} is active for your account.`,
    };
}
