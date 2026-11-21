import { z } from "zod";

import { emailField } from "@/shares/lib/field-schemas";

import type { CreateUserInput } from "../types/user.types";

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
    fullName: z.string().trim().min(1, t("required")).max(255),
    avatar: avatarField,
    isActive: z.boolean(),
    isStaff: z.boolean(),
    isSuperuser: z.boolean(),
    isNovel: z.boolean(),
    sendInvitation: z.boolean(),
  };
}

/**
 * Schema tạo người dùng (thông báo theo ngôn ngữ).
 *
 * @param t - Hàm dịch `system.account.validation`.
 * @param isUpdate - Cờ xác định form cập nhật hay tạo mới.
 * @returns Zod schema.
 */
export function createUserSchema(t: Translate, isUpdate = false) {
  return z
    .object({
      ...userFields(t),
      password: z.string(),
    })
    .superRefine((data, ctx) => {
      if (!isUpdate && !data.sendInvitation) {
        if (!data.username || !data.username.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("required"),
            path: ["username"],
          });
        }
        if (!data.password || data.password.length < PASSWORD_MIN_LENGTH) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("passwordMin"),
            path: ["password"],
          });
        }
      } else if (isUpdate && data.password && data.password.length < PASSWORD_MIN_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("passwordMin"),
          path: ["password"],
        });
      }
    });
}

/**
 * Schema cập nhật người dùng; mật khẩu để trống = giữ nguyên.
 *
 * @param t - Hàm dịch `system.account.validation`.
 * @returns Zod schema.
 */
export function updateUserSchema(t: Translate) {
  return createUserSchema(t, true);
}

export type CreateUserFormValues = z.infer<ReturnType<typeof createUserSchema>>;
export type UpdateUserFormValues = CreateUserFormValues;

/** Tên các ô của form người dùng (gắn lỗi theo field từ backend). */
export const USER_FORM_FIELDS = [
  "email",
  "password",
  "username",
  "fullName",
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
}: V): CreateUserInput {
  const result: CreateUserInput = {
    ...values,
    avatarId: avatar?.id ?? null,
  };
  if (!result.password) {
    delete result.password;
  }
  if (!result.username) {
    delete result.username;
  }
  return result;
}
