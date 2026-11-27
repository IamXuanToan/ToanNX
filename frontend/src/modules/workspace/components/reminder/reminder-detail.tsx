"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page";
import { RecordDetailTabs } from "@/shares/components/common/record-detail-tabs";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { WORKSPACE_ROUTES } from "../../constants/routes";
import { useReminderDetail } from "./hooks/use-reminder-detail";
import { ReminderForm } from "./reminder-form";

/**
 * Trang chi tiết Nhắc việc cá nhân (Tab Thông tin chung + Lịch sử thay đổi).
 *
 * @param props - ID nhắc việc, quyền sửa, slot lịch sử.
 * @returns Chi tiết Nhắc việc.
 */
export function ReminderDetail({
  id,
  canUpdate,
  history,
}: {
  id: string;
  canUpdate: boolean;
  history?: ReactNode;
}) {
  const t = useTranslations("workspace.reminders");
  const { query } = useReminderDetail(id);

  if (query.isPending) return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={WORKSPACE_ROUTES.reminders}
      />
    );
  }

  return (
    <FormPage title={query.data.title || t("editTitle")} backHref={WORKSPACE_ROUTES.reminders}>
      <RecordDetailTabs
        general={<ReminderForm reminder={query.data} disabled={!canUpdate} />}
        history={history}
      />
    </FormPage>
  );
}
