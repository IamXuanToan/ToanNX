import type { ListParams } from "@/shares/types/api.types";

/** Quy tắc nhận diện (BE `ClassificationRuleResponseSerializer`). */
export type ClassificationRule = {
  id: string;
  name: string;
  platformId: string;
  platformName: string;
  pattern: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClassificationRuleFilters = ListParams & {
  owner?: string;
  platform?: string;
  isActive?: string;
};

export type ClassificationRuleInput = {
  name?: string;
  platformId?: string;
  pattern?: string;
  priority?: number;
  isActive?: boolean;
};

/** Kết quả thử nội dung. */
export type RuleTestResult = {
  normalized: string;
  ruleId: string | null;
  ruleName: string | null;
  platformName: string | null;
  matchedText: string | null;
};
