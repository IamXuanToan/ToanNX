import { z } from "zod";

type InfoTranslate = (key: "emailInvalid" | "usernameRequired" | "fullNameRequired") => string;
type PasswordTranslate = (key: "passwordMin" | "passwordMismatch" | "passwordRequired") => string;

/**
 * Schema validate thông tin chung của người dùng (email, tên người dùng, họ và tên bắt buộc).
 *
 * @param t - Hàm dịch thông báo lỗi.
 * @returns Zod schema thông tin cá nhân.
 */
export function createProfileInfoSchema(t: InfoTranslate) {
  return z.object({
    email: z.string().trim().email(t("emailInvalid")).max(254),
    username: z.string().trim().min(1, t("usernameRequired")).max(150),
    fullName: z.string().trim().min(1, t("fullNameRequired")).max(255),
  });
}

export type ProfileInfoFormValues = z.infer<ReturnType<typeof createProfileInfoSchema>>;

/**
 * Schema validate đổi mật khẩu riêng biệt.
 *
 * @param t - Hàm dịch thông báo lỗi.
 * @returns Zod schema đổi mật khẩu.
 */
export function createProfilePasswordSchema(t: PasswordTranslate) {
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

export type ProfilePasswordFormValues = z.infer<ReturnType<typeof createProfilePasswordSchema>>;
