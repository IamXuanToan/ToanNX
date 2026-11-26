"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { REPORT_PERMISSIONS } from "@/modules/finance/permissions/report-permission";
import { INCOME_PERMISSIONS } from "@/modules/finance/permissions/income-permission";
import { DONATION_PERMISSIONS } from "@/modules/utilities/permissions/donation-permission";
import { PAGE_PERMISSIONS } from "@/modules/utilities/permissions/page-permission";
import { SHORT_LINK_PERMISSIONS } from "@/modules/utilities/permissions/short-link-permission";
import { REMINDER_PERMISSIONS } from "@/modules/workspace/permissions/reminder-permission";
import { WORKSPACE_CALENDAR_PERMISSIONS } from "@/modules/workspace/permissions/workspace-calendar-permission";
import { WORKSPACE_DASHBOARD_PERMISSIONS } from "@/modules/workspace/permissions/workspace-dashboard-permission";

import { PortalDashboard } from "../../components/dashboard/portal-dashboard";

/**
 * View Tổng quan cá nhân trong Client Portal:
 * Hợp nhất không gian làm việc (Workspace), Tài chính, Ủng hộ VietQR và Tiện ích vào một Dashboard duy nhất.
 * View chỉ gọi `usePermission` và truyền cờ quyền xuống `PortalDashboard`.
 *
 * @returns Giao diện Tổng quan Portal.
 */
export function PortalDashboardView() {
  const canReadWorkspaceSummary = usePermission(WORKSPACE_DASHBOARD_PERMISSIONS.read);
  const canReadCalendar = usePermission(WORKSPACE_CALENDAR_PERMISSIONS.read);
  const canCreateReminder = usePermission(REMINDER_PERMISSIONS.create);
  const canUpdateReminder = usePermission(REMINDER_PERMISSIONS.update);
  const canReadFinanceReports = usePermission(REPORT_PERMISSIONS.read);
  const canReadIncomes = usePermission(INCOME_PERMISSIONS.read);
  const canReadPages = usePermission(PAGE_PERMISSIONS.read);
  const canCreatePages = usePermission(PAGE_PERMISSIONS.create);
  const canUpdatePages = usePermission(PAGE_PERMISSIONS.update);
  const canReadShortLinks = usePermission(SHORT_LINK_PERMISSIONS.read);
  const canCreateShortLinks = usePermission(SHORT_LINK_PERMISSIONS.create);
  const canUpdateShortLinks = usePermission(SHORT_LINK_PERMISSIONS.update);
  const canReadDonations = usePermission(DONATION_PERMISSIONS.read);

  return (
    <PortalDashboard
      canReadWorkspaceSummary={canReadWorkspaceSummary}
      canReadCalendar={canReadCalendar}
      canCreateReminder={canCreateReminder}
      canUpdateReminder={canUpdateReminder}
      canReadFinanceReports={canReadFinanceReports}
      canReadIncomes={canReadIncomes}
      canReadPages={canReadPages}
      canCreatePages={canCreatePages}
      canUpdatePages={canUpdatePages}
      canReadShortLinks={canReadShortLinks}
      canCreateShortLinks={canCreateShortLinks}
      canUpdateShortLinks={canUpdateShortLinks}
      canReadDonations={canReadDonations}
    />
  );
}
