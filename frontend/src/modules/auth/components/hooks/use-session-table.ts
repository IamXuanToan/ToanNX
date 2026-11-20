"use client";

import { useState } from "react";

import { pickAllowedValues, useTableState } from "@/shares/hooks/use-table-state";

import { useAdminSessions, useDeleteAdminSessions, useBulkRevokeAdminSessions, useRevokeAdminSession } from "../../hooks/use-admin-sessions";
import { useCurrentUser } from "../../hooks/use-current-user";
import { useAdminSessionUsers } from "../../hooks/use-admin-session-users";
import { ADMIN_SESSION_STATUSES, type AdminSession } from "../../types/admin-session.types";

/**
 * State bảng phiên: tìm/lọc người dùng và trạng thái (chọn nhiều)/sắp xếp/phân trang đồng bộ URL, thu hồi một phiên
 * (hỏi xác nhận) và thu hồi hàng loạt. Chỉ phiên đang hoạt động, không phải phiên hiện tại và
 * (với staff) không phải của superuser mới thu hồi/chọn được.
 *
 * @returns Truy vấn, state bảng và handler thu hồi.
 */
export function useSessionTable() {
  const table = useTableState({ ordering: "-created_at", filterKeys: ["status", "user"] });
  const users = useAdminSessionUsers();
  const query = useAdminSessions({
    ...table.filters,
    status: pickAllowedValues(table.getFilterValues("status"), ADMIN_SESSION_STATUSES),
    user: table.getFilterValues("user"),
  });
  const { data: current } = useCurrentUser();
  const remove = useDeleteAdminSessions();
  const mutation = useRevokeAdminSession();
  const bulkMutation = useBulkRevokeAdminSessions();
  const [pendingSession, setPendingSession] = useState<AdminSession | null>(null);

  const confirmRevoke = () => {
    if (!pendingSession) return;
    mutation.mutate(pendingSession.id, { onSuccess: () => setPendingSession(null) });
  };

  return {
    remove: (session: AdminSession) => remove.mutateAsync([session.id]),
    bulkDelete: (sessions: AdminSession[]) =>
      remove.mutateAsync(sessions.map((session) => session.id)),
    canDeleteSession: (session: AdminSession) =>
      !session.isCurrent && (!session.userIsSuperuser || Boolean(current?.user.isSuperuser)),
    query,
    users,
    reload: () => Promise.all([query.refetch(), users.refetch()]),
    table,
    pendingSession,
    isRevoking: mutation.isPending,
    requestRevoke: setPendingSession,
    closeRevoke: () => setPendingSession(null),
    confirmRevoke,
    bulkRevoke: (sessions: AdminSession[]) =>
      bulkMutation.mutateAsync(sessions.map((session) => session.id)),
    canRevokeSession: (session: AdminSession) =>
      session.status === "ACTIVE" &&
      !session.isCurrent &&
      (!session.userIsSuperuser || Boolean(current?.user.isSuperuser)),
  };
}
