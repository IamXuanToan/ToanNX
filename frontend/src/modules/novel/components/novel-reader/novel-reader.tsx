/**
 * Component trình đọc truyện toàn màn hình cho độc giả.
 *
 * Tích hợp Header, Content và Footer tùy biến theo Theme đã chọn.
 */

"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { NOVEL_ROUTES } from "../../constants/routes";
import type { ReaderSettings } from "../../types/reader-settings.types";
import { useNovelReader } from "./hooks/use-novel-reader";
import { ReaderContent } from "./reader-content";
import { ReaderFooter } from "./reader-footer";
import { ReaderHeader } from "./reader-header";

// ============================================================================
// THEME MAPPER
// ============================================================================

const THEME_CLASSES: Record<ReaderSettings["theme"], string> = {
  light: "bg-white text-zinc-900",
  sepia: "bg-[#fbf0d9] text-[#3e2c1c]",
  gray: "bg-[#202225] text-[#e0e0e0]",
  oled: "bg-black text-[#a0a0a0]",
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Trình đọc truyện: hiển thị nội dung chương, thanh điều hướng và công cụ tùy biến.
 *
 * @param props - Nhận `novelSlug` và `chapterNumber`.
 * @returns Khối trình đọc truyện.
 */
export function NovelReader({
  novelSlug,
  chapterNumber,
}: {
  novelSlug: string;
  chapterNumber: number | string;
}) {
  const t = useTranslations("novel.reader");
  const { chapter, isLoading, isError, settings, updateSettings } = useNovelReader(
    novelSlug,
    chapterNumber,
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 p-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <div className="w-full max-w-3xl space-y-3 pt-8">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !chapter) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 p-4 text-center">
        <h2 className="text-xl font-semibold">{t("chapterNotFoundTitle")}</h2>
        <p className="text-muted-foreground text-sm">{t("chapterNotFoundDescription")}</p>
        <Button asChild>
          <Link href={NOVEL_ROUTES.detail(novelSlug)}>{t("backToNovel")}</Link>
        </Button>
      </div>
    );
  }

  const themeClass = THEME_CLASSES[settings.theme] || THEME_CLASSES.sepia;

  return (
    <div className={`min-h-screen transition-colors ${themeClass}`}>
      <ReaderHeader chapter={chapter} settings={settings} onUpdateSettings={updateSettings} />

      <main>
        <ReaderContent chapter={chapter} settings={settings} />
      </main>

      <ReaderFooter chapter={chapter} />
    </div>
  );
}
