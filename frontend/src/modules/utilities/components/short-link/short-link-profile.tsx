"use client";

import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page";
import { RecordDetailTabs } from "@/shares/components/common/record-detail-tabs";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { UTILITIES_ROUTES } from "../../constants/routes";
import { useShortLink } from "../../hooks/use-short-link";
import { ShortLinkForm } from "./short-link-form";

/**
 * Chi tiết link: đúng `ShortLinkForm` của trang tạo, cộng lịch sử thay đổi (page ghép qua slot).
 *
 * @param props - Id, quyền sửa, slot lịch sử.
 * @returns Trang chi tiết.
 */
export function ShortLinkProfile({
  id,
  canUpdate,
  history,
}: {
  id: string;
  canUpdate: boolean;
  history?: ReactNode;
}) {
  const query = useShortLink(id);
  if (query.isPending) return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  if (query.isError)
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={UTILITIES_ROUTES.shortLinks}
      />
    );
  return (
    <FormPage title={query.data.name} backHref={UTILITIES_ROUTES.shortLinks}>
      <RecordDetailTabs
        general={<ShortLinkForm link={query.data} disabled={!canUpdate} />}
        history={history}
      />
    </FormPage>
  );
}
