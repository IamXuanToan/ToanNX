"use client";

import { FormPage } from "@/shares/components/common/form-page/form-page";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { RoleForm } from "../role-form/role-form";
import { useRoleProfile } from "./hooks/use-role-profile";

/**
 * Chi tiết vai trò: đúng `RoleForm` của trang tạo (thông tin, trạng thái, quyền), lưu bằng một nút.
 *
 * @param props - Id vai trò và các quyền của người xem.
 * @returns Chi tiết vai trò.
 */
export function RoleProfile({
  id,
  canUpdate,
  canReadPermissions,
  canAssignPermissions,
}: {
  id: string;
  canUpdate: boolean;
  canReadPermissions: boolean;
  canAssignPermissions: boolean;
}) {
  const { role, errorMessage, editable } = useRoleProfile(id);

  if (role.isPending) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }
  if (role.isError)
    return <ErrorState message={errorMessage(role.error)} onRetry={() => role.refetch()} />;

  return (
    <FormPage title={role.data.name}>
      <RoleForm
        role={role.data}
        disabled={!canUpdate || !editable}
        canReadPermissions={canReadPermissions}
        canAssignPermissions={canAssignPermissions && editable}
      />
    </FormPage>
  );
}
