"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PermissionGate } from "@/modules/auth/components/permission-gate";
import { usePermission } from "@/modules/auth/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header/page-header";
import { Button } from "@/shares/components/ui/button";

import { RoleTable } from "../components/role-table/role-table";
import { IAM_PERMISSIONS } from "../constants/iam-permissions";
import { IAM_ROUTES } from "../constants/routes";

/**
 * Trang danh sách vai trò.
 *
 * @returns Giao diện danh sách vai trò.
 */
export function RoleListView() {
  const t = useTranslations("iam.roles");
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
              <Link href={IAM_ROUTES.roleCreate}>
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
