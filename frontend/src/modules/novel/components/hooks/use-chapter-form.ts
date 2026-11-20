/**
 * Hook quản lý form chương truyện (tạo mới hoặc chỉnh sửa).
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useCreateChapter } from "../../hooks/use-create-chapter";
import { useUpdateChapter } from "../../hooks/use-update-chapter";
import {
  CHAPTER_DEFAULTS,
  type ChapterFormValues,
  chapterSchema,
  fromChapter,
  toChapterInput,
} from "../../schemas/chapter.schema";
import type { ChapterDetail, ChapterListItem } from "../../types/chapter.types";

/**
 * Quản lý form chương truyện.
 *
 * @param props - Chi tiết chương có sẵn, novelId và callback sau khi lưu thành công.
 * @returns Instance form, submit handler và cờ trạng thái submitting.
 */
export function useChapterForm({
  chapter,
  novelId,
  onSaved,
}: {
  chapter?: ChapterDetail | ChapterListItem;
  novelId?: string;
  onSaved?: (chapter: ChapterDetail | ChapterListItem) => unknown;
} = {}) {
  const create = useCreateChapter();
  const update = useUpdateChapter(chapter?.id ?? "");

  const form = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterSchema((k: string) => k)),
    defaultValues: chapter
      ? fromChapter(chapter)
      : {
          ...CHAPTER_DEFAULTS,
          novelId: novelId ?? "",
        },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = toChapterInput(values);
      let saved: ChapterDetail | ChapterListItem;
      if (chapter) {
        saved = (await update.mutateAsync(payload)) as ChapterDetail;
      } else {
        saved = (await create.mutateAsync(payload)) as ChapterDetail;
      }
      onSaved?.(saved);
    } catch {
      // lỗi API được quản lý bởi useResourceMutation
    }
  });

  return {
    form,
    onSubmit,
    isSubmitting: create.isPending || update.isPending,
  };
}
