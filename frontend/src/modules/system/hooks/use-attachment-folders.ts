"use client";

import { useQuery } from "@tanstack/react-query";

import { attachmentKeys } from "../constants/query-keys";
import { attachmentFolderService } from "../services/attachment-folder.service";

/** @param enabled - Có quyền xem thư mục. @param scope - Phạm vi. @returns Toàn bộ thư mục (cây). */
export function useAttachmentFolders(enabled: boolean, scope?: readonly string[]) {
  return useQuery({
    queryKey: attachmentKeys.folders(scope),
    queryFn: ({ signal }) => attachmentFolderService.listAll(scope, signal),
    enabled,
  });
}
