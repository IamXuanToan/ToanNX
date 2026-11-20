/**
 * Trang chi tiết/chỉnh sửa thể loại (`/admin/genres/[id]`).
 */

"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/auth/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { GenreForm } from "../components/genre-form";
import { NOVEL_ROUTES } from "../constants/routes";
import { useGenre } from "../hooks/use-genre";
import { GENRE_PERMISSIONS } from "../permissions/genre-permission";

/**
 * Giao diện chi tiết và cập nhật thể loại.
 *
 * @param props - ID thể loại và slot lịch sử thay đổi.
 * @returns Khối giao diện form thể loại kèm lịch sử.
 */
export function GenreDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const t = useTranslations("novel.genres");
  const canRead = usePermission(GENRE_PERMISSIONS.read);
  const canUpdate = usePermission(GENRE_PERMISSIONS.update);

  const query = useGenre(id, canRead);

  if (!canRead) return <ForbiddenView />;
  if (query.isPending || !query.data)
    return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={NOVEL_ROUTES.adminGenres}
      />
    );
  }

  return (
    <FormPage title={query.data.name || t("editTitle")}>
      <GenreForm genre={query.data} disabled={!canUpdate} />
      {history ? <div className="mt-6">{history}</div> : null}
    </FormPage>
  );
}
