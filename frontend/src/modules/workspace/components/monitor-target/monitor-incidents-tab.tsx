"use client";

import { useFormatter, useTranslations } from "next-intl";

import { StatusBadge } from "@/shares/components/common/status-badge";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { useMonitorIncidents } from "../../hooks/use-monitor-incidents";

/**
 * Tab Lịch sử sự cố bên trong trang Chi tiết endpoint Uptime.
 *
 * @param props - ID endpoint Uptime.
 * @returns Danh sách sự cố DOWN/RECOVERED của endpoint.
 */
export function MonitorIncidentsTab({ targetId }: { targetId: string }) {
  const t = useTranslations("workspace.monitorIncidents");
  const tCommon = useTranslations("workspace.common");
  const format = useFormatter();

  const query = useMonitorIncidents({ target: targetId, pageSize: 50 });

  if (query.isPending) return <Skeleton className="h-32 w-full rounded-xl" />;
  const items = query.data?.items ?? [];
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border p-6 text-center text-sm">
        {tCommon("noData")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((inc) => (
        <div
          key={inc.id}
          className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
        >
          <div className="min-w-0 space-y-1">
            <p className="font-medium">
              {format.dateTime(new Date(inc.startedAt), {
                dateStyle: "short",
                timeStyle: "short",
              })}
              {inc.resolvedAt
                ? ` → ${format.dateTime(new Date(inc.resolvedAt), {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}`
                : ""}
            </p>
            <p className="text-muted-foreground text-xs">{inc.errorMessage || "—"}</p>
          </div>
          <div className="flex items-center gap-2">
            {inc.durationSeconds !== null ? (
              <span className="text-muted-foreground text-xs tabular-nums">
                {t("durationSeconds", { seconds: inc.durationSeconds })}
              </span>
            ) : null}
            <StatusBadge tone={inc.resolvedAt ? "success" : "danger"}>
              {inc.resolvedAt ? t("resolved") : t("ongoing")}
            </StatusBadge>
          </div>
        </div>
      ))}
    </div>
  );
}
