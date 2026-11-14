"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { authKeys, iamKeys } from "@/shares/constants/query-keys";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { iamService } from "../services/iam.service";
import type { RoleInput } from "../types/iam.types";

/**
 * Callback dùng chung: toast thành công, làm mới cache IAM và quyền của người dùng hiện tại.
 * Đổi vai trò/quyền có thể ảnh hưởng chính người đang đăng nhập nên luôn invalidate `authKeys.me()`.
 */
function useIamMutationHandlers() {
  const queryClient = useQueryClient();
  const t = useTranslations("iam.feedback");
  const errorMessage = useApiErrorMessage();
  return {
    onSuccess: async () => {
      toast.success(t("saved"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: iamKeys.all }),
        queryClient.invalidateQueries({ queryKey: authKeys.me() }),
      ]);
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  };
}

/** @param userId - Id người dùng. @returns Mutation gán/thu hồi vai trò. */
export function useUserRoleMutation(userId: string) {
  const handlers = useIamMutationHandlers();
  return useMutation({
    mutationFn: async ({ roleId, assign }: { roleId: string; assign: boolean }) => {
      if (assign) await iamService.assignRole(userId, roleId);
      else await iamService.revokeRole(userId, roleId);
    },
    ...handlers,
  });
}

/** @returns Mutation tạo vai trò (lỗi do form tự hiển thị). */
export function useCreateRole() {
  const { onSuccess } = useIamMutationHandlers();
  return useMutation({ mutationFn: (input: RoleInput) => iamService.createRole(input), onSuccess });
}

/** @param id - Id vai trò. @returns Mutation cập nhật vai trò. */
export function useUpdateRole(id: string) {
  const { onSuccess } = useIamMutationHandlers();
  return useMutation({
    mutationFn: (input: Omit<RoleInput, "code">) => iamService.updateRole(id, input),
    onSuccess,
  });
}

/** @param roleId - Id vai trò. @returns Mutation gán/thu hồi quyền. */
export function useRolePermissionMutation(roleId: string) {
  const handlers = useIamMutationHandlers();
  return useMutation({
    mutationFn: async ({ permissionId, assign }: { permissionId: string; assign: boolean }) => {
      if (assign) await iamService.assignPermission(roleId, permissionId);
      else await iamService.revokePermission(roleId, permissionId);
    },
    ...handlers,
  });
}
