"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { classificationRuleService } from "../services/classification-rule.service";

/** @returns Mutation xóa quy tắc. */
export function useDeleteClassificationRule() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => classificationRuleService.delete(id),
    invalidate: [financeKeys.all],
    success: "deleted",
  });
}
