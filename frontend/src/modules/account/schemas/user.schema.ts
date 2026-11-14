import { z } from "zod";

type Translate = (key: "emailInvalid" | "passwordMin" | "required") => string;

const PASSWORD_MIN_LENGTH = 10;

/**
 * Schema tạo người dùng (thông báo theo ngôn ngữ).
 *
 * @param t - Hàm dịch `account.validation`.
 * @returns Zod schema.
 */
export function createUserSchema(t: Translate) {
  return z.object({
    email: z
      .string()
      .trim()
      .pipe(z.email(t("emailInvalid"))),
    password: z.string().min(PASSWORD_MIN_LENGTH, t("passwordMin")),
    firstName: z.string().trim().max(150),
    lastName: z.string().trim().max(150),
    isActive: z.boolean(),
    isStaff: z.boolean(),
    isNovel: z.boolean(),
  });
}

/**
 * Schema cập nhật người dùng; mật khẩu để trống = giữ nguyên.
 *
 * @param t - Hàm dịch `account.validation`.
 * @returns Zod schema.
 */
export function updateUserSchema(t: Translate) {
  return z.object({
    email: z
      .string()
      .trim()
      .pipe(z.email(t("emailInvalid"))),
    password: z.union([z.literal(""), z.string().min(PASSWORD_MIN_LENGTH, t("passwordMin"))]),
    firstName: z.string().trim().max(150),
    lastName: z.string().trim().max(150),
    isActive: z.boolean(),
    isStaff: z.boolean(),
    isNovel: z.boolean(),
  });
}

export type CreateUserFormValues = z.infer<ReturnType<typeof createUserSchema>>;
export type UpdateUserFormValues = z.infer<ReturnType<typeof updateUserSchema>>;
