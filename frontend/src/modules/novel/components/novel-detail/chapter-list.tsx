/**
 * Thành phần hiển thị danh sách chương của tiểu thuyết kèm bộ lọc và tìm kiếm.
 */

"use client";

import { ArrowDownUp, CheckCircle2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";

import { NOVEL_ROUTES } from "../../constants/routes";
import type { ChapterListItem } from "../../types/chapter.types";

/**
 * Thuộc tính của component `ChapterList`.
 */
export type ChapterListProps = {
  /** Slug định danh của tiểu thuyết */
  novelSlug: string;
  /** Danh sách các chương của truyện */
  chapters: ChapterListItem[];
  /** Danh sách các số chương người dùng đã đọc qua */
  readChapterNumbers?: number[];
  /** Số chương người dùng đọc gần đây nhất nếu có */
  latestReadChapterNumber?: number | null;
};

/**
 * Component hiển thị danh sách toàn bộ chương của một tiểu thuyết.
 *
 * Hỗ trợ tìm kiếm theo số chương hoặc tiêu đề chương, chuyển đổi thứ tự sắp xếp tăng/giảm dần,
 * và hiển thị huy hiệu "Đã đọc" cho các chương người dùng đã hoàn thành.
 *
 * @param props - Thuộc tính `ChapterListProps`.
 * @returns Khối danh sách chương.
 */
export function ChapterList({
  novelSlug,
  chapters,
  readChapterNumbers = [],
  latestReadChapterNumber,
}: ChapterListProps) {
  const t = useTranslations("novel.chapterList");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAscending, setIsAscending] = useState(true);

  const readSet = useMemo(() => new Set(readChapterNumbers), [readChapterNumbers]);

  const filteredChapters = useMemo(() => {
    let result = [...chapters];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (ch) => ch.title.toLowerCase().includes(term) || String(ch.chapterNumber).includes(term),
      );
    }

    result.sort((a, b) =>
      isAscending ? a.chapterNumber - b.chapterNumber : b.chapterNumber - a.chapterNumber,
    );

    return result;
  }, [chapters, isAscending, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="relative w-full sm:w-72">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-9 pl-9 text-sm"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAscending((prev) => !prev)}
          className="w-full sm:w-auto"
        >
          <ArrowDownUp className="mr-2 size-4" />
          {isAscending ? t("sortAscending") : t("sortDescending")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredChapters.map((chapter) => {
          const isRead = readSet.has(chapter.chapterNumber);
          const isLatest = latestReadChapterNumber === chapter.chapterNumber;

          return (
            <Link
              key={chapter.id}
              href={NOVEL_ROUTES.chapter(novelSlug, chapter.chapterNumber)}
              className={`hover:border-primary hover:bg-accent/50 flex items-center justify-between gap-2 rounded-lg border p-3 text-sm transition-colors ${
                isLatest
                  ? "border-primary bg-primary/5 font-medium"
                  : isRead
                    ? "text-muted-foreground bg-muted/20"
                    : ""
              }`}
            >
              <span className="truncate">
                {t("chapterPrefix", { number: chapter.chapterNumber })}: {chapter.title}
              </span>
              {isRead && (
                <span className="flex shrink-0 items-center text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="mr-1 size-3.5" />
                  {t("readBadge")}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {filteredChapters.length === 0 && (
        <div className="text-muted-foreground bg-card rounded-lg border py-8 text-center text-sm">
          {t("noChaptersFound")}
        </div>
      )}
    </div>
  );
}
