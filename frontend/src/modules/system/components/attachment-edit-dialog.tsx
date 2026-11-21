"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
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
import { useAttachmentEditDialog } from "./hooks/use-attachment-edit-dialog";

/** Form nội dung bên trong dialog, sử dụng key theo id để khởi tạo state sạch sẽ. */
function AttachmentEditForm({
  file,
  onClose,
  onSuccess,
}: {
  file: Attachment;
  onClose: () => void;
  onSuccess?: (updated: Attachment) => void;
}) {
  const t = useTranslations("system.attachment");
  const state = useAttachmentEditDialog(file, onClose, onSuccess);

  return (
    <form onSubmit={state.handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{t("editFileTitle")}</DialogTitle>
        <DialogDescription>{t("editFileDescription")}</DialogDescription>
      </DialogHeader>

      {/* Xem trước tệp thu nhỏ */}
      <div className="bg-muted/40 border-border/50 flex items-center gap-3 rounded-xl border p-3">
        <div className="bg-muted size-14 shrink-0 overflow-hidden rounded-lg border">
          <AttachmentPreview file={file} contain className="size-full" />
        </div>
        <div className="min-w-0 flex-1 text-xs">
          <p className="text-foreground truncate font-semibold" title={file.originalName}>
            {file.originalName}
          </p>
          <p className="text-muted-foreground mt-0.5">
            {file.contentType.split("/")[1]?.toUpperCase() || file.contentType} ·{" "}
            {formatAttachmentSize(file.size)}
          </p>
        </div>
      </div>

      {/* Ô nhập tên tệp */}
      <div className="space-y-1.5">
        <Label htmlFor="attachment-edit-name" className="text-xs font-medium">
          {t("fileName")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="attachment-edit-name"
          value={state.originalName}
          onChange={(event) => state.setOriginalName(event.target.value)}
          disabled={state.busy}
          maxLength={255}
          placeholder={t("fileName")}
          className="h-10 rounded-xl text-sm"
          aria-invalid={Boolean(state.nameError)}
        />
        {state.nameError ? <p className="text-destructive text-xs">{state.nameError}</p> : null}
      </div>

      {/* Ô nhập văn bản thay thế (alt text) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="attachment-edit-alt" className="text-xs font-medium">
            {t("altText")}
          </Label>
          <span className="text-muted-foreground text-[11px] tabular-nums">
            {state.altText.length}/255
          </span>
        </div>
        <Textarea
          id="attachment-edit-alt"
          value={state.altText}
          onChange={(event) => state.setAltText(event.target.value)}
          disabled={state.busy}
          maxLength={255}
          rows={3}
          placeholder={t("altTextPlaceholder")}
          className="resize-none rounded-xl text-xs leading-relaxed"
        />
        <p className="text-muted-foreground text-[11px] leading-tight">{t("altTextHint")}</p>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          disabled={state.busy}
          onClick={onClose}
          className="rounded-xl"
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={state.busy} className="rounded-xl">
          {state.busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {state.busy ? t("saving") : t("saveChanges")}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Dialog chỉnh sửa thông tin tệp (tên hiển thị và văn bản thay thế alt text).
 *
 * @param props - Tệp cần sửa, trạng thái mở và các callback hoàn tất / đóng.
 * @returns Dialog chỉnh sửa tên và alt text.
 */
export function AttachmentEditDialog({
  file,
  open,
  onClose,
  onSuccess,
}: {
  file: Attachment | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: (updated: Attachment) => void;
}) {
  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-xl">
        {open ? (
          <AttachmentEditForm key={file.id} file={file} onClose={onClose} onSuccess={onSuccess} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
