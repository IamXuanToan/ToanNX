"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { RoleCreateForm } from "../../components/role/role-create-form";
import { IAM_PERMISSIONS } from "../../permissions/iam-permission";

/**
 * Trang tạo vai trò (có thể sao chép từ vai trò khác, kèm quyền); chọn quyền ngay khi được xem và gán quyền.
 *
 * @param props - Id vai trò nguồn khi sao chép.
 * @returns Giao diện tạo vai trò, hoặc màn không có quyền.
 */
export function RoleCreateView({ copyFrom }: { copyFrom?: string }) {
  const t = useTranslations("system.iam.roles");
  const canCreate = usePermission(IAM_PERMISSIONS.roleCreate);
  const canReadPermissions = usePermission(IAM_PERMISSIONS.permissionRead);
  const canAssignPermissions = usePermission(IAM_PERMISSIONS.permissionAssign);
  if (!canCreate) return <ForbiddenView />;
  return (
    <FormPage title={t("create")}>
      <RoleCreateForm
        copyFrom={copyFrom}
        canReadPermissions={canReadPermissions}
        canAssignPermissions={canAssignPermissions}
      />
    </FormPage>
  );
}
