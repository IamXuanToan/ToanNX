"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ASSISTANT_PERMISSIONS } from "@/modules/workspace/permissions/assistant-permission";
import { REMINDER_PERMISSIONS } from "@/modules/workspace/permissions/reminder-permission";
import { WORKSPACE_CALENDAR_PERMISSIONS } from "@/modules/workspace/permissions/workspace-calendar-permission";
import { WORKSPACE_DASHBOARD_PERMISSIONS } from "@/modules/workspace/permissions/workspace-dashboard-permission";

import { PortalDashboard } from "../../components/dashboard/portal-dashboard";

/**
 * View Tổng quan cá nhân trong Client Portal:
 * Chỉ gọi `usePermission` và truyền cờ quyền Workspace xuống `PortalDashboard`.
 *
 * @returns Giao diện Tổng quan Portal.
 */
export function PortalDashboardView() {
  const canReadWorkspaceSummary = usePermission(WORKSPACE_DASHBOARD_PERMISSIONS.read);
  const canReadCalendar = usePermission(WORKSPACE_CALENDAR_PERMISSIONS.read);
  const canCreateReminder = usePermission(REMINDER_PERMISSIONS.create);
  const canUpdateReminder = usePermission(REMINDER_PERMISSIONS.update);
  const canUseAssistant = usePermission(ASSISTANT_PERMISSIONS.chat);

  return (
    <PortalDashboard
      canReadWorkspaceSummary={canReadWorkspaceSummary}
      canReadCalendar={canReadCalendar}
      canCreateReminder={canCreateReminder}
      canUpdateReminder={canUpdateReminder}
      canUseAssistant={canUseAssistant}
    />
  );
}
