import { z } from "zod";

type Translate = (key: "required") => string;

/** Tên trường form quy tắc có thể nhận lỗi từ BE. */
export const RULE_FORM_FIELDS = ["name", "platformId", "pattern", "priority"] as const;

/** @param t - Hàm dịch `finance.validation`. @returns Schema form quy tắc (regex do BE kiểm). */
export function classificationRuleSchema(t: Translate) {
  return z.object({
    name: z.string().trim().min(1, t("required")).max(150),
    platformId: z.string().min(1, t("required")),
    pattern: z.string().trim().min(1, t("required")).max(500),
    priority: z.string().regex(/^-?\d+$/, t("required")),
    isActive: z.boolean(),
  });
}

/**
 * Schema form quy tắc gắn trực tiếp theo nền tảng trong dialog phím tắt `+`.
 *
 * @param t - Hàm dịch `finance.validation`.
 * @returns Schema gọn không yêu cầu chọn lại nền tảng.
 */
export function platformRuleSchema(t: Translate) {
  return z.object({
    name: z.string().trim().min(1, t("required")).max(150),
    pattern: z.string().trim().min(1, t("required")).max(500),
    priority: z.string().regex(/^-?\d+$/, t("required")),
    isActive: z.boolean(),
  });
}

export type ClassificationRuleFormValues = z.infer<ReturnType<typeof classificationRuleSchema>>;
export type PlatformRuleFormValues = z.infer<ReturnType<typeof platformRuleSchema>>;
