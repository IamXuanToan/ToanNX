"use client";

import type { ReactNode } from "react";

import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { PageForm } from "@/modules/utilities/components/page/page-form";
import { usePage } from "@/modules/utilities/hooks/use-page";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { PORTAL_ROUTES } from "../../constants/routes";

/**
 * Component Chi tiết và Chỉnh sửa trang cho Client Portal:
 * Chuẩn hóa dùng FormPage như trang Admin, đưa tiêu đề và thanh action cố định (sticky) lên đầu trang.
 *
 * @param props - Id trang và quyền thao tác.
 * @returns Giao diện xem / sửa trang.
 */
export function PortalPageEdit({
  id,
  canUpdate,
  canManageAll = false,
  canCreatePath,
  canUpdatePath,
  history,
}: {
  id: string;
  canUpdate: boolean;
  canManageAll?: boolean;
  canCreatePath: boolean;
  canUpdatePath: boolean;
  history?: ReactNode;
}) {
  const { data: currentUser, isPending: isUserPending } = useCurrentUser();
  const pageQuery = usePage(id);

  if (pageQuery.isPending || isUserPending) {
    return <Skeleton className="mx-auto h-[32rem] w-full max-w-6xl rounded-xl" />;
  }

  if (pageQuery.isError) {
    return (
      <QueryErrorState
        error={pageQuery.error}
        onRetry={() => pageQuery.refetch()}
        backHref={PORTAL_ROUTES.pages}
      />
    );
  }

  const page = pageQuery.data;

  // Kiểm tra quyền sở hữu trang theo IAM: chỉ chủ trang hoặc người có quyền manage_all mới truy cập được.
  if (page && page.owner?.id !== currentUser?.user.id && !canManageAll) {
    return <ForbiddenView />;
  }

  return (
    <FormPage title={page.title}>
      <PageForm
        page={page}
        disabled={!canUpdate}
        canCreatePath={canCreatePath}
        canUpdatePath={canUpdatePath}
        backHref={PORTAL_ROUTES.pages}
        history={history}
        onReload={() => pageQuery.refetch()}
      />
    </FormPage>
  );
}
