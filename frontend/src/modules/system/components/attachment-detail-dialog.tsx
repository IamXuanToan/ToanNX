"use client";

import {
  Calendar,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Folder,
  FolderInput,
  Loader2,
  Pencil,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Card, CardContent } from "@/shares/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { Textarea } from "@/shares/components/ui/textarea";

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
  onMove,
  onUpdated,
  canEdit,
  canDelete,
  disabled,
}: {
  file: Attachment;
  onClose: () => void;
  onSelect?: (file: Attachment) => void;
  onDelete?: (file: Attachment) => void;
  onMove?: (file: Attachment) => void;
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
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
          {/* Cột trái: Khung xem ảnh lớn tỉ lệ chuẩn, sạch sẽ không bị che khuất */}
          <div>
            <div className="bg-muted/30 dark:bg-muted/15 border-border/70 relative flex h-72 w-full items-center justify-center overflow-hidden rounded-2xl border p-2 sm:h-96 md:h-[420px] lg:h-[460px]">
              <AttachmentPreview
                key={currentFile.id}
                file={currentFile}
                contain
                className="size-full"
              />
            </div>
          </div>

          {/* Cột phải: Thông tin hoặc Chế độ Sửa trực tiếp */}
          <div className="flex flex-col justify-between space-y-4">
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
                    className="h-10 rounded-xl text-sm"
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
                    className="resize-none rounded-xl text-sm leading-relaxed"
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
                    className="h-10 rounded-xl px-4 text-xs font-medium"
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSaving}
                    className="h-10 rounded-xl px-4 text-xs font-medium shadow-xs"
                  >
                    {isSaving ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
                    {isSaving ? t("saving") : t("saveChanges")}
                  </Button>
                </div>
              </form>
            ) : (
              /* CHẾ ĐỘ XEM CHI TIẾT TIÊU CHUẨN */
              <div className="animate-in fade-in-50 space-y-4 duration-150">
                {/* Khu vực 1: Tên tệp & Thanh công cụ thao tác nhanh */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                      {t("name")}
                    </span>
                    <div className="bg-muted/20 border-border/50 rounded-xl border p-3">
                      <p
                        className="text-foreground text-sm font-semibold leading-relaxed break-all select-all sm:text-base"
                        title={currentFile.originalName}
                      >
                        {currentFile.originalName}
                      </p>
                    </div>
                  </div>

                  {/* Thanh công cụ thao tác tệp tập trung: Sửa, Sao chép link, Mở tab mới, Chuyển thư mục */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {canEdit ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleStartEdit}
                        disabled={disabled}
                        className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
                        title={t("editFile")}
                      >
                        <Pencil className="size-3.5" />
                        <span>{t("edit")}</span>
                      </Button>
                    ) : null}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyUrl}
                      className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
                      title={t("copyUrl")}
                    >
                      {copiedUrl ? (
                        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                      <span>{copiedUrl ? t("copied") : t("copyUrl")}</span>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
                      title={t("openFile")}
                    >
                      <a href={currentFile.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-3.5" />
                        <span>{t("openFile")}</span>
                      </a>
                    </Button>

                    {onMove ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onClose();
                          onMove(currentFile);
                        }}
                        className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
                        title={t("moveFiles")}
                      >
                        <FolderInput className="size-3.5" />
                        <span>{t("moveFiles")}</span>
                      </Button>
                    ) : null}
                  </div>
                </div>

                {/* Khu vực 2: Thẻ bảng thông số Key-Value */}
                <Card className="bg-muted/20 border-border/50 text-xs shadow-none">
                  <CardContent className="space-y-3.5 p-4">
                    {/* Định dạng • Dung lượng gộp thành tag gọn gàng */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-primary/10 text-primary inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold uppercase">
                        {currentFile.contentType.split("/")[1]?.toUpperCase() ||
                          currentFile.contentType}
                      </span>
                      <span className="text-muted-foreground text-xs font-semibold">•</span>
                      <span className="bg-muted text-foreground inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium tabular-nums">
                        {formatAttachmentSize(currentFile.size)}
                      </span>
                    </div>

                    {/* Thư mục */}
                    <div className="border-border/40 flex items-start gap-2.5 border-t pt-3">
                      <Folder className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-muted-foreground block text-[11px]">
                          {t("folder")}
                        </span>
                        <p className="text-foreground mt-0.5 text-xs font-medium break-words">
                          {currentFile.folderName || t("unfiled")}
                        </p>
                      </div>
                    </div>

                    {/* Người tải lên */}
                    <div className="border-border/40 flex items-start gap-2.5 border-t pt-3">
                      <User className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-muted-foreground block text-[11px]">
                          {t("uploader")}
                        </span>
                        <p className="text-foreground mt-0.5 text-xs font-medium break-words">
                          {currentFile.uploaderName || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Văn bản thay thế (alt text) */}
                    <div className="border-border/40 flex items-start gap-2.5 border-t pt-3">
                      <FileText className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-muted-foreground block text-[11px]">
                          {t("altText")}
                        </span>
                        <p className="text-foreground mt-0.5 text-xs leading-relaxed font-medium break-words">
                          {currentFile.altText ? (
                            currentFile.altText
                          ) : (
                            <span className="text-muted-foreground font-normal italic">
                              {t("noAltText")}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Thời gian tải lên */}
                    <div className="border-border/40 flex items-start gap-2.5 border-t pt-3">
                      <Calendar className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-muted-foreground block text-[11px]">
                          {t("uploadedAt")}
                        </span>
                        <p className="text-foreground mt-0.5 text-xs font-medium tabular-nums">
                          {format.dateTime(new Date(currentFile.createdAt), {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer cố định ở đáy modal: Phân tách rõ ràng giữa Xóa và Đóng/Chọn ảnh */}
      <DialogFooter className="border-border/60 bg-muted/20 m-0 flex shrink-0 flex-row items-center justify-between gap-2.5 rounded-b-2xl border-t px-5 py-3 sm:px-6 sm:py-3.5">
        <div>
          {canDelete && onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => {
                onClose();
                onDelete(currentFile);
              }}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 gap-1.5 rounded-xl px-3.5 text-xs font-medium"
            >
              <Trash2 className="size-3.5 shrink-0" />
              <span className="whitespace-nowrap">{t("deleteFile")}</span>
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 rounded-xl px-4 text-xs font-medium"
          >
            <span className="whitespace-nowrap">{t("close")}</span>
          </Button>

          {onSelect && currentFile.contentType.startsWith("image/") ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => {
                onSelect(currentFile);
                onClose();
              }}
              className="h-9 gap-1.5 rounded-xl px-4 text-xs font-medium shadow-xs"
            >
              <Check className="size-3.5" />
              <span className="whitespace-nowrap">{t("useImage")}</span>
            </Button>
          ) : null}
        </div>
      </DialogFooter>
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
  onMove,
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
  onMove?: (file: Attachment) => void;
  onUpdated?: (updated: Attachment) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  disabled?: boolean;
}) {
  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-h-[88dvh] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl">
        {open ? (
          <AttachmentDetailContent
            key={file.id}
            file={file}
            onClose={onClose}
            onSelect={onSelect}
            onDelete={onDelete}
            onMove={onMove}
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
