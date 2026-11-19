"use client";

import { useTranslations } from "next-intl";

import { ActivityTimeline } from "@/shares/components/common/activity-timeline/activity-timeline";
import { FormSection } from "@/shares/components/common/form-layout/components/form-section";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import type { MessageKey } from "@/shares/types/navigation.types";

import { useRecordHistory } from "../../hooks/use-record-history";
import { useRecordHistoryItems } from "./hooks/use-record-history-items";

/**
 * Card "Lịch sử thay đổi" của một bản ghi. Module nghiệp vụ không import journal: page ghép component này
 * vào slot `history` của trang chi tiết, truyền path `…/{id}/history` và tiền tố nhãn field của module.
 *
 * @param props - Path lịch sử, tiền tố khóa dịch nhãn field.
 * @returns Card lịch sử.
 */
export function RecordHistory({ path, fieldPrefix }: { path: string; fieldPrefix: MessageKey }) {
  const t = useTranslations("journal");
  const errorMessage = useApiErrorMessage();
  const query = useRecordHistory(path);
  const items = useRecordHistoryItems(query.data, fieldPrefix);
  return (
    <FormSection title={t("history")}>
      {query.isPending ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : query.isError ? (
        <ErrorState message={errorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : (
        <ActivityTimeline items={items} emptyTitle={t("empty")} />
      )}
    </FormSection>
  );
}
