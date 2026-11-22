"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { platformService } from "../services/platform.service";

/** @returns Mutation xóa nền tảng. */
export function useDeletePlatform() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => platformService.delete(id),
    invalidate: [financeKeys.all],
    success: "deleted",
  });
}
