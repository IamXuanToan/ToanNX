"use client";

import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page/form-page";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { CUSTOM_PAGES_ROUTES } from "../../constants/routes";
import { usePage } from "../../hooks/use-page";
import { PageForm } from "../page-form/page-form";

/**
 * Trang soạn: đúng `PageForm` của trang tạo (thêm tab Nội dung/Giao diện/SEO), cộng lịch sử thay đổi.
 *
 * @param props - Id, quyền, plugin editor và lịch sử (page ghép qua slot).
 * @returns Trang soạn.
 */
export function PageProfile({
  id,
  canUpdate,
  canCreatePath,
  canUpdatePath,
  editorPlugins,
  history,
}: {
  id: string;
  canUpdate: boolean;
  canCreatePath: boolean;
  canUpdatePath: boolean;
  editorPlugins?: ReactNode;
  history?: ReactNode;
}) {
  const query = usePage(id);
  if (query.isPending)
    return <Skeleton className="mx-auto h-[32rem] w-full max-w-6xl rounded-xl" />;
  if (query.isError)
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={CUSTOM_PAGES_ROUTES.pages}
      />
    );
  return (
    <FormPage title={query.data.title}>
      <PageForm
        page={query.data}
        disabled={!canUpdate}
        canCreatePath={canCreatePath}
        canUpdatePath={canUpdatePath}
        editorPlugins={editorPlugins}
        onReload={() => query.refetch()}
      />
      {history ? <div className="mt-6">{history}</div> : null}
    </FormPage>
  );
}
