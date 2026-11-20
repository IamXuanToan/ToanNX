"use client";

import { useMemo, useState } from "react";

import { useUser } from "@/modules/system/hooks/use-user";
import { useFormExtension } from "@/shares/components/common/hooks/use-form-extension";

import { diffIds, useSyncUserRoles } from "../../hooks/use-iam-mutations";
import { useRoleOptions, useUserRoles } from "../../hooks/use-iam-queries";
import { useRoleChoiceItems } from "../../hooks/use-permission-choice-groups";

/**
 * Vai trò trong form người dùng (tạo và sửa như nhau): danh sách mọi vai trò, tick để chọn, lưu cùng
 * nút Tạo/Lưu của form Account (đồng bộ: gán phần mới, gỡ phần bỏ).
 * - Sửa (`userId`): giá trị gốc là vai trò đang gán; có thay đổi thì bật nút Lưu.
 * - Tạo, sao chép (`copyFrom`): tick sẵn vai trò của người dùng nguồn.
 * Không đọc được danh mục vai trò thì chỉ hiện vai trò đang gán (chỉ xem).
 *
 * @param params - Id người dùng đang sửa / nguồn sao chép, quyền đọc và gán vai trò.
 * @returns Mục chọn, giá trị, trạng thái.
 */
export function useUserRolePicker({
  userId,
  copyFrom,
  canRead,
  canAssign,
}: {
  userId?: string;
  copyFrom?: string;
  canRead: boolean;
  canAssign: boolean;
}) {
  const sourceId = userId ?? copyFrom ?? "";
  const roles = useRoleOptions({ enabled: canRead });
  const assigned = useUserRoles(sourceId, { enabled: Boolean(sourceId) });
  const target = useUser(userId ?? "", { enabled: Boolean(userId) });
  const sync = useSyncUserRoles();
  const baseIds = useMemo(() => (assigned.data ?? []).map((role) => role.id), [assigned.data]);
  const [picked, setPicked] = useState<string[] | null>(null);
  const value = picked ?? baseIds;
  const from = userId ? baseIds : [];
  const { added, removed } = diffIds(from, value);
  const dirty = Boolean(userId) && added.length + removed.length > 0;

  const { disabled } = useFormExtension(async (user) => {
    if (!canAssign || (!added.length && !removed.length)) return;
    await sync.mutateAsync({ id: user.id, from, to: value });
    setPicked(null);
  }, dirty);

  const items = useRoleChoiceItems(canRead ? (roles.data ?? []) : (assigned.data ?? []), value);

  return {
    items,
    value,
    setValue: setPicked,
    selectAll: () =>
      setPicked([
        ...new Set([
          ...value,
          ...(roles.data ?? []).filter((role) => role.isActive).map((role) => role.id),
        ]),
      ]),
    disabled: disabled || !canAssign,
    readOnly: !canAssign,
    isSuperuser: Boolean(target.data?.isSuperuser),
    isLoading: (canRead && roles.isPending) || (Boolean(sourceId) && assigned.isPending),
    isError: (canRead && roles.isError) || assigned.isError,
    retry: () => {
      void roles.refetch();
      void assigned.refetch();
    },
  };
}
