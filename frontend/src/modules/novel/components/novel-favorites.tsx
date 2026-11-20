/**
 * Component hiển thị danh sách tiểu thuyết yêu thích của độc giả.
 *
 * Cho phép xem lưới các tác phẩm đã lưu, chuyển tới trang chi tiết hoặc gỡ khỏi danh sách yêu thích.
 */

"use client";

import { ArrowLeft, BookOpen, Bookmark, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";
import { Card } from "@/shares/components/ui/card";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { NOVEL_ROUTES } from "../constants/routes";
import { useNovelFavoritesComponent } from "./hooks/use-novel-favorites-component";

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Hiển thị danh sách tiểu thuyết yêu thích dạng lưới thẻ.
 *
 * @returns Khối danh sách truyện yêu thích.
 */
export function NovelFavorites() {
  const t = useTranslations("novel");
  const { favoriteList, isLoading, toggleFavorite, isToggling } = useNovelFavoritesComponent();

  return (
    <div className="space-y-6">
      {/* Nút quay lại danh mục */}
      <div className="border-b pb-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Link href={NOVEL_ROUTES.catalog}>
            <ArrowLeft className="h-4 w-4" />
            <span>{t("favorites.backToCatalog")}</span>
          </Link>
        </Button>
      </div>

      {/* Tiêu đề trang */}
      <div className="flex items-center gap-3">
        <Bookmark className="text-primary h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("favorites.title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("favorites.description")}</p>
        </div>
      </div>

      {/* Grid danh sách yêu thích */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : favoriteList.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {favoriteList.map((item) => (
            <Card
              key={item.id}
              className="group border-border/60 bg-card hover:border-border relative overflow-hidden rounded-xl border transition-all hover:shadow-md"
            >
              <Link
                href={NOVEL_ROUTES.detail(item.novelSlug)}
                className="focus-visible:ring-primary block focus-visible:ring-2 focus-visible:outline-none"
              >
                <div className="bg-muted relative aspect-[3/4] w-full overflow-hidden">
                  {item.novelThumbnail?.url ? (
                    <Image
                      src={item.novelThumbnail.url}
                      alt={item.novelTitle}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center p-4 text-center">
                      <BookOpen className="mb-1 h-8 w-8 opacity-40" />
                      <span className="line-clamp-2 text-xs">{item.novelTitle}</span>
                    </div>
                  )}

                  {/* Nút gỡ bỏ khỏi yêu thích */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(item.novelId);
                    }}
                    disabled={isToggling}
                    aria-label={t("favorites.remove")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="p-3">
                  <h3 className="group-hover:text-primary line-clamp-2 text-sm font-semibold tracking-tight transition-colors">
                    {item.novelTitle}
                  </h3>
                  <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                    {item.novelAuthorName || t("favorites.unknownAuthor")}
                  </p>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Bookmark className="text-muted-foreground/40 mb-3 h-10 w-10" />
          <p className="text-sm font-medium">{t("favorites.emptyFavorites")}</p>
          <p className="text-muted-foreground mt-1 max-w-sm text-xs">
            {t("favorites.emptyFavoritesDesc")}
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href={NOVEL_ROUTES.catalog}>{t("favorites.backToCatalog")}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
