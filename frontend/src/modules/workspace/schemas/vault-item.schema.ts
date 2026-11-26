import { z } from "zod";

import { VAULT_CATEGORIES } from "../constants/defaults";

type Translate = (key: "required" | "url") => string;

const HTTP_URL = /^https?:\/\/[^\s]+$/i;

/** Tên trường form Két sắt bí mật. */
export const VAULT_ITEM_FORM_FIELDS = [
  "title",
  "category",
  "username",
  "secret",
  "url",
  "notes",
  "tags",
] as const;

/**
 * Schema form Két sắt bí mật (tạo mới bắt buộc nhập secret; sửa có thể bỏ trống để giữ bí mật cũ).
 *
 * @param t - Hàm dịch `workspace.validation`.
 * @param isCreate - Đang ở chế độ tạo mới hay cập nhật.
 * @returns Zod schema.
 */
export function vaultItemSchema(t: Translate, isCreate: boolean) {
  return z
    .object({
      title: z.string().trim().min(1, t("required")).max(200),
      category: z.enum(VAULT_CATEGORIES),
      username: z.string().trim().max(200),
      secret: z.string().max(8000),
      url: z.string().trim().max(500),
      notes: z.string().max(2000),
      tags: z.array(z.string()),
    })
    .superRefine((value, ctx) => {
      if (isCreate && !value.secret.trim()) {
        ctx.addIssue({ code: "custom", path: ["secret"], message: t("required") });
      }
      if (value.url && !HTTP_URL.test(value.url)) {
        ctx.addIssue({ code: "custom", path: ["url"], message: t("url") });
      }
    });
}

export type VaultItemFormValues = z.infer<ReturnType<typeof vaultItemSchema>>;
