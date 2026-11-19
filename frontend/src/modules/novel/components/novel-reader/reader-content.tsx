/**
 * Vùng hiển thị nội dung văn bản của chương truyện.
 */

"use client";

import { useMemo } from "react";

import type { ChapterDetail } from "../../types/chapter.types";
import type { ReaderSettings } from "../../types/reader-settings.types";

export type ReaderContentProps = {
  chapter: ChapterDetail;
  settings: ReaderSettings;
};

/**
 * Hiển thị toàn bộ đoạn văn bản của chương truyện theo tùy biến giao diện của người dùng.
 *
 * Tự động phân tách nội dung theo dòng trống và bọc từng đoạn `<p>` để tối ưu trải nghiệm đọc.
 *
 * @param props - Thuộc tính `ReaderContentProps`.
 * @returns Khối nội dung văn bản chương.
 */
export function ReaderContent({ chapter, settings }: ReaderContentProps) {
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

  return (
    <article
      className={`mx-auto px-4 py-8 transition-all sm:py-12 ${widthClass} ${fontClass}`}
      style={{
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
      }}
    >
      <div className="mb-8 border-b pb-4 text-center">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          Chương {chapter.chapterNumber}: {chapter.title}
        </h2>
        <div className="text-muted-foreground mt-2 flex items-center justify-center gap-4 text-xs">
          <span>{chapter.wordCount} chữ</span>
          <span>•</span>
          <span>{chapter.novelTitle}</span>
        </div>
      </div>

      <div className="space-y-4 text-justify select-text">
        {paragraphs.map((para, idx) => (
          <p key={idx} className="indent-6 leading-relaxed sm:indent-8">
            {para}
          </p>
        ))}
      </div>
    </article>
  );
}
