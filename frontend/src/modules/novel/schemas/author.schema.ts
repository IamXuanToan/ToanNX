/**
 * Schema xác thực dữ liệu Form Tác giả (Author).
 */

import { z } from "zod";

import type { UploadedFile } from "@/shares/components/common/image-upload.types";

import type { Author, AuthorCreateInput } from "../types/author.types";

type Translate = (key: string) => string;

/**
 * Tạo schema xác thực dữ liệu form tác giả.
 *
 * @param t - Hàm dịch i18n thông báo lỗi.
 * @returns Zod schema.
 */
export function authorSchema(t: Translate) {
  return z.object({
    name: z.string().trim().min(1, t("required")).max(255),
    slug: z.string().trim().max(255).optional(),
    bio: z.string().max(2000).optional(),
    avatar: z.custom<UploadedFile | null>().nullable().optional(),
  });
}

export type AuthorFormValues = z.infer<ReturnType<typeof authorSchema>>;

export const AUTHOR_DEFAULTS: AuthorFormValues = {
  name: "",
  slug: "",
  bio: "",
  avatar: null,
};

/**
 * Chuyển dữ liệu Author từ backend thành dữ liệu khởi tạo cho form.
 *
 * @param author - Dữ liệu tác giả từ backend.
 * @returns Giá trị tương thích với Form.
 */
export function fromAuthor(author: Author): AuthorFormValues {
  return {
    name: author.name,
    slug: author.slug,
    bio: author.bio ?? "",
    avatar: author.avatar
      ? {
          id: author.avatar.id,
          url: author.avatar.url,
          name: "",
        }
      : null,
  };
}

/**
 * Chuyển giá trị form thành payload gửi tới API backend.
 *
 * @param values - Giá trị form tác giả.
 * @returns Payload hợp lệ cho API `authorService.create` hoặc `authorService.update`.
 */
export function toAuthorInput(values: AuthorFormValues): AuthorCreateInput {
  return {
    name: values.name.trim(),
    slug: values.slug?.trim() || undefined,
    bio: values.bio?.trim() || "",
    avatarId: values.avatar?.id ?? null,
  };
}
