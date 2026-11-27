"use client";

import { History, Loader2 } from "lucide-react";
import { cn } from "cn";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { EmptyState } from "@/shares/components/common/empty-state";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Skeleton } from "@/shares/components/ui/skeleton";
import type {
  ActivityChange,
  ActivityItem,
  ActivityTimelineFilterOption,
  ActivityTone,
} from "@/shares/types/activity-timeline.types";

import { ActivityTimelineItem } from "./activity-timeline-item";

export type { ActivityChange, ActivityItem, ActivityTimelineFilterOption, ActivityTone };

/**
 * Component dòng thời gian lịch sử thay đổi dùng chung toàn hệ thống (không phụ thuộc API module):
 * hỗ trợ đủ 5 trạng thái (`isLoading`, `isError`, `empty`, lọc theo hành động, tải thêm dữ liệu cũ hơn).
 *
 * @param props - Danh sách mốc sự kiện (mới nhất trước), bộ lọc tùy chọn và callback tải thêm.
 * @returns Khối dòng thời gian chuẩn UI/UX.
 */
export function ActivityTimeline({
  items,
  emptyTitle,
  emptyDescription,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  filterOptions,
  activeFilter,
  onFilterChange,
  totalCount,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}: {
  items: ActivityItem[];
  emptyTitle: ReactNode;
  emptyDescription?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  filterOptions?: ActivityTimelineFilterOption[];
  activeFilter?: string;
  onFilterChange?: (value: string) => void;
  totalCount?: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}) {
  const t = useTranslations("common.timeline");

  if (isLoading) {
    return (
      <div className="space-y-5" aria-busy="true">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex gap-3 sm:gap-3.5">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Skeleton className="h-4 w-56 rounded-md" />
                <Skeleton className="h-3.5 w-36 rounded-md" />
              </div>
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError && errorMessage) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />;
  }

  const hasToolbar = Boolean(
    (filterOptions && filterOptions.length > 0 && onFilterChange) || totalCount !== undefined,
  );
  const isFiltered = Boolean(activeFilter && activeFilter !== "ALL");

  if (!items.length && !isFiltered) {
    return (
      <EmptyState
        icon={<History className="size-6" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-5">
      {hasToolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b pb-3.5">
          {filterOptions && filterOptions.length > 0 && onFilterChange ? (
            <div className="flex flex-wrap items-center gap-1.5" role="group">
              {filterOptions.map((option) => {
                const selected = (activeFilter ?? "ALL") === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={selected ? "secondary" : "ghost"}
                    onClick={() => onFilterChange(option.value)}
                    className={cn(
                      "h-8 rounded-lg px-2.5 text-xs font-medium",
                      selected
                        ? "bg-primary-light text-primary hover:bg-primary-light/90"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span>{option.label}</span>
                    {option.count !== undefined ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "ml-1.5 h-4 min-w-4 rounded px-1 text-[10px] tabular-nums",
                          selected ? "border-primary/30 text-primary" : "border-border",
                        )}
                      >
                        {option.count}
                      </Badge>
                    ) : null}
                  </Button>
                );
              })}
            </div>
          ) : (
            <div />
          )}

          {totalCount !== undefined ? (
            <span className="text-muted-foreground text-xs tabular-nums">
              {t("totalEvents", { count: totalCount })}
            </span>
          ) : null}
        </div>
      ) : null}

      {!items.length && isFiltered ? (
        <EmptyState
          icon={<History className="size-6" />}
          title={t("filteredEmpty")}
          action={
            onFilterChange ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onFilterChange("ALL")}
              >
                {t("resetFilter")}
              </Button>
            ) : null
          }
        />
      ) : (
        <ol className="text-sm">
          {items.map((item, index) => (
            <ActivityTimelineItem
              key={item.id}
              item={item}
              showConnector={index < items.length - 1}
            />
          ))}
        </ol>
      )}

      {hasMore && onLoadMore ? (
        <div className="ml-8 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="text-muted-foreground hover:text-foreground h-9 gap-2 px-3 text-xs font-medium"
          >
            {isLoadingMore ? <Loader2 className="size-3.5 animate-spin" /> : null}
            <span>{t("loadMore")}</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
