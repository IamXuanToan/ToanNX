"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { subscriptionService } from "../services/subscription.service";
import type { Subscription, SubscriptionInput } from "../types/subscription.types";

/** @param id - Có ID thì cập nhật, không thì tạo Dịch vụ định kỳ. */
export function useSaveSubscription(id?: string) {
  return useResourceMutation<SubscriptionInput, Subscription>({
    mutationFn: (input) =>
      id ? subscriptionService.update(id, input) : subscriptionService.create(input),
    invalidate: [workspaceKeys.all],
    toastError: false,
  });
}
