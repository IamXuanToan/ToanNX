"use client";

import { LogOut } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { ConfirmDialog } from "@/shares/components/common/confirm-dialog/confirm-dialog";
import { DataTable } from "@/shares/components/common/data-table/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table/types";
import { FilterSelect } from "@/shares/components/common/filter-select/filter-select";
import { StatusBadge } from "@/shares/components/common/status-badge/status-badge";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";

import { ADMIN_SESSION_STATUSES, type AdminSession } from "../../types/admin-session.types";
import { useSessionTable } from "./hooks/use-session-table";

/**
 * Bảng phiên của mọi người dùng: chọn dòng + `#` + mã phiên, lọc người dùng/trạng thái (chọn nhiều), cột Thao tác có
 * Thu hồi (hỏi xác nhận), thu hồi hàng loạt các phiên đã chọn.
 *
 * @param props - Quyền thu hồi do view kiểm tra.
 * @returns Bảng quản trị phiên.
 */
export function SessionTable({ canRevoke, canDelete }: { canRevoke: boolean; canDelete: boolean }) {
  const t = useTranslations("auth.sessions");
  const format = useFormatter();
  const state = useSessionTable();
  const { query, table } = state;
  const columns: DataTableColumn<AdminSession>[] = [
    {
      id: "id",
      header: t("columns.id"),
      mobile: "hidden",
      cell: (session) => (
        <span className="text-muted-foreground font-mono text-xs" title={session.id}>
          {session.id.slice(0, 8)}
        </span>
      ),
    },
    {
      id: "user",
      header: t("columns.user"),
      sortKey: "user__email",
      mobile: "title",
      cell: (session) => (
        <div className="max-w-52 min-w-0" title={session.userEmail}>
          <p className="truncate font-medium">{session.userName || session.userEmail}</p>
          {session.userName ? (
            <p className="text-muted-foreground truncate text-xs">{session.userEmail}</p>
          ) : null}
          {session.isCurrent ? (
            <Badge variant="outline" className="mt-1">
              {t("current")}
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      id: "device",
      header: t("columns.device"),
      cell: (session) => (
        <span className="block max-w-40 truncate" title={session.userAgent}>
          {session.userAgent || "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: t("columns.status"),
      cell: (session) => (
        <StatusBadge tone={session.status === "ACTIVE" ? "success" : "neutral"}>
          {t(`statuses.${session.status}`)}
        </StatusBadge>
      ),
    },
    {
      id: "ipAddress",
      header: t("columns.ipAddress"),
      hideBelow: "xl",
      cell: (session) => <span className="font-mono text-xs">{session.ipAddress || "—"}</span>,
    },
    {
      id: "lastUsedAt",
      header: t("columns.lastUsedAt"),
      sortKey: "last_used_at",
      cell: (session) =>
        format.dateTime(new Date(session.lastUsedAt ?? session.createdAt), {
          dateStyle: "short",
          timeStyle: "short",
        }),
    },
    {
      id: "expiresAt",
      header: t("columns.expiresAt"),
      sortKey: "expires_at",
      hideBelow: "lg",
      cell: (session) =>
        format.dateTime(new Date(session.expiresAt), { dateStyle: "short", timeStyle: "short" }),
    },
  ];

  return (
    <>
      <DataTable
        tableId="authentication-admin-sessions"
        columns={columns}
        rows={query.data?.items}
        getRowId={(session) => session.id}
        getRowLabel={(session) => session.userEmail}
        search={{ ...table.search, placeholder: t("searchPlaceholder") }}
        onClearFilters={table.hasFilters ? table.clearFilters : undefined}
        filters={
          <>
            {state.users.isError ? (
              <Button variant="outline" onClick={() => state.users.refetch()}>
                {t("usersRetry")}
              </Button>
            ) : (
              <FilterSelect
                label={t("columns.user")}
                value={table.getFilterValues("user")}
                onValueChange={(values) => table.setFilterValues("user", values)}
                searchable
                disabled={state.users.isPending}
                options={(state.users.data ?? []).map((user) => ({
                  value: user.id,
                  label:
                    [user.lastName, user.firstName].filter(Boolean).join(" ") ||
                    user.username ||
                    user.email,
                  description: [user.email, user.username].filter(Boolean).join(" · "),
                }))}
              />
            )}
            <FilterSelect
              label={t("columns.status")}
              value={table.getFilterValues("status")}
              onValueChange={(values) => table.setFilterValues("status", values)}
              options={ADMIN_SESSION_STATUSES.map((status) => ({
                value: status,
                label: t(`statuses.${status}`),
              }))}
            />
          </>
        }
        ordering={table.ordering}
        onOrderingChange={table.onOrderingChange}
        isLoading={query.isPending}
        isFetching={query.isFetching && !query.isPending}
        error={query.isError ? { onRetry: () => query.refetch() } : null}
        empty={{ title: t("empty") }}
        onReload={state.reload}
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
          canRevoke
            ? [
                {
                  key: "revoke",
                  label: t("revoke"),
                  icon: LogOut,
                  destructive: true,
                  hidden: (session) => !state.canRevokeSession(session),
                  onClick: state.requestRevoke,
                },
              ]
            : undefined
        }
        onDelete={canDelete ? state.remove : undefined}
        canDeleteRow={state.canDeleteSession}
        onBulkDelete={canDelete ? state.bulkDelete : undefined}
        canSelectRow={canDelete ? state.canDeleteSession : state.canRevokeSession}
        bulkActions={
          canRevoke
            ? [
                {
                  key: "revoke",
                  label: t("bulkRevoke"),
                  icon: LogOut,
                  destructive: true,
                  onClick: state.bulkRevoke,
                  confirm: (sessions) => ({
                    title: t("bulkRevokeTitle", { count: sessions.length }),
                    description: t("bulkRevokeDescription", { count: sessions.length }),
                    confirmLabel: t("bulkRevoke"),
                  }),
                },
              ]
            : undefined
        }
        aria-label={t("title")}
      />
      <ConfirmDialog
        open={Boolean(state.pendingSession)}
        onOpenChange={(open) => !open && state.closeRevoke()}
        title={t("revokeTitle")}
        description={t("revokeDescription", { email: state.pendingSession?.userEmail ?? "" })}
        confirmLabel={t("revoke")}
        onConfirm={state.confirmRevoke}
        isPending={state.isRevoking}
      />
    </>
  );
}
