import { z } from "zod";

import { slugField } from "@/shares/lib/field-schemas";

type Translate = (key: "required" | "url" | "slug" | "future") => string;

/**
 * Schema form link rút gọn (tạo = sửa). BE vẫn kiểm lại (chặn đích `/s/…` nội bộ, slug trùng).
 *
 * @param t - Hàm dịch `shortLinks.validation`.
 * @returns Zod schema.
 */
export function shortLinkSchema(t: Translate) {
  return z.object({
    name: z.string().trim().min(1, t("required")).max(150),
    slug: slugField(t("slug"), { required: false }),
    destinationUrl: z
      .string()
      .trim()
      .min(1, t("required"))
      .max(2048)
      .refine((value) => /^https?:\/\/[^\s]+$/i.test(value), t("url")),
    description: z.string().max(1000),
    redirectType: z.enum(["302", "301"]),
    isActive: z.boolean(),
    expiresAt: z
      .string()
      .refine((value) => !value || new Date(value).getTime() > Date.now(), t("future")),
  });
}

export type ShortLinkFormValues = z.infer<ReturnType<typeof shortLinkSchema>>;

/** Tên ô của form (gắn lỗi theo field từ backend). */
export const SHORT_LINK_FORM_FIELDS = [
  "name",
  "slug",
  "destinationUrl",
  "description",
  "redirectType",
  "expiresAt",
] as const;
