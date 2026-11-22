"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { FormPage } from "@/shares/components/common/form-page";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { NOVEL_ROUTES } from "../../constants/routes";
import { AuthorForm } from "./author-form";
import { useAuthorProfile } from "./hooks/use-author-profile";

/**
 * Hồ sơ tác giả: tải bản ghi, hiển thị Skeleton khi đang tải, `QueryErrorState` khi lỗi (404 → về danh sách),
 * rồi form chi tiết (chỉ đọc khi không ở chế độ sửa) kèm slot lịch sử.
 *
 * @param props - ID bản ghi, có được sửa không, slot lịch sử thay đổi.
 * @returns Form chi tiết tác giả.
 */
export function AuthorProfile({
  id,
  canEdit,
  history,
}: {
  id: string;
  canEdit: boolean;
  history?: ReactNode;
}) {
  const t = useTranslations("novel.authors");
  const { query } = useAuthorProfile(id);

  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={NOVEL_ROUTES.adminAuthors}
      />
    );
  }
  if (query.isPending || !query.data)
    return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;

  return (
    <FormPage title={query.data.name || t("editTitle")}>
      <AuthorForm author={query.data} disabled={!canEdit} />
      {history ? <div className="mt-6">{history}</div> : null}
    </FormPage>
  );
}
