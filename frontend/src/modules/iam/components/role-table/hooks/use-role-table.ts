"use client";

import { useRouter } from "@/i18n/navigation";
import { pickAllowedValues, useTableState } from "@/shares/hooks/use-table-state";

import { IAM_ROUTES } from "../../../constants/routes";
import {
  useBulkDeleteRoles,
  useBulkSetRolesActive,
  useDeleteRole,
} from "../../../hooks/use-iam-mutations";
import { useRoles } from "../../../hooks/use-iam-queries";
import { ROLE_AUTO_GRANT_VALUES, type Role } from "../../../types/iam.types";

const BOOLEAN_VALUES = ["true", "false"] as const;

/**
 * Dữ liệu và hành động của bảng vai trò: state chuẩn của bảng (tìm, sắp xếp, phân trang đồng bộ URL),
 * truy vấn, sửa, sao chép, bật/tắt (cột Trạng thái), xoá, thao tác hàng loạt. Vai trò hệ thống không chọn, không xoá được.
 *
 * @returns Truy vấn, state bảng và handler.
 */
export function useRoleTable() {
  const router = useRouter();
  const table = useTableState({
    ordering: "-created_at",
    filterKeys: ["isActive", "isSystem", "autoGrant"],
  });
  const query = useRoles({
    ...table.filters,
    isActive: pickAllowedValues(table.getFilterValues("isActive"), BOOLEAN_VALUES),
    isSystem: pickAllowedValues(table.getFilterValues("isSystem"), BOOLEAN_VALUES),
    autoGrant: pickAllowedValues(table.getFilterValues("autoGrant"), ROLE_AUTO_GRANT_VALUES),
  });
  const remove = useDeleteRole();
  const bulkSetActive = useBulkSetRolesActive();
  const bulkRemove = useBulkDeleteRoles();

  return {
    query,
    table,
    edit: (role: Role) => router.push(IAM_ROUTES.roleDetail(role.id)),
    copy: (role: Role) =>
      router.push({ pathname: IAM_ROUTES.roleCreate, query: { copyFrom: role.id } }),
    setActive: (role: Role, isActive: boolean) =>
      bulkSetActive.mutate({ ids: [role.id], isActive }),
    remove: (role: Role) => remove.mutateAsync(role.id),
    bulkSetActive: (roles: Role[], isActive: boolean) =>
      bulkSetActive.mutateAsync({ ids: roles.map((role) => role.id), isActive }),
    bulkRemove: (roles: Role[]) => bulkRemove.mutateAsync(roles.map((role) => role.id)),
  };
}
