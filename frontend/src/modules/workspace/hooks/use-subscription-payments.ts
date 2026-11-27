"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { workspaceKeys } from "../constants/query-keys";
import { subscriptionPaymentService } from "../services/subscription-payment.service";
import type { SubscriptionPaymentFilters } from "../types/subscription-payment.types";

/** @returns Lịch sử thanh toán gia hạn dịch vụ định kỳ. */
export function useSubscriptionPayments(
  filters: SubscriptionPaymentFilters,
  options: { enabled?: boolean } = {},
) {
  return useListQuery(
    workspaceKeys.subscriptionPayments.list(filters),
    (signal) => subscriptionPaymentService.list(filters, signal),
    options,
  );
}
