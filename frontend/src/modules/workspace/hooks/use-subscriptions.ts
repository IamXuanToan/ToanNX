"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { workspaceKeys } from "../constants/query-keys";
import { subscriptionService } from "../services/subscription.service";
import type { SubscriptionFilters } from "../types/subscription.types";

/** @returns Danh sách Dịch vụ định kỳ. */
export function useSubscriptions(
  filters: SubscriptionFilters,
  options: { enabled?: boolean } = {},
) {
  return useListQuery(
    workspaceKeys.subscriptions.list(filters),
    (signal) => subscriptionService.list(filters, signal),
    options,
  );
}
