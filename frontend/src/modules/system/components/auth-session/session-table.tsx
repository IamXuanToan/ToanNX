"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { ConfirmDialog } from "@/shares/components/common/confirm-dialog";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { StatusBadge } from "@/shares/components/common/status-badge";
import { TimestampText } from "@/shares/components/common/timestamp-text";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { formatUserDisplayName, formatUserDisplayTooltip } from "@/shares/lib/user-display";

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
  const t = useTranslations("system.auth.sessions");
  const state = useSessionTable();
  const { query, table } = state;
  const columns: DataTableColumn<AdminSession>[] = [
    {
      id: "id",
      header: t("columns.id"),
      mobile: "hidden",
      cell: (session) => (
        <AppTooltip content={session.id}>
          <span className="text-muted-foreground font-mono text-xs">{session.id.slice(0, 8)}</span>
        </AppTooltip>
      ),
    },
    {
      id: "user",
      header: t("columns.user"),
      sortKey: "user__email",
      mobile: "title",
      cell: (session) => {
        const userInfo = {
          fullName: session.userName,
          username: session.userUsername,
          email: session.userEmail,
        };
        const displayName = formatUserDisplayName(userInfo);
        return (
          <AppTooltip content={formatUserDisplayTooltip(userInfo)}>
            <div className="max-w-52 min-w-0">
              <p className="truncate font-medium">{displayName}</p>
              {session.userEmail && session.userEmail !== displayName ? (
                <p className="text-muted-foreground truncate text-xs">{session.userEmail}</p>
              ) : null}
              {session.isCurrent ? (
                <Badge variant="outline" className="mt-1">
                  {t("current")}
                </Badge>
              ) : null}
            </div>
          </AppTooltip>
        );
      },
    },
    {
      id: "device",
      header: t("columns.device"),
      cell: (session) => (
        <AppTooltip content={session.userAgent}>
          <span className="block max-w-40 truncate">{session.userAgent || "—"}</span>
        </AppTooltip>
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
      cell: (session) => <TimestampText value={session.lastUsedAt ?? session.createdAt} />,
    },
    {
      id: "expiresAt",
      header: t("columns.expiresAt"),
      sortKey: "expires_at",
      hideBelow: "lg",
      cell: (session) => <TimestampText value={session.expiresAt} />,
    },
  ];

  return (
    <>
      <DataTable
        tableId="authentication-admin-sessions"
        columns={columns}
        rows={query.data?.items}
        getRowId={(session) => session.id}
        getRowLabel={(session) =>
          formatUserDisplayName({
            fullName: session.userName,
            username: session.userUsername,
            email: session.userEmail,
          }) || session.userEmail
        }
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
                  label: formatUserDisplayName(user),
                  description: user.email || undefined,
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
        onDelete={state.remove}
        can={{ delete: canDelete }}
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
