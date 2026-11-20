"use client";

import { Check, Copy, ExternalLink, FolderInput, Pencil, Trash2, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Card } from "@/shares/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shares/components/ui/tooltip";

import { formatAttachmentSize } from "../services/attachment.service";
import type { Attachment } from "../types/attachment.types";
import { AttachmentEditDialog } from "./attachment-edit-dialog";
import { AttachmentPreview } from "./attachment-preview";
import { useAttachmentDetails } from "./hooks/use-attachment-details";

/** @param props - File đang xem, callback đóng và quyền xóa/chuyển/sửa. @returns Panel thông tin file, không truy vấn API riêng. */
export function AttachmentDetails({
  file,
  onDelete,
  onMove,
  onClose,
  onUpdated,
  disabled,
  canEdit = true,
}: {
  file: Attachment;
  onDelete?: (file: Attachment) => void;
  onMove?: (file: Attachment) => void;
  onClose?: () => void;
  onUpdated?: (file: Attachment) => void;
  disabled?: boolean;
  canEdit?: boolean;
}) {
  const t = useTranslations("attachment");
  const format = useFormatter();
  const state = useAttachmentDetails(file);
  const { copyName, copiedName, editOpen, setEditOpen } = state;

  return (
    <Card
      className="bg-card min-w-0 space-y-4 rounded-xl border p-4 shadow-2xs sm:p-5"
      data-testid="attachment-details"
    >
      <div className="border-border/50 flex items-center justify-between gap-2 border-b pb-3">
        <h2 className="text-foreground text-base font-semibold">{t("details")}</h2>
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground size-8 rounded-lg"
            aria-label={t("close")}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="bg-muted/20 border-border/50 relative flex h-56 w-full items-center justify-center overflow-hidden rounded-xl border p-2 sm:h-64">
        <AttachmentPreview key={file.id} file={file} contain className="size-full" />
      </div>

      <div className="bg-muted/30 space-y-3 rounded-xl p-3.5 text-xs">
        <div>
          <div className="text-muted-foreground flex items-center justify-between pb-1">
            <span className="font-medium">{t("name")}</span>
            <div className="flex items-center gap-1">
              {canEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                  disabled={disabled}
                  className="text-muted-foreground hover:text-foreground h-6 gap-1 px-1.5 text-[11px]"
                  title={t("editFile")}
                >
                  <Pencil className="size-3" />
                  <span>{t("edit")}</span>
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyName}
                className="text-muted-foreground hover:text-foreground h-6 gap-1 px-1.5 text-[11px]"
                title={t("copyName")}
              >
                {copiedName ? (
                  <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="size-3" />
                )}
                <span>{copiedName ? t("copiedName") : t("copyName")}</span>
              </Button>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <p
                className="text-foreground line-clamp-3 cursor-default leading-relaxed font-medium break-all"
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

        <div className="border-border/50 grid grid-cols-2 gap-2.5 border-t pt-2.5">
          <div>
            <span className="text-muted-foreground">{t("type")}</span>
            <p className="text-foreground mt-0.5 font-semibold uppercase">
              {file.contentType.split("/")[1]?.toUpperCase() || file.contentType}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">{t("size")}</span>
            <p className="text-foreground mt-0.5 font-semibold tabular-nums">
              {formatAttachmentSize(file.size)}
            </p>
          </div>
          <div className="border-border/40 col-span-2 border-t pt-2.5">
            <span className="text-muted-foreground">{t("folder")}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-foreground mt-0.5 cursor-default truncate font-medium">
                  {file.folderName || t("unfiled")}
                </p>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs font-normal break-all">
                {file.folderName || t("unfiled")}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="border-border/40 col-span-2 border-t pt-2.5">
            <span className="text-muted-foreground">{t("uploader")}</span>
            {file.uploaderName ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-foreground mt-0.5 cursor-default truncate font-medium">
                    {file.uploaderName}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs font-normal break-all">
                  {file.uploaderName}
                </TooltipContent>
              </Tooltip>
            ) : (
              <p className="text-foreground mt-0.5 truncate font-medium">—</p>
            )}
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">{t("altText")}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-foreground mt-0.5 cursor-default truncate font-medium">
                  {file.altText ? (
                    file.altText
                  ) : (
                    <span className="text-muted-foreground font-normal italic">
                      {t("noAltText")}
                    </span>
                  )}
                </p>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs font-normal break-all">
                {file.altText || t("noAltText")}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">{t("uploadedAt")}</span>
            <p className="text-foreground mt-0.5 font-medium tabular-nums">
              {format.dateTime(new Date(file.createdAt), {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        {canEdit ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl px-2.5 text-xs font-medium"
            disabled={disabled}
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="size-3.5" />
            <span className="truncate">{t("editFile")}</span>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl px-2.5 text-xs font-medium"
          onClick={state.copy}
        >
          <Copy className="size-3.5" />
          <span className="truncate">{t("copyUrl")}</span>
        </Button>
        <Button asChild variant="outline" className="h-10 rounded-xl px-2.5 text-xs font-medium">
          <a href={file.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" />
            <span className="truncate">{t("openFile")}</span>
          </a>
        </Button>
        {onMove ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl px-2.5 text-xs font-medium"
            disabled={disabled}
            onClick={() => onMove(file)}
          >
            <FolderInput className="size-3.5" />
            <span className="truncate">{t("moveFiles")}</span>
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            type="button"
            variant="destructive"
            className="h-10 rounded-xl px-2.5 text-xs font-medium"
            disabled={disabled}
            onClick={() => onDelete(file)}
          >
            <Trash2 className="size-3.5" />
            <span className="truncate">{t("deleteFile")}</span>
          </Button>
        ) : null}
      </div>

      <AttachmentEditDialog
        file={file}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={onUpdated}
      />
    </Card>
  );
}
