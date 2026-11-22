"use client";

import { useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { pickAllowedValues, useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { SYSTEM_ROUTES } from "../../../constants/routes";
import { useBulkDeleteUsers } from "../../../hooks/use-bulk-delete-users";
import { useBulkSetUsersActive } from "../../../hooks/use-bulk-set-users-active";
import { useDeleteUser } from "../../../hooks/use-delete-user";
import { useUsers } from "../../../hooks/use-users";
import { USER_ACCESS_VALUES, type User } from "../../../types/user.types";

/**
 * Dữ liệu và hành động của bảng người dùng: state chuẩn của bảng (tìm, sắp xếp, phân trang đồng bộ URL),
 * truy vấn, sửa, sao chép, khoá/mở (cột Trạng thái), xoá, thao tác hàng loạt. Không cho chọn/xoá/khoá chính mình.
 *
 * @returns Truy vấn, state bảng và handler.
 */
export function useUserTable() {
  const router = useRouter();
  const table = useTableState({
    ordering: "-created_at",
    filterKeys: ["role", "isActive", "access"],
  });
  const role = table.getFilterValues("role");
  const query = useUsers({
    ...table.filters,
    role: role.length ? role : undefined,
    isActive: pickAllowedValues(table.getFilterValues("isActive"), ["true", "false"] as const),
    access: pickAllowedValues(table.getFilterValues("access"), USER_ACCESS_VALUES),
  });
  const { data: current } = useCurrentUser();
  const remove = useDeleteUser();
  const bulkSetActive = useBulkSetUsersActive();
  const bulkDelete = useBulkDeleteUsers();
  const isSelf = (user: User) => user.id === current?.user.id;

  return {
    query,
    table,
    isSelf,
    view: (user: User) => router.push(SYSTEM_ROUTES.userDetail(user.id)),
    edit: (user: User) => router.push(withEditMode(SYSTEM_ROUTES.userDetail(user.id))),
    copy: (user: User) =>
      router.push({ pathname: SYSTEM_ROUTES.userCreate, query: { copyFrom: user.id } }),
    setActive: (user: User, isActive: boolean) =>
      bulkSetActive.mutate({ ids: [user.id], isActive }),
    remove: (user: User) => remove.mutateAsync(user.id),
    bulkSetActive: (users: User[], isActive: boolean) =>
      bulkSetActive.mutateAsync({ ids: users.map((user) => user.id), isActive }),
    bulkDelete: (users: User[]) => bulkDelete.mutateAsync(users.map((user) => user.id)),
  };
}
