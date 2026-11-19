"use client";

import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page/form-page";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { CUSTOM_PAGES_ROUTES } from "../../constants/routes";
import { usePagePath } from "../../hooks/use-page-path";
import { PagePathForm } from "../page-path-form/page-path-form";

/**
 * Chi tiết đường dẫn giữa: đúng `PagePathForm`, cộng lịch sử thay đổi (page ghép qua slot).
 *
 * @param props - Id, quyền sửa, slot lịch sử.
 * @returns Trang chi tiết.
 */
export function PagePathProfile({
  id,
  canUpdate,
  history,
}: {
  id: string;
  canUpdate: boolean;
  history?: ReactNode;
}) {
  const query = usePagePath(id);
  if (query.isPending) return <Skeleton className="mx-auto h-80 w-full max-w-6xl rounded-xl" />;
  if (query.isError)
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={CUSTOM_PAGES_ROUTES.paths}
      />
    );
  return (
    <FormPage title={`/${query.data.segment}`}>
      <PagePathForm path={query.data} disabled={!canUpdate} />
      {history ? <div className="mt-6">{history}</div> : null}
    </FormPage>
  );
}
