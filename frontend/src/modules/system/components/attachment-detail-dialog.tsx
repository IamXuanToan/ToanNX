"use client";

import { Check, Copy, ExternalLink, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Card, CardContent } from "@/shares/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { Textarea } from "@/shares/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shares/components/ui/tooltip";

import { formatAttachmentSize } from "../services/attachment.service";
import type { Attachment } from "../types/attachment.types";
import { AttachmentPreview } from "./attachment-preview";
import { useAttachmentDetailDialog } from "./hooks/use-attachment-detail-dialog";

/**
 * Nội dung chi tiết tệp, được khởi tạo lại mỗi khi tệp thay đổi qua `key={file.id}`.
 */
function AttachmentDetailContent({
  file,
  onClose,
  onSelect,
  onDelete,
  onUpdated,
  canEdit,
  canDelete,
  disabled,
}: {
  file: Attachment;
  onClose: () => void;
  onSelect?: (file: Attachment) => void;
  onDelete?: (file: Attachment) => void;
  onUpdated?: (updated: Attachment) => void;
  canEdit: boolean;
  canDelete: boolean;
  disabled: boolean;
}) {
  const t = useTranslations("system.attachment");
  const format = useFormatter();
  const {
    currentFile,
    isEditing,
    editName,
    setEditName,
    editAlt,
    setEditAlt,
    nameError,
    setNameError,
    copiedUrl,
    copiedName,
    isSaving,
    handleCopyUrl,
    handleCopyName,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
  } = useAttachmentDetailDialog({ file, onUpdated });

  return (
    <>
      <DialogHeader className="shrink-0 border-b px-5 py-3.5 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-3 pr-6">
          <div className="min-w-0">
            <DialogTitle className="truncate text-base font-semibold sm:text-lg">
              {t("details")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-0.5 truncate text-xs">
              {currentFile.originalName}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Cột trái: Khung xem ảnh lớn tỉ lệ chuẩn */}
          <div className="lg:col-span-7">
            <div className="bg-muted/20 border-border/60 relative flex h-72 w-full items-center justify-center overflow-hidden rounded-2xl border p-2 sm:h-96 lg:h-[460px]">
              <AttachmentPreview
                key={currentFile.id}
                file={currentFile}
                contain
                className="size-full"
              />
              <Button
                asChild
                variant="secondary"
                size="icon"
                className="bg-background/80 hover:bg-background absolute top-3 right-3 size-8 rounded-lg shadow-xs backdrop-blur-xs transition-opacity"
                title={t("openFile")}
              >
                <a href={currentFile.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Cột phải: Thông tin hoặc Chế độ Sửa trực tiếp */}
          <div className="flex flex-col justify-between space-y-4 lg:col-span-5">
            {isEditing ? (
              /* CHẾ ĐỘ SỬA TRỰC TIẾP (INLINE EDIT - KHÔNG MỞ MODAL ĐÈ) */
              <form
                onSubmit={handleSaveEdit}
                className="animate-in fade-in-50 space-y-4 duration-150"
              >
                <div className="border-border/50 flex items-center justify-between border-b pb-2.5">
                  <h3 className="text-foreground text-sm font-semibold">{t("editFileTitle")}</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
                  >
                    <X className="mr-1 size-3" />
                    {t("cancel")}
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="inline-edit-name" className="text-xs font-medium">
                    {t("fileName")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="inline-edit-name"
                    value={editName}
                    onChange={(event) => {
                      setEditName(event.target.value);
                      if (nameError) setNameError("");
                    }}
                    disabled={isSaving}
                    maxLength={255}
                    placeholder={t("fileName")}
                    className="h-9 rounded-xl text-xs"
                    aria-invalid={Boolean(nameError)}
                  />
                  {nameError ? <p className="text-destructive text-xs">{nameError}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inline-edit-alt" className="text-xs font-medium">
                      {t("altText")}
                    </Label>
                    <span className="text-muted-foreground text-[10px] tabular-nums">
                      {editAlt.length}/255
                    </span>
                  </div>
                  <Textarea
                    id="inline-edit-alt"
                    value={editAlt}
                    onChange={(event) => setEditAlt(event.target.value)}
                    disabled={isSaving}
                    maxLength={255}
                    rows={3}
                    placeholder={t("altTextPlaceholder")}
                    className="resize-none rounded-xl text-xs leading-relaxed"
                  />
                  <p className="text-muted-foreground text-[10px] leading-tight">
                    {t("altTextHint")}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSaving}
                    onClick={handleCancelEdit}
                    className="h-9 rounded-xl px-3 text-xs"
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSaving}
                    className="h-9 rounded-xl px-4 text-xs font-medium shadow-xs"
                  >
                    {isSaving ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
                    {isSaving ? t("saving") : t("saveChanges")}
                  </Button>
                </div>
              </form>
            ) : (
              /* CHẾ ĐỘ XEM CHI TIẾT TIÊU CHUẨN */
              <div className="animate-in fade-in-50 space-y-4 duration-150">
                {/* Tên tệp gốc & Nút sửa/chép */}
                <div>
                  <div className="text-muted-foreground flex items-center justify-between pb-1 text-xs">
                    <span className="font-medium">{t("name")}</span>
                    <div className="flex items-center gap-1">
                      {canEdit ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleStartEdit}
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
                        onClick={handleCopyName}
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
                  <p
                    className="text-foreground line-clamp-3 text-xs leading-relaxed font-semibold break-all sm:text-sm"
                    title={currentFile.originalName}
                  >
                    {currentFile.originalName}
                  </p>
                </div>

                {/* Thẻ bảng thông số */}
                <Card className="bg-muted/30 border-border/50 text-xs shadow-none">
                  <CardContent className="space-y-2.5 p-3.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <span className="text-muted-foreground text-[11px]">{t("type")}</span>
                        <p className="text-foreground mt-0.5 font-semibold uppercase">
                          {currentFile.contentType.split("/")[1]?.toUpperCase() ||
                            currentFile.contentType}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[11px]">{t("size")}</span>
                        <p className="text-foreground mt-0.5 font-semibold tabular-nums">
                          {formatAttachmentSize(currentFile.size)}
                        </p>
                      </div>
                    </div>

                    <div className="border-border/40 grid grid-cols-2 gap-2.5 border-t pt-2.5">
                      <div>
                        <span className="text-muted-foreground text-[11px]">{t("folder")}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-foreground mt-0.5 cursor-default truncate font-medium">
                              {currentFile.folderName || t("unfiled")}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-xs text-xs font-normal break-all"
                          >
                            {currentFile.folderName || t("unfiled")}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[11px]">{t("uploader")}</span>
                        {currentFile.uploaderName ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-foreground mt-0.5 cursor-default truncate font-medium">
                                {currentFile.uploaderName}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="max-w-xs text-xs font-normal break-all"
                            >
                              {currentFile.uploaderName}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <p className="text-foreground mt-0.5 truncate font-medium">—</p>
                        )}
                      </div>
                    </div>

                    <div className="border-border/40 border-t pt-2.5">
                      <span className="text-muted-foreground text-[11px]">{t("altText")}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-foreground mt-0.5 line-clamp-2 cursor-default text-xs font-medium">
                            {currentFile.altText ? (
                              currentFile.altText
                            ) : (
                              <span className="text-muted-foreground font-normal italic">
                                {t("noAltText")}
                              </span>
                            )}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-xs text-xs font-normal break-all"
                        >
                          {currentFile.altText || t("noAltText")}
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="border-border/40 border-t pt-2.5">
                      <span className="text-muted-foreground text-[11px]">{t("uploadedAt")}</span>
                      <p className="text-foreground mt-0.5 font-medium tabular-nums">
                        {format.dateTime(new Date(currentFile.createdAt), {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Hàng nút hành động nhanh */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyUrl}
                    className="h-9 rounded-xl px-2.5 text-xs font-medium"
                  >
                    {copiedUrl ? (
                      <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    <span className="truncate">{copiedUrl ? t("copied") : t("copyUrl")}</span>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl px-2.5 text-xs font-medium"
                  >
                    <a href={currentFile.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3.5" />
                      <span className="truncate">{t("openFile")}</span>
                    </a>
                  </Button>

                  {canDelete && onDelete ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={disabled}
                      onClick={() => {
                        onClose();
                        onDelete(currentFile);
                      }}
                      className="col-span-2 h-9 rounded-xl px-2.5 text-xs font-medium"
                    >
                      <Trash2 className="size-3.5" />
                      <span className="truncate">{t("deleteFile")}</span>
                    </Button>
                  ) : null}
                </div>

                {/* Nút chọn ảnh ngay trong dialog (dành cho bộ chọn ảnh) */}
                {onSelect && currentFile.contentType.startsWith("image/") ? (
                  <Button
                    type="button"
                    variant="default"
                    size="default"
                    onClick={() => {
                      onSelect(currentFile);
                      onClose();
                    }}
                    className="mt-2 h-10 w-full gap-2 rounded-xl font-medium shadow-xs"
                  >
                    <Check className="size-4" />
                    <span>{t("useImage")}</span>
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Dialog xem chi tiết và chỉnh sửa tệp chuyên dụng (thay thế sidebar hẹp và modal lồng modal).
 *
 * @param props - Tệp cần xem, trạng thái mở, các callback chọn/sửa/xóa và quyền thao tác.
 * @returns Dialog chi tiết tệp rộng rãi, xem ảnh lớn rõ nét, hỗ trợ inline edit tên & alt text.
 */
export function AttachmentDetailDialog({
  file,
  open,
  onClose,
  onSelect,
  onDelete,
  onUpdated,
  canEdit = true,
  canDelete = false,
  disabled = false,
}: {
  file: Attachment | null;
  open: boolean;
  onClose: () => void;
  onSelect?: (file: Attachment) => void;
  onDelete?: (file: Attachment) => void;
  onUpdated?: (updated: Attachment) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  disabled?: boolean;
}) {
  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-2rem)] max-w-4xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-h-[88dvh]">
        {open ? (
          <AttachmentDetailContent
            key={file.id}
            file={file}
            onClose={onClose}
            onSelect={onSelect}
            onDelete={onDelete}
            onUpdated={onUpdated}
            canEdit={canEdit}
            canDelete={canDelete}
            disabled={disabled}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
