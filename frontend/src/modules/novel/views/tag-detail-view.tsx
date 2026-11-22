/**
 * Trang chi tiết/chỉnh sửa thẻ truyện (`/admin/tags/[id]`).
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

import { TagForm } from "../components/tag-form";
import { NOVEL_ROUTES } from "../constants/routes";
import { useTag } from "../hooks/use-tag";
import { TAG_PERMISSIONS } from "../permissions/tag-permission";

/**
 * Giao diện chi tiết và cập nhật thẻ truyện.
 *
 * @param props - ID thẻ và slot lịch sử thay đổi.
 * @returns Khối giao diện form thẻ kèm lịch sử.
 */
export function TagDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const t = useTranslations("novel.tags");
  const canRead = usePermission(TAG_PERMISSIONS.read);
  const canUpdate = usePermission(TAG_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);

  const query = useTag(id, canRead);

  if (!canRead) return <ForbiddenView />;
  if (query.isPending || !query.data)
    return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={NOVEL_ROUTES.adminTags}
      />
    );
  }

  return (
    <EditModeProvider canEdit={canUpdate}>
      <FormPage title={query.data.name || t("editTitle")}>
        <TagForm tag={query.data} disabled={!isEditing} />
        {history ? <div className="mt-6">{history}</div> : null}
      </FormPage>
    </EditModeProvider>
  );
}
