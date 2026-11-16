import { z } from "zod";

import { slugField } from "@/shares/lib/field-schemas";

type Translate = (key: "required" | "url" | "slug" | "future" | "seconds") => string;

/**
 * Schema form link rút gọn (tạo = sửa). BE vẫn kiểm lại (chặn đích `/s/…` nội bộ, slug trùng).
 *
 * @param t - Hàm dịch `shortLinks.validation`.
 * @param existingExpiry - Giá trị hạn cũ được phép giữ nguyên khi sửa bản đã hết hạn.
 * @returns Zod schema.
 */
export function shortLinkSchema(t: Translate, existingExpiry?: string) {
  return z
    .object({
      name: z.string().trim().min(1, t("required")).max(150),
      slug: slugField(t("slug"), { required: false }),
      destinationUrl: z
        .string()
        .trim()
        .min(1, t("required"))
        .max(2048)
        .refine((value) => /^https?:\/\/[^\s]+$/i.test(value), t("url")),
      description: z.string().max(1000),
      redirectMode: z.enum(["manual", "timed"]),
      autoRedirectSeconds: z.string(),
      password: z.string().max(128),
      removePassword: z.boolean(),
      isActive: z.boolean(),
      hasExpiry: z.boolean(),
      expiresAt: z.string(),
    })
    .superRefine((value, ctx) => {
      if (
        value.redirectMode === "timed" &&
        (!/^\d+$/.test(value.autoRedirectSeconds) ||
          Number(value.autoRedirectSeconds) < 1 ||
          Number(value.autoRedirectSeconds) > 60)
      ) {
        ctx.addIssue({ code: "custom", path: ["autoRedirectSeconds"], message: t("seconds") });
      }
      if (value.hasExpiry && !value.expiresAt) {
        ctx.addIssue({ code: "custom", path: ["expiresAt"], message: t("required") });
      }
      if (
        value.hasExpiry &&
        value.expiresAt &&
        value.expiresAt !== existingExpiry &&
        new Date(value.expiresAt).getTime() <= Date.now()
      ) {
        ctx.addIssue({ code: "custom", path: ["expiresAt"], message: t("future") });
      }
    });
}

export type ShortLinkFormValues = z.infer<ReturnType<typeof shortLinkSchema>>;

/** Tên ô của form (gắn lỗi theo field từ backend). */
export const SHORT_LINK_FORM_FIELDS = [
  "name",
  "slug",
  "destinationUrl",
  "description",
  "autoRedirectSeconds",
  "password",
  "expiresAt",
] as const;
