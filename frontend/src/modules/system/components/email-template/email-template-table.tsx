"use client";

import type { ComponentProps } from "react";
import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { TimestampText } from "@/shares/components/common/timestamp-text";
import { Badge } from "@/shares/components/ui/badge";
import { formatUserDisplayName } from "@/shares/lib/user-display";

import { SYSTEM_ROUTES } from "../../constants/routes";
import type { EmailTemplate } from "../../types/email-template.types";
import { useEmailTemplateTable } from "./hooks/use-email-template-table";

type RouteContext = "admin" | "portal";

/**
 * Bảng danh sách mẫu email: hỗ trợ lọc theo phạm vi (`SYSTEM`/`PERSONAL`), nhóm nghiệp vụ,
 * trạng thái; xem/sửa/xóa theo quyền và nhân bản mẫu hệ thống thành mẫu cá nhân.
 *
 * @param props - Quyền thao tác, cờ hiện chủ sở hữu và ngữ cảnh điều hướng.
 * @returns Bảng dữ liệu mẫu email.
 */
export function EmailTemplateTable({
  canCreate,
  canUpdate,
  canDelete,
  showOwner,
  routeContext = "admin",
}: {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManageAll: boolean;
  showOwner: boolean;
  routeContext?: RouteContext;
}) {
  const t = useTranslations("system.emailTemplates");
  const state = useEmailTemplateTable({ routeContext });
  const { table, query } = state;

  const getTargetHref = (id: string): ComponentProps<typeof Link>["href"] =>
    (routeContext === "portal"
      ? { pathname: "/portal/email-templates/[id]" as const, params: { id } }
      : SYSTEM_ROUTES.emailTemplateDetail(id)) as ComponentProps<typeof Link>["href"];

  const statusVariant = (status: EmailTemplate["status"]) => {
    if (status === "ACTIVE") return "default" as const;
    if (status === "DRAFT") return "secondary" as const;
    return "outline" as const;
  };

  const columns: DataTableColumn<EmailTemplate>[] = [
    {
      id: "name",
      header: t("fields.name"),
      sortKey: "name",
      mobile: "title",
      cell: (row) => (
        <div className="min-w-0">
          <Link href={getTargetHref(row.id)} className="font-medium hover:underline">
            {row.name}
          </Link>
          <p className="text-muted-foreground font-mono text-xs">{row.code}</p>
        </div>
      ),
    },
    {
      id: "scope",
      header: t("fields.scope"),
      cell: (row) => (
        <Badge variant={row.scope === "SYSTEM" ? "secondary" : "outline"}>
          {t(`scopes.${row.scope}`)}
        </Badge>
      ),
    },
    {
      id: "category",
      header: t("fields.category"),
      cell: (row) => <span className="text-sm">{t(`categories.${row.category}`)}</span>,
    },
    {
      id: "status",
      header: t("fields.status"),
      cell: (row) => (
        <Badge variant={statusVariant(row.status)}>{t(`statuses.${row.status}`)}</Badge>
      ),
    },
    ...(showOwner
      ? [
          {
            id: "owner",
            header: t("fields.owner"),
            cell: (row: EmailTemplate) =>
              row.owner ? (
                <span className="text-sm">{formatUserDisplayName(row.owner)}</span>
              ) : (
                <span className="text-muted-foreground text-xs">{t("scopes.SYSTEM")}</span>
              ),
          } satisfies DataTableColumn<EmailTemplate>,
        ]
      : []),
    {
      id: "updatedAt",
      header: t("fields.updatedAt"),
      sortKey: "updated_at",
      cell: (row) => <TimestampText value={row.updatedAt} />,
    },
  ];

  return (
    <DataTable
      tableId="email-templates"
      columns={columns}
      rows={query.data?.items}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.name}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label={t("fields.scope")}
            value={table.getFilterValues("scope")}
            onValueChange={(values) => table.setFilterValues("scope", values)}
            options={[
              { value: "SYSTEM", label: t("scopes.SYSTEM") },
              { value: "PERSONAL", label: t("scopes.PERSONAL") },
            ]}
          />
          <FilterSelect
            label={t("fields.category")}
            value={table.getFilterValues("category")}
            onValueChange={(values) => table.setFilterValues("category", values)}
            options={[
              { value: "FEEDBACK_THANKS", label: t("categories.FEEDBACK_THANKS") },
              ...(routeContext === "admin"
                ? [
                    { value: "AUTH", label: t("categories.AUTH") },
                    { value: "NOTIFICATION", label: t("categories.NOTIFICATION") },
                  ]
                : []),
              { value: "CUSTOM", label: t("categories.CUSTOM") },
            ]}
          />
          <FilterSelect
            label={t("fields.status")}
            value={table.getFilterValues("status")}
            onValueChange={(values) => table.setFilterValues("status", values)}
            options={[
              { value: "ACTIVE", label: t("statuses.ACTIVE") },
              { value: "DRAFT", label: t("statuses.DRAFT") },
              { value: "ARCHIVED", label: t("statuses.ARCHIVED") },
            ]}
          />
        </div>
      }
      ordering={table.ordering}
      onOrderingChange={table.onOrderingChange}
      isLoading={query.isPending}
      isFetching={query.isFetching && !query.isPending}
      error={query.isError ? { onRetry: () => query.refetch() } : null}
      empty={{ title: t("empty") }}
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
      onView={state.view}
      onEdit={state.edit}
      onDelete={state.remove}
      can={{
        update: canUpdate,
        delete: canDelete,
      }}
      rowActions={
        canCreate
          ? [
              {
                key: "duplicate",
                label: t("actions.duplicate"),
                icon: Copy,
                onClick: state.duplicateRow,
              },
            ]
          : undefined
      }
      onBulkDelete={canDelete ? state.bulkRemove : undefined}
    />
  );
}
