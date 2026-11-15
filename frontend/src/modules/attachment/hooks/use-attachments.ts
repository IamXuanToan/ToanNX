"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { attachmentKeys } from "../constants/query-keys";
import { attachmentService } from "../services/attachment.service";
import type { AttachmentFilters } from "../types/attachment.types";

/** @param filters - Bộ lọc. @param enabled - Quyền tải danh sách. @returns Trang file có giữ dữ liệu cũ khi chuyển trang. */
export function useAttachments(filters: AttachmentFilters, enabled = true) {
  return useQuery({
    queryKey: attachmentKeys.list(filters),
    queryFn: ({ signal }) => attachmentService.list(filters, signal),
    enabled,
    placeholderData: keepPreviousData,
  });
}

/** @returns Mutation xóa file và làm mới các nơi đang tham chiếu ảnh. */
export function useDeleteAttachments() {
  const client = useQueryClient();
  const t = useTranslations("attachment");
  const errorMessage = useApiErrorMessage();
  return useMutation({
    mutationFn: attachmentService.bulkDelete,
    onSuccess: async (count) => {
      toast.success(t("deleted", { count }));
      // File có thể được nhiều module tham chiếu; không import ngược các module đó vào Attachment.
      await client.invalidateQueries();
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  });
}

/** @returns Mutation chuyển nhóm file, không sửa đường dẫn storage hoặc URL. */
export function useMoveAttachments() {
  const client = useQueryClient();
  const t = useTranslations("attachment");
  const errorMessage = useApiErrorMessage();
  return useMutation({
    mutationFn: ({ ids, folderId }: { ids: string[]; folderId: string | null }) =>
      attachmentService.move(ids, folderId),
    onSuccess: async (count) => {
      toast.success(t("filesMoved", { count }));
      await client.invalidateQueries({ queryKey: attachmentKeys.all });
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  });
}
