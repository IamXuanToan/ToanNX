"use client";

import { useState } from "react";

import { useAttachmentFolders } from "../../../hooks/use-attachment-folders";
import { useMoveAttachments } from "../../../hooks/use-attachments";
import type { Attachment } from "../../../types/attachment.types";

/** @param files - Các file đích. @param canReadFolders - Quyền danh mục. @param onDone - Sau khi chuyển thành công. @returns Nhóm tương thích owner và mutation. */
export function useAttachmentMoveDialog(
  files: Attachment[],
  canReadFolders: boolean,
  onDone: () => void,
) {
  const [folderId, setFolderId] = useState<string>("UNFILED");
  const query = useAttachmentFolders(canReadFolders);
  const mutation = useMoveAttachments();
  const owners = new Set(files.map((file) => file.createdById));
  const folders = (query.data ?? []).filter(
    (folder) => owners.size === 1 && owners.has(folder.createdById),
  );
  return {
    folderId,
    setFolderId,
    query,
    folders,
    busy: mutation.isPending,
    move: () =>
      mutation.mutate(
        { ids: files.map((file) => file.id), folderId: folderId === "UNFILED" ? null : folderId },
        { onSuccess: onDone },
      ),
  };
}
