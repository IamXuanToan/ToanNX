"use client";

import { ExternalLink } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { DEFAULT_CURRENCY } from "@/shares/constants/currency";
import { formatDisplayMoney } from "@/shares/lib/number-format";
import { toSafeHttpUrl } from "@/shares/lib/safe-url";

import { WORKSPACE_ROUTES } from "../../constants/routes";
import type { SubscriptionPayment } from "../../types/subscription-payment.types";
import { useSubscriptionPaymentTable } from "./hooks/use-subscription-payment-table";

/** @param props - Quyền xóa và `subscriptionId` tùy chọn khi nhúng trong chi tiết dịch vụ. @returns Bảng lịch sử thanh toán gia hạn dịch vụ. */
export function SubscriptionPaymentTable({
  canDelete,
  subscriptionId,
}: {
  canDelete: boolean;
  subscriptionId?: string;
}) {
  const t = useTranslations("workspace.subscriptionPayments");
  const tCommon = useTranslations("workspace.common");
  const format = useFormatter();
  const state = useSubscriptionPaymentTable(subscriptionId);
  const { table, query } = state;

  const columns: DataTableColumn<SubscriptionPayment>[] = [
    ...(subscriptionId
      ? []
      : [
          {
            id: "subscriptionName",
            header: t("fields.subscriptionName"),
            mobile: "title" as const,
            className: "md:w-full",
            cell: (item: SubscriptionPayment) => (
              <Link
                href={WORKSPACE_ROUTES.subscriptionDetail(item.subscriptionId)}
                className="hover:text-primary font-medium underline-offset-4 hover:underline"
              >
                {item.subscriptionName}
              </Link>
            ),
          },
        ]),
    {
      id: "period",
      header: t("fields.period"),
      ...(subscriptionId
        ? { mobile: "title" as const, className: "md:w-full" }
        : { hideBelow: "lg" as const }),
      cell: (item) =>
        `${format.dateTime(new Date(item.periodFrom), { dateStyle: "short" })} → ${format.dateTime(
          new Date(item.periodTo),
          { dateStyle: "short" },
        )}`,
    },
    {
      id: "paidOn",
      header: t("fields.paidOn"),
      sortKey: "paid_on",
      cell: (item) => format.dateTime(new Date(item.paidOn), { dateStyle: "short" }),
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
      id: "receipt",
      header: t("fields.receipt"),
      hideBelow: "lg",
      cell: (item) => {
        const url = toSafeHttpUrl(item.receiptAttachment?.url);
        return url ? (
          <Link
            href={url as never}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
          >
            {item.receiptAttachment?.originalName || t("fields.receipt")}
            <ExternalLink className="size-3" aria-hidden />
          </Link>
        ) : (
          "—"
        );
      },
    },
    ...(state.canManageAll && !subscriptionId
      ? [
          {
            id: "owner",
            header: tCommon("owner"),
            hideBelow: "xl" as const,
            cell: (item: SubscriptionPayment) => (
              <span className="text-muted-foreground block max-w-44 truncate">
                {item.ownerEmail}
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <DataTable
      tableId={
        subscriptionId
          ? "workspace-subscription-detail-payments"
          : "workspace-subscription-payments"
      }
      columns={columns}
      rows={query.data?.items}
      getRowId={(item) => item.id}
      getRowLabel={(item) => `${item.subscriptionName} (${item.paidOn})`}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        subscriptionId ? undefined : (
          <>
            <FilterSelect
              label={t("fields.subscriptionName")}
              value={table.getFilterValues("subscription")}
              onValueChange={(values) => table.setFilterValues("subscription", values.slice(-1))}
              options={state.subscriptionOptions}
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
        )
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
      onDelete={state.remove}
      can={{ update: false, delete: canDelete }}
      onBulkDelete={canDelete ? state.bulkDelete : undefined}
      aria-label={t("title")}
    />
  );
}
