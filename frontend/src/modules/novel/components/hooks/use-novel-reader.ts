/**
 * Hook quản lý trạng thái, phím tắt và ghi nhận lịch sử đọc cho trình đọc truyện.
 */

"use client";

import { useEffect, useRef } from "react";

import { useRouter } from "@/i18n/navigation";

import { NOVEL_ROUTES } from "../../constants/routes";
import { useClientChapter } from "../../hooks/use-client-chapter";
import { useReaderSettings } from "../../hooks/use-reader-settings";
import { readingHistoryService } from "../../services/reading-history.service";

/**
 * Quản lý logic màn hình đọc chương truyện.
 *
 * @param novelSlug - Slug của tiểu thuyết.
 * @param chapterNumber - Số thứ tự chương.
 * @returns Trạng thái chương, cấu hình reader và các hàm điều khiển.
 */
export function useNovelReader(novelSlug: string, chapterNumber: number | string) {
  const router = useRouter();
  const query = useClientChapter(novelSlug, chapterNumber);
  const { settings, updateSettings } = useReaderSettings();
  const recordedRef = useRef<string | null>(null);

  const chapter = query.data;

  // Tự động ghi nhận lịch sử đọc một lần cho mỗi chương
  useEffect(() => {
    if (chapter?.id && chapter.novelId && recordedRef.current !== chapter.id) {
      recordedRef.current = chapter.id;
      void readingHistoryService.recordHistory(chapter.novelId, chapter.id).catch(() => {
        // Bỏ qua lỗi ghi lịch sử nếu mạng chập chờn để không ngắt trải nghiệm đọc
      });
    }
  }, [chapter?.id, chapter?.novelId]);

  // Hỗ trợ phím tắt điều hướng bàn phím (Mũi tên Trái / Phải)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && chapter?.prevChapterNumber) {
        router.push(NOVEL_ROUTES.chapter(novelSlug, chapter.prevChapterNumber));
      } else if (e.key === "ArrowRight" && chapter?.nextChapterNumber) {
        router.push(NOVEL_ROUTES.chapter(novelSlug, chapter.nextChapterNumber));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chapter?.prevChapterNumber, chapter?.nextChapterNumber, novelSlug, router]);

  return {
    chapter,
    isLoading: query.isLoading,
    isError: query.isError,
    settings,
    updateSettings,
  };
}
