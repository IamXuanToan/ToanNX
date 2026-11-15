"use client";

import { ErrorState } from "@/shares/components/errors/error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { RoleForm } from "../role-form/role-form";
import { useRoleCreateForm } from "./hooks/use-role-create-form";

/**
 * Tạo vai trò (`/admin/roles/new`, `?copyFrom=` để sao chép): dùng đúng `RoleForm` của trang sửa;
 * sao chép thì điền sẵn thông tin và tick sẵn quyền của vai trò nguồn.
 *
 * @param props - Id vai trò nguồn và quyền xem/gán quyền.
 * @returns Form tạo vai trò.
 */
export function RoleCreateForm({
  copyFrom,
  canReadPermissions,
  canAssignPermissions,
}: {
  copyFrom?: string;
  canReadPermissions: boolean;
  canAssignPermissions: boolean;
}) {
  const state = useRoleCreateForm(copyFrom);
  if (state.isLoadingSource) return <Skeleton className="h-80 rounded-xl" />;
  if (state.source.isError) {
    return (
      <ErrorState
        message={state.errorMessage(state.source.error)}
        onRetry={() => state.source.refetch()}
      />
    );
  }
  return (
    <RoleForm
      defaults={state.defaults}
      defaultPermissionIds={state.defaultPermissionIds}
      canReadPermissions={canReadPermissions}
      canAssignPermissions={canAssignPermissions}
      onSaved={state.onSaved}
    />
  );
}
