"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { subscriptionService } from "../services/subscription.service";

/** @returns Mutation xóa mềm một Dịch vụ định kỳ. */
export function useDeleteSubscription() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => subscriptionService.delete(id),
    invalidate: [workspaceKeys.all],
    success: "deleted",
  });
}
