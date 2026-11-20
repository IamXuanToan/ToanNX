import { z } from "zod";

import { emailField, passwordField } from "@/shares/lib/field-schemas";

type Translate = (key: "emailInvalid" | "passwordMin" | "required" | "usernameFormat") => string;

const PASSWORD_MIN_LENGTH = 10;

/** Ảnh đã upload (id attachment + URL xem trước). */
const avatarField = z
  .object({
    id: z.string(),
    url: z.string(),
    name: z.string(),
    size: z.number().optional(),
    contentType: z.string().optional(),
  })
  .nullable();

/** Tên người dùng bắt buộc, theo định dạng Django. */
function usernameField(t: Translate) {
  return z
    .string()
    .trim()
    .min(1, t("required"))
    .max(150)
    .regex(/^[\w.@+-]*$/, t("usernameFormat"));
}

/** Trường chung của form tạo và sửa người dùng (theo model `system.User`). */
function userFields(t: Translate) {
  return {
    email: emailField(t("emailInvalid")),
    username: usernameField(t),
    firstName: z.string().trim().max(150),
    lastName: z.string().trim().max(150),
    avatar: avatarField,
    isActive: z.boolean(),
    isStaff: z.boolean(),
    isSuperuser: z.boolean(),
    isNovel: z.boolean(),
  };
}

/**
 * Schema tạo người dùng (thông báo theo ngôn ngữ).
 *
 * @param t - Hàm dịch `system.account.validation`.
 * @returns Zod schema.
 */
export function createUserSchema(t: Translate) {
  return z.object({
    ...userFields(t),
    password: passwordField(PASSWORD_MIN_LENGTH, t("passwordMin")),
  });
}

/**
 * Schema cập nhật người dùng; mật khẩu để trống = giữ nguyên.
 *
 * @param t - Hàm dịch `system.account.validation`.
 * @returns Zod schema.
 */
export function updateUserSchema(t: Translate) {
  return z.object({
    ...userFields(t),
    password: z.union([z.literal(""), passwordField(PASSWORD_MIN_LENGTH, t("passwordMin"))]),
  });
}

export type CreateUserFormValues = z.infer<ReturnType<typeof createUserSchema>>;
export type UpdateUserFormValues = z.infer<ReturnType<typeof updateUserSchema>>;

/** Tên các ô của form người dùng (gắn lỗi theo field từ backend). */
export const USER_FORM_FIELDS = [
  "email",
  "password",
  "username",
  "firstName",
  "lastName",
  "isActive",
  "isStaff",
  "isSuperuser",
  "isNovel",
] as const;

/**
 * Đổi giá trị form sang body API (ảnh → `avatarId`).
 *
 * @param values - Giá trị form.
 * @returns Body tạo/sửa người dùng.
 */
export function toUserInput<V extends CreateUserFormValues | UpdateUserFormValues>({
  avatar,
  ...values
}: V) {
  return { ...values, avatarId: avatar?.id ?? null };
}
