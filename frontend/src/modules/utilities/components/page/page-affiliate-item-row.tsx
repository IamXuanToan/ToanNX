"use client";

import { ExternalLink, Package, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { CURRENCY_SYMBOLS } from "@/shares/constants/currency";
import { formatDisplayNumber, formatVndText } from "@/shares/lib/number-format";
import { toSafeHttpUrl } from "@/shares/lib/safe-url";

import type { AffiliateItem } from "../../types/page.types";

const PLATFORM_BADGE_STYLE: Record<string, string> = {
  shopee: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
  lazada: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  tiktok:
    "bg-neutral-900/10 text-neutral-800 border-neutral-900/20 dark:bg-white/10 dark:text-neutral-200",
  tiki: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400",
  amazon: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
};

/**
 * Một hàng hiển thị thông tin tóm tắt sản phẩm Affiliate trong form quản trị.
 *
 * @param props - Dữ liệu sản phẩm, hàm xóa và trạng thái vô hiệu hóa.
 * @returns Hàng sản phẩm.
 */
export function PageAffiliateItemRow({
  item,
  onRemove,
  onEdit,
  disabled = false,
}: {
  item: AffiliateItem;
  onRemove: (id: string) => void;
  onEdit?: (item: AffiliateItem) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("utilities.customPages.pages.itemsEditor");
  const displayPrice = item.priceConfig?.amount
    ? `${formatDisplayNumber(item.priceConfig.amount)} ${item.priceConfig.currency || CURRENCY_SYMBOLS.VND}`
    : item.priceConfig?.priceNote;

  const platformBadgeClass =
    item.platform && PLATFORM_BADGE_STYLE[item.platform]
      ? PLATFORM_BADGE_STYLE[item.platform]
      : "bg-muted text-muted-foreground border-border";

  return (
    <div className="group border-border bg-card hover:border-primary/40 flex items-center justify-between gap-3.5 rounded-xl border p-3 shadow-2xs transition-all hover:shadow-xs">
      <div className="flex min-w-0 items-center gap-3">
        {/* Thumbnail sản phẩm */}
        <div className="border-border bg-muted/60 relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              unoptimized
              className="object-cover transition-transform group-hover:scale-105"
              sizes="56px"
            />
          ) : (
            <Package className="text-muted-foreground size-6" />
          )}
        </div>

        {/* Nội dung chi tiết */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-foreground truncate text-sm font-semibold">{item.title}</h4>
            {item.platform && item.platform !== "custom" ? (
              <Badge
                variant="outline"
                className={`h-4.5 px-1.5 text-[10px] font-bold uppercase ${platformBadgeClass}`}
              >
                {item.platform}
              </Badge>
            ) : null}
            {item.badge ? (
              <span
                className="inline-flex h-5 items-center rounded-md px-1.5 text-[10px] font-bold shadow-2xs"
                style={{
                  backgroundColor: item.badge.bgColor || "#EF4444",
                  color: item.badge.textColor || "#FFFFFF",
                }}
              >
                {item.badge.text}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {displayPrice ? (
              <span className="text-destructive font-bold">{displayPrice}</span>
            ) : null}
            {item.priceConfig?.originalAmount ? (
              <span className="text-muted-foreground text-[11px] line-through">
                {formatVndText(item.priceConfig.originalAmount)}
              </span>
            ) : null}
            {item.categoryId ? (
              <span className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-[10px]">
                {t("category", { category: item.categoryId })}
              </span>
            ) : null}
          </div>

          <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
            {toSafeHttpUrl(item.destinationUrl, { allowRelative: false }) ? (
              <Link
                href={toSafeHttpUrl(item.destinationUrl, { allowRelative: false }) as never}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-primary inline-flex items-center gap-1 hover:underline"
              >
                <ExternalLink className="size-3" />
                <span className="max-w-[220px] truncate sm:max-w-xs">{item.destinationUrl}</span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1">
                <ExternalLink className="size-3" />
                <span className="max-w-[220px] truncate sm:max-w-xs">{item.destinationUrl}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {onEdit ? (
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            disabled={disabled}
            onClick={() => onEdit(item)}
            className="text-muted-foreground hover:bg-muted hover:text-foreground size-8 rounded-lg transition-colors"
            aria-label={t("editItem")}
            title={t("editItem")}
          >
            <Pencil className="size-3.5" />
          </Button>
        ) : null}
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          disabled={disabled}
          onClick={() => onRemove(item.id)}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-8 rounded-lg transition-colors"
          aria-label={t("deleteItem")}
          title={t("deleteItem")}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
