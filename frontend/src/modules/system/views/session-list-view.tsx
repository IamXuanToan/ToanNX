"use client";

import { useTranslations } from "next-intl";

import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PermissionGate } from "../components/permission-gate";
import { SessionTable } from "../components/session-table";
import { SESSION_PERMISSIONS } from "../permissions/session-permission";
import { usePermission } from "../hooks/use-permission";

/** @returns Trang danh sách phiên toàn hệ thống, tách quyền đọc và thu hồi. */
export function SessionListView() {
  const t = useTranslations("system.auth.sessions");
  const canDelete = usePermission(SESSION_PERMISSIONS.sessionDelete);
  const canRevoke = usePermission(SESSION_PERMISSIONS.sessionRevoke);
  return (
    <PermissionGate permission={SESSION_PERMISSIONS.sessionRead} fallback={<ForbiddenView />}>
      <div className="space-y-6">
        <PageHeader title={t("title")} />
        <SessionTable canRevoke={canRevoke} canDelete={canDelete} />
      </div>
    </PermissionGate>
  );
}
