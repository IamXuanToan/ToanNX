/**
 * Schema xác thực dữ liệu Form Chương truyện (Chapter).
 */

import { z } from "zod";

import type { UploadedFile } from "@/shares/components/common/image-upload/types";

import type { ChapterCreateInput, ChapterDetail, ChapterListItem } from "../types/novel.types";

type Translate = (key: string) => string;

/**
 * Tạo schema xác thực form chương truyện.
 *
 * @param t - Hàm dịch i18n thông báo lỗi.
 * @returns Zod schema.
 */
export function chapterSchema(t: Translate) {
  return z.object({
    novelId: z.string().uuid(t("required")),
    chapterNumber: z.number().int().min(1, t("minNumber")),
    title: z.string().trim().min(1, t("required")).max(255),
    slug: z.string().trim().max(255).optional(),
    content: z.string().min(1, t("required")),
    thumbnail: z.custom<UploadedFile | null>().nullable().optional(),
    isPublished: z.boolean(),
  });
}

export type ChapterFormValues = z.infer<ReturnType<typeof chapterSchema>>;

export const CHAPTER_DEFAULTS: ChapterFormValues = {
  novelId: "",
  chapterNumber: 1,
  title: "",
  slug: "",
  content: "",
  thumbnail: null,
  isPublished: true,
};

/**
 * Chuyển dữ liệu Chapter từ backend thành dữ liệu khởi tạo cho form.
 *
 * @param chapter - Chi tiết chương từ backend.
 * @returns Giá trị form.
 */
export function fromChapter(chapter: ChapterDetail | ChapterListItem): ChapterFormValues {
  return {
    novelId:
      "novel" in chapter && typeof chapter.novel === "object" && chapter.novel !== null
        ? (chapter.novel as { id: string }).id
        : "",
    chapterNumber: chapter.chapterNumber,
    title: chapter.title,
    slug: chapter.slug,
    content: "content" in chapter ? (chapter.content ?? "") : "",
    thumbnail: null,
    isPublished: true,
  };
}

/**
 * Chuyển giá trị form thành payload gửi API.
 *
 * @param values - Giá trị form chương.
 * @returns Payload hợp lệ cho API `chapterService`.
 */
export function toChapterInput(values: ChapterFormValues): ChapterCreateInput {
  return {
    novelId: values.novelId,
    chapterNumber: values.chapterNumber,
    title: values.title.trim(),
    slug: values.slug?.trim() || undefined,
    content: values.content,
    thumbnailId: values.thumbnail?.id ?? null,
    isPublished: values.isPublished,
  };
}
