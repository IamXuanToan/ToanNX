"use client";

import { CloudUpload, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Card } from "@/shares/components/ui/card";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";

import type { Attachment, AttachmentVisibility } from "../../types/attachment.types";
import type { FolderCapabilities } from "../../types/attachment-folder.types";
import { type MediaKind, UNFILED_FOLDER, acceptAttributeFor } from "../../constants/media-types";
import { folderPath } from "../../utils/folder-path";
import { SelectField } from "@/shares/components/common/select-field";
import { ErrorState } from "@/shares/components/errors/error-state";
import { AttachmentFolderManager } from "../attachment-folder/attachment-folder-manager";
import { AttachmentVisibilityToggle } from "./attachment-visibility-toggle";
import { useAttachmentUpload } from "./hooks/use-attachment-upload";

/**
 * @param props - Loại file nhận (`accept`; `imageOnly` là bí danh của `accept={["IMAGE"]}`), chế độ xem của file
 *   mới (`visibility`, `lockVisibility` để nơi dùng bắt buộc một chế độ), callback sau upload.
 * @returns Khu kéo thả và kết quả từng file, không nuốt lỗi.
 */
export function AttachmentUpload({
  imageOnly = false,
  accept,
  visibility = "public",
  lockVisibility = false,
  multiple = true,
  onUploaded,
  onBusyChange,
  folders,
}: {
  imageOnly?: boolean;
  accept?: readonly MediaKind[];
  visibility?: AttachmentVisibility;
  lockVisibility?: boolean;
  multiple?: boolean;
  onUploaded?: (file: Attachment) => void;
  onBusyChange?: (busy: boolean) => void;
  folders?: FolderCapabilities;
}) {
  const t = useTranslations("system.attachment");
  const kinds = accept ?? (imageOnly ? (["IMAGE"] as const) : undefined);
  const {
    registerInput,
    openFileChooser,
    busy,
    jobs,
    upload,
    folderId,
    setFolderId,
    folderQuery,
    uploadVisibility,
    setUploadVisibility,
  } = useAttachmentUpload({
    accept: kinds,
    visibility,
    lockVisibility,
    multiple,
    onUploaded,
    onBusyChange,
    canReadFolders: folders?.canRead,
  });

  return (
    <div className="space-y-4">
      {folders?.canRead ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Label className="text-sm font-medium" htmlFor="attachment-upload-folder">
              {t("destinationFolder")}
            </Label>
            <SelectField
              id="attachment-upload-folder"
              aria-label={t("destinationFolder")}
              searchable
              value={folderId}
              onValueChange={setFolderId}
              disabled={busy || folderQuery.isPending || folderQuery.isError}
              options={[
                { value: UNFILED_FOLDER, label: t("unfiled") },
                ...(folderQuery.data ?? []).map((folder) => ({
                  value: folder.id,
                  label: folderPath(folder, folderQuery.data ?? []),
                })),
              ]}
            />
          </div>
          <AttachmentFolderManager capabilities={folders} disabled={busy} />
          {folderQuery.isError ? <ErrorState onRetry={() => folderQuery.refetch()} /> : null}
        </div>
      ) : null}
      <AttachmentVisibilityToggle
        value={uploadVisibility}
        onChange={setUploadVisibility}
        locked={lockVisibility}
        disabled={busy}
      />
      <Card
        className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center shadow-none"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void upload(Array.from(event.dataTransfer.files));
        }}
      >
        <CloudUpload className="text-muted-foreground size-8" aria-hidden />
        <p className="font-semibold">{t("dropTitle")}</p>
        <p className="text-muted-foreground text-sm">{t("dropHint")}</p>
        <Input
          ref={registerInput}
          type="file"
          multiple={multiple}
          accept={kinds ? acceptAttributeFor(kinds) : undefined}
          disabled={busy}
          className="sr-only"
          aria-label={t("chooseFiles")}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            void upload(files);
          }}
        />
        <Button type="button" variant="outline" disabled={busy} onClick={openFileChooser}>
          {busy ? <Loader2 className="animate-spin" /> : null}
          {t("chooseFiles")}
        </Button>
        <p className="text-muted-foreground text-xs">{t("uploadHint")}</p>
      </Card>
      {jobs.length > 0 ? (
        <div className="space-y-2" role="region" aria-live="polite">
          {jobs.map((job) => (
            <Card key={job.id} className="rounded-xl p-3 text-sm shadow-2xs">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 font-medium break-all">{job.name}</span>
                <Badge
                  variant={
                    job.status === "uploaded"
                      ? "default"
                      : job.status === "failed"
                        ? "destructive"
                        : "secondary"
                  }
                  className="shrink-0 text-xs font-normal"
                >
                  {t(job.status)}
                </Badge>
              </div>
              {job.error ? (
                <p role="alert" className="text-destructive mt-1.5 text-xs font-medium">
                  {job.error}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
