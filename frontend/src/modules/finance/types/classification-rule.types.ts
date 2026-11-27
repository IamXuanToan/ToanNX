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

/** Quy tắc tạo tạm cục bộ khi đang soạn nền tảng mới chưa bấm Lưu. */
export type DraftClassificationRule = {
  localId: string;
  name: string;
  pattern: string;
  priority: number;
  isActive: boolean;
};
