import { z } from "zod";

type Translate = (key: "emailInvalid" | "emailRequired" | "passwordRequired") => string;

/**
 * Tạo schema đăng nhập với thông báo theo ngôn ngữ hiện tại.
 *
 * @param t - Hàm dịch namespace `auth.validation`.
 * @returns Zod schema.
 */
export function createLoginSchema(t: Translate) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, t("emailRequired"))
      .pipe(z.email(t("emailInvalid"))),
    password: z.string().min(1, t("passwordRequired")),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;
