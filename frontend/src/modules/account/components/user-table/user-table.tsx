"use client";

import { cn } from "cn";
import { useFormatter, useNow, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { TableStatusSwitch } from "@/shares/components/common/data-table/components/table-status-switch";
import { DataTable } from "@/shares/components/common/data-table/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table/types";
import { FilterSelect } from "@/shares/components/common/filter-select/filter-select";
import { Badge } from "@/shares/components/ui/badge";
import { isOnline } from "@/shares/lib/presence";

import { ACCOUNT_ROUTES } from "../../constants/routes";
import type { User } from "../../types/account.types";
import { useUserTable } from "./hooks/use-user-table";

/**
 * Bảng người dùng: tìm, sắp xếp, ghim cột, phân trang; cột Trạng thái khoá/mở; Thao tác: Sửa, Sao chép, Xoá;
 * thao tác hàng loạt.
 * Thao tác nào hiện tuỳ quyền view truyền xuống.
 *
 * @param props - Quyền tạo, sửa và xoá của người xem.
 * @returns Bảng người dùng.
 */
export function UserTable({
  canCreate,
  canUpdate,
  canDelete,
  roleFilter,
}: {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  roleFilter?: ReactNode;
}) {
  const t = useTranslations("account.users");
  const tStatus = useTranslations("common.status");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const { query, table, isSelf, edit, copy, setActive, remove, bulkSetActive, bulkRemove } =
    useUserTable();

  const columns: DataTableColumn<User>[] = [
    {
      id: "user",
      header: t("columns.user"),
      sortKey: "email",
      mobile: "title",
      className: "md:w-full",
      cell: (user) => (
        <div className="min-w-0">
          <Link
            href={ACCOUNT_ROUTES.userDetail(user.id)}
            className="hover:text-primary block truncate font-medium underline-offset-4 hover:underline"
          >
            {user.fullName || user.email}
          </Link>
          {user.fullName ? (
            <p className="text-muted-foreground truncate text-xs">{user.email}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "access",
      header: t("columns.access"),
      sortKey: "is_superuser",
      cell: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.isSuperuser ? (
            <Badge className="bg-primary-light text-primary">{t("superuser")}</Badge>
          ) : null}
          {user.isStaff && !user.isSuperuser ? (
            <Badge variant="secondary">{t("staff")}</Badge>
          ) : null}
          {user.isNovel ? <Badge variant="outline">{t("novel")}</Badge> : null}
          {!user.isSuperuser && !user.isStaff && !user.isNovel ? (
            <span className="text-muted-foreground">—</span>
          ) : null}
        </div>
      ),
    },
    {
      id: "status",
      header: t("columns.status"),
      sortKey: "is_active",
      cell: (user) => (
        <TableStatusSwitch
          checked={user.isActive}
          onLabel={tStatus("active")}
          offLabel={tStatus("inactive")}
          aria-label={user.isActive ? t("actions.lock") : t("actions.unlock")}
          disabled={isSelf(user)}
          onCheckedChange={canUpdate ? (checked) => setActive(user, checked) : undefined}
        />
      ),
    },
    {
      id: "lastSeen",
      header: t("columns.lastSeen"),
      sortKey: "last_seen_at",
      cell: (user) =>
        user.lastSeenAt ? (
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className={cn(
                "size-2 shrink-0 rounded-full",
                isOnline(user.lastSeenAt, now) ? "bg-success" : "bg-muted-foreground/40",
              )}
            />
            <span
              className={isOnline(user.lastSeenAt, now) ? "text-success" : "text-muted-foreground"}
            >
              {isOnline(user.lastSeenAt, now)
                ? t("presence.online")
                : format.relativeTime(new Date(user.lastSeenAt), now)}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "lastLogin",
      header: t("columns.lastLogin"),
      sortKey: "last_login",
      hideBelow: "lg",
      cell: (user) => (
        <span className="text-muted-foreground">
          {user.lastLogin ? format.relativeTime(new Date(user.lastLogin), now) : "—"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      tableId="account-users"
      columns={columns}
      rows={query.data?.items}
      getRowId={(user) => user.id}
      getRowLabel={(user) => user.fullName || user.email}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <>
          {roleFilter}
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
            label={t("columns.access")}
            value={table.getFilterValues("access")}
            onValueChange={(values) => table.setFilterValues("access", values)}
            options={[
              { value: "superuser", label: t("superuser") },
              { value: "staff", label: t("staff") },
              { value: "novel", label: t("novel") },
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
      onEdit={canUpdate ? edit : undefined}
      onCopy={canCreate ? copy : undefined}
      onDelete={canDelete ? remove : undefined}
      canDeleteRow={(user) => !isSelf(user)}
      canSelectRow={(user) => !isSelf(user)}
      bulkStatus={
        canUpdate
          ? {
              options: [
                { value: "active", label: tStatus("active") },
                { value: "inactive", label: tStatus("inactive") },
              ],
              onChange: (users, value) => bulkSetActive(users, value === "active"),
            }
          : undefined
      }
      onBulkDelete={canDelete ? bulkRemove : undefined}
      aria-label={t("title")}
    />
  );
}
