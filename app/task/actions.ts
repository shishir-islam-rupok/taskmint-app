"use server";

import { redirect } from "next/navigation";
import { subscribeToPlan } from "@/lib/supabase/earnings";

export async function subscribePlanAction(formData: FormData) {
    const planKey = String(formData.get("planKey") || "");

    if (!planKey) {
        redirect("/task?status=error&message=Plan+not+selected");
    }

    const result = await subscribeToPlan(planKey);

    if (result.success) {
        redirect(`/task?status=subscribe&plan=${encodeURIComponent(planKey)}`);
    }

    redirect(`/task?status=error&message=${encodeURIComponent(result.message)}`);
}
