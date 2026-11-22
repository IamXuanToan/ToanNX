import { z } from "zod";

import { slugField } from "@/shares/lib/field-schemas";

type Translate = (key: "required" | "slug") => string;

/** Tên trường form nền tảng có thể nhận lỗi từ BE. */
export const PLATFORM_FORM_FIELDS = ["name", "code", "defaultCurrencyId", "note"] as const;

/** @param t - Hàm dịch `finance.validation`. @returns Schema form nền tảng. */
export function platformSchema(t: Translate) {
  return z.object({
    name: z.string().trim().min(1, t("required")).max(150),
    code: slugField(t("slug"), { required: true }),
    defaultCurrencyId: z.string().min(1, t("required")),
    isActive: z.boolean(),
    note: z.string().max(2000),
  });
}

export type PlatformFormValues = z.infer<ReturnType<typeof platformSchema>>;
