"use client";

import { ExternalLink, FileText, Paperclip, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { AttachmentPicker } from "@/modules/system/components/attachment/attachment-picker";
import type { Attachment } from "@/modules/system/types/attachment.types";
import { Button } from "@/shares/components/ui/button";
import { toSafeHttpUrl } from "@/shares/lib/safe-url";

import { useAssetInvoicesField } from "./hooks/use-asset-invoices-field";

/**
 * Trường chọn danh sách tệp chứng từ / hóa đơn riêng tư cho Thiết bị hoặc Phiếu bảo hành.
 * Luôn ép `visibility="private"` (`lockVisibility`), chỉ xem qua URL API `/attachments/{id}/content`.
 *
 * @param props - Danh sách tệp hiện tại, callback thêm/gỡ, trạng thái khóa, thông báo lỗi.
 * @returns Khối danh sách tệp riêng tư kèm nút mở AttachmentPicker.
 */
export function AssetInvoicesField({
  files,
  onAdd,
  onRemove,
  disabled,
  multiple = true,
  buttonLabel,
  error,
}: {
  files: Attachment[];
  onAdd: (files: Attachment[]) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
  multiple?: boolean;
  buttonLabel?: string;
  error?: string;
}) {
  const tWs = useTranslations("workspace.common");
  const state = useAssetInvoicesField();

  return (
    <div className="space-y-3">
      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file) => {
            const safeUrl = toSafeHttpUrl(file.url);
            return (
              <li
                key={file.id}
                className="bg-muted/40 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  {safeUrl ? (
                    <Link
                      href={safeUrl as never}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary inline-flex min-w-0 items-center gap-1 truncate font-medium underline-offset-4 hover:underline"
                    >
                      <span className="truncate">{file.originalName || file.id}</span>
                      <ExternalLink className="size-3 shrink-0" aria-hidden />
                    </Link>
                  ) : (
                    <span className="truncate font-medium">{file.originalName || file.id}</span>
                  )}
                </div>
                {disabled ? null : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    aria-label={tWs("removeFile")}
                    onClick={() => onRemove(file.id)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">{tWs("noData")}</p>
      )}

      {disabled || !state.canReadAttachments ? null : (
        <Button type="button" variant="outline" size="sm" onClick={() => state.setOpen(true)}>
          <Paperclip />
          {buttonLabel ?? tWs("selectFile")}
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
          multiple={multiple}
          onSelect={(file) => onAdd([file])}
          onSelectMany={(selected) => onAdd(selected)}
          onClose={() => state.setOpen(false)}
        />
      ) : null}
    </div>
  );
}
