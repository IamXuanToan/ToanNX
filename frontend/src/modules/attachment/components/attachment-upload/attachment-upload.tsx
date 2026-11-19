"use client";

import { useRef } from "react";
import { CloudUpload, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";

import type { Attachment } from "../../types/attachment.types";
import type { FolderCapabilities } from "../../types/attachment-folder.types";
import { UNFILED_FOLDER } from "../../constants/media-types";
import { folderPath } from "../../utils/folder-path";
import { SelectField } from "@/shares/components/common/select-field/select-field";
import { ErrorState } from "@/shares/components/errors/error-state";
import { AttachmentFolderManager } from "../attachment-folder-manager/attachment-folder-manager";
import { useAttachmentUpload } from "./hooks/use-attachment-upload";

/** @param props - Chỉ ảnh hoặc mọi file, callback sau upload. @returns Khu kéo thả và kết quả từng file, không nuốt lỗi. */
export function AttachmentUpload({
  imageOnly = false,
  multiple = true,
  onUploaded,
  onBusyChange,
  folders,
}: {
  imageOnly?: boolean;
  multiple?: boolean;
  onUploaded?: (file: Attachment) => void;
  onBusyChange?: (busy: boolean) => void;
  folders?: FolderCapabilities;
}) {
  const t = useTranslations("attachment");
  const inputRef = useRef<HTMLInputElement>(null);
  const state = useAttachmentUpload({
    imageOnly,
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
            <label className="text-sm font-medium" htmlFor="attachment-upload-folder">
              {t("destinationFolder")}
            </label>
            <SelectField
              id="attachment-upload-folder"
              aria-label={t("destinationFolder")}
              searchable
              value={state.folderId}
              onValueChange={state.setFolderId}
              disabled={state.busy || state.folderQuery.isPending || state.folderQuery.isError}
              options={[
                { value: UNFILED_FOLDER, label: t("unfiled") },
                ...(state.folderQuery.data ?? []).map((folder) => ({
                  value: folder.id,
                  label: folderPath(folder, state.folderQuery.data ?? []),
                })),
              ]}
            />
          </div>
          <AttachmentFolderManager capabilities={folders} disabled={state.busy} />
          {state.folderQuery.isError ? (
            <ErrorState onRetry={() => state.folderQuery.refetch()} />
          ) : null}
        </div>
      ) : null}
      <div
        className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void state.upload(Array.from(event.dataTransfer.files));
        }}
      >
        <CloudUpload className="text-muted-foreground size-8" aria-hidden />
        <p className="font-semibold">{t("dropTitle")}</p>
        <p className="text-muted-foreground text-sm">{t("dropHint")}</p>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={imageOnly ? "image/*" : undefined}
          disabled={state.busy}
          className="sr-only"
          aria-label={t("chooseFiles")}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            void state.upload(files);
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={state.busy}
          onClick={() => inputRef.current?.click()}
        >
          {state.busy ? <Loader2 className="animate-spin" /> : null}
          {t("chooseFiles")}
        </Button>
        <p className="text-muted-foreground text-xs">{t("uploadHint")}</p>
      </div>
      <ul className="space-y-2" aria-live="polite">
        {state.jobs.map((job) => (
          <li key={job.id} className="rounded-xl border p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0 break-all">{job.name}</span>
              <span className="text-muted-foreground shrink-0 text-xs">{t(job.status)}</span>
            </div>
            {job.error ? (
              <p role="alert" className="text-destructive mt-1 text-sm">
                {job.error}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
