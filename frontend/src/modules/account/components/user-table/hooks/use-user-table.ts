"use client";

import { useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/modules/auth/hooks/use-current-user";
import { pickAllowedValues, useTableState } from "@/shares/hooks/use-table-state";

import { ACCOUNT_ROUTES } from "../../../constants/routes";
import {
  useBulkDeleteUsers,
  useBulkSetUsersActive,
  useDeleteUser,
} from "../../../hooks/use-account-mutations";
import { useUsers } from "../../../hooks/use-account-queries";
import { USER_ACCESS_VALUES, type User } from "../../../types/account.types";

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
  const bulkRemove = useBulkDeleteUsers();
  const isSelf = (user: User) => user.id === current?.user.id;

  return {
    query,
    table,
    isSelf,
    edit: (user: User) => router.push(ACCOUNT_ROUTES.userDetail(user.id)),
    copy: (user: User) =>
      router.push({ pathname: ACCOUNT_ROUTES.userCreate, query: { copyFrom: user.id } }),
    setActive: (user: User, isActive: boolean) =>
      bulkSetActive.mutate({ ids: [user.id], isActive }),
    remove: (user: User) => remove.mutateAsync(user.id),
    bulkSetActive: (users: User[], isActive: boolean) =>
      bulkSetActive.mutateAsync({ ids: users.map((user) => user.id), isActive }),
    bulkRemove: (users: User[]) => bulkRemove.mutateAsync(users.map((user) => user.id)),
  };
}
