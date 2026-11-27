import { z } from "zod";

import { slugField } from "@/shares/lib/field-schemas";

type Translate = (key: "required" | "slug" | "colorHex") => string;

const HEX_COLOR_RE = /^(#[0-9A-Fa-f]{6})?$/;

/** Tên trường form nền tảng có thể nhận lỗi từ BE. */
export const PLATFORM_FORM_FIELDS = ["name", "code", "defaultCurrencyId", "color", "note"] as const;

/** @param t - Hàm dịch `finance.validation`. @returns Schema form nền tảng. */
export function platformSchema(t: Translate) {
  return z.object({
    name: z.string().trim().min(1, t("required")).max(150),
    code: slugField(t("slug"), { required: true }),
    defaultCurrencyId: z.string().min(1, t("required")),
    color: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .refine((value) => HEX_COLOR_RE.test(value), t("colorHex")),
    isActive: z.boolean(),
    note: z.string().max(2000),
  });
}

export type PlatformFormValues = z.infer<ReturnType<typeof platformSchema>>;
