import { z } from "zod";

import { passwordField } from "@/shares/lib/field-schemas";

type Translate = (
  key: "fullNameRequired" | "passwordMin" | "passwordMismatch" | "usernameFormat",
) => string;

const PASSWORD_MIN_LENGTH = 10;

/**
 * Schema thiết lập tài khoản lần đầu qua thư mời.
 *
 * @param t - Hàm dịch chuỗi i18n.
 * @returns Zod schema xác thực form mời.
 */
export function createInvitationSchema(t: Translate) {
  return z
    .object({
      fullName: z.string().trim().min(1, t("fullNameRequired")).max(255),
      username: z
        .string()
        .trim()
        .max(150)
        .regex(/^[\w.@+-]*$/, t("usernameFormat"))
        .optional()
        .or(z.literal("")),
      password: passwordField(PASSWORD_MIN_LENGTH, t("passwordMin")),
      confirmPassword: z.string().min(1, t("passwordMin")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    });
}

export type InvitationFormValues = z.infer<ReturnType<typeof createInvitationSchema>>;
