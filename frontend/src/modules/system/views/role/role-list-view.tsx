"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PermissionGate } from "@/modules/system/components/permission/permission-gate";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { Button } from "@/shares/components/ui/button";

import { RoleTable } from "../../components/role/role-table";
import { IAM_PERMISSIONS } from "../../permissions/iam-permission";
import { SYSTEM_ROUTES } from "../../constants/routes";

/**
 * Trang danh sách vai trò.
 *
 * @returns Giao diện danh sách vai trò.
 */
export function RoleListView() {
  const t = useTranslations("system.iam.roles");
  const canCreate = usePermission(IAM_PERMISSIONS.roleCreate);
  const canUpdate = usePermission(IAM_PERMISSIONS.roleUpdate);
  const canDelete = usePermission(IAM_PERMISSIONS.roleDelete);
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={IAM_PERMISSIONS.roleCreate}>
            <Button asChild>
              <Link href={SYSTEM_ROUTES.roleCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          </PermissionGate>
        }
      />
      <RoleTable canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
