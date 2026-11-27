/**
 * Component hiển thị danh sách lịch sử đọc truyện của độc giả.
 *
 * Cho phép xem các truyện và chương đã đọc, thời gian đọc, đọc tiếp và xóa lịch sử.
 */

"use client";

import { BookOpen, Clock, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { TimestampText } from "@/shares/components/common/timestamp-text";

import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/shares/components/common/page-header";
import { Button } from "@/shares/components/ui/button";
import { Card } from "@/shares/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shares/components/ui/dialog";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { NOVEL_ROUTES } from "../../constants/routes";
import { useReadingHistory } from "./hooks/use-reading-history";

/**
 * Hiển thị toàn bộ lịch sử đọc truyện của người dùng.
 *
 * @returns Khối danh sách lịch sử đọc truyện.
 */
export function ReadingHistory() {
  const t = useTranslations("novel.history");
  const tActions = useTranslations("common.actions");
  const {
    historyList,
    isLoading,
    deleteItem,
    isDeletingItem,
    clearAll,
    isClearingAll,
    clearDialogOpen,
    setClearDialogOpen,
  } = useReadingHistory();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={NOVEL_ROUTES.catalog}>{tActions("back")}</Link>
            </Button>

            {historyList.length > 0 && (
              <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10 gap-1.5"
                  >
                    <Trash2 className="size-4" />
                    <span>{t("clearAllButton")}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t("clearConfirmTitle")}</DialogTitle>
                    <DialogDescription>{t("clearConfirmDescription")}</DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" size="sm" onClick={() => setClearDialogOpen(false)}>
                      {t("cancel")}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={clearAll}
                      disabled={isClearingAll}
                    >
                      {isClearingAll && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t("confirmClear")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </>
        }
      />

      {/* Danh sách bản ghi */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : historyList.length > 0 ? (
        <div className="space-y-3">
          {historyList.map((item) => (
            <Card
              key={item.id}
              className="hover:border-border flex items-center justify-between gap-4 p-4 transition-colors"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="bg-muted relative h-16 w-12 shrink-0 overflow-hidden rounded-md">
                  {item.novelThumbnail?.url ? (
                    <Image
                      src={item.novelThumbnail.url}
                      alt={item.novelTitle}
                      fill
                      sizes="48px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                      <BookOpen className="h-5 w-5 opacity-40" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <Link
                    href={NOVEL_ROUTES.detail(item.novelSlug)}
                    className="block truncate text-sm font-semibold hover:underline sm:text-base"
                  >
                    {item.novelTitle}
                  </Link>

                  <p className="text-muted-foreground truncate text-xs">
                    {t("readAtChapter", { number: item.chapterNumber, title: item.chapterTitle })}
                  </p>

                  <div className="text-muted-foreground/80 flex items-center gap-1 text-[11px]">
                    <Clock className="h-3 w-3" />
                    <TimestampText value={item.lastReadAt} />
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button asChild size="sm" className="h-8 text-xs">
                  <Link href={NOVEL_ROUTES.chapter(item.novelSlug, item.chapterNumber)}>
                    {t("continue")}
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive h-8 w-8"
                  onClick={() => deleteItem(item.id)}
                  disabled={isDeletingItem}
                  aria-label={t("deleteItem")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <BookOpen className="text-muted-foreground/40 mb-3 h-10 w-10" />
          <p className="text-sm font-medium">{t("emptyHistory")}</p>
          <p className="text-muted-foreground mt-1 max-w-sm text-xs">{t("emptyHistoryDesc")}</p>
          <Button asChild size="sm" className="mt-4">
            <Link href={NOVEL_ROUTES.catalog}>{t("backToCatalog")}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
