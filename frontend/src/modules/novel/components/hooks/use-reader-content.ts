"use client";

import { useMemo } from "react";

import type { ChapterDetail } from "../../types/chapter.types";
import type { ReaderSettings } from "../../types/reader-settings.types";

/**
 * Hook tính toán định dạng hiển thị nội dung chương tiểu thuyết:
 * - Tách văn bản thành các đoạn văn (paragraphs) dựa trên dòng trống.
 * - Xác định CSS class cho font chữ (serif, mono, sans).
 * - Xác định CSS class cho độ rộng trang đọc (narrow, wide, normal).
 *
 * @param props - Chi tiết chương và cài đặt đọc của người dùng.
 * @returns Danh sách đoạn văn, fontClass và widthClass.
 */
export function useReaderContent({
  chapter,
  settings,
}: {
  chapter: ChapterDetail;
  settings: ReaderSettings;
}) {
  const paragraphs = useMemo(() => {
    if (!chapter.content) return [];
    return chapter.content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [chapter.content]);

  const fontClass =
    settings.fontFamily === "serif"
      ? "font-serif"
      : settings.fontFamily === "mono"
        ? "font-mono"
        : "font-sans";

  const widthClass =
    settings.contentWidth === "narrow"
      ? "max-w-2xl"
      : settings.contentWidth === "wide"
        ? "max-w-5xl"
        : "max-w-3xl";

  return {
    paragraphs,
    fontClass,
    widthClass,
  };
}
