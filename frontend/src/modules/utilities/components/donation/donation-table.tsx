"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, ShieldAlert } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { TableStatusSwitch } from "@/shares/components/common/table-status-switch";
import { TimestampText } from "@/shares/components/common/timestamp-text";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shares/components/ui/tooltip";
import { env } from "@/shares/config/env";
import { CURRENCY_SYMBOLS } from "@/shares/constants/currency";
import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { useTableState } from "@/shares/hooks/use-table-state";
import { createBooleanBulkStatus } from "@/shares/lib/bulk-status";
import { toSafeHttpUrl } from "@/shares/lib/safe-url";

import { donationKeys } from "../../constants/query-keys";
import { DONATION_PERMISSIONS } from "../../permissions/donation-permission";
import { donationService } from "../../services/donation.service";
import type { DonationTier, DonationTransaction } from "../../types/donation.types";

const TIER_BADGE_CLASSES: Record<DonationTier, string> = {
  NORMAL: "bg-muted text-muted-foreground border-transparent",
  BRONZE: "bg-amber-600/10 text-amber-700 dark:text-amber-400 border-amber-600/30 font-semibold",
  SILVER: "bg-slate-300/30 text-slate-700 dark:text-slate-300 border-slate-400/40 font-semibold",
  GOLD: "bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/40 font-bold",
  DIAMOND: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/40 font-extrabold",
};

