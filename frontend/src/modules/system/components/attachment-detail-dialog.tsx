"use client";

import { useTranslations } from "next-intl";

import { Dialog, DialogContent } from "@/shares/components/ui/dialog";

import type { Attachment } from "../types/attachment.types";
import { AttachmentDetailContent } from "./attachment-detail-content";

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
  isSelectable,
  selectLabel,
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
  /** Tệp chọn được (mặc định: là ảnh). */
  isSelectable?: (file: Attachment) => boolean;
  /** Nhãn nút chọn (mặc định "Dùng ảnh này"). */
  selectLabel?: string;
}) {
  const t = useTranslations("system.attachment");
  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="flex h-[88vh] max-h-[660px] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl">
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
            isSelectable={isSelectable ?? ((item) => item.contentType.startsWith("image/"))}
            selectLabel={selectLabel ?? t("useImage")}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
