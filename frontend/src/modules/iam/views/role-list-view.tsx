"use client";

import { useTranslations } from "next-intl";

import { PermissionGate } from "@/modules/auth/components/permission-gate";
import { PageHeader } from "@/shares/components/common/page-header";

import { CreateRoleDialog } from "../components/create-role-dialog/create-role-dialog";
import { RoleTable } from "../components/role-table/role-table";
import { IAM_PERMISSIONS } from "../constants/iam-permissions";

/**
 * Trang danh sách vai trò.
 *
 * @returns Giao diện danh sách vai trò.
 */
export function RoleListView() {
  const t = useTranslations("iam.roles");
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <PermissionGate permission={IAM_PERMISSIONS.roleCreate}>
            <CreateRoleDialog />
          </PermissionGate>
        }
      />
      <RoleTable />
    </div>
  );
}
