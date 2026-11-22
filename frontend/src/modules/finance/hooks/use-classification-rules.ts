"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { financeKeys } from "../constants/query-keys";
import { classificationRuleService } from "../services/classification-rule.service";
import type { ClassificationRuleFilters } from "../types/classification-rule.types";

/** @param filters - Bộ lọc + phân trang. @returns Danh sách quy tắc nhận diện. */
export function useClassificationRules(filters: ClassificationRuleFilters) {
  return useListQuery(financeKeys.rules.list(filters), (signal) =>
    classificationRuleService.list(filters, signal),
  );
}
