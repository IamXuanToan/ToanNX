"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { FinanceReport } from "../components/finance-report";
import { REPORT_PERMISSIONS } from "../permissions/report-permission";

/** Trang báo cáo năm/tháng. */
export function FinanceReportView() {
  if (!usePermission(REPORT_PERMISSIONS.read)) return <ForbiddenView />;
  return <FinanceReport />;
}
