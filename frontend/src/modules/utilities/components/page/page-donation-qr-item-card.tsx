"use client";

import Image from "next/image";
import { Check, Edit2, QrCode, Star, Trash2, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shares/components/ui/tooltip";
import { normalizeMediaUrl } from "@/shares/lib/asset-paths";

import type { DonationQrItem } from "../../types/page.types";

export interface PageDonationQrItemCardProps {
  item: DonationQrItem;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  disabled?: boolean;
}

/**
 * Thẻ hiển thị một phương thức nhận tiền / mã QR trong danh sách sắp xếp của PageDonationEditor.
 */
export function PageDonationQrItemCard({
  item,
  onEdit,
  onDelete,
  onSetDefault,
  disabled = false,
}: PageDonationQrItemCardProps) {
  const t = useTranslations("utilities.customPages.pages.donationEditor");
  const getBadgeVariant = (type: DonationQrItem["type"]) => {
    switch (type) {
      case "BANK_TRANSFER":
        return "default";
      case "CUSTOM":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTypeName = (type: DonationQrItem["type"]) => {
    switch (type) {
      case "BANK_TRANSFER":
        return "VietQR";
      case "CUSTOM":
        return t("customType");
      default:
        return "QR";
    }
  };

  return (
    <div className="bg-card border-border flex flex-col justify-between gap-3 rounded-xl border p-3 shadow-2xs sm:flex-row sm:items-center">
      {/* Thông tin chính */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Ảnh preview thu nhỏ hoặc icon */}
        <div className="bg-muted/40 relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
          {item.previewSvg ? (
            <Image
              src={normalizeMediaUrl(item.previewSvg)}
              alt={item.title}
              fill
              sizes="48px"
              unoptimized
              className="object-contain p-1"
            />
          ) : (
            <QrCode className="text-muted-foreground size-6" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={getBadgeVariant(item.type)} className="h-5 px-1.5 text-[10px]">
              {getTypeName(item.type)}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default truncate text-xs font-semibold">{item.title}</span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                {item.title}
              </TooltipContent>
            </Tooltip>
            {item.isDefault && (
              <Badge
                variant="outline"
                className="border-primary/40 text-primary h-5 gap-1 px-1.5 text-[10px]"
              >
                <Check className="size-2.5" />
                <span>{t("defaultBadge")}</span>
              </Badge>
            )}
            {item.webhookEnabled && (
              <Badge
                variant="outline"
                className="h-5 gap-1 border-amber-500/40 px-1.5 text-[10px] text-amber-600 dark:text-amber-400"
              >
                <Zap className="size-2.5" />
                <span>{t("webhookBadge")}</span>
              </Badge>
            )}
            {item.hideAmount && (
              <Badge
                variant="outline"
                className="text-muted-foreground h-5 gap-1 px-1.5 text-[10px]"
              >
                <span>{t("hideAmountBadge")}</span>
              </Badge>
            )}
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span>{item.accountNumber}</span>
            {item.accountHolder && (
              <>
                <span>•</span>
                <span className="uppercase">{item.accountHolder}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hành động */}
      <div className="flex shrink-0 items-center justify-end gap-1.5">
        {!item.isDefault && (
          <AppTooltip content={t("setDefaultTooltip")}>
            <span className="inline-flex">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onSetDefault}
                disabled={disabled}
                className="text-muted-foreground hover:text-foreground h-8 gap-1 px-2 text-[11px]"
              >
                <Star className="size-3" />
                <span className="hidden sm:inline">{t("setDefaultAction")}</span>
              </Button>
            </span>
          </AppTooltip>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onEdit}
          disabled={disabled}
          className="h-8 px-2.5 text-xs"
        >
          <Edit2 className="mr-1 size-3" />
          <span>{t("editAction")}</span>
        </Button>

        <AppTooltip content={t("deleteMethodTooltip")}>
          <span className="inline-flex">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onDelete}
              disabled={disabled}
              className="text-muted-foreground hover:text-destructive h-8 w-8"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </span>
        </AppTooltip>
      </div>
    </div>
  );
}
