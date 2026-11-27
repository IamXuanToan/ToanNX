"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { subscriptionPaymentService } from "../services/subscription-payment.service";

/** @returns Mutation xóa mềm một kỳ thanh toán gia hạn. */
export function useDeleteSubscriptionPayment() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => subscriptionPaymentService.delete(id),
    invalidate: [workspaceKeys.all],
    success: "deleted",
  });
}
