"use client";

import { useQuery } from "@tanstack/react-query";

import { workspaceKeys } from "../constants/query-keys";
import { subscriptionService } from "../services/subscription.service";

/** @returns Chi tiết một Dịch vụ định kỳ. */
export function useSubscription(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: workspaceKeys.subscriptions.detail(id ?? ""),
    queryFn: ({ signal }) => subscriptionService.get(id ?? "", signal),
    enabled: Boolean(id) && enabled,
  });
}
