"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { platformService } from "../services/platform.service";

/** @returns Mutation tạo nền tảng mẫu. */
export function useSeedPlatforms() {
  return useResourceMutation<void, number>({
    mutationFn: () => platformService.seedDefaults(),
    invalidate: [financeKeys.all],
    success: "saved",
  });
}
