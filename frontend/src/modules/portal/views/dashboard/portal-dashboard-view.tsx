"use client";

import { PortalDashboard } from "../../components/dashboard/portal-dashboard";

/**
 * View Tổng quan cá nhân trong Client Portal:
 * Chỉ gọi useTranslations và ghép component theo rule frontend §2.
 *
 * @returns Giao diện view.
 */
export function PortalDashboardView() {
  return <PortalDashboard />;
}
