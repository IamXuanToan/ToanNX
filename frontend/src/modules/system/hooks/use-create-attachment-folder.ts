"use client";

import { useTranslations } from "next-intl";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { attachmentKeys } from "../constants/query-keys";
import { attachmentFolderService } from "../services/attachment-folder.service";

/**
 * Mutation tạo thư mục tệp đính kèm.
 *
 * @returns Mutation tạo thư mục.
 */
export function useCreateAttachmentFolder() {
  const t = useTranslations("system.attachment");
  return useResourceMutation({
    mutationFn: attachmentFolderService.create,
    invalidate: [attachmentKeys.all],
    success: () => t("folderSaved"),
    toastError: false,
  });
}
