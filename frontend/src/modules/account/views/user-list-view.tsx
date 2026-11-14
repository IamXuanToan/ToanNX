"use client";

import { useTranslations } from "next-intl";

import { PermissionGate } from "@/modules/auth/components/permission-gate";
import { PageHeader } from "@/shares/components/common/page-header";

import { CreateUserDialog } from "../components/create-user-dialog/create-user-dialog";
import { UserTable } from "../components/user-table/user-table";
import { ACCOUNT_PERMISSIONS } from "../constants/account-permissions";

/**
 * Trang danh sách người dùng.
 *
 * @returns Giao diện danh sách người dùng.
 */
export function UserListView() {
  const t = useTranslations("account.users");
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <PermissionGate permission={ACCOUNT_PERMISSIONS.userCreate}>
            <CreateUserDialog />
          </PermissionGate>
        }
      />
      <UserTable />
    </div>
  );
}
