"use client";

import { useTranslations } from "next-intl";

import { useListQuery } from "@/shares/hooks/use-list-query";
import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { attachmentKeys } from "../constants/query-keys";
import { attachmentService } from "../services/attachment.service";
import type { AttachmentFilters } from "../types/attachment.types";

/**
 * Xóa file làm ảnh ở nhiều module khác (avatar, trang, mã QR) không còn hiển thị; Attachment là module nền
 * nên không biết khóa của các module đó → làm mới toàn bộ cache (`[]` khớp mọi khóa). Thao tác hiếm, chấp nhận.
 */
const ALL_QUERIES = [[]] as const;

/** @param filters - Bộ lọc. @param enabled - Quyền tải danh sách. @returns Trang file có giữ dữ liệu cũ khi chuyển trang. */
export function useAttachments(filters: AttachmentFilters, enabled = true) {
  return useListQuery(
    attachmentKeys.list(filters),
    (signal) => attachmentService.list(filters, signal),
    {
      enabled,
    },
  );
}

/** @returns Mutation xóa file và làm mới các nơi đang tham chiếu ảnh. */
export function useDeleteAttachments() {
  const t = useTranslations("attachment");
  return useResourceMutation({
    mutationFn: (ids: string[]) => attachmentService.bulkDelete(ids),
    invalidate: ALL_QUERIES,
    success: (count) => t("deleted", { count }),
  });
}

/** @returns Mutation chuyển nhóm file, không sửa đường dẫn storage hoặc URL. */
export function useMoveAttachments() {
  const t = useTranslations("attachment");
  return useResourceMutation({
    mutationFn: ({ ids, folderId }: { ids: string[]; folderId: string | null }) =>
      attachmentService.move(ids, folderId),
    invalidate: [attachmentKeys.all],
    success: (count) => t("filesMoved", { count }),
  });
}
