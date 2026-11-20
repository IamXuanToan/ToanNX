"use client";

import { cn } from "cn";
import { Check, Eye, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Card } from "@/shares/components/ui/card";
import { Checkbox } from "@/shares/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shares/components/ui/tooltip";

import { formatAttachmentSize } from "../services/attachment.service";
import type { Attachment } from "../types/attachment.types";
import { AttachmentPreview } from "./attachment-preview";

/** @param props - File, mục đang xem và callback chọn/sửa. @returns Lưới media dùng chung cho thư viện và bộ chọn ảnh. */
export function AttachmentGrid({
  files,
  activeId,
  selectedIds,
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
  onInspect: (file: Attachment) => void;
  onToggle?: (id: string, selected: boolean) => void;
  onConfirm?: (file: Attachment) => void;
  onEdit?: (file: Attachment) => void;
  onViewDetails?: (file: Attachment) => void;
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations("system.attachment");
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
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
            <div className="space-y-1 p-2.5 sm:p-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p
                    className="text-foreground truncate text-xs leading-snug font-medium sm:text-sm"
                    title={file.originalName}
                  >
                    {file.originalName}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs font-normal break-all">
                  {file.originalName}
                </TooltipContent>
              </Tooltip>
              <div className="text-muted-foreground flex items-center justify-between gap-1 text-[11px] sm:text-xs">
                <span className="text-muted-foreground/80 text-[10px] font-medium tracking-wider uppercase">
                  {file.contentType.split("/")[1]?.toUpperCase() ?? "FILE"}
                </span>
                <span className="shrink-0 tabular-nums">{formatAttachmentSize(file.size)}</span>
              </div>
            </div>

            {/* Checkbox chọn tệp hàng loạt */}
            {onToggle ? (
              <div
                className={cn(
                  "absolute top-2.5 left-2.5 z-10 flex items-center justify-center transition-opacity duration-150",
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
                  className="border-border/80 bg-background/90 data-[state=checked]:border-primary data-[state=checked]:bg-primary size-5 rounded-md shadow-xs backdrop-blur-xs"
                />
              </div>
            ) : isActive ? (
              <span className="bg-primary text-primary-foreground pointer-events-none absolute top-2.5 right-2.5 z-10 flex size-6 items-center justify-center rounded-full shadow-xs">
                <Check className="size-3.5 stroke-[2.5]" />
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
                  "bg-background/90 text-muted-foreground hover:text-foreground absolute top-2.5 right-2.5 z-10 size-7 rounded-lg shadow-xs backdrop-blur-xs transition-opacity duration-150",
                  isActive
                    ? "right-9 opacity-0 group-hover:opacity-100"
                    : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                )}
                title={t("viewDetails")}
                aria-label={t("viewDetails")}
              >
                <Eye className="size-3.5" />
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
                  "bg-background/90 text-muted-foreground hover:text-foreground absolute top-2.5 right-2.5 z-10 size-7 rounded-lg shadow-xs backdrop-blur-xs transition-opacity duration-150",
                  isActive
                    ? "right-9 opacity-0 group-hover:opacity-100"
                    : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                )}
                title={t("editFile")}
                aria-label={t("editFile")}
              >
                <Pencil className="size-3.5" />
              </Button>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
