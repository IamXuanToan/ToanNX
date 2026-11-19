"use client";

import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page/form-page";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { SHORT_LINKS_ROUTES } from "../../constants/routes";
import { useShortLink } from "../../hooks/use-short-link";
import { ShortLinkForm } from "../short-link-form/short-link-form";

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
        backHref={SHORT_LINKS_ROUTES.links}
      />
    );
  return (
    <FormPage title={query.data.name}>
      <ShortLinkForm link={query.data} disabled={!canUpdate} />
      {history ? <div className="mt-6">{history}</div> : null}
    </FormPage>
  );
}
