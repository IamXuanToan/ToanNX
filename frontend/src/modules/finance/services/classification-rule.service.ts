import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { FINANCE_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  ClassificationRule,
  ClassificationRuleFilters,
  ClassificationRuleInput,
  RuleTestResult,
} from "../types/classification-rule.types";

const crud = createCrudService<
  ClassificationRule,
  ClassificationRuleFilters,
  ClassificationRuleInput,
  ClassificationRuleInput,
  ClassificationRule
>(FINANCE_API_ENDPOINTS.rules);

/** Service quy tắc nhận diện (BE `finance/services/classification_rule_service.py`). */
export const classificationRuleService = {
  ...crud,

  /** @param content - Nội dung chuyển khoản. @param pattern - Regex muốn thử (trống = mọi quy tắc). */
  async test(content: string, pattern?: string): Promise<RuleTestResult> {
    return (
      await apiClient.post<RuleTestResult>(FINANCE_API_ENDPOINTS.ruleTest, {
        content,
        pattern: pattern ?? "",
      })
    ).data;
  },
};
