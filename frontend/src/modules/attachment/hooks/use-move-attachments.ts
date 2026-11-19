"use client";

import { useTranslations } from "next-intl";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { attachmentKeys } from "../constants/query-keys";
import { attachmentService } from "../services/attachment.service";

/**
 * Mutation chuyển nhóm file, không sửa đường dẫn storage hoặc URL.
 *
 * @returns Mutation di chuyển tệp đính kèm sang thư mục khác.
 */
export function useMoveAttachments() {
  const t = useTranslations("attachment");
  return useResourceMutation({
    mutationFn: ({ ids, folderId }: { ids: string[]; folderId: string | null }) =>
      attachmentService.move(ids, folderId),
    invalidate: [attachmentKeys.all],
    success: (count) => t("filesMoved", { count }),
  });
}
