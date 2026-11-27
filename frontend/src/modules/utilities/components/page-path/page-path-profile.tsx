"use client";

import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page";
import { RecordDetailTabs } from "@/shares/components/common/record-detail-tabs";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { UTILITIES_ROUTES } from "../../constants/routes";
import { usePagePath } from "../../hooks/use-page-path";
import { PagePathForm } from "./page-path-form";

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
        backHref={UTILITIES_ROUTES.pagePaths}
      />
    );
  return (
    <FormPage title={`/${query.data.segment}`} backHref={UTILITIES_ROUTES.pagePaths}>
      <RecordDetailTabs
        general={<PagePathForm path={query.data} disabled={!canUpdate} />}
        history={history}
      />
    </FormPage>
  );
}
