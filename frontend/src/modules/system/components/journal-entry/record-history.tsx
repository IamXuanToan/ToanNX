"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { ActivityTimeline } from "@/shares/components/common/activity-timeline";
import { FormSection } from "@/shares/components/common/form-section";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import type { ActivityTimelineFilterOption } from "@/shares/types/activity-timeline.types";
import type { HistoryEntry } from "@/shares/types/api.types";
import type { MessageKey } from "@/shares/types/navigation.types";

import { useRecordHistory } from "../../hooks/use-record-history";
import { useRecordHistoryItems } from "./hooks/use-record-history-items";

const FILTER_ACTION_ORDER: readonly HistoryEntry["action"][] = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "EVENT",
];

/**
 * Khối "Lịch sử thay đổi" của một bản ghi dùng chung toàn hệ thống qua `RecordHistoryView`.
 * Hỗ trợ bộ lọc theo loại hành động, tải thêm 10 mục cũ hơn mỗi lần bấm và hiển thị chuẩn UI/UX.
 *
 * @param props - Path lịch sử (`…/{id}/history`) và tiền tố khóa dịch nhãn field của module.
 * @returns Card lịch sử thay đổi.
 */
export function RecordHistory({ path, fieldPrefix }: { path: string; fieldPrefix: MessageKey }) {
  const t = useTranslations("system.journal");
  const tTimeline = useTranslations("common.timeline");
  const errorMessage = useApiErrorMessage();
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  const query = useRecordHistory(path);
  const filteredEntries = useMemo(() => {
    if (actionFilter === "ALL") return query.entries;
    return query.entries.filter((entry) => entry.action === actionFilter);
  }, [query.entries, actionFilter]);

  const items = useRecordHistoryItems(filteredEntries, fieldPrefix);

  const filterOptions = useMemo<ActivityTimelineFilterOption[]>(() => {
    if (query.entries.length <= 1) return [];
    const counts = new Map<HistoryEntry["action"], number>();
    for (const entry of query.entries) {
      counts.set(entry.action, (counts.get(entry.action) ?? 0) + 1);
    }
    const actionFilters = FILTER_ACTION_ORDER.filter((action) => counts.has(action)).map(
      (action) => ({
        value: action,
        label: t(`actionBadges.${action}`),
        count: counts.get(action),
      }),
    );
    if (actionFilters.length <= 1) return [];
    return [
      { value: "ALL", label: tTimeline("allActions"), count: query.entries.length },
      ...actionFilters,
    ];
  }, [query.entries, t, tTimeline]);

  return (
    <FormSection title={t("history")}>
      <ActivityTimeline
        items={items}
        emptyTitle={t("empty")}
        emptyDescription={t("emptyHint")}
        isLoading={query.isPending}
        isError={query.isError}
        errorMessage={query.isError ? errorMessage(query.error) : undefined}
        onRetry={() => void query.refetch()}
        filterOptions={filterOptions}
        activeFilter={actionFilter}
        onFilterChange={setActionFilter}
        totalCount={query.total > 0 ? query.total : undefined}
        hasMore={Boolean(query.hasNextPage)}
        onLoadMore={() => void query.fetchNextPage()}
        isLoadingMore={query.isFetchingNextPage}
      />
    </FormSection>
  );
}
