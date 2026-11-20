"use client";

import { cn } from "cn";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { Checkbox } from "@/shares/components/ui/checkbox";

import { formatAttachmentSize } from "../../services/attachment.service";
import type { Attachment } from "../../types/attachment.types";
import { AttachmentPreview } from "../attachment-preview/attachment-preview";

/** @param props - File, mục đang xem và callback chọn. @returns Lưới media dùng chung cho thư viện và bộ chọn ảnh. */
export function AttachmentGrid({
  files,
  activeId,
  selectedIds,
  onInspect,
  onToggle,
  onConfirm,
  disabled,
  className,
}: {
  files: Attachment[];
  activeId?: string;
  selectedIds?: readonly string[];
  onInspect: (file: Attachment) => void;
  onToggle?: (id: string, selected: boolean) => void;
  onConfirm?: (file: Attachment) => void;
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations("attachment");
  return (
    <div
      className={cn(
        "grid grid-cols-[repeat(auto-fill,minmax(min(100%,9.5rem),1fr))] gap-3 sm:gap-3.5",
        className,
      )}
      data-testid="attachment-grid"
    >
      {files.map((file) => (
        <div
          key={file.id}
          className={cn(
            "bg-card group relative min-w-0 overflow-hidden rounded-xl border transition-all duration-150",
            activeId === file.id
              ? "border-primary ring-primary/25 shadow-xs ring-2"
              : "hover:border-primary/40 hover:shadow-xs",
          )}
        >
          <button
            type="button"
            disabled={disabled}
            aria-label={t("inspect", { name: file.originalName })}
            aria-pressed={activeId === file.id}
            onClick={() => onInspect(file)}
            onDoubleClick={() => onConfirm?.(file)}
            className="hover:bg-surface-hover block w-full min-w-0 text-left focus-visible:outline-hidden disabled:opacity-60"
          >
            <AttachmentPreview key={file.id} file={file} />
            <div className="space-y-1.5 p-2.5 sm:p-3">
              <p
                className="line-clamp-2 min-h-9 text-xs leading-snug font-medium break-all sm:text-sm"
                title={file.originalName}
              >
                {file.originalName}
              </p>
              <div className="text-muted-foreground flex justify-between gap-1 text-[11px] sm:text-xs">
                <span>{file.contentType.split("/")[1]?.toUpperCase()}</span>
                <span className="shrink-0 tabular-nums">{formatAttachmentSize(file.size)}</span>
              </div>
            </div>
          </button>
          {onToggle ? (
            <label className="bg-card absolute top-2 left-2 flex size-10 cursor-pointer items-center justify-center rounded-xl border">
              <Checkbox
                checked={selectedIds?.includes(file.id) ?? false}
                onCheckedChange={(checked) => onToggle(file.id, checked === true)}
                disabled={disabled}
                aria-label={t("select", { name: file.originalName })}
              />
            </label>
          ) : activeId === file.id ? (
            <span className="bg-primary text-primary-foreground animate-in zoom-in-75 pointer-events-none absolute top-2 right-2 flex size-6 items-center justify-center rounded-full shadow-xs duration-150">
              <Check className="size-3.5 stroke-[2.5]" />
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
