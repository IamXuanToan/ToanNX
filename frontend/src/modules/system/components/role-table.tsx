"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { TableStatusSwitch } from "@/shares/components/common/table-status-switch";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { Badge } from "@/shares/components/ui/badge";

import { SYSTEM_ROUTES } from "../constants/routes";
import type { Role } from "../types/iam.types";
import { useRoleTable } from "./hooks/use-role-table";

/**
 * Bảng vai trò: tìm, sắp xếp, ghim cột, phân trang; cột Trạng thái bật/tắt; Thao tác: Sửa, Sao chép, Xoá;
 * thao tác hàng loạt.
 * Thao tác nào hiện tuỳ quyền view truyền xuống.
 *
 * @param props - Quyền tạo, sửa và xoá của người xem.
 * @returns Bảng vai trò.
 */
export function RoleTable({
  canCreate,
  canUpdate,
  canDelete,
}: {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const t = useTranslations("system.iam.roles");
  const tStatus = useTranslations("common.status");
  const { query, table, view, edit, copy, setActive, remove, bulkSetActive, bulkDelete } =
    useRoleTable();

  const columns: DataTableColumn<Role>[] = [
    {
      id: "role",
      header: t("columns.role"),
      sortKey: "name",
      mobile: "title",
      className: "md:w-full",
      cell: (role) => (
        <div className="min-w-0">
          <Link
            href={SYSTEM_ROUTES.roleDetail(role.id)}
            className="hover:text-primary block truncate font-medium underline-offset-4 hover:underline"
          >
            {role.name}
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground truncate font-mono text-xs">{role.code}</span>
            {role.isSystem ? <Badge variant="outline">{t("system")}</Badge> : null}
          </div>
        </div>
      ),
    },
    {
      id: "permissions",
      header: t("columns.permissions"),
      sortKey: "permission_count",
      align: "end",
      cell: (role) => <span className="tabular-nums">{role.permissionCount}</span>,
    },
    {
      id: "users",
      header: t("columns.users"),
      sortKey: "user_count",
      align: "end",
      cell: (role) => <span className="tabular-nums">{role.userCount}</span>,
    },
    {
      id: "status",
      header: t("columns.status"),
      sortKey: "is_active",
      cell: (role) => (
        <TableStatusSwitch
          checked={role.isActive}
          onLabel={tStatus("active")}
          offLabel={tStatus("inactive")}
          aria-label={role.isActive ? t("actions.deactivate") : t("actions.activate")}
          onCheckedChange={
            canUpdate && !role.isSystem ? (checked) => setActive(role, checked) : undefined
          }
        />
      ),
    },
  ];

  return (
    <DataTable
      tableId="iam-roles"
      columns={columns}
      rows={query.data?.items}
      getRowId={(role) => role.id}
      getRowLabel={(role) => role.name}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <>
          <FilterSelect
            label={t("columns.status")}
            value={table.getFilterValues("isActive")}
            onValueChange={(values) => table.setFilterValues("isActive", values)}
            options={[
              { value: "true", label: tStatus("active") },
              { value: "false", label: tStatus("inactive") },
            ]}
          />
          <FilterSelect
            label={t("filters.type")}
            value={table.getFilterValues("isSystem")}
            onValueChange={(values) => table.setFilterValues("isSystem", values)}
            options={[
              { value: "true", label: t("system") },
              { value: "false", label: t("filters.custom") },
            ]}
          />
          <FilterSelect
            label={t("filters.policy")}
            value={table.getFilterValues("autoGrant")}
            onValueChange={(values) => table.setFilterValues("autoGrant", values)}
            options={[
              { value: "none", label: t("policies.none") },
              { value: "all", label: t("policies.all") },
              { value: "read_only", label: t("policies.read_only") },
            ]}
          />
        </>
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
      onView={view}
      onEdit={edit}
      onCopy={copy}
      onDelete={remove}
      can={{ update: canUpdate, create: canCreate, delete: canDelete }}
      canDeleteRow={(role) => !role.isSystem}
      canSelectRow={(role) => !role.isSystem}
      bulkStatus={
        canUpdate
          ? {
              options: [
                { value: "active", label: tStatus("active") },
                { value: "inactive", label: tStatus("inactive") },
              ],
              onChange: (roles, value) => bulkSetActive(roles, value === "active"),
            }
          : undefined
      }
      onBulkDelete={canDelete ? bulkDelete : undefined}
      aria-label={t("title")}
    />
  );
}
