"use client";

import { cn } from "cn";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { useNow, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { TableStatusSwitch } from "@/shares/components/common/table-status-switch";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { TimestampText } from "@/shares/components/common/timestamp-text";
import { ICON_PATHS } from "@/shares/lib/asset-paths";
import { Badge } from "@/shares/components/ui/badge";
import { isOnline } from "@/shares/lib/presence";
import { formatUserDisplayName } from "@/shares/lib/user-display";

import { SYSTEM_ROUTES } from "../../constants/routes";
import type { User } from "../../types/user.types";
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
  const t = useTranslations("system.account.users");
  const tStatus = useTranslations("common.status");
  const now = useNow({ updateInterval: 60_000 });
  const { query, table, isSelf, view, edit, copy, setActive, remove, bulkSetActive, bulkDelete } =
    useUserTable();

  const columns: DataTableColumn<User>[] = [
    {
      id: "user",
      header: t("columns.user"),
      sortKey: "email",
      mobile: "title",
      className: "md:w-full",
      cell: (user) => {
        const google = user.socialAccounts?.find((s) => s.provider === "google");
        const github = user.socialAccounts?.find((s) => s.provider === "github");
        const displayName = formatUserDisplayName(user);

        return (
          <div className="min-w-0">
            <Link
              href={SYSTEM_ROUTES.userDetail(user.id)}
              className="hover:text-primary block truncate font-medium underline-offset-4 hover:underline"
            >
              {displayName}
            </Link>
            <div className="flex items-center gap-1.5">
              {user.email && user.email !== displayName ? (
                <p className="text-muted-foreground truncate text-xs">{user.email}</p>
              ) : null}
              {user.isVerified ? (
                <AppTooltip content={t("fields.emailVerifiedTrue")}>
                  <span className="inline-flex text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3 shrink-0" />
                  </span>
                </AppTooltip>
              ) : null}
              {google ? (
                <AppTooltip content={`Google: ${google.email || google.displayName}`}>
                  <span className="inline-flex">
                    <Image src={ICON_PATHS.google} alt="Google" width={12} height={12} />
                  </span>
                </AppTooltip>
              ) : null}
              {github ? (
                <AppTooltip content={`GitHub: ${github.email || github.displayName}`}>
                  <span className="inline-flex">
                    <Image
                      src={ICON_PATHS.github}
                      alt="GitHub"
                      width={12}
                      height={12}
                      className="dark:invert"
                    />
                  </span>
                </AppTooltip>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      id: "verification",
      header: t("columns.verification"),
      cell: (user) => {
        const google = user.socialAccounts?.find((s) => s.provider === "google");
        const github = user.socialAccounts?.find((s) => s.provider === "github");

        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {user.isVerified ? (
              <AppTooltip content={t("fields.emailVerifiedTrue")}>
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-[10px] text-emerald-700 dark:text-emerald-400"
                >
                  <CheckCircle2 className="size-2.5" />
                  <span>Email</span>
                </Badge>
              </AppTooltip>
            ) : null}
            {google ? (
              <AppTooltip content={`Google: ${google.email || google.displayName}`}>
                <span className="bg-muted/50 border-border/60 inline-flex size-5 items-center justify-center rounded-md border">
                  <Image src={ICON_PATHS.google} alt="Google" width={14} height={14} />
                </span>
              </AppTooltip>
            ) : null}
            {github ? (
              <AppTooltip content={`GitHub: ${github.email || github.displayName}`}>
                <span className="bg-muted/50 border-border/60 inline-flex size-5 items-center justify-center rounded-md border">
                  <Image
                    src={ICON_PATHS.github}
                    alt="GitHub"
                    width={14}
                    height={14}
                    className="dark:invert"
                  />
                </span>
              </AppTooltip>
            ) : null}
            {!user.isVerified && !google && !github ? (
              <span className="text-muted-foreground text-xs">—</span>
            ) : null}
          </div>
        );
      },
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
            <TimestampText
              value={user.lastSeenAt}
              statusLabel={isOnline(user.lastSeenAt, now) ? t("presence.online") : undefined}
              className={isOnline(user.lastSeenAt, now) ? "text-success" : "text-muted-foreground"}
              relativeClassName={
                isOnline(user.lastSeenAt, now) ? "text-success font-medium" : undefined
              }
            />
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
          <TimestampText value={user.lastLogin} />
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
      getRowLabel={(user) => formatUserDisplayName(user) || user.email}
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
      onView={view}
      onEdit={edit}
      onCopy={copy}
      onDelete={remove}
      can={{ update: canUpdate, create: canCreate, delete: canDelete }}
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
      onBulkDelete={canDelete ? bulkDelete : undefined}
      aria-label={t("title")}
    />
  );
}
