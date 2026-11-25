"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { DONATION_PERMISSIONS } from "@/modules/utilities/permissions/donation-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PortalDonationDashboard } from "../../components/donation/portal-donation-dashboard";

/**
 * View Quản lý Quyên góp trong Client Portal (dành cho người dùng cá nhân).
 */
export function PortalDonationView() {
  if (!usePermission(DONATION_PERMISSIONS.read)) return <ForbiddenView />;
  return <PortalDonationDashboard />;
}
