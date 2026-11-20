"use client";

import { useTranslations } from "next-intl";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { attachmentService } from "../services/attachment.service";

/**
 * Xóa file làm ảnh ở nhiều module khác (avatar, trang, mã QR) không còn hiển thị; Attachment là module nền
 * nên không biết khóa của các module đó → làm mới toàn bộ cache (`[]` khớp mọi khóa). Thao tác hiếm, chấp nhận.
 */
const ALL_QUERIES = [[]] as const;

/**
 * Mutation xóa file và làm mới các nơi đang tham chiếu ảnh.
 *
 * @returns Mutation xóa tệp đính kèm.
 */
export function useDeleteAttachments() {
  const t = useTranslations("system.attachment");
  return useResourceMutation({
    mutationFn: (ids: string[]) => attachmentService.bulkDelete(ids),
    invalidate: ALL_QUERIES,
    success: (count) => t("deleted", { count }),
  });
}
