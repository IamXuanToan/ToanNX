"use client";

import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { usePermission } from "@/modules/system/hooks/use-permission";

import { UtilitiesDashboard } from "../../components/utilities-dashboard/utilities-dashboard";
import { DONATION_PERMISSIONS } from "../../permissions/donation-permission";
import { PAGE_PATH_PERMISSIONS } from "../../permissions/page-path-permission";
import { PAGE_PERMISSIONS } from "../../permissions/page-permission";
import { QR_CODE_PERMISSIONS } from "../../permissions/qr-code-permission";
import { SHORT_LINK_PERMISSIONS } from "../../permissions/short-link-permission";

/**
 * View Dashboard trung tâm của module Tiện ích trong khu vực Quản trị Admin.
 */
export function UtilitiesDashboardView() {
  const canReadPages = usePermission(PAGE_PERMISSIONS.read);
  const canReadShortLinks = usePermission(SHORT_LINK_PERMISSIONS.read);
  const canReadQrCodes = usePermission(QR_CODE_PERMISSIONS.read);
  const canReadDonations = usePermission(DONATION_PERMISSIONS.read);
  const canReadPagePaths = usePermission(PAGE_PATH_PERMISSIONS.read);

  if (
    !canReadPages &&
    !canReadShortLinks &&
    !canReadQrCodes &&
    !canReadDonations &&
    !canReadPagePaths
  ) {
    return <ForbiddenView />;
  }

  return (
    <div className="space-y-6">
      <UtilitiesDashboard />
    </div>
  );
}
