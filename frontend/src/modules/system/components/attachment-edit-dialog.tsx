"use client";

import { Dialog, DialogContent } from "@/shares/components/ui/dialog";

import type { Attachment } from "../types/attachment.types";
import { AttachmentEditForm } from "./attachment-edit-form";

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
