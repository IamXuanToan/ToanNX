/**
 * Component hiển thị danh mục tiểu thuyết công khai (`/novels` | `/truyen`).
 *
 * Bao gồm thanh tìm kiếm, bộ lọc trạng thái, lưới thẻ tiểu thuyết và link tới lịch sử / yêu thích.
 */

"use client";

import { Bookmark, History, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shares/components/ui/select";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { NOVEL_ROUTES } from "../constants/routes";
import { useNovelCatalog } from "./hooks/use-novel-catalog";
import { NovelCard } from "./novel-card";

/**
 * Danh mục tiểu thuyết công khai cho độc giả.
 *
 * @returns Giao diện danh mục tiểu thuyết.
 */
export function NovelCatalog() {
  const t = useTranslations("novel");
  const { novels, isLoading, search, setSearch, status, setStatus, historyMap } = useNovelCatalog();

  return (
    <div className="space-y-6">
      {/* Header & Quick Links */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("catalog.title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("catalog.exploreDescription")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href={NOVEL_ROUTES.history}>
              <History className="h-4 w-4" />
              {t("catalog.readingHistoryButton")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href={NOVEL_ROUTES.favorites}>
              <Bookmark className="h-4 w-4" />
              {t("catalog.favoritesButton")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Toolbar: Tìm kiếm & Lọc */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("catalog.searchPlaceholder")}
            className="pl-9"
          />
        </div>

        <div className="w-full sm:w-48">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder={t("catalog.statusFilter.ALL")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("catalog.statusFilter.ALL")}</SelectItem>
              <SelectItem value="ONGOING">{t("status.ONGOING")}</SelectItem>
              <SelectItem value="COMPLETED">{t("status.COMPLETED")}</SelectItem>
              <SelectItem value="PAUSED">{t("status.PAUSED")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid danh sách tiểu thuyết */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : novels.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {novels.map((novel) => (
            <NovelCard
              key={novel.id}
              novel={novel}
              latestReadChapterNumber={historyMap.get(novel.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm font-medium">{t("catalog.emptyNovels")}</p>
          <p className="text-muted-foreground mt-1 text-xs">{t("catalog.emptyNovelsDesc")}</p>
        </div>
      )}
    </div>
  );
}
