"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { subscriptionService } from "../services/subscription.service";
import type { SubscriptionRenewInput } from "../types/subscription.types";
import type { SubscriptionPayment } from "../types/subscription-payment.types";

/** @returns Mutation gia hạn Dịch vụ định kỳ và ghi nhận kỳ thanh toán. */
export function useRenewSubscription(id: string) {
  return useResourceMutation<SubscriptionRenewInput, SubscriptionPayment>({
    mutationFn: (input) => subscriptionService.renew(id, input),
    invalidate: [workspaceKeys.all],
    toastError: false,
  });
}