export function DonationTable({
  ownerId,
  pageId,
  canUpdate = false,
  dateFrom,
  dateTo,
}: {
  ownerId?: string;
  pageId?: string;
  canUpdate?: boolean;
  dateFrom?: string;
  dateTo?: string;
}) {
  const queryClient = useQueryClient();
  const format = useFormatter();
  const t = useTranslations("utilities.donations");
  const canExport = usePermission(DONATION_PERMISSIONS.export);

  const tableState = useTableState({
    filterKeys: ["tier", "status"] as const,
  });

  const selectedTier = tableState.getFilterValues("tier");
  const statusFilter = tableState.getFilterValues("status");

  const queryParams = {
    page: tableState.filters.page,
    pageSize: tableState.filters.pageSize,
    search: tableState.filters.search || undefined,
    ordering: tableState.filters.ordering,
    owner: ownerId,
    page_id: pageId,
    tier: selectedTier.length > 0 ? selectedTier : undefined,
    isCensored: statusFilter.includes("censored") ? true : undefined,
    isHidden: statusFilter.includes("hidden") ? true : undefined,
    dateFrom,
    dateTo,
  };

  const { data, isLoading } = useQuery({
    queryKey: donationKeys.list(queryParams),
    queryFn: ({ signal }) => donationService.list(queryParams, signal),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isHidden }: { id: string; isHidden: boolean }) =>
      donationService.toggleHidden(id, isHidden),
    onSuccess: (updated) => {
      toast.success(updated.isHidden ? t("toast.hidden") : t("toast.shown"));
      queryClient.invalidateQueries({ queryKey: donationKeys.all });
    },
    onError: () => {
      toast.error(t("toast.updateError"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => donationService.delete(id),
    onSuccess: () => {
      toast.success(t("toast.deleted"));
      queryClient.invalidateQueries({ queryKey: donationKeys.all });
    },
    onError: () => {
      toast.error(t("toast.deleteError"));
    },
  });

  const bulk = useBulkActions<DonationTransaction>({
    service: donationService,
    invalidate: [donationKeys.all],
  });

  const handleExport = () => {
    const exportUrl = `${env.apiBaseUrl}/utilities/donations/export?${new URLSearchParams(
      Object.entries({
        owner: ownerId,
        page_id: pageId,
        search: tableState.filters.search || undefined,
        tier: selectedTier.length > 0 ? selectedTier.join(",") : undefined,
        is_censored: statusFilter.includes("censored") ? "true" : undefined,
        is_hidden: statusFilter.includes("hidden") ? "true" : undefined,
        date_from: dateFrom,
        date_to: dateTo,
      }).filter(([, v]) => v !== undefined) as [string, string][],
    )}`;
    const safeExportUrl = toSafeHttpUrl(exportUrl);
    if (safeExportUrl) {
      window.open(safeExportUrl, "_blank", "noopener,noreferrer");
    }
  };

  const columns: DataTableColumn<DonationTransaction>[] = [
    {
      id: "time",
      header: t("columns.time"),
      cell: (item) => (
        <span className="text-muted-foreground font-mono text-xs whitespace-nowrap">
          <TimestampText value={item.receivedAt} />
        </span>
      ),
    },
    {
      id: "page",
      header: t("columns.page"),
      cell: (item) => (
        <div className="max-w-[120px] truncate">
          <AppTooltip content={item.pageTitle}>
            <span className="text-xs font-medium">{item.pageTitle}</span>
          </AppTooltip>
        </div>
      ),
    },
    {
      id: "donor",
      header: t("columns.donor"),
      cell: (item) => (
        <div className="space-y-0.5 whitespace-nowrap">
          <span className="text-primary text-xs font-semibold">{item.donorTitle}</span>
          <p className="text-muted-foreground font-mono text-[11px]">ID: {item.sepayId}</p>
        </div>
      ),
    },
    {
      id: "amount",
      header: t("columns.amount"),
      cell: (item) => (
        <div className="space-y-0.5 whitespace-nowrap">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
            {format.number(item.amount)} {CURRENCY_SYMBOLS.VND}
          </span>
          <p className="text-muted-foreground text-[11px]">{item.giftLabel}</p>
        </div>
      ),
    },
    {
      id: "tier",
      header: t("columns.tier"),
      cell: (item) => {
        const className = TIER_BADGE_CLASSES[item.tier] ?? TIER_BADGE_CLASSES.NORMAL;
        return (
          <Badge variant="outline" className={`${className} whitespace-nowrap`}>
            {t(`tiers.${item.tier}`)}
          </Badge>
        );
      },
    },
    {
      id: "message",
      header: t("columns.message"),
      cell: (item) => (
        <div className="max-w-xs min-w-[140px] space-y-1">
          {item.isCensored ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
              <ShieldAlert className="size-3.5 shrink-0" />
              <span>{t("censoredHidden")}</span>
            </div>
          ) : (
            <AppTooltip content={item.message || undefined} className="max-w-sm text-xs">
              <p className="line-clamp-2 text-xs leading-relaxed break-words">
                {item.message || "—"}
              </p>
            </AppTooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-muted-foreground cursor-pointer truncate font-mono text-[10px]">
                {t("originalPrefix", { content: item.originalContent })}
              </p>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm text-xs">{item.originalContent}</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
    {
      id: "status",
      header: t("columns.status"),
      cell: (item) => (
        <div className="space-y-1 whitespace-nowrap">
          {item.isCensored && (
            <Badge variant="destructive" className="block w-fit text-[10px]">
              {t("censoredBadge")}
            </Badge>
          )}
          <TableStatusSwitch
            checked={!item.isHidden}
            onLabel={t("visibleLabel")}
            offLabel={t("hiddenLabel")}
            aria-label={item.isHidden ? t("showCommentAria") : t("hideCommentAria")}
            disabled={toggleMutation.isPending || !canUpdate}
            onCheckedChange={
              canUpdate
                ? (checked) => toggleMutation.mutate({ id: item.id, isHidden: !checked })
                : undefined
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Bộ lọc thanh công cụ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label={t("filters.tier")}
            value={selectedTier}
            onValueChange={(val) => tableState.setFilterValues("tier", val)}
            options={[
              { value: "BRONZE", label: t("tierOptions.BRONZE") },
              { value: "SILVER", label: t("tierOptions.SILVER") },
              { value: "GOLD", label: t("tierOptions.GOLD") },
              { value: "DIAMOND", label: t("tierOptions.DIAMOND") },
              { value: "NORMAL", label: t("tierOptions.NORMAL") },
            ]}
          />
          <FilterSelect
            label={t("filters.status")}
            value={statusFilter}
            onValueChange={(val) => tableState.setFilterValues("status", val)}
            options={[
              { value: "censored", label: t("filters.statusCensored") },
              { value: "hidden", label: t("filters.statusHidden") },
            ]}
          />
        </div>

        {canExport ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <Download className="size-3.5" />
            <span>{t("exportCsv")}</span>
          </Button>
        ) : null}
      </div>

      {/* Bảng dữ liệu DataTable */}
      <DataTable
        tableId="donations"
        columns={columns}
        rows={data?.items}
        getRowId={(row) => row.id}
        getRowLabel={(row) =>
          `${row.donorTitle} (${format.number(row.amount)} ${CURRENCY_SYMBOLS.VND})`
        }
        isLoading={isLoading}
        pagination={
          data?.pagination
            ? {
                value: data.pagination,
                onPageChange: tableState.onPageChange,
                onPageSizeChange: tableState.onPageSizeChange,
              }
            : undefined
        }
        search={{
          value: tableState.search.value,
          onValueChange: tableState.search.onValueChange,
          placeholder: t("searchPlaceholder"),
        }}
        onDelete={(row) => deleteMutation.mutateAsync(row.id)}
        can={{ update: canUpdate, delete: canUpdate }}
        onBulkDelete={canUpdate ? bulk.bulkDelete : undefined}
        bulkStatus={
          canUpdate
            ? createBooleanBulkStatus<DonationTransaction>(
                { on: t("bulk.show"), off: t("bulk.hide") },
                (rows, on) => bulk.bulkUpdate(rows, { isHidden: !on }),
              )
            : undefined
        }
      />
    </div>
  );
}
