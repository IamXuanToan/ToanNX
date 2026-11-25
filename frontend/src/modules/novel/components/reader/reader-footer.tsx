/**
 * Thanh điều hướng chương truyện phía dưới cùng của trang đọc.
 */

"use client";

import { ChevronLeft, ChevronRight, ListOrdered } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";

import { NOVEL_ROUTES } from "../../constants/routes";
import type { ChapterDetail } from "../../types/chapter.types";

export type ReaderFooterProps = {
  chapter: ChapterDetail;
};

/**
 * Thanh điều hướng chân trang đọc truyện: chuyển chương trước, về danh sách chương, chuyển chương tiếp theo.
 *
 * @param props - Thuộc tính `ReaderFooterProps`.
 * @returns Khối điều hướng chân trang đọc.
 */
export function ReaderFooter({ chapter }: ReaderFooterProps) {
  const t = useTranslations("novel.reader");

  return (
    <nav className="border-t px-4 py-8" aria-label={t("chapterNavAria")}>
      <div className="container flex max-w-3xl items-center justify-between gap-3">
        {/* Nút chuyển chương trước */}
        {chapter.prevChapterNumber ? (
          <Button asChild variant="outline" className="gap-2">
            <Link href={NOVEL_ROUTES.chapter(chapter.novelSlug, chapter.prevChapterNumber)}>
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t("prevChapter")}</span>
            </Link>
          </Button>
        ) : (
          <Button variant="outline" disabled className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t("prevChapter")}</span>
          </Button>
        )}

        {/* Nút về danh mục chương */}
        <Button asChild variant="ghost" className="gap-2">
          <Link href={NOVEL_ROUTES.detail(chapter.novelSlug)}>
            <ListOrdered className="h-4 w-4" />
            <span>{t("tableOfContents")}</span>
          </Link>
        </Button>

        {/* Nút chuyển chương sau */}
        {chapter.nextChapterNumber ? (
          <Button asChild variant="outline" className="gap-2">
            <Link href={NOVEL_ROUTES.chapter(chapter.novelSlug, chapter.nextChapterNumber)}>
              <span className="hidden sm:inline">{t("nextChapter")}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" disabled className="gap-2">
            <span className="hidden sm:inline">{t("nextChapter")}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </nav>
  );
}
