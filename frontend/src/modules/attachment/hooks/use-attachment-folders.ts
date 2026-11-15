"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { attachmentKeys } from "../constants/query-keys";
import { attachmentFolderService } from "../services/attachment-folder.service";

/** @param enabled - Quyền xem nhóm. @param scope - Tùy chọn chỉ nhóm của mình. @returns Danh mục đầy đủ có trạng thái lỗi/tải. */
export function useAttachmentFolders(enabled: boolean, scope?: readonly string[]) {
  return useQuery({
    queryKey: attachmentKeys.folders(scope),
    queryFn: ({ signal }) => attachmentFolderService.listAll(scope, signal),
    enabled,
  });
}

/** @returns Các mutation riêng theo hành động, làm mới số file và bộ lọc sau khi đổi nhóm. */
export function useAttachmentFolderMutations() {
  const client = useQueryClient();
  const t = useTranslations("attachment");
  const errorMessage = useApiErrorMessage();
  const saved = async () => {
    toast.success(t("folderSaved"));
    await client.invalidateQueries({ queryKey: attachmentKeys.all });
  };
  const create = useMutation({ mutationFn: attachmentFolderService.create, onSuccess: saved });
  const update = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; parentId: string | null }) =>
      attachmentFolderService.update(id, data),
    onSuccess: saved,
  });
  const remove = useMutation({
    mutationFn: attachmentFolderService.remove,
    onSuccess: async (_result, variables) => {
      toast.success(t("folderDeleted"));
      // Xóa file trong nhánh cũng làm mới avatar/nội dung ở các module đang tham chiếu.
      await client.invalidateQueries(
        variables.deleteFiles ? undefined : { queryKey: attachmentKeys.all },
      );
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  });
  return { create, update, remove };
}
