"use client";

import { useTranslations } from "next-intl";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { attachmentKeys } from "../constants/query-keys";
import { attachmentFolderService } from "../services/attachment-folder.service";

/**
 * Mutation sửa thư mục tệp đính kèm.
 *
 * @returns Mutation cập nhật thư mục.
 */
export function useUpdateAttachmentFolder() {
  const t = useTranslations("system.attachment");
  return useResourceMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; parentId: string | null }) =>
      attachmentFolderService.update(id, data),
    invalidate: [attachmentKeys.all],
    success: () => t("folderSaved"),
    toastError: false,
  });
}
