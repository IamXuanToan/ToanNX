"use client";

import { useTranslations } from "next-intl";

import { SelectField } from "@/shares/components/common/select-field/select-field";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";

import { UNFILED_FOLDER } from "../../constants/media-types";
import { folderPath } from "../../utils/folder-path";
import type { Attachment } from "../../types/attachment.types";
import { useAttachmentMoveDialog } from "./hooks/use-attachment-move-dialog";

/** @param props - File cần gom nhóm và quyền danh mục. @returns Chuyển nhóm một hoặc nhiều file, không đổi URL. */
export function AttachmentMoveDialog({
  files,
  canReadFolders,
  onClose,
  onDone,
}: {
  files: Attachment[];
  canReadFolders: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("attachment");
  const state = useAttachmentMoveDialog(files, canReadFolders, onDone);
  return (
    <Dialog open onOpenChange={(open) => !open && !state.busy && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("moveFiles")}</DialogTitle>
          <DialogDescription>{t("moveDescription")}</DialogDescription>
        </DialogHeader>
        {canReadFolders && state.query.isError ? (
          <ErrorState onRetry={() => state.query.refetch()} />
        ) : (
          <SelectField
            aria-label={t("destinationFolder")}
            searchable
            value={state.folderId}
            onValueChange={state.setFolderId}
            disabled={state.busy || (canReadFolders && state.query.isPending)}
            options={[
              { value: UNFILED_FOLDER, label: t("unfiled") },
              ...state.folders.map((folder) => ({
                value: folder.id,
                label: folderPath(folder, state.folders),
              })),
            ]}
          />
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={state.busy} onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            disabled={
              state.busy || (canReadFolders && (state.query.isPending || state.query.isError))
            }
            onClick={state.move}
          >
            {t("moveFiles")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
