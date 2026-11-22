"use client";

import { cn } from "cn";
import { Check, Eye, Pencil } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Card } from "@/shares/components/ui/card";
import { Checkbox } from "@/shares/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shares/components/ui/tooltip";

import { formatAttachmentSize } from "../../services/attachment.service";
import type { Attachment } from "../../types/attachment.types";
import { AttachmentPreview } from "./attachment-preview";
import type { AttachmentViewMode } from "./hooks/use-attachment-view-mode";

/**
 * Hiển thị tập hợp tệp đính kèm theo 3 chế độ xem linh hoạt (Lưới lớn, Lưới nhỏ, Danh sách chi tiết).
 *
 * @param props - Danh sách tệp, mục đang chọn, callback chọn/xem/sửa và chế độ xem.
 * @param props.files - Danh sách đối tượng Attachment cần hiển thị.
 * @param props.activeId - ID tệp đang được chọn xem chi tiết.
 * @param props.selectedIds - Danh sách ID tệp được chọn hàng loạt (checkbox).
 * @param props.viewMode - Chế độ hiển thị: "grid" (lưới lớn), "compact" (lưới nhỏ), "list" (danh sách).
 * @param props.onInspect - Callback khi người dùng nhấp chọn tệp.
 * @param props.onToggle - Callback khi bật/tắt checkbox chọn hàng loạt.
 * @param props.onConfirm - Callback khi nhấp đúp để xác nhận sử dụng ảnh (trong picker).
 * @param props.onEdit - Callback khi nhấp sửa tệp.
 * @param props.onViewDetails - Callback khi bấm xem chi tiết tệp.
 * @param props.disabled - Trạng thái vô hiệu hóa thao tác.
 * @param props.className - Lớp CSS tùy biến bổ sung.
 * @returns Giao diện hiển thị tệp đính kèm đa năng và mượt mà.
 */
