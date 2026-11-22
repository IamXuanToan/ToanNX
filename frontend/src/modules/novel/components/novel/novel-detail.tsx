/**
 * Component hiển thị thông tin chi tiết tiểu thuyết dành cho độc giả.
 *
 * Bao gồm ảnh bìa, tóm tắt, tác giả, thể loại, trạng thái, nút đọc truyện,
 * nút yêu thích và danh sách các chương.
 */

"use client";

import { BookOpen, Heart, ListOrdered, Share2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Card } from "@/shares/components/ui/card";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { NOVEL_ROUTES } from "../../constants/routes";
import { ChapterList } from "../chapter/chapter-list";
import { useNovelDetail } from "./hooks/use-novel-detail";

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Component chi tiết tiểu thuyết cho độc giả.
 *
 * @param props - Đối tượng chứa `slug` của tiểu thuyết.
 * @returns Giao diện chi tiết tiểu thuyết.
 */
export function NovelDetail({ slug }: { slug: string }) {
  const t = useTranslations("novel");
  const { novel, chapters, isLoading, isError, toggleFavorite, isFavoriting } =
    useNovelDetail(slug);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <Skeleton className="h-80 w-full shrink-0 rounded-lg md:w-56" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !novel) {
    return (
      <div className="space-y-4 py-16 text-center">
        <h2 className="text-xl font-semibold">{t("detail.notFoundTitle")}</h2>
        <p className="text-muted-foreground">{t("detail.notFoundDesc")}</p>
        <Button asChild>
          <Link href={NOVEL_ROUTES.catalog}>{t("detail.backToCatalog")}</Link>
        </Button>
      </div>
    );
  }

  const firstChapterNumber = novel.firstChapterNumber || 1;
  const continueChapterNumber = novel.latestReadChapterNumber || firstChapterNumber;
  const status = novel.status || "ONGOING";

  const handleShare = () => {
    if (typeof window !== "undefined") {
      void navigator.clipboard.writeText(window.location.href);
      toast.success(t("detail.copiedLink"));
    }
  };

  return (
    <div className="space-y-8">
      {/* Khối thông tin đầu sách */}
      <div className="flex flex-col items-start gap-6 md:flex-row lg:gap-8">
        <div className="bg-muted relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-xl border shadow-sm md:w-56 lg:w-64">
          {novel.thumbnail?.url ? (
            <Image
              src={novel.thumbnail.url}
              alt={novel.title}
              fill
              sizes="(max-width: 768px) 100vw, 256px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center p-4 text-center">
              <BookOpen className="mb-2 size-12 stroke-[1.5]" />
              <span className="text-xs">{novel.title}</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{t(`status.${status}`)}</Badge>
              {novel.genres?.map((genre) => (
                <Badge key={genre.id} variant="outline">
                  {genre.name}
                </Badge>
              ))}
            </div>

            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{novel.title}</h1>
            <p className="text-muted-foreground text-sm">
              {t("detail.author")}:{" "}
              <span className="text-foreground font-medium">
                {novel.author?.name || t("detail.unknownAuthor")}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg" className="gap-2">
              <Link href={NOVEL_ROUTES.chapter(novel.slug, continueChapterNumber)}>
                <BookOpen className="size-4" />
                {novel.latestReadChapterNumber
                  ? t("detail.continueReading", { number: continueChapterNumber })
                  : t("detail.startReading")}
              </Link>
            </Button>

            <Button
              variant={novel.isFavorite ? "default" : "outline"}
              size="lg"
              onClick={toggleFavorite}
              disabled={isFavoriting}
              className="gap-2"
            >
              <Heart className={`size-4 ${novel.isFavorite ? "fill-current" : ""}`} />
              {novel.isFavorite ? t("detail.favorited") : t("detail.favorite")}
            </Button>

            <Button variant="ghost" size="lg" onClick={handleShare} className="gap-2">
              <Share2 className="size-4" />
              {t("detail.share")}
            </Button>
          </div>

          {novel.description && (
            <div className="pt-2">
              <h2 className="text-muted-foreground mb-1 text-sm font-semibold">
                {t("detail.synopsis")}
              </h2>
              <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-line">
                {novel.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Khối danh sách chương */}
      <Card className="space-y-4 p-4 sm:p-6">
        <div className="flex items-center gap-2 border-b pb-3">
          <ListOrdered className="text-primary size-5" />
          <h2 className="text-base font-semibold sm:text-lg">{t("detail.chapterListTitle")}</h2>
        </div>

        <ChapterList
          novelSlug={novel.slug}
          chapters={chapters}
          readChapterNumbers={novel.readChapterNumbers || []}
          latestReadChapterNumber={novel.latestReadChapterNumber}
        />
      </Card>
    </div>
  );
}
