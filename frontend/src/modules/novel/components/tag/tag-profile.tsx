"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { FormPage } from "@/shares/components/common/form-page";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { NOVEL_ROUTES } from "../../constants/routes";
import { TagForm } from "./tag-form";
import { useTagProfile } from "./hooks/use-tag-profile";

/**
 * Hồ sơ thẻ truyện: tải bản ghi, hiển thị Skeleton khi đang tải, `QueryErrorState` khi lỗi (404 → về danh sách),
 * rồi form chi tiết (chỉ đọc khi không ở chế độ sửa) kèm slot lịch sử.
 *
 * @param props - ID bản ghi, có được sửa không, slot lịch sử thay đổi.
 * @returns Form chi tiết thẻ truyện.
 */
export function TagProfile({
  id,
  canEdit,
  history,
}: {
  id: string;
  canEdit: boolean;
  history?: ReactNode;
}) {
  const t = useTranslations("novel.tags");
  const { query } = useTagProfile(id);

  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={NOVEL_ROUTES.adminTags}
      />
    );
  }
  if (query.isPending || !query.data)
    return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;

  return (
    <FormPage title={query.data.name || t("editTitle")}>
      <TagForm tag={query.data} disabled={!canEdit} />
      {history ? <div className="mt-6">{history}</div> : null}
    </FormPage>
  );
}
