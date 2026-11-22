"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { FinanceDashboard } from "../../components/dashboard/finance-dashboard";
import { REPORT_PERMISSIONS } from "../../permissions/report-permission";

/** Trang tổng quan tài chính. */
export function FinanceDashboardView() {
  if (!usePermission(REPORT_PERMISSIONS.read)) return <ForbiddenView />;
  return <FinanceDashboard />;
}
