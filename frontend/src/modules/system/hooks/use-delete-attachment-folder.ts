"use client";

import { useTranslations } from "next-intl";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { attachmentFolderService } from "../services/attachment-folder.service";

/**
 * Mutation xóa thư mục tệp đính kèm.
 *
 * @returns Mutation xóa thư mục.
 */
export function useDeleteAttachmentFolder() {
  const t = useTranslations("system.attachment");
  return useResourceMutation({
    mutationFn: attachmentFolderService.delete,
    invalidate: [[]],
    success: () => t("folderDeleted"),
  });
}