export function AttachmentGrid({
  files,
  activeId,
  selectedIds,
  viewMode = "grid",
  onInspect,
  onToggle,
  onConfirm,
  onEdit,
  onViewDetails,
  disabled,
  className,
}: {
  files: Attachment[];
  activeId?: string;
  selectedIds?: readonly string[];
  viewMode?: AttachmentViewMode;
  onInspect: (file: Attachment) => void;
  onToggle?: (id: string, selected: boolean) => void;
  onConfirm?: (file: Attachment) => void;
  onEdit?: (file: Attachment) => void;
  onViewDetails?: (file: Attachment) => void;
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations("system.attachment");
  const format = useFormatter();

  // =========================================================================
  // 1. CHẾ ĐỘ XEM DANH SÁCH CHI TIẾT (LIST / TABLE VIEW)
  // =========================================================================
  if (viewMode === "list") {
    return (
      <div
        className={cn(
          "bg-card border-border/70 overflow-hidden rounded-xl border shadow-2xs",
          className,
        )}
        data-testid="attachment-grid"
      >
        {/* Header bảng danh sách */}
        <div className="bg-muted/40 text-muted-foreground border-border/60 flex items-center gap-3 border-b px-3 py-2 text-xs font-medium select-none sm:px-4">
          {onToggle ? <div className="w-5 shrink-0" /> : null}
          <div className="size-9 shrink-0" />
          <div className="min-w-0 flex-1">{t("name")}</div>
          <div className="hidden w-20 text-center sm:block">{t("type")}</div>
          <div className="w-24 text-right">{t("size")}</div>
          <div className="hidden w-32 md:block">{t("folder")}</div>
          <div className="hidden w-36 text-right lg:block">{t("uploadedAt")}</div>
          <div className="w-16 shrink-0 text-right">{t("actions")}</div>
        </div>

        {/* Danh sách các dòng tệp */}
        <div className="divide-border/40 divide-y">
          {files.map((file) => {
            const isSelected = selectedIds?.includes(file.id) ?? false;
            const isActive = activeId === file.id;

            return (
              <div
                key={file.id}
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-label={t("inspect", { name: file.originalName })}
                aria-pressed={isActive}
                aria-disabled={disabled}
                onClick={() => !disabled && onInspect(file)}
                onDoubleClick={() =>
                  !disabled && (onConfirm ? onConfirm(file) : onEdit ? onEdit(file) : undefined)
                }
                onKeyDown={(event) => {
                  if (disabled) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onInspect(file);
                  }
                }}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2 text-xs transition-colors select-none sm:px-4",
                  disabled && "pointer-events-none opacity-60",
                  isActive
                    ? "bg-primary-light text-primary font-medium"
                    : isSelected
                      ? "bg-primary/5"
                      : "hover:bg-muted/40",
                )}
              >
                {/* Checkbox chọn hàng loạt */}
                {onToggle ? (
                  <div
                    className="flex w-5 shrink-0 items-center justify-center"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onToggle(file.id, checked === true)}
                      disabled={disabled}
                      aria-label={t("select", { name: file.originalName })}
                      className="size-4 rounded"
                    />
                  </div>
                ) : null}

                {/* Thumbnail nhỏ 36px */}
                <div className="bg-muted/40 border-border/60 relative size-9 shrink-0 overflow-hidden rounded-lg border">
                  <AttachmentPreview key={file.id} file={file} contain className="size-full" />
                </div>

                {/* Tên tệp */}
                <div className="min-w-0 flex-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p
                        className={cn(
                          "truncate text-xs font-medium sm:text-sm",
                          isActive ? "text-primary" : "text-foreground",
                        )}
                        title={file.originalName}
                      >
                        {file.originalName}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs font-normal break-all">
                      {file.originalName}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Định dạng */}
                <div className="text-muted-foreground/80 hidden w-20 text-center font-mono text-[11px] uppercase sm:block">
                  {file.contentType.split("/")[1]?.toUpperCase() || "FILE"}
                </div>

                {/* Dung lượng */}
                <div className="text-muted-foreground w-24 text-right font-mono text-xs tabular-nums">
                  {formatAttachmentSize(file.size)}
                </div>

                {/* Thư mục */}
                <div className="text-muted-foreground hidden w-32 truncate text-xs md:block">
                  {file.folderName || t("unfiled")}
                </div>

                {/* Ngày tải lên */}
                <div className="text-muted-foreground hidden w-36 text-right text-xs tabular-nums lg:block">
                  {format.dateTime(new Date(file.createdAt), {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>

                {/* Thao tác Xem / Sửa */}
                <div
                  className="flex w-16 shrink-0 items-center justify-end gap-1"
                  onClick={(event) => event.stopPropagation()}
                >
                  {onViewDetails ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewDetails(file)}
                      className="text-muted-foreground hover:text-foreground size-7 rounded-lg"
                      title={t("viewDetails")}
                      aria-label={t("viewDetails")}
                    >
                      <Eye className="size-3.5" />
                    </Button>
                  ) : onEdit ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(file)}
                      className="text-muted-foreground hover:text-foreground size-7 rounded-lg"
                      title={t("editFile")}
                      aria-label={t("editFile")}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. CHẾ ĐỘ XEM LƯỚI NHỎ (COMPACT / SMALL GRID) VÀ LƯỚI LỚN (GRID)
  // =========================================================================
  const isCompact = viewMode === "compact";

  return (
    <div
      className={cn(
        isCompact
          ? "grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8"
          : "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
        className,
      )}
      data-testid="attachment-grid"
    >
      {files.map((file) => {
        const isSelected = selectedIds?.includes(file.id) ?? false;
        const isActive = activeId === file.id;

        return (
          <Card
            key={file.id}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={t("inspect", { name: file.originalName })}
            aria-pressed={isActive}
            aria-disabled={disabled}
            onClick={() => !disabled && onInspect(file)}
            onDoubleClick={() =>
              !disabled && (onConfirm ? onConfirm(file) : onEdit ? onEdit(file) : undefined)
            }
            onKeyDown={(event) => {
              if (disabled) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onInspect(file);
              }
            }}
            className={cn(
              "group focus-visible:ring-primary relative min-w-0 cursor-pointer overflow-hidden rounded-xl border p-0 transition-all duration-150 select-none focus-visible:ring-2 focus-visible:outline-hidden",
              disabled && "pointer-events-none opacity-60",
              isActive
                ? "border-primary ring-primary/25 shadow-xs ring-2"
                : isSelected
                  ? "border-primary/60 bg-primary/5 shadow-2xs"
                  : "border-border/70 hover:border-primary/50 hover:shadow-xs",
            )}
          >
            <div className="bg-muted/30 relative aspect-square w-full overflow-hidden">
              <AttachmentPreview key={file.id} file={file} />
            </div>

            <div className={cn("space-y-1", isCompact ? "p-2" : "p-2.5 sm:p-3")}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p
                    className={cn(
                      "text-foreground truncate font-medium",
                      isCompact ? "text-[11px] leading-tight" : "text-xs leading-snug sm:text-sm",
                    )}
                    title={file.originalName}
                  >
                    {file.originalName}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs font-normal break-all">
                  {file.originalName}
                </TooltipContent>
              </Tooltip>

              <div
                className={cn(
                  "text-muted-foreground flex items-center justify-between gap-1",
                  isCompact ? "text-[10px]" : "text-[11px] sm:text-xs",
                )}
              >
                <span className="text-muted-foreground/80 font-mono text-[10px] tracking-wider uppercase">
                  {file.contentType.split("/")[1]?.toUpperCase() ?? "FILE"}
                </span>
                <span className="shrink-0 tabular-nums">{formatAttachmentSize(file.size)}</span>
              </div>
            </div>

            {/* Checkbox chọn tệp hàng loạt */}
            {onToggle ? (
              <div
                className={cn(
                  "absolute top-2 left-2 z-10 flex items-center justify-center transition-opacity duration-150",
                  isSelected
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
                )}
                onClick={(event) => event.stopPropagation()}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onToggle(file.id, checked === true)}
                  disabled={disabled}
                  aria-label={t("select", { name: file.originalName })}
                  className="border-border/80 bg-background/90 data-[state=checked]:border-primary data-[state=checked]:bg-primary size-4.5 rounded shadow-xs backdrop-blur-xs"
                />
              </div>
            ) : isActive ? (
              <span className="bg-primary text-primary-foreground pointer-events-none absolute top-2 right-2 z-10 flex size-5.5 items-center justify-center rounded-full shadow-xs">
                <Check className="size-3 stroke-[2.5]" />
              </span>
            ) : null}

            {/* Nút xem chi tiết hoặc sửa trên thẻ */}
            {onViewDetails && !isSelected ? (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={(event) => {
                  event.stopPropagation();
                  onViewDetails(file);
                }}
                className={cn(
                  "bg-background/90 text-muted-foreground hover:text-foreground absolute top-2 right-2 z-10 rounded-lg shadow-xs backdrop-blur-xs transition-opacity duration-150",
                  isCompact ? "size-6" : "size-7",
                  isActive
                    ? "right-8 opacity-0 group-hover:opacity-100"
                    : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                )}
                title={t("viewDetails")}
                aria-label={t("viewDetails")}
              >
                <Eye className={isCompact ? "size-3" : "size-3.5"} />
              </Button>
            ) : onEdit && !isSelected ? (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(file);
                }}
                className={cn(
                  "bg-background/90 text-muted-foreground hover:text-foreground absolute top-2 right-2 z-10 rounded-lg shadow-xs backdrop-blur-xs transition-opacity duration-150",
                  isCompact ? "size-6" : "size-7",
                  isActive
                    ? "right-8 opacity-0 group-hover:opacity-100"
                    : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                )}
                title={t("editFile")}
                aria-label={t("editFile")}
              >
                <Pencil className={isCompact ? "size-3" : "size-3.5"} />
              </Button>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
