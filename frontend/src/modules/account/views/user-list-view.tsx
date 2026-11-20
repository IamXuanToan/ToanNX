"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { PermissionGate } from "@/modules/auth/components/permission-gate";
import { usePermission } from "@/modules/auth/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { Button } from "@/shares/components/ui/button";

import { UserTable } from "../components/user-table";
import { USER_PERMISSIONS } from "../permissions/user-permission";
import { ACCOUNT_ROUTES } from "../constants/routes";

/**
 * Trang danh sách người dùng.
 *
 * @returns Giao diện danh sách người dùng.
 */
export function UserListView({ roleFilter }: { roleFilter?: ReactNode }) {
  const t = useTranslations("account.users");
  const canCreate = usePermission(USER_PERMISSIONS.userCreate);
  const canUpdate = usePermission(USER_PERMISSIONS.userUpdate);
  const canDelete = usePermission(USER_PERMISSIONS.userDelete);
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={USER_PERMISSIONS.userCreate}>
            <Button asChild>
              <Link href={ACCOUNT_ROUTES.userCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          </PermissionGate>
        }
      />
      <UserTable
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        roleFilter={roleFilter}
      />
    </div>
  );
}
