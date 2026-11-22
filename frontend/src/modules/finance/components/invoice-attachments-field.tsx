"use client";

import { FileText, Paperclip, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { AttachmentPicker } from "@/modules/system/components/attachment-picker";
import type { Attachment } from "@/modules/system/types/attachment.types";
import { Button } from "@/shares/components/ui/button";

import type { InvoiceAttachment } from "../types/invoice-attachment.types";
import { useInvoiceAttachmentsField } from "./hooks/use-invoice-attachments-field";

/**
 * File chứng từ: chọn nhiều từ Thư viện ở chế độ riêng tư (khóa), mở bằng URL có kiểm quyền.
 *
 * @param props - File đã chọn, thêm/bỏ, khóa sửa, lỗi.
 * @returns Danh sách file + nút chọn.
 */
export function InvoiceAttachmentsField({
  files,
  onAdd,
  onRemove,
  disabled,
  error,
}: {
  files: InvoiceAttachment[];
  onAdd: (files: InvoiceAttachment[]) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const t = useTranslations("finance.invoices");
  const state = useInvoiceAttachmentsField();
  const toFile = (file: Attachment): InvoiceAttachment => ({
    id: file.id,
    url: file.url,
    visibility: file.visibility,
    originalName: file.originalName,
    contentType: file.contentType,
    size: file.size,
  });
  return (
    <div className="space-y-2">
      <ul className="space-y-1">
        {files.map((file) => (
          <li key={file.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <FileText className="text-muted-foreground size-4 shrink-0" aria-hidden />
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 truncate underline-offset-4 hover:underline"
            >
              {file.originalName || file.id}
            </a>
            {disabled ? null : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("removeFile")}
                onClick={() => onRemove(file.id)}
              >
                <X />
              </Button>
            )}
          </li>
        ))}
      </ul>
      {disabled ? null : (
        <Button type="button" variant="outline" onClick={() => state.setOpen(true)}>
          <Paperclip />
          {t("addFiles")}
        </Button>
      )}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {state.open ? (
        <AttachmentPicker
          canUpload={state.canUpload}
          accept={["DOCUMENT", "IMAGE"]}
          visibility="private"
          lockVisibility
          visibilityFilter="private"
          multiple
          onSelect={(file) => onAdd([toFile(file)])}
          onSelectMany={(selected) => onAdd(selected.map(toFile))}
          onClose={() => state.setOpen(false)}
        />
      ) : null}
    </div>
  );
}
