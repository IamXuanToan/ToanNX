"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { usePermission } from "@/modules/auth/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { UserEditForm } from "../components/user-edit-form/user-edit-form";
import { ACCOUNT_PERMISSIONS } from "../constants/account-permissions";
import { useUser } from "../hooks/use-account-queries";

/**
 * Trang chi tiết người dùng: thông tin và trạng thái tài khoản.
 *
 * Phần của module khác (ví dụ vai trò từ IAM) do page truyền vào qua `aside`,
 * để Account không phụ thuộc IAM.
 *
 * @param props - Id người dùng và nội dung bổ sung bên cạnh.
 * @returns Giao diện chi tiết.
 */
export function UserDetailView({ id, aside }: { id: string; aside?: ReactNode }) {
  const t = useTranslations("account.users");
  const user = useUser(id);
  const errorMessage = useApiErrorMessage();
  const canEdit = usePermission(ACCOUNT_PERMISSIONS.userUpdate);

  if (user.isPending) return <Skeleton className="h-96 w-full" />;
  if (user.isError)
    return <ErrorState message={errorMessage(user.error)} onRetry={() => user.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.data.fullName || user.data.email}
        description={t("detailDescription")}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <UserEditForm user={user.data} canEdit={canEdit} />
        {aside}
      </div>
    </div>
  );
}
