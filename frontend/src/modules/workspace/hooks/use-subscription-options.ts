"use client";

import { useQuery } from "@tanstack/react-query";

import { workspaceKeys } from "../constants/query-keys";
import { subscriptionService } from "../services/subscription.service";

/** @returns Danh sách Dịch vụ định kỳ dạng option `{ value, label }`. */
export function useSubscriptionOptions(enabled = true) {
  const query = useQuery({
    queryKey: workspaceKeys.subscriptions.list({ ordering: "name" }),
    queryFn: ({ signal }) => subscriptionService.listAll({ ordering: "name" }, signal),
    enabled,
  });
  return {
    ...query,
    options: (query.data ?? []).map((item) => ({
      value: item.id,
      label: item.provider ? `${item.name} (${item.provider})` : item.name,
    })),
  };
}
