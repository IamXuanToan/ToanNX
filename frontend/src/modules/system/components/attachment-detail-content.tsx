"use client";

import {
  Calendar,
  Check,
  Copy,
  Crop,
  ExternalLink,
  FileText,
  Folder,
  FolderInput,
  Globe,
  Loader2,
  Lock,
  Pencil,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { ConfirmDialog } from "@/shares/components/common/confirm-dialog";
import { Button } from "@/shares/components/ui/button";
import {
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
import { AttachmentImageEditor } from "./attachment-image-editor";
import { AttachmentPreview } from "./attachment-preview";
import { useAttachmentDetailDialog } from "./hooks/use-attachment-detail-dialog";

/**
 * Nội dung chi tiết tệp, được khởi tạo lại mỗi khi tệp thay đổi qua `key={file.id}`.
 *
 * @param props - Tệp, callback chọn/xóa/chuyển thư mục/cập nhật, quyền sửa/xóa và điều kiện chọn được tệp.
 * @returns Xem trước, thông tin, sửa inline, chỉnh sửa ảnh crop/watermark và các nút thao tác.
 */
export function AttachmentDetailContent({
  file,
  onClose,
  onSelect,
  onDelete,
  onMove,
  onUpdated,
  canEdit,
  canDelete,
  disabled,
  isSelectable,
  selectLabel,
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
  isSelectable: (file: Attachment) => boolean;
  selectLabel: string;
}) {
  const t = useTranslations("system.attachment");
  const format = useFormatter();
  const {
    currentFile,
    setCurrentFile,
    shareUrl,
    isEditing,
    isImageEditing,
    setIsImageEditing,
    editName,
    setEditName,
    editAlt,
    setEditAlt,
    nameError,
    setNameError,
    copiedUrl,
    isSaving,
    handleCopyUrl,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    pendingVisibility,
    setPendingVisibility,
    confirmVisibility,
    isChangingVisibility,
  } = useAttachmentDetailDialog({ file, onUpdated });

  const isPrivate = currentFile.visibility === "private";
  const isImage = currentFile.contentType.startsWith("image/");

  // Nếu đang mở công cụ chỉnh sửa hình ảnh (Crop / Watermark)
  if (isImageEditing) {
    return (
      <AttachmentImageEditor
        file={currentFile}
        onSaved={(newAttachment) => {
          setCurrentFile(newAttachment);
          onUpdated?.(newAttachment);
          setIsImageEditing(false);
        }}
        onCancel={() => setIsImageEditing(false)}
      />
    );
  }

  return (
    <>
      {/* Header gọn gàng của Dialog */}
      <DialogHeader className="border-border/60 shrink-0 border-b px-5 py-3 sm:px-6">
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

      {/* Thân chính: Chiếm trọn không gian, bố cục 2 cột không scroll */}
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-12">
        {/* Cột trái: Khung xem trước hình ảnh / video player */}
        <div className="bg-muted/25 dark:bg-muted/10 relative flex size-full min-h-0 flex-col items-center justify-center overflow-hidden p-3 sm:p-4 md:col-span-7">
          <div className="border-border/60 bg-muted/30 dark:bg-muted/15 relative flex size-full min-h-0 items-center justify-center overflow-hidden rounded-xl border">
            <AttachmentPreview
              key={currentFile.id}
              file={currentFile}
              contain
              className="size-full"
            />

            {/* Nút chỉnh sửa ảnh nhanh nổi ở góc trên phải preview */}
            {canEdit && isImage && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsImageEditing(true)}
                className="bg-background/90 hover:bg-background border-border/80 absolute top-3 right-3 z-20 h-8 gap-1.5 rounded-lg border px-2.5 text-xs font-medium shadow-md backdrop-blur-sm"
                title={t("editImage")}
              >
                <Crop className="text-primary size-3.5" />
                <span>{t("editImage")}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Cột phải: Panel thông tin chi tiết hoặc Form chỉnh sửa inline */}
        <div className="border-border/60 bg-card flex size-full min-h-0 flex-col justify-between overflow-hidden border-t p-4 sm:p-5 md:col-span-5 md:border-t-0 md:border-l">
          {isEditing ? (
            /* CHẾ ĐỘ SỬA INLINE TÊN TỆP & ALT TEXT */
            <form
              onSubmit={handleSaveEdit}
              className="animate-in fade-in-50 flex h-full flex-col justify-between duration-150"
            >
              <div className="space-y-3.5">
                <div className="border-border/50 flex items-center justify-between border-b pb-2">
                  <h3 className="text-foreground text-xs font-semibold tracking-wider uppercase">
                    {t("editFileTitle")}
                  </h3>
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

                <div className="space-y-1">
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

                <div className="space-y-1">
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
              </div>

              <div className="border-border/50 flex items-center justify-end gap-2 border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={handleCancelEdit}
                  className="h-8 rounded-xl px-3 text-xs font-medium"
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="h-8 rounded-xl px-3.5 text-xs font-medium shadow-xs"
                >
                  {isSaving ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
                  {isSaving ? t("saving") : t("saveChanges")}
                </Button>
              </div>
            </form>
          ) : (
            /* CHẾ ĐỘ XEM THÔNG TIN TIÊU CHUẨN */
            <div className="animate-in fade-in-50 flex h-full flex-col justify-between duration-150">
              <div className="space-y-3">
                {/* Tiêu đề tệp và các badge tóm tắt */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                        {t("name")}
                      </span>
                      <p
                        className="text-foreground mt-0.5 truncate text-sm leading-tight font-semibold sm:text-base"
                        title={currentFile.originalName}
                      >
                        {currentFile.originalName}
                      </p>
                    </div>
                    {canEdit && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleStartEdit}
                        className="text-muted-foreground hover:text-foreground size-8 shrink-0 rounded-lg"
                        title={t("editFile")}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase">
                      {currentFile.contentType.split("/")[1]?.toUpperCase() ||
                        currentFile.contentType}
                    </span>
                    <span className="bg-muted text-foreground/80 rounded-md px-2 py-0.5 text-[11px] font-medium tabular-nums">
                      {formatAttachmentSize(currentFile.size)}
                    </span>
                    <span className="bg-muted text-foreground/80 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium">
                      {isPrivate ? (
                        <Lock className="size-3 text-amber-500" />
                      ) : (
                        <Globe className="size-3 text-emerald-500" />
                      )}
                      {isPrivate ? t("visibilityPrivate") : t("visibilityPublic")}
                    </span>
                  </div>
                </div>

                {/* Thanh công cụ hành động gọn gàng */}
                <div className="border-border/50 flex flex-wrap items-center gap-1.5 border-y py-2">
                  {canEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleStartEdit}
                      className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
                      title={t("editFile")}
                    >
                      <Pencil className="size-3.5" />
                      <span>{t("edit")}</span>
                    </Button>
                  )}

                  {canEdit && isImage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsImageEditing(true)}
                      className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
                      title={t("editImage")}
                    >
                      <Crop className="text-primary size-3.5" />
                      <span>{t("crop")}</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyUrl}
                    className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
                    title={t("copyUrl")}
                  >
                    {copiedUrl ? (
                      <Check className="size-3.5 text-emerald-500" />
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
                    <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3.5" />
                      <span>{t("openFile")}</span>
                    </a>
                  </Button>

                  {canEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={disabled || isChangingVisibility}
                      onClick={() => setPendingVisibility(isPrivate ? "public" : "private")}
                      className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
                    >
                      {isPrivate ? <Globe className="size-3.5" /> : <Lock className="size-3.5" />}
                      <span>{isPrivate ? t("makePublic") : t("makePrivate")}</span>
                    </Button>
                  )}

                  {onMove && (
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
                  )}
                </div>

                {/* Thẻ thông số Metadata 2 cột gọn gàng */}
                <div className="bg-muted/20 border-border/50 space-y-2 rounded-xl border p-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold uppercase">
                        <Folder className="size-3" />
                        {t("folder")}
                      </span>
                      <p className="text-foreground mt-0.5 truncate font-medium">
                        {currentFile.folderName || t("unfiled")}
                      </p>
                    </div>

                    <div>
                      <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold uppercase">
                        <User className="size-3" />
                        {t("uploader")}
                      </span>
                      <p className="text-foreground mt-0.5 truncate font-medium">
                        {currentFile.uploaderName || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="border-border/40 border-t pt-2">
                    <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold uppercase">
                      <Calendar className="size-3" />
                      {t("uploadedAt")}
                    </span>
                    <p className="text-foreground mt-0.5 font-medium tabular-nums">
                      {format.dateTime(new Date(currentFile.createdAt), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>

                  <div className="border-border/40 border-t pt-2">
                    <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold uppercase">
                      <FileText className="size-3" />
                      {t("altText")}
                    </span>
                    <p className="text-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer cố định ở đáy modal */}
      <DialogFooter className="border-border/60 bg-muted/20 m-0 flex h-14 shrink-0 flex-row items-center justify-between gap-2.5 rounded-b-2xl border-t px-5 py-2.5 sm:px-6">
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
              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8.5 gap-1.5 rounded-xl px-3 text-xs font-medium"
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
            className="h-8.5 rounded-xl px-4 text-xs font-medium"
          >
            <span className="whitespace-nowrap">{t("close")}</span>
          </Button>

          {onSelect && isSelectable(currentFile) ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => {
                onSelect(currentFile);
                onClose();
              }}
              className="h-8.5 gap-1.5 rounded-xl px-4 text-xs font-medium shadow-xs"
            >
              <Check className="size-3.5" />
              <span className="whitespace-nowrap">{selectLabel}</span>
            </Button>
          ) : null}
        </div>
      </DialogFooter>

      <ConfirmDialog
        open={Boolean(pendingVisibility)}
        onOpenChange={(open) => !open && setPendingVisibility(null)}
        title={pendingVisibility === "private" ? t("makePrivateTitle") : t("makePublicTitle")}
        description={
          pendingVisibility === "private" ? t("makePrivateDescription") : t("makePublicDescription")
        }
        confirmLabel={pendingVisibility === "private" ? t("makePrivate") : t("makePublic")}
        onConfirm={confirmVisibility}
        isPending={isChangingVisibility}
      />
    </>
  );
}
