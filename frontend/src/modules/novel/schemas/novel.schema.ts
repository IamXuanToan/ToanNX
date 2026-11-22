/**
 * Schema xác thực dữ liệu Form Tiểu thuyết (Novel).
 */

import { z } from "zod";

import type { UploadedFile } from "@/shares/components/common/image-upload.types";

import type { Novel, NovelCreateInput, NovelDetail, NovelStatus } from "../types/novel.types";

type Translate = (key: string) => string;

/**
 * Tạo schema xác thực form tiểu thuyết.
 *
 * @param t - Hàm dịch i18n thông báo lỗi.
 * @returns Zod schema.
 */
export function novelSchema(t: Translate) {
  return z.object({
    title: z.string().trim().min(1, t("required")).max(255),
    slug: z.string().trim().max(255).optional(),
    originalTitle: z.string().trim().max(255).optional(),
    authorId: z.string().uuid().nullable().optional(),
    status: z.enum(["ONGOING", "COMPLETED", "PAUSED"] as const),
    genreIds: z.array(z.string().uuid()),
    tagIds: z.array(z.string().uuid()),
    description: z.string().max(10000).optional(),
    thumbnail: z.custom<UploadedFile | null>().nullable().optional(),
    isPublished: z.boolean(),
  });
}

export type NovelFormValues = z.infer<ReturnType<typeof novelSchema>>;

export const NOVEL_DEFAULTS: NovelFormValues = {
  title: "",
  slug: "",
  originalTitle: "",
  authorId: null,
  status: "ONGOING",
  genreIds: [],
  tagIds: [],
  description: "",
  thumbnail: null,
  isPublished: true,
};

/**
 * Chuyển dữ liệu Novel từ backend thành dữ liệu khởi tạo cho form.
 *
 * @param novel - Dữ liệu tiểu thuyết từ backend.
 * @returns Giá trị form.
 */
export function fromNovel(novel: NovelDetail | Novel): NovelFormValues {
  return {
    title: novel.title,
    slug: novel.slug,
    originalTitle: novel.originalTitle ?? "",
    authorId: novel.author?.id ?? null,
    status: (novel.status as NovelStatus) || "ONGOING",
    genreIds: novel.genres?.map((g) => g.id) ?? [],
    tagIds: novel.tags?.map((t) => t.id) ?? [],
    description: ("description" in novel ? novel.description : "") ?? "",
    thumbnail: novel.thumbnail
      ? {
          id: novel.thumbnail.id,
          url: novel.thumbnail.url,
          name: "",
        }
      : null,
    isPublished: true,
  };
}

/**
 * Chuyển giá trị form thành payload gửi API.
 *
 * @param values - Giá trị form tiểu thuyết.
 * @returns Payload hợp lệ cho API `novelService`.
 */
export function toNovelInput(values: NovelFormValues): NovelCreateInput {
  return {
    title: values.title.trim(),
    slug: values.slug?.trim() || undefined,
    originalTitle: values.originalTitle?.trim() || "",
    authorId: values.authorId ?? null,
    status: values.status,
    genreIds: values.genreIds,
    tagIds: values.tagIds,
    description: values.description?.trim() || "",
    thumbnailId: values.thumbnail?.id ?? null,
    isPublished: values.isPublished,
  };
}
