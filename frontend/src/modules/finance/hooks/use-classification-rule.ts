"use client";

import { useQuery } from "@tanstack/react-query";

import { financeKeys } from "../constants/query-keys";
import { classificationRuleService } from "../services/classification-rule.service";

/** @param id - Id bản ghi. @returns Chi tiết quy tắc. */
export function useClassificationRule(id: string) {
  return useQuery({
    queryKey: financeKeys.rules.detail(id),
    queryFn: ({ signal }) => classificationRuleService.get(id, signal),
  });
}
