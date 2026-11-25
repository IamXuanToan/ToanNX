"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { financeKeys } from "../constants/query-keys";
import { classificationRuleService } from "../services/classification-rule.service";
import type { ClassificationRuleFilters } from "../types/classification-rule.types";

/** @param filters - Bộ lọc + phân trang. @param options - Tùy chọn bật/tắt truy vấn. @returns Danh sách quy tắc nhận diện. */
export function useClassificationRules(
  filters: ClassificationRuleFilters,
  options: { enabled?: boolean } = {},
) {
  return useListQuery(
    financeKeys.rules.list(filters),
    (signal) => classificationRuleService.list(filters, signal),
    options,
  );
}
