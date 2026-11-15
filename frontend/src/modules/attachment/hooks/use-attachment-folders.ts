"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

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

/** @returns Mutation tạo, sửa, xóa thư mục (lỗi tạo/sửa do form tự hiện). */
export function useAttachmentFolderMutations() {
  const t = useTranslations("attachment");
  const create = useResourceMutation({
    mutationFn: attachmentFolderService.create,
    invalidate: [attachmentKeys.all],
    success: () => t("folderSaved"),
    toastError: false,
  });
  const update = useResourceMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; parentId: string | null }) =>
      attachmentFolderService.update(id, data),
    invalidate: [attachmentKeys.all],
    success: () => t("folderSaved"),
    toastError: false,
  });
  // Xóa file trong nhánh làm ảnh ở module khác không còn hiển thị → làm mới toàn bộ cache (`[]`).
  const remove = useResourceMutation({
    mutationFn: attachmentFolderService.remove,
    invalidate: [[]],
    success: () => t("folderDeleted"),
  });
  return { create, update, remove };
}
