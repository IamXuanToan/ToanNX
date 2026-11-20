/**
 * Trang chi tiết/chỉnh sửa tác giả (`/admin/authors/[id]`).
 */

"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/auth/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { AuthorForm } from "../components/author-form/author-form";
import { NOVEL_ROUTES } from "../constants/routes";
import { useAuthor } from "../hooks/use-author";
import { AUTHOR_PERMISSIONS } from "../permissions/author-permission";

/**
 * Giao diện chi tiết và cập nhật tác giả.
 *
 * @param props - ID tác giả và slot lịch sử thay đổi.
 * @returns Khối giao diện form tác giả kèm lịch sử.
 */
export function AuthorDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const t = useTranslations("novel.authors");
  const canRead = usePermission(AUTHOR_PERMISSIONS.read);
  const canUpdate = usePermission(AUTHOR_PERMISSIONS.update);

  const query = useAuthor(id, canRead);

  if (!canRead) return <ForbiddenView />;
  if (query.isPending || !query.data)
    return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={NOVEL_ROUTES.adminAuthors}
      />
    );
  }

  return (
    <FormPage title={query.data.name || t("editTitle")}>
      <AuthorForm author={query.data} disabled={!canUpdate} />
      {history ? <div className="mt-6">{history}</div> : null}
    </FormPage>
  );
}
