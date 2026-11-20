"use client";

import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { ACCOUNT_ROUTES } from "../constants/routes";
import { UserForm } from "./user-form";
import { useUserProfile } from "./hooks/use-user-profile";

/**
 * Chi tiết người dùng: đúng `UserForm` của trang tạo (cùng bố cục, cùng trường) cộng card Hoạt động;
 * phần của module khác (vai trò từ IAM) cắm qua `extensions` và lưu cùng nút Lưu.
 *
 * @param props - Id người dùng, quyền sửa, slot mở rộng và slot lịch sử thay đổi.
 * @returns Trang chi tiết người dùng.
 */
export function UserProfile({
  id,
  canEdit,
  extensions,
  history,
}: {
  id: string;
  canEdit: boolean;
  extensions?: ReactNode;
  history?: ReactNode;
}) {
  const { user } = useUserProfile(id);

  if (user.isPending) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }
  if (user.isError)
    return (
      <QueryErrorState
        error={user.error}
        onRetry={() => user.refetch()}
        backHref={ACCOUNT_ROUTES.users}
      />
    );

  return (
    <FormPage title={user.data.fullName || user.data.email}>
      <UserForm user={user.data} canEdit={canEdit} extensions={extensions} />
      {history ? <div className="mt-6">{history}</div> : null}
    </FormPage>
  );
}
