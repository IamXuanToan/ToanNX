import { z } from "zod";

import { passwordField } from "@/shares/lib/field-schemas";

type Translate = (key: "identifierRequired" | "passwordRequired") => string;

/**
 * Tạo schema đăng nhập (email hoặc tên người dùng + mật khẩu) với thông báo theo ngôn ngữ hiện tại.
 *
 * @param t - Hàm dịch namespace `system.auth.validation`.
 * @returns Zod schema.
 */
export function createLoginSchema(t: Translate) {
  return z.object({
    identifier: z.string().trim().min(1, t("identifierRequired")).max(254),
    password: passwordField(1, t("passwordRequired")),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;
