/**
 * Trang quản trị: Chỉnh sửa tiểu thuyết (`/admin/novels/[id]`).
 */

"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { NovelForm } from "../components/novel-form";
import { NOVEL_ROUTES } from "../constants/routes";
import { useNovel } from "../hooks/use-novel";
import { NOVEL_PERMISSIONS } from "../permissions/novel-permission";

/**
 * Giao diện chi tiết và chỉnh sửa tiểu thuyết.
 *
 * @param props - ID tiểu thuyết và slot lịch sử thay đổi.
 * @returns Khối giao diện form chỉnh sửa kèm slot lịch sử.
 */
export function NovelEditView({ id, history }: { id: string; history?: ReactNode }) {
  const t = useTranslations("novel.admin");
  const canRead = usePermission(NOVEL_PERMISSIONS.read);
  const canUpdate = usePermission(NOVEL_PERMISSIONS.update);

  const query = useNovel(id, canRead);

  if (!canRead) return <ForbiddenView />;
  if (query.isPending || !query.data)
    return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={NOVEL_ROUTES.adminNovels}
      />
    );
  }

  return (
    <FormPage title={query.data.title || t("editTitle")}>
      <NovelForm novel={query.data} disabled={!canUpdate} />
      {history ? <div className="mt-6">{history}</div> : null}
    </FormPage>
  );
}
