"use client";

import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { usePermission } from "@/modules/system/hooks/use-permission";

import { UtilitiesDashboard } from "../../components/utilities-dashboard/utilities-dashboard";
import { PAGE_PERMISSIONS } from "../../permissions/page-permission";

/**
 * View Dashboard trung tâm của module Tiện ích trong khu vực Quản trị Admin.
 */
export function UtilitiesDashboardView() {
  const canRead = usePermission(PAGE_PERMISSIONS.read);

  if (!canRead) {
    return <ForbiddenView />;
  }

  return (
    <div className="space-y-6">
      <UtilitiesDashboard />
    </div>
  );
}
