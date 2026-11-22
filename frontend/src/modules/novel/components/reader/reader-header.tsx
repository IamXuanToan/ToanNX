/**
 * Thanh tiêu đề trên cùng của màn hình đọc truyện.
 */

"use client";

import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";

import { NOVEL_ROUTES } from "../../constants/routes";
import type { ChapterDetail } from "../../types/chapter.types";
import type { ReaderSettings } from "../../types/reader-settings.types";
import { ReaderSettingsDialog } from "./reader-settings-dialog";

export type ReaderHeaderProps = {
  chapter: ChapterDetail;
  settings: ReaderSettings;
  onUpdateSettings: (updates: Partial<ReaderSettings>) => void;
};

/**
 * Thanh công cụ phía trên trang đọc: nút quay lại chi tiết truyện,
 * tên chương, nút chuyển chương nhanh và nút mở hộp thoại cài đặt giao diện.
 *
 * @param props - Thuộc tính `ReaderHeaderProps`.
 * @returns Thanh header của trình đọc truyện.
 */
export function ReaderHeader({ chapter, settings, onUpdateSettings }: ReaderHeaderProps) {
  const t = useTranslations("novel.reader");

  return (
    <header className="bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors">
      <div className="container flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        {/* Nút quay về trang chi tiết truyện */}
        <div className="flex min-w-0 items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label={t("backToNovel")}>
            <Link href={NOVEL_ROUTES.detail(chapter.novelSlug)}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="min-w-0">
            <Link
              href={NOVEL_ROUTES.detail(chapter.novelSlug)}
              className="text-muted-foreground block truncate text-xs hover:underline"
            >
              {chapter.novelTitle}
            </Link>
            <h1 className="truncate text-sm leading-tight font-semibold">
              {t("chapterPrefix", { number: chapter.chapterNumber })}: {chapter.title}
            </h1>
          </div>
        </div>

        {/* Thanh công cụ phải */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Nút chương trước */}
          {chapter.prevChapterNumber ? (
            <Button asChild variant="ghost" size="icon" aria-label={t("prevChapter")}>
              <Link href={NOVEL_ROUTES.chapter(chapter.novelSlug, chapter.prevChapterNumber)}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="icon" disabled aria-label={t("prevChapter")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Nút chương sau */}
          {chapter.nextChapterNumber ? (
            <Button asChild variant="ghost" size="icon" aria-label={t("nextChapter")}>
              <Link href={NOVEL_ROUTES.chapter(chapter.novelSlug, chapter.nextChapterNumber)}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="icon" disabled aria-label={t("nextChapter")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Dialog cấu hình giao diện đọc */}
          <ReaderSettingsDialog settings={settings} onUpdate={onUpdateSettings} />
        </div>
      </div>
    </header>
  );
}
