"use server";

import { redirect } from "next/navigation";
import { creditTaskReward, subscribeToPlan } from "@/lib/supabase/earnings";

export async function completeTaskAction(formData: FormData) {
    const taskId = String(formData.get("taskId") || "task-view");
    const title = String(formData.get("title") || "Task reward");
    const rewardMinor = Number(formData.get("rewardMinor") || 0);

    const result = await creditTaskReward(taskId, title, rewardMinor);

    if (result.success) {
        redirect(`/task?reward=${rewardMinor}&status=success`);
    }

    redirect(`/task?status=error&message=${encodeURIComponent(result.message)}`);
}

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
