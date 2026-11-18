import { z } from "zod";

type Translate = (key: "passwordRequired" | "passwordMin" | "passwordMismatch") => string;

/**
 * Schema validate form đặt lại mật khẩu mới.
 *
 * @param t - Hàm dịch thông báo lỗi.
 * @returns Zod schema.
 */
export function createResetPasswordSchema(t: Translate) {
  return z
    .object({
      password: z.string().min(8, t("passwordMin")).max(128),
      confirmPassword: z.string().min(1, t("passwordRequired")).max(128),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    });
}

export type ResetPasswordFormValues = z.infer<ReturnType<typeof createResetPasswordSchema>>;
