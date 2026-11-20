"use client";

import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { SYSTEM_ROUTES } from "../constants/routes";
import { RoleForm } from "./role-form";
import { useRoleProfile } from "./hooks/use-role-profile";

/**
 * Chi tiết vai trò: đúng `RoleForm` của trang tạo (thông tin, trạng thái, quyền), lưu bằng một nút.
 *
 * @param props - Id vai trò, quyền của người xem, slot lịch sử thay đổi (page ghép từ journal).
 * @returns Chi tiết vai trò.
 */
export function RoleProfile({
  id,
  canUpdate,
  canReadPermissions,
  canAssignPermissions,
  history,
}: {
  id: string;
  canUpdate: boolean;
  canReadPermissions: boolean;
  canAssignPermissions: boolean;
  history?: ReactNode;
}) {
  const { role, editable } = useRoleProfile(id);

  if (role.isPending) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }
  if (role.isError)
    return (
      <QueryErrorState
        error={role.error}
        onRetry={() => role.refetch()}
        backHref={SYSTEM_ROUTES.roles}
      />
    );

  return (
    <FormPage title={role.data.name}>
      <RoleForm
        role={role.data}
        disabled={!canUpdate || !editable}
        canReadPermissions={canReadPermissions}
        canAssignPermissions={canAssignPermissions && editable}
      />
      {history ? <div className="mt-6">{history}</div> : null}
    </FormPage>
  );
}
