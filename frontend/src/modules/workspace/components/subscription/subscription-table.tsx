"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { TableStatusSwitch } from "@/shares/components/common/table-status-switch";
import { DEFAULT_CURRENCY } from "@/shares/constants/currency";
import { createBooleanBulkStatus } from "@/shares/lib/bulk-status";
import { formatExplicitDate } from "@/shares/lib/date-time-format";
import { formatDisplayMoney } from "@/shares/lib/number-format";
import { formatOwnerDisplayName, formatOwnerDisplayTooltip } from "@/shares/lib/user-display";

import { BILLING_CYCLES, SUBSCRIPTION_CATEGORIES } from "../../constants/defaults";
import { WORKSPACE_ROUTES } from "../../constants/routes";
import type { Subscription } from "../../types/subscription.types";
import { useSubscriptionTable } from "./hooks/use-subscription-table";
import { SubscriptionRenewDialog } from "./subscription-renew-dialog";

/** @param props - Quyền sửa/xóa. @returns Bảng Dịch vụ định kỳ + Gia hạn + đổi trạng thái hàng loạt. */
export function SubscriptionTable({
  canUpdate,
  canDelete,
}: {
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const t = useTranslations("workspace.subscriptions");
  const tCommon = useTranslations("workspace.common");
  const state = useSubscriptionTable();
  const { table, query } = state;

  const columns: DataTableColumn<Subscription>[] = [
    {
      id: "name",
      header: t("fields.name"),
      sortKey: "name",
      mobile: "title",
      className: "md:w-full",
      cell: (item) => (
        <div className="min-w-0">
          <Link
            href={WORKSPACE_ROUTES.subscriptionDetail(item.id)}
            className="hover:text-primary font-medium underline-offset-4 hover:underline"
          >
            {item.name}
          </Link>
          {item.provider ? (
            <p className="text-muted-foreground truncate text-xs">{item.provider}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "category",
      header: t("fields.category"),
      cell: (item) => t(`categories.${item.category}`),
    },
    {
      id: "billingCycle",
      header: t("fields.billingCycle"),
      hideBelow: "lg",
      cell: (item) => t(`cycles.${item.billingCycle}`),
    },
    {
      id: "renewDate",
      header: t("fields.renewDate"),
      sortKey: "renew_date",
      cell: (item) => (
        <span className="whitespace-nowrap tabular-nums">{formatExplicitDate(item.renewDate)}</span>
      ),
    },
    {
      id: "amountVnd",
      header: t("fields.amountVnd"),
      sortKey: "amount_vnd",
      align: "end",
      cell: (item) => (
        <span className="tabular-nums">
          {formatDisplayMoney(item.amountVnd, { currency: DEFAULT_CURRENCY })}
        </span>
      ),
    },
    {
      id: "isActive",
      header: t("fields.isActive"),
      cell: (item) => (
        <TableStatusSwitch
          checked={item.isActive}
          onLabel={tCommon("active")}
          offLabel={tCommon("inactive")}
          aria-label={t("fields.isActive")}
          onCheckedChange={
            canUpdate ? (checked) => void state.toggleActive(item, checked) : undefined
          }
        />
      ),
    },
    ...(state.canManageAll
      ? [
          {
            id: "owner",
            header: tCommon("owner"),
            hideBelow: "xl" as const,
            cell: (item: Subscription) => {
              const ownerLabel = formatOwnerDisplayName(item);
              return (
                <AppTooltip content={formatOwnerDisplayTooltip(item)}>
                  <span className="text-muted-foreground block max-w-44 truncate">
                    {ownerLabel || "—"}
                  </span>
                </AppTooltip>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <>
      <DataTable
        tableId="workspace-subscriptions"
        columns={columns}
        rows={query.data?.items}
        getRowId={(item) => item.id}
        getRowLabel={(item) => item.name}
        search={{ ...table.search, placeholder: t("searchPlaceholder") }}
        onClearFilters={table.hasFilters ? table.clearFilters : undefined}
        filters={
          <>
            <FilterSelect
              label={t("fields.category")}
              value={table.getFilterValues("category")}
              onValueChange={(values) => table.setFilterValues("category", values)}
              options={SUBSCRIPTION_CATEGORIES.map((c) => ({
                value: c,
                label: t(`categories.${c}`),
              }))}
            />
            <FilterSelect
              label={t("fields.billingCycle")}
              value={table.getFilterValues("billingCycle")}
              onValueChange={(values) => table.setFilterValues("billingCycle", values)}
              options={BILLING_CYCLES.map((c) => ({ value: c, label: t(`cycles.${c}`) }))}
            />
            <FilterSelect
              label={t("fields.isActive")}
              value={table.getFilterValues("isActive")}
              onValueChange={(values) => table.setFilterValues("isActive", values.slice(-1))}
              options={[
                { value: "true", label: tCommon("active") },
                { value: "false", label: tCommon("inactive") },
              ]}
            />
            {state.canFilterOwner ? (
              <FilterSelect
                label={tCommon("owner")}
                value={table.getFilterValues("owner")}
                onValueChange={(values) => table.setFilterValues("owner", values.slice(-1))}
                options={state.ownerOptions}
              />
            ) : null}
          </>
        }
        ordering={table.ordering}
        onOrderingChange={table.onOrderingChange}
        isLoading={query.isPending}
        isFetching={query.isFetching && !query.isPending}
        error={query.isError ? { onRetry: () => query.refetch() } : null}
        empty={{ title: tCommon("noData") }}
        onReload={() => query.refetch()}
        pagination={
          query.data
            ? {
                value: query.data.pagination,
                onPageChange: table.onPageChange,
                onPageSizeChange: table.onPageSizeChange,
              }
            : undefined
        }
        rowActions={
          canUpdate
            ? [
                {
                  key: "renew",
                  label: t("renew"),
                  icon: RefreshCw,
                  onClick: (item) => state.setRenewTarget(item),
                },
              ]
            : undefined
        }
        onView={state.view}
        onEdit={state.edit}
        onDelete={state.remove}
        can={{ update: canUpdate, delete: canDelete }}
        onBulkDelete={canDelete ? state.bulkDelete : undefined}
        bulkStatus={
          canUpdate
            ? createBooleanBulkStatus(
                { on: tCommon("active"), off: tCommon("inactive") },
                state.bulkSetActive,
              )
            : undefined
        }
        aria-label={t("title")}
      />

      {state.renewTarget ? (
        <SubscriptionRenewDialog
          subscription={state.renewTarget}
          open={Boolean(state.renewTarget)}
          onOpenChange={(open) => {
            if (!open) state.setRenewTarget(null);
          }}
        />
      ) : null}
    </>
  );
}
