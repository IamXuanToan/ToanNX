"use client";

import { useTranslations } from "next-intl";

import { useCurrentUser } from "@/modules/auth/hooks/use-current-user";
import { usePermission } from "@/modules/auth/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/shares/components/ui/card";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { RoleForm } from "../components/role-form/role-form";
import { RolePermissionsCard } from "../components/role-permissions-card/role-permissions-card";
import { IAM_PERMISSIONS } from "../constants/iam-permissions";
import { useRole } from "../hooks/use-iam-queries";

/**
 * Trang chi tiết vai trò: thông tin và quyền.
 *
 * @param props - Id vai trò.
 * @returns Giao diện chi tiết vai trò.
 */
export function RoleDetailView({ id }: { id: string }) {
  const t = useTranslations("iam.roles");
  const role = useRole(id);
  const errorMessage = useApiErrorMessage();
  const { data: current } = useCurrentUser();
  const canUpdate = usePermission(IAM_PERMISSIONS.roleUpdate);
  const canReadPermissions = usePermission(IAM_PERMISSIONS.permissionRead);
  const canAssign = usePermission(IAM_PERMISSIONS.permissionAssign);

  if (role.isPending) return <Skeleton className="h-96 w-full" />;
  if (role.isError)
    return <ErrorState message={errorMessage(role.error)} onRetry={() => role.refetch()} />;

  // Vai trò hệ thống chỉ superuser được sửa (backend cũng chặn).
  const editable = !role.data.isSystem || Boolean(current?.user.isSuperuser);

  return (
    <div className="space-y-6">
      <PageHeader title={role.data.name} description={role.data.code} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("info")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RoleForm role={role.data} disabled={!canUpdate || !editable} />
          </CardContent>
        </Card>
        <RolePermissionsCard
          role={role.data}
          canRead={canReadPermissions}
          canAssign={canAssign && editable}
        />
      </div>
    </div>
  );
}
