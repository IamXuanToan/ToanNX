"use client";

import { useTranslations } from "next-intl";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { attachmentKeys } from "../constants/query-keys";
import { attachmentService } from "../services/attachment.service";
import type { Attachment, UpdateAttachmentInput } from "../types/attachment.types";

/**
 * Mutation cập nhật thông tin tệp (đổi tên, văn bản thay thế alt text, chuyển thư mục).
 *
 * @returns Mutation cập nhật tệp.
 */
export function useUpdateAttachment() {
  const t = useTranslations("attachment");
  return useResourceMutation({
    mutationFn: ({ id, ...input }: { id: string } & UpdateAttachmentInput): Promise<Attachment> =>
      attachmentService.update(id, input),
    invalidate: [attachmentKeys.all],
    success: () => t("fileUpdated"),
    toastError: false,
  });
}
