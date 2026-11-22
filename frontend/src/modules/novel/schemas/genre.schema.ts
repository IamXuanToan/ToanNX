/**
 * Schema xác thực dữ liệu Form Thể loại (Genre).
 */

import { z } from "zod";

import type { Genre, GenreCreateInput } from "../types/genre.types";

type Translate = (key: string) => string;

/**
 * Tạo schema xác thực form thể loại truyện.
 *
 * @param t - Hàm dịch i18n thông báo lỗi.
 * @returns Zod schema.
 */
export function genreSchema(t: Translate) {
  return z.object({
    name: z.string().trim().min(1, t("required")).max(100),
    slug: z.string().trim().max(100).optional(),
    description: z.string().max(1000).optional(),
  });
}

export type GenreFormValues = z.infer<ReturnType<typeof genreSchema>>;

export const GENRE_DEFAULTS: GenreFormValues = {
  name: "",
  slug: "",
  description: "",
};

/**
 * Chuyển dữ liệu Genre từ backend thành dữ liệu khởi tạo cho form.
 *
 * @param genre - Dữ liệu thể loại từ backend.
 * @returns Giá trị form.
 */
export function fromGenre(genre: Genre): GenreFormValues {
  return {
    name: genre.name,
    slug: genre.slug,
    description: genre.description ?? "",
  };
}

/**
 * Chuyển giá trị form thành payload gửi API.
 *
 * @param values - Giá trị form thể loại.
 * @returns Payload hợp lệ cho API `genreService`.
 */
export function toGenreInput(values: GenreFormValues): GenreCreateInput {
  return {
    name: values.name.trim(),
    slug: values.slug?.trim() || undefined,
    description: values.description?.trim() || "",
  };
}
