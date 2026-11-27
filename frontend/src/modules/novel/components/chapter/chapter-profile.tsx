"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { FormPage } from "@/shares/components/common/form-page";
import { RecordDetailTabs } from "@/shares/components/common/record-detail-tabs";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { NOVEL_ROUTES } from "../../constants/routes";
import { ChapterForm } from "./chapter-form";
import { useChapterProfile } from "./hooks/use-chapter-profile";

/**
 * Hồ sơ chương truyện: tải bản ghi, hiển thị Skeleton khi đang tải, `QueryErrorState` khi lỗi (404 → về danh sách),
 * rồi form chi tiết (chỉ đọc khi không ở chế độ sửa) kèm slot lịch sử.
 *
 * @param props - ID bản ghi, có được sửa không, slot lịch sử thay đổi.
 * @returns Form chi tiết chương truyện.
 */
export function ChapterProfile({
  id,
  canEdit,
  history,
}: {
  id: string;
  canEdit: boolean;
  history?: ReactNode;
}) {
  const t = useTranslations("novel.chapters");
  const { query } = useChapterProfile(id);

  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={NOVEL_ROUTES.adminChapters}
      />
    );
  }
  if (query.isPending || !query.data)
    return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;

  return (
    <FormPage title={query.data.title || t("editTitle")} backHref={NOVEL_ROUTES.adminChapters}>
      <RecordDetailTabs
        general={<ChapterForm chapter={query.data} disabled={!canEdit} />}
        history={history}
      />
    </FormPage>
  );
}
