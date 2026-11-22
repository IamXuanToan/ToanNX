import { z } from "zod";

type Translate = (key: "emailRequired" | "emailInvalid") => string;

/**
 * Schema validate form quên mật khẩu.
 *
 * @param t - Hàm dịch thông báo lỗi.
 * @returns Zod schema.
 */
export function createForgotPasswordSchema(t: Translate) {
  return z.object({
    email: z.string().trim().min(1, t("emailRequired")).email(t("emailInvalid")).max(254),
  });
}

export type ForgotPasswordFormValues = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
