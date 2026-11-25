"use client";

import { Grid2x2, LayoutGrid, List } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shares/components/ui/tooltip";

import type { AttachmentViewMode } from "./hooks/use-attachment-view-mode";

/**
 * Nhóm nút chuyển đổi chế độ xem tệp đính kèm (Lưới lớn, Lưới nhỏ, Danh sách chi tiết).
 * Tương tự thanh công cụ của Windows File Explorer.
 *
 * @param props - Chế độ xem hiện tại và callback khi thay đổi.
 * @param props.viewMode - Chế độ xem đang kích hoạt.
 * @param props.onViewModeChange - Hàm xử lý khi người dùng chọn chế độ xem khác.
 * @returns Nhóm nút toggle chế độ xem trực quan, thẩm mỹ.
 */
export function AttachmentViewModeToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: AttachmentViewMode;
  onViewModeChange: (mode: AttachmentViewMode) => void;
}) {
  const t = useTranslations("system.attachment");

  return (
    <div
      role="group"
      aria-label={t("viewModeGroupAria")}
      className="border-border/70 bg-muted/30 flex h-10 items-center rounded-xl border p-0.5 shadow-2xs"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange("grid")}
            className={`size-8 rounded-lg transition-all ${
              viewMode === "grid"
                ? "bg-background text-foreground font-medium shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={viewMode === "grid"}
            aria-label={t("viewModeGrid")}
          >
            <LayoutGrid className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {t("viewModeGrid")}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange("compact")}
            className={`size-8 rounded-lg transition-all ${
              viewMode === "compact"
                ? "bg-background text-foreground font-medium shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={viewMode === "compact"}
            aria-label={t("viewModeCompact")}
          >
            <Grid2x2 className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {t("viewModeCompact")}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange("list")}
            className={`size-8 rounded-lg transition-all ${
              viewMode === "list"
                ? "bg-background text-foreground font-medium shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={viewMode === "list"}
            aria-label={t("viewModeList")}
          >
            <List className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {t("viewModeList")}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
