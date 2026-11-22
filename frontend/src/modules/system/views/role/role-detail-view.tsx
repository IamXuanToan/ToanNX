"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { RoleProfile } from "../../components/role/role-profile";
import { IAM_PERMISSIONS } from "../../permissions/iam-permission";

/**
 * Trang chi tiết vai trò: thông tin và quyền.
 *
 * @param props - Id vai trò và slot lịch sử thay đổi.
 * @returns Giao diện chi tiết vai trò.
 */
export function RoleDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(IAM_PERMISSIONS.roleRead);
  const canUpdate = usePermission(IAM_PERMISSIONS.roleUpdate);
  const canReadPermissions = usePermission(IAM_PERMISSIONS.permissionRead);
  const canAssignPermissions = usePermission(IAM_PERMISSIONS.permissionAssign);
  // Chỉ có quyền gán quyền (không sửa vai trò) vẫn vào được chế độ sửa để tick quyền.
  const canEdit = canUpdate || canAssignPermissions;
  const isEditing = useEditMode(canEdit);
  if (!canRead) return <ForbiddenView />;
  return (
    <EditModeProvider canEdit={canEdit}>
      <RoleProfile
        id={id}
        canUpdate={canUpdate && isEditing}
        canReadPermissions={canReadPermissions}
        canAssignPermissions={canAssignPermissions && isEditing}
        history={history}
      />
    </EditModeProvider>
  );
}
