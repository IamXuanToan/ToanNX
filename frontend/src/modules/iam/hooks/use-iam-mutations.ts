"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { authKeys } from "@/modules/auth/constants/query-keys";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { iamKeys } from "../constants/query-keys";
import { rolePermissionService } from "../services/role-permission.service";
import { roleService } from "../services/role.service";
import { userRoleService } from "../services/user-role.service";
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

/** @returns Mutation tạo vai trò (lỗi do form tự hiển thị). */
export function useCreateRole() {
  const { onSuccess } = useIamMutationHandlers();
  return useMutation({ mutationFn: (input: RoleInput) => roleService.create(input), onSuccess });
}

/** @param id - Id vai trò. @returns Mutation cập nhật vai trò. */
export function useUpdateRole(id: string) {
  const { onSuccess } = useIamMutationHandlers();
  return useMutation({
    mutationFn: (input: Omit<RoleInput, "code">) => roleService.update(id, input),
    onSuccess,
  });
}

/**
 * Callback sau khi xoá vai trò: toast, làm mới IAM và quyền của người dùng hiện tại.
 *
 * @returns Handler onSuccess/onError.
 */
function useIamDeleteHandlers() {
  const queryClient = useQueryClient();
  const t = useTranslations("common.feedback");
  const errorMessage = useApiErrorMessage();
  return {
    onSuccess: async (count: number | void) => {
      toast.success(typeof count === "number" ? t("bulkDeleted", { count }) : t("deleted"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: iamKeys.all }),
        queryClient.invalidateQueries({ queryKey: authKeys.me() }),
      ]);
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  };
}

/** @returns Mutation xoá mềm một vai trò. */
export function useDeleteRole() {
  return useMutation({
    mutationFn: (id: string) => roleService.remove(id),
    ...useIamDeleteHandlers(),
  });
}

/** @returns Mutation bật/tắt nhiều vai trò. */
export function useBulkSetRolesActive() {
  const handlers = useIamMutationHandlers();
  return useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      roleService.bulkSetActive(ids, isActive),
    ...handlers,
  });
}

/** @returns Mutation xoá mềm nhiều vai trò. */
export function useBulkDeleteRoles() {
  return useMutation({
    mutationFn: (ids: string[]) => roleService.bulkRemove(ids),
    ...useIamDeleteHandlers(),
  });
}

/**
 * Phần chênh giữa hai danh sách id: cần thêm và cần gỡ.
 *
 * @param from - Đang có.
 * @param to - Muốn có.
 * @returns Id cần thêm và cần gỡ.
 */
export function diffIds(from: readonly string[], to: readonly string[]) {
  return {
    added: to.filter((id) => !from.includes(id)),
    removed: from.filter((id) => !to.includes(id)),
  };
}

/**
 * Đồng bộ một tập id về đúng danh sách mong muốn (dùng chung cho tạo và sửa): gán phần mới, gỡ phần
 * bị bỏ, lần lượt từng cái. Lỗi thì toast và ném tiếp để form xử lý (bản ghi chính đã lưu).
 *
 * @param apply - Gán/gỡ một id.
 * @returns Mutation `{ id, from, to }`.
 */
function useSyncMutation(
  apply: (ownerId: string, id: string, assign: boolean) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  const errorMessage = useApiErrorMessage();
  return useMutation({
    mutationFn: async ({
      id,
      from,
      to,
    }: {
      id: string;
      from: readonly string[];
      to: readonly string[];
    }) => {
      const { added, removed } = diffIds(from, to);
      for (const item of added) await apply(id, item, true);
      for (const item of removed) await apply(id, item, false);
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: iamKeys.all }),
        queryClient.invalidateQueries({ queryKey: authKeys.me() }),
      ]),
  });
}

/** @returns Mutation đồng bộ vai trò của một người dùng (`id` = id người dùng). */
export function useSyncUserRoles() {
  return useSyncMutation((userId, roleId, assign) =>
    assign ? userRoleService.assign(userId, roleId) : userRoleService.revoke(userId, roleId),
  );
}

/** @returns Mutation đồng bộ quyền của một vai trò (`id` = id vai trò). */
export function useSyncRolePermissions() {
  return useSyncMutation((roleId, permissionId, assign) =>
    assign
      ? rolePermissionService.assign(roleId, permissionId)
      : rolePermissionService.revoke(roleId, permissionId),
  );
}
