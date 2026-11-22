/**
 * Schema xác thực dữ liệu Form Thẻ (Tag).
 */

import { z } from "zod";

import type { Tag, TagCreateInput } from "../types/tag.types";

type Translate = (key: string) => string;

/**
 * Tạo schema xác thực form thẻ phân loại.
 *
 * @param t - Hàm dịch i18n thông báo lỗi.
 * @returns Zod schema.
 */
export function tagSchema(t: Translate) {
  return z.object({
    name: z.string().trim().min(1, t("required")).max(100),
    slug: z.string().trim().max(100).optional(),
  });
}

export type TagFormValues = z.infer<ReturnType<typeof tagSchema>>;

export const TAG_DEFAULTS: TagFormValues = {
  name: "",
  slug: "",
};

/**
 * Chuyển dữ liệu Tag từ backend thành dữ liệu khởi tạo cho form.
 *
 * @param tag - Dữ liệu thẻ từ backend.
 * @returns Giá trị form.
 */
export function fromTag(tag: Tag): TagFormValues {
  return {
    name: tag.name,
    slug: tag.slug,
  };
}

/**
 * Chuyển giá trị form thành payload gửi API.
 *
 * @param values - Giá trị form thẻ.
 * @returns Payload hợp lệ cho API `tagService`.
 */
export function toTagInput(values: TagFormValues): TagCreateInput {
  return {
    name: values.name.trim(),
    slug: values.slug?.trim() || undefined,
  };
}
