/**
 * Thành phần thẻ hiển thị một tiểu thuyết trong danh mục truyện công khai.
 */

"use client";

import { BookOpen, Eye, Heart } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/shares/components/ui/badge";
import { Card } from "@/shares/components/ui/card";

import { NOVEL_ROUTES } from "../../constants/routes";
import type { Novel } from "../../types/novel.types";

/**
 * Thuộc tính của component `NovelCard`.
 */
export type NovelCardProps = {
  /** Dữ liệu tóm tắt của tiểu thuyết */
  novel: Novel;
  /** Số chương người dùng đọc gần đây nhất nếu có */
  latestReadChapterNumber?: number | null;
};

/**
 * Thẻ hiển thị tóm tắt tiểu thuyết dạng Card.
 *
 * Bao gồm ảnh bìa truyện tỷ lệ 3:4, huy hiệu trạng thái ra chương, tiêu đề truyện,
 * tên tác giả, số lượt xem, số lượt yêu thích và huy hiệu đọc tiếp nếu người dùng đã từng đọc.
 *
 * @param props - Thuộc tính `NovelCardProps`.
 * @returns Khối Card tiểu thuyết.
 */
export function NovelCard({ novel, latestReadChapterNumber }: NovelCardProps) {
  const t = useTranslations("novel");
  const status = novel.status || "ONGOING";

  return (
    <Card className="group border-border/60 bg-card hover:border-border relative overflow-hidden rounded-xl border transition-all hover:shadow-md">
      <Link
        href={NOVEL_ROUTES.detail(novel.slug)}
        className="focus-visible:ring-primary block focus-visible:ring-2 focus-visible:outline-none"
      >
        {/* Ảnh bìa */}
        <div className="bg-muted relative aspect-[3/4] w-full overflow-hidden">
          {novel.thumbnail?.url ? (
            <Image
              src={novel.thumbnail.url}
              alt={novel.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center p-4 text-center">
              <BookOpen className="h-10 w-10 opacity-30" />
              <span className="mt-2 line-clamp-2 text-xs font-medium">{novel.title}</span>
            </div>
          )}

          {/* Huy hiệu trạng thái xuất bản */}
          <div className="absolute top-2 right-2">
            <Badge
              variant={
                status === "COMPLETED" ? "secondary" : status === "PAUSED" ? "outline" : "default"
              }
              className="text-[10px] font-medium shadow-sm backdrop-blur-md"
            >
              {t(`status.${status}`)}
            </Badge>
          </div>

          {/* Đang đọc dở */}
          {latestReadChapterNumber && (
            <div className="absolute bottom-2 left-2">
              <Badge
                variant="secondary"
                className="bg-background/90 text-[10px] shadow-sm backdrop-blur-md"
              >
                {t("card.continueChapter", { number: latestReadChapterNumber })}
              </Badge>
            </div>
          )}
        </div>

        {/* Nội dung tóm tắt */}
        <div className="p-3">
          <h3 className="group-hover:text-primary line-clamp-2 text-sm font-semibold tracking-tight transition-colors">
            {novel.title}
          </h3>

          <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
            {novel.author?.name || t("card.unknownAuthor")}
          </p>

          <div className="border-border/40 text-muted-foreground mt-3 flex items-center justify-between border-t pt-2 text-[11px]">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {novel.viewsCount ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-rose-500" />
              {novel.favoritesCount ?? 0}
            </span>
            <span>{t("card.chapterCount", { count: novel.chaptersCount })}</span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
