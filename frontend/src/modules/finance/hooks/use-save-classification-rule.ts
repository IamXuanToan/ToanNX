"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { classificationRuleService } from "../services/classification-rule.service";
import type {
  ClassificationRule,
  ClassificationRuleInput,
} from "../types/classification-rule.types";

/** @param id - Có id thì sửa, không thì tạo. @returns Mutation lưu quy tắc (form tự báo lỗi theo field). */
export function useSaveClassificationRule(id?: string) {
  return useResourceMutation<ClassificationRuleInput, ClassificationRule>({
    mutationFn: (input) =>
      id ? classificationRuleService.update(id, input) : classificationRuleService.create(input),
    invalidate: [financeKeys.all],
    toastError: false,
  });
}
