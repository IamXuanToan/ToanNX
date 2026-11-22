/**
 * Trang chi tiết/chỉnh sửa chương truyện (`/admin/chapters/[id]`).
 */

"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { ChapterForm } from "../components/chapter-form";
import { NOVEL_ROUTES } from "../constants/routes";
import { useChapter } from "../hooks/use-chapter";
import { CHAPTER_PERMISSIONS } from "../permissions/chapter-permission";

/**
 * Giao diện chi tiết và cập nhật chương truyện.
 *
 * @param props - ID chương và slot lịch sử thay đổi.
 * @returns Khối giao diện form chương truyện kèm lịch sử.
 */
export function ChapterDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const t = useTranslations("novel.chapters");
  const canRead = usePermission(CHAPTER_PERMISSIONS.read);
  const canUpdate = usePermission(CHAPTER_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);

  const query = useChapter(id, canRead);

  if (!canRead) return <ForbiddenView />;
  if (query.isPending || !query.data)
    return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={NOVEL_ROUTES.adminChapters}
      />
    );
  }

  return (
    <EditModeProvider canEdit={canUpdate}>
      <FormPage title={query.data.title || t("editTitle")}>
        <ChapterForm chapter={query.data} disabled={!isEditing} />
        {history ? <div className="mt-6">{history}</div> : null}
      </FormPage>
    </EditModeProvider>
  );
}
