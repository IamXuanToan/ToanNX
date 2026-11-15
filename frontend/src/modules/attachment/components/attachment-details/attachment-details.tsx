"use client";

import { Copy, ExternalLink, FolderInput, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";

import { formatAttachmentSize } from "../../services/attachment.service";
import type { Attachment } from "../../types/attachment.types";
import { AttachmentPreview } from "../attachment-preview/attachment-preview";
import { useAttachmentDetails } from "./hooks/use-attachment-details";

/** @param props - File đang xem và quyền xóa. @returns Panel thông tin file, không truy vấn API riêng. */
export function AttachmentDetails({
  file,
  onDelete,
  onMove,
  disabled,
}: {
  file: Attachment;
  onDelete?: (file: Attachment) => void;
  onMove?: (file: Attachment) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("attachment");
  const format = useFormatter();
  const state = useAttachmentDetails(file.url);
  return (
    <div
      className="bg-card min-w-0 space-y-4 rounded-xl border p-4 sm:p-5"
      data-testid="attachment-details"
    >
      <h2 className="text-base font-semibold">{t("details")}</h2>
      <AttachmentPreview key={file.id} file={file} contain />
      <dl className="space-y-3 text-sm">
        {[
          [t("name"), file.originalName],
          [t("type"), file.contentType],
          [t("folder"), file.folderName || t("unfiled")],
          [t("size"), formatAttachmentSize(file.size)],
          [
            t("uploadedAt"),
            format.dateTime(new Date(file.createdAt), { dateStyle: "short", timeStyle: "short" }),
          ],
          [t("uploader"), file.uploaderName || "—"],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted-foreground text-xs">{label}</dt>
            <dd className="mt-1 break-all">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-2">
        <Button type="button" variant="outline" onClick={state.copy}>
          <Copy />
          {t("copyUrl")}
        </Button>
        <Button asChild variant="outline">
          <a href={file.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink />
            {t("openFile")}
          </a>
        </Button>
        {onMove ? (
          <Button type="button" variant="outline" disabled={disabled} onClick={() => onMove(file)}>
            <FolderInput />
            {t("moveFiles")}
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            type="button"
            variant="destructive"
            disabled={disabled}
            onClick={() => onDelete(file)}
          >
            <Trash2 />
            {t("deleteFile")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
